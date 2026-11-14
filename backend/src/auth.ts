import {
  randomBytes,
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import * as argon2 from "argon2";
import type { Request, Response } from "express";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { ApiError } from "./errors";
import { parse, uuid } from "./validation";
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const equal = (a: string, b: string) => {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
export const passwordOptions = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};
const cookieName = "__Host-finai_session";
const denied = () =>
  new ApiError(401, "UNAUTHENTICATED", "Sign-in failed or session expired.");
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
  { timeoutDuration: 5000 },
);
export async function googleEmail(
  credential: string,
  clientId: string,
  nonce: string,
  keys: JWTVerifyGetKey = googleKeys,
) {
  const { payload } = await jwtVerify(credential, keys, {
    algorithms: ["RS256"],
    audience: clientId,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    requiredClaims: ["sub", "iat", "exp", "email", "nonce"],
    maxTokenAge: "10m",
  });
  // Google must be authoritative for the email, not just have verified it once.
  if (
    payload.email_verified !== true ||
    typeof payload.email !== "string" ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    payload.nonce !== nonce ||
    payload.aud !== clientId ||
    (payload.azp !== undefined && payload.azp !== clientId) ||
    (!payload.email.toLowerCase().endsWith("@gmail.com") &&
      (typeof payload.hd !== "string" || !payload.hd))
  )
    throw denied();
  return payload.email.toLowerCase();
}
const googleCookie = "__Host-finai_google";
const organisationIdentifier = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .transform((value) => value.toLowerCase())
  .refine(
    (value) =>
      uuid.safeParse(value).success || /^[a-z][a-z0-9-]{2,63}$/.test(value),
    "Enter a valid organisation UUID or organisation code.",
  );
