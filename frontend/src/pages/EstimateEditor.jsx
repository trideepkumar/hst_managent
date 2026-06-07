import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Printer, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDocumentById, saveDocument } from '../services/documentService';
import { generateDocNumber } from '../utils/formatCurrency';
import html2pdf from 'html2pdf.js';
import logo from '../../public/assests/logo.png';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const emptyRow = () => ({
  id: Date.now() + Math.random(),
  description: '',
  hsnSac: '',
  showInch: false,
  inch12: false,
  inch6: false,
  rate: '',
  qty: '',
  unit: 'Nos',
  grossAmount: '',
  discount: '',
  taxableAmount: '',
  cgstPct: '',
  cgstAmt: '',
  sgstPct: '',
  sgstAmt: '',
  total: '',
});

const toNum = (v) => parseFloat(v) || 0;

function calcRow(row) {
  const rate = toNum(row.rate);
  const qty = toNum(row.qty);
  const grossAmount = rate * qty;
  const discount = toNum(row.discount);
  const taxableAmount = grossAmount - discount;
  const cgstPct = toNum(row.cgstPct);
  const sgstPct = toNum(row.sgstPct);
  const cgstAmt = parseFloat(((taxableAmount * cgstPct) / 100).toFixed(2));
  const sgstAmt = parseFloat(((taxableAmount * sgstPct) / 100).toFixed(2));
  const total = parseFloat((taxableAmount + cgstAmt + sgstAmt).toFixed(2));
  return {
    ...row,
    grossAmount: grossAmount || '',
    taxableAmount: taxableAmount || '',
    cgstAmt: cgstAmt || '',
    sgstAmt: sgstAmt || '',
    total: total || '',
  };
}

function amountInWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (!amount || isNaN(amount)) return 'Zero Rupees Only';

  const num = Math.floor(toNum(amount));
  const paise = Math.round((toNum(amount) - num) * 100);

  function toWords(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + toWords(n % 100);
    if (n < 100000) return toWords(Math.floor(n / 1000)) + 'Thousand ' + toWords(n % 1000);
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + 'Lakh ' + toWords(n % 100000);
    return toWords(Math.floor(n / 10000000)) + 'Crore ' + toWords(n % 10000000);
  }

  let result = toWords(num).trim();
  result = result ? result + ' Rupees' : 'Zero Rupees';
  if (paise > 0) result += ' and ' + toWords(paise).trim() + ' Paise';
  return result + ' Only';
}

const defaultDoc = (type) => ({
  id: generateDocNumber(type === 'estimate' ? 'EST' : 'INV'),
  type,
  gstMode: 'with',
  date: new Date().toISOString().split('T')[0],
  // Seller
  companyName: 'HST INFRASTRUCTURES',
  companyAddress: 'Panmana P O , Kollam\nKerala , 691583',
  companyContact: '+91 9048362043 / +91 8156893302',
  companyGST: '32BVHPH8489P1ZQ',
  companyStateCode: '32',
  companyEmail: '',
  // Buyer
  clientName: '',
  clientAddress: '',
  clientContact: '',
  clientGST: '',
  clientStateCode: '32',
  // Doc
  placeOfSupply: 'Kerala (32)',
  reverseCharge: 'No',
  items: Array.from({ length: 5 }, emptyRow),
  subtotal: '',
  totalDiscount: '',
  totalTaxable: '',
  totalCgst: '',
  totalSgst: '',
  netAmount: '',
  amountInWords: '',
  // Bank
  bankName: 'State Bank of India',
  bankBranch: 'Panmana Branch',
  accountNo: '',
  ifscCode: '',
  accountType: 'Current',
  terms: 'The party shall provide water, Electricity and other necessary materials required for tubewell, borewell, or compressor cleaning works or any other kind of works.\n\nGoods once sold will not be taken back.\nInterest @ 18% p.a. will be charged if payment is not made within due date.',
  logo: null,
});

async function buildPdfBlob(el, filename) {
  const noPrintEls = el.querySelectorAll('.no-print');
  noPrintEls.forEach((n) => (n.style.display = 'none'));
  const origBoxShadow = el.style.boxShadow;
  const origBorderRadius = el.style.borderRadius;
  el.style.boxShadow = 'none';
  el.style.borderRadius = '0';
  try {
    const blob = await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false, width: el.scrollWidth, windowWidth: el.scrollWidth },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(el)
      .outputPdf('blob');
    return blob;
  } finally {
    noPrintEls.forEach((n) => (n.style.display = ''));
    el.style.boxShadow = origBoxShadow;
    el.style.borderRadius = origBorderRadius;
  }
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const S = {
  // Table header cell
  th: {
    border: '1px solid #374151',
    padding: '5px 4px',
    fontSize: '9px',
    fontWeight: '700',
    color: '#1f2937',
    background: '#e5e7eb',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    lineHeight: '1.3',
    whiteSpace: 'normal',
  },
  // Table data cell
  td: {
    border: '1px solid #9ca3af',
    padding: '0',
    verticalAlign: 'middle',
  },
  // Cell input
  ci: {
    width: '100%',
    border: 'none',
    fontSize: '10px',
    padding: '4px 4px',
    color: '#111827',
    outline: 'none',
    background: 'transparent',
    textAlign: 'right',
    fontFamily: 'inherit',
  },
  // Section label
  sectionLabel: {
    fontSize: '8px',
    fontWeight: '800',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#374151',
    borderBottom: '1px solid #374151',
    paddingBottom: '2px',
    marginBottom: '4px',
  },
  fieldLabel: { fontSize: '8px', color: '#6b7280', marginBottom: '1px', display: 'block' },
  fieldValue: {
    width: '100%',
    border: 'none',
    borderBottom: '1px dashed #d1d5db',
    background: 'transparent',
    fontSize: '10px',
    color: '#111827',
    outline: 'none',
    padding: '1px 2px',
    fontFamily: 'inherit',
  },
};

// ─── Invoice Header ────────────────────────────────────────────────────────────

