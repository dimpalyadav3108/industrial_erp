import type { Request, Response } from "express";
import { prisma } from "../config/database.js";

const n = (v: unknown) => Number(v ?? 0);
const rows = async <T = any>(sql: string, ...args: unknown[]) => prisma.$queryRawUnsafe<T[]>(sql, ...args);

export const getManagementDashboard = async (_req: Request, res: Response) => {
  try {
    const [
      monthlySales,
      orderPipeline,
      conversion,
      inquiry,
      orderBook,
      production,
      delayedOrders,
      purchaseSpend,
      vendorPerformance,
      receivables,
      cashFlow,
      service,
      amc,
      engineering,
      drawings,
      boms,
      projects,
      complaints,
    ] = await Promise.all([
      rows(`SELECT TO_CHAR(DATE_TRUNC('month', i."invoiceDate"),'Mon YYYY') AS month, DATE_TRUNC('month', i."invoiceDate") AS month_start, COALESCE(SUM(i."totalAmount"),0) AS sales FROM "SalesInvoice" i WHERE i."status" <> 'CANCELLED' AND i."invoiceDate" >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months' GROUP BY 1,2 ORDER BY month_start`),
      rows(`SELECT s."status", COUNT(*)::int AS count, COALESCE(SUM(s."totalAmount"),0) AS value FROM "SalesOrder" s WHERE s."status" <> 'CANCELLED' GROUP BY s."status" ORDER BY value DESC`),
      rows(`SELECT COUNT(*) FILTER (WHERE "status"='WON')::int AS won, COUNT(*) FILTER (WHERE "status" IN ('WON','LOST'))::int AS closed, COUNT(*)::int AS total FROM "Lead"`),
      rows(`SELECT COALESCE(SUM("estimatedValue"),0) AS value, COUNT(*) FILTER (WHERE "status" NOT IN ('WON','LOST'))::int AS open_count FROM "Lead"`),
      rows(`SELECT COUNT(*)::int AS count, COALESCE(SUM("totalAmount"),0) AS value FROM "SalesOrder" WHERE "status" NOT IN ('CANCELLED','CLOSED')`),
      rows(`SELECT COUNT(*) FILTER (WHERE "status" IN ('RELEASED','IN_PROGRESS','ON_HOLD'))::int AS wip_count, COALESCE(SUM("quantity"),0) AS planned_qty, COALESCE(SUM("producedQuantity"),0) AS produced_qty, COALESCE(AVG("progressPercent"),0) AS avg_progress FROM "ProductionOrder" WHERE "status" NOT IN ('CANCELLED','COMPLETED')`),
      rows(`SELECT COUNT(*)::int AS count, COALESCE(SUM("totalAmount"),0) AS value FROM "SalesOrder" WHERE "status" NOT IN ('CANCELLED','CLOSED') AND "expectedDeliveryDate" IS NOT NULL AND "expectedDeliveryDate" < CURRENT_DATE`),
      rows(`SELECT COALESCE(SUM("totalAmount"),0) AS spend, COUNT(*)::int AS orders FROM "PurchaseOrder" WHERE "status" <> 'CANCELLED' AND "orderDate" >= DATE_TRUNC('year', CURRENT_DATE)`),
      rows(`SELECT v."id", v."name", COALESCE(AVG(r."overallScore"),0) AS score, COUNT(r."id")::int AS ratings FROM "Vendor" v LEFT JOIN "VendorRatingEntry" r ON r."vendorId"=v."id" GROUP BY v."id",v."name" HAVING COUNT(r."id") > 0 ORDER BY score DESC LIMIT 10`),
      rows(`SELECT COALESCE(SUM("balanceAmount"),0) AS total, COALESCE(SUM("balanceAmount") FILTER (WHERE "dueDate" < CURRENT_DATE),0) AS overdue, COUNT(*) FILTER (WHERE "balanceAmount" > 0)::int AS open_invoices FROM "SalesInvoice" WHERE "status" <> 'CANCELLED'`),
      rows(`SELECT COALESCE((SELECT SUM("amount") FROM "SalesPayment"),0) AS inflow, COALESCE((SELECT SUM("amount") FROM "VendorPayment"),0) + COALESCE((SELECT SUM("totalAmount") FROM "FinanceExpense" WHERE "status"='PAID'),0) AS outflow`),
      rows(`SELECT COUNT(*) FILTER (WHERE "status" IN ('OPEN','ASSIGNED','IN_PROGRESS'))::int AS open_tickets, COUNT(*)::int AS total_tickets FROM "ServiceRequest"`),
      rows(`SELECT COALESCE(SUM("contractValue"),0) AS revenue, COUNT(*) FILTER (WHERE "status"='ACTIVE')::int AS active_contracts FROM "ServiceContract" WHERE "contractType"='AMC'`),
      rows(`SELECT COUNT(*) FILTER (WHERE "status" NOT IN ('APPROVED','RELEASED','CANCELLED'))::int AS pending, COUNT(*)::int AS total FROM "EngineeringProject"`),
      rows(`SELECT COUNT(*) FILTER (WHERE "status" IN ('DRAFT','REJECTED'))::int AS pending, COUNT(*)::int AS total FROM "EngineeringDrawing"`),
      rows(`SELECT COUNT(*) FILTER (WHERE "status" IN ('DRAFT','IN_REVIEW'))::int AS pending, COUNT(*)::int AS total FROM "EngineeringBom"`),
      rows(`SELECT COUNT(*)::int AS total, COALESCE(AVG("progressPercent"),0) AS avg_progress, COUNT(*) FILTER (WHERE "plannedEndDate" < CURRENT_DATE AND "status" NOT IN ('COMPLETED','CANCELLED'))::int AS delayed FROM "Project"`),
      rows(`SELECT COUNT(*) FILTER (WHERE "status" IN ('OPEN','ASSIGNED','IN_PROGRESS'))::int AS open_complaints FROM "ServiceRequest"`),
    ]);

    const c = conversion[0] || {};
    const prod = production[0] || {};
    const cash = cashFlow[0] || {};
    const rcv = receivables[0] || {};
    const netCashFlow = n(cash.inflow) - n(cash.outflow);
    const productionEfficiency = n(prod.planned_qty) > 0 ? (n(prod.produced_qty) / n(prod.planned_qty)) * 100 : n(prod.avg_progress);

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        monthlySales: monthlySales.map((x: any) => ({ month: x.month, sales: n(x.sales) })),
        orderPipeline: orderPipeline.map((x: any) => ({ status: x.status, count: Number(x.count || 0), value: n(x.value) })),
        conversionRatio: n(c.closed) ? (n(c.won) / n(c.closed)) * 100 : 0,
        conversionCounts: { won: Number(c.won || 0), closed: Number(c.closed || 0), total: Number(c.total || 0) },
        inquiryValue: n(inquiry[0]?.value),
        openInquiries: Number(inquiry[0]?.open_count || 0),
        orderBook: { count: Number(orderBook[0]?.count || 0), value: n(orderBook[0]?.value) },
        productionWip: { count: Number(prod.wip_count || 0), plannedQty: n(prod.planned_qty), producedQty: n(prod.produced_qty) },
        productionEfficiency,
        delayedOrders: { count: Number(delayedOrders[0]?.count || 0), value: n(delayedOrders[0]?.value) },
        purchaseSpend: { spend: n(purchaseSpend[0]?.spend), orders: Number(purchaseSpend[0]?.orders || 0) },
        vendorPerformance: vendorPerformance.map((x: any) => ({ id: x.id, name: x.name, score: n(x.score), ratings: Number(x.ratings || 0) })),
        receivables: { total: n(rcv.total), overdue: n(rcv.overdue), openInvoices: Number(rcv.open_invoices || 0) },
        cashFlow: { inflow: n(cash.inflow), outflow: n(cash.outflow), net: netCashFlow },
        service: { openTickets: Number(service[0]?.open_tickets || 0), totalTickets: Number(service[0]?.total_tickets || 0) },
        amcRevenue: { revenue: n(amc[0]?.revenue), activeContracts: Number(amc[0]?.active_contracts || 0) },
        engineeringPending: Number(engineering[0]?.pending || 0),
        drawingPending: Number(drawings[0]?.pending || 0),
        bomPending: Number(boms[0]?.pending || 0),
        projectProgress: { total: Number(projects[0]?.total || 0), average: n(projects[0]?.avg_progress), delayed: Number(projects[0]?.delayed || 0) },
        openComplaints: Number(complaints[0]?.open_complaints || 0),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Unable to load management dashboard" });
  }
};
