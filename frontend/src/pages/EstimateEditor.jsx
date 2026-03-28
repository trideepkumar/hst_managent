import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Printer, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveEstimate, getEstimates, saveInvoice, getInvoices } from '../utils/localStorage';
import { generateDocNumber } from '../utils/formatCurrency';
import html2pdf from 'html2pdf.js';
import logo from '../../public/assests/logo.png'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyRow = () => ({
  id: Date.now() + Math.random(),
  description: '',
  showInch: false,
  inch12: false,
  inch6: false,
  rate: '',
  qty: '',
  gst: '',
  total: '',
});

const defaultDoc = (type) => ({
  id: generateDocNumber(type === 'estimate' ? 'EST' : 'INV'),
  type,
  gstMode: 'without',
  date: new Date().toISOString().split('T')[0],
  companyName: 'HST Traders',
  companyAddress: 'Panmana P O , Kollam\nKerala , 691583',
  companyContact: '+91 9048362043 / +91 8156893302',
  companyGST: '32BVHPH8489P1ZQ',
  clientName: '',
  clientAddress: '',
  clientContact: '',
  clientGST: '',
  items: Array.from({ length: 11 }, emptyRow),
  subtotal: '',
  gstAmount: '',
  netAmount: '',
  terms: 'The party shall provide water, Electricity and other necessary materials required for tubewell, borewell, or compressor cleaning works.',
  logo: null,
});

async function buildPdfBlob(el, filename) {
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px;';
  document.body.appendChild(container);

  const clone = el.cloneNode(true);
  clone.querySelectorAll('.no-print').forEach((n) => n.remove());
  clone.style.cssText = 'width:794px;margin:0;padding:40px;box-shadow:none;';
  container.appendChild(clone);

  try {
    const blob = await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          width: 794,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0,
          onclone: (doc) => {
            doc.querySelectorAll('link[rel="stylesheet"], style').forEach((s) => s.remove());
          },
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
      })
      .from(clone)
      .outputPdf('blob');
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

// ─── Field helpers ─────────────────────────────────────────────────────────────

const inp = 'w-full bg-transparent border-b border-slate-300 px-1 py-0.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 placeholder-slate-400';
const lbl = 'text-[11px] text-slate-500 mb-0.5 block';

// ─── Sub-components ───────────────────────────────────────────────────────────

function DocHeader({ doc, setDoc }) {
  const logoRef = useRef();
  const set = (key) => (e) => setDoc((d) => ({ ...d, [key]: e.target.value }));

  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      {/* Logo */}
      <div
        className="h-20 w-20 rounded-full border-2 border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer bg-slate-50 flex-shrink-0"
        onClick={() => logoRef.current.click()}
        title="Click to upload logo"
      >
        <img
          src={logo}
          className="h-full w-full object-contain"
          alt="logo"
        />
      </div>
      <input
        ref={logoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => setDoc((d) => ({ ...d, logo: ev.target.result }));
          reader.readAsDataURL(file);
        }}
      />

      {/* Title */}
      <div className="flex-1 text-center self-center">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-widest uppercase">
          {doc.type}
        </h1>
      </div>

      {/* Meta */}
      <div className="text-right space-y-2" style={{ minWidth: 200 }}>
        {doc.gstMode === 'with' && (
          <div>
            <label className={lbl}>GST No</label>
            <input
              className={inp}
              value={doc.companyGST}
              onChange={set('companyGST')}
              placeholder="GST Number"
            />
          </div>
        )}
        <div>
          <label className={lbl}>Date</label>
          <input type="date" className={inp + ' text-right'} value={doc.date} onChange={set('date')} />
        </div>
        <div>
          <label className={lbl}>Doc No</label>
          <span className="text-xs font-mono text-slate-600">{doc.id}</span>
        </div>
      </div>
    </div>
  );
}

