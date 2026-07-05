import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT } from "jose";
import type { AppEnv } from "../env.js";

const HASH_KEY_LENGTH = 64;
const JWT_ISSUER = "mindanchor-gateway-auth";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const secretEncoder = new TextEncoder();

const resolveJwtSecret = (env: AppEnv) => secretEncoder.encode(env.authJwtSecret ?? "mindanchor-local-auth-dev-secret");

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, HASH_KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, passwordHash: string) => {
  const [salt, expectedHash] = passwordHash.split(":");
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, HASH_KEY_LENGTH);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedBuffer);
};

export const signGatewayAccessToken = async ({
  env,
  userId,
  email,
}: {
  env: AppEnv;
  userId: string;
  email: string;
}) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ email, provider: "gateway-local" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(resolveJwtSecret(env));

  return {
    accessToken: token,
    expiresAt: expiresAt.toISOString(),
  };
};

export const hashGatewayRefreshToken = (refreshToken: string) => createHash("sha256").update(refreshToken).digest("hex");

export const createGatewayRefreshToken = () => {
  const refreshToken = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

  return {
    refreshToken,
    tokenHash: hashGatewayRefreshToken(refreshToken),
    expiresAt,
  };
};

export const getGatewayJwtSecret = (env: AppEnv) => resolveJwtSecret(env);
export const GATEWAY_AUTH_JWT_ISSUER = JWT_ISSUER;
