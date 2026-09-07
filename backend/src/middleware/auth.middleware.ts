import type { NextFunction, Request, Response } from "express";
import {
  verifyAccessToken,
  type AccessTokenPayload,
} from "../utils/token.js";

export interface AuthenticatedRequest extends Request {
  auth?: AccessTokenPayload;
}

export function authenticate(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): void {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    response.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
    return;
  }

  try {
    request.auth = verifyAccessToken(token);
    next();
  } catch {
    response.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}