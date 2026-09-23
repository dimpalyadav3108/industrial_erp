import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, AlertTriangle, BarChart3, Building2, CalendarClock, CheckCircle2, CircleDollarSign, ClipboardList, Factory, FileClock, Gauge, IndianRupee, RefreshCw, ShoppingCart, Ticket, TrendingUp, Users, WalletCards } from "lucide-react";
import { getStoredUser } from "../services/auth.service";
import { getManagementDashboard } from "../services/managementDashboard.service";
import type { ManagementDashboard } from "../types/managementDashboard";
import "./DashboardPage.css";

const money = (v:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v||0);
const pct = (v:number) => `${(v||0).toFixed(1)}%`;
const title = (s:string) => s.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

function Kpi({icon,label,value,sub}:{icon:ReactNode;label:string;value:string;sub:string}){
  return <article className="metric-card management-kpi"><div className="kpi-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{sub}</small></article>;
}
function Section({title:heading,icon,children}:{title:string;icon:ReactNode;children:ReactNode}){
  return <article className="content-card management-section"><div className="card-heading"><div><span>Management BI</span><h2>{heading}</h2></div>{icon}</div>{children}</article>;
}

export function DashboardPage(){
  const user=getStoredUser();
  const [data,setData]=useState<ManagementDashboard|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const load=useCallback(async()=>{try{setLoading(true);setError("");setData(await getManagementDashboard())}catch(e){setError(e instanceof Error?e.message:"Unable to load management dashboard")}finally{setLoading(false)}},[]);
  useEffect(()=>{void load()},[load]);
  const maxSales=useMemo(()=>Math.max(1,...(data?.monthlySales||[]).map(x=>x.sales)),[data]);
  const maxPipeline=useMemo(()=>Math.max(1,...(data?.orderPipeline||[]).map(x=>x.value)),[data]);
  const d=data;
  return <section className="dashboard-content live-dashboard management-dashboard">
    <div className="page-heading"><div><span className="eyebrow">CEO / MANAGEMENT BI</span><h1>Good day, {user?.firstName||"Administrator"}</h1><p>Enterprise-wide commercial, production, procurement, finance, engineering and service position.</p></div><button className="secondary-action" onClick={()=>void load()} disabled={loading}><RefreshCw size={17}/> {loading?"Refreshing…":"Refresh dashboard"}</button></div>
    {error&&<div className="page-error dashboard-error">{error}</div>}
    <div className="metric-grid">
      <Kpi icon={<IndianRupee/>} label="Monthly Sales" value={d?money(d.monthlySales.at(-1)?.sales||0):"—"} sub="Current calendar month invoiced sales"/>
      <Kpi icon={<ShoppingCart/>} label="Order Book" value={d?money(d.orderBook.value):"—"} sub={`${d?.orderBook.count||0} open sales orders`}/>
      <Kpi icon={<TrendingUp/>} label="Conversion Ratio" value={d?pct(d.conversionRatio):"—"} sub={`${d?.conversionCounts.won||0} won / ${d?.conversionCounts.closed||0} closed`}/>
      <Kpi icon={<CircleDollarSign/>} label="Inquiry Value" value={d?money(d.inquiryValue):"—"} sub={`${d?.openInquiries||0} open enquiries`}/>
      <Kpi icon={<Factory/>} label="Production WIP" value={d?String(d.productionWip.count):"—"} sub={`${d?.productionWip.producedQty||0} / ${d?.productionWip.plannedQty||0} qty produced`}/>
      <Kpi icon={<Gauge/>} label="Production Efficiency" value={d?pct(d.productionEfficiency):"—"} sub="Produced quantity / planned quantity"/>
      <Kpi icon={<AlertTriangle/>} label="Delayed Orders" value={d?String(d.delayedOrders.count):"—"} sub={d?money(d.delayedOrders.value)+" delayed order value":"—"}/>
      <Kpi icon={<ShoppingCart/>} label="Purchase Spend" value={d?money(d.purchaseSpend.spend):"—"} sub={`${d?.purchaseSpend.orders||0} purchase orders this year`}/>
      <Kpi icon={<WalletCards/>} label="Receivables" value={d?money(d.receivables.total):"—"} sub={d?money(d.receivables.overdue)+" overdue":"—"}/>
      <Kpi icon={<Activity/>} label="Cash Flow" value={d?money(d.cashFlow.net):"—"} sub={d?`In ${money(d.cashFlow.inflow)} · Out ${money(d.cashFlow.outflow)}`:"—"}/>
      <Kpi icon={<Ticket/>} label="Open Service Tickets" value={d?String(d.service.openTickets):"—"} sub={`${d?.service.totalTickets||0} total service tickets`}/>
      <Kpi icon={<CalendarClock/>} label="AMC Revenue" value={d?money(d.amcRevenue.revenue):"—"} sub={`${d?.amcRevenue.activeContracts||0} active AMC contracts`}/>
    </div>
    <div className="dashboard-grid management-grid">
      <Section title="Monthly Sales Trend" icon={<BarChart3 size={22}/>}><div className="management-bars">{(d?.monthlySales||[]).map(x=><div className="management-bar-col" key={x.month}><strong>{money(x.sales)}</strong><div><span style={{height:`${Math.max(6,(x.sales/maxSales)*100)}%`}}/></div><small>{x.month}</small></div>)}</div></Section>
      <Section title="Order Pipeline" icon={<ClipboardList size={22}/>}><div className="pipeline-list">{(d?.orderPipeline||[]).map(x=><div className="pipeline-row" key={x.status}><div><b>{title(x.status)}</b><small>{x.count} order(s)</small></div><strong>{money(x.value)}</strong><span><i style={{width:`${Math.max(2,(x.value/maxPipeline)*100)}%`}}/></span></div>)}</div></Section>
      <Section title="Engineering / Drawing / BOM Pending" icon={<FileClock size={22}/>}><div className="bi-count-grid"><div><strong>{d?.engineeringPending||0}</strong><span>Engineering</span></div><div><strong>{d?.drawingPending||0}</strong><span>Drawings</span></div><div><strong>{d?.bomPending||0}</strong><span>BOMs</span></div></div><p className="bi-note">Pending work is based on current workflow statuses and excludes released/approved records.</p></Section>
      <Section title="Projects & Delays" icon={<Building2 size={22}/>}><div className="bi-count-grid"><div><strong>{pct(d?.projectProgress.average||0)}</strong><span>Average progress</span></div><div><strong>{d?.projectProgress.total||0}</strong><span>Total projects</span></div><div><strong>{d?.projectProgress.delayed||0}</strong><span>Delayed</span></div></div></Section>
      <Section title="Vendor Performance" icon={<Users size={22}/>}><div className="vendor-list">{(d?.vendorPerformance||[]).map(v=><div className="vendor-row" key={v.id}><span>{v.name}<small>{v.ratings} rating(s)</small></span><strong>{v.score.toFixed(1)}/100</strong></div>)}</div></Section>
      <Section title="Service & Customer Complaints" icon={<Ticket size={22}/>}><div className="bi-count-grid"><div><strong>{d?.service.openTickets||0}</strong><span>Open tickets</span></div><div><strong>{d?.openComplaints||0}</strong><span>Open complaints</span></div><div><strong>{d?.service.totalTickets||0}</strong><span>Total tickets</span></div></div><p className="bi-note">Open complaints are represented by active service requests in the current service workflow.</p></Section>
    </div>
    <div className="management-footer"><CheckCircle2 size={18}/> <span>Dashboard data is calculated from live ERP records at refresh time.</span></div>
  </section>;
}
