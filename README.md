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
