import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  contractStatusSchema,
  createContractSchema,
  createServiceRequestSchema,
  updateServiceRequestSchema,
} from "../utils/service-validation.js";

type AuthenticatedRequest = Request & { auth?: { userId: string } };

const contractInclude = {
  customer: true,
  dispatch: {
    include: { productionOrder: { select: { id: true, productionNumber: true, title: true } } },
  },
  createdBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  _count: { select: { requests: true } },
} as const;

const requestInclude = {
  customer: true,
  serviceContract: { select: { id: true, contractNumber: true, title: true, contractType: true, status: true } },
  assignedTo: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  createdBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
} as const;

const dateOrNull = (value?: string) => value ? new Date(value) : null;

export const listContractsController = async (request: Request, response: Response) => {
  try {
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const contracts = await prisma.serviceContract.findMany({
      ...(search ? { where: { OR: [
        { contractNumber: { contains: search, mode: "insensitive" as const } },
        { title: { contains: search, mode: "insensitive" as const } },
        { customer: { companyName: { contains: search, mode: "insensitive" as const } } },
      ] } } : {}),
      include: contractInclude,
      orderBy: { createdAt: "desc" },
    });
    response.status(200).json({ success: true, data: contracts });
  } catch (error) {
    console.error("Unable to list service contracts:", error);
    response.status(500).json({ success: false, message: "Unable to load service contracts" });
  }
};

export const createContractController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = createContractSchema.safeParse(request.body);
    if (!validation.success) {
      response.status(400).json({ success: false, message: "Please correct the contract fields", errors: validation.error.flatten().fieldErrors });
      return;
    }
    const data = validation.data;
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } });
    if (!customer) { response.status(404).json({ success: false, message: "Customer was not found" }); return; }

    if (data.dispatchId) {
      const dispatch = await prisma.dispatch.findUnique({ where: { id: data.dispatchId }, select: { id: true } });
      if (!dispatch) { response.status(404).json({ success: false, message: "Dispatch was not found" }); return; }
    }

    const contractNumber = `AMC-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const contract = await prisma.serviceContract.create({
      data: {
        contractNumber,
        customerId: data.customerId,
        dispatchId: data.dispatchId ?? null,
        title: data.title,
        contractType: data.contractType,
        status: data.status,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        contractValue: data.contractValue ?? null,
        visitsIncluded: data.visitsIncluded,
        responseTimeHours: data.responseTimeHours ?? null,
        notes: data.notes ?? null,
        createdById: request.auth?.userId ?? null,
      },
      include: contractInclude,
    });
    await prisma.auditLog.create({ data: { userId: request.auth?.userId ?? null, action: "CREATE", entity: "ServiceContract", entityId: contract.id, newValues: { contractNumber, status: contract.status }, ipAddress: request.ip ?? null } });
    response.status(201).json({ success: true, message: "Service contract created successfully", data: contract });
  } catch (error) {
    console.error("Unable to create service contract:", error);
    response.status(500).json({ success: false, message: "Unable to create service contract" });
  }
};

export const updateContractStatusController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = contractStatusSchema.safeParse(request.body.status);
    if (!validation.success) { response.status(400).json({ success: false, message: "Select a valid contract status" }); return; }
    const existing = await prisma.serviceContract.findUnique({ where: { id: String(request.params.id) } });
    if (!existing) { response.status(404).json({ success: false, message: "Service contract was not found" }); return; }
    const contract = await prisma.serviceContract.update({ where: { id: existing.id }, data: { status: validation.data }, include: contractInclude });
    await prisma.auditLog.create({ data: { userId: request.auth?.userId ?? null, action: "UPDATE", entity: "ServiceContract", entityId: contract.id, oldValues: { status: existing.status }, newValues: { status: contract.status }, ipAddress: request.ip ?? null } });
    response.status(200).json({ success: true, message: "Contract status updated", data: contract });
  } catch (error) {
    console.error("Unable to update contract:", error);
    response.status(500).json({ success: false, message: "Unable to update contract" });
  }
};

export const listServiceRequestsController = async (request: Request, response: Response) => {
  try {
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const requests = await prisma.serviceRequest.findMany({
      ...(search ? { where: { OR: [
        { ticketNumber: { contains: search, mode: "insensitive" as const } },
        { subject: { contains: search, mode: "insensitive" as const } },
        { customer: { companyName: { contains: search, mode: "insensitive" as const } } },
      ] } } : {}),
      include: requestInclude,
      orderBy: { createdAt: "desc" },
    });
    response.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Unable to list service requests:", error);
    response.status(500).json({ success: false, message: "Unable to load service requests" });
  }
};

export const createServiceRequestController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = createServiceRequestSchema.safeParse(request.body);
    if (!validation.success) {
      response.status(400).json({ success: false, message: "Please correct the service request fields", errors: validation.error.flatten().fieldErrors });
      return;
    }
    const data = validation.data;
    if (data.serviceContractId) {
      const contract = await prisma.serviceContract.findUnique({ where: { id: data.serviceContractId }, select: { customerId: true } });
      if (!contract) { response.status(404).json({ success: false, message: "Service contract was not found" }); return; }
      if (contract.customerId !== data.customerId) { response.status(400).json({ success: false, message: "The contract does not belong to the selected customer" }); return; }
    }
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } });
    if (!customer) { response.status(404).json({ success: false, message: "Customer was not found" }); return; }

    const ticketNumber = `SRV-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        ticketNumber,
        customerId: data.customerId,
        serviceContractId: data.serviceContractId ?? null,
        requestType: data.requestType,
        priority: data.priority,
        subject: data.subject,
        description: data.description,
        location: data.location ?? null,
        scheduledDate: dateOrNull(data.scheduledDate),
        createdById: request.auth?.userId ?? null,
      },
      include: requestInclude,
    });
    await prisma.auditLog.create({ data: { userId: request.auth?.userId ?? null, action: "CREATE", entity: "ServiceRequest", entityId: serviceRequest.id, newValues: { ticketNumber, status: serviceRequest.status }, ipAddress: request.ip ?? null } });
    response.status(201).json({ success: true, message: "Service request created successfully", data: serviceRequest });
  } catch (error) {
    console.error("Unable to create service request:", error);
    response.status(500).json({ success: false, message: "Unable to create service request" });
  }
};

