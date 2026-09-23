import { z } from "zod";
const opt=(n=2000)=>z.preprocess(v=>typeof v==="string"&&!v.trim()?undefined:v,z.string().trim().max(n).optional());
const date=z.preprocess(v=>v===""||v===null?undefined:v,z.string().trim().optional());
export const createInstallationSchema=z.object({
 dispatchId:z.string().uuid(), siteName:z.string().trim().min(2).max(200), siteAddress:z.string().trim().min(3).max(1000),
 siteContactPerson:opt(150),siteContactPhone:opt(30),engineerId:z.string().uuid().optional().nullable(),plannedStartDate:date,notes:opt(),
 checklist:z.array(z.string().trim().min(2).max(300)).min(1).max(50).default(["Site readiness","Equipment positioning","Mechanical installation","Piping connection","Electrical connection","Safety checks"]),
 commissioningTests:z.array(z.object({testName:z.string().trim().min(2).max(200),specification:opt(500)})).min(1).max(50).default([{testName:"Trial run"},{testName:"Safety interlock test"},{testName:"Performance verification"}])
});
export const updateInstallationSchema=z.object({
 status:z.enum(["PLANNED","SITE_READY","IN_PROGRESS","INSTALLED","COMMISSIONING","HANDED_OVER","ON_HOLD","CANCELLED"]).optional(),
 engineerId:z.string().uuid().nullable().optional(),plannedStartDate:date,customerSignoffName:opt(150),customerSignoffNotes:opt(),
 commissioningReportUrl:opt(1000),notes:opt()
}).refine(x=>Object.keys(x).length>0);
export const updateChecklistSchema=z.object({status:z.enum(["PENDING","PASS","FAIL","NOT_APPLICABLE"]),remarks:opt(1000)});
export const updateCommissioningTestSchema=z.object({status:z.enum(["PENDING","PASS","FAIL"]),observedValue:opt(500),remarks:opt(1000)});
export const spareMovementSchema=z.object({inventoryItemId:z.string().uuid(),movementType:z.enum(["ISSUE","RETURN","USED"]),quantity:z.coerce.number().positive(),notes:opt(1000)});
export const activateWarrantySchema=z.object({title:z.string().trim().min(3).max(200).default("Equipment Warranty"),startDate:z.string().min(1),endDate:z.string().min(1),notes:opt()}).refine(x=>new Date(x.endDate)>=new Date(x.startDate),{path:["endDate"],message:"End date must be on or after start date"});
