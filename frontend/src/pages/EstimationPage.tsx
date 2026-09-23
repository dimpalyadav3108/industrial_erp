import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Calculator, CheckCircle2, ChevronRight, Eye, FileCheck2, Plus, Search, ShieldCheck, Trash2, X, XCircle } from "lucide-react";
import { getLeads } from "../services/lead.service";
import { createEstimate, getEstimates, updateEstimateStatus, updateEstimateStage, updateEngineeringValidation } from "../services/estimate.service";
import type { Lead } from "../types/lead";
import type {
  CreateEstimatePayload, Estimate, EstimateItemType, EstimateStatus, EstimateStage,
  RawMaterialCategory, FabricationProcess, TestingType, LogisticsType,
} from "../types/estimate";

interface ItemForm {
  itemType: EstimateItemType; description: string; quantity: string; unit: string; unitRate: string;
  category: RawMaterialCategory | ""; process: FabricationProcess | ""; testType: TestingType | ""; logisticsType: LogisticsType | "";
}
interface RfqForm { rfqNumber: string; rfqSource: string; rfqReceivedDate: string; rfqDueDate: string }
interface TechnicalForm {
  productFamily:string; productModel:string; processIndustry:string; fuelType:string; capacityTph:string;
  requiredSteamConsumption:string; workingPressureBar:string; designPressureBar:string; steamTemperatureC:string;
  feedWaterTemperatureC:string; flueGasTemperatureC:string; operatingHoursPerDay:string; operatingDaysPerYear:string;
  fuelConsumptionPerHour:string; fuelCalorificValueKcalKg:string; fuelPricePerUnit:string;
  existingBoilerEfficiency:string; proposedBoilerEfficiency:string; technicalNotes:string;
}
const newItem=():ItemForm=>({itemType:"MATERIAL",description:"",quantity:"1",unit:"Nos",unitRate:"",category:"",process:"",testType:"",logisticsType:""});
const newRfq=():RfqForm=>({rfqNumber:"",rfqSource:"",rfqReceivedDate:"",rfqDueDate:""});
const newTechnical=():TechnicalForm=>({productFamily:"",productModel:"",processIndustry:"",fuelType:"",capacityTph:"",
 requiredSteamConsumption:"",workingPressureBar:"",designPressureBar:"",steamTemperatureC:"",feedWaterTemperatureC:"",
 flueGasTemperatureC:"",operatingHoursPerDay:"",operatingDaysPerYear:"",fuelConsumptionPerHour:"",
 fuelCalorificValueKcalKg:"",fuelPricePerUnit:"",existingBoilerEfficiency:"",proposedBoilerEfficiency:"",technicalNotes:""});

const statusLabels:Record<EstimateStatus,string>={DRAFT:"Draft",IN_REVIEW:"In review",APPROVED:"Approved",REJECTED:"Rejected",CONVERTED:"Converted"};

// Boiler Costing Engine pipeline, in order:
// RFQ -> Engineering Validation -> BOM Estimation -> Raw Material Cost ->
// Labour Cost -> Fabrication Cost -> Painting Cost -> Testing Cost ->
// Transportation Cost -> Margin Addition -> Quotation Release
const STAGES: EstimateStage[] = ["RFQ","ENGINEERING_VALIDATION","BOM_ESTIMATION","RAW_MATERIAL_COSTING","LABOUR_COSTING",
 "FABRICATION_COSTING","PAINTING_COSTING","TESTING_COSTING","TRANSPORTATION_COSTING","MARGIN_REVIEW","QUOTATION_RELEASE"];
const stageLabels:Record<EstimateStage,string>={RFQ:"RFQ",ENGINEERING_VALIDATION:"Engineering Validation",BOM_ESTIMATION:"BOM Estimation",
 RAW_MATERIAL_COSTING:"Raw Material Cost",LABOUR_COSTING:"Labour Cost",FABRICATION_COSTING:"Fabrication Cost",
 PAINTING_COSTING:"Painting Cost",TESTING_COSTING:"Testing Cost",TRANSPORTATION_COSTING:"Transportation Cost",
 MARGIN_REVIEW:"Margin Addition",QUOTATION_RELEASE:"Quotation Release"};

