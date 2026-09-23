import { z } from "zod";
const date = z.coerce.date().optional();
export const createProjectSchema = z.object({
  salesOrderId:z.string().uuid(), title:z.string().min(2), description:z.string().optional(),
  priority:z.enum(["LOW","MEDIUM","HIGH","URGENT"]).default("MEDIUM"),
  plannedStartDate:date, plannedEndDate:date, managerId:z.string().uuid().optional(),
  notes:z.string().optional()
});
export const updateProjectSchema = z.object({
  title:z.string().min(2).optional(), description:z.string().nullable().optional(),
  status:z.enum(["PLANNED","ACTIVE","ON_HOLD","COMPLETED","CANCELLED"]).optional(),
  priority:z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  plannedStartDate:z.coerce.date().nullable().optional(), plannedEndDate:z.coerce.date().nullable().optional(),
  managerId:z.string().uuid().nullable().optional(), notes:z.string().nullable().optional()
});
export const createMilestoneSchema=z.object({
  projectId:z.string().uuid(), name:z.string().min(2), description:z.string().optional(),
  plannedDate:date, notes:z.string().optional()
});
export const updateMilestoneSchema=z.object({
  name:z.string().min(2).optional(), description:z.string().nullable().optional(),
  status:z.enum(["PENDING","IN_PROGRESS","COMPLETED","DELAYED","CANCELLED"]).optional(),
  plannedDate:z.coerce.date().nullable().optional(), progressPercent:z.number().min(0).max(100).optional(),
  notes:z.string().nullable().optional()
});
export const createTaskSchema=z.object({
  projectId:z.string().uuid(), milestoneId:z.string().uuid().optional(), title:z.string().min(2),
  description:z.string().optional(), department:z.string().optional(),
  priority:z.enum(["LOW","MEDIUM","HIGH","URGENT"]).default("MEDIUM"),
  plannedDate:date, dueDate:date, assignedToId:z.string().uuid().optional(), notes:z.string().optional()
});
export const updateTaskSchema=z.object({
  milestoneId:z.string().uuid().nullable().optional(), title:z.string().min(2).optional(),
  description:z.string().nullable().optional(), department:z.string().nullable().optional(),
  status:z.enum(["TODO","IN_PROGRESS","BLOCKED","COMPLETED","CANCELLED"]).optional(),
  priority:z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  plannedDate:z.coerce.date().nullable().optional(), dueDate:z.coerce.date().nullable().optional(),
  assignedToId:z.string().uuid().nullable().optional(), notes:z.string().nullable().optional()
});
