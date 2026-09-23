import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FileBadge, Headphones, Plus, Search, ShieldCheck, Siren, Wrench, X } from "lucide-react";
import { getCustomers } from "../services/customer.service";
import { getDispatches } from "../services/dispatch.service";
import {
  createServiceContract, createServiceRequest, getServiceContracts, getServiceRequests,
  updateServiceContractStatus, updateServiceRequestStatus, getServiceEngineers, getService360, assignServiceEngineer, createServiceVisit, addServiceFeedback, addServiceSpareMovement, createPmPlan, addWarrantyCoverage,
} from "../services/service.service";
import type { Customer } from "../types/customer";
import type { Dispatch } from "../types/dispatch";
import type {
  CreateServiceContractPayload, CreateServiceRequestPayload, ServiceContract,
  ServiceContractStatus, ServiceContractType, ServicePriority, ServiceRequest,
  ServiceRequestStatus, ServiceRequestType,
} from "../types/service";

const contractTypeLabels: Record<ServiceContractType, string> = { WARRANTY: "Warranty", AMC: "AMC", CMC: "CMC", ON_CALL: "On call" };
const contractStatusLabels: Record<ServiceContractStatus, string> = { DRAFT: "Draft", ACTIVE: "Active", EXPIRED: "Expired", SUSPENDED: "Suspended", CANCELLED: "Cancelled" };
const requestTypeLabels: Record<ServiceRequestType, string> = { BREAKDOWN: "Breakdown", PREVENTIVE_MAINTENANCE: "Preventive maintenance", INSTALLATION: "Installation", COMMISSIONING: "Commissioning", INSPECTION: "Inspection", OTHER: "Other" };
const requestStatusLabels: Record<ServiceRequestStatus, string> = { OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In progress", RESOLVED: "Resolved", CLOSED: "Closed", CANCELLED: "Cancelled" };
const priorityLabels: Record<ServicePriority, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" };
const displayDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "Not set";
const apiDate = (value: string) => new Date(`${value}T00:00:00.000Z`).toISOString();
const money = (value: string | null) => value ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value)) : "—";

