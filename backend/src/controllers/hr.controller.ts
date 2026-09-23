import type { Request, Response } from "express";
import { prisma } from "../config/database.js";

type AuthRequest = Request & { auth?: { userId?: string } };
const num = (v: unknown) => Number(v ?? 0);
const date = (v: unknown) => v ? new Date(String(v)) : null;
const text = (v: unknown) => typeof v === "string" ? v.trim() : "";

const employeeInclude = {
  department: true,
  designation: true,
  salary: true,
} as const;

export async function dashboard(req: AuthRequest, res: Response) {
  try {
    const [employees, departments, pendingLeave, payrolls] = await Promise.all([
      prisma.hrEmployee.count({ where: { status: "ACTIVE" } }),
      prisma.hrDepartment.count({ where: { isActive: true } }),
      prisma.hrLeaveRequest.count({ where: { status: "PENDING" } }),
      prisma.hrPayrollRun.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }], take: 1, include: { items: true } }),
    ]);
    const payroll = payrolls[0];
    const payrollTotal = payroll?.items.reduce((s, x) => s + Number(x.netSalary), 0) ?? 0;
    res.json({ success: true, data: { activeEmployees: employees, departments, pendingLeave, payrollTotal } });
  } catch (e) { console.error(e); res.status(500).json({ success:false, message:"Unable to load HR dashboard" }); }
}

