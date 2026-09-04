
const KEY = 'ao_accounts_v1';
let data = JSON.parse(localStorage.getItem(KEY) || '{"invoices":[]}');

const $ = id => document.getElementById(id);
const money = n => `${Number(n||0).toFixed(3)} د.ب`;
const today = () => new Date().toISOString().slice(0,10);

function save(){ localStorage.setItem(KEY, JSON.stringify(data)); render(); }
function nextNo(){
  const y = new Date().getFullYear();
  const n = data.invoices.filter(x=>x.no?.includes(y)).length + 1;
  return `AO-INV-${y}-${String(n).padStart(4,'0')}`;
}
function total(inv){ return Number(inv.amount||0) * (1 + Number(inv.vatRate||0)/100); }
function paid(inv){ return (inv.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0); }
function balance(inv){ return Math.max(0,total(inv)-paid(inv)); }
function status(inv){
  const p=paid(inv), t=total(inv);
  if(p<=0) return ['غير مدفوعة','unpaid'];
  if(p+0.0005<t) return ['مدفوعة جزئيًا','partial'];
  return ['مدفوعة بالكامل','paid'];
}
function render(){
  const q = $('search').value.trim().toLowerCase();
  const rows = [...data.invoices].reverse().filter(i => !q || i.no.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q));
  $('invoiceRows').innerHTML = rows.map(i=>{
    const [st,cl]=status(i);
    return `<tr>
      <td>${i.no}</td><td>${i.date}</td><td>${escapeHtml(i.customer)}</td>
      <td>${money(total(i))}</td><td>${money(paid(i))}</td><td>${money(balance(i))}</td>
      <td><span class="badge ${cl}">${st}</span></td>
      <td>
        <button class="action pay" onclick="openPayment('${i.id}')">سداد</button>
        <button class="action print" onclick="printInvoice('${i.id}')">طباعة/PDF</button>
      </td>
    </tr>`
  }).join('') || `<tr><td colspan="8" style="text-align:center;color:#98a2b3;padding:35px">لا توجد فواتير حتى الآن</td></tr>`;
  const invTotal = data.invoices.reduce((s,i)=>s+total(i),0);
  const paidTotal = data.invoices.reduce((s,i)=>s+paid(i),0);
  $('statInvoices').textContent=money(invTotal);
  $('statPaid').textContent=money(paidTotal);
  $('statBalance').textContent=money(invTotal-paidTotal);
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

$('newInvoiceBtn').onclick=()=>{
  $('invoiceForm').reset(); $('invoiceId').value=''; $('invoiceNo').value=nextNo(); $('invoiceDate').value=today(); $('vatRate').value=0; calcPreview(); $('invoiceDialog').showModal();
};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
['amount','vatRate'].forEach(id=>$(id).addEventListener('input',calcPreview));
function calcPreview(){
  const a=Number($('amount').value||0), v=Number($('vatRate').value||0);
  $('invoiceTotalPreview').textContent=money(a*(1+v/100));
}
$('invoiceForm').onsubmit=(e)=>{
  e.preventDefault();
  const inv={id:crypto.randomUUID(),no:$('invoiceNo').value,date:$('invoiceDate').value,customer:$('customerName').value.trim(),description:$('description').value.trim(),amount:Number($('amount').value),vatRate:Number($('vatRate').value||0),payments:[]};
  data.invoices.push(inv); save(); $('invoiceDialog').close();
};
window.openPayment=(id)=>{
  const inv=data.invoices.find(x=>x.id===id); if(!inv) return;
  $('paymentInvoiceId').value=id; $('paymentDate').value=today(); $('paymentAmount').value=balance(inv).toFixed(3); $('paymentDialog').showModal();
};
$('paymentForm').onsubmit=(e)=>{
  e.preventDefault();
  const inv=data.invoices.find(x=>x.id===$('paymentInvoiceId').value); if(!inv) return;
  const amount=Number($('paymentAmount').value);
  if(amount<=0 || amount>balance(inv)+0.0005){ alert('قيمة السداد غير صحيحة أو أكبر من الرصيد المتبقي.'); return; }
  inv.payments.push({id:crypto.randomUUID(),date:$('paymentDate').value,amount,method:$('paymentMethod').value});
  save(); $('paymentDialog').close();
};
window.printInvoice=(id)=>{
  const inv=data.invoices.find(x=>x.id===id); if(!inv) return;
  const subtotal=Number(inv.amount), vat=total(inv)-subtotal;
  const payments=(inv.payments||[]).map(p=>`<tr><td>${p.date}</td><td>${escapeHtml(p.method)}</td><td>${money(p.amount)}</td></tr>`).join('');
  $('printArea').innerHTML=`<div class="print-sheet">
    <div class="print-header">
      <img src="assets/ao-logo.jpg" alt="AO">
      <div class="print-title"><h1>INVOICE / فاتورة</h1><div>${inv.no}</div><div>${inv.date}</div></div>
    </div>
    <div class="print-meta"><div class="print-box"><b>اسم العميل</b><br>${escapeHtml(inv.customer)}</div><div class="print-box"><b>حالة الفاتورة</b><br>${status(inv)[0]}</div></div>
    <table class="print-table"><thead><tr><th>البيان</th><th>المبلغ</th></tr></thead><tbody><tr><td>${escapeHtml(inv.description)}</td><td>${money(subtotal)}</td></tr></tbody></table>
    <div class="print-summary">
      <div><span>المبلغ</span><span>${money(subtotal)}</span></div>
      <div><span>الضريبة (${Number(inv.vatRate||0).toFixed(2)}%)</span><span>${money(vat)}</span></div>
      <div class="grand"><span>الإجمالي</span><span>${money(total(inv))}</span></div>
      <div><span>المسدد</span><span>${money(paid(inv))}</span></div>
      <div class="grand"><span>المتبقي</span><span>${money(balance(inv))}</span></div>
    </div>
    ${payments?`<h3>الدفعات المسجلة</h3><table class="print-table"><thead><tr><th>التاريخ</th><th>الطريقة</th><th>المبلغ</th></tr></thead><tbody>${payments}</tbody></table>`:''}
    <div class="print-footer">AO • AHMED ALORAIBI • EXPERT ACCOUNTANT</div>
  </div>`;
  setTimeout(()=>window.print(),100);
};
$('search').addEventListener('input',render);
render();
