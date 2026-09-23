import type {EligibleOrder,MilestoneStatus,Priority,Project,ProjectStatus,TaskStatus} from "../types/project";
const API_URL=import.meta.env.VITE_API_URL||"http://localhost:5000/api";
function token(){return localStorage.getItem("accessToken");}
async function request<T>(path:string,options:RequestInit={}){const response=await fetch(`${API_URL}${path}`,{...options,headers:{"Content-Type":"application/json",...(token()?{Authorization:`Bearer ${token()}`}:{}) ,...(options.headers||{})}});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.message||"Request failed");return body.data as T;}
export const getEligibleProjectOrders=()=>request<EligibleOrder[]>("/projects/eligible-orders");
export const getProjects=()=>request<Project[]>("/projects");
export const createProject=(d:{salesOrderId:string;title:string;priority:Priority;plannedStartDate?:string;plannedEndDate?:string;notes?:string})=>request<Project>("/projects",{method:"POST",body:JSON.stringify(d)});
export const updateProject=(id:string,d:{status?:ProjectStatus;stage?:Project["stage"];priority?:Priority;plannedEndDate?:string|null;notes?:string|null;actualCost?:number;revenueAmount?:number})=>request<Project>(`/projects/${id}`,{method:"PATCH",body:JSON.stringify(d)});
export const createMilestone=(d:{projectId:string;name:string;plannedDate?:string;notes?:string})=>request("/projects/milestones/create",{method:"POST",body:JSON.stringify(d)});
export const updateMilestone=(id:string,d:{status?:MilestoneStatus;progressPercent?:number})=>request(`/projects/milestones/${id}`,{method:"PATCH",body:JSON.stringify(d)});
export const createProjectTask=(d:{projectId:string;milestoneId?:string;title:string;department?:string;priority:Priority;dueDate?:string})=>request("/projects/tasks/create",{method:"POST",body:JSON.stringify(d)});
export const updateProjectTask=(id:string,d:{status?:TaskStatus})=>request(`/projects/tasks/${id}`,{method:"PATCH",body:JSON.stringify(d)});

export const getProjectSummary=(id:string)=>request<any>(`/projects/${id}/summary`);
export const createProjectCost=(d:{projectId:string;category:string;description:string;plannedCost:number;actualCost:number})=>request(`/projects/cost-lines/create`,{method:"POST",body:JSON.stringify(d)});
