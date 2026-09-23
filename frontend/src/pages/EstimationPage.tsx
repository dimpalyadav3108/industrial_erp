import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Calculator, Eye, FileCheck2, Plus, Search, Trash2, X } from "lucide-react";
import { getLeads } from "../services/lead.service";
import { createEstimate, getEstimates, updateEstimateStatus } from "../services/estimate.service";
import type { Lead } from "../types/lead";
import type { CreateEstimatePayload, Estimate, EstimateItemType, EstimateStatus } from "../types/estimate";

interface ItemForm { itemType: EstimateItemType; description: string; quantity: string; unit: string; unitRate: string }
interface TechnicalForm {
  productFamily:string; productModel:string; processIndustry:string; fuelType:string; capacityTph:string;
  requiredSteamConsumption:string; workingPressureBar:string; designPressureBar:string; steamTemperatureC:string;
  feedWaterTemperatureC:string; flueGasTemperatureC:string; operatingHoursPerDay:string; operatingDaysPerYear:string;
  fuelConsumptionPerHour:string; fuelCalorificValueKcalKg:string; fuelPricePerUnit:string;
  existingBoilerEfficiency:string; proposedBoilerEfficiency:string; technicalNotes:string;
}
const newItem=():ItemForm=>({itemType:"MATERIAL",description:"",quantity:"1",unit:"Nos",unitRate:""});
const newTechnical=():TechnicalForm=>({productFamily:"",productModel:"",processIndustry:"",fuelType:"",capacityTph:"",
 requiredSteamConsumption:"",workingPressureBar:"",designPressureBar:"",steamTemperatureC:"",feedWaterTemperatureC:"",
 flueGasTemperatureC:"",operatingHoursPerDay:"",operatingDaysPerYear:"",fuelConsumptionPerHour:"",
 fuelCalorificValueKcalKg:"",fuelPricePerUnit:"",existingBoilerEfficiency:"",proposedBoilerEfficiency:"",technicalNotes:""});
const statusLabels:Record<EstimateStatus,string>={DRAFT:"Draft",IN_REVIEW:"In review",APPROVED:"Approved",REJECTED:"Rejected",CONVERTED:"Converted"};
const money=(v:number|string|null)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(v||0));
const date=(v:string|null)=>v?new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(v)):"Not specified";
const optionalNumber=(v:string)=>v.trim()===""?undefined:Number(v);

