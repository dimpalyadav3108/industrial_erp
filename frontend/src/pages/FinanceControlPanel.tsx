import { useMemo } from "react";
import { AlertTriangle, BadgeIndianRupee, CalendarClock, ReceiptIndianRupee, WalletCards } from "lucide-react";
import type { FinanceDashboard, FinanceExpense, Receivable, VendorBill } from "../types/finance";

const n=(v:unknown)=>Number(v??0);
const money=(v:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v);
const daysLate=(due:string|null)=>due?Math.max(0,Math.floor((Date.now()-new Date(due).getTime())/86400000)):0;
const bucket=(days:number)=>days<=0?"Current":days<=30?"1–30":days<=60?"31–60":days<=90?"61–90":"90+";

export default function FinanceControlPanel({dashboard,receivables,bills,expenses}:{dashboard:FinanceDashboard|null;receivables:Receivable[];bills:VendorBill[];expenses:FinanceExpense[]}) {
 const aging=useMemo(()=>{
   const labels=["Current","1–30","31–60","61–90","90+"];
   return labels.map(label=>({
     label,
     ar:receivables.filter(x=>n(x.balanceAmount)>0&&bucket(daysLate(x.dueDate))===label).reduce((s,x)=>s+n(x.balanceAmount),0),
     ap:bills.filter(x=>n(x.balanceAmount)>0&&bucket(daysLate(x.dueDate))===label).reduce((s,x)=>s+n(x.balanceAmount),0)
   }));
 },[receivables,bills]);
 const tax=expenses.reduce((s,x)=>s+n(x.taxAmount),0);
 const overdueAR=receivables.filter(x=>daysLate(x.dueDate)>0&&n(x.balanceAmount)>0).length;
 const overdueAP=bills.filter(x=>daysLate(x.dueDate)>0&&n(x.balanceAmount)>0).length;
 return <section className="finance-control-panel">
   <div className="fcp-head"><div><span>FINANCE INTELLIGENCE</span><h2>Cash Flow, Ageing & Tax Control</h2><p>Operational finance indicators calculated from your current ERP records.</p></div></div>
   <div className="fcp-kpis">
    <K icon={<BadgeIndianRupee/>} label="Overdue Receivables" value={money(n(dashboard?.overdueReceivables))} sub={`${overdueAR} open invoice(s)`}/>
    <K icon={<WalletCards/>} label="Overdue Payables" value={money(n(dashboard?.overduePayables))} sub={`${overdueAP} open bill(s)`}/>
    <K icon={<ReceiptIndianRupee/>} label="Expense Tax Recorded" value={money(tax)} sub="Tax amount on expenses"/>
    <K icon={<CalendarClock/>} label="Net Working Balance" value={money(n(dashboard?.receivable)-n(dashboard?.payable))} sub="Receivables minus payables"/>
   </div>
   <div className="fcp-grid">
    <div className="fcp-card"><h3>Receivable / Payable Ageing</h3><p>Outstanding balances grouped by due-date age.</p>
      <div className="fcp-table"><table><thead><tr><th>Age</th><th>Receivable</th><th>Payable</th></tr></thead><tbody>
       {aging.map(x=><tr key={x.label}><td>{x.label}</td><td>{money(x.ar)}</td><td>{money(x.ap)}</td></tr>)}
      </tbody></table></div>
    </div>
    <div className="fcp-card"><h3>Control Alerts</h3><p>Items that currently need finance attention.</p>
      <div className="fcp-alerts">
       <A text={`${overdueAR} overdue customer invoice(s)`} active={overdueAR>0}/>
       <A text={`${overdueAP} overdue vendor bill(s)`} active={overdueAP>0}/>
       <A text={`${bills.filter(x=>x.status==="PARTIALLY_PAID").length} partially paid vendor bill(s)`} active={bills.some(x=>x.status==="PARTIALLY_PAID")}/>
       <A text={`${expenses.filter(x=>x.status==="DRAFT").length} draft expense(s) awaiting approval`} active={expenses.some(x=>x.status==="DRAFT")}/>
      </div>
    </div>
   </div>
   <div className="fcp-note"><AlertTriangle size={16}/><span>GST note: the current database exposes a general expense tax amount, but not separate CGST/SGST/IGST fields. This panel therefore does not invent a statutory GST split.</span></div>
 </section>
}
function K({icon,label,value,sub}:{icon:React.ReactNode;label:string;value:string;sub:string}){return <article className="fcp-kpi"><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></article>}
function A({text,active}:{text:string;active:boolean}){return <div className={`fcp-alert ${active?"active":""}`}><span></span>{text}</div>}