const itemTypeLabels:Record<EstimateItemType,string>={MATERIAL:"Raw Material",LABOUR:"Labour",FABRICATION:"Fabrication",
 PAINTING:"Painting",TESTING:"Testing",TRANSPORTATION:"Transportation",OVERHEAD:"Overhead",SERVICE:"Service"};
const categoryLabels:Record<RawMaterialCategory,string>={MS_PLATE:"MS Plate",SS_PLATE:"SS Plate",TUBES:"Tubes",PIPES:"Pipes",
 VALVES:"Valves",PUMPS:"Pumps",BURNERS:"Burners",REFRACTORY:"Refractory"};
const processLabels:Record<FabricationProcess,string>={CUTTING:"Cutting",ROLLING:"Rolling",WELDING:"Welding",MACHINING:"Machining",
 GRINDING:"Grinding",SAND_BLASTING:"Sand Blasting",PAINTING:"Painting",INSULATION:"Insulation"};
const testTypeLabels:Record<TestingType,string>={HYDRO_TEST:"Hydro Test",NDT:"NDT",RADIOGRAPHY:"Radiography",IBR_INSPECTION:"IBR Inspection"};
const logisticsLabels:Record<LogisticsType,string>={PACKING:"Packing",FREIGHT:"Freight",INSURANCE:"Insurance"};

const money=(v:number|string|null)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(v||0));
const date=(v:string|null)=>v?new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(v)):"Not specified";
const optionalNumber=(v:string)=>v.trim()===""?undefined:Number(v);
const optionalText=(v:string)=>v.trim()===""?undefined:v.trim();
const stageIndex=(s:EstimateStage)=>STAGES.indexOf(s);

