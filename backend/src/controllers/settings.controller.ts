import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { updateCompanySettingsSchema } from "../utils/settings-validation.js";

type AuthenticatedRequest = Request & { auth?: { userId: string } };

const SETTINGS_ID = "company";

const defaultSettings = {
  id: SETTINGS_ID,
  companyName: "Industrial ERP",
  country: "India",
  currency: "INR",
  timezone: "Asia/Kolkata",
  financialYearStart: 4,
  defaultTaxPercent: 18,
  estimatePrefix: "EST",
  quotationPrefix: "QUO",
  productionPrefix: "PRO",
  dispatchPrefix: "DSP",
} as const;

export const getCompanySettingsController = async (
  _request: Request,
  response: Response
) => {
  try {
    const settings = await prisma.companySettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: defaultSettings,
    });

    response.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error("Unable to load company settings:", error);
    response
      .status(500)
      .json({ success: false, message: "Unable to load company settings" });
  }
};

export const updateCompanySettingsController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateCompanySettingsSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the settings fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const existing = await prisma.companySettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    const data: any = validation.data;
    const settings = await prisma.companySettings.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "CompanySettings",
        entityId: SETTINGS_ID,
        oldValues: existing
          ? {
              companyName: existing.companyName,
              gstNumber: existing.gstNumber,
              defaultTaxPercent: existing.defaultTaxPercent.toString(),
            }
          : {},
        newValues: {
          companyName: settings.companyName,
          gstNumber: settings.gstNumber,
          defaultTaxPercent: settings.defaultTaxPercent.toString(),
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Company settings saved successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Unable to update company settings:", error);
    response
      .status(500)
      .json({ success: false, message: "Unable to update company settings" });
  }
};
