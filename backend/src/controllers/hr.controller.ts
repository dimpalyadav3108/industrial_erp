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

// Module 16 HR expansion endpoints use raw SQL for the new tables so the feature
// remains usable even when Prisma Client generation is unavailable in a deployment.
const esc = (v: unknown) => (v === undefined || v === null || v === "" ? null : v);
const iso = (v: unknown) => v ? new Date(String(v)) : null;

export async function listRecruitments(_req: AuthRequest, res: Response) {
  try { const data = await prisma.$queryRawUnsafe(`SELECT * FROM "HrRecruitment" ORDER BY "createdAt" DESC`); res.json({success:true,data}); }
  catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to load recruitment"});}
}
export async function createRecruitment(req: AuthRequest,res:Response){
  try { const jobTitle=text(req.body.jobTitle); if(!jobTitle){res.status(400).json({success:false,message:"Job title is required"});return;}
    const n=Number((await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int AS count FROM "HrRecruitment"`))[0]?.count||0)+1;
    const no=`REQ-${new Date().getFullYear()}-${String(n).padStart(4,"0")}`;
    const data=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrRecruitment" ("requisitionNumber","jobTitle","departmentId","positions","description","status","openingDate","closingDate") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,no,jobTitle,esc(req.body.departmentId),Number(req.body.positions||1),esc(req.body.description),req.body.status||"OPEN",new Date(req.body.openingDate||Date.now()),iso(req.body.closingDate));
    res.status(201).json({success:true,data:data[0],message:"Recruitment requisition created"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to create recruitment"});}
}
export async function createApplication(req:AuthRequest,res:Response){
  try { const recruitmentId=text(req.body.recruitmentId),candidateName=text(req.body.candidateName); if(!recruitmentId||!candidateName){res.status(400).json({success:false,message:"Recruitment and candidate name are required"});return;}
    const data=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrRecruitmentApplication" ("recruitmentId","candidateName","email","phone","experienceYears","resumeUrl","status","interviewDate","notes") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,recruitmentId,candidateName,esc(req.body.email),esc(req.body.phone),Number(req.body.experienceYears||0),esc(req.body.resumeUrl),req.body.status||"APPLIED",iso(req.body.interviewDate),esc(req.body.notes));
    res.status(201).json({success:true,data:data[0],message:"Candidate added"});
  }catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to add candidate"});}
}
export async function listShifts(_req:AuthRequest,res:Response){try{res.json({success:true,data:await prisma.$queryRawUnsafe(`SELECT * FROM "HrShift" ORDER BY "name"`)});}catch(e){res.status(500).json({success:false,message:"Unable to load shifts"});}}
export async function createShift(req:AuthRequest,res:Response){try{const code=text(req.body.code),name=text(req.body.name);if(!code||!name||!req.body.startTime||!req.body.endTime){res.status(400).json({success:false,message:"Shift code, name, start and end time are required"});return;}const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrShift" ("code","name","startTime","endTime","graceMinutes","status") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,code,name,req.body.startTime,req.body.endTime,Number(req.body.graceMinutes||0),req.body.status||"ACTIVE");res.status(201).json({success:true,data:d[0],message:"Shift created"});}catch(e){res.status(400).json({success:false,message:"Unable to create shift"});}}
export async function assignShift(req:AuthRequest,res:Response){try{const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrShiftAssignment" ("employeeId","shiftId","effectiveFrom","effectiveTo") VALUES ($1,$2,$3,$4) RETURNING *`,text(req.body.employeeId),text(req.body.shiftId),new Date(req.body.effectiveFrom),iso(req.body.effectiveTo));res.status(201).json({success:true,data:d[0],message:"Shift assigned"});}catch(e){res.status(400).json({success:false,message:"Unable to assign shift"});}}
export async function listOvertime(_req:AuthRequest,res:Response){try{const d=await prisma.$queryRawUnsafe(`SELECT o.*, e."employeeCode", e."firstName", e."lastName" FROM "HrOvertime" o JOIN "HrEmployee" e ON e.id=o."employeeId" ORDER BY o.date DESC`);res.json({success:true,data:d});}catch(e){res.status(500).json({success:false,message:"Unable to load overtime"});}}
export async function createOvertime(req:AuthRequest,res:Response){try{const h=Number(req.body.hours||0),rate=Number(req.body.rate||0);if(!req.body.employeeId||!req.body.date||h<=0){res.status(400).json({success:false,message:"Employee, date and positive overtime hours are required"});return;}const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrOvertime" ("employeeId","date","hours","rate","amount","reason") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,req.body.employeeId,new Date(req.body.date),h,rate,h*rate,esc(req.body.reason));res.status(201).json({success:true,data:d[0],message:"Overtime recorded"});}catch(e){res.status(400).json({success:false,message:"Unable to record overtime"});}}
export async function updateOvertime(req:AuthRequest,res:Response){try{const status=req.body.status;if(!["APPROVED","REJECTED","PAID"].includes(status)){res.status(400).json({success:false,message:"Invalid overtime status"});return;}const d=await prisma.$queryRawUnsafe<any[]>(`UPDATE "HrOvertime" SET "status"=$1,"approvedAt"=CASE WHEN $1='APPROVED' THEN CURRENT_TIMESTAMP ELSE "approvedAt" END,"paidAt"=CASE WHEN $1='PAID' THEN CURRENT_TIMESTAMP ELSE "paidAt" END,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,status,req.params.id);res.json({success:true,data:d[0],message:"Overtime updated"});}catch(e){res.status(400).json({success:false,message:"Unable to update overtime"});}}
export async function recordBiometric(req:AuthRequest,res:Response){try{if(!req.body.employeeId||!req.body.eventType||!req.body.eventAt){res.status(400).json({success:false,message:"Employee, event type and event time are required"});return;}const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrBiometricLog" ("employeeId","biometricId","eventType","eventAt","deviceId","source","rawPayload") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,req.body.employeeId,esc(req.body.biometricId),req.body.eventType,new Date(req.body.eventAt),esc(req.body.deviceId),req.body.source||"BIOMETRIC",esc(req.body.rawPayload));res.status(201).json({success:true,data:d[0],message:"Biometric event recorded"});}catch(e){res.status(400).json({success:false,message:"Unable to record biometric event"});}}
export async function listBiometric(_req:AuthRequest,res:Response){try{res.json({success:true,data:await prisma.$queryRawUnsafe(`SELECT b.*,e."employeeCode",e."firstName",e."lastName" FROM "HrBiometricLog" b JOIN "HrEmployee" e ON e.id=b."employeeId" ORDER BY b."eventAt" DESC LIMIT 500`)});}catch(e){res.status(500).json({success:false,message:"Unable to load biometric logs"});}}
export async function listAppraisals(_req:AuthRequest,res:Response){try{res.json({success:true,data:await prisma.$queryRawUnsafe(`SELECT a.*,e."employeeCode",e."firstName",e."lastName" FROM "HrAppraisal" a JOIN "HrEmployee" e ON e.id=a."employeeId" ORDER BY a."createdAt" DESC`)});}catch(e){res.status(500).json({success:false,message:"Unable to load appraisals"});}}
export async function createAppraisal(req:AuthRequest,res:Response){try{const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrAppraisal" ("employeeId","appraisalPeriod","reviewDate","rating","goalsScore","skillScore","attendanceScore","comments","status","reviewerId") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,req.body.employeeId,req.body.appraisalPeriod,new Date(req.body.reviewDate||Date.now()),Number(req.body.rating||0),Number(req.body.goalsScore||0),Number(req.body.skillScore||0),Number(req.body.attendanceScore||0),esc(req.body.comments),req.body.status||"DRAFT",req.auth?.userId??null);res.status(201).json({success:true,data:d[0],message:"Appraisal saved"});}catch(e){res.status(400).json({success:false,message:"Unable to save appraisal"});}}
export async function listSkills(_req:AuthRequest,res:Response){try{res.json({success:true,data:await prisma.$queryRawUnsafe(`SELECT s.*,COUNT(es.id)::int AS "employeeCount" FROM "HrSkill" s LEFT JOIN "HrEmployeeSkill" es ON es."skillId"=s.id GROUP BY s.id ORDER BY s.name`)});}catch(e){res.status(500).json({success:false,message:"Unable to load skills"});}}
export async function createSkill(req:AuthRequest,res:Response){try{const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrSkill" ("skillCode","name","category","description") VALUES ($1,$2,$3,$4) RETURNING *`,text(req.body.skillCode).toUpperCase(),text(req.body.name),esc(req.body.category),esc(req.body.description));res.status(201).json({success:true,data:d[0],message:"Skill created"});}catch(e){res.status(400).json({success:false,message:"Unable to create skill"});}}
export async function assignSkill(req:AuthRequest,res:Response){try{const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrEmployeeSkill" ("employeeId","skillId","level","assessedOn","assessor","notes") VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT ("employeeId","skillId") DO UPDATE SET "level"=EXCLUDED."level","assessedOn"=EXCLUDED."assessedOn","assessor"=EXCLUDED."assessor","notes"=EXCLUDED."notes","updatedAt"=CURRENT_TIMESTAMP RETURNING *`,req.body.employeeId,req.body.skillId,Number(req.body.level||1),iso(req.body.assessedOn),esc(req.body.assessor),esc(req.body.notes));res.status(201).json({success:true,data:d[0],message:"Employee skill updated"});}catch(e){res.status(400).json({success:false,message:"Unable to assign skill"});}}
export async function listCertifications(_req:AuthRequest,res:Response){try{res.json({success:true,data:await prisma.$queryRawUnsafe(`SELECT c.*,e."employeeCode",e."firstName",e."lastName",CASE WHEN c."expiryDate" IS NOT NULL AND c."expiryDate"<CURRENT_TIMESTAMP THEN 'EXPIRED' ELSE c.status::text END AS "computedStatus" FROM "HrCertification" c JOIN "HrEmployee" e ON e.id=c."employeeId" ORDER BY c."expiryDate" ASC NULLS LAST`)});}catch(e){res.status(500).json({success:false,message:"Unable to load certifications"});}}
export async function createCertification(req:AuthRequest,res:Response){try{const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrCertification" ("employeeId","certificationType","certificationName","certificateNumber","issuingAuthority","issueDate","expiryDate","status","documentUrl","notes") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,req.body.employeeId,req.body.certificationType,text(req.body.certificationName),esc(req.body.certificateNumber),esc(req.body.issuingAuthority),iso(req.body.issueDate),iso(req.body.expiryDate),req.body.status||"ACTIVE",esc(req.body.documentUrl),esc(req.body.notes));res.status(201).json({success:true,data:d[0],message:"Certification saved"});}catch(e){res.status(400).json({success:false,message:"Unable to save certification"});}}
export async function listTraining(_req:AuthRequest,res:Response){try{res.json({success:true,data:await prisma.$queryRawUnsafe(`SELECT * FROM "HrTraining" ORDER BY "startDate" DESC`)});}catch(e){res.status(500).json({success:false,message:"Unable to load training records"});}}
export async function createTraining(req:AuthRequest,res:Response){try{const n=Number((await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int AS count FROM "HrTraining"`))[0]?.count||0)+1;const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrTraining" ("trainingCode","title","trainer","provider","startDate","endDate","status","certificateIssued","notes") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,`TRN-${new Date().getFullYear()}-${String(n).padStart(4,"0")}`,text(req.body.title),esc(req.body.trainer),esc(req.body.provider),new Date(req.body.startDate),iso(req.body.endDate),req.body.status||"PLANNED",Boolean(req.body.certificateIssued),esc(req.body.notes));res.status(201).json({success:true,data:d[0],message:"Training record created"});}catch(e){res.status(400).json({success:false,message:"Unable to create training"});}}
export async function assignTraining(req:AuthRequest,res:Response){try{const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrTrainingParticipant" ("trainingId","employeeId","attendanceStatus","score","certificateUrl","completedAt") VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT ("trainingId","employeeId") DO UPDATE SET "attendanceStatus"=EXCLUDED."attendanceStatus","score"=EXCLUDED."score","certificateUrl"=EXCLUDED."certificateUrl","completedAt"=EXCLUDED."completedAt" RETURNING *`,req.body.trainingId,req.body.employeeId,req.body.attendanceStatus||"PENDING",Number(req.body.score||0),esc(req.body.certificateUrl),iso(req.body.completedAt));res.status(201).json({success:true,data:d[0],message:"Training participant updated"});}catch(e){res.status(400).json({success:false,message:"Unable to assign training"});}}
export async function listPayslips(_req:AuthRequest,res:Response){try{res.json({success:true,data:await prisma.$queryRawUnsafe(`SELECT p.*,e."employeeCode",e."firstName",e."lastName" FROM "HrPayslip" p JOIN "HrEmployee" e ON e.id=p."employeeId" ORDER BY p.year DESC,p.month DESC,p."createdAt" DESC`)});}catch(e){res.status(500).json({success:false,message:"Unable to load payslips"});}}
export async function generatePayslip(req:AuthRequest,res:Response){try{const itemId=text(req.body.payrollItemId);const items=await prisma.$queryRawUnsafe<any[]>(`SELECT i.*,r.month,r.year FROM "HrPayrollItem" i JOIN "HrPayrollRun" r ON r.id=i."payrollRunId" WHERE i.id=$1`,itemId);if(!items[0]){res.status(404).json({success:false,message:"Payroll item not found"});return;}const i=items[0];const exists=await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "HrPayslip" WHERE "payrollItemId"=$1`,itemId);if(exists[0]){res.json({success:true,data:exists[0],message:"Payslip already exists"});return;}const n=Number((await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int AS count FROM "HrPayslip"`))[0]?.count||0)+1;const d=await prisma.$queryRawUnsafe<any[]>(`INSERT INTO "HrPayslip" ("payslipNumber","payrollItemId","employeeId","month","year","grossSalary","deductions","netSalary") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,`PS-${i.year}-${String(i.month).padStart(2,"0")}-${String(n).padStart(5,"0")}`,itemId,i.employeeId,i.month,i.year,i.grossSalary,i.deductions,i.netSalary);res.status(201).json({success:true,data:d[0],message:"Payslip generated"});}catch(e){console.error(e);res.status(400).json({success:false,message:"Unable to generate payslip"});}}
