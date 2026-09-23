import type { Request, Response } from "express";
import { prisma } from "../config/database.js";

const fail=(res:Response,e:unknown,m:string)=>{console.error(m,e);res.status(500).json({success:false,message:m})};
const num=(v:unknown)=>Number(v);
const text=(v:unknown)=>typeof v==="string"?v.trim():"";

export const dashboard=async(_req:Request,res:Response)=>{
 try{
  const [devices,online,openAlerts,critical,production,inventory,customers,projects,employees,pendingLeaves,expenses,invoices]=await Promise.all([
   prisma.iotDevice.count(),prisma.iotDevice.count({where:{status:"ONLINE"}}),
   prisma.iotAlert.count({where:{status:{not:"RESOLVED"}}}),
   prisma.iotAlert.count({where:{status:{not:"RESOLVED"},severity:"CRITICAL"}}),
   prisma.productionOrder.count({where:{status:"IN_PROGRESS"}}),
   prisma.inventoryItem.count(),
   prisma.customer.count(),
   prisma.project.count({where:{status:{notIn:["COMPLETED","CANCELLED"]}}}),
   prisma.hrEmployee.count({where:{status:"ACTIVE"}}),
   prisma.hrLeaveRequest.count({where:{status:"PENDING"}}),
   prisma.financeExpense.count({where:{status:"DRAFT"}}),
   prisma.salesInvoice.count({where:{status:{notIn:["PAID","CANCELLED"]}}})
  ]);
  const recentAlerts=await prisma.iotAlert.findMany({take:8,orderBy:{createdAt:"desc"},include:{device:true}});
  res.json({success:true,data:{iot:{devices,online,offline:Math.max(devices-online,0),openAlerts,critical},business:{production,inventory,customers,projects,employees,pendingLeaves,draftExpenses:expenses,openInvoices:invoices},recentAlerts}});
 }catch(e){fail(res,e,"Unable to load management dashboard")}
};

export const listDevices=async(req:Request,res:Response)=>{
 try{
  const q=text(req.query.search);
  const data=await prisma.iotDevice.findMany({
   ...(q?{where:{OR:[{deviceCode:{contains:q,mode:"insensitive"}},{name:{contains:q,mode:"insensitive"}},{deviceType:{contains:q,mode:"insensitive"}},{location:{contains:q,mode:"insensitive"}}]}}:{}),
   include:{readings:{take:5,orderBy:{recordedAt:"desc"}},alerts:{where:{status:{not:"RESOLVED"}},orderBy:{createdAt:"desc"}}},
   orderBy:{createdAt:"desc"}
  });
  res.json({success:true,data});
 }catch(e){fail(res,e,"Unable to load IoT devices")}
};

export const createDevice=async(req:Request,res:Response)=>{
 try{
  const deviceCode=text(req.body.deviceCode),name=text(req.body.name),deviceType=text(req.body.deviceType);
  if(!deviceCode||!name||!deviceType)return void res.status(400).json({success:false,message:"Device code, name and type are required"});
  const data=await prisma.iotDevice.create({data:{deviceCode,name,deviceType,...(text(req.body.machineId)?{machineId:text(req.body.machineId)}:{}),...(text(req.body.workCenterId)?{workCenterId:text(req.body.workCenterId)}:{}),...(text(req.body.location)?{location:text(req.body.location)}:{}),...(text(req.body.firmware)?{firmware:text(req.body.firmware)}:{}),...(text(req.body.notes)?{notes:text(req.body.notes)}:{})}});
  res.status(201).json({success:true,data});
 }catch(e){fail(res,e,"Unable to create IoT device")}
};

export const updateDevice=async(req:Request,res:Response)=>{
 try{
  const body=req.body as Record<string,unknown>;
  const data=await prisma.iotDevice.update({where:{id:String(req.params.id)},data:{
   ...(body.status?{status:body.status as "ONLINE"|"OFFLINE"|"WARNING"|"MAINTENANCE"|"DISABLED"}:{}),
   ...(body.name!==undefined?{name:text(body.name)}:{}),
   ...(body.location!==undefined?{location:text(body.location)||null}:{}),
   ...(body.firmware!==undefined?{firmware:text(body.firmware)||null}:{}),
   ...(body.notes!==undefined?{notes:text(body.notes)||null}:{})
  }});
  res.json({success:true,data});
 }catch(e){fail(res,e,"Unable to update IoT device")}
};

export const addReading=async(req:Request,res:Response)=>{
 try{
  const deviceId=String(req.params.id),sensorType=text(req.body.sensorType),unit=text(req.body.unit),value=num(req.body.value);
  if(!sensorType||!unit||!Number.isFinite(value))return void res.status(400).json({success:false,message:"Sensor type, numeric value and unit are required"});
  const data=await prisma.$transaction(async tx=>{
   const reading=await tx.iotSensorReading.create({data:{deviceId,sensorType,value,unit}});
   await tx.iotDevice.update({where:{id:deviceId},data:{lastSeenAt:new Date(),status:"ONLINE"}});
   return reading;
  });
  res.status(201).json({success:true,data});
 }catch(e){fail(res,e,"Unable to record sensor reading")}
};

export const createAlert=async(req:Request,res:Response)=>{
 try{
  const deviceId=String(req.params.id),title=text(req.body.title);
  if(!title)return void res.status(400).json({success:false,message:"Alert title is required"});
  const data=await prisma.iotAlert.create({data:{deviceId,title,...(text(req.body.message)?{message:text(req.body.message)}:{}),...(text(req.body.sensorType)?{sensorType:text(req.body.sensorType)}:{}),...(Number.isFinite(num(req.body.observedValue))?{observedValue:num(req.body.observedValue)}:{}),...(Number.isFinite(num(req.body.thresholdValue))?{thresholdValue:num(req.body.thresholdValue)}:{}),severity:(req.body.severity||"WARNING") as "INFO"|"WARNING"|"CRITICAL"}});
  res.status(201).json({success:true,data});
 }catch(e){fail(res,e,"Unable to create IoT alert")}
};

export const updateAlert=async(req:Request,res:Response)=>{
 try{
  const status=(req.body.status||"ACKNOWLEDGED") as "OPEN"|"ACKNOWLEDGED"|"RESOLVED";
  const data=await prisma.iotAlert.update({where:{id:String(req.params.id)},data:{status,...(status==="ACKNOWLEDGED"?{acknowledgedAt:new Date()}:{}),...(status==="RESOLVED"?{resolvedAt:new Date()}:{})}});
  res.json({success:true,data});
 }catch(e){fail(res,e,"Unable to update IoT alert")}
};
