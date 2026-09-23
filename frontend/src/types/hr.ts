export type EmployeeStatus="ACTIVE"|"ON_LEAVE"|"INACTIVE"|"TERMINATED";
export type AttendanceStatus="PRESENT"|"ABSENT"|"HALF_DAY"|"PAID_LEAVE"|"WEEK_OFF"|"HOLIDAY";
export type LeaveStatus="PENDING"|"APPROVED"|"REJECTED"|"CANCELLED";
export type PayrollStatus="DRAFT"|"PROCESSED"|"PAID"|"CANCELLED";
export interface Designation{id:string;departmentId:string;code:string;name:string;isActive:boolean}
export interface Department{id:string;code:string;name:string;description:string|null;isActive:boolean;designations:Designation[];_count?:{employees:number}}
export interface Salary{id:string;basicSalary:string;hra:string;allowances:string;pfDeduction:string;esiDeduction:string;taxDeduction:string;otherDeduction:string;effectiveFrom:string}
export interface Employee{id:string;employeeCode:string;firstName:string;lastName:string;email:string|null;phone:string|null;joiningDate:string;status:EmployeeStatus;employmentType:string;department:Department|null;designation:Designation|null;salary:Salary|null}
export interface Attendance{id:string;date:string;status:AttendanceStatus;workHours:string;notes:string|null;employee:{id:string;employeeCode:string;firstName:string;lastName:string}}
export interface Leave{id:string;leaveNumber:string;leaveType:string;startDate:string;endDate:string;days:string;reason:string|null;status:LeaveStatus;remarks:string|null;employee:Employee}
export interface PayrollItem{id:string;basicSalary:string;hra:string;allowances:string;grossSalary:string;deductions:string;netSalary:string;payableDays:string;paidDays:string;employee:Employee}
export interface PayrollRun{id:string;payrollNumber:string;month:number;year:number;status:PayrollStatus;processedAt:string|null;paidAt:string|null;items:PayrollItem[]}
export interface HrDashboard{activeEmployees:number;departments:number;pendingLeave:number;payrollTotal:number}
export interface PayrollControl{month:number;year:number;activeEmployees:number;employeesWithoutSalary:number;attendanceRecords:number;paidAttendanceDays:number;absenceRecords:number;pendingLeave:number;payrollStatus:string;payrollNet:number}

export type Recruitment = {id:string;requisitionNumber:string;jobTitle:string;departmentId?:string;positions:number;description?:string;status:string;openingDate:string;closingDate?:string};
export type HrShift = {id:string;code:string;name:string;startTime:string;endTime:string;graceMinutes:number;status:string};
export type HrOvertime = {id:string;employeeId:string;date:string;hours:number;rate:number;amount:number;status:string;employeeCode:string;firstName:string;lastName:string};
export type HrBiometric = {id:string;employeeId:string;eventType:string;eventAt:string;biometricId?:string;deviceId?:string;employeeCode:string;firstName:string;lastName:string};
export type HrAppraisal = {id:string;employeeId:string;appraisalPeriod:string;rating:number;goalsScore:number;skillScore:number;attendanceScore:number;status:string;employeeCode:string;firstName:string;lastName:string};
export type HrSkill = {id:string;skillCode:string;name:string;category?:string;employeeCount:number};
export type HrCertification = {id:string;employeeId:string;certificationType:string;certificationName:string;certificateNumber?:string;issueDate?:string;expiryDate?:string;status:string;computedStatus:string;employeeCode:string;firstName:string;lastName:string};
export type HrTraining = {id:string;trainingCode:string;title:string;trainer?:string;provider?:string;startDate:string;endDate?:string;status:string;certificateIssued:boolean};
export type HrPayslip = {id:string;payslipNumber:string;employeeId:string;month:number;year:number;grossSalary:number;deductions:number;netSalary:number;employeeCode:string;firstName:string;lastName:string};
