
const KEY='ao_accounts_v3';
const OLD_KEYS=['ao_accounts_v2','ao_accounts_v1'];
const LANG_KEY='ao_accounts_lang';
const $=id=>document.getElementById(id);

function loadData(){
  let d=localStorage.getItem(KEY);
  if(d) return JSON.parse(d);
  for(const k of OLD_KEYS){
    const old=localStorage.getItem(k);
    if(old){
      try{
        const parsed=JSON.parse(old);
        localStorage.setItem(KEY,JSON.stringify(parsed));
        return parsed;
      }catch(e){}
    }
  }
  return {invoices:[]};
}
let data=loadData();
let currentLang=localStorage.getItem(LANG_KEY)||'ar';
let previewInvoiceId=null;

const i18n={
ar:{
newInvoice:"+ فاتورة جديدة",newInvoiceTitle:"فاتورة جديدة",editInvoiceTitle:"تعديل الفاتورة",overview:"نظرة عامة",
dashboardTitle:"لوحة الفواتير والأرصدة",dashboardSubtitle:"متابعة الفواتير، المبالغ المسددة، والأرصدة المتبقية.",
totalInvoices:"إجمالي الفواتير",totalPaid:"إجمالي المسدد",totalBalance:"إجمالي المتبقي",records:"السجلات",invoices:"الفواتير",
searchPlaceholder:"بحث بالعميل أو رقم الفاتورة",invoiceNo:"رقم الفاتورة",date:"التاريخ",customer:"العميل",total:"الإجمالي",paid:"المسدد",
remaining:"المتبقي",status:"الحالة",actions:"إجراءات",invoice:"فاتورة",customerName:"اسم العميل",description:"البيان / الوصف",
amount:"المبلغ",cancel:"إلغاء",saveInvoice:"حفظ الفاتورة",payment:"سداد",recordPayment:"تسجيل سداد",
paymentMethod:"طريقة الدفع",paymentNote:"ملاحظة السداد",pay:"سداد",preview:"معاينة",edit:"تعديل",delete:"حذف",
editPayment:"تعديل السداد",deletePayment:"حذف السداد",savePayment:"حفظ تعديل السداد",deletePaymentConfirm:"هل تريد حذف هذه الدفعة؟",
unpaid:"غير مدفوعة",partial:"مدفوعة جزئيًا",paidFull:"مدفوعة بالكامل",noInvoices:"لا توجد فواتير حتى الآن",
invalidPayment:"قيمة السداد غير صحيحة أو أكبر من الرصيد المتبقي.",deleteConfirm:"هل تريد حذف هذه الفاتورة؟ لا يمكن التراجع عن ذلك.",
close:"إغلاق",printSavePdf:"طباعة / حفظ PDF",invoiceTitle:"فاتورة / INVOICE",customerPrint:"اسم العميل / Customer",
statusPrint:"الحالة / Status",descriptionPrint:"البيان / Description",amountPrint:"المبلغ / Amount",
subtotalPrint:"المبلغ قبل الضريبة / Subtotal",totalPrint:"الإجمالي / Total",paidPrint:"المسدد / Paid",remainingPrint:"المتبقي / Balance",
paymentsPrint:"الدفعات المسجلة / Payments",methodPrint:"الطريقة / Method",notePrint:"ملاحظة / Note",noPayments:"لا توجد دفعات مسجلة"
},
en:{
newInvoice:"+ New Invoice",newInvoiceTitle:"New Invoice",editInvoiceTitle:"Edit Invoice",overview:"Overview",
dashboardTitle:"Invoices & Balances Dashboard",dashboardSubtitle:"Track invoices, payments, and outstanding balances.",
totalInvoices:"Total Invoices",totalPaid:"Total Paid",totalBalance:"Outstanding Balance",records:"Records",invoices:"Invoices",
searchPlaceholder:"Search by customer or invoice number",invoiceNo:"Invoice No.",date:"Date",customer:"Customer",total:"Total",paid:"Paid",
remaining:"Remaining",status:"Status",actions:"Actions",invoice:"Invoice",customerName:"Customer Name",description:"Description",
amount:"Amount",cancel:"Cancel",saveInvoice:"Save Invoice",payment:"Payment",recordPayment:"Record Payment",
paymentMethod:"Payment Method",paymentNote:"Payment Note",pay:"Pay",preview:"Preview",edit:"Edit",delete:"Delete",
editPayment:"Edit Payment",deletePayment:"Delete Payment",savePayment:"Save Payment Changes",deletePaymentConfirm:"Delete this payment?",
unpaid:"Unpaid",partial:"Partially Paid",paidFull:"Paid in Full",noInvoices:"No invoices yet",
invalidPayment:"Payment amount is invalid or exceeds the remaining balance.",deleteConfirm:"Delete this invoice? This cannot be undone.",
close:"Close",printSavePdf:"Print / Save PDF",invoiceTitle:"INVOICE / فاتورة",customerPrint:"Customer / اسم العميل",
statusPrint:"Status / الحالة",descriptionPrint:"Description / البيان",amountPrint:"Amount / المبلغ",
subtotalPrint:"Subtotal / المبلغ قبل الضريبة",totalPrint:"Total / الإجمالي",paidPrint:"Paid / المسدد",remainingPrint:"Balance / المتبقي",
paymentsPrint:"Payments / الدفعات المسجلة",methodPrint:"Method / الطريقة",notePrint:"Note / ملاحظة",noPayments:"No recorded payments"
}
};

