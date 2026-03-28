import { AlertTriangle, X } from 'lucide-react';
import useUIStore from '../../store/uiStore';

export default function ConfirmModal() {
  const { modal, closeModal } = useUIStore();

  if (!modal.open) return null;

  const handleConfirm = () => {
    modal.onConfirm?.();
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={closeModal}>
      <div
        className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm p-6 animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-500/10 rounded-xl">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-base mb-1">{modal.title}</h3>
            <p className="text-slate-400 text-sm">{modal.message}</p>
          </div>
          <button onClick={closeModal} className="text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={closeModal}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
