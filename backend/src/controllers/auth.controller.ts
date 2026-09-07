import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../config/database.js";
import { verifyPassword } from "../utils/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.js";
import { loginSchema } from "../utils/auth-validation.js";

export async function loginController(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validation = loginSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Invalid login details",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      response.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const passwordMatches = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      response.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const roles = user.roles.map((userRole) => userRole.role.code);

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
        },
      }),
    ]);

    response.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          employeeCode: user.employeeCode,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUserController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      response.status(401).json({
        success: false,
        message: "User account is unavailable",
      });
      return;
    }

    response.status(200).json({
      success: true,
      data: {
        id: user.id,
        employeeCode: user.employeeCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        roles: user.roles.map((userRole) => userRole.role.code),
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    next(error);
  }
}