function InvoiceHeader({ doc, setDoc }) {
  const logoRef = useRef();
  const set = (k) => (e) => setDoc((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div>
      {/* Title bar */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '4px', marginBottom: '6px' }}>
        <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', color: '#111827' }}>
          Tax Invoice
        </div>
        <div style={{ fontSize: '8px', color: '#6b7280', letterSpacing: '1px' }}>(Original for Recipient)</div>
      </div>

      {/* Seller + Meta two columns */}
      <div style={{ display: 'flex', gap: '0', border: '1px solid #374151', marginBottom: '6px' }}>
        {/* Left: Seller */}
        <div style={{ flex: 1, padding: '8px 10px', borderRight: '1px solid #374151', position: 'relative' }}>
          <div style={S.sectionLabel}>Supplier Details</div>

          {/* Logo + Name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div
              style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden', border: '1px solid #d1d5db', cursor: 'pointer', background: '#f9fafb', position: 'relative' }}
              onClick={() => logoRef.current.click()}
            >
              <img src={doc.logo || logo} alt="Logo" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div className="no-print" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity .2s', borderRadius: '50%', fontSize: '9px', color: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>Edit</div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden no-print" onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setDoc(d => ({ ...d, logo: ev.target.result })); r.readAsDataURL(f); }} />
            <div style={{ flex: 1 }}>
              <input style={{ ...S.fieldValue, fontSize: '13px', fontWeight: '800', color: '#111827', borderBottom: 'none' }} value={doc.companyName} onChange={set('companyName')} placeholder="Company Name" />
            </div>
          </div>

          <label style={S.fieldLabel}>Address</label>
          <textarea style={{ ...S.fieldValue, resize: 'none', lineHeight: '1.5', display: 'block' }} rows={2} value={doc.companyAddress} onChange={set('companyAddress')} placeholder="Address" />

          <div style={{ display: 'flex', gap: '12px', marginTop: '3px' }}>
            <div style={{ flex: 1 }}>
              <label style={S.fieldLabel}>Phone</label>
              <input style={S.fieldValue} value={doc.companyContact} onChange={set('companyContact')} placeholder="+91 XXXXX" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.fieldLabel}>Email</label>
              <input style={S.fieldValue} value={doc.companyEmail} onChange={set('companyEmail')} placeholder="email@example.com" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '3px' }}>
            <div style={{ flex: 2 }}>
              <label style={S.fieldLabel}>GSTIN</label>
              <input style={{ ...S.fieldValue, fontFamily: 'monospace', fontWeight: '700' }} value={doc.companyGST} onChange={set('companyGST')} placeholder="27XXXXX1234X1ZX" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.fieldLabel}>State Code</label>
              <input style={S.fieldValue} value={doc.companyStateCode} onChange={set('companyStateCode')} placeholder="27" />
            </div>
          </div>
        </div>

        {/* Right: Invoice Meta */}
        <div style={{ width: '200px', flexShrink: 0, padding: '8px 10px' }}>
          <div style={S.sectionLabel}>Invoice Details</div>

          <label style={S.fieldLabel}>Invoice No.</label>
          <input style={{ ...S.fieldValue, fontFamily: 'monospace', fontWeight: '700', fontSize: '11px' }} value={doc.id} onChange={set('id')} />

          <label style={{ ...S.fieldLabel, marginTop: '4px' }}>Invoice Date</label>
          <input type="date" style={{ ...S.fieldValue, fontSize: '10px' }} value={doc.date} onChange={set('date')} />

          <label style={{ ...S.fieldLabel, marginTop: '4px' }}>Place of Supply</label>
          <input style={S.fieldValue} value={doc.placeOfSupply} onChange={set('placeOfSupply')} placeholder="State (Code)" />

          <label style={{ ...S.fieldLabel, marginTop: '4px' }}>Reverse Charge</label>
          <select style={{ ...S.fieldValue, cursor: 'pointer' }} value={doc.reverseCharge} onChange={set('reverseCharge')}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>
      </div>

      {/* Buyer */}
      <div style={{ border: '1px solid #374151', marginBottom: '6px', padding: '8px 10px' }}>
        <div style={S.sectionLabel}>Buyer (Bill To)</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 2 }}>
            <label style={S.fieldLabel}>Name</label>
            <input style={{ ...S.fieldValue, fontSize: '12px', fontWeight: '700' }} value={doc.clientName} onChange={set('clientName')} placeholder="Buyer / Company Name" />
            <label style={{ ...S.fieldLabel, marginTop: '3px' }}>Address</label>
            <textarea style={{ ...S.fieldValue, resize: 'none', lineHeight: '1.5', display: 'block' }} rows={2} value={doc.clientAddress} onChange={set('clientAddress')} placeholder="Address, City, State" />
            <label style={{ ...S.fieldLabel, marginTop: '3px' }}>Contact</label>
            <input style={S.fieldValue} value={doc.clientContact} onChange={set('clientContact')} placeholder="+91 XXXXX" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.fieldLabel}>GSTIN</label>
            <input style={{ ...S.fieldValue, fontFamily: 'monospace', fontWeight: '700' }} value={doc.clientGST} onChange={set('clientGST')} placeholder="GSTIN (if registered)" />
            <label style={{ ...S.fieldLabel, marginTop: '3px' }}>State Code</label>
            <input style={S.fieldValue} value={doc.clientStateCode} onChange={set('clientStateCode')} placeholder="32" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Item Table ────────────────────────────────────────────────────────────────

