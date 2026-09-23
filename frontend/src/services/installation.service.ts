import type{CheckStatus,InstallationJob,InstallationStatus,SpareItem,SpareMovementType,TestStatus,SiteUpdateType,InstallationReportType}from"../types/installation";
import type{Dispatch}from"../types/dispatch";
const API=import.meta.env.VITE_API_URL||"http://localhost:5000/api"; const h=(j=false)=>{const t=localStorage.getItem("accessToken");if(!t)throw new Error("Your session has expired. Please sign in again.");return{...(j?{"Content-Type":"application/json"}:{}),Authorization:`Bearer ${t}`}};
async function call<T>(p:string,i?:RequestInit):Promise<T>{const r=await fetch(`${API}/installations${p}`,{...i,headers:{...h(Boolean(i?.body)),...(i?.headers||{})}});const x=await r.json();if(!r.ok)throw new Error(x.message||"Installation request failed");return x.data}
export const getInstallations=(s="")=>call<InstallationJob[]>(s?`?search=${encodeURIComponent(s)}`:"");
export const getEligibleDispatches=()=>call<Dispatch[]>("/eligible-dispatches"); export const getSpareItems=()=>call<SpareItem[]>("/spare-items");
export const createInstallation=(p:unknown)=>call<InstallationJob>("",{method:"POST",body:JSON.stringify(p)});
export const updateInstallation=(id:string,p:Partial<{status:InstallationStatus;customerSignoffName:string;customerSignoffNotes:string;commissioningReportUrl:string;notes:string}>)=>call<InstallationJob>(`/${id}`,{method:"PATCH",body:JSON.stringify(p)});
export const updateChecklist=(id:string,itemId:string,p:{status:CheckStatus;remarks?:string})=>call<InstallationJob>(`/${id}/checklist/${itemId}`,{method:"PATCH",body:JSON.stringify(p)});
export const updateCommissioningTest=(id:string,testId:string,p:{status:TestStatus;observedValue?:string;remarks?:string})=>call<InstallationJob>(`/${id}/tests/${testId}`,{method:"PATCH",body:JSON.stringify(p)});
export const recordSpareMovement=(id:string,p:{inventoryItemId:string;movementType:SpareMovementType;quantity:number;notes?:string})=>call<InstallationJob>(`/${id}/spares`,{method:"POST",body:JSON.stringify(p)});
export const activateWarranty=(id:string,p:{title:string;startDate:string;endDate:string;notes?:string})=>call<InstallationJob>(`/${id}/warranty`,{method:"POST",body:JSON.stringify(p)});
export const createSiteUpdate=(id:string,p:{type:SiteUpdateType;title:string;description?:string;photoUrl?:string;progressPct?:number;issueStatus?:string})=>call<InstallationJob>(`/${id}/site-updates`,{method:"POST",body:JSON.stringify(p)});
export const createReport=(id:string,p:{reportType:InstallationReportType;title:string;steamPressure?:string;fuelConsumption?:string;efficiency?:string;observations?:string;reportUrl?:string})=>call<InstallationJob>(`/${id}/reports`,{method:"POST",body:JSON.stringify(p)});
export const generateCertificate=(id:string)=>call<InstallationJob>(`/${id}/commissioning-certificate`,{method:"POST",body:JSON.stringify({})});

export const uploadSitePhoto=(id:string,p:{fileName:string;dataUrl:string;title?:string})=>call<{id:string;url:string;fileName:string}>(`/${id}/site-photos`,{method:"POST",body:JSON.stringify(p)});