function CompanyClient({ doc, setDoc }) {
  const set = (key) => (e) => setDoc((d) => ({ ...d, [key]: e.target.value }));
  return (
    <div className="mb-4 text-sm space-y-1">
      <p className="font-bold text-slate-800">{doc.companyName || 'HST GROUP'}</p>
      <textarea
        className="w-full bg-transparent border-none resize-none text-sm text-slate-600 focus:outline-none p-0 leading-snug"
        rows={2}
        value={doc.companyAddress}
        onChange={set('companyAddress')}
        placeholder="Company address"
      />
      <p className="text-slate-500 text-xs pt-1">To</p>
      <input
        className="w-full bg-transparent border-none text-sm font-bold text-slate-800 focus:outline-none p-0"
        value={doc.clientName}
        onChange={set('clientName')}
        placeholder="Client Name"
      />
      <textarea
        className="w-full bg-transparent border-none resize-none text-sm text-slate-600 focus:outline-none p-0 leading-snug"
        rows={3}
        value={doc.clientAddress}
        onChange={set('clientAddress')}
        placeholder="Client address, company..."
      />
    </div>
  );
}

function ItemTable({ doc, setDoc }) {
  const isGST = doc.gstMode === 'with';

  const updateItem = (id, key, val) =>
    setDoc((d) => ({
      ...d,
      items: d.items.map((r) => (r.id === id ? { ...r, [key]: val } : r)),
    }));

  const addRow = () => setDoc((d) => ({ ...d, items: [...d.items, emptyRow()] }));
  const delRow = (id) => setDoc((d) => ({ ...d, items: d.items.filter((r) => r.id !== id) }));
  const setField = (key) => (e) => setDoc((d) => ({ ...d, [key]: e.target.value }));

  const th = 'border border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-600 text-center bg-slate-50';
  const td = 'border border-slate-200 px-1 py-0';
  const cellInp = 'w-full border-none text-xs px-1 py-2 text-slate-800 focus:outline-none bg-transparent';

  return (
    <div className="mb-2">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th} style={{ width: 36 }}>#</th>
            <th className={th}>Description</th>
            <th className={th} style={{ width: 60 }}>Inch</th>
            <th className={th} style={{ width: 80 }}>Rate</th>
            <th className={th} style={{ width: 70 }}>Qty</th>
            {isGST && <th className={th} style={{ width: 56 }}>GST</th>}
            <th className={th} style={{ width: 90 }}>Total</th>
            <th className={`${th} no-print`} style={{ width: 28 }} />
          </tr>
        </thead>
        <tbody>
          {doc.items.map((row, idx) => (
            <tr key={row.id}>
              <td className={`${td} text-center text-xs text-slate-500 py-1`}>{idx + 1}.</td>
              <td className={td}>
                <input
                  className={cellInp}
                  value={row.description}
                  onChange={(e) => updateItem(row.id, 'description', e.target.value)}
                  placeholder="Item description"
                />
              </td>
              <td className={`${td} align-middle`}>
                {row.showInch ? (
                  <div className="flex flex-col items-center py-1 gap-0.5">
                    <label className="flex items-center text-black gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.inch12}
                        onChange={(e) => updateItem(row.id, 'inch12', e.target.checked)}
                        className="h-3 w-3"
                      />
                      12
                    </label>
                    <label className="flex items-center text-black gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.inch6}
                        onChange={(e) => updateItem(row.id, 'inch6', e.target.checked)}
                        className="h-3 w-3"
                      />
                      6
                    </label>
                    <button
                      className="no-print text-slate-300 hover:text-red-400 mt-0.5 text-[10px]"
                      onClick={() => updateItem(row.id, 'showInch', false)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="no-print flex justify-center py-1">
                    <button
                      className="text-slate-300 hover:text-blue-500 text-base leading-none"
                      onClick={() => updateItem(row.id, 'showInch', true)}
                    >
                      +
                    </button>
                  </div>
                )}
              </td>
              <td className={td}>
                <input
                  className={cellInp + ' text-center'}
                  value={row.rate}
                  onChange={(e) => updateItem(row.id, 'rate', e.target.value)}
                />
              </td>
              <td className={td}>
                <input
                  className={cellInp + ' text-center'}
                  value={row.qty}
                  onChange={(e) => updateItem(row.id, 'qty', e.target.value)}
                />
              </td>
              {isGST && (
                <td className={td}>
                  <input
                    className={cellInp + ' text-center'}
                    value={row.gst}
                    onChange={(e) => updateItem(row.id, 'gst', e.target.value)}
                  />
                </td>
              )}
              <td className={td}>
                <input
                  className={cellInp + ' text-right'}
                  value={row.total}
                  onChange={(e) => updateItem(row.id, 'total', e.target.value)}
                />
              </td>
              <td className={`${td} no-print`}>
                <button
                  onClick={() => delRow(row.id)}
                  className="p-1 text-slate-300 hover:text-red-500 w-full flex items-center justify-center"
                >
                  <Trash2 size={11} />
                </button>
              </td>
            </tr>
          ))}

          {/* Totals row */}
          <tr>
            <td className={`${td} py-1`} colSpan={isGST ? 5 : 4} />
            <td className={`${td} px-2 py-1.5`}>
              <span className="text-xs font-bold text-slate-700">TOTAL</span>
            </td>
            {isGST && <td className={td} />}
            <td className={td}>
              <input
                className={cellInp + ' text-right font-bold'}
                value={doc.subtotal}
                onChange={setField('subtotal')}
                placeholder="0"
              />
            </td>
            <td className={`${td} no-print`} />
          </tr>
        </tbody>
      </table>

      <button
        onClick={addRow}
        className="no-print mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
      >
        <Plus size={13} /> Add Row
      </button>
    </div>
  );
}

