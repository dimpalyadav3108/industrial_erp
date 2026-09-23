# Industrial ERP

A full-stack Enterprise Resource Planning system designed to manage industrial business operations through one centralized application.

## Live Application

[Open Industrial ERP](http://industrialerp.duckdns.org)

## Overview

Industrial ERP provides integrated modules for managing customers, sales enquiries, estimates, quotations, inventory, production, quality inspection, dispatch, after-sales service, and company settings.

The application uses role-based authentication and provides a responsive operational dashboard for monitoring important business activities.

## Features

- Secure JWT-based authentication
- Persistent user login until manual sign-out
- Dashboard with operational statistics
- Customer and CRM management
- Lead and enquiry tracking
- Product estimation management
- Quotation creation and tracking
- Inventory and stock management
- Production order management
- Quality inspection management
- Product dispatch management
- Service request and AMC management
- Company and ERP settings
- Interactive application search
- Notifications and account menu
- Responsive sidebar navigation
- Audit-ready database structure

## ERP Modules

### Dashboard

Displays key operational information such as active enquiries, open quotations, customers, accepted quotations, and commercial activities.

### CRM and Customers

Maintains customer profiles, contact details, addresses, tax information, and account status.

### Leads and Enquiries

Tracks customer enquiries, lead stages, priorities, assignments, requirements, and expected values.

### Estimation

Creates and manages product estimates, cost calculations, materials, labour, overheads, and approval status.

### Quotations

Generates and tracks commercial quotations, pricing, taxes, validity, customer responses, and acceptance status.

### Inventory

Manages inventory items, stock quantities, reorder levels, units, categories, and stock movements.

### Production

Tracks production orders, quantities, priorities, schedules, responsible employees, and production status.

### Quality

Records quality inspections, inspection results, measurements, defects, remarks, and approval status.

### Dispatch

Manages dispatch records, transport details, tracking information, delivery dates, and dispatch status.

### Service and AMC

Maintains service requests, assigned technicians, service priorities, contracts, warranty information, and annual maintenance contracts.

### Settings

Stores company details, addresses, contact information, tax settings, currency, quotation validity, invoice prefixes, and ERP preferences.

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Lucide React
- CSS

### Backend

- Node.js
- Express.js
- TypeScript
- JWT authentication
- bcrypt
- REST API

### Database

- PostgreSQL
- Prisma ORM
- Prisma migrations

### Deployment

- AWS EC2
- Nginx
- PM2
- DuckDNS
- GitHub

## Project Structure

```text
industrial_erp/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── controllers/
│       ├── generated/
│       ├── middleware/
│       ├── routes/
│       ├── utils/
│       └── server.ts
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── types/
│       ├── App.tsx
│       └── main.tsx
└── README.md

## Module 4 — Engineering Department

Implemented in this cumulative project:
- Sales Order → Engineering Release → Design Creation → GA Drawing → Customer Approval → Fabrication Drawing → BOM Release → Production Release workflow
- Engineering project workflow timestamps and customer-approved version tracking
- Engineering drawing categories: GA, P&ID, Fabrication, Tube Layout, Electrical, Instrumentation, Foundation
- Drawing revision/version tracking including V1.0 / V1.1 / V2.0 style labels, modified-by and modification-reason tracking
- Customer approval workflow for engineering revisions/documents
- Engineering Document Management System (DMS) with version, status, file metadata, approval and audit fields
- Engineering Change Request (ECR): impact analysis, approval, BOM-update flag, production-update flag and implementation tracking
- Database migration: `backend/prisma/migrations/20260923130000_module4_engineering/migration.sql`

Before first run against a database, run Prisma client generation and apply migrations from the backend.


## Module 6 — Procurement
Implemented/extended procurement workflow: Material Requirement/MRP planning, Purchase Requisition and approval, RFQ, vendor quotations and comparison-ready quotation data, Purchase Orders, GRN/material receipt, QC/store posting integration, vendor master categories, vendor portal document uploads (invoice/dispatch/quality certificates), material shortage tracking, and Vendor Rating Engine with quality/delivery/price/service scoring.

## Module 7 — Inventory & Stores

Added inventory/store controls for raw material, semi-finished/WIP, finished goods and consumables; standard warehouse locations (Plate Yard, Tube Yard, Valve Store, Electrical Store, WIP Fabrication, WIP Assembly, FG Boiler Yard, FG Heater Yard, Spare Parts Store); GRN/QC/store flow integration; production issue and finished-goods stock flow; batch/lot/serial and boiler-serial traceability; bin/location records; stock reservations; material returns; and store traceability APIs/UI.

## Module 8 — Production Planning / PPC
Added production planning dashboard, MRP shortage visibility, production stage planning, work-center capacity planning, and planning integration with existing production orders/operations.


## Module 12 — Dispatch & Logistics
- FG Ready → Packing → Loading → Dispatch → Delivery workflow
- E-Way Bill and E-Invoice reference tracking
- LR tracking and vehicle tracking
- Packing List, LR Copy and POD document URL tracking
- Delivery tracking events with location and remarks
- Dispatch logistics milestone timestamps and delivery status
