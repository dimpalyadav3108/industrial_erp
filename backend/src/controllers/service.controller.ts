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
    response.status(200).json({ success: true, message: "Service request updated", data: serviceRequest });
  } catch (error) {
    console.error("Unable to update service request:", error);
    response.status(500).json({ success: false, message: "Unable to update service request" });
  }
};