export class Auth {
  constructor(
    private db: PrismaClient,
    private env: NodeJS.ProcessEnv = process.env,
  ) {}
  googleChallenge(res: Response) {
    const clientId = this.env.GOOGLE_CLIENT_ID;
    if (!clientId || (this.env.GOOGLE_NONCE_SECRET || "").length < 32) {
      res.json({ enabled: false });
      return;
    }
    const nonce = randomBytes(32).toString("hex");
    const proof = `${nonce}.${Date.now()}`;
    const signature = createHmac("sha256", this.env.GOOGLE_NONCE_SECRET!)
      .update(proof)
      .digest("hex");
    res.setHeader(
      "Set-Cookie",
      `${googleCookie}=${proof}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=600`,
    );
    res.json({ enabled: true, clientId, nonce });
  }
  async googleLogin(req: Request, res: Response) {
    const input = parse(
      z.strictObject({
        credential: z.string().min(1).max(12000),
        organisationId: organisationIdentifier,
      }),
      req.body,
    );
    await this.limit(
      `login-ip:${req.headers["x-finai-client-ip"] || "unknown"}`,
      30,
      900,
    );
    if (
      !this.env.GOOGLE_CLIENT_ID ||
      (this.env.GOOGLE_NONCE_SECRET || "").length < 32
    )
      throw new ApiError(
        503,
        "UNAVAILABLE",
        "Google sign-in is not configured.",
      );
    const value =
      req.headers.cookie
        ?.split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(googleCookie + "="))
        ?.slice(googleCookie.length + 1) || "";
    const [nonce, timestamp, signature] = value.split(".");
    const age = Date.now() - Number(timestamp);
    if (
      !/^[a-f0-9]{64}$/.test(nonce || "") ||
      !signature ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > 600000 ||
      !equal(
        signature,
        createHmac("sha256", this.env.GOOGLE_NONCE_SECRET!)
          .update(`${nonce}.${timestamp}`)
          .digest("hex"),
      )
    )
      throw denied();
    let email: string;
    try {
      email = await googleEmail(
        input.credential,
        this.env.GOOGLE_CLIENT_ID,
        nonce,
      );
    } catch {
      throw denied();
    }
    await this.limit(`login-account:${email}`, 10, 900);
    const account = await this.db.account.findUnique({
      where: { username: email },
    });
    if (!account || account.disabled) throw denied();
    const organisationId = await this.resolveOrganisationId(input.organisationId);
    await this.issueSession(req, res, account, organisationId, true);
  }
  async limit(key: string, maximum: number, seconds: number) {
    const hash = digest(key),
      window = new Date(
        Math.floor(Date.now() / (seconds * 1000)) * seconds * 1000,
      );
    const rows = await this.db.$queryRaw<
      { count: number }[]
    >`INSERT INTO "RateLimit" (key, "window", count) VALUES (${hash},${window},1) ON CONFLICT (key) DO UPDATE SET count=CASE WHEN "RateLimit"."window"=EXCLUDED."window" THEN "RateLimit".count+1 ELSE 1 END, "window"=EXCLUDED."window" RETURNING count`;
    if (rows[0].count > maximum)
      throw new ApiError(
        429,
        "RATE_LIMITED",
        "Too many requests. Try again later.",
      );
  }
  token(req: Request) {
    return (
      req.headers.cookie
        ?.split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(cookieName + "="))
        ?.slice(cookieName.length + 1) || ""
    );
  }
  cookie(res: Response, token: string, maxAge = 28800) {
    res.setHeader(
      "Set-Cookie",
      `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`,
    );
  }
  async session(req: Request) {
    const token = this.token(req);
    if (!/^[a-f0-9]{64}$/.test(token)) throw denied();
    const session = await this.db.session.findUnique({
      where: { tokenHash: digest(token) },
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) throw denied();
    const account = await this.db.account.findUnique({
      where: { userId: session.userId },
    });
    const member = await this.db.membership.findUnique({
      where: {
        organisationId_userId: {
          organisationId: session.organisationId,
          userId: session.userId,
        },
      },
    });
    if (!account || account.disabled || !member?.active) throw denied();
    await this.paidAccess(this.db, session.organisationId, 401);
    return session;
  }
  async login(req: Request, res: Response) {
    const input = parse(
      z.strictObject({
        username: z.string().min(1).max(100),
        password: z.string().min(1).max(1024),
        organisationId: organisationIdentifier,
      }),
      req.body,
    );
    await this.limit(
      `login-ip:${req.headers["x-finai-client-ip"] || "unknown"}`,
      30,
      900,
    );
    await this.limit(`login-account:${input.username.toLowerCase()}`, 10, 900);
    const account = await this.db.account.findUnique({
      where: { username: input.username.toLowerCase() },
    });
    // Always pay the Argon2 cost, including unknown accounts.
    const valid = account
      ? await argon2.verify(account.passwordHash, input.password)
      : (await argon2.hash(input.password, passwordOptions), false);
    if (!valid || !account || account.disabled) throw denied();
    const organisationId = await this.resolveOrganisationId(input.organisationId);
    await this.issueSession(req, res, account, organisationId);
  }
  private async resolveOrganisationId(identifier: string) {
    const isUuid = uuid.safeParse(identifier).success;
    const organisation = isUuid
      ? await this.db.organisation.findUnique({
          where: { id: identifier },
          select: { id: true },
        })
      : await this.db.organisation.findUnique({
          where: { code: identifier },
          select: { id: true },
        });
    if (!organisation) throw denied();
    return organisation.id;
  }
  private async paidAccess(
    db: Pick<PrismaClient, "organisation">,
    organisationId: string,
    status: 401 | 403,
  ) {
    const organisation = await db.organisation.findUnique({
      where: { id: organisationId },
      select: { paidAccessUntil: true },
    });
    if (
      !organisation?.paidAccessUntil ||
      organisation.paidAccessUntil.getTime() <= Date.now()
    )
      throw new ApiError(
        status,
        "PAID_ACCESS_REQUIRED",
        "An active paid subscription is required. Contact your administrator to activate or renew access.",
      );
  }
  private async issueSession(
    req: Request,
    res: Response,
    account: { userId: string; passwordHash: string },
    organisationId: string,
    clearGoogle = false,
  ) {
    const member = await this.db.membership.findUnique({
      where: {
        organisationId_userId: {
          organisationId: organisationId,
          userId: account.userId,
        },
      },
    });
    if (!member?.active) throw denied();
    const token = randomBytes(32).toString("hex");
    // Derive token only for its owner; store a digest and return through same-origin JSON.
    const csrf = digest(`csrf:${token}`);
    await this.db.$transaction(async (tx) => {
      // Serialize against administrative password reset/disable updates. If reset
      // won while Argon2 was verifying, the old proof must not create a session.
      const current = await tx.$queryRaw<
        { passwordHash: string; disabled: boolean }[]
      >`SELECT "passwordHash", disabled FROM "Account" WHERE "userId"=${account.userId}::uuid FOR SHARE`;
      if (
        !current[0] ||
        current[0].disabled ||
        current[0].passwordHash !== account.passwordHash
      )
        throw denied();
      // Serialize issuance against the operator's paid-access update/revocation.
      await tx.$queryRaw`SELECT id FROM "Organisation" WHERE id=${organisationId}::uuid FOR SHARE`;
      await this.paidAccess(tx, organisationId, 403);
      await tx.session.deleteMany({
        where: { tokenHash: digest(this.token(req)) },
      });
      await tx.session.create({
        data: {
          tokenHash: digest(token),
          userId: account.userId,
          organisationId: organisationId,
          csrfHash: digest(csrf),
          expiresAt: new Date(Date.now() + 8 * 3600000),
        },
      });
    });
    this.cookie(res, token);
    if (clearGoogle)
      res.setHeader("Set-Cookie", [
        res.getHeader("Set-Cookie") as string,
        `${googleCookie}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
      ]);
    res.json({ csrfToken: csrf });
  }
  csrf(req: Request, session: { csrfHash: string }) {
    const value = req.headers["x-csrf-token"];
    if (typeof value !== "string" || !equal(digest(value), session.csrfHash))
      throw new ApiError(403, "FORBIDDEN", "Invalid CSRF token.");
  }
  async logout(req: Request, res: Response) {
    await this.db.session.deleteMany({
      where: { tokenHash: digest(this.token(req)) },
    });
    this.cookie(res, "", 0);
    res.json({ status: "signed-out" });
  }
}