export const updateServiceRequestController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updateServiceRequestSchema.safeParse(request.body);
    if (!validation.success) {
      response.status(400).json({ success: false, message: "Please correct the service request update", errors: validation.error.flatten().fieldErrors });
      return;
    }
    const existing = await prisma.serviceRequest.findUnique({ where: { id: String(request.params.id) } });
    if (!existing) { response.status(404).json({ success: false, message: "Service request was not found" }); return; }
    const data = validation.data;
    const now = new Date();
    const serviceRequest = await prisma.serviceRequest.update({
      where: { id: existing.id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
        ...(data.scheduledDate !== undefined ? { scheduledDate: dateOrNull(data.scheduledDate) } : {}),
        ...(data.resolutionNotes !== undefined ? { resolutionNotes: data.resolutionNotes } : {}),
        ...(data.status === "IN_PROGRESS" ? { startedAt: existing.startedAt ?? now } : {}),
        ...(data.status === "RESOLVED" ? { resolvedAt: now } : {}),
        ...(data.status === "CLOSED" ? { closedAt: now, resolvedAt: existing.resolvedAt ?? now } : {}),
      },
      include: requestInclude,
    });
    await prisma.auditLog.create({ data: { userId: request.auth?.userId ?? null, action: "UPDATE", entity: "ServiceRequest", entityId: serviceRequest.id, oldValues: { status: existing.status }, newValues: { status: serviceRequest.status }, ipAddress: request.ip ?? null } });
    if (existing.status !== serviceRequest.status || data.resolutionNotes !== undefined) {
      await rawExec('INSERT INTO "ServiceActivity" ("id","serviceRequestId","activityType","notes","fromStatus","toStatus","assignedToId","createdById") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', randomUUID(), serviceRequest.id, serviceRequest.status === "RESOLVED" ? "RESOLUTION" : "STATUS_UPDATE", data.resolutionNotes || `Status changed to ${serviceRequest.status}`, existing.status, serviceRequest.status, serviceRequest.assignedToId, request.auth?.userId ?? null);
    }
    response.status(200).json({ success: true, message: "Service request updated", data: serviceRequest });
  } catch (error) {
    console.error("Unable to update service request:", error);
    response.status(500).json({ success: false, message: "Unable to update service request" });
  }
};

const rawRows = async (sql: string, ...values: unknown[]) => prisma.$queryRawUnsafe<any[]>(sql, ...values);
const rawExec = async (sql: string, ...values: unknown[]) => prisma.$executeRawUnsafe(sql, ...values);

export const getServiceEngineersController = async (_request: Request, response: Response) => {
  try { const users = await prisma.user.findMany({ where:{status:"ACTIVE"}, select:{id:true,employeeCode:true,firstName:true,lastName:true,email:true}, orderBy:{firstName:"asc"} }); response.json({success:true,data:users}); }
  catch { response.status(500).json({success:false,message:"Unable to load service engineers"}); }
};

