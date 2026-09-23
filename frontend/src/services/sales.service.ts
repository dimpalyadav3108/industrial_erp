import type {CreateSalesOrderPayload,EligibleQuotation,InvoiceStatus,PaymentMethod,SalesInvoice,SalesOrder,SalesOrderStatus} from "../types/sales";
const API_URL=import.meta.env.VITE_API_URL||"http://localhost:5000/api";
function token(){return localStorage.getItem("accessToken");}
async function request<T>(path:string,options:RequestInit={}){const response=await fetch(`${API_URL}${path}`,{...options,headers:{"Content-Type":"application/json",...(token()?{Authorization:`Bearer ${token()}`}:{}) ,...(options.headers||{})}});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.message||"Request failed");return body.data as T;}
export const getEligibleSalesQuotations=()=>request<EligibleQuotation[]>("/sales/eligible-quotations");
export const getSalesOrders=()=>request<SalesOrder[]>("/sales/orders");
export const createSalesOrder=(data:CreateSalesOrderPayload)=>request<SalesOrder>("/sales/orders",{method:"POST",body:JSON.stringify(data)});
export const updateSalesOrder=(id:string,data:{status?:SalesOrderStatus})=>request<SalesOrder>(`/sales/orders/${id}`,{method:"PATCH",body:JSON.stringify(data)});
export const getSalesInvoices=()=>request<SalesInvoice[]>("/sales/invoices");
export const createSalesInvoice=(data:{salesOrderId:string;invoiceDate?:string;dueDate?:string;billingAddress?:string;notes?:string})=>request<SalesInvoice>("/sales/invoices",{method:"POST",body:JSON.stringify(data)});
export const updateSalesInvoice=(id:string,data:{status?:InvoiceStatus;dueDate?:string|null;notes?:string|null})=>request<SalesInvoice>(`/sales/invoices/${id}`,{method:"PATCH",body:JSON.stringify(data)});
export const createSalesPayment=(data:{invoiceId:string;paymentDate?:string;amount:number;method:PaymentMethod;referenceNumber?:string;notes?:string})=>request<{payment:unknown;invoice:SalesInvoice}>("/sales/payments",{method:"POST",body:JSON.stringify(data)});
