import { createRemoteJWKSet, jwtVerify } from "jose";
import type { FastifyRequest } from "fastify";
import type { AppEnv } from "../env.js";
import { GATEWAY_AUTH_JWT_ISSUER, getGatewayJwtSecret } from "./gateway-auth.js";

export type AuthContext = {
  userId: string;
  email?: string;
  provider: "supabase-jwt" | "dev-bypass" | "gateway-local";
  token: string;
};

const getBearerToken = (authorizationHeader: unknown) => {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const [scheme, value] = authorizationHeader.split(" ");
  if (!scheme || !value || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return value.trim();
};

const parseDevBypassToken = (token: string) => {
  if (!token.startsWith("dev:")) {
    return null;
  }

  const [, userId, email] = token.split(":");
  if (!userId) {
    return null;
  }

  return {
    userId,
    email: email || undefined,
    provider: "dev-bypass",
    token,
  } satisfies AuthContext;
};

let jwksCache:
  | {
      url: string;
      resolver: ReturnType<typeof createRemoteJWKSet>;
    }
  | undefined;

const getJwksResolver = (jwksUrl: string) => {
  if (jwksCache?.url === jwksUrl) {
    return jwksCache.resolver;
  }

  jwksCache = {
    url: jwksUrl,
    resolver: createRemoteJWKSet(new URL(jwksUrl)),
  };

  return jwksCache.resolver;
};

export const resolveAuthContext = async (env: AppEnv, request: FastifyRequest): Promise<AuthContext | null> => {
  const token = getBearerToken(request.headers.authorization);
  if (!token) {
    return null;
  }

  if (env.authDevBypassEnabled) {
    const devContext = parseDevBypassToken(token);
    if (devContext) {
      return devContext;
    }
  }

  try {
    const localVerification = await jwtVerify(token, getGatewayJwtSecret(env), {
      issuer: GATEWAY_AUTH_JWT_ISSUER,
    });
    const localUserId = typeof localVerification.payload.sub === "string" ? localVerification.payload.sub : undefined;
    if (localUserId) {
      return {
        userId: localUserId,
        email: typeof localVerification.payload.email === "string" ? localVerification.payload.email : undefined,
        provider: "gateway-local",
        token,
      };
    }
  } catch {
    // Continue to Supabase verification.
  }

  if (!env.supabaseJwksUrl) {
    throw new Error("Supabase JWKS URL is not configured.");
  }

  const verification = await jwtVerify(token, getJwksResolver(env.supabaseJwksUrl), {
    issuer: env.supabaseJwtIssuer,
  });

  const userId = typeof verification.payload.sub === "string" ? verification.payload.sub : undefined;
  if (!userId) {
    throw new Error("JWT payload did not include a usable subject.");
  }

  return {
    userId,
    email: typeof verification.payload.email === "string" ? verification.payload.email : undefined,
    provider: "supabase-jwt",
    token,
  };
};
