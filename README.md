Industrial ERP

A full-stack Manufacturing + Engineering + Project + Service ERP
designed for industrial equipment and boiler-manufacturing workflows.
The system connects the business lifecycle from CRM and estimation
through engineering, procurement, production, quality, dispatch,
installation, service, finance, HR, IoT monitoring, and management
reporting.

Live Application: http://3.223.87.25/

Project Overview

Industrial ERP is designed for organizations whose operations are more
complex than a simple trading ERP. It supports technical sales,
engineered products, multi-stage manufacturing, project execution,
installation/commissioning, and after-sales service in one integrated
system.

The application uses a React/TypeScript frontend, an Express/TypeScript
API, PostgreSQL with Prisma ORM, and a production deployment using AWS
EC2, PM2, and Nginx.

Core Functional Areas

Area                                Main Capabilities

Dashboard                           Operational overview and management KPIs

CRM & Customers                     Customer master, customer information
and commercial/technical data

Leads & Enquiries                   Lead pipeline, technical qualification,
activities, surveys, tender and
competitor tracking

Estimation & Costing                RFQ, engineering validation, BOM
estimation,
material/fabrication/testing/logistics
costing and margin review

Quotations                          Quotation preparation, release, approval
and history

Engineering                         Engineering projects, drawings,
revisions, documents, approval workflow
and engineering change requests

BOM Management                      Multi-level engineering BOM, BOM items,
revision/change support and cost roll-up

Procurement                         Material planning, vendors, PR, RFQ,
vendor quotations, comparison, PO, GRN
and vendor ratings

Sales & Invoicing                   Sales orders, order items, invoices,
payments, dispatch notes and E-Way Bill
records

Projects & Milestones               Project lifecycle, milestones, tasks and
project cost tracking

Inventory & Stores                  Inventory items, locations, stock units,
reservations, movements and material
returns

Production                          Production orders, work centers,
machines, operations, job cards,
consumption, traceability and downtime

Shop Floor                          Digital production tracking, WIP,
efficiency, delay and production
visibility

Quality                             Inspections, check items, ITP, IBR
documents, welding records, NCR and CAPA

Dispatch & Logistics                Dispatch planning, logistics, tracking
events and delivery workflow

Installation & Commissioning        Installation jobs, checklists,
commissioning tests, site updates,
reports and spare movements

Service & AMC                       Service requests, site visits,
activities, feedback, warranty, AMC and
preventive maintenance

Finance & Accounts                  Accounts, journals, receipts, vendor
bills/payments, expenses, TDS, revenue
recognition and product costing

HR & Payroll                        Employees, attendance, leave, payroll,
recruitment, shifts, overtime,
appraisal, skills, certifications and
training

IoT & Management                    IoT devices, sensor readings, alerts and
management dashboard reporting

Settings                            Company and application settings

Business Flow

Lead / Enquiry
      ↓
Technical Qualification
      ↓
Estimation & Costing
      ↓
Quotation
      ↓
Customer Approval
      ↓
Sales Order
      ↓
Engineering + BOM
      ↓
Procurement / Inventory
      ↓
Production / Shop Floor
      ↓
Quality Inspection
      ↓
Project / Dispatch
      ↓
Installation & Commissioning
      ↓
Service / AMC
      ↓
Finance + Management Reporting

Technology Stack

Frontend

React 19

TypeScript

Vite

React Router

Lucide React

HTML/CSS

Backend

Node.js

Express 5

TypeScript

Prisma ORM 7

PostgreSQL

Zod validation

JWT authentication

bcryptjs

Helmet, CORS and Morgan

Production Deployment

AWS EC2

Ubuntu

Nginx

PM2

PostgreSQL

Git/GitHub

Architecture

Browser
   │
   ▼
Nginx
   ├── Frontend static build (React/Vite)
   │
   └── /api → Node.js / Express API
                    │
                    ▼
                Prisma ORM
                    │
                    ▼
                PostgreSQL

The production frontend uses /api as its API base URL so requests are
routed through Nginx to the backend service.

Repository Structure

industrial_erp/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── generated/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.ts
│   ├── package.json
│   └── prisma7.config.ts
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
└── README.md

Local Setup

Prerequisites

Install: - Node.js - npm - PostgreSQL - Git

1. Clone the repository

git clone https://github.com/dimpalyadav3108/industrial_erp.git
cd industrial_erp
git checkout release/final-erp

2. Backend setup

cd backend
npm install

Create backend/.env using your own environment values. Do not
commit credentials.

Typical configuration includes:

DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-a-secure-secret
CLIENT_URL=http://localhost:5173
PORT=5000

Generate Prisma Client and apply the appropriate database migrations:

npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts

Start the backend:

npm run dev

3. Frontend setup

Open another terminal:

cd frontend
npm install

For local development, create a frontend environment file if required:

VITE_API_URL=http://localhost:5000/api

Start the frontend:

npm run dev

Production Build

Frontend:

cd frontend
npm ci
printf 'VITE_API_URL=/api\n' > .env.production
npm run build

Backend:

cd backend
npm ci
npx prisma generate --config prisma7.config.ts
npx tsc --noEmit
npm start

For production database changes, use committed Prisma migrations and
prisma migrate deploy. Avoid destructive reset commands on production
data.

Authentication & Security

The system includes protected application routes and token-based
authentication. The backend also uses security middleware including
Helmet and CORS. Environment files and credentials should remain outside
version control.

Health Check

The backend exposes:

GET /api/health

It verifies that the API and database connection are available.

Current Deployment

Application: http://3.223.87.25/

Release branch: release/final-erp

Production process manager: PM2

Reverse proxy / static server: Nginx

Database: PostgreSQL

The public IP is deployment-specific and can change if the server
configuration changes.

Intended Use

This project demonstrates an integrated industrial ERP workflow suitable
for manufacturing and engineering operations, especially businesses
managing engineered products, production, projects,
installation/commissioning, and after-sales service.

Important Notes

Never commit .env files, database passwords, JWT secrets, or
production credentials.

Back up the production database before applying new migrations.

Test backend TypeScript, Prisma generation, frontend TypeScript, and
the production build before deployment.

Keep production API configuration environment-specific.

License

No open-source license is declared in this project. Add a license only
if you intend to permit reuse or redistrib
