import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createLeadSchema,
  updateLeadSchema,
} from "../utils/lead-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const leadInclude = {
  customer: {
    select: {
      id: true,
      customerCode: true,
      companyName: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

export const listLeadsController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string"
        ? request.query.search.trim()
        : "";

    const leads = await prisma.lead.findMany({
      ...(search
        ? {
            where: {
              OR: [
                {
                  leadNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  title: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  customer: {
                    companyName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              ],
            },
          }
        : {}),
      include: leadInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    response.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Unable to list leads:", error);

    response.status(500).json({
      success: false,
      message: "Unable to load leads",
    });
  }
};

export const createLeadController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createLeadSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the highlighted fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;

    const customer = await prisma.customer.findUnique({
      where: {
        id: data.customerId,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      response.status(404).json({
        success: false,
        message: "Selected customer was not found",
      });
      return;
    }

    if (data.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: {
          id: data.assignedToId,
        },
        select: {
          id: true,
        },
      });

      if (!assignedUser) {
        response.status(404).json({
          success: false,
          message: "Selected assigned user was not found",
        });
        return;
      }
    }

    const leadNumber = `LEAD-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        title: data.title,
        description: data.description ?? null,
        source: data.source ?? null,
        priority: data.priority,
        status: data.status,
        estimatedValue: data.estimatedValue ?? null,
        expectedCloseDate: data.expectedCloseDate
          ? new Date(data.expectedCloseDate)
          : null,
        customerId: data.customerId,
        assignedToId: data.assignedToId ?? null,
      },
      include: leadInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "Lead",
        entityId: lead.id,
        newValues: {
          leadNumber: lead.leadNumber,
          title: lead.title,
          status: lead.status,
          customerId: lead.customerId,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Unable to create lead:", error);

    response.status(500).json({
      success: false,
      message: "Unable to create lead",
    });
  }
};

export const updateLeadController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const leadId = String(request.params.id);
    const validation = updateLeadSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the highlighted fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const existingLead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        customerId: true,
      },
    });

    if (!existingLead) {
      response.status(404).json({
        success: false,
        message: "Lead was not found",
      });
      return;
    }

    const data = validation.data;

    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: {
          id: data.customerId,
        },
        select: {
          id: true,
        },
      });

      if (!customer) {
        response.status(404).json({
          success: false,
          message: "Selected customer was not found",
        });
        return;
      }
    }

    if (data.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: {
          id: data.assignedToId,
        },
        select: {
          id: true,
        },
      });

      if (!assignedUser) {
        response.status(404).json({
          success: false,
          message: "Selected assigned user was not found",
        });
        return;
      }
    }

    const lead = await prisma.lead.update({
      where: {
        id: leadId,
      },
      data: {
        ...(data.title !== undefined
          ? { title: data.title }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description ?? null }
          : {}),
        ...(data.source !== undefined
          ? { source: data.source ?? null }
          : {}),
        ...(data.priority !== undefined
          ? { priority: data.priority }
          : {}),
        ...(data.status !== undefined
          ? { status: data.status }
          : {}),
        ...(data.estimatedValue !== undefined
          ? { estimatedValue: data.estimatedValue ?? null }
          : {}),
        ...(data.expectedCloseDate !== undefined
          ? {
              expectedCloseDate: data.expectedCloseDate
                ? new Date(data.expectedCloseDate)
                : null,
            }
          : {}),
        ...(data.customerId !== undefined
          ? { customerId: data.customerId }
          : {}),
        ...(data.assignedToId !== undefined
          ? { assignedToId: data.assignedToId ?? null }
          : {}),
      },
      include: leadInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "Lead",
        entityId: lead.id,
        oldValues: {
          title: existingLead.title,
          status: existingLead.status,
          priority: existingLead.priority,
          customerId: existingLead.customerId,
        },
        newValues: {
          title: lead.title,
          status: lead.status,
          priority: lead.priority,
          customerId: lead.customerId,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Unable to update lead:", error);

    response.status(500).json({
      success: false,
      message: "Unable to update lead",
    });
  }
};
export const getLeadController = async (
  request: Request,
  response: Response
) => {
  try {
    const leadId = String(request.params.id);

    const lead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
      include: leadInclude,
    });

    if (!lead) {
      response.status(404).json({
        success: false,
        message: "Lead was not found",
      });
      return;
    }

    response.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Unable to load lead:", error);

    response.status(500).json({
      success: false,
      message: "Unable to load lead",
    });
  }
};

export const deleteLeadController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const leadId = String(request.params.id);

    const existingLead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
      select: {
        id: true,
        leadNumber: true,
        title: true,
        status: true,
      },
    });

    if (!existingLead) {
      response.status(404).json({
        success: false,
        message: "Lead was not found",
      });
      return;
    }

    await prisma.$transaction([
      prisma.lead.delete({
        where: {
          id: leadId,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: request.auth?.userId ?? null,
          action: "DELETE",
          entity: "Lead",
          entityId: existingLead.id,
          oldValues: {
            leadNumber: existingLead.leadNumber,
            title: existingLead.title,
            status: existingLead.status,
          },
          ipAddress: request.ip ?? null,
        },
      }),
    ]);

    response.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Unable to delete lead:", error);

    response.status(500).json({
      success: false,
      message: "Unable to delete lead",
    });
  }
};
const ensureLeadExists = async (leadId: string) => {
  return prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
};

export const getLeadCrmDetailsController = async (request: Request, response: Response) => {
  try {
    const leadId = String(request.params.id);
    if (!(await ensureLeadExists(leadId))) return response.status(404).json({ success: false, message: "Lead was not found" });
    const [technical, activities, competitors, surveys, tenders, quotations] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`SELECT "steamCapacityTph","workingPressureBar","fuelType","feedWaterSource","steamConsumption","operatingHoursPerDay","existingFuelCost","industryType","crmStage" FROM "Lead" WHERE id=$1`, leadId),
      prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "LeadActivity" WHERE "leadId"=$1 ORDER BY COALESCE("scheduledAt","createdAt") DESC`, leadId),
      prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "LeadCompetitor" WHERE "leadId"=$1 ORDER BY "createdAt" DESC`, leadId),
      prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "LeadTechnicalSurvey" WHERE "leadId"=$1 ORDER BY "createdAt" DESC`, leadId),
      prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "LeadTender" WHERE "leadId"=$1 ORDER BY COALESCE("dueDate","createdAt") DESC`, leadId),
      prisma.$queryRawUnsafe<any[]>(`SELECT q."id",q."quotationNumber",q."version",q."status",q."issueDate",q."totalAmount" FROM "Quotation" q INNER JOIN "Estimate" e ON e."id"=q."estimateId" WHERE e."leadId"=$1 ORDER BY q."issueDate" DESC`, leadId),
    ]);
    return response.json({ success: true, data: { technical: technical[0] ?? null, activities, competitors, surveys, tenders, quotations } });
  } catch (error) {
    console.error("Unable to load CRM details:", error);
    return response.status(500).json({ success: false, message: "Unable to load CRM details" });
  }
};

export const saveLeadTechnicalController = async (request: Request, response: Response) => {
  try {
    const leadId = String(request.params.id);
    if (!(await ensureLeadExists(leadId))) return response.status(404).json({ success: false, message: "Lead was not found" });
    const d = request.body ?? {};
    await prisma.$executeRawUnsafe(`UPDATE "Lead" SET "steamCapacityTph"=$1,"workingPressureBar"=$2,"fuelType"=$3,"feedWaterSource"=$4,"steamConsumption"=$5,"operatingHoursPerDay"=$6,"existingFuelCost"=$7,"industryType"=$8,"crmStage"=$9,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$10`,
      d.steamCapacityTph || null, d.workingPressureBar || null, d.fuelType || null, d.feedWaterSource || null, d.steamConsumption || null, d.operatingHoursPerDay || null, d.existingFuelCost || null, d.industryType || null, d.crmStage || "LEAD_RECEIVED", leadId);
    return response.json({ success: true, message: "Technical qualification saved" });
  } catch (error) { console.error(error); return response.status(500).json({ success:false,message:"Unable to save technical qualification" }); }
};

export const createLeadActivityController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const leadId = String(request.params.id); if (!(await ensureLeadExists(leadId))) return response.status(404).json({success:false,message:"Lead was not found"});
    const d=request.body??{}; const id=randomUUID();
    await prisma.$executeRawUnsafe(`INSERT INTO "LeadActivity" (id,"leadId",type,status,subject,notes,"scheduledAt","completedAt","assignedToId","createdById","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`, id,leadId,d.type||"FOLLOW_UP",d.status||"PLANNED",d.subject,d.notes||null,d.scheduledAt?new Date(d.scheduledAt):null,d.completedAt?new Date(d.completedAt):null,d.assignedToId||null,request.auth?.userId||null);
    return response.status(201).json({success:true,message:"CRM activity added",data:{id}});
  } catch(error){console.error(error);return response.status(500).json({success:false,message:"Unable to add CRM activity"});}
};

export const createLeadCompetitorController = async (request: Request, response: Response) => {
  try { const leadId=String(request.params.id); if(!(await ensureLeadExists(leadId))) return response.status(404).json({success:false,message:"Lead was not found"}); const d=request.body??{}; const id=randomUUID(); await prisma.$executeRawUnsafe(`INSERT INTO "LeadCompetitor" (id,"leadId",name,notes,"quotedValue","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,id,leadId,d.name,d.notes||null,d.quotedValue||null); return response.status(201).json({success:true,message:"Competitor added"}); } catch(error){console.error(error);return response.status(500).json({success:false,message:"Unable to add competitor"});}
};

export const saveLeadSurveyController = async (request: Request, response: Response) => {
  try { const leadId=String(request.params.id); if(!(await ensureLeadExists(leadId))) return response.status(404).json({success:false,message:"Lead was not found"}); const d=request.body??{}; const id=randomUUID(); await prisma.$executeRawUnsafe(`INSERT INTO "LeadTechnicalSurvey" (id,"leadId","engineerVisitAt","siteAudit","utilityAudit","fuelAudit","waterAudit","surveyReport","boilerRoomLayout","chimneyHeightM","waterAnalysis","existingSteamNetwork","fuelStorage","engineerNotes",status,"proposalReference","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,id,leadId,d.engineerVisitAt?new Date(d.engineerVisitAt):null,!!d.siteAudit,!!d.utilityAudit,!!d.fuelAudit,!!d.waterAudit,d.surveyReport||null,d.boilerRoomLayout||null,d.chimneyHeightM||null,d.waterAnalysis||null,d.existingSteamNetwork||null,d.fuelStorage||null,d.engineerNotes||null,d.status||"DRAFT",d.proposalReference||null); return response.status(201).json({success:true,message:"Technical survey saved"}); } catch(error){console.error(error);return response.status(500).json({success:false,message:"Unable to save survey"});}
};

export const createLeadTenderController = async (request: Request, response: Response) => {
  try { const leadId=String(request.params.id); if(!(await ensureLeadExists(leadId))) return response.status(404).json({success:false,message:"Lead was not found"}); const d=request.body??{}; const id=randomUUID(); await prisma.$executeRawUnsafe(`INSERT INTO "LeadTender" (id,"leadId","tenderNumber","dueDate","emdAmount","bgAmount","technicalClarifications",status,"negotiationNotes",notes,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,id,leadId,d.tenderNumber,d.dueDate?new Date(d.dueDate):null,d.emdAmount||null,d.bgAmount||null,d.technicalClarifications||null,d.status||"RECEIVED",d.negotiationNotes||null,d.notes||null); return response.status(201).json({success:true,message:"Tender added"}); } catch(error){console.error(error);return response.status(500).json({success:false,message:"Unable to add tender"});}
};

export const createLeadOutcomeController = async (request: AuthenticatedRequest, response: Response) => {
  try { const leadId=String(request.params.id); if(!(await ensureLeadExists(leadId))) return response.status(404).json({success:false,message:"Lead was not found"}); const d=request.body??{}; const id=randomUUID(); await prisma.$executeRawUnsafe(`INSERT INTO "LeadOutcomeRecord" (id,"leadId",outcome,reason,notes,"createdById") VALUES ($1,$2,$3,$4,$5,$6)`,id,leadId,d.outcome,d.reason||null,d.notes||null,request.auth?.userId||null); return response.status(201).json({success:true,message:"Outcome recorded"}); } catch(error){console.error(error);return response.status(500).json({success:false,message:"Unable to record outcome"});}
};