export default function EstimationPage(){
 const [estimates,setEstimates]=useState<Estimate[]>([]),[leads,setLeads]=useState<Lead[]>([]);
 const [search,setSearch]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [busyId,setBusyId]=useState<string|null>(null),[error,setError]=useState(""),[showForm,setShowForm]=useState(false);
 const [selected,setSelected]=useState<Estimate|null>(null),[leadId,setLeadId]=useState("");
 const [status,setStatus]=useState<EstimateStatus>("DRAFT"),[marginPercent,setMarginPercent]=useState("10");
 const [taxPercent,setTaxPercent]=useState("18"),[validUntil,setValidUntil]=useState(""),[notes,setNotes]=useState("");
 const [items,setItems]=useState<ItemForm[]>([newItem()]),[technical,setTechnical]=useState<TechnicalForm>(newTechnical());

 const loadData=useCallback(async(searchValue="")=>{try{setLoading(true);setError("");
  const [e,l]=await Promise.all([getEstimates(searchValue),getLeads()]);setEstimates(e);
  setLeads(l.filter(x=>["QUALIFIED","TECHNICAL_REVIEW","ESTIMATION"].includes(x.status)));
 }catch(e){setError(e instanceof Error?e.message:"Unable to load estimates")}finally{setLoading(false)}},[]);
 useEffect(()=>{void loadData()},[loadData]);

 const liveTotals=useMemo(()=>{const base=items.reduce((s,i)=>s+Number(i.quantity||0)*Number(i.unitRate||0),0);
  const subtotal=base+base*(Number(marginPercent||0)/100),tax=subtotal*(Number(taxPercent||0)/100);
  return{base,subtotal,tax,total:subtotal+tax}},[items,marginPercent,taxPercent]);
 const engineering=useMemo(()=>{const fuel=Number(technical.fuelConsumptionPerHour||0),cv=Number(technical.fuelCalorificValueKcalKg||0);
  const oldEff=Number(technical.existingBoilerEfficiency||0),newEff=Number(technical.proposedBoilerEfficiency||0);
  const hours=Number(technical.operatingHoursPerDay||0),days=Number(technical.operatingDaysPerYear||0),price=Number(technical.fuelPricePerUnit||0);
  const output=fuel&&cv&&newEff?(fuel*cv*(newEff/100))/539000:Number(technical.capacityTph||0);
  const saving=fuel&&oldEff&&newEff>oldEff?fuel*(1-oldEff/newEff):0; const annual=saving*hours*days;
  return{output,saving,annual,cost:annual*price}},[technical]);
 const summary=useMemo(()=>({total:estimates.length,drafts:estimates.filter(x=>x.status==="DRAFT").length,
  approved:estimates.filter(x=>x.status==="APPROVED").length,value:estimates.reduce((s,x)=>s+Number(x.totalAmount),0)}),[estimates]);

 const resetForm=()=>{setLeadId("");setStatus("DRAFT");setMarginPercent("10");setTaxPercent("18");setValidUntil("");
  setNotes("");setItems([newItem()]);setTechnical(newTechnical());setError("")};
 const updateItem=(i:number,f:keyof ItemForm,v:string)=>setItems(c=>c.map((x,n)=>n===i?{...x,[f]:v}:x));
 const tech=(f:keyof TechnicalForm,v:string)=>setTechnical(c=>({...c,[f]:v}));

 const handleCreate=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!leadId){setError("Please select a qualified lead");return}
  if(technical.designPressureBar&&technical.workingPressureBar&&Number(technical.designPressureBar)<Number(technical.workingPressureBar)){
   setError("Design pressure should be at least the working pressure");return}
  try{setSaving(true);setError("");
   const payload:CreateEstimatePayload={leadId,status,marginPercent:Number(marginPercent),taxPercent:Number(taxPercent),
    ...(validUntil?{validUntil}:{}),...(notes?{notes}:{}),
    ...(technical.productFamily?{productFamily:technical.productFamily}:{}),...(technical.productModel?{productModel:technical.productModel}:{}),
    ...(technical.processIndustry?{processIndustry:technical.processIndustry}:{}),...(technical.fuelType?{fuelType:technical.fuelType}:{}),
    capacityTph:optionalNumber(technical.capacityTph),requiredSteamConsumption:optionalNumber(technical.requiredSteamConsumption),
    workingPressureBar:optionalNumber(technical.workingPressureBar),designPressureBar:optionalNumber(technical.designPressureBar),
    steamTemperatureC:optionalNumber(technical.steamTemperatureC),feedWaterTemperatureC:optionalNumber(technical.feedWaterTemperatureC),
    flueGasTemperatureC:optionalNumber(technical.flueGasTemperatureC),operatingHoursPerDay:optionalNumber(technical.operatingHoursPerDay),
    operatingDaysPerYear:optionalNumber(technical.operatingDaysPerYear),fuelConsumptionPerHour:optionalNumber(technical.fuelConsumptionPerHour),
    fuelCalorificValueKcalKg:optionalNumber(technical.fuelCalorificValueKcalKg),fuelPricePerUnit:optionalNumber(technical.fuelPricePerUnit),
    existingBoilerEfficiency:optionalNumber(technical.existingBoilerEfficiency),proposedBoilerEfficiency:optionalNumber(technical.proposedBoilerEfficiency),
    ...(technical.technicalNotes?{technicalNotes:technical.technicalNotes}:{}),
    items: items.map((i) => ({
      itemType: i.itemType,
      description: i.description,
      quantity: Number(i.quantity),
      unit: i.unit,
      unitRate: Number(i.unitRate),
    })),
   };
   await createEstimate(payload);setShowForm(false);resetForm();await loadData(search)
  }catch(e){setError(e instanceof Error?e.message:"Unable to create estimate")}finally{setSaving(false)}};
 const handleStatus=async(x:Estimate,s:EstimateStatus)=>{try{setBusyId(x.id);setError("");const u=await updateEstimateStatus(x.id,s);
  setEstimates(c=>c.map(r=>r.id===u.id?u:r))}catch(e){setError(e instanceof Error?e.message:"Unable to update status")}finally{setBusyId(null)}};

 return <section className="module-page estimation-page">
  <div className="module-heading"><div><span className="page-eyebrow">COST & BOILER ENGINEERING</span><h1>Estimation</h1>
   <p>Create commercial estimates with boiler specifications, efficiency and fuel-saving analysis.</p></div>
   <button className="primary-action" type="button" onClick={()=>{resetForm();setShowForm(true)}}><Plus size={19}/> New estimate</button></div>
  <div className="estimation-summary-grid">
   <article><Calculator size={24}/><div><strong>{summary.total}</strong><span>Total estimates</span></div></article>
   <article><FileCheck2 size={24}/><div><strong>{summary.drafts}</strong><span>Drafts</span></div></article>
   <article><FileCheck2 size={24}/><div><strong>{summary.approved}</strong><span>Approved</span></div></article>
   <article><Calculator size={24}/><div><strong>{money(summary.value)}</strong><span>Estimated value</span></div></article>
  </div>
  <div className="directory-card"><div className="directory-header"><div><h2>Estimate register</h2><p>{estimates.length} records shown</p></div>
   <form className="directory-search" onSubmit={e=>{e.preventDefault();void loadData(search)}}><Search size={19}/><input value={search} placeholder="Search estimate, boiler, lead or customer..." onChange={e=>setSearch(e.target.value)}/><button type="submit">Search</button></form></div>
   {error&&!showForm&&<div className="page-error">{error}</div>}
   {loading?<div className="empty-state"><div className="loading-spinner"/><h3>Loading estimates...</h3></div>:estimates.length===0?
    <div className="empty-state"><span className="empty-state-icon"><Calculator size={34}/></span><h3>No estimates found</h3><p>Create a technical cost estimate for a qualified enquiry.</p></div>:
    <div className="table-scroll"><table className="data-table estimate-table"><thead><tr><th>Estimate</th><th>Lead / Customer</th><th>Boiler</th><th>Version</th><th>Status</th><th>Total</th><th>Action</th></tr></thead>
    <tbody>{estimates.map(x=><tr key={x.id}><td><div className="lead-title-cell"><strong>{x.estimateNumber}</strong><span>{date(x.createdAt)}</span></div></td>
    <td><div className="lead-title-cell"><strong>{x.lead.title}</strong><span>{x.lead.customer?.companyName||"No customer"}</span></div></td>
    <td><div className="lead-title-cell"><strong>{x.productFamily||"—"}</strong><span>{x.productModel||x.fuelType||"Technical data not added"}</span></div></td><td>V{x.version}</td>
    <td><select className="estimate-status-select" value={x.status} disabled={busyId===x.id} onChange={e=>void handleStatus(x,e.target.value as EstimateStatus)}>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></td>
    <td><strong>{money(x.totalAmount)}</strong></td><td><button className="row-action-button" type="button" onClick={()=>setSelected(x)}><Eye size={17}/></button></td></tr>)}</tbody></table></div>}
  </div>

  {showForm&&<div className="modal-backdrop" role="presentation" onMouseDown={()=>!saving&&setShowForm(false)}>
   <div className="estimate-form-modal boiler-estimate-modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
    <div className="modal-header"><div><span className="page-eyebrow">NEW TECHNICAL COST SHEET</span><h2>Create boiler estimate</h2><p>Technical requirement, efficiency analysis and commercial costing.</p></div><button className="icon-button" type="button" onClick={()=>setShowForm(false)}><X size={21}/></button></div>
    <form onSubmit={handleCreate}>{error&&<div className="page-error">{error}</div>}
     <div className="estimate-top-fields">
      <label>Qualified lead<select required value={leadId} onChange={e=>setLeadId(e.target.value)}><option value="">Select lead</option>{leads.map(l=><option key={l.id} value={l.id}>{l.leadNumber} — {l.title}</option>)}</select></label>
      <label>Status<select value={status} onChange={e=>setStatus(e.target.value as EstimateStatus)}>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      <label>Margin %<input type="number" min="0" max="100" value={marginPercent} onChange={e=>setMarginPercent(e.target.value)}/></label>
      <label>Tax %<input type="number" min="0" max="100" value={taxPercent} onChange={e=>setTaxPercent(e.target.value)}/></label>
      <label>Valid until<input type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)}/></label>
     </div>

     <div className="estimate-items-heading"><div><h3>Boiler technical specification</h3><p>Enter the enquiry and operating parameters.</p></div></div>
     <div className="boiler-tech-grid">
      <label>Product family<input placeholder="Steam Boiler / Thermic Fluid Heater" value={technical.productFamily} onChange={e=>tech("productFamily",e.target.value)}/></label>
      <label>Product model<input placeholder="Model / series" value={technical.productModel} onChange={e=>tech("productModel",e.target.value)}/></label>
      <label>Industry / process<input placeholder="Textile, pharma, food..." value={technical.processIndustry} onChange={e=>tech("processIndustry",e.target.value)}/></label>
      <label>Fuel type<input placeholder="Natural gas, biomass..." value={technical.fuelType} onChange={e=>tech("fuelType",e.target.value)}/></label>
      <label>Capacity (TPH)<input type="number" min="0" step="0.001" value={technical.capacityTph} onChange={e=>tech("capacityTph",e.target.value)}/></label>
      <label>Required steam (TPH)<input type="number" min="0" step="0.001" value={technical.requiredSteamConsumption} onChange={e=>tech("requiredSteamConsumption",e.target.value)}/></label>
      <label>Working pressure (bar)<input type="number" min="0" step="0.01" value={technical.workingPressureBar} onChange={e=>tech("workingPressureBar",e.target.value)}/></label>
      <label>Design pressure (bar)<input type="number" min="0" step="0.01" value={technical.designPressureBar} onChange={e=>tech("designPressureBar",e.target.value)}/></label>
      <label>Steam temperature °C<input type="number" min="0" step="0.1" value={technical.steamTemperatureC} onChange={e=>tech("steamTemperatureC",e.target.value)}/></label>
      <label>Feed-water temperature °C<input type="number" min="0" step="0.1" value={technical.feedWaterTemperatureC} onChange={e=>tech("feedWaterTemperatureC",e.target.value)}/></label>
      <label>Flue-gas temperature °C<input type="number" min="0" step="0.1" value={technical.flueGasTemperatureC} onChange={e=>tech("flueGasTemperatureC",e.target.value)}/></label>
      <label>Fuel consumption / hour<input type="number" min="0" step="0.001" value={technical.fuelConsumptionPerHour} onChange={e=>tech("fuelConsumptionPerHour",e.target.value)}/></label>
      <label>Fuel CV (kcal/kg)<input type="number" min="0" step="0.01" value={technical.fuelCalorificValueKcalKg} onChange={e=>tech("fuelCalorificValueKcalKg",e.target.value)}/></label>
      <label>Fuel price / unit ₹<input type="number" min="0" step="0.01" value={technical.fuelPricePerUnit} onChange={e=>tech("fuelPricePerUnit",e.target.value)}/></label>
      <label>Existing efficiency %<input type="number" min="0" max="100" step="0.01" value={technical.existingBoilerEfficiency} onChange={e=>tech("existingBoilerEfficiency",e.target.value)}/></label>
      <label>Proposed efficiency %<input type="number" min="0" max="100" step="0.01" value={technical.proposedBoilerEfficiency} onChange={e=>tech("proposedBoilerEfficiency",e.target.value)}/></label>
      <label>Operating hours / day<input type="number" min="0" max="24" step="0.1" value={technical.operatingHoursPerDay} onChange={e=>tech("operatingHoursPerDay",e.target.value)}/></label>
      <label>Operating days / year<input type="number" min="0" max="366" step="1" value={technical.operatingDaysPerYear} onChange={e=>tech("operatingDaysPerYear",e.target.value)}/></label>
     </div>
     <div className="boiler-analysis-grid"><span>Calculated output<strong>{engineering.output.toFixed(3)} TPH</strong></span><span>Fuel saving<strong>{engineering.saving.toFixed(3)} / hr</strong></span><span>Annual fuel saving<strong>{engineering.annual.toFixed(2)}</strong></span><span>Annual cost saving<strong>{money(engineering.cost)}</strong></span></div>
     <label className="estimate-notes">Technical notes<textarea rows={3} value={technical.technicalNotes} onChange={e=>tech("technicalNotes",e.target.value)}/></label>

     <div className="estimate-items-heading"><div><h3>Cost items</h3><p>Quantity × rate is calculated automatically.</p></div><button className="secondary-action" type="button" onClick={()=>setItems(c=>[...c,newItem()])}><Plus size={16}/> Add item</button></div>
     <div className="estimate-items">{items.map((i,n)=><div className="estimate-item-row" key={n}>
      <select value={i.itemType} onChange={e=>updateItem(n,"itemType",e.target.value as EstimateItemType)}><option value="MATERIAL">Material</option><option value="LABOUR">Labour</option><option value="OVERHEAD">Overhead</option><option value="SERVICE">Service</option></select>
      <input required placeholder="Description" value={i.description} onChange={e=>updateItem(n,"description",e.target.value)}/>
      <input required type="number" min="0.001" step="0.001" placeholder="Qty" value={i.quantity} onChange={e=>updateItem(n,"quantity",e.target.value)}/>
      <input required placeholder="Unit" value={i.unit} onChange={e=>updateItem(n,"unit",e.target.value)}/>
      <input required type="number" min="0" step="0.01" placeholder="Rate" value={i.unitRate} onChange={e=>updateItem(n,"unitRate",e.target.value)}/>
      <strong>{money(Number(i.quantity||0)*Number(i.unitRate||0))}</strong>
      <button className="row-action-button danger" type="button" disabled={items.length===1} onClick={()=>setItems(c=>c.filter((_,j)=>j!==n))}><Trash2 size={16}/></button>
     </div>)}</div>
     <label className="estimate-notes">Commercial notes<textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
     <div className="estimate-live-totals"><span>Base <strong>{money(liveTotals.base)}</strong></span><span>Subtotal <strong>{money(liveTotals.subtotal)}</strong></span><span>Tax <strong>{money(liveTotals.tax)}</strong></span><span>Total <strong>{money(liveTotals.total)}</strong></span></div>
     <div className="modal-actions"><button className="secondary-action" type="button" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving?"Creating...":"Create estimate"}</button></div>
    </form>
   </div>
  </div>}

  {selected&&<div className="modal-backdrop" role="presentation" onMouseDown={()=>setSelected(null)}><div className="estimate-detail-modal boiler-detail-modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
   <div className="modal-header"><div><span className="page-eyebrow">ESTIMATE DETAILS</span><h2>{selected.estimateNumber}</h2><p>{selected.lead.title} · Version {selected.version}</p></div><button className="icon-button" type="button" onClick={()=>setSelected(null)}><X size={21}/></button></div>
   <div className="boiler-detail-grid"><span>Product<strong>{selected.productFamily||"—"} {selected.productModel||""}</strong></span><span>Fuel<strong>{selected.fuelType||"—"}</strong></span><span>Capacity<strong>{selected.capacityTph?`${selected.capacityTph} TPH`:"—"}</strong></span><span>Pressure<strong>{selected.workingPressureBar?`${selected.workingPressureBar} bar`:"—"}</strong></span><span>Proposed efficiency<strong>{selected.proposedBoilerEfficiency?`${selected.proposedBoilerEfficiency}%`:"—"}</strong></span><span>Annual saving<strong>{money(selected.annualCostSaving)}</strong></span></div>
   <div className="estimate-detail-items">{selected.items.map(i=><div key={i.id}><span>{i.itemType}</span><strong>{i.description}</strong><small>{i.quantity} {i.unit} × {money(i.unitRate)}</small><b>{money(i.amount)}</b></div>)}</div>
   <div className="estimate-detail-total"><span>Subtotal: {money(selected.subtotal)}</span><span>Tax: {money(selected.taxAmount)}</span><strong>Total: {money(selected.totalAmount)}</strong></div>
  </div></div>}
 </section>
}