function t(k){return i18n[currentLang][k]||k}
function today(){return new Date().toISOString().slice(0,10)}
function money(n){return currentLang==='ar'?`${Number(n||0).toFixed(3)} د.ب`:`BHD ${Number(n||0).toFixed(3)}`}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function nextNo(){
  const y=new Date().getFullYear();
  const nums=data.invoices.filter(x=>x.no&&x.no.includes(y)).map(x=>parseInt(x.no.split('-').pop(),10)).filter(Number.isFinite);
  const n=(nums.length?Math.max(...nums):0)+1;
  return `AO-INV-${y}-${String(n).padStart(4,'0')}`;
}
function total(inv){return Number(inv.amount||0)}
function paid(inv){return (inv.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0)}
function balance(inv){return Math.max(0,total(inv)-paid(inv))}
function status(inv){
  const p=paid(inv), tt=total(inv);
  if(p<=0)return[t('unpaid'),'unpaid'];
  if(p+0.0005<tt)return[t('partial'),'partial'];
  return[t('paidFull'),'paid'];
}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function applyLanguage(){
  document.documentElement.lang=currentLang;
  document.documentElement.dir=currentLang==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
  $('arBtn').classList.toggle('active',currentLang==='ar');
  $('enBtn').classList.toggle('active',currentLang==='en');
  localStorage.setItem(LANG_KEY,currentLang);
  render();
}
$('arBtn').onclick=()=>{currentLang='ar';applyLanguage()}
$('enBtn').onclick=()=>{currentLang='en';applyLanguage()}

function detectDirection(el){
  const v=el.value.trim();
  if(!v){el.dir=currentLang==='ar'?'rtl':'ltr';return}
  el.dir=/[\u0600-\u06FF]/.test(v[0])?'rtl':'ltr';
}
document.querySelectorAll('.auto-dir').forEach(el=>{
  el.addEventListener('input',()=>detectDirection(el));
  el.addEventListener('focus',()=>detectDirection(el));
});

function render(){
  const q=$('search').value.trim().toLowerCase();
  const rows=[...data.invoices].reverse().filter(i=>!q||i.no.toLowerCase().includes(q)||i.customer.toLowerCase().includes(q));
  $('invoiceRows').innerHTML=rows.map(i=>{
    const [st,cl]=status(i);
    return `<tr>
      <td>${i.no}</td><td>${i.date}</td><td dir="auto">${esc(i.customer)}</td>
      <td>${money(total(i))}</td><td>${money(paid(i))}</td><td>${money(balance(i))}</td>
      <td><span class="badge ${cl}">${st}</span></td>
      <td>
        <button class="action pay" onclick="openPayment('${i.id}')">${t('pay')}</button>
        <button class="action print" onclick="openPreview('${i.id}')">${t('preview')}</button>
        <button class="action edit" onclick="editInvoice('${i.id}')">${t('edit')}</button>
        <button class="danger" onclick="deleteInvoice('${i.id}')">${t('delete')}</button>
      </td>
    </tr>`;
  }).join('')||`<tr><td colspan="8" style="text-align:center;color:#98a2b3;padding:35px">${t('noInvoices')}</td></tr>`;

  const invTotal=data.invoices.reduce((s,i)=>s+total(i),0);
  const paidTotal=data.invoices.reduce((s,i)=>s+paid(i),0);
  $('statInvoices').textContent=money(invTotal);
  $('statPaid').textContent=money(paidTotal);
  $('statBalance').textContent=money(invTotal-paidTotal);
}

