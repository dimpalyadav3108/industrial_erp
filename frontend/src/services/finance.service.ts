import type{FinanceAccount,FinanceDashboard,JournalEntry,Receivable,EligibleGrn,VendorBill,FinanceExpense,BalanceRow,AccountType,PaymentMethod,ExpenseStatus,GstType,GstSummary}from"../types/finance";
const API=import.meta.env.VITE_API_URL||"http://localhost:5000/api";
const h=(j=false)=>{const t=localStorage.getItem("accessToken");if(!t)throw new Error("Your session has expired. Please sign in again.");return{...(j?{"Content-Type":"application/json"}:{}),Authorization:`Bearer ${t}`}};
async function call<T>(path:string,init?:RequestInit){const r=await fetch(`${API}/finance${path}`,init);const x=await r.json();if(!r.ok)throw new Error(x.message||"Finance request failed");return x.data as T}
export const getFinanceDashboard=()=>call<FinanceDashboard>("/dashboard",{headers:h()}); export const getAccounts=()=>call<FinanceAccount[]>("/accounts",{headers:h()}); export const createAccount=(p:{code:string;name:string;accountType:AccountType;description?:string})=>call<FinanceAccount>("/accounts",{method:"POST",headers:h(true),body:JSON.stringify(p)});
export const getJournals=()=>call<JournalEntry[]>("/journals",{headers:h()}); export const createJournal=(p:{journalDate?:string;description:string;lines:Array<{accountId:string;description?:string;debit:number;credit:number}>})=>call<JournalEntry>("/journals",{method:"POST",headers:h(true),body:JSON.stringify(p)}); export const postJournal=(id:string)=>call<JournalEntry>(`/journals/${id}/post`,{method:"POST",headers:h(true)});
export const getReceivables=()=>call<Receivable[]>("/receivables",{headers:h()}); export const getEligibleGrns=()=>call<EligibleGrn[]>("/eligible-grns",{headers:h()}); export const getVendorBills=()=>call<VendorBill[]>("/vendor-bills",{headers:h()}); export const createVendorBill=(p:{grnId:string;dueDate?:string;notes?:string})=>call<VendorBill>("/vendor-bills",{method:"POST",headers:h(true),body:JSON.stringify(p)}); export const createVendorPayment=(p:{vendorBillId:string;amount:number;method:PaymentMethod;paymentDate?:string;referenceNumber?:string})=>call("/vendor-payments",{method:"POST",headers:h(true),body:JSON.stringify(p)});
export const getExpenses=()=>call<FinanceExpense[]>("/expenses",{headers:h()}); export const createExpense=(p:{expenseDate?:string;category:string;description:string;amount:number;gstType:GstType;gstRate:number;paymentMethod?:PaymentMethod;referenceNumber?:string})=>call<FinanceExpense>("/expenses",{method:"POST",headers:h(true),body:JSON.stringify(p)}); export const updateExpenseStatus=(id:string,status:ExpenseStatus)=>call<FinanceExpense>(`/expenses/${id}`,{method:"PATCH",headers:h(true),body:JSON.stringify({status})});
export const getGstSummary=()=>call<GstSummary>("/gst-summary",{headers:h()});
export const getTrialBalance=()=>call<BalanceRow[]>("/reports/trial-balance",{headers:h()}); export const getProfitLoss=()=>call<{income:number;expense:number;profit:number;accounts:BalanceRow[]}>("/reports/profit-loss",{headers:h()}); export const getBalanceSheet=()=>call<{assets:number;liabilities:number;equity:number;accounts:BalanceRow[]}>("/reports/balance-sheet",{headers:h()});
export const createCustomerReceipt=(p:{invoiceId:string;amount:number;method:PaymentMethod;paymentDate?:string;referenceNumber?:string;notes?:string})=>call<any>("/receipts",{method:"POST",headers:h(true),body:JSON.stringify(p)});
export const getReceipts=()=>call<any[]>("/receipts",{headers:h()});
export const createPaymentFollowUp=(p:any)=>call<any>("/payment-followups",{method:"POST",headers:h(true),body:JSON.stringify(p)});
export const getPaymentFollowUps=()=>call<any[]>("/payment-followups",{headers:h()});
export const getVendorPaymentApprovals=()=>call<any[]>("/vendor-payment-approvals",{headers:h()});
export const approveVendorPayment=(id:string,decision:"APPROVED"|"REJECTED",rejectionReason?:string)=>call<any>(`/vendor-payment-approvals/${id}`,{method:"PATCH",headers:h(true),body:JSON.stringify({decision,rejectionReason})});
export const getCashFlow=()=>call<any>("/reports/cash-flow",{headers:h()});
export const getCustomerProfitability=()=>call<any[]>("/reports/customer-profitability",{headers:h()});
export const getProductProfitability=()=>call<any[]>("/reports/product-profitability",{headers:h()});
export const getProjectProfitability=()=>call<any[]>("/reports/project-profitability",{headers:h()});
export const getRevenueRecognitions=()=>call<any[]>("/revenue-recognition",{headers:h()});
export const createRevenueRecognition=(p:any)=>call<any>("/revenue-recognition",{method:"POST",headers:h(true),body:JSON.stringify(p)});
export const getTdsSummary=()=>call<any[]>("/tds-summary",{headers:h()});
export const createTds=(p:any)=>call<any>("/tds",{method:"POST",headers:h(true),body:JSON.stringify(p)});

export const createProductCost=(p:{productName:string;standardCost:number})=>call<any>("/product-costs",{method:"POST",headers:h(true),body:JSON.stringify(p)});
