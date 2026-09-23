# Module 15 — Finance

Implemented cumulatively on top of Module 14.

## Coverage
- Accounts Receivable and existing Sales Invoice management
- Payment follow-up tracker
- Customer receipts linked to Sales Invoice and AR balance
- Accounts Payable and existing Vendor Invoice/Bill management
- Vendor payment approval workflow (Pending → Approved/Rejected)
- Vendor payment updates AP balance only after approval
- P&L
- Balance Sheet
- Cash Flow
- GST summary with input/output/net GST
- TDS records and summary
- Customer profitability
- Product/service profitability using configurable standard cost per item description
- Project profitability
- Milestone revenue recognition
- Percentage-completion revenue recognition
- Dispatch revenue recognition
- Commissioning revenue recognition
- Finance control panel integrated into the existing `/finance` page

## Main API additions
- `/api/finance/receipts`
- `/api/finance/payment-followups`
- `/api/finance/vendor-payment-approvals`
- `/api/finance/reports/cash-flow`
- `/api/finance/reports/customer-profitability`
- `/api/finance/reports/product-profitability`
- `/api/finance/reports/project-profitability`
- `/api/finance/revenue-recognition`
- `/api/finance/tds-summary`
- `/api/finance/tds`
- `/api/finance/product-costs`

The existing Finance page remains the entry point; the Module 15 section is embedded on `/finance` so earlier finance functionality is preserved.