function ItemTable({ doc, setDoc }) {
  const updateItem = useCallback((id, key, val) => {
    setDoc((d) => {
      const items = d.items.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [key]: val };
        return calcRow(updated);
      });
      // Recalculate totals
      const subtotal = items.reduce((s, r) => s + toNum(r.grossAmount), 0);
      const totalDiscount = items.reduce((s, r) => s + toNum(r.discount), 0);
      const totalTaxable = items.reduce((s, r) => s + toNum(r.taxableAmount), 0);
      const totalCgst = items.reduce((s, r) => s + toNum(r.cgstAmt), 0);
      const totalSgst = items.reduce((s, r) => s + toNum(r.sgstAmt), 0);
      const netAmount = items.reduce((s, r) => s + toNum(r.total), 0);
      return {
        ...d,
        items,
        subtotal: subtotal.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        totalTaxable: totalTaxable.toFixed(2),
        totalCgst: totalCgst.toFixed(2),
        totalSgst: totalSgst.toFixed(2),
        netAmount: netAmount.toFixed(2),
        amountInWords: amountInWords(netAmount),
      };
    });
  }, [setDoc]);

  const addRow = () => setDoc((d) => ({ ...d, items: [...d.items, emptyRow()] }));
  const delRow = (id) => setDoc((d) => {
    const items = d.items.filter((r) => r.id !== id);
    const subtotal = items.reduce((s, r) => s + toNum(r.grossAmount), 0);
    const totalDiscount = items.reduce((s, r) => s + toNum(r.discount), 0);
    const totalTaxable = items.reduce((s, r) => s + toNum(r.taxableAmount), 0);
    const totalCgst = items.reduce((s, r) => s + toNum(r.cgstAmt), 0);
    const totalSgst = items.reduce((s, r) => s + toNum(r.sgstAmt), 0);
    const netAmount = items.reduce((s, r) => s + toNum(r.total), 0);
    return { ...d, items, subtotal: subtotal.toFixed(2), totalDiscount: totalDiscount.toFixed(2), totalTaxable: totalTaxable.toFixed(2), totalCgst: totalCgst.toFixed(2), totalSgst: totalSgst.toFixed(2), netAmount: netAmount.toFixed(2), amountInWords: amountInWords(netAmount) };
  });

  const fmt = (v) => (v === '' || v === 0 || v === '0.00') ? '' : typeof v === 'number' ? v.toFixed(2) : v;

  const thC = (extra = {}) => ({ ...S.th, ...extra });
  const tdC = (extra = {}) => ({ ...S.td, ...extra });

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '28px' }} />
            <col style={{ width: '175px' }} />
            <col style={{ width: '44px' }} />
            <col style={{ width: '34px' }} />
            <col style={{ width: '34px' }} />
            <col style={{ width: '52px' }} />
            <col style={{ width: '44px' }} />
            <col style={{ width: '48px' }} />
            <col style={{ width: '30px' }} />
            <col style={{ width: '50px' }} />
            <col style={{ width: '30px' }} />
            <col style={{ width: '50px' }} />
            <col style={{ width: '58px' }} />
            <col className="no-print" style={{ width: '20px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={thC()} rowSpan={2}>#</th>
              <th style={thC({ textAlign: 'left' })} rowSpan={2}>Description of Goods / Services</th>
              <th style={thC()} rowSpan={2}>HSN / SAC</th>
              <th style={thC()} rowSpan={2}>Qty</th>
              <th style={thC()} rowSpan={2}>Unit</th>
              <th style={thC()} rowSpan={2}>Rate (₹)</th>
              <th style={thC()} rowSpan={2}>Gross Amt (₹)</th>
              <th style={thC()} rowSpan={2}>Taxable Amt (₹)</th>
              <th style={thC({ background: '#dbeafe' })} colSpan={2}>CGST</th>
              <th style={thC({ background: '#dcfce7' })} colSpan={2}>SGST</th>
              <th style={thC()} rowSpan={2}>Total (₹)</th>
              <th className="no-print" style={thC()} rowSpan={2}></th>
            </tr>
            <tr>
              <th style={thC({ background: '#dbeafe' })}>%</th>
              <th style={thC({ background: '#dbeafe' })}>Amt (₹)</th>
              <th style={thC({ background: '#dcfce7' })}>%</th>
              <th style={thC({ background: '#dcfce7' })}>Amt (₹)</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((row, idx) => (
              <tr key={row.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ ...tdC(), textAlign: 'center', fontSize: '9px', color: '#6b7280', padding: '2px' }}>{idx + 1}</td>

                {/* Description + optional inch */}
                <td style={tdC()}>
                  <input style={{ ...S.ci, textAlign: 'left', padding: '4px' }} value={row.description} onChange={e => updateItem(row.id, 'description', e.target.value)} placeholder="Description" />
                  {row.showInch && (
                    <div style={{ display: 'flex', gap: '6px', padding: '2px 4px 3px', borderTop: '1px dashed #e5e7eb' }}>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '9px', gap: '2px', color: '#374151', cursor: 'pointer' }}>
                        <input type="checkbox" checked={row.inch12} onChange={e => updateItem(row.id, 'inch12', e.target.checked)} style={{ width: '10px', height: '10px' }} /> 12″
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '9px', gap: '2px', color: '#374151', cursor: 'pointer' }}>
                        <input type="checkbox" checked={row.inch6} onChange={e => updateItem(row.id, 'inch6', e.target.checked)} style={{ width: '10px', height: '10px' }} /> 6″
                      </label>
                      <button className="no-print" style={{ color: '#f87171', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => updateItem(row.id, 'showInch', false)}>✕</button>
                    </div>
                  )}
                  {!row.showInch && (
                    <button className="no-print" style={{ display: 'block', fontSize: '9px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px' }} onClick={() => updateItem(row.id, 'showInch', true)}>+ inch</button>
                  )}
                </td>

                <td style={tdC()}><input style={{ ...S.ci, textAlign: 'center' }} value={row.hsnSac} onChange={e => updateItem(row.id, 'hsnSac', e.target.value)} placeholder="HSN" /></td>
                <td style={tdC()}><input style={{ ...S.ci, textAlign: 'center' }} value={row.qty} onChange={e => updateItem(row.id, 'qty', e.target.value)} /></td>
                <td style={tdC()}>
                  <select style={{ ...S.ci, textAlign: 'center', cursor: 'pointer', fontSize: '9px' }} value={row.unit} onChange={e => updateItem(row.id, 'unit', e.target.value)}>
                    {['Nos', 'Mtr', 'Kg', 'Ltr', 'Pcs', 'Set', 'Job', 'Rft', 'Sqft', 'Hr'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </td>
                <td style={tdC()}><input style={S.ci} value={row.rate} onChange={e => updateItem(row.id, 'rate', e.target.value)} /></td>
                <td style={tdC()}><input style={{ ...S.ci, color: '#374151' }} value={fmt(row.grossAmount)} readOnly placeholder="Auto" /></td>
                <td style={tdC()}><input style={{ ...S.ci, color: '#374151' }} value={fmt(row.taxableAmount)} readOnly placeholder="Auto" /></td>

                {/* CGST */}
                <td style={{ ...tdC(), background: '#eff6ff' }}><input style={{ ...S.ci, textAlign: 'center' }} value={row.cgstPct} onChange={e => updateItem(row.id, 'cgstPct', e.target.value)} placeholder="9" /></td>
                <td style={{ ...tdC(), background: '#eff6ff' }}><input style={{ ...S.ci, color: '#1d4ed8' }} value={fmt(row.cgstAmt)} readOnly /></td>

                {/* SGST */}
                <td style={{ ...tdC(), background: '#f0fdf4' }}><input style={{ ...S.ci, textAlign: 'center' }} value={row.sgstPct} onChange={e => updateItem(row.id, 'sgstPct', e.target.value)} placeholder="9" /></td>
                <td style={{ ...tdC(), background: '#f0fdf4' }}><input style={{ ...S.ci, color: '#15803d' }} value={fmt(row.sgstAmt)} readOnly /></td>

                <td style={tdC()}><input style={{ ...S.ci, fontWeight: '700', color: '#111827' }} value={fmt(row.total)} readOnly /></td>

                <td className="no-print" style={tdC()}>
                  <button onClick={() => delRow(row.id)} style={{ padding: '3px', color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>
                    <Trash2 size={10} />
                  </button>
                </td>
              </tr>
            ))}

            {/* Totals row */}
            <tr style={{ background: '#f3f4f6', fontWeight: '700' }}>
              <td colSpan={6} style={{ ...S.td, padding: '5px 8px', textAlign: 'right', fontSize: '9px', fontWeight: '700', color: '#374151', letterSpacing: '1px', textTransform: 'uppercase', border: '1px solid #374151' }}>
                Totals
              </td>
              <td style={{ ...S.td, border: '1px solid #374151' }}>
                <div style={{ ...S.ci, padding: '5px 4px', fontWeight: '800' }}>{doc.subtotal || '0.00'}</div>
              </td>
              <td style={{ ...S.td, border: '1px solid #374151' }}>
                <div style={{ ...S.ci, padding: '5px 4px', fontWeight: '800' }}>{doc.totalTaxable || '0.00'}</div>
              </td>
              <td style={{ ...S.td, border: '1px solid #374151', background: '#dbeafe' }}></td>
              <td style={{ ...S.td, border: '1px solid #374151', background: '#dbeafe' }}>
                <div style={{ ...S.ci, padding: '5px 4px', fontWeight: '800', color: '#1d4ed8' }}>{doc.totalCgst || '0.00'}</div>
              </td>
              <td style={{ ...S.td, border: '1px solid #374151', background: '#dcfce7' }}></td>
              <td style={{ ...S.td, border: '1px solid #374151', background: '#dcfce7' }}>
                <div style={{ ...S.ci, padding: '5px 4px', fontWeight: '800', color: '#15803d' }}>{doc.totalSgst || '0.00'}</div>
              </td>
              <td style={{ ...S.td, border: '1px solid #374151' }}>
                <div style={{ ...S.ci, padding: '5px 4px', fontWeight: '800', color: '#111827' }}>{doc.netAmount || '0.00'}</div>
              </td>
              <td className="no-print" style={{ ...S.td, border: '1px solid #374151' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <button onClick={addRow} className="no-print"
        style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: '4px' }}
        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <Plus size={12} /> Add Row
      </button>
    </div>
  );
}

// ─── GST Summary + Totals ──────────────────────────────────────────────────────