export async function listDepartments(req: AuthRequest, res: Response) {
  try { res.json({ success:true, data: await prisma.hrDepartment.findMany({ include:{ designations:true, _count:{select:{employees:true}} }, orderBy:{name:"asc"} }) }); }
  catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to load departments"});}
}
export async function createDepartment(req: AuthRequest, res: Response) {
  try {
    const code=text(req.body.code).toUpperCase(), name=text(req.body.name);
    if(!code||!name){res.status(400).json({success:false,message:"Department code and name are required"});return;}
    const data=await prisma.hrDepartment.create({data:{code,name,description:text(req.body.description)||null}});
    res.status(201).json({success:true,data,message:"Department created"});
  } catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to create department"});}
}
export async function createDesignation(req: AuthRequest,res:Response){
  try{
    const departmentId=text(req.body.departmentId),code=text(req.body.code).toUpperCase(),name=text(req.body.name);
    if(!departmentId||!code||!name){res.status(400).json({success:false,message:"Department, code and designation name are required"});return;}
    const data=await prisma.hrDesignation.create({data:{departmentId,code,name,description:text(req.body.description)||null}});
    res.status(201).json({success:true,data,message:"Designation created"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to create designation"});}
}

export async function listEmployees(req:AuthRequest,res:Response){
  try{
    const q=text(req.query.search);
    const data=await prisma.hrEmployee.findMany({
      ...(q?{where:{OR:[
        {employeeCode:{contains:q,mode:"insensitive"}},
        {firstName:{contains:q,mode:"insensitive"}},
        {lastName:{contains:q,mode:"insensitive"}},
        {email:{contains:q,mode:"insensitive"}}
      ]}}:{}),
      include:employeeInclude,
      orderBy:{createdAt:"desc"}
    });
    res.json({success:true,data});
  }catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to load employees"});}
}
export async function createEmployee(req:AuthRequest,res:Response){
  try{
    const employeeCode=text(req.body.employeeCode).toUpperCase(),firstName=text(req.body.firstName),lastName=text(req.body.lastName);
    if(!employeeCode||!firstName||!lastName||!req.body.joiningDate){res.status(400).json({success:false,message:"Employee code, first name, last name and joining date are required"});return;}
    const data=await prisma.hrEmployee.create({data:{
      employeeCode,firstName,lastName,email:text(req.body.email)||null,phone:text(req.body.phone)||null,
      departmentId:text(req.body.departmentId)||null,designationId:text(req.body.designationId)||null,
      joiningDate:new Date(req.body.joiningDate),employmentType:text(req.body.employmentType)||"FULL_TIME",notes:text(req.body.notes)||null
    },include:employeeInclude});
    res.status(201).json({success:true,data,message:"Employee created"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to create employee. Check duplicate employee code/email."});}
}
export async function updateEmployee(req:AuthRequest,res:Response){
  try{
    const id=String(req.params.id);
    const data=await prisma.hrEmployee.update({where:{id},data:{
      ...(req.body.status?{status:req.body.status}:{}),
      ...(req.body.departmentId!==undefined?{departmentId:text(req.body.departmentId)||null}:{}),
      ...(req.body.designationId!==undefined?{designationId:text(req.body.designationId)||null}:{}),
      ...(req.body.phone!==undefined?{phone:text(req.body.phone)||null}:{}),
      ...(req.body.notes!==undefined?{notes:text(req.body.notes)||null}:{})
    },include:employeeInclude});
    res.json({success:true,data,message:"Employee updated"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to update employee"});}
}

export async function listAttendance(req:AuthRequest,res:Response){
  try{
    const data=await prisma.hrAttendance.findMany({include:{employee:{select:{id:true,employeeCode:true,firstName:true,lastName:true}}},orderBy:{date:"desc"},take:250});
    res.json({success:true,data});
  }catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to load attendance"});}
}
export async function recordAttendance(req:AuthRequest,res:Response){
  try{
    const employeeId=text(req.body.employeeId);
    if(!employeeId||!req.body.date){res.status(400).json({success:false,message:"Employee and date are required"});return;}
    const d=new Date(`${String(req.body.date).slice(0,10)}T00:00:00.000Z`);
    const data=await prisma.hrAttendance.upsert({
      where:{employeeId_date:{employeeId,date:d}},
      create:{employeeId,date:d,status:req.body.status||"PRESENT",workHours:num(req.body.workHours),notes:text(req.body.notes)||null},
      update:{status:req.body.status||"PRESENT",workHours:num(req.body.workHours),notes:text(req.body.notes)||null},
      include:{employee:{select:{id:true,employeeCode:true,firstName:true,lastName:true}}}
    });
    res.json({success:true,data,message:"Attendance saved"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to save attendance"});}
}

export async function listLeaves(req:AuthRequest,res:Response){
  try{res.json({success:true,data:await prisma.hrLeaveRequest.findMany({include:{employee:true},orderBy:{createdAt:"desc"}})});}
  catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to load leave requests"});}
}
export async function createLeave(req:AuthRequest,res:Response){
  try{
    const employeeId=text(req.body.employeeId),leaveType=text(req.body.leaveType);
    if(!employeeId||!leaveType||!req.body.startDate||!req.body.endDate){res.status(400).json({success:false,message:"Employee, leave type and dates are required"});return;}
    const start=new Date(req.body.startDate),end=new Date(req.body.endDate);
    if(end<start){res.status(400).json({success:false,message:"End date cannot be before start date"});return;}
    const days=Math.floor((end.getTime()-start.getTime())/86400000)+1;
    const count=await prisma.hrLeaveRequest.count();
    const leaveNumber=`LV-${String(count+1).padStart(5,"0")}`;
    const data=await prisma.hrLeaveRequest.create({data:{leaveNumber,employeeId,leaveType,startDate:start,endDate:end,days,reason:text(req.body.reason)||null},include:{employee:true}});
    res.status(201).json({success:true,data,message:"Leave request created"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to create leave request"});}
}
export async function updateLeave(req:AuthRequest,res:Response){
  try{
    const status=req.body.status;
    if(!["APPROVED","REJECTED","CANCELLED"].includes(status)){res.status(400).json({success:false,message:"Invalid leave status"});return;}
    const data=await prisma.hrLeaveRequest.update({where:{id:String(req.params.id)},data:{status,reviewedBy:req.auth?.userId??null,reviewedAt:new Date(),remarks:text(req.body.remarks)||null},include:{employee:true}});
    res.json({success:true,data,message:"Leave request updated"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to update leave request"});}
}

export async function setSalary(req:AuthRequest,res:Response){
  try{
    const employeeId=String(req.params.employeeId);
    const data=await prisma.hrSalaryStructure.upsert({where:{employeeId},create:{
      employeeId,basicSalary:num(req.body.basicSalary),hra:num(req.body.hra),allowances:num(req.body.allowances),
      pfDeduction:num(req.body.pfDeduction),esiDeduction:num(req.body.esiDeduction),taxDeduction:num(req.body.taxDeduction),
      otherDeduction:num(req.body.otherDeduction),effectiveFrom:date(req.body.effectiveFrom)??new Date()
    },update:{
      basicSalary:num(req.body.basicSalary),hra:num(req.body.hra),allowances:num(req.body.allowances),
      pfDeduction:num(req.body.pfDeduction),esiDeduction:num(req.body.esiDeduction),taxDeduction:num(req.body.taxDeduction),
      otherDeduction:num(req.body.otherDeduction),effectiveFrom:date(req.body.effectiveFrom)??new Date()
    }});
    res.json({success:true,data,message:"Salary structure saved"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to save salary structure"});}
}

export async function listPayroll(req:AuthRequest,res:Response){
  try{res.json({success:true,data:await prisma.hrPayrollRun.findMany({include:{items:{include:{employee:true}}},orderBy:[{year:"desc"},{month:"desc"}]})});}
  catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to load payroll"});}
}
export async function createPayroll(req:AuthRequest,res:Response){
  try{
    const month=Number(req.body.month),year=Number(req.body.year);
    if(month<1||month>12||year<2000){res.status(400).json({success:false,message:"Valid month and year are required"});return;}
    const from=new Date(Date.UTC(year,month-1,1)),to=new Date(Date.UTC(year,month,1));
    const employees=await prisma.hrEmployee.findMany({where:{status:"ACTIVE"},include:{
      salary:true,
      attendance:{where:{date:{gte:from,lt:to}}},
      leaveRequests:{where:{status:"APPROVED",startDate:{lt:to},endDate:{gte:from}}}
    }});
    const count=await prisma.hrPayrollRun.count();
    const payrollNumber=`PRL-${year}-${String(month).padStart(2,"0")}-${String(count+1).padStart(3,"0")}`;
    const daysInMonth=new Date(year,month,0).getDate();
    const run=await prisma.hrPayrollRun.create({data:{payrollNumber,month,year,items:{create:employees.map(e=>{
      const s=e.salary; const basic=Number(s?.basicSalary??0),hra=Number(s?.hra??0),allowances=Number(s?.allowances??0);
      const fixedDeductions=Number(s?.pfDeduction??0)+Number(s?.esiDeduction??0)+Number(s?.taxDeduction??0)+Number(s?.otherDeduction??0);
      const byDate=new Map(e.attendance.map(a=>[a.date.toISOString().slice(0,10),a.status]));
      let paidDays=0;
      for(let d=1;d<=daysInMonth;d++){
        const key=new Date(Date.UTC(year,month-1,d)).toISOString().slice(0,10);
        const status=byDate.get(key);
        if(status==="PRESENT"||status==="PAID_LEAVE"||status==="WEEK_OFF"||status==="HOLIDAY")paidDays+=1;
        else if(status==="HALF_DAY")paidDays+=0.5;
      }
      // Approved leave is counted only for dates without an attendance record.
      for(const l of e.leaveRequests){
        const a=new Date(Math.max(l.startDate.getTime(),from.getTime()));
        const b=new Date(Math.min(l.endDate.getTime(),to.getTime()-86400000));
        for(let d=new Date(a);d<=b;d=new Date(d.getTime()+86400000)){
          const key=d.toISOString().slice(0,10);
          if(!byDate.has(key))paidDays+=1;
        }
      }
      paidDays=Math.min(daysInMonth,paidDays);
      const fullGross=basic+hra+allowances;
      const earnedGross=daysInMonth?fullGross*(paidDays/daysInMonth):0;
      const proratedDeductions=daysInMonth?fixedDeductions*(paidDays/daysInMonth):0;
      return {employeeId:e.id,basicSalary:daysInMonth?basic*(paidDays/daysInMonth):0,hra:daysInMonth?hra*(paidDays/daysInMonth):0,allowances:daysInMonth?allowances*(paidDays/daysInMonth):0,grossSalary:earnedGross,deductions:proratedDeductions,netSalary:Math.max(0,earnedGross-proratedDeductions),payableDays:daysInMonth,paidDays};
    })}},include:{items:{include:{employee:true}}}});
    res.status(201).json({success:true,data:run,message:"Attendance-based payroll run created"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to create payroll. A payroll may already exist for this month."});}
}

export async function updatePayroll(req:AuthRequest,res:Response){
  try{
    const status=req.body.status;
    if(!["PROCESSED","PAID","CANCELLED"].includes(status)){res.status(400).json({success:false,message:"Invalid payroll status"});return;}
    const data=await prisma.hrPayrollRun.update({where:{id:String(req.params.id)},data:{status,...(status==="PROCESSED"?{processedAt:new Date()}:{}),...(status==="PAID"?{paidAt:new Date()}: {})},include:{items:{include:{employee:true}}}});
    res.json({success:true,data,message:"Payroll updated"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to update payroll"});}
}

export async function payrollControl(req:AuthRequest,res:Response){
  try{
    const now=new Date(),month=Number(req.query.month||now.getMonth()+1),year=Number(req.query.year||now.getFullYear());
    const from=new Date(Date.UTC(year,month-1,1)),to=new Date(Date.UTC(year,month,1));
    const [activeEmployees,withoutSalary,attendance,pendingLeave,runs]=await Promise.all([
      prisma.hrEmployee.count({where:{status:"ACTIVE"}}),
      prisma.hrEmployee.count({where:{status:"ACTIVE",salary:null}}),
      prisma.hrAttendance.findMany({where:{date:{gte:from,lt:to}},select:{status:true}}),
      prisma.hrLeaveRequest.count({where:{status:"PENDING"}}),
      prisma.hrPayrollRun.findMany({where:{month,year},include:{items:true}})
    ]);
    const present=attendance.filter(x=>["PRESENT","PAID_LEAVE","WEEK_OFF","HOLIDAY"].includes(x.status)).length;
    const half=attendance.filter(x=>x.status==="HALF_DAY").length;
    const absent=attendance.filter(x=>x.status==="ABSENT").length;
    const run=runs[0]??null;
    res.json({success:true,data:{month,year,activeEmployees,employeesWithoutSalary:withoutSalary,attendanceRecords:attendance.length,paidAttendanceDays:present+half*.5,absenceRecords:absent,pendingLeave,payrollStatus:run?.status??"NOT_CREATED",payrollNet:run?.items.reduce((s,x)=>s+Number(x.netSalary),0)??0}});
  }catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to load payroll control"});}
}