function Footer({ doc, setDoc }) {
  const isGST = doc.gstMode === 'with';
  const set = (key) => (e) => setDoc((d) => ({ ...d, [key]: e.target.value }));

  return (
    <div className="mt-3">
      <div className="flex justify-between items-end gap-4 mb-3">
        {/* Contact */}
        <div className="text-xs text-slate-600 space-y-0.5">
          <p>For clarifications, contact:</p>
          <p><strong>Hredaya Kumar</strong> : +91 9048362043</p>
          <p><strong>Hridhiq Kumar</strong> : +91 8156893302</p>
        </div>

        {/* Amounts */}
        <div className="text-right space-y-1">
          {isGST && (
            <div className="flex items-center justify-end gap-4 pb-1 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total GST</span>
              <input
                className="border-none text-lg font-bold text-slate-800 focus:outline-none bg-transparent text-right w-32"
                value={doc.gstAmount}
                onChange={set('gstAmount')}
                placeholder="0"
              />
            </div>
          )}
          <div className="flex items-center justify-end gap-4">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Net Amount</span>
            <input
              className="border-none text-2xl font-extrabold text-slate-900 focus:outline-none bg-transparent text-right w-32"
              value={doc.netAmount}
              onChange={set('netAmount')}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 mb-2" />

      <div className="text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Terms & Conditions: </span>
        <textarea
          className="w-full resize-none border-none text-xs text-slate-500 focus:outline-none bg-transparent leading-relaxed p-0 mt-0.5"
          rows={2}
          value={doc.terms}
          onChange={set('terms')}
          placeholder="Terms & conditions..."
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EstimateEditor({ type = 'estimate' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);

  const isEstimate = type === 'estimate';
  const storage = isEstimate
    ? { get: getEstimates, save: saveEstimate }
    : { get: getInvoices, save: saveInvoice };
  const listPath = isEstimate ? '/estimates' : '/invoices';

  // Load doc
  useEffect(() => {
    if (id) {
      const found = storage.get().find((d) => d.id === id);
      if (found) return setDoc(found);
    }
    setDoc(defaultDoc(type));
  }, [id, type]); // eslint-disable-line

  const saveDoc = useCallback(
    (currentDoc) => {
      try {
        storage.save(currentDoc);
        return true;
      } catch (e) {
        console.error('Save error', e);
        return false;
      }
    },
    [] // eslint-disable-line
  );

  const handleSave = () => {
    if (!doc) return;
    saveDoc(doc) ? toast.success('Saved!') : toast.error('Failed to save');
  };

  const handlePrint = () => {
    if (!doc) return;
    saveDoc(doc);
    window.print();
  };

  const handleDownload = async () => {
    if (!doc || !printRef.current || busy) return;
    setBusy(true);
    const safety = setTimeout(() => setBusy(false), 45000);
    const tid = toast.loading('Generating PDF…');
    try {
      saveDoc(doc);
      const blob = await buildPdfBlob(printRef.current, `${doc.id}.pdf`);
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `${doc.id}.pdf` });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      toast.success('PDF downloaded!', { id: tid });
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF', { id: tid });
    } finally {
      clearTimeout(safety);
      setBusy(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!doc || !printRef.current || busy) return;
    setBusy(true);
    const tid = toast.loading('Preparing PDF…');
    try {
      saveDoc(doc);
      const blob = await buildPdfBlob(printRef.current, `${doc.id}.pdf`);
      const file = new File([blob], `HST_${doc.id}.pdf`, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${doc.type} ${doc.id}`,
          text: `${doc.type} from HST GROUP\nDoc: ${doc.id}\nAmount: ₹${doc.netAmount}`,
        });
        toast.success('Shared!', { id: tid });
      } else {
        // Desktop fallback: download + open WhatsApp
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: `${doc.id}.pdf` });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('PDF saved — attach it in WhatsApp.', { id: tid });
        setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(`${doc.type} ${doc.id} from HST GROUP`)}`, '_blank'), 1500);
      }
    } catch (err) {
      console.error('Share error:', err);
      toast.error('Sharing failed. Try downloading PDF.', { id: tid });
    } finally {
      setBusy(false);
    }
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
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }

          /* Hide everything on the page */
          body * { visibility: hidden !important; }

          /* Show only the A4 document */
          #print-area, #print-area * { visibility: visible !important; }

          /* Position the document at top-left of the page */
          #print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          /* Hide interactive/editor-only elements inside the doc */
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action Bar */}
      <div className="no-print sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => navigate(listPath)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm capitalize">{type} Editor</p>
          <p className="text-slate-400 text-xs">{doc.id}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* GST Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400">GST</span>
            <button
              onClick={() => setDoc((d) => ({ ...d, gstMode: d.gstMode === 'with' ? 'without' : 'with' }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                doc.gstMode === 'with' ? 'bg-blue-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  doc.gstMode === 'with' ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-medium ${doc.gstMode === 'with' ? 'text-blue-400' : 'text-slate-400'}`}>
              {doc.gstMode === 'with' ? 'With' : 'Without'}
            </span>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl transition-colors"
          >
            <Save size={14} /> Save
          </button>

          <button
            onClick={handleWhatsApp}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-colors"
          >
            <Share2 size={14} /> {busy ? '…' : 'WhatsApp'}
          </button>

          <button
            onClick={handleDownload}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl transition-colors"
          >
            <Download size={14} /> {busy ? '…' : 'PDF'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl transition-colors"
          >
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
            className="bg-white rounded-lg shadow-2xl"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '14mm',
              fontFamily: 'Arial, sans-serif',
              boxSizing: 'border-box',
            }}
          >
            <DocHeader doc={doc} setDoc={setDoc} />
            <CompanyClient doc={doc} setDoc={setDoc} />
            <ItemTable doc={doc} setDoc={setDoc} />
            <Footer doc={doc} setDoc={setDoc} />
          </div>
        </div>
      </div>
    </div>
  );
}