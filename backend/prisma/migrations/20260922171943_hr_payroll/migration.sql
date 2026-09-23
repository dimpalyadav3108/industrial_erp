-- CreateEnum
CREATE TYPE "HrEmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'PAID_LEAVE', 'WEEK_OFF', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PROCESSED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "HrDepartment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrDesignation" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrDesignation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrEmployee" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "userId" TEXT,
    "departmentId" TEXT,
    "designationId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "exitDate" TIMESTAMP(3),
    "status" "HrEmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "panNumber" TEXT,
    "uanNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrAttendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "workHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrLeaveRequest" (
    "id" TEXT NOT NULL,
    "leaveNumber" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" DECIMAL(6,2) NOT NULL,
    "reason" TEXT,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrSalaryStructure" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basicSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hra" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pfDeduction" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "esiDeduction" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxDeduction" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherDeduction" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrSalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrPayrollRun" (
    "id" TEXT NOT NULL,
    "payrollNumber" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrPayrollItem" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basicSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hra" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payableDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "paidDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPayrollItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HrDepartment_code_key" ON "HrDepartment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HrDepartment_name_key" ON "HrDepartment"("name");

-- CreateIndex
CREATE INDEX "HrDepartment_isActive_idx" ON "HrDepartment"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HrDesignation_code_key" ON "HrDesignation"("code");

-- CreateIndex
CREATE INDEX "HrDesignation_departmentId_idx" ON "HrDesignation"("departmentId");

-- CreateIndex
CREATE INDEX "HrDesignation_isActive_idx" ON "HrDesignation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HrDesignation_departmentId_name_key" ON "HrDesignation"("departmentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HrEmployee_employeeCode_key" ON "HrEmployee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "HrEmployee_userId_key" ON "HrEmployee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HrEmployee_email_key" ON "HrEmployee"("email");

-- CreateIndex
CREATE INDEX "HrEmployee_departmentId_idx" ON "HrEmployee"("departmentId");

-- CreateIndex
CREATE INDEX "HrEmployee_designationId_idx" ON "HrEmployee"("designationId");

-- CreateIndex
CREATE INDEX "HrEmployee_status_idx" ON "HrEmployee"("status");

-- CreateIndex
CREATE INDEX "HrEmployee_joiningDate_idx" ON "HrEmployee"("joiningDate");

-- CreateIndex
CREATE INDEX "HrAttendance_date_idx" ON "HrAttendance"("date");

-- CreateIndex
CREATE INDEX "HrAttendance_status_idx" ON "HrAttendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HrAttendance_employeeId_date_key" ON "HrAttendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HrLeaveRequest_leaveNumber_key" ON "HrLeaveRequest"("leaveNumber");

-- CreateIndex
CREATE INDEX "HrLeaveRequest_employeeId_idx" ON "HrLeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX "HrLeaveRequest_status_idx" ON "HrLeaveRequest"("status");

-- CreateIndex
CREATE INDEX "HrLeaveRequest_startDate_idx" ON "HrLeaveRequest"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "HrSalaryStructure_employeeId_key" ON "HrSalaryStructure"("employeeId");

-- CreateIndex
CREATE INDEX "HrSalaryStructure_effectiveFrom_idx" ON "HrSalaryStructure"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "HrPayrollRun_payrollNumber_key" ON "HrPayrollRun"("payrollNumber");

-- CreateIndex
CREATE INDEX "HrPayrollRun_status_idx" ON "HrPayrollRun"("status");

-- CreateIndex
CREATE INDEX "HrPayrollRun_year_month_idx" ON "HrPayrollRun"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "HrPayrollRun_month_year_key" ON "HrPayrollRun"("month", "year");

-- CreateIndex
CREATE INDEX "HrPayrollItem_employeeId_idx" ON "HrPayrollItem"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "HrPayrollItem_payrollRunId_employeeId_key" ON "HrPayrollItem"("payrollRunId", "employeeId");

-- AddForeignKey
ALTER TABLE "HrDesignation" ADD CONSTRAINT "HrDesignation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "HrDepartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "HrDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "HrDesignation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrAttendance" ADD CONSTRAINT "HrAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrLeaveRequest" ADD CONSTRAINT "HrLeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrSalaryStructure" ADD CONSTRAINT "HrSalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrPayrollItem" ADD CONSTRAINT "HrPayrollItem_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "HrPayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrPayrollItem" ADD CONSTRAINT "HrPayrollItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