export const listService360Controller = async (request: Request, response: Response) => {
  try { const id=String(request.params.id); const [activities,visits,feedback,spares,plans,coverage]=await Promise.all([
    rawRows('SELECT * FROM "ServiceActivity" WHERE "serviceRequestId"=$1 ORDER BY "createdAt" DESC',id),
    rawRows('SELECT * FROM "ServiceSiteVisit" WHERE "serviceRequestId"=$1 ORDER BY "visitNumber" DESC',id),
    rawRows('SELECT * FROM "ServiceFeedback" WHERE "serviceRequestId"=$1 LIMIT 1',id),
    rawRows('SELECT * FROM "ServiceSpareMovement" WHERE "serviceRequestId"=$1 ORDER BY "movedAt" DESC',id),
    rawRows('SELECT * FROM "PreventiveMaintenancePlan" WHERE "customerId"=(SELECT "customerId" FROM "ServiceRequest" WHERE id=$1) ORDER BY "nextDueDate" ASC',id),
    rawRows('SELECT wc.* FROM "WarrantyCoverage" wc JOIN "ServiceRequest" sr ON sr."serviceContractId"=wc."contractId" WHERE sr.id=$1',id)
  ]); response.json({success:true,data:{activities,visits,feedback:feedback[0]??null,spares,preventivePlans:plans,warrantyCoverage:coverage}}); }
  catch(error){console.error(error);response.status(500).json({success:false,message:"Unable to load service 360"});}
};

export const assignServiceEngineerController = async (request: AuthenticatedRequest, response: Response) => {
  try { const id=String(request.params.id), engineerId=String(request.body.engineerId||""); const engineer=await prisma.user.findUnique({where:{id:engineerId},select:{id:true}}); if(!engineer)return response.status(404).json({success:false,message:"Engineer not found"}); const existing=await prisma.serviceRequest.findUnique({where:{id}}); if(!existing)return response.status(404).json({success:false,message:"Service request not found"}); const updated=await prisma.serviceRequest.update({where:{id},data:{assignedToId:engineerId,status:existing.status==="OPEN"?"ASSIGNED":existing.status},include:requestInclude}); await rawExec('INSERT INTO "ServiceActivity" ("id","serviceRequestId","activityType","notes","assignedToId","createdById") VALUES ($1,$2,$3,$4,$5,$6)',randomUUID(),id,"ASSIGNMENT",request.body.notes||"Engineer assigned",engineerId,request.auth?.userId??null); response.json({success:true,data:updated}); }
  catch(error){console.error(error);response.status(500).json({success:false,message:"Unable to assign engineer"});}
};

export const createServiceVisitController = async (request: AuthenticatedRequest, response: Response) => {
  try { const id=String(request.params.id); const exists=await prisma.serviceRequest.findUnique({where:{id}}); if(!exists)return response.status(404).json({success:false,message:"Service request not found"}); const count=await rawRows('SELECT COALESCE(MAX("visitNumber"),0)+1 AS n FROM "ServiceSiteVisit" WHERE "serviceRequestId"=$1',id); const n=Number(count[0]?.n||1); const b=request.body; const visitId=randomUUID(); await rawExec('INSERT INTO "ServiceSiteVisit" ("id","serviceRequestId","engineerId","visitNumber","scheduledAt","status","siteContact","findings","workPerformed","issueDescription","photoUrl","latitude","longitude","createdById") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',visitId,id,b.engineerId||exists.assignedToId||null,n,b.scheduledAt?new Date(b.scheduledAt):null,b.status||"PLANNED",b.siteContact||null,b.findings||null,b.workPerformed||null,b.issueDescription||null,b.photoUrl||null,b.latitude??null,b.longitude??null,request.auth?.userId??null); await rawExec('INSERT INTO "ServiceActivity" ("id","serviceRequestId","activityType","notes","createdById") VALUES ($1,$2,$3,$4,$5)',randomUUID(),id,"SITE_VISIT",`Site visit #${n} created`,request.auth?.userId??null); const rows=await rawRows('SELECT * FROM "ServiceSiteVisit" WHERE id=$1',visitId); response.status(201).json({success:true,data:rows[0]}); }
  catch(error){console.error(error);response.status(500).json({success:false,message:"Unable to create site visit"});}
};