function TaxSummary({ doc, setDoc }) {
  const set = (k) => (e) => setDoc((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>

      {/* GST breakup table */}
      <div style={{ flex: 1, border: '1px solid #374151' }}>
        <div style={{ background: '#e5e7eb', padding: '4px 8px', fontSize: '8px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', borderBottom: '1px solid #374151' }}>
          Tax Summary
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <thead>
            <tr>
              {['HSN/SAC', 'Taxable Amt', 'CGST %', 'CGST Amt', 'SGST %', 'SGST Amt', 'Total Tax'].map(h => (
                <th key={h} style={{ border: '1px solid #d1d5db', padding: '3px 4px', fontSize: '8px', fontWeight: '700', background: '#f3f4f6', textAlign: 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Aggregate unique HSN rows */}
            {(() => {
              const groups = {};
              doc.items.forEach(r => {
                if (!r.taxableAmount && !r.cgstAmt && !r.sgstAmt) return;
                const key = r.hsnSac || '—';
                if (!groups[key]) groups[key] = { hsnSac: key, taxable: 0, cgstPct: r.cgstPct, cgstAmt: 0, sgstPct: r.sgstPct, sgstAmt: 0 };
                groups[key].taxable += toNum(r.taxableAmount);
                groups[key].cgstAmt += toNum(r.cgstAmt);
                groups[key].sgstAmt += toNum(r.sgstAmt);
              });
              const rows = Object.values(groups);
              if (rows.length === 0) return (
                <tr><td colSpan={7} style={{ padding: '6px', textAlign: 'center', color: '#9ca3af', fontSize: '9px' }}>No tax data yet</td></tr>
              );
              return rows.map((g, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ border: '1px solid #e5e7eb', padding: '3px 4px', textAlign: 'center', fontWeight: '600' }}>{g.hsnSac}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '3px 4px', textAlign: 'right' }}>{g.taxable.toFixed(2)}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '3px 4px', textAlign: 'center' }}>{g.cgstPct}%</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '3px 4px', textAlign: 'right', color: '#1d4ed8', fontWeight: '600' }}>{g.cgstAmt.toFixed(2)}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '3px 4px', textAlign: 'center' }}>{g.sgstPct}%</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '3px 4px', textAlign: 'right', color: '#15803d', fontWeight: '600' }}>{g.sgstAmt.toFixed(2)}</td>
                  <td style={{ border: '1px solid #e5e7eb', padding: '3px 4px', textAlign: 'right', fontWeight: '700' }}>{(g.cgstAmt + g.sgstAmt).toFixed(2)}</td>
                </tr>
              ));
            })()}
            <tr style={{ background: '#e5e7eb', fontWeight: '800' }}>
              <td style={{ border: '1px solid #9ca3af', padding: '3px 6px', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</td>
              <td style={{ border: '1px solid #9ca3af', padding: '3px 4px', textAlign: 'right' }}>{doc.totalTaxable || '0.00'}</td>
              <td style={{ border: '1px solid #9ca3af' }}></td>
              <td style={{ border: '1px solid #9ca3af', padding: '3px 4px', textAlign: 'right', color: '#1d4ed8' }}>{doc.totalCgst || '0.00'}</td>
              <td style={{ border: '1px solid #9ca3af' }}></td>
              <td style={{ border: '1px solid #9ca3af', padding: '3px 4px', textAlign: 'right', color: '#15803d' }}>{doc.totalSgst || '0.00'}</td>
              <td style={{ border: '1px solid #9ca3af', padding: '3px 4px', textAlign: 'right' }}>
                {((toNum(doc.totalCgst) + toNum(doc.totalSgst)).toFixed(2))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount box */}
      <div style={{ minWidth: '190px', border: '1px solid #374151', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
        {[
          { label: 'Subtotal (Gross)', value: doc.subtotal, key: 'subtotal', color: '#374151' },
          { label: 'Total Discount', value: doc.totalDiscount, key: 'totalDiscount', color: '#374151' },
          { label: 'Taxable Amount', value: doc.totalTaxable, key: 'totalTaxable', color: '#374151' },
          { label: 'Total CGST', value: doc.totalCgst, key: 'totalCgst', color: '#1d4ed8' },
          { label: 'Total SGST', value: doc.totalSgst, key: 'totalSgst', color: '#15803d' },
        ].map(({ label, value, key, color }) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 10px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
            <span style={{ fontSize: '9px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color, fontFamily: 'monospace' }}>{value || '0.00'}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#111827' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '1px' }}>Grand Total</span>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>₹{doc.netAmount || '0.00'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Amount in Words + Bank + Terms ───────────────────────────────────────────

function InvoiceFooter({ doc, setDoc }) {
  const set = (k) => (e) => setDoc((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div>
      {/* Amount in words */}
      <div style={{ border: '1px solid #374151', padding: '5px 10px', marginBottom: '6px', background: '#f9fafb' }}>
        <span style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginRight: '6px' }}>Amount in Words:</span>
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#111827', fontStyle: 'italic' }}>
          {doc.amountInWords || (doc.netAmount ? amountInWords(doc.netAmount) : 'Zero Rupees Only')}
        </span>
      </div>

      {/* Bank + Terms + Signature */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>

        {/* Bank details */}
        <div style={{ flex: 1, border: '1px solid #374151', padding: '8px 10px' }}>
          <div style={S.sectionLabel}>Bank Details</div>
          {[
            { label: 'Bank Name', key: 'bankName' },
            { label: 'Branch', key: 'bankBranch' },
            { label: 'Account No.', key: 'accountNo' },
            { label: 'IFSC Code', key: 'ifscCode' },
            { label: 'Account Type', key: 'accountType' },
          ].map(({ label, key }) => (
            <div key={key} style={{ display: 'flex', gap: '6px', alignItems: 'baseline', marginBottom: '3px' }}>
              <span style={{ fontSize: '8px', color: '#6b7280', fontWeight: '600', minWidth: '72px', flexShrink: 0 }}>{label}:</span>
              <input style={{ ...S.fieldValue, fontSize: '10px', flex: 1 }} value={doc[key]} onChange={set(key)} placeholder={label} />
            </div>
          ))}
        </div>

        {/* Terms */}
        <div style={{ flex: 1.4, border: '1px solid #374151', padding: '8px 10px' }}>
          <div style={S.sectionLabel}>Terms &amp; Conditions</div>
          <textarea
            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '9px', color: '#374151', resize: 'none', outline: 'none', padding: 0, lineHeight: '1.6', fontFamily: 'inherit' }}
            rows={6}
            value={doc.terms}
            onChange={set('terms')}
            placeholder="Terms & conditions..."
          />
        </div>

        {/* Signature */}
        <div style={{ width: '140px', flexShrink: 0, border: '1px solid #374151', padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={S.sectionLabel}>For {doc.companyName || 'HST Infrastructures'}</div>
            {/* Seal area */}
            <div style={{ border: '1px dashed #9ca3af', borderRadius: '50%', width: '70px', height: '70px', margin: '8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '8px', color: '#9ca3af', textAlign: 'center', lineHeight: '1.4' }}>Stamp &amp;<br />Seal</span>
            </div>
          </div>
          <div>
            <div style={{ borderTop: '1px solid #374151', paddingTop: '4px', marginTop: '8px' }}>
              <div style={{ fontSize: '8px', color: '#374151', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #374151', paddingTop: '5px', marginBottom: '5px' }}>
        <div style={{ fontSize: '9px', color: '#374151', lineHeight: '1.6' }}>
          <div><strong>Hredaya Kumar</strong>: +91 9048362043 &nbsp;|&nbsp; <strong>Hridhiq Kumar</strong>: +91 8156893302</div>
        </div>
        <div style={{ fontSize: '8px', color: '#6b7280', textAlign: 'right' }}>
          Subject to Kollam jurisdiction
        </div>
      </div>

      {/* Footer bar */}
      <div style={{ background: '#111827', borderRadius: '2px', padding: '4px 12px', textAlign: 'center', fontSize: '8px', color: '#9ca3af', letterSpacing: '0.8px' }}>
        This is a computer generated invoice — {doc.companyName || 'HST Infrastructures'} | {doc.companyContact} | GSTIN: {doc.companyGST}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function EstimateEditor({ type = 'estimate' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);

  const isEstimate = type === 'estimate';
  const listPath = isEstimate ? '/estimates' : '/invoices';

  useEffect(() => {
    const loadDoc = async () => {
      if (id) {
        try {
          const found = await getDocumentById(id);
          if (found && found.id) return setDoc(found);
        } catch (err) {
          toast.error('Failed to load document');
        }
      }
      setDoc(defaultDoc(type));
    };
    loadDoc();
  }, [id, type]); // eslint-disable-line

  const saveDoc = useCallback(async (currentDoc) => {
    try { await saveDocument(currentDoc); return true; } catch { return false; }
  }, []); // eslint-disable-line

  const handleSave = async () => { 
    if (!doc) return; 
    setBusy(true);
    const success = await saveDoc(doc);
    success ? toast.success('Saved!') : toast.error('Failed to save'); 
    setBusy(false);
  };
  const handlePrint = async () => { if (!doc) return; await saveDoc(doc); window.print(); };

  const handleDownload = async () => {
    if (!doc || !printRef.current || busy) return;
    setBusy(true);
    const safety = setTimeout(() => setBusy(false), 45000);
    const tid = toast.loading('Generating PDF…');
    try {
      await saveDoc(doc);
      const blob = await buildPdfBlob(printRef.current, `${doc.id}.pdf`);
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `${doc.id}.pdf` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      toast.success('PDF downloaded!', { id: tid });
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF', { id: tid });
    } finally { clearTimeout(safety); setBusy(false); }
  };

  const handleWhatsApp = async () => {
    if (!doc || !printRef.current || busy) return;
    setBusy(true);
    const tid = toast.loading('Preparing PDF…');
    try {
      await saveDoc(doc);
      const blob = await buildPdfBlob(printRef.current, `${doc.id}.pdf`);
      const file = new File([blob], `HST_${doc.id}.pdf`, { type: 'application/pdf', lastModified: Date.now() });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${doc.type} ${doc.id}`, text: `Invoice from HST INFRASTRUCTURES\nDoc: ${doc.id}\nAmount: ₹${doc.netAmount}` });
        toast.success('Shared!', { id: tid });
      } else {
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: `${doc.id}.pdf` });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        toast.success('PDF saved — attach in WhatsApp.', { id: tid });
        setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(`Invoice ${doc.id} from HST INFRASTRUCTURES`)}`, '_blank'), 1500);
      }
    } catch (err) { toast.error('Sharing failed. Try downloading PDF.', { id: tid }); }
    finally { setBusy(false); }
  };

  if (!doc) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100% !important; margin: 0 !important; padding: 0 !important;
            box-shadow: none !important; border-radius: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action Bar */}
      <div className="no-print sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center gap-2 flex-wrap">
        <button onClick={() => navigate(listPath)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Tax Invoice Editor</p>
          <p className="text-slate-400 text-xs">{doc.id}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleSave} className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl transition-colors">
            <Save size={14} /> Save
          </button>
          <button onClick={handleWhatsApp} disabled={busy} className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-colors">
            <Share2 size={14} /> {busy ? '…' : 'WhatsApp'}
          </button>
          <button onClick={handleDownload} disabled={busy} className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-colors">
            <Download size={14} /> {busy ? '…' : 'PDF'}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl transition-colors">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* A4 Preview */}
      <div className="p-4 py-6 overflow-x-auto">
        <div className="mx-auto flex justify-center pb-8" style={{ minWidth: '210mm' }}>
          <div
            id="print-area"
            ref={printRef}
            style={{
              background: '#fff',
              width: '210mm',
              minHeight: '297mm',
              padding: '10mm 12mm',
              fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
              boxSizing: 'border-box',
              borderRadius: '4px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            }}
          >
            <InvoiceHeader doc={doc} setDoc={setDoc} />
            <ItemTable doc={doc} setDoc={setDoc} />
            <TaxSummary doc={doc} setDoc={setDoc} />
            <InvoiceFooter doc={doc} setDoc={setDoc} />
          </div>
        </div>
      </div>
    </div>
  );
}

// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { ArrowLeft, Plus, Trash2, Save, Printer, Download, Share2 } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { saveEstimate, getEstimates, saveInvoice, getInvoices } from '../utils/localStorage';
// import { generateDocNumber } from '../utils/formatCurrency';
// import html2pdf from 'html2pdf.js';
// import logo from '../../public/assests/logo.png';

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const emptyRow = () => ({
//   id: Date.now() + Math.random(),
//   description: '',
//   showInch: false,
//   inch12: false,
//   inch6: false,
//   rate: '',
//   qty: '',
//   gst: '',
//   total: '',
// });

// const defaultDoc = (type) => ({
//   id: generateDocNumber(type === 'estimate' ? 'EST' : 'INV'),
//   type,
//   gstMode: 'without',
//   date: new Date().toISOString().split('T')[0],
//   companyName: 'HST Infrastructures',
//   companyAddress: 'Panmana P O , Kollam\nKerala , 691583',
//   companyContact: '+91 9048362043 / +91 8156893302',
//   companyGST: '32BVHPH8489P1ZQ',
//   clientName: '',
//   clientAddress: '',
//   clientContact: '',
//   clientGST: '',
//   items: Array.from({ length: 11 }, emptyRow),
//   subtotal: '',
//   gstAmount: '',
//   netAmount: '',
//   terms: 'The party shall provide water, Electricity and other necessary materials required for tubewell, borewell, or compressor cleaning works or any other kind of works.',
//   logo: null,
// });

// async function buildPdfBlob(el, filename) {
//   const noPrintEls = el.querySelectorAll('.no-print');
//   noPrintEls.forEach((n) => (n.style.display = 'none'));

//   const origBoxShadow = el.style.boxShadow;
//   const origBorderRadius = el.style.borderRadius;
//   el.style.boxShadow = 'none';
//   el.style.borderRadius = '0';

//   try {
//     const blob = await html2pdf()
//       .set({
//         margin: 0,
//         filename,
//         image: { type: 'jpeg', quality: 1 },
//         html2canvas: {
//           scale: 2,
//           useCORS: true,
//           allowTaint: true,
//           logging: false,
//           width: el.scrollWidth,
//           windowWidth: el.scrollWidth,
//         },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//       })
//       .from(el)
//       .outputPdf('blob');
//     return blob;
//   } finally {
//     noPrintEls.forEach((n) => (n.style.display = ''));
//     el.style.boxShadow = origBoxShadow;
//     el.style.borderRadius = origBorderRadius;
//   }
// }

// // ─── Field helpers ─────────────────────────────────────────────────────────────

// const inp =
//   'w-full bg-transparent border-b border-slate-300 px-1 py-0.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-400';
// const lbl = 'text-[11px] text-slate-500 mb-0.5 block';

// // ─── Sub-components ───────────────────────────────────────────────────────────

// /**
//  * DocHeader — full-width company header band (renders in PDF too)
//  * Logo is an <img> directly in flow (not hidden), no-print class only on the
//  * file-input overlay. This means html2canvas captures it naturally.
//  */
// function DocHeader({ doc, setDoc }) {
//   const logoRef = useRef();
//   const set = (key) => (e) => setDoc((d) => ({ ...d, [key]: e.target.value }));

//   return (
//     <>
//       {/* ── Company header band ─────────────────────────────────────────────── */}
//       <div
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '16px',
//           borderBottom: '3px solid #1e3a5f',
//           paddingBottom: '12px',
//           marginBottom: '14px',
//         }}
//       >
//         {/* Logo — always in flow so html2canvas captures it */}
//         <div
//           style={{
//             width: '72px',
//             height: '72px',
//             flexShrink: 0,
//             borderRadius: '50%',
//             overflow: 'hidden',
//             border: '2px solid #cbd5e1',
//             cursor: 'pointer',
//             background: '#f8fafc',
//             position: 'relative',
//           }}
//           onClick={() => logoRef.current.click()}
//           title="Click to change logo"
//         >
//           <img
//             src={doc.logo || logo}
//             alt="HST Logo"
//             crossOrigin="anonymous"
//             style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
//           />
//           {/* Overlay hint — no-print so it won't appear in PDF */}
//           <div
//             className="no-print"
//             style={{
//               position: 'absolute',
//               inset: 0,
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               background: 'rgba(0,0,0,0.25)',
//               opacity: 0,
//               transition: 'opacity 0.2s',
//               borderRadius: '50%',
//               fontSize: '10px',
//               color: '#fff',
//             }}
//             onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
//             onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
//           >
//             Edit
//           </div>
//         </div>
//         <input
//           ref={logoRef}
//           type="file"
//           accept="image/*"
//           className="hidden no-print"
//           onChange={(e) => {
//             const file = e.target.files[0];
//             if (!file) return;
//             const reader = new FileReader();
//             reader.onload = (ev) => setDoc((d) => ({ ...d, logo: ev.target.result }));
//             reader.readAsDataURL(file);
//           }}
//         />

//         {/* Company info */}
//         <div style={{ flex: 1 }}>
//           <div
//             style={{
//               fontSize: '22px',
//               fontWeight: '900',
//               color: '#1e3a5f',
//               letterSpacing: '3px',
//               textTransform: 'uppercase',
//               lineHeight: 1.1,
//             }}
//           >
//             {doc.companyName || 'HST Infrastructures'}
//           </div>
//           <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', whiteSpace: 'pre-line' }}>
//             {doc.companyAddress}
//           </div>
//           <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.companyContact}</div>
//           {doc.gstMode === 'with' && (
//             <div style={{ fontSize: '11px', color: '#64748b' }}>
//               <strong>GSTIN:</strong> {doc.companyGST}
//             </div>
//           )}
//         </div>

//         {/* Doc meta */}
//         <div style={{ textAlign: 'right', minWidth: '180px' }}>
//           <div
//             style={{
//               display: 'inline-block',
//               background: '#1e3a5f',
//               color: '#fff',
//               fontSize: '15px',
//               fontWeight: '800',
//               letterSpacing: '4px',
//               textTransform: 'uppercase',
//               padding: '4px 14px',
//               borderRadius: '4px',
//               marginBottom: '8px',
//             }}
//           >
//             {doc.type}
//           </div>
//           <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px' }}>
//             <span style={{ fontWeight: '600' }}>No: </span>
//             <span style={{ fontFamily: 'monospace' }}>{doc.id}</span>
//           </div>
//           <div style={{ fontSize: '11px', color: '#475569' }}>
//             <span style={{ fontWeight: '600' }}>Date: </span>
//             <input
//               type="date"
//               className="no-print"
//               style={{
//                 border: 'none',
//                 borderBottom: '1px solid #cbd5e1',
//                 fontSize: '11px',
//                 color: '#475569',
//                 background: 'transparent',
//                 outline: 'none',
//                 textAlign: 'right',
//               }}
//               value={doc.date}
//               onChange={set('date')}
//             />
//             {/* PDF-only date text */}
//             <span className="pdf-date-text" style={{ display: 'none' }}>
//               {doc.date}
//             </span>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// function CompanyClient({ doc, setDoc }) {
//   const set = (key) => (e) => setDoc((d) => ({ ...d, [key]: e.target.value }));

//   return (
//     <div
//       style={{
//         display: 'flex',
//         gap: '0',
//         border: '1.5px solid #1e3a5f',
//         borderRadius: '4px',
//         marginBottom: '14px',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Bill To */}
//       <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid #cbd5e1' }}>
//         <div
//           style={{
//             fontSize: '9px',
//             fontWeight: '700',
//             letterSpacing: '2px',
//             textTransform: 'uppercase',
//             color: '#1e3a5f',
//             marginBottom: '6px',
//             borderBottom: '1px solid #e2e8f0',
//             paddingBottom: '4px',
//           }}
//         >
//           Bill To
//         </div>
//         <input
//           style={{
//             width: '100%',
//             border: 'none',
//             background: 'transparent',
//             fontSize: '13px',
//             fontWeight: '700',
//             color: '#1e293b',
//             outline: 'none',
//             padding: 0,
//             marginBottom: '3px',
//           }}
//           value={doc.clientName}
//           onChange={set('clientName')}
//           placeholder="Client Name"
//         />
//         <textarea
//           style={{
//             width: '100%',
//             border: 'none',
//             background: 'transparent',
//             fontSize: '11px',
//             color: '#475569',
//             resize: 'none',
//             outline: 'none',
//             padding: 0,
//             lineHeight: '1.5',
//           }}
//           rows={3}
//           value={doc.clientAddress}
//           onChange={set('clientAddress')}
//           placeholder="Address, Company..."
//         />
//         {doc.clientContact && (
//           <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.clientContact}</div>
//         )}
//         {doc.gstMode === 'with' && (
//           <input
//             style={{
//               width: '100%',
//               border: 'none',
//               borderTop: '1px solid #e2e8f0',
//               background: 'transparent',
//               fontSize: '11px',
//               color: '#475569',
//               outline: 'none',
//               padding: '4px 0 0',
//               marginTop: '4px',
//             }}
//             value={doc.clientGST}
//             onChange={set('clientGST')}
//             placeholder="Client GSTIN"
//           />
//         )}
//       </div>

//       {/* Editable GST fields if needed — right column for extra info */}
//       <div
//         style={{
//           width: '170px',
//           padding: '10px 14px',
//           background: '#f8fafc',
//           flexShrink: 0,
//         }}
//       >
//         <div
//           style={{
//             fontSize: '9px',
//             fontWeight: '700',
//             letterSpacing: '2px',
//             textTransform: 'uppercase',
//             color: '#1e3a5f',
//             marginBottom: '6px',
//             borderBottom: '1px solid #e2e8f0',
//             paddingBottom: '4px',
//           }}
//         >
//           From
//         </div>
//         <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '3px' }}>
//           {doc.companyName || 'HST INFRASTRUCTURES'}
//         </div>
//         <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
//           {doc.companyAddress}
//         </div>
//         <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
//           {doc.companyContact}
//         </div>
//       </div>
//     </div>
//   );
// }

// function ItemTable({ doc, setDoc }) {
//   const isGST = doc.gstMode === 'with';

//   const updateItem = (id, key, val) =>
//     setDoc((d) => ({
//       ...d,
//       items: d.items.map((r) => (r.id === id ? { ...r, [key]: val } : r)),
//     }));

//   const addRow = () => setDoc((d) => ({ ...d, items: [...d.items, emptyRow()] }));
//   const delRow = (id) => setDoc((d) => ({ ...d, items: d.items.filter((r) => r.id !== id) }));
//   const setField = (key) => (e) => setDoc((d) => ({ ...d, [key]: e.target.value }));

//   const thStyle = {
//     border: '1px solid #1e3a5f',
//     padding: '7px 8px',
//     fontSize: '10px',
//     fontWeight: '700',
//     color: '#fff',
//     background: '#1e3a5f',
//     textAlign: 'center',
//     letterSpacing: '0.5px',
//     textTransform: 'uppercase',
//   };
//   const tdStyle = {
//     border: '1px solid #cbd5e1',
//     padding: '0',
//   };
//   const cellInpStyle = {
//     width: '100%',
//     border: 'none',
//     fontSize: '11px',
//     padding: '6px 6px',
//     color: '#1e293b',
//     outline: 'none',
//     background: 'transparent',
//   };

//   return (
//     <div style={{ marginBottom: '12px' }}>
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
//         <thead>
//           <tr>
//             <th style={{ ...thStyle, width: '36px' }}>#</th>
//             <th style={thStyle}>Description of Work / Material</th>
//             <th style={{ ...thStyle, width: '60px' }}>Inch</th>
//             <th style={{ ...thStyle, width: '80px' }}>Rate (₹)</th>
//             <th style={{ ...thStyle, width: '70px' }}>Qty</th>
//             {isGST && <th style={{ ...thStyle, width: '56px' }}>GST%</th>}
//             <th style={{ ...thStyle, width: '96px' }}>Amount (₹)</th>
//             <th className="no-print" style={{ ...thStyle, width: '28px', background: '#2d4f7c', border: '1px solid #1e3a5f' }} />
//           </tr>
//         </thead>
//         <tbody>
//           {doc.items.map((row, idx) => (
//             <tr
//               key={row.id}
//               style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}
//             >
//               <td style={{ ...tdStyle, textAlign: 'center', fontSize: '10px', color: '#94a3b8', padding: '4px' }}>
//                 {idx + 1}
//               </td>
//               <td style={tdStyle}>
//                 <input
//                   style={cellInpStyle}
//                   value={row.description}
//                   onChange={(e) => updateItem(row.id, 'description', e.target.value)}
//                   placeholder="Item description"
//                 />
//               </td>
//               <td style={{ ...tdStyle, verticalAlign: 'middle' }}>
//                 {row.showInch ? (
//                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 2px', gap: '2px' }}>
//                     <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', gap: '3px', cursor: 'pointer' ,color:'black'}}>
//                       <input
//                         type="checkbox"
//                         checked={row.inch12}
//                         onChange={(e) => updateItem(row.id, 'inch12', e.target.checked)}
//                         style={{ width: '12px', height: '12px' }}
//                       />
//                       12″
//                     </label>
//                     <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', gap: '3px', cursor: 'pointer',color:'black' }}>
//                       <input
//                         type="checkbox"
//                         checked={row.inch6}
//                         onChange={(e) => updateItem(row.id, 'inch6', e.target.checked)}
//                         style={{ width: '12px', height: '12px' }}
//                       />
//                       6″
//                     </label>
//                     <button
//                       className="no-print"
//                       style={{ color: '#fca5a5', fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer', marginTop: '2px' }}
//                       onClick={() => updateItem(row.id, 'showInch', false)}
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ) : (
//                   <div className="no-print" style={{ display: 'flex', justifyContent: 'center', padding: '6px' }}>
//                     <button
//                       style={{ color: '#cbd5e1', fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
//                       onClick={() => updateItem(row.id, 'showInch', true)}
//                     >
//                       +
//                     </button>
//                   </div>
//                 )}
//               </td>
//               <td style={tdStyle}>
//                 <input
//                   style={{ ...cellInpStyle, textAlign: 'right' }}
//                   value={row.rate}
//                   onChange={(e) => updateItem(row.id, 'rate', e.target.value)}
//                 />
//               </td>
//               <td style={tdStyle}>
//                 <input
//                   style={{ ...cellInpStyle, textAlign: 'center' }}
//                   value={row.qty}
//                   onChange={(e) => updateItem(row.id, 'qty', e.target.value)}
//                 />
//               </td>
//               {isGST && (
//                 <td style={tdStyle}>
//                   <input
//                     style={{ ...cellInpStyle, textAlign: 'center' }}
//                     value={row.gst}
//                     onChange={(e) => updateItem(row.id, 'gst', e.target.value)}
//                   />
//                 </td>
//               )}
//               <td style={tdStyle}>
//                 <input
//                   style={{ ...cellInpStyle, textAlign: 'right', fontWeight: '600' }}
//                   value={row.total}
//                   onChange={(e) => updateItem(row.id, 'total', e.target.value)}
//                 />
//               </td>
//               <td className="no-print" style={tdStyle}>
//                 <button
//                   onClick={() => delRow(row.id)}
//                   style={{ padding: '4px', color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
//                   onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
//                   onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
//                 >
//                   <Trash2 size={11} />
//                 </button>
//               </td>
//             </tr>
//           ))}

//           {/* Subtotal row */}
//           <tr style={{ background: '#f1f5f9' }}>
//             <td
//               colSpan={isGST ? 6 : 5}
//               style={{
//                 border: '1px solid #94a3b8',
//                 padding: '7px 12px',
//                 textAlign: 'right',
//                 fontSize: '11px',
//                 fontWeight: '700',
//                 color: '#1e3a5f',
//                 letterSpacing: '1px',
//                 textTransform: 'uppercase',
//               }}
//             >
//               Sub Total
//             </td>
//             <td style={{ border: '1px solid #94a3b8', padding: 0 }}>
//               <input
//                 style={{ ...cellInpStyle, textAlign: 'right', fontWeight: '700', color: '#1e3a5f' }}
//                 value={doc.subtotal}
//                 onChange={setField('subtotal')}
//                 placeholder="0.00"
//               />
//             </td>
//             <td className="no-print" style={{ border: '1px solid #94a3b8' }} />
//           </tr>
//         </tbody>
//       </table>

//       <button
//         onClick={addRow}
//         className="no-print"
//         style={{
//           marginTop: '8px',
//           display: 'flex',
//           alignItems: 'center',
//           gap: '6px',
//           fontSize: '12px',
//           color: '#3b82f6',
//           background: 'none',
//           border: 'none',
//           cursor: 'pointer',
//           padding: '4px 8px',
//           borderRadius: '6px',
//         }}
//         onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
//         onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
//       >
//         <Plus size={13} /> Add Row
//       </button>
//     </div>
//   );
// }

// function Footer({ doc, setDoc }) {
//   const isGST = doc.gstMode === 'with';
//   const set = (key) => (e) => setDoc((d) => ({ ...d, [key]: e.target.value }));

//   return (
//     <div style={{ marginTop: '12px' }}>
//       {/* Amounts + signature block */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
//         {/* Terms */}
//         <div style={{ flex: 1 }}>
//           <div
//             style={{
//               fontSize: '9px',
//               fontWeight: '700',
//               letterSpacing: '2px',
//               textTransform: 'uppercase',
//               color: '#1e3a5f',
//               marginBottom: '5px',
//             }}
//           >
//             Terms &amp; Conditions
//           </div>
//           <textarea
//             style={{
//               width: '100%',
//               border: 'none',
//               borderLeft: '3px solid #1e3a5f',
//               background: '#f8fafc',
//               fontSize: '10px',
//               color: '#475569',
//               resize: 'none',
//               outline: 'none',
//               padding: '6px 10px',
//               lineHeight: '1.6',
//               borderRadius: '0 4px 4px 0',
//             }}
//             rows={4}
//             value={doc.terms}
//             onChange={set('terms')}
//             placeholder="Terms & conditions..."
//           />
//         </div>

//         {/* Amount summary box */}
//         <div
//           style={{
//             minWidth: '220px',
//             border: '1.5px solid #1e3a5f',
//             borderRadius: '6px',
//             overflow: 'hidden',
//           }}
//         >
//           {isGST && (
//             <div
//               style={{
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//                 padding: '7px 14px',
//                 borderBottom: '1px solid #e2e8f0',
//                 background: '#f8fafc',
//               }}
//             >
//               <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
//                 Total GST
//               </span>
//               <input
//                 style={{
//                   border: 'none',
//                   background: 'transparent',
//                   fontSize: '13px',
//                   fontWeight: '700',
//                   color: '#1e3a5f',
//                   textAlign: 'right',
//                   outline: 'none',
//                   width: '90px',
//                 }}
//                 value={doc.gstAmount}
//                 onChange={set('gstAmount')}
//                 placeholder="0.00"
//               />
//             </div>
//           )}
//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               padding: '10px 14px',
//               background: '#1e3a5f',
//             }}
//           >
//             <span style={{ fontSize: '12px', fontWeight: '700', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px' }}>
//               Net Amount
//             </span>
//             <input
//               style={{
//                 border: 'none',
//                 background: 'transparent',
//                 fontSize: '20px',
//                 fontWeight: '900',
//                 color: '#fff',
//                 textAlign: 'right',
//                 outline: 'none',
//                 width: '100px',
//               }}
//               value={doc.netAmount}
//               onChange={set('netAmount')}
//               placeholder="0.00"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Signature strip */}
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'flex-end',
//           borderTop: '1.5px solid #1e3a5f',
//           paddingTop: '12px',
//           marginTop: '4px',
//         }}
//       >
//         {/* Contact */}
//         <div style={{ fontSize: '10px', color: '#475569', lineHeight: '1.7' }}>
//           <div style={{ fontWeight: '700', color: '#1e3a5f', fontSize: '11px', marginBottom: '2px' }}>
//             For clarifications, contact:
//           </div>
//           <div><strong>Hredaya Kumar</strong> : +91 9048362043</div>
//           <div><strong>Hridhiq Kumar</strong> : +91 8156893302</div>
//         </div>

//         {/* Authorised signature */}
//         <div style={{ textAlign: 'center', minWidth: '160px' }}>
//           <div
//             style={{
//               borderTop: '1px solid #1e3a5f',
//               paddingTop: '6px',
//               fontSize: '10px',
//               color: '#475569',
//               fontWeight: '600',
//               letterSpacing: '0.5px',
//             }}
//           >
//             Authorised Signature
//           </div>
//           <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e3a5f', marginTop: '2px' }}>
//             {doc.companyName || 'HST Infrastructures'}
//           </div>
//         </div>
//       </div>

//       {/* Footer bar */}
//       <div
//         style={{
//           marginTop: '14px',
//           background: '#1e3a5f',
//           borderRadius: '4px',
//           padding: '5px 14px',
//           textAlign: 'center',
//           fontSize: '9px',
//           color: '#93c5fd',
//           letterSpacing: '1px',
//         }}
//       >
//         Thank you for your business — {doc.companyName || 'HST Infrastructures'} | {doc.companyContact}
//       </div>
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────

// export default function EstimateEditor({ type = 'estimate' }) {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const printRef = useRef();
//   const [doc, setDoc] = useState(null);
//   const [busy, setBusy] = useState(false);

//   const isEstimate = type === 'estimate';
//   const storage = isEstimate
//     ? { get: getEstimates, save: saveEstimate }
//     : { get: getInvoices, save: saveInvoice };
//   const listPath = isEstimate ? '/estimates' : '/invoices';

//   useEffect(() => {
//     if (id) {
//       const found = storage.get().find((d) => d.id === id);
//       if (found) return setDoc(found);
//     }
//     setDoc(defaultDoc(type));
//   }, [id, type]); // eslint-disable-line

//   const saveDoc = useCallback(
//     (currentDoc) => {
//       try {
//         storage.save(currentDoc);
//         return true;
//       } catch (e) {
//         console.error('Save error', e);
//         return false;
//       }
//     },
//     [] // eslint-disable-line
//   );

//   const handleSave = () => {
//     if (!doc) return;
//     saveDoc(doc) ? toast.success('Saved!') : toast.error('Failed to save');
//   };

//   const handlePrint = () => {
//     if (!doc) return;
//     saveDoc(doc);
//     window.print();
//   };

//   const handleDownload = async () => {
//     if (!doc || !printRef.current || busy) return;
//     setBusy(true);
//     const safety = setTimeout(() => setBusy(false), 45000);
//     const tid = toast.loading('Generating PDF…');
//     try {
//       saveDoc(doc);
//       const blob = await buildPdfBlob(printRef.current, `${doc.id}.pdf`);
//       const url = URL.createObjectURL(blob);
//       const a = Object.assign(document.createElement('a'), { href: url, download: `${doc.id}.pdf` });
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       setTimeout(() => URL.revokeObjectURL(url), 15000);
//       toast.success('PDF downloaded!', { id: tid });
//     } catch (err) {
//       console.error('PDF error:', err);
//       toast.error('Failed to generate PDF', { id: tid });
//     } finally {
//       clearTimeout(safety);
//       setBusy(false);
//     }
//   };

//   const handleWhatsApp = async () => {
//     if (!doc || !printRef.current || busy) return;
//     setBusy(true);
//     const tid = toast.loading('Preparing PDF…');
//     try {
//       saveDoc(doc);
//       const blob = await buildPdfBlob(printRef.current, `${doc.id}.pdf`);
//       const file = new File([blob], `HST_${doc.id}.pdf`, {
//         type: 'application/pdf',
//         lastModified: Date.now(),
//       });

//       if (navigator.canShare?.({ files: [file] })) {
//         await navigator.share({
//           files: [file],
//           title: `${doc.type} ${doc.id}`,
//           text: `${doc.type} from HST GROUP\nDoc: ${doc.id}\nAmount: ₹${doc.netAmount}`,
//         });
//         toast.success('Shared!', { id: tid });
//       } else {
//         const url = URL.createObjectURL(blob);
//         const a = Object.assign(document.createElement('a'), { href: url, download: `${doc.id}.pdf` });
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         toast.success('PDF saved — attach it in WhatsApp.', { id: tid });
//         setTimeout(
//           () =>
//             window.open(
//               `https://wa.me/?text=${encodeURIComponent(`${doc.type} ${doc.id} from HST GROUP`)}`,
//               '_blank'
//             ),
//           1500
//         );
//       }
//     } catch (err) {
//       console.error('Share error:', err);
//       toast.error('Sharing failed. Try downloading PDF.', { id: tid });
//     } finally {
//       setBusy(false);
//     }
//   };

//   if (!doc) {
//     return (
//       <div className="min-h-screen bg-slate-950 flex items-center justify-center">
//         <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-950">
//       <style>{`
//         @media print {
//           @page { size: A4 portrait; margin: 8mm; }
//           body * { visibility: hidden !important; }
//           #print-area, #print-area * { visibility: visible !important; }
//           #print-area {
//             position: fixed !important;
//             top: 0 !important;
//             left: 0 !important;
//             width: 100% !important;
//             margin: 0 !important;
//             padding: 0 !important;
//             box-shadow: none !important;
//             border-radius: 0 !important;
//           }
//           .no-print { display: none !important; }
//         }
//       `}</style>

//       {/* Action Bar */}
//       <div className="no-print sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center gap-2 flex-wrap">
//         <button
//           onClick={() => navigate(listPath)}
//           className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
//         >
//           <ArrowLeft size={18} />
//         </button>

//         <div className="flex-1 min-w-0">
//           <p className="text-white font-semibold text-sm capitalize">{type} Editor</p>
//           <p className="text-slate-400 text-xs">{doc.id}</p>
//         </div>

//         <div className="flex items-center gap-2 flex-wrap">
//           {/* GST Toggle */}
//           <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl px-3 py-1.5">
//             <span className="text-xs text-slate-400">GST</span>
//             <button
//               onClick={() => setDoc((d) => ({ ...d, gstMode: d.gstMode === 'with' ? 'without' : 'with' }))}
//               className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
//                 doc.gstMode === 'with' ? 'bg-blue-500' : 'bg-slate-600'
//               }`}
//             >
//               <span
//                 className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
//                   doc.gstMode === 'with' ? 'translate-x-4' : 'translate-x-1'
//                 }`}
//               />
//             </button>
//             <span className={`text-xs font-medium ${doc.gstMode === 'with' ? 'text-blue-400' : 'text-slate-400'}`}>
//               {doc.gstMode === 'with' ? 'With' : 'Without'}
//             </span>
//           </div>

//           <button
//             onClick={handleSave}
//             className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl transition-colors"
//           >
//             <Save size={14} /> Save
//           </button>

//           <button
//             onClick={handleWhatsApp}
//             disabled={busy}
//             className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-colors"
//           >
//             <Share2 size={14} /> {busy ? '…' : 'WhatsApp'}
//           </button>

//           <button
//             onClick={handleDownload}
//             disabled={busy}
//             className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-colors"
//           >
//             <Download size={14} /> {busy ? '…' : 'PDF'}
//           </button>

//           <button
//             onClick={handlePrint}
//             className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl transition-colors"
//           >
//             <Printer size={14} /> Print
//           </button>
//         </div>
//       </div>

//       {/* A4 Preview */}
//       <div className="p-4 py-6 overflow-x-auto">
//         <div className="mx-auto flex justify-center pb-8" style={{ minWidth: '210mm' }}>
//           <div
//             id="print-area"
//             ref={printRef}
//             style={{
//               background: '#fff',
//               width: '210mm',
//               minHeight: '297mm',
//               padding: '14mm',
//               fontFamily: 'Arial, Helvetica, sans-serif',
//               boxSizing: 'border-box',
//               borderRadius: '8px',
//               boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
//             }}
//           >
//             <DocHeader doc={doc} setDoc={setDoc} />
//             <CompanyClient doc={doc} setDoc={setDoc} />
//             <ItemTable doc={doc} setDoc={setDoc} />
//             <Footer doc={doc} setDoc={setDoc} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
