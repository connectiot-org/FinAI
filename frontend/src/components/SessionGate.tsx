import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { GoogleSignIn } from "./GoogleSignIn";
import { Field } from "./ui";
import { sessionEnabled } from "../lib/api";
import {
  readSession,
  signInFailure,
  paidAccessMessage,
  sessionSchema,
  logoutSchema,
  authenticateSession,
  expireSession,
} from "../lib/session";
const Authenticated = createContext(false);
type Props = {
  children: ReactNode;
  title?: string;
  headingLevel?: 1 | 2;
  requireSession?: boolean;
};
export function SessionGate(props: Props) {
  const inherited = useContext(Authenticated);
  return inherited ? <>{props.children}</> : <OwnedSessionGate {...props} />;
}
function OwnedSessionGate({
  children,
  title = "Sign in to your checklist",
  headingLevel = 1,
  requireSession = false,
}: Props) {
  const sessionRequired = requireSession || sessionEnabled;
  const [organisationId, setOrganisationId] = useState("");
  const Heading = headingLevel === 2 ? "h2" : "h1";
  const [authenticated, setAuthenticated] = useState(!sessionRequired),
    [checking, setChecking] = useState(sessionRequired),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const expired = () => {
      setAuthenticated(false);
      setError("Session expired. Sign in again.");
    };
    window.addEventListener("finai-session-expired", expired);
    return () => window.removeEventListener("finai-session-expired", expired);
  }, []);
  useEffect(() => {
    if (!sessionRequired) return;
    const c = new AbortController();
    let active = true;
    setChecking(true);
    setError("");
    readSession(c.signal)
      .then(() => {
        if (active) setAuthenticated(true);
      })
      .catch((e) => {
        if (active) {
          setAuthenticated(false);
          if (e?.status !== 401 || e?.code === "PAID_ACCESS_REQUIRED")
            setError(
              e instanceof Error ? e.message : "Cannot reach sign-in service.",
            );
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
      c.abort();
    };
  }, [retry, sessionRequired]);
  if (checking) return <p role="status">Checking session…</p>;
  if (!authenticated)
    return (
      <section className="panel">
        <Heading>{title}</Heading>
        <p>
          For paid customers with active access. Your administrator provides
          your account after payment is confirmed.
        </p>
        {error && <p role="alert">{error}</p>}
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const form = event.currentTarget,
              fields = new FormData(form);
            setBusy(true);
            setError("");
            try {
              const r = await fetch("/auth/login", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username: fields.get("username"),
                  password: fields.get("password"),
                  organisationId: fields.get("organisationId"),
                }),
                signal: AbortSignal.timeout(10000),
              });
              if (!r.ok) throw new Error(await signInFailure(r));
              if (!sessionSchema.safeParse(await r.json()).success)
                throw new Error(
                  "Sign-in service returned an invalid response.",
                );
              form.reset();
              authenticateSession();
              setAuthenticated(true);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Sign-in failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Email or account name">
            <input
              name="username"
              autoComplete="username"
              required
              maxLength={100}
            />
          </Field>
          <Field label="Organisation ID">
            <input
              name="organisationId"
              required
              autoComplete="off"
              maxLength={64}
              placeholder="e.g. finai897987897987"
              value={organisationId}
              onChange={(e) => setOrganisationId(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={1024}
            />
          </Field>
          <p>Enter your organisation code or the UUID supplied by your administrator.</p>
          <p>Use your FinAI password, not your Google password.</p>
          <button className="primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p>Or continue with your Google account.</p>
        <GoogleSignIn
          busy={busy}
          onCredential={async (credential) => {
            if (busy) return;
            if (
              !/^(?:[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}|[a-z][a-z0-9-]{2,63})$/i.test(
                organisationId.trim(),
              )
            ) {
              setError(
                "Enter the organisation ID provided by your administrator before signing in with Google.",
              );
              return;
            }
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/auth/google", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential, organisationId }),
                signal: AbortSignal.timeout(10000),
              });
              if (!response.ok) {
                const failure = await signInFailure(response);
                throw new Error(
                  failure === paidAccessMessage
                    ? failure
                    : "Google sign-in failed. Your administrator must grant this Google email access to the organisation.",
                );
              }
              if (!sessionSchema.safeParse(await response.json()).success)
                throw new Error(
                  "Sign-in service returned an invalid response.",
                );
              authenticateSession();
              setAuthenticated(true);
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Google sign-in failed.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => setRetry((v) => v + 1)}
        >
          Check session again
        </button>
      </section>
    );
  return (
    <Authenticated.Provider value={true}>
      {sessionRequired && (
        <div className="session-actions">
          <button
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              setError("");
              try {
                let session;
                try {
                  session = await readSession();
                } catch (e) {
                  if ((e as { status?: number }).status === 401) {
                    expireSession();
                    setAuthenticated(false);
                    return;
                  }
                  throw e;
                }
                const r = await fetch("/auth/logout", {
                  method: "POST",
                  credentials: "same-origin",
                  headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": session.csrfToken,
                  },
                  body: "{}",
                  signal: AbortSignal.timeout(10000),
                });
                if (!r.ok || !logoutSchema.safeParse(await r.json()).success)
                  throw new Error("Sign out failed. Try again.");
                expireSession();
                setError("");
                setAuthenticated(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Sign out failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Sign out
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
      {children}
    </Authenticated.Provider>
  );
}
