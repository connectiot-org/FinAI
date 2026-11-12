import { useEffect, useRef, useState } from "react";
import { z } from "zod";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        nonce: string;
        auto_select: boolean;
        callback: (result: { credential: string }) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: { type: string; theme: string; size: string; text: string },
      ) => void;
      cancel: () => void;
    };
  };
};
const challenge = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(false) }),
  z.object({
    enabled: z.literal(true),
    clientId: z.string().min(1),
    nonce: z.string().regex(/^[a-f0-9]{64}$/),
  }),
]);
let scriptReady: Promise<void> | undefined;
function loadGoogle() {
  if (!scriptReady)
    scriptReady = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      const timeout = window.setTimeout(() => {
        script.remove();
        scriptReady = undefined;
        reject(
          new Error("Google sign-in took too long to load. Try again later."),
        );
      }, 10000);
      script.onload = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      script.onerror = () => {
        window.clearTimeout(timeout);
        script.remove();
        scriptReady = undefined;
        reject(new Error("Google sign-in could not load. Try again later."));
      };
      document.head.appendChild(script);
    });
  return scriptReady;
}
export function GoogleSignIn({
  onCredential,
  busy,
}: {
  onCredential: (credential: string) => Promise<void>;
  busy: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const busyRef = useRef(busy);
  callback.current = onCredential;
  busyRef.current = busy;
  const [message, setMessage] = useState("Loading Google sign-in…");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let google: GoogleIdentity | undefined;
    (async () => {
      try {
        const response = await fetch("/auth/google/challenge", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
        });
        if (!response.ok)
          throw new Error(
            "Google sign-in is unavailable. Use email and password or try again later.",
          );
        const config = challenge.parse(await response.json());
        if (!active) return;
        if (!config.enabled) {
          setMessage("Google sign-in is not configured yet.");
          return;
        }
        await loadGoogle();
        if (!active || !container.current) return;
        google = (window as Window & { google?: GoogleIdentity }).google;
        if (!google) throw new Error("Google sign-in could not load.");
        google.accounts.id.initialize({
          client_id: config.clientId,
          nonce: config.nonce,
          auto_select: false,
          callback: (result) => {
            if (active && !busyRef.current)
              void callback.current(result.credential);
          },
        });
        google.accounts.id.renderButton(container.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
        });
        setReady(true);
        setMessage("");
      } catch (error) {
        if (active)
          setMessage(
            error instanceof Error && !(error instanceof z.ZodError)
              ? error.message
              : "Google sign-in is unavailable. Try again later.",
          );
      }
    })();
    return () => {
      active = false;
      controller.abort();
      google?.accounts.id.cancel();
    };
  }, []);
  return (
    <div className="google-sign-in">
      <div ref={container} inert={busy} />
      {!ready && (
        <button type="button" disabled>
          Continue with Google
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