$('newInvoiceBtn').onclick=()=>{
  $('invoiceForm').reset();
  $('invoiceId').value='';
  $('invoiceNo').value=nextNo();
  $('invoiceDate').value=today();
  $('invoiceDialogTitle').textContent=t('newInvoiceTitle');
  calcPreview();
  $('invoiceDialog').showModal();
}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('amount').addEventListener('input',calcPreview);
function calcPreview(){
  const a=Number($('amount').value||0);
  $('invoiceTotalPreview').textContent=money(a);
}
$('invoiceForm').onsubmit=e=>{
  e.preventDefault();
  const id=$('invoiceId').value;
  if(id){
    const inv=data.invoices.find(x=>x.id===id);
    if(!inv)return;
    const newAmount=Number($('amount').value);
    const newTotal=newAmount;
    if(newTotal+0.0005<paid(inv)){
      alert(currentLang==='ar'?'لا يمكن تخفيض إجمالي الفاتورة إلى أقل من المبلغ المسدد.':'Invoice total cannot be lower than the amount already paid.');
      return;
    }
    inv.date=$('invoiceDate').value; inv.customer=$('customerName').value.trim();
    inv.description=$('description').value.trim(); inv.amount=newAmount;
    inv.vatRate=0;
  }else{
    data.invoices.push({id:crypto.randomUUID(),no:$('invoiceNo').value,date:$('invoiceDate').value,
      customer:$('customerName').value.trim(),description:$('description').value.trim(),
      amount:Number($('amount').value),vatRate:0,payments:[]});
  }
  save();$('invoiceDialog').close();
}
window.editInvoice=id=>{
  const inv=data.invoices.find(x=>x.id===id);if(!inv)return;
  $('invoiceId').value=inv.id;$('invoiceNo').value=inv.no;$('invoiceDate').value=inv.date;
  $('customerName').value=inv.customer;$('description').value=inv.description;
  $('amount').value=Number(inv.amount).toFixed(3);
  $('invoiceDialogTitle').textContent=t('editInvoiceTitle');calcPreview();
  detectDirection($('customerName'));detectDirection($('description'));
  $('invoiceDialog').showModal();
}
window.deleteInvoice=id=>{
  if(!confirm(t('deleteConfirm')))return;
  data.invoices=data.invoices.filter(x=>x.id!==id);save();
}

window.openPayment=id=>{
  const inv=data.invoices.find(x=>x.id===id);if(!inv)return;
  $('paymentInvoiceId').value=id;$('paymentId').value='';
  $('paymentDate').value=today();
  $('paymentAmount').value=balance(inv).toFixed(3);$('paymentNote').value='';
  $('paymentMethod').value='Bank Transfer';
  $('paymentDialogTitle').textContent=t('recordPayment');
  $('paymentSubmitBtn').textContent=t('recordPayment');
  $('paymentDialog').showModal();
}
window.editPayment=(invoiceId,paymentId)=>{
  const inv=data.invoices.find(x=>x.id===invoiceId);if(!inv)return;
  const p=(inv.payments||[]).find(x=>x.id===paymentId);if(!p)return;
  $('paymentInvoiceId').value=invoiceId;$('paymentId').value=paymentId;
  $('paymentDate').value=p.date;$('paymentAmount').value=Number(p.amount).toFixed(3);
  $('paymentMethod').value=p.method;$('paymentNote').value=p.note||'';
  $('paymentDialogTitle').textContent=t('editPayment');
  $('paymentSubmitBtn').textContent=t('savePayment');
  $('paymentDialog').showModal();
}
window.deletePayment=(invoiceId,paymentId)=>{
  if(!confirm(t('deletePaymentConfirm')))return;
  const inv=data.invoices.find(x=>x.id===invoiceId);if(!inv)return;
  inv.payments=(inv.payments||[]).filter(x=>x.id!==paymentId);
  save();
  if(previewInvoiceId===invoiceId) openPreview(invoiceId);
}
$('paymentForm').onsubmit=e=>{
  e.preventDefault();
  const inv=data.invoices.find(x=>x.id===$('paymentInvoiceId').value);if(!inv)return;
  const amount=Number($('paymentAmount').value);
  const paymentId=$('paymentId').value;
  const otherPaid=(inv.payments||[]).filter(p=>p.id!==paymentId).reduce((s,p)=>s+Number(p.amount||0),0);
  if(amount<=0||otherPaid+amount>total(inv)+0.0005){alert(t('invalidPayment'));return}
  inv.payments=inv.payments||[];
  if(paymentId){
    const p=inv.payments.find(x=>x.id===paymentId);if(!p)return;
    p.date=$('paymentDate').value;p.amount=amount;p.method=$('paymentMethod').value;p.note=$('paymentNote').value.trim();
  }else{
    inv.payments.push({id:crypto.randomUUID(),date:$('paymentDate').value,amount,method:$('paymentMethod').value,note:$('paymentNote').value.trim()});
  }
  save();$('paymentDialog').close();
  if(previewInvoiceId===inv.id) openPreview(inv.id);
}