export default function ServicePage() {
  const [tab, setTab] = useState<"contracts" | "requests">("contracts");
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showContractForm, setShowContractForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [contractForm, setContractForm] = useState({ customerId: "", dispatchId: "", title: "", contractType: "AMC" as ServiceContractType, status: "ACTIVE" as ServiceContractStatus, startDate: "", endDate: "", contractValue: "", visitsIncluded: "4", responseTimeHours: "24", notes: "" });
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [service360, setService360] = useState<any>(null);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [pmForm, setPmForm] = useState({ title:"Quarterly Preventive Maintenance", frequencyDays:"90", nextDueDate:"", checklist:"" });
  const [coverageForm, setCoverageForm] = useState({ componentName:"", coverageType:"Parts & labour", exclusions:"", replacementLimit:"" });
  const [mobileForm, setMobileForm] = useState({ engineerId:"", siteContact:"", findings:"", workPerformed:"", issueDescription:"", photoUrl:"", rating:"FIVE", feedback:"", spareName:"", partNumber:"", quantity:"1", movementType:"REPLACEMENT", warrantyCovered:false });
  const [requestForm, setRequestForm] = useState({ customerId: "", serviceContractId: "", requestType: "BREAKDOWN" as ServiceRequestType, priority: "MEDIUM" as ServicePriority, subject: "", description: "", location: "", scheduledDate: "" });

  const loadData = useCallback(async (searchValue = "") => {
    try {
      setLoading(true); setError("");
      const [contractRecords, requestRecords, customerResponse, dispatchRecords] = await Promise.all([
        getServiceContracts(searchValue), getServiceRequests(searchValue), getCustomers(), getDispatches(),
      ]);
      setContracts(contractRecords); setRequests(requestRecords); setCustomers(customerResponse.data); setDispatches(dispatchRecords);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load service information"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  const summary = useMemo(() => ({
    contracts: contracts.length,
    active: contracts.filter((item) => item.status === "ACTIVE").length,
    open: requests.filter((item) => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(item.status)).length,
    urgent: requests.filter((item) => item.priority === "URGENT" && !["RESOLVED", "CLOSED", "CANCELLED"].includes(item.status)).length,
    resolved: requests.filter((item) => ["RESOLVED", "CLOSED"].includes(item.status)).length,
  }), [contracts, requests]);
  const customerContracts = useMemo(() => contracts.filter((item) => item.customerId === requestForm.customerId && item.status === "ACTIVE"), [contracts, requestForm.customerId]);
  const customerDispatches = useMemo(() => dispatches.filter((item) => item.productionOrder.quotation.estimate.lead.customer?.companyName === customers.find((customer) => customer.id === contractForm.customerId)?.companyName), [contractForm.customerId, customers, dispatches]);

  const submitContract = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      const payload: CreateServiceContractPayload = {
        customerId: contractForm.customerId, title: contractForm.title, contractType: contractForm.contractType,
        status: contractForm.status, startDate: apiDate(contractForm.startDate), endDate: apiDate(contractForm.endDate),
        visitsIncluded: Number(contractForm.visitsIncluded),
        ...(contractForm.dispatchId ? { dispatchId: contractForm.dispatchId } : {}),
        ...(contractForm.contractValue ? { contractValue: Number(contractForm.contractValue) } : {}),
        ...(contractForm.responseTimeHours ? { responseTimeHours: Number(contractForm.responseTimeHours) } : {}),
        ...(contractForm.notes.trim() ? { notes: contractForm.notes.trim() } : {}),
      };
      await createServiceContract(payload); setShowContractForm(false); await loadData(search);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to create service contract"); }
    finally { setSaving(false); }
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      const payload: CreateServiceRequestPayload = {
        customerId: requestForm.customerId, requestType: requestForm.requestType, priority: requestForm.priority,
        subject: requestForm.subject, description: requestForm.description,
        ...(requestForm.serviceContractId ? { serviceContractId: requestForm.serviceContractId } : {}),
        ...(requestForm.location.trim() ? { location: requestForm.location.trim() } : {}),
        ...(requestForm.scheduledDate ? { scheduledDate: apiDate(requestForm.scheduledDate) } : {}),
      };
      await createServiceRequest(payload); setShowRequestForm(false); await loadData(search);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to create service request"); }
    finally { setSaving(false); }
  };

  const changeContractStatus = async (contract: ServiceContract, status: ServiceContractStatus) => {
    try { setBusyId(contract.id); setError(""); const updated = await updateServiceContractStatus(contract.id, status); setContracts((current) => current.map((item) => item.id === updated.id ? updated : item)); }
    catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Unable to update contract"); }
    finally { setBusyId(null); }
  };
  const openService360 = async (request: ServiceRequest) => {
    try { setSelectedRequest(request); setError(""); const [detail, eng] = await Promise.all([getService360(request.id), getServiceEngineers()]); setService360(detail); setEngineers(eng); setMobileForm((f)=>({...f,engineerId:request.assignedTo?.id||""})); }
    catch(e){ setError(e instanceof Error?e.message:"Unable to load service 360"); }
  };
  const refresh360 = async () => { if(selectedRequest) setService360(await getService360(selectedRequest.id)); };
  const mobileAssign = async () => { if(!selectedRequest || !mobileForm.engineerId) return; await assignServiceEngineer(selectedRequest.id,mobileForm.engineerId,"Assigned from AMC mobile/service console"); await loadData(search); await refresh360(); };
  const mobileVisit = async (status="COMPLETED") => { if(!selectedRequest) return; await createServiceVisit(selectedRequest.id,{engineerId:mobileForm.engineerId||selectedRequest.assignedTo?.id, status, siteContact:mobileForm.siteContact, findings:mobileForm.findings, workPerformed:mobileForm.workPerformed, issueDescription:mobileForm.issueDescription, photoUrl:mobileForm.photoUrl}); await refresh360(); };
  const mobileFeedback = async () => { if(!selectedRequest) return; await addServiceFeedback(selectedRequest.id,{rating:mobileForm.rating,comments:mobileForm.feedback,customerName:selectedRequest.customer.contactPerson||selectedRequest.customer.companyName}); await refresh360(); };
  const savePm = async () => { if(!selectedRequest) return; await createPmPlan({customerId:selectedRequest.customerId,contractId:selectedRequest.serviceContractId||undefined,...pmForm,frequencyDays:Number(pmForm.frequencyDays)}); await refresh360(); };
  const saveCoverage = async () => { if(!selectedRequest?.serviceContractId) return; await addWarrantyCoverage({contractId:selectedRequest.serviceContractId,...coverageForm,replacementLimit:coverageForm.replacementLimit?Number(coverageForm.replacementLimit):undefined}); await refresh360(); };
  const mobileSpare = async () => { if(!selectedRequest || !mobileForm.spareName) return; await addServiceSpareMovement(selectedRequest.id,{spareName:mobileForm.spareName,partNumber:mobileForm.partNumber,quantity:Number(mobileForm.quantity),movementType:mobileForm.movementType,warrantyCovered:mobileForm.warrantyCovered}); await refresh360(); setMobileForm(f=>({...f,spareName:"",partNumber:"",quantity:"1"})); };

  const changeRequestStatus = async (request: ServiceRequest, status: ServiceRequestStatus) => {
    try { setBusyId(request.id); setError(""); const updated = await updateServiceRequestStatus(request.id, status); setRequests((current) => current.map((item) => item.id === updated.id ? updated : item)); }
    catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Unable to update request"); }
    finally { setBusyId(null); }
  };

  return <section className="module-page service-page">
    <div className="module-heading"><div><span className="page-eyebrow">AFTER-SALES OPERATIONS</span><h1>Service &amp; AMC</h1><p>Manage support contracts, maintenance visits and customer service tickets.</p></div><div className="service-heading-actions"><button className="secondary-action" type="button" onClick={() => { setError(""); setShowContractForm(true); }}><FileBadge size={18} /> New contract</button><button className="primary-action" type="button" onClick={() => { setError(""); setShowRequestForm(true); }}><Plus size={18} /> New request</button></div></div>
    <div className="service-summary-grid">
      <article><FileBadge /><div><strong>{summary.contracts}</strong><span>Total contracts</span></div></article><article><ShieldCheck /><div><strong>{summary.active}</strong><span>Active contracts</span></div></article><article><Headphones /><div><strong>{summary.open}</strong><span>Open requests</span></div></article><article><Siren /><div><strong>{summary.urgent}</strong><span>Urgent requests</span></div></article><article><Wrench /><div><strong>{summary.resolved}</strong><span>Resolved</span></div></article>
    </div>
    <div className="service-tabs"><button className={tab === "contracts" ? "active" : ""} onClick={() => setTab("contracts")}>AMC contracts</button><button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>Service requests</button></div>
    <div className="directory-card"><div className="directory-header"><div><h2>{tab === "contracts" ? "Contract register" : "Service request register"}</h2><p>{tab === "contracts" ? contracts.length : requests.length} records shown</p></div><form className="directory-search" onSubmit={(event) => { event.preventDefault(); void loadData(search); }}><Search size={19} /><input value={search} placeholder="Search contract, ticket or customer..." onChange={(event) => setSearch(event.target.value)} /><button>Search</button></form></div>
      {error && !showContractForm && !showRequestForm && <div className="page-error">{error}</div>}
      {loading ? <div className="empty-state"><div className="loading-spinner" /><h3>Loading service records...</h3></div> : tab === "contracts" ? contracts.length === 0 ? <div className="empty-state"><FileBadge size={36} /><h3>No service contracts found</h3><p>Create a warranty or AMC contract for a customer.</p></div> :
        <div className="table-scroll"><table className="data-table service-table"><thead><tr><th>Contract</th><th>Customer / Equipment</th><th>Type</th><th>Period</th><th>Visits</th><th>Value</th><th>Status</th></tr></thead><tbody>{contracts.map((contract) => <tr key={contract.id}><td><div className="lead-title-cell"><strong>{contract.contractNumber}</strong><span>{contract.title}</span></div></td><td><div className="lead-title-cell"><strong>{contract.customer.companyName}</strong><span>{contract.dispatch?.productionOrder.title || "General service"}</span></div></td><td>{contractTypeLabels[contract.contractType]}</td><td>{displayDate(contract.startDate)} – {displayDate(contract.endDate)}</td><td>{contract.visitsUsed}/{contract.visitsIncluded}</td><td>{money(contract.contractValue)}</td><td><select className="service-status-select" value={contract.status} disabled={busyId === contract.id} onChange={(event) => void changeContractStatus(contract, event.target.value as ServiceContractStatus)}>{Object.entries(contractStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div> : requests.length === 0 ? <div className="empty-state"><Headphones size={36} /><h3>No service requests found</h3><p>Register a customer complaint or maintenance visit.</p></div> :
        <div className="table-scroll"><table className="data-table service-table"><thead><tr><th>Ticket</th><th>Customer / Subject</th><th>Type</th><th>Priority</th><th>Scheduled</th><th>Contract</th><th>Status</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td><div className="lead-title-cell"><strong>{request.ticketNumber}</strong><span>{displayDate(request.reportedAt)}</span></div></td><td><div className="lead-title-cell"><strong>{request.customer.companyName}</strong><span>{request.subject}</span></div></td><td>{requestTypeLabels[request.requestType]}</td><td><span className={`service-priority ${request.priority.toLowerCase()}`}>{priorityLabels[request.priority]}</span></td><td>{displayDate(request.scheduledDate)}</td><td>{request.serviceContract?.contractNumber || "On call"}</td><td><select className="service-status-select" value={request.status} disabled={busyId === request.id} onChange={(event) => void changeRequestStatus(request, event.target.value as ServiceRequestStatus)}>{Object.entries(requestStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="secondary-action" type="button" onClick={() => void openService360(request)}>Manage</button></td></tr>)}</tbody></table></div>}
    </div>

    {selectedRequest && <div className="modal-backdrop" onMouseDown={() => setSelectedRequest(null)}><div className="service-form-modal" onMouseDown={(e)=>e.stopPropagation()}><div className="modal-header"><div><span className="page-eyebrow">SERVICE 360 · AMC MOBILE CONSOLE</span><h2>{selectedRequest.ticketNumber}</h2><p>{selectedRequest.customer.companyName} · {selectedRequest.subject}</p></div><button className="icon-button" onClick={()=>setSelectedRequest(null)}><X /></button></div><div className="service-form-grid"><label>Engineer<select value={mobileForm.engineerId} onChange={e=>setMobileForm({...mobileForm,engineerId:e.target.value})}><option value="">Unassigned</option>{engineers.map(e=><option key={e.id} value={e.id}>{e.firstName} {e.lastName} · {e.employeeCode}</option>)}</select></label><div className="modal-actions"><button className="primary-action" type="button" onClick={()=>void mobileAssign()}>Assign engineer</button></div><label>Site contact<input value={mobileForm.siteContact} onChange={e=>setMobileForm({...mobileForm,siteContact:e.target.value})}/></label><label>Photo URL<input value={mobileForm.photoUrl} onChange={e=>setMobileForm({...mobileForm,photoUrl:e.target.value})} placeholder="https://..."/></label><label className="span-three">Findings<textarea rows={2} value={mobileForm.findings} onChange={e=>setMobileForm({...mobileForm,findings:e.target.value})}/></label><label className="span-three">Work performed<textarea rows={2} value={mobileForm.workPerformed} onChange={e=>setMobileForm({...mobileForm,workPerformed:e.target.value})}/></label><label className="span-three">Issue / resolution notes<textarea rows={2} value={mobileForm.issueDescription} onChange={e=>setMobileForm({...mobileForm,issueDescription:e.target.value})}/></label><div className="modal-actions"><button className="secondary-action" type="button" onClick={()=>void mobileVisit("IN_PROGRESS")}>Start site visit</button><button className="primary-action" type="button" onClick={()=>void mobileVisit("COMPLETED")}>Complete site visit</button></div><label>Feedback rating<select value={mobileForm.rating} onChange={e=>setMobileForm({...mobileForm,rating:e.target.value})}>{["ONE","TWO","THREE","FOUR","FIVE"].map(x=><option key={x}>{x}</option>)}</select></label><label>Customer feedback<input value={mobileForm.feedback} onChange={e=>setMobileForm({...mobileForm,feedback:e.target.value})}/></label><button className="secondary-action" type="button" onClick={()=>void mobileFeedback()}>Save feedback</button><label>Spare part<input value={mobileForm.spareName} onChange={e=>setMobileForm({...mobileForm,spareName:e.target.value})}/></label><label>Part number<input value={mobileForm.partNumber} onChange={e=>setMobileForm({...mobileForm,partNumber:e.target.value})}/></label><label>Qty<input type="number" min="0.001" step="0.001" value={mobileForm.quantity} onChange={e=>setMobileForm({...mobileForm,quantity:e.target.value})}/></label><label>Movement<select value={mobileForm.movementType} onChange={e=>setMobileForm({...mobileForm,movementType:e.target.value})}><option>ISSUE</option><option>REPLACEMENT</option><option>RETURN</option><option>CONSUMED</option></select></label><label>Warranty covered<select value={mobileForm.warrantyCovered?"YES":"NO"} onChange={e=>setMobileForm({...mobileForm,warrantyCovered:e.target.value==="YES"})}><option>NO</option><option>YES</option></select></label><button className="secondary-action" type="button" onClick={()=>void mobileSpare()}>Record spare</button><label>PM plan title<input value={pmForm.title} onChange={e=>setPmForm({...pmForm,title:e.target.value})}/></label><label>Frequency days<input type="number" min="1" value={pmForm.frequencyDays} onChange={e=>setPmForm({...pmForm,frequencyDays:e.target.value})}/></label><label>Next due date<input type="date" value={pmForm.nextDueDate} onChange={e=>setPmForm({...pmForm,nextDueDate:e.target.value})}/></label><label className="span-two">PM checklist<input value={pmForm.checklist} onChange={e=>setPmForm({...pmForm,checklist:e.target.value})}/></label><button className="secondary-action" type="button" onClick={()=>void savePm()}>Create PM plan</button>{selectedRequest.serviceContractId && <><label>Warranty component<input value={coverageForm.componentName} onChange={e=>setCoverageForm({...coverageForm,componentName:e.target.value})}/></label><label>Coverage type<input value={coverageForm.coverageType} onChange={e=>setCoverageForm({...coverageForm,coverageType:e.target.value})}/></label><label>Exclusions<input value={coverageForm.exclusions} onChange={e=>setCoverageForm({...coverageForm,exclusions:e.target.value})}/></label><label>Replacement limit<input type="number" min="0" value={coverageForm.replacementLimit} onChange={e=>setCoverageForm({...coverageForm,replacementLimit:e.target.value})}/></label><button className="secondary-action" type="button" onClick={()=>void saveCoverage()}>Add warranty coverage</button></>}</div><div className="directory-card" style={{marginTop:16}}><div className="directory-header"><h3>Site visits: {service360?.visits?.length||0} · Spares: {service360?.spares?.length||0} · Warranty coverage: {service360?.warrantyCoverage?.length||0}</h3></div><div style={{padding:16}}>{service360?.visits?.map((v:any)=><div key={v.id}><strong>Visit #{v.visitNumber}</strong> · {v.status} · {v.workPerformed||v.findings||"No notes"}</div>)}{service360?.feedback && <div style={{marginTop:8}}><strong>Feedback:</strong> {service360.feedback.rating} · {service360.feedback.comments||"No comment"}</div>}</div></div></div></div>}

    {showContractForm && <div className="modal-backdrop" onMouseDown={() => !saving && setShowContractForm(false)}><div className="service-form-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="page-eyebrow">NEW COVERAGE</span><h2>Create service contract</h2><p>Add warranty, AMC, CMC or on-call coverage.</p></div><button className="icon-button" onClick={() => setShowContractForm(false)}><X /></button></div><form onSubmit={submitContract}>{error && <div className="page-error">{error}</div>}<div className="service-form-grid">
      <label className="span-two">Customer<select required value={contractForm.customerId} onChange={(event) => setContractForm({ ...contractForm, customerId: event.target.value, dispatchId: "" })}><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label><label>Contract type<select value={contractForm.contractType} onChange={(event) => setContractForm({ ...contractForm, contractType: event.target.value as ServiceContractType })}>{Object.entries(contractTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="span-two">Contract title<input required value={contractForm.title} onChange={(event) => setContractForm({ ...contractForm, title: event.target.value })} placeholder="Annual maintenance contract" /></label><label>Delivered equipment<select value={contractForm.dispatchId} onChange={(event) => setContractForm({ ...contractForm, dispatchId: event.target.value })}><option value="">General contract</option>{customerDispatches.map((dispatch) => <option key={dispatch.id} value={dispatch.id}>{dispatch.productionOrder.title} · {dispatch.dispatchNumber}</option>)}</select></label>
      <label>Start date<input required type="date" value={contractForm.startDate} onChange={(event) => setContractForm({ ...contractForm, startDate: event.target.value })} /></label><label>End date<input required type="date" value={contractForm.endDate} onChange={(event) => setContractForm({ ...contractForm, endDate: event.target.value })} /></label><label>Status<select value={contractForm.status} onChange={(event) => setContractForm({ ...contractForm, status: event.target.value as ServiceContractStatus })}>{Object.entries(contractStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Contract value (₹)<input type="number" min="0" value={contractForm.contractValue} onChange={(event) => setContractForm({ ...contractForm, contractValue: event.target.value })} /></label><label>Included visits<input required type="number" min="0" value={contractForm.visitsIncluded} onChange={(event) => setContractForm({ ...contractForm, visitsIncluded: event.target.value })} /></label><label>Response time (hours)<input type="number" min="1" value={contractForm.responseTimeHours} onChange={(event) => setContractForm({ ...contractForm, responseTimeHours: event.target.value })} /></label><label className="span-three">Notes<textarea rows={3} value={contractForm.notes} onChange={(event) => setContractForm({ ...contractForm, notes: event.target.value })} /></label>
      </div><div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setShowContractForm(false)}>Cancel</button><button className="primary-action" disabled={saving}>{saving ? "Creating..." : "Create contract"}</button></div></form></div></div>}

    {showRequestForm && <div className="modal-backdrop" onMouseDown={() => !saving && setShowRequestForm(false)}><div className="service-form-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="page-eyebrow">NEW SUPPORT TICKET</span><h2>Create service request</h2><p>Register a breakdown, maintenance visit or customer requirement.</p></div><button className="icon-button" onClick={() => setShowRequestForm(false)}><X /></button></div><form onSubmit={submitRequest}>{error && <div className="page-error">{error}</div>}<div className="service-form-grid">
      <label className="span-two">Customer<select required value={requestForm.customerId} onChange={(event) => setRequestForm({ ...requestForm, customerId: event.target.value, serviceContractId: "" })}><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label><label>Active contract<select value={requestForm.serviceContractId} onChange={(event) => setRequestForm({ ...requestForm, serviceContractId: event.target.value })}><option value="">On-call request</option>{customerContracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.contractNumber} · {contract.title}</option>)}</select></label>
      <label>Request type<select value={requestForm.requestType} onChange={(event) => setRequestForm({ ...requestForm, requestType: event.target.value as ServiceRequestType })}>{Object.entries(requestTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Priority<select value={requestForm.priority} onChange={(event) => setRequestForm({ ...requestForm, priority: event.target.value as ServicePriority })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Scheduled date<input type="date" value={requestForm.scheduledDate} onChange={(event) => setRequestForm({ ...requestForm, scheduledDate: event.target.value })} /></label>
      <label className="span-two">Subject<input required value={requestForm.subject} onChange={(event) => setRequestForm({ ...requestForm, subject: event.target.value })} /></label><label>Service location<input value={requestForm.location} onChange={(event) => setRequestForm({ ...requestForm, location: event.target.value })} /></label><label className="span-three">Description<textarea required rows={4} value={requestForm.description} onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })} /></label>
      </div><div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setShowRequestForm(false)}>Cancel</button><button className="primary-action" disabled={saving}>{saving ? "Creating..." : "Create request"}</button></div></form></div></div>}
  </section>;
}
