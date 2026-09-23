import type * as T from "../types/quality";

const API=import.meta.env.VITE_API_URL||"http://localhost:5000/api";

interface E{success:false;message:string}

const h=(json=false)=>{
  const token=localStorage.getItem("accessToken");
  if(!token)throw new Error("Your session has expired. Please sign in again.");
  return {...(json?{"Content-Type":"application/json"}:{}),Authorization:`Bearer ${token}`};
};

async function call<T>(path:string,init?:RequestInit):Promise<T>{
  const r=await fetch(`${API}/quality${path}`,{
    ...init,
    headers:{...h(Boolean(init?.body)),...(init?.headers||{})}
  });
  const x=await r.json() as {success:boolean;data:T;message?:string}|E;
  if(!r.ok)throw new Error(x.message||"Quality request failed");
  return (x as any).data;
}

export const getQualityInspections=(s="")=>call<T.QualityInspection[]>(s?`?search=${encodeURIComponent(s)}`:"");

export const createQualityInspection=(p:T.CreateQualityInspectionPayload)=>
  call<T.QualityInspection>("",{method:"POST",body:JSON.stringify(p)});

export const updateQualityInspection=(
  id:string,
  p:{status:"PENDING"|"PASSED"|"FAILED"|"CANCELLED";remarks?:string}
)=>call<T.QualityInspection>(`/${id}`,{
  method:"PATCH",
  body:JSON.stringify(p)
});

export const updateQualityCheck=(i:string,c:string,p:{result:T.QualityCheckResult;observedValue?:string;remarks?:string})=>
  call<T.QualityInspection>(`/${i}/checks/${c}`,{method:"PATCH",body:JSON.stringify(p)});

export const getQualityDashboard=()=>call<T.QualityDashboard>("/dashboard");

export const getItps=()=>call<T.InspectionTestPlan[]>("/itps");
export const createItp=(p:unknown)=>call<T.InspectionTestPlan>("/itps",{method:"POST",body:JSON.stringify(p)});

export const getIbrDocuments=()=>call<T.IbrDocument[]>("/ibr");
export const createIbrDocument=(p:unknown)=>call<T.IbrDocument>("/ibr",{method:"POST",body:JSON.stringify(p)});

export const getWeldingProcedures=()=>call<T.WeldingProcedure[]>("/welding/procedures");
export const createWeldingProcedure=(p:unknown)=>call<T.WeldingProcedure>("/welding/procedures",{method:"POST",body:JSON.stringify(p)});

export const getWelderQualifications=()=>call<T.WelderQualification[]>("/welding/welders");
export const createWelderQualification=(p:unknown)=>call<T.WelderQualification>("/welding/welders",{method:"POST",body:JSON.stringify(p)});

export const getWeldJoints=()=>call<T.WeldJoint[]>("/welding/joints");
export const createWeldJoint=(p:unknown)=>call<T.WeldJoint>("/welding/joints",{method:"POST",body:JSON.stringify(p)});

export const getNcrs=()=>call<T.NCR[]>("/ncrs");
export const createNcr=(p:unknown)=>call<T.NCR>("/ncrs",{method:"POST",body:JSON.stringify(p)});
export const updateNcr=(id:string,p:unknown)=>call<T.NCR>(`/ncrs/${id}`,{method:"PATCH",body:JSON.stringify(p)});

export const getCapas=()=>call<T.CAPA[]>("/capas");
export const createCapa=(p:unknown)=>call<T.CAPA>("/capas",{method:"POST",body:JSON.stringify(p)});
export const updateCapa=(id:string,p:unknown)=>call<T.CAPA>(`/capas/${id}`,{method:"PATCH",body:JSON.stringify(p)});