export default function EstimationPage(){
 const [estimates,setEstimates]=useState<Estimate[]>([]),[leads,setLeads]=useState<Lead[]>([]);
 const [search,setSearch]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [busyId,setBusyId]=useState<string|null>(null),[error,setError]=useState(""),[showForm,setShowForm]=useState(false);
 const [selected,setSelected]=useState<Estimate|null>(null),[leadId,setLeadId]=useState("");
 const [status,setStatus]=useState<EstimateStatus>("DRAFT"),[marginPercent,setMarginPercent]=useState("10");
 const [taxPercent,setTaxPercent]=useState("18"),[validUntil,setValidUntil]=useState(""),[notes,setNotes]=useState("");
 const [rfq,setRfq]=useState<RfqForm>(newRfq());
 const [items,setItems]=useState<ItemForm[]>([newItem()]),[technical,setTechnical]=useState<TechnicalForm>(newTechnical());
 const [validationNotes,setValidationNotes]=useState(""),[validationBusy,setValidationBusy]=useState(false),[stageBusy,setStageBusy]=useState(false);

 const loadData=useCallback(async(searchValue="")=>{try{setLoading(true);setError("");
  const [e,l]=await Promise.all([getEstimates(searchValue),getLeads()]);setEstimates(e);
  setLeads(l.filter(x=>["QUALIFIED","TECHNICAL_REVIEW","ESTIMATION"].includes(x.status)));
 }catch(e){setError(e instanceof Error?e.message:"Unable to load estimates")}finally{setLoading(false)}},[]);
 useEffect(()=>{void loadData()},[loadData]);

 const liveTotals=useMemo(()=>{
  const sum=(type:EstimateItemType)=>items.filter(i=>i.itemType===type).reduce((s,i)=>s+Number(i.quantity||0)*Number(i.unitRate||0),0);
  const material=sum("MATERIAL"),labour=sum("LABOUR"),fabrication=sum("FABRICATION"),painting=sum("PAINTING"),testing=sum("TESTING");
  const transportation=sum("TRANSPORTATION"),overhead=sum("OVERHEAD")+sum("SERVICE");
  const base=material+labour+fabrication+painting+testing+transportation+overhead;
  const subtotal=base+base*(Number(marginPercent||0)/100),tax=subtotal*(Number(taxPercent||0)/100);
  return{material,labour,fabrication,painting,testing,transportation,overhead,base,subtotal,tax,total:subtotal+tax}},[items,marginPercent,taxPercent]);
 const engineering=useMemo(()=>{const fuel=Number(technical.fuelConsumptionPerHour||0),cv=Number(technical.fuelCalorificValueKcalKg||0);
  const oldEff=Number(technical.existingBoilerEfficiency||0),newEff=Number(technical.proposedBoilerEfficiency||0);
  const hours=Number(technical.operatingHoursPerDay||0),days=Number(technical.operatingDaysPerYear||0),price=Number(technical.fuelPricePerUnit||0);
  const output=fuel&&cv&&newEff?(fuel*cv*(newEff/100))/539000:Number(technical.capacityTph||0);
  const saving=fuel&&oldEff&&newEff>oldEff?fuel*(1-oldEff/newEff):0; const annual=saving*hours*days;
  return{output,saving,annual,cost:annual*price}},[technical]);
 const summary=useMemo(()=>({total:estimates.length,
  inEngineering:estimates.filter(x=>x.stage==="RFQ"||x.stage==="ENGINEERING_VALIDATION").length,
  costing:estimates.filter(x=>["BOM_ESTIMATION","RAW_MATERIAL_COSTING","LABOUR_COSTING","FABRICATION_COSTING","PAINTING_COSTING","TESTING_COSTING","TRANSPORTATION_COSTING","MARGIN_REVIEW"].includes(x.stage)).length,
  released:estimates.filter(x=>x.stage==="QUOTATION_RELEASE").length,
  value:estimates.reduce((s,x)=>s+Number(x.totalAmount),0)}),[estimates]);

 const resetForm=()=>{setLeadId("");setStatus("DRAFT");setMarginPercent("10");setTaxPercent("18");setValidUntil("");
  setNotes("");setItems([newItem()]);setTechnical(newTechnical());setRfq(newRfq());setError("")};
 const updateItem=(i:number,f:keyof ItemForm,v:string)=>setItems(c=>c.map((x,n)=>{if(n!==i)return x;
  if(f==="itemType")return{...x,itemType:v as EstimateItemType,category:"",process:"",testType:"",logisticsType:""};
  return{...x,[f]:v}}));
 const tech=(f:keyof TechnicalForm,v:string)=>setTechnical(c=>({...c,[f]:v}));
 const rfqField=(f:keyof RfqForm,v:string)=>setRfq(c=>({...c,[f]:v}));

 const handleCreate=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!leadId){setError("Please select a qualified lead");return}
  if(technical.designPressureBar&&technical.workingPressureBar&&Number(technical.designPressureBar)<Number(technical.workingPressureBar)){
   setError("Design pressure should be at least the working pressure");return}
  for(const i of items){
   if(i.itemType==="MATERIAL"&&!i.category){setError("Select a raw material category (MS Plate, SS Plate, Tubes, Pipes, Valves, Pumps, Burners, Refractory) for every raw material line");return}
   if((i.itemType==="FABRICATION"||i.itemType==="PAINTING")&&!i.process){setError("Select a process for every fabrication / painting line");return}
   if(i.itemType==="TESTING"&&!i.testType){setError("Select a testing type for every testing line");return}
   if(i.itemType==="TRANSPORTATION"&&!i.logisticsType){setError("Select a logistics type (Packing, Freight, Insurance) for every transportation line");return}
  }
  try{setSaving(true);setError("");
   const payload:CreateEstimatePayload={leadId,status,marginPercent:Number(marginPercent),taxPercent:Number(taxPercent),
    ...(validUntil?{validUntil}:{}),...(notes?{notes}:{}),
    ...(optionalText(rfq.rfqNumber)?{rfqNumber:optionalText(rfq.rfqNumber)}:{}),...(optionalText(rfq.rfqSource)?{rfqSource:optionalText(rfq.rfqSource)}:{}),
    ...(rfq.rfqReceivedDate?{rfqReceivedDate:rfq.rfqReceivedDate}:{}),...(rfq.rfqDueDate?{rfqDueDate:rfq.rfqDueDate}:{}),
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
      ...(i.category?{category:i.category}:{}),
      ...(i.process?{process:i.process}:{}),
      ...(i.testType?{testType:i.testType}:{}),
      ...(i.logisticsType?{logisticsType:i.logisticsType}:{}),
    })),
   };
   await createEstimate(payload);setShowForm(false);resetForm();await loadData(search)
  }catch(e){setError(e instanceof Error?e.message:"Unable to create estimate")}finally{setSaving(false)}};
 const handleStatus=async(x:Estimate,s:EstimateStatus)=>{try{setBusyId(x.id);setError("");const u=await updateEstimateStatus(x.id,s);
  setEstimates(c=>c.map(r=>r.id===u.id?u:r));if(selected?.id===u.id)setSelected(u);
  }catch(e){setError(e instanceof Error?e.message:"Unable to update status")}finally{setBusyId(null)}};

 const handleValidation=async(x:Estimate,decision:"VALIDATED"|"REJECTED")=>{
  try{setValidationBusy(true);setError("");const u=await updateEngineeringValidation(x.id,decision,optionalText(validationNotes));
   setEstimates(c=>c.map(r=>r.id===u.id?u:r));setSelected(u);setValidationNotes("");
  }catch(e){setError(e instanceof Error?e.message:"Unable to update engineering validation")}finally{setValidationBusy(false)}};

 const handleAdvanceStage=async(x:Estimate)=>{
  const next=STAGES[stageIndex(x.stage)+1];if(!next)return;
  try{setStageBusy(true);setError("");const u=await updateEstimateStage(x.id,next);
   setEstimates(c=>c.map(r=>r.id===u.id?u:r));setSelected(u);
  }catch(e){setError(e instanceof Error?e.message:"Unable to advance estimate stage")}finally{setStageBusy(false)}};

 return <section className="module-page estimation-page">
  <div className="module-heading"><div><span className="page-eyebrow">BOILER COSTING ENGINE — MODULE 2</span><h1>Estimation &amp; Costing</h1>
   <p>Sales RFQ, Engineering Validation, BOM Estimation and itemised Raw Material / Labour / Fabrication / Painting / Testing / Transportation costing through to Quotation Release.</p></div>
   <button className="primary-action" type="button" onClick={()=>{resetForm();setShowForm(true)}}><Plus size={19}/> New RFQ / estimate</button></div>
  <div className="estimation-summary-grid">
   <article><Calculator size={24}/><div><strong>{summary.total}</strong><span>Total estimates</span></div></article>
   <article><ShieldCheck size={24}/><div><strong>{summary.inEngineering}</strong><span>RFQ / Engineering validation</span></div></article>
   <article><FileCheck2 size={24}/><div><strong>{summary.costing}</strong><span>In BOM / costing</span></div></article>
   <article><Calculator size={24}/><div><strong>{money(summary.value)}</strong><span>Estimated value</span></div></article>
  </div>
  <div className="directory-card"><div className="directory-header"><div><h2>Estimate register</h2><p>{estimates.length} records shown</p></div>
   <form className="directory-search" onSubmit={e=>{e.preventDefault();void loadData(search)}}><Search size={19}/><input value={search} placeholder="Search estimate, RFQ, boiler, lead or customer..." onChange={e=>setSearch(e.target.value)}/><button type="submit">Search</button></form></div>
   {error&&!showForm&&<div className="page-error">{error}</div>}
   {loading?<div className="empty-state"><div className="loading-spinner"/><h3>Loading estimates...</h3></div>:estimates.length===0?
    <div className="empty-state"><span className="empty-state-icon"><Calculator size={34}/></span><h3>No estimates found</h3><p>Create an RFQ to start the boiler costing engine for a qualified enquiry.</p></div>:
    <div className="table-scroll"><table className="data-table estimate-table"><thead><tr><th>Estimate / RFQ</th><th>Lead / Customer</th><th>Boiler</th><th>Stage</th><th>Status</th><th>Total</th><th>Action</th></tr></thead>
    <tbody>{estimates.map(x=><tr key={x.id}><td><div className="lead-title-cell"><strong>{x.estimateNumber}</strong><span>{x.rfqNumber?`RFQ ${x.rfqNumber}`:date(x.createdAt)}</span></div></td>
    <td><div className="lead-title-cell"><strong>{x.lead.title}</strong><span>{x.lead.customer?.companyName||"No customer"}</span></div></td>
    <td><div className="lead-title-cell"><strong>{x.productFamily||"—"}</strong><span>{x.productModel||x.fuelType||"Technical data not added"}</span></div></td>
<td>
  <span className={`stage-pill stage-${(x.stage ?? "RFQ").toLowerCase()}`}>
    {stageLabels[x.stage ?? "RFQ"] ?? x.stage ?? "RFQ"}
  </span>
</td>
    <td><select className="estimate-status-select" value={x.status} disabled={busyId===x.id} onChange={e=>void handleStatus(x,e.target.value as EstimateStatus)}>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></td>
    <td><strong>{money(x.totalAmount)}</strong></td><td><button className="row-action-button" type="button" onClick={()=>setSelected(x)}><Eye size={17}/></button></td></tr>)}</tbody></table></div>}
  </div>

  {showForm&&<div className="modal-backdrop" role="presentation" onMouseDown={()=>!saving&&setShowForm(false)}>
   <div className="estimate-form-modal boiler-estimate-modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
    <div className="modal-header"><div><span className="page-eyebrow">NEW TECHNICAL COST SHEET</span><h2>Create boiler estimate</h2><p>RFQ intake, technical requirement, efficiency analysis and itemised commercial costing.</p></div><button className="icon-button" type="button" onClick={()=>setShowForm(false)}><X size={21}/></button></div>
    <form onSubmit={handleCreate}>{error&&<div className="page-error">{error}</div>}

     <div className="estimate-items-heading"><div><h3>Stage 1 — Sales RFQ</h3><p>Captured when the sales team creates the RFQ; the estimate starts in the RFQ stage.</p></div></div>
     <div className="estimate-top-fields">
      <label>Qualified lead<select required value={leadId} onChange={e=>setLeadId(e.target.value)}><option value="">Select lead</option>{leads.map(l=><option key={l.id} value={l.id}>{l.leadNumber} — {l.title}</option>)}</select></label>
      <label>RFQ number<input placeholder="RFQ-2026-001" value={rfq.rfqNumber} onChange={e=>rfqField("rfqNumber",e.target.value)}/></label>
      <label>RFQ source<input placeholder="Website, IndiaMART, direct..." value={rfq.rfqSource} onChange={e=>rfqField("rfqSource",e.target.value)}/></label>
      <label>RFQ received<input type="date" value={rfq.rfqReceivedDate} onChange={e=>rfqField("rfqReceivedDate",e.target.value)}/></label>
      <label>RFQ due<input type="date" value={rfq.rfqDueDate} onChange={e=>rfqField("rfqDueDate",e.target.value)}/></label>
      <label>Status<select value={status} onChange={e=>setStatus(e.target.value as EstimateStatus)}>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      <label>Margin % (Margin Addition)<input type="number" min="0" max="100" value={marginPercent} onChange={e=>setMarginPercent(e.target.value)}/></label>
      <label>Tax %<input type="number" min="0" max="100" value={taxPercent} onChange={e=>setTaxPercent(e.target.value)}/></label>
      <label>Valid until<input type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)}/></label>
     </div>

     <div className="estimate-items-heading"><div><h3>Stage 2–3 — Engineering Validation &amp; BOM specification</h3><p>Enter the enquiry and operating parameters engineering will validate before BOM estimation.</p></div></div>
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

     <div className="estimate-items-heading"><div><h3>Stage 4–9 — Cost components</h3><p>Raw Material, Labour, Fabrication, Painting, Testing and Transportation cost lines. Quantity × rate is calculated automatically.</p></div><button className="secondary-action" type="button" onClick={()=>setItems(c=>[...c,newItem()])}><Plus size={16}/> Add cost line</button></div>
     <div className="estimate-items">{items.map((i,n)=><div className="estimate-item-row cost-item-row" key={n}>
      <select value={i.itemType} onChange={e=>updateItem(n,"itemType",e.target.value)}>{Object.entries(itemTypeLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
      {i.itemType==="MATERIAL"&&<select required value={i.category} onChange={e=>updateItem(n,"category",e.target.value)}><option value="">Category…</option>{Object.entries(categoryLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>}
      {(i.itemType==="FABRICATION"||i.itemType==="PAINTING")&&<select required value={i.process} onChange={e=>updateItem(n,"process",e.target.value)}><option value="">Process…</option>{Object.entries(processLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>}
      {i.itemType==="TESTING"&&<select required value={i.testType} onChange={e=>updateItem(n,"testType",e.target.value)}><option value="">Test type…</option>{Object.entries(testTypeLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>}
      {i.itemType==="TRANSPORTATION"&&<select required value={i.logisticsType} onChange={e=>updateItem(n,"logisticsType",e.target.value)}><option value="">Logistics…</option>{Object.entries(logisticsLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>}
      <input required placeholder="Description" value={i.description} onChange={e=>updateItem(n,"description",e.target.value)}/>
      <input required type="number" min="0.001" step="0.001" placeholder="Qty" value={i.quantity} onChange={e=>updateItem(n,"quantity",e.target.value)}/>
      <input required placeholder="Unit" value={i.unit} onChange={e=>updateItem(n,"unit",e.target.value)}/>
      <input required type="number" min="0" step="0.01" placeholder="Rate" value={i.unitRate} onChange={e=>updateItem(n,"unitRate",e.target.value)}/>
      <strong>{money(Number(i.quantity||0)*Number(i.unitRate||0))}</strong>
      <button className="row-action-button danger" type="button" disabled={items.length===1} onClick={()=>setItems(c=>c.filter((_,j)=>j!==n))}><Trash2 size={16}/></button>
     </div>)}</div>
     <label className="estimate-notes">Commercial notes<textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
     <div className="estimate-live-totals cost-breakdown-totals">
      <span>Raw material <strong>{money(liveTotals.material)}</strong></span>
      <span>Labour <strong>{money(liveTotals.labour)}</strong></span>
      <span>Fabrication <strong>{money(liveTotals.fabrication)}</strong></span>
      <span>Painting <strong>{money(liveTotals.painting)}</strong></span>
      <span>Testing <strong>{money(liveTotals.testing)}</strong></span>
      <span>Transportation <strong>{money(liveTotals.transportation)}</strong></span>
     </div>
     <div className="estimate-live-totals"><span>Base <strong>{money(liveTotals.base)}</strong></span><span>Subtotal (incl. margin) <strong>{money(liveTotals.subtotal)}</strong></span><span>Tax <strong>{money(liveTotals.tax)}</strong></span><span>Total <strong>{money(liveTotals.total)}</strong></span></div>
     <div className="modal-actions"><button className="secondary-action" type="button" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving?"Creating...":"Create RFQ / estimate"}</button></div>
    </form>
   </div>
  </div>}

  {selected&&<div className="modal-backdrop" role="presentation" onMouseDown={()=>{setSelected(null);setValidationNotes("")}}><div className="estimate-detail-modal boiler-detail-modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
   <div className="modal-header"><div><span className="page-eyebrow">ESTIMATE DETAILS</span><h2>{selected.estimateNumber}</h2><p>{selected.lead.title} · Version {selected.version}{selected.rfqNumber?` · RFQ ${selected.rfqNumber}`:""}</p></div><button className="icon-button" type="button" onClick={()=>{setSelected(null);setValidationNotes("")}}><X size={21}/></button></div>

   <div className="stage-pipeline">{STAGES.map((s,n)=><div key={s} className={`stage-step ${n<stageIndex(selected.stage)?"done":n===stageIndex(selected.stage)?"current":""}`}>
    <span className="stage-step-dot">{n<stageIndex(selected.stage)?<CheckCircle2 size={14}/>:n+1}</span><span>{stageLabels[s]}</span>{n<STAGES.length-1&&<ChevronRight size={14} className="stage-step-arrow"/>}
   </div>)}</div>

   {selected.stage==="RFQ"&&selected.engineeringValidationStatus==="PENDING"&&<div className="engineering-validation-panel">
    <h3>Engineering Validation</h3><p>Validate the RFQ's technical requirement before BOM Estimation can begin.</p>
    <textarea rows={2} placeholder="Validation notes (optional)" value={validationNotes} onChange={e=>setValidationNotes(e.target.value)}/>
    <div className="modal-actions"><button className="secondary-action danger" type="button" disabled={validationBusy} onClick={()=>void handleValidation(selected,"REJECTED")}><XCircle size={16}/> Reject</button>
     <button className="primary-action" type="button" disabled={validationBusy} onClick={()=>void handleValidation(selected,"VALIDATED")}><CheckCircle2 size={16}/> Validate &amp; move to BOM Estimation</button></div>
   </div>}
   {(selected.engineeringValidationStatus ?? "PENDING") !== "PENDING" && (
    <div className="engineering-validation-summary">
     <span className={`stage-pill stage-${(selected.engineeringValidationStatus ?? "PENDING").toLowerCase()}`}>
      {selected.engineeringValidationStatus === "VALIDATED" ? "Engineering validated" : "Engineering rejected"}
     </span>
     {selected.engineeringValidatedBy&&<span>by {selected.engineeringValidatedBy.firstName} {selected.engineeringValidatedBy.lastName} on {date(selected.engineeringValidatedAt)}</span>}
     {selected.engineeringValidationNotes&&<p>{selected.engineeringValidationNotes}</p>}
    </div>
   )}
   {selected.engineeringValidationStatus==="VALIDATED"&&selected.stage!=="QUOTATION_RELEASE"&&<div className="modal-actions stage-advance-actions">
    <button className="primary-action" type="button" disabled={stageBusy} onClick={()=>void handleAdvanceStage(selected)}>
     {stageBusy?"Advancing...":`Advance to ${stageLabels[STAGES[stageIndex(selected.stage)+1]]}`}</button>
   </div>}
   {selected.stage==="QUOTATION_RELEASE"&&<div className="engineering-validation-summary"><span className="stage-pill stage-quotation_release">Quotation released</span>
    {selected.quotationReleasedBy&&<span>by {selected.quotationReleasedBy.firstName} {selected.quotationReleasedBy.lastName} on {date(selected.quotationReleasedAt)}</span>}</div>}

   <div className="boiler-detail-grid"><span>Product<strong>{selected.productFamily||"—"} {selected.productModel||""}</strong></span><span>Fuel<strong>{selected.fuelType||"—"}</strong></span><span>Capacity<strong>{selected.capacityTph?`${selected.capacityTph} TPH`:"—"}</strong></span><span>Pressure<strong>{selected.workingPressureBar?`${selected.workingPressureBar} bar`:"—"}</strong></span><span>Proposed efficiency<strong>{selected.proposedBoilerEfficiency?`${selected.proposedBoilerEfficiency}%`:"—"}</strong></span><span>Annual saving<strong>{money(selected.annualCostSaving)}</strong></span></div>

   <div className="cost-breakdown-totals estimate-live-totals">
    <span>Raw material <strong>{money(selected.materialCost)}</strong></span>
    <span>Labour <strong>{money(selected.labourCost)}</strong></span>
    <span>Fabrication <strong>{money(selected.fabricationCost)}</strong></span>
    <span>Painting <strong>{money(selected.paintingCost)}</strong></span>
    <span>Testing <strong>{money(selected.testingCost)}</strong></span>
    <span>Transportation <strong>{money(selected.transportationCost)}</strong></span>
   </div>
   <div className="cost-breakdown-totals estimate-live-totals">
    <span>Packing <strong>{money(selected.packingCost)}</strong></span>
    <span>Freight <strong>{money(selected.freightCost)}</strong></span>
    <span>Insurance <strong>{money(selected.insuranceCost)}</strong></span>
    <span>Margin % <strong>{selected.marginPercent}%</strong></span>
   </div>

   <div className="estimate-detail-items">{selected.items.map(i=><div key={i.id}>
    <span>{itemTypeLabels[i.itemType]}{i.category?` · ${categoryLabels[i.category]}`:""}{i.process?` · ${processLabels[i.process]}`:""}{i.testType?` · ${testTypeLabels[i.testType]}`:""}{i.logisticsType?` · ${logisticsLabels[i.logisticsType]}`:""}</span>
    <strong>{i.description}</strong><small>{i.quantity} {i.unit} × {money(i.unitRate)}</small><b>{money(i.amount)}</b></div>)}</div>
   <div className="estimate-detail-total"><span>Subtotal: {money(selected.subtotal)}</span><span>Tax: {money(selected.taxAmount)}</span><strong>Total: {money(selected.totalAmount)}</strong></div>
  </div></div>}
 </section>
}
