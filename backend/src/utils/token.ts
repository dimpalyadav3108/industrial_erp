import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";

type TokenLifetime = NonNullable<SignOptions["expiresIn"]>;

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: string;
}

function getSecret(
  name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"
): string {
  const secret = process.env[name];

  if (!secret) {
    throw new Error(`${name} is not configured`);
  }

  return secret;
}

export function generateAccessToken(
  payload: AccessTokenPayload
): string {
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ||
    "15m") as TokenLifetime;

  return jwt.sign(payload, getSecret("JWT_ACCESS_SECRET"), {
    expiresIn,
  });
}

export function generateRefreshToken(
  payload: RefreshTokenPayload
): string {
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ||
    "7d") as TokenLifetime;

  return jwt.sign(payload, getSecret("JWT_REFRESH_SECRET"), {
    expiresIn,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(
    token,
    getSecret("JWT_ACCESS_SECRET")
  ) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(
    token,
    getSecret("JWT_REFRESH_SECRET")
  ) as RefreshTokenPayload;
}