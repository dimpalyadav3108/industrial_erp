# Module 17 — Management Dashboard / Management BI

Final PRD module added cumulatively on top of Module 16.

## PRD coverage
- Dashboard
- Monthly Sales
- Order Pipeline
- Conversion Ratio
- Inquiry Value
- Order Book
- Production WIP
- Production Efficiency
- Delayed Orders
- Purchase Spend
- Vendor Performance
- Receivables
- Cash Flow
- Open Service Tickets
- AMC Revenue
- Engineering Pending
- Drawing Pending
- BOM Pending
- Project Progress
- Open Complaints
- Management BI

## Implementation
Backend endpoint: `GET /api/management-dashboard`
Frontend: existing `/dashboard` route now loads the live Management BI dashboard.

The dashboard calculates KPIs from ERP records at request time. Monthly sales covers the current month plus the previous 11 months. Purchase spend is year-to-date. Conversion ratio uses WON / (WON + LOST) leads. Production efficiency uses produced quantity / planned quantity when production quantities are available, otherwise average production progress. Open complaints are represented by active service requests because the ERP service workflow is the current complaint/ticket register.
