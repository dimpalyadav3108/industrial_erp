import type { Request,Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../config/database.js";
import * as v from "../utils/finance-validation.js";
type AR=Request & {auth?:{userId?:string}};
const fail=(res:Response,e:unknown,m:string)=>{console.error(e);res.status(500).json({success:false,message:m})};
const uid=(p:string)=>`${p}-${new Date().getFullYear()}-${randomUUID().slice(0,8).toUpperCase()}`;
const audit=async(userId:string|undefined,action:string,entity:string,entityId:string,newValues:unknown)=>{await prisma.auditLog.create({data:{userId:userId??null,action,entity,entityId,newValues:newValues as object}}).catch(()=>undefined)};

export const dashboard=async(_r:Request,res:Response)=>{try{
 const [inv,bills,expenses]=await Promise.all([
  prisma.salesInvoice.findMany({where:{status:{not:"CANCELLED"}},select:{totalAmount:true,paidAmount:true,balanceAmount:true,status:true,dueDate:true}}),
  prisma.vendorBill.findMany({where:{status:{not:"CANCELLED"}},select:{totalAmount:true,paidAmount:true,balanceAmount:true,status:true,dueDate:true}}),
  prisma.financeExpense.findMany({where:{status:{not:"CANCELLED"}},select:{totalAmount:true,status:true}})
 ]);
 const n=(x:unknown)=>Number(x??0);
 res.json({success:true,data:{
  receivable:inv.reduce((a,x)=>a+n(x.balanceAmount),0),
  payable:bills.reduce((a,x)=>a+n(x.balanceAmount),0),
  invoiced:inv.reduce((a,x)=>a+n(x.totalAmount),0),
  received:inv.reduce((a,x)=>a+n(x.paidAmount),0),
  vendorPaid:bills.reduce((a,x)=>a+n(x.paidAmount),0),
  expenses:expenses.reduce((a,x)=>a+n(x.totalAmount),0),
  overdueReceivables:inv.filter(x=>x.dueDate&&x.dueDate<new Date()&&n(x.balanceAmount)>0).reduce((a,x)=>a+n(x.balanceAmount),0),
  overduePayables:bills.filter(x=>x.dueDate&&x.dueDate<new Date()&&n(x.balanceAmount)>0).reduce((a,x)=>a+n(x.balanceAmount),0)
 }});
}catch(e){fail(res,e,"Unable to load finance dashboard")}};

export const listAccounts=async(_r:Request,res:Response)=>{try{res.json({success:true,data:await prisma.financeAccount.findMany({orderBy:[{accountType:"asc"},{code:"asc"}]})})}catch(e){fail(res,e,"Unable to load accounts")}};
export const createAccount=async(req:AR,res:Response)=>{try{const p=v.accountSchema.safeParse(req.body);if(!p.success)return void res.status(400).json({success:false,message:"Invalid account",errors:p.error.flatten().fieldErrors});const data=await prisma.financeAccount.create({data:{...p.data,parentId:p.data.parentId??null,description:p.data.description??null}});await audit(req.auth?.userId,"CREATE","FinanceAccount",data.id,data);res.status(201).json({success:true,data})}catch(e){fail(res,e,"Unable to create account")}};

const journalInclude={lines:{include:{account:true}},createdBy:{select:{id:true,employeeCode:true,firstName:true,lastName:true}},postedBy:{select:{id:true,employeeCode:true,firstName:true,lastName:true}}} as const;
export const listJournals=async(_r:Request,res:Response)=>{try{res.json({success:true,data:await prisma.financeJournalEntry.findMany({include:journalInclude,orderBy:{journalDate:"desc"}})})}catch(e){fail(res,e,"Unable to load journals")}};
export const createJournal=async(req:AR,res:Response)=>{try{const p=v.journalSchema.safeParse(req.body);if(!p.success)return void res.status(400).json({success:false,message:"Invalid journal",errors:p.error.flatten().fieldErrors});const debit=p.data.lines.reduce((a,x)=>a+x.debit,0),credit=p.data.lines.reduce((a,x)=>a+x.credit,0);if(Math.abs(debit-credit)>.005||debit<=0)return void res.status(400).json({success:false,message:"Journal debit and credit must be equal and greater than zero"});const data=await prisma.financeJournalEntry.create({data:{journalNumber:uid("JV"),journalDate:p.data.journalDate?new Date(p.data.journalDate):new Date(),description:p.data.description,referenceType:p.data.referenceType??null,referenceId:p.data.referenceId??null,createdById:req.auth?.userId??null,lines:{create:p.data.lines.map(x=>({accountId:x.accountId,description:x.description??null,debit:x.debit,credit:x.credit}))}},include:journalInclude});await audit(req.auth?.userId,"CREATE","FinanceJournalEntry",data.id,data);res.status(201).json({success:true,data})}catch(e){fail(res,e,"Unable to create journal")}};
export const postJournal=async(req:AR,res:Response)=>{try{const id=String(req.params.id);const old=await prisma.financeJournalEntry.findUnique({where:{id}});if(!old)return void res.status(404).json({success:false,message:"Journal not found"});if(old.status!=="DRAFT")return void res.status(400).json({success:false,message:"Only draft journals can be posted"});const data=await prisma.financeJournalEntry.update({where:{id},data:{status:"POSTED",postedAt:new Date(),postedById:req.auth?.userId??null},include:journalInclude});await audit(req.auth?.userId,"POST","FinanceJournalEntry",id,data);res.json({success:true,data})}catch(e){fail(res,e,"Unable to post journal")}};

export const receivables=async(_r:Request,res:Response)=>{try{const data=await prisma.salesInvoice.findMany({where:{status:{not:"CANCELLED"}},include:{customer:{select:{id:true,customerCode:true,companyName:true}},payments:true},orderBy:{invoiceDate:"desc"}});res.json({success:true,data})}catch(e){fail(res,e,"Unable to load receivables")}};

const billInclude={vendor:true,grn:{select:{id:true,grnNumber:true,invoiceNumber:true,receiptDate:true}},payments:true} as const;
export const eligibleGrns=async(_r:Request,res:Response)=>{try{const data=await prisma.goodsReceiptNote.findMany({where:{postedAt:{not:null},status:{in:["ACCEPTED","PARTIALLY_ACCEPTED"]},vendorBill:null},include:{vendor:true,purchaseOrder:{select:{id:true,poNumber:true,totalAmount:true,currency:true}},items:true},orderBy:{receiptDate:"desc"}});res.json({success:true,data})}catch(e){fail(res,e,"Unable to load eligible GRNs")}};
export const listBills=async(_r:Request,res:Response)=>{try{res.json({success:true,data:await prisma.vendorBill.findMany({include:billInclude,orderBy:{billDate:"desc"}})})}catch(e){fail(res,e,"Unable to load vendor bills")}};
export const createBill=async(req:AR,res:Response)=>{try{const p=v.vendorBillSchema.safeParse(req.body);if(!p.success)return void res.status(400).json({success:false,message:"Invalid vendor bill",errors:p.error.flatten().fieldErrors});const grn=await prisma.goodsReceiptNote.findUnique({where:{id:p.data.grnId},include:{items:true,purchaseOrder:true,vendorBill:true}});if(!grn)return void res.status(404).json({success:false,message:"GRN not found"});if(!grn.postedAt||!["ACCEPTED","PARTIALLY_ACCEPTED"].includes(grn.status))return void res.status(400).json({success:false,message:"Only posted accepted GRNs can create vendor bills"});if(grn.vendorBill)return void res.status(409).json({success:false,message:"Vendor bill already exists for this GRN"});const amount=grn.items.reduce((a,x)=>a+Number(x.acceptedQuantity)*Number(x.unitCost),0);if(amount<=0)return void res.status(400).json({success:false,message:"Accepted GRN value must be greater than zero"});const data=await prisma.vendorBill.create({data:{billNumber:uid("VB"),vendorId:grn.vendorId,grnId:grn.id,vendorInvoice:grn.invoiceNumber,billDate:grn.receiptDate,dueDate:p.data.dueDate?new Date(p.data.dueDate):null,currency:grn.purchaseOrder.currency,totalAmount:amount,balanceAmount:amount,notes:p.data.notes??null,createdById:req.auth?.userId??null},include:billInclude});await audit(req.auth?.userId,"CREATE","VendorBill",data.id,data);res.status(201).json({success:true,data})}catch(e){fail(res,e,"Unable to create vendor bill")}};

export const createVendorPayment=async(req:AR,res:Response)=>{try{const p=v.vendorPaymentSchema.safeParse(req.body);if(!p.success)return void res.status(400).json({success:false,message:"Invalid vendor payment",errors:p.error.flatten().fieldErrors});const bill=await prisma.vendorBill.findUnique({where:{id:p.data.vendorBillId}});if(!bill)return void res.status(404).json({success:false,message:"Vendor bill not found"});if(["PAID","CANCELLED"].includes(bill.status))return void res.status(400).json({success:false,message:"Bill is not payable"});const balance=Number(bill.balanceAmount);if(p.data.amount>balance+.005)return void res.status(400).json({success:false,message:"Payment cannot exceed bill balance"});const paid=Number(bill.paidAmount)+p.data.amount,newBalance=Math.max(0,Number(bill.totalAmount)-paid);const result=await prisma.$transaction(async tx=>{const payment=await tx.vendorPayment.create({data:{paymentNumber:uid("VP"),vendorBillId:bill.id,vendorId:bill.vendorId,paymentDate:p.data.paymentDate?new Date(p.data.paymentDate):new Date(),amount:p.data.amount,method:p.data.method,referenceNumber:p.data.referenceNumber??null,notes:p.data.notes??null,recordedById:req.auth?.userId??null}});await tx.vendorBill.update({where:{id:bill.id},data:{paidAmount:paid,balanceAmount:newBalance,status:newBalance<=.005?"PAID":"PARTIALLY_PAID"}});return payment});await audit(req.auth?.userId,"CREATE","VendorPayment",result.id,result);res.status(201).json({success:true,data:result})}catch(e){fail(res,e,"Unable to record vendor payment")}};

export const listExpenses=async(_r:Request,res:Response)=>{try{res.json({success:true,data:await prisma.financeExpense.findMany({include:{vendor:true},orderBy:{expenseDate:"desc"}})})}catch(e){fail(res,e,"Unable to load expenses")}};
export const createExpense=async(req:AR,res:Response)=>{try{
 const p=v.expenseSchema.safeParse(req.body);
 if(!p.success)return void res.status(400).json({success:false,message:"Invalid expense",errors:p.error.flatten().fieldErrors});
 const x=p.data,base=x.amount,rate=x.gstRate??0,type=x.gstType??"NONE";
 let cgst=0,sgst=0,igst=0;
 if(type==="CGST_SGST"){cgst=base*(rate/2)/100;sgst=base*(rate/2)/100}
 if(type==="IGST")igst=base*rate/100;
 const tax=cgst+sgst+igst;
 const data=await prisma.financeExpense.create({data:{expenseNumber:uid("EXP"),expenseDate:x.expenseDate?new Date(x.expenseDate):new Date(),category:x.category,description:x.description,vendorId:x.vendorId??null,amount:base,gstType:type,gstRate:rate,cgstAmount:cgst,sgstAmount:sgst,igstAmount:igst,taxAmount:tax,totalAmount:base+tax,paymentMethod:x.paymentMethod??null,referenceNumber:x.referenceNumber??null,notes:x.notes??null,createdById:req.auth?.userId??null}});
 await audit(req.auth?.userId,"CREATE","FinanceExpense",data.id,data);res.status(201).json({success:true,data})
}catch(e){fail(res,e,"Unable to create expense")}};

export const updateExpense=async(req:AR,res:Response)=>{try{const p=v.expenseUpdateSchema.safeParse(req.body);if(!p.success)return void res.status(400).json({success:false,message:"Invalid expense status"});const id=String(req.params.id);
const updateData = {
  status:p.data.status,
  ...(p.data.status==="APPROVED"?{approvedById:req.auth?.userId??null,approvedAt:new Date()}:{}),
  ...(p.data.status==="PAID"?{paidAt:new Date()}:{}),
};
const data=await prisma.financeExpense.update({where:{id},data:updateData});await audit(req.auth?.userId,"UPDATE","FinanceExpense",id,data);res.json({success:true,data})}catch(e){fail(res,e,"Unable to update expense")}};

async function balances(){
 const accounts=await prisma.financeAccount.findMany({where:{isActive:true},include:{journalLines:{where:{journal:{status:"POSTED"}},select:{debit:true,credit:true}}},orderBy:{code:"asc"}});
 return accounts.map(a=>{const debit=a.journalLines.reduce((s,x)=>s+Number(x.debit),0),credit=a.journalLines.reduce((s,x)=>s+Number(x.credit),0);return{id:a.id,code:a.code,name:a.name,accountType:a.accountType,debit,credit,balance:["ASSET","EXPENSE"].includes(a.accountType)?debit-credit:credit-debit}});
}
export const trialBalance=async(_r:Request,res:Response)=>{try{res.json({success:true,data:await balances()})}catch(e){fail(res,e,"Unable to load trial balance")}};
export const profitLoss=async(_r:Request,res:Response)=>{try{const b=await balances(),income=b.filter(x=>x.accountType==="INCOME").reduce((a,x)=>a+x.balance,0),expense=b.filter(x=>x.accountType==="EXPENSE").reduce((a,x)=>a+x.balance,0);res.json({success:true,data:{income,expense,profit:income-expense,accounts:b.filter(x=>["INCOME","EXPENSE"].includes(x.accountType))}})}catch(e){fail(res,e,"Unable to load profit and loss")}};
export const balanceSheet=async(_r:Request,res:Response)=>{try{const b=await balances(),sum=(t:string)=>b.filter(x=>x.accountType===t).reduce((a,x)=>a+x.balance,0);res.json({success:true,data:{assets:sum("ASSET"),liabilities:sum("LIABILITY"),equity:sum("EQUITY"),accounts:b.filter(x=>["ASSET","LIABILITY","EQUITY"].includes(x.accountType))}})}catch(e){fail(res,e,"Unable to load balance sheet")}};

export const gstSummary=async(_r:Request,res:Response)=>{try{
 const rows=await prisma.financeExpense.findMany({where:{status:{not:"CANCELLED"}},select:{amount:true,taxAmount:true,cgstAmount:true,sgstAmount:true,igstAmount:true}});
 const n=(v:unknown)=>Number(v??0);
 res.json({success:true,data:{taxableAmount:rows.reduce((a,x)=>a+n(x.amount),0),cgst:rows.reduce((a,x)=>a+n(x.cgstAmount),0),sgst:rows.reduce((a,x)=>a+n(x.sgstAmount),0),igst:rows.reduce((a,x)=>a+n(x.igstAmount),0),totalGst:rows.reduce((a,x)=>a+n(x.taxAmount),0),records:rows.length}})
}catch(e){fail(res,e,"Unable to load GST summary")}};