export const updateServiceVisitController = async (request: AuthenticatedRequest, response: Response) => {
  try { const id=String(request.params.id), b=request.body; const fields:string[]=[]; const vals:any[]=[]; const add=(sql:string,v:any)=>{fields.push(sql);vals.push(v)}; if(b.status!==undefined)add('"status"',b.status); if(b.findings!==undefined)add('"findings"',b.findings); if(b.workPerformed!==undefined)add('"workPerformed"',b.workPerformed); if(b.issueDescription!==undefined)add('"issueDescription"',b.issueDescription); if(b.photoUrl!==undefined)add('"photoUrl"',b.photoUrl); if(b.siteContact!==undefined)add('"siteContact"',b.siteContact); if(b.status==='IN_PROGRESS')add('"startedAt"',new Date()); if(b.status==='COMPLETED')add('"completedAt"',new Date()); if(!fields.length)return response.status(400).json({success:false,message:"No visit changes supplied"}); vals.push(id); await rawExec(`UPDATE "ServiceSiteVisit" SET ${fields.map((f,i)=>`${f}=$${i+1}`).join(',')} WHERE id=$${vals.length}`,...vals); const rows=await rawRows('SELECT * FROM "ServiceSiteVisit" WHERE id=$1',id); response.json({success:true,data:rows[0]}); }
  catch(error){console.error(error);response.status(500).json({success:false,message:"Unable to update site visit"});}
};

export const addServiceFeedbackController = async (request: AuthenticatedRequest, response: Response) => {
  try { const id=String(request.params.id), b=request.body; if(!["ONE","TWO","THREE","FOUR","FIVE"].includes(b.rating))return response.status(400).json({success:false,message:"Rating must be between 1 and 5"}); const feedbackId=randomUUID(); await rawExec('INSERT INTO "ServiceFeedback" ("id","serviceRequestId","rating","comments","customerName") VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("serviceRequestId") DO UPDATE SET "rating"=EXCLUDED."rating","comments"=EXCLUDED."comments","customerName"=EXCLUDED."customerName","submittedAt"=CURRENT_TIMESTAMP',feedbackId,id,b.rating,b.comments||null,b.customerName||null); await rawExec('INSERT INTO "ServiceActivity" ("id","serviceRequestId","activityType","notes","createdById") VALUES ($1,$2,$3,$4,$5)',randomUUID(),id,"NOTE",`Customer feedback: ${b.rating}`,request.auth?.userId??null); const rows=await rawRows('SELECT * FROM "ServiceFeedback" WHERE "serviceRequestId"=$1',id); response.json({success:true,data:rows[0]}); }
  catch(error){console.error(error);response.status(500).json({success:false,message:"Unable to save feedback"});}
};

export const addServiceSpareMovementController = async (request: AuthenticatedRequest, response: Response) => {
  try { const id=String(request.params.id), b=request.body; const movementId=randomUUID(); await rawExec('INSERT INTO "ServiceSpareMovement" ("id","serviceRequestId","spareName","partNumber","quantity","movementType","serialNumber","replacedPart","warrantyCovered","notes","movedById") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',movementId,id,b.spareName,b.partNumber||null,Number(b.quantity||1),b.movementType||"ISSUE",b.serialNumber||null,b.replacedPart||null,Boolean(b.warrantyCovered),b.notes||null,request.auth?.userId??null); const rows=await rawRows('SELECT * FROM "ServiceSpareMovement" WHERE id=$1',movementId); response.status(201).json({success:true,data:rows[0]}); }
  catch(error){console.error(error);response.status(500).json({success:false,message:"Unable to save spare movement"});}
};

export const createPmPlanController = async (request: AuthenticatedRequest, response: Response) => {
  try { const b=request.body; if(!b.customerId||!b.title||!Number(b.frequencyDays)||!b.nextDueDate)return response.status(400).json({success:false,message:"Customer, title, frequency and next due date are required"}); const id=randomUUID(); await rawExec('INSERT INTO "PreventiveMaintenancePlan" ("id","contractId","customerId","title","frequencyDays","nextDueDate","checklist","createdById") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',id,b.contractId||null,b.customerId,b.title,Number(b.frequencyDays),new Date(b.nextDueDate),b.checklist||null,request.auth?.userId??null); const rows=await rawRows('SELECT * FROM "PreventiveMaintenancePlan" WHERE id=$1',id); response.status(201).json({success:true,data:rows[0]}); }
  catch(error){console.error(error);response.status(500).json({success:false,message:"Unable to create preventive maintenance plan"});}
};

export const addWarrantyCoverageController = async (request: AuthenticatedRequest, response: Response) => {
  try { const b=request.body; if(!b.contractId||!b.componentName||!b.coverageType)return response.status(400).json({success:false,message:"Contract, component and coverage type are required"}); const id=randomUUID(); await rawExec('INSERT INTO "WarrantyCoverage" ("id","contractId","componentName","coverageType","included","exclusions","replacementLimit") VALUES ($1,$2,$3,$4,$5,$6,$7)',id,b.contractId,b.componentName,b.coverageType,b.included!==false,b.exclusions||null,b.replacementLimit??null); const rows=await rawRows('SELECT * FROM "WarrantyCoverage" WHERE id=$1',id); response.status(201).json({success:true,data:rows[0]}); }
  catch(error){console.error(error);response.status(500).json({success:false,message:"Unable to add warranty coverage"});}
};
