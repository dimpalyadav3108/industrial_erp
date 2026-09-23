# Module 16 — HR & Payroll

Cumulative implementation added on top of Module 15.

## PRD coverage
- Employee Master + Joining workflow (existing HR employee master enhanced)
- Recruitment + candidate applications
- Attendance
- Biometric event capture
- Shift master + employee shift assignment
- Overtime with approval/payment status
- Payroll + salary structure (existing module retained)
- Payslip generation from payroll item
- Appraisal
- Skill Matrix
- Welder Certification
- Operator Certification
- Training Records + employee participation
- Certification expiry tracking / computed expired status

New API namespace remains `/api/hr` and is authenticated. New persistence is in migration `20260923190000_module16_hr_payroll`.
