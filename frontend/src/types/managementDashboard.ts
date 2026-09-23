export interface ManagementDashboard {
  generatedAt: string;
  monthlySales: { month: string; sales: number }[];
  orderPipeline: { status: string; count: number; value: number }[];
  conversionRatio: number;
  conversionCounts: { won: number; closed: number; total: number };
  inquiryValue: number;
  openInquiries: number;
  orderBook: { count: number; value: number };
  productionWip: { count: number; plannedQty: number; producedQty: number };
  productionEfficiency: number;
  delayedOrders: { count: number; value: number };
  purchaseSpend: { spend: number; orders: number };
  vendorPerformance: { id: string; name: string; score: number; ratings: number }[];
  receivables: { total: number; overdue: number; openInvoices: number };
  cashFlow: { inflow: number; outflow: number; net: number };
  service: { openTickets: number; totalTickets: number };
  amcRevenue: { revenue: number; activeContracts: number };
  engineeringPending: number;
  drawingPending: number;
  bomPending: number;
  projectProgress: { total: number; average: number; delayed: number };
  openComplaints: number;
}