function invoiceHtml(inv, printable=false){
  const subtotal=Number(inv.amount||0), [st,cl]=status(inv);
  const pays=(inv.payments||[]);
  const actionsHeader = printable ? '' : `<th style="width:16%">${t('actions')}</th>`;
  const payRows=pays.length?pays.map(p=>`<tr>
      <td>${p.date}</td><td>${esc(p.method)}</td><td dir="auto">${esc(p.note||'—')}</td><td>${money(p.amount)}</td>
      ${printable?'':`<td class="payment-actions"><button class="mini-action" onclick="editPayment('${inv.id}','${p.id}')">${t('edit')}</button><button class="mini-action danger-link" onclick="deletePayment('${inv.id}','${p.id}')">${t('delete')}</button></td>`}
    </tr>`).join(''):
    `<tr><td colspan="${printable?4:5}" style="text-align:center;color:#98a2b3">${t('noPayments')}</td></tr>`;

  return `<div class="invoice-page" dir="${currentLang==='ar'?'rtl':'ltr'}">
    <div class="inv-brandbar"></div>
    <div class="inv-head">
      <div class="inv-logo-wrap">
        <img src="./ao-logo.jpg" alt="AO">
      </div>
      <div class="inv-title">
        <div class="inv-label">${t('invoiceTitle')}</div>
        <div class="inv-number">${inv.no}</div>
        <div class="inv-date">${inv.date}</div>
      </div>
    </div>

    <div class="customer-strip">
      <div>
        <small>${t('customerPrint')}</small>
        <strong dir="auto">${esc(inv.customer)}</strong>
      </div>
      <div>
        <small>${t('statusPrint')}</small>
        <span class="inv-status ${cl}">${st}</span>
      </div>
    </div>

    <section class="desc-card">
      <div class="desc-title">${t('descriptionPrint')}</div>
      <div class="desc-text" dir="auto">${esc(inv.description)}</div>
    </section>

    <div class="inv-main-grid">
      <div class="payments-box">
        <div class="section-title">${t('paymentsPrint')}</div>
        <table class="mini-table">
          <thead><tr><th>${t('date')}</th><th>${t('methodPrint')}</th><th>${t('notePrint')}</th><th>${t('amountPrint')}</th>${actionsHeader}</tr></thead>
          <tbody>${payRows}</tbody>
        </table>
      </div>

      <div class="summary-box modern">
        <div class="summary-caption">${currentLang==='ar'?'ملخص الفاتورة':'Invoice Summary'}</div>
        <div class="summary-row"><span>${t('subtotalPrint')}</span><span>${money(subtotal)}</span></div>
        <div class="summary-row total"><span>${t('totalPrint')}</span><span>${money(total(inv))}</span></div>
        <div class="summary-row"><span>${t('paidPrint')}</span><span>${money(paid(inv))}</span></div>
        <div class="summary-row balance"><span>${t('remainingPrint')}</span><span>${money(balance(inv))}</span></div>
      </div>
    </div>

    <div class="thankyou">${currentLang==='ar'?'شكرًا لتعاملكم معنا':'Thank you for your business'}</div>
    <div class="inv-footer">
      <strong>AO • AHMED ALORAIBI • EXPERT ACCOUNTANT</strong>
    </div>
  </div>`;
}
window.openPreview=id=>{
  const inv=data.invoices.find(x=>x.id===id);if(!inv)return;
  previewInvoiceId=id;$('invoicePreview').outerHTML = `<div id="invoicePreview">${invoiceHtml(inv,false)}</div>`;
  $('previewDialog').showModal();
}
$('printFromPreview').onclick=()=>{
  const inv=data.invoices.find(x=>x.id===previewInvoiceId);if(!inv)return;
  $('printArea').innerHTML=invoiceHtml(inv,true);
  setTimeout(()=>window.print(),80);
}
$('search').addEventListener('input',render);
applyLanguage();
