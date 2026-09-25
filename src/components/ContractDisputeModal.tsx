import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { NegotiationRound } from '../types';

export interface ContractDisputeProps {
  artistName: string;
  currentGrant: number;
  onSubmitAmendment: (
    category: NegotiationRound['disputedCategory'],
    justification: string
  ) => void;
  onClose: () => void;
}

export default function ContractDisputeModal({
  artistName,
  currentGrant,
  onSubmitAmendment,
  onClose,
}: ContractDisputeProps) {
  const [category, setCategory] = useState<NegotiationRound['disputedCategory']>('PRODUCTION_GRANT');
  const [justification, setJustification] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;
    onSubmitAmendment(category, justification.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 font-sans text-start" dir="ltr">
      <div className="bg-white max-w-lg w-full rounded-lg shadow-lg border border-[#D9D2C5] p-6 space-y-4">
        
        <div className="flex items-center gap-2 text-[#8B4513] border-b border-[#EAE3D9] pb-3">
          <AlertCircle className="w-5 h-5 text-amber-700" />
          <h3 className="text-lg font-serif font-bold text-sadu-charcoal">
            Request Agreement Amendment (طلب تعديل رسمي)
          </h3>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 space-y-1">
          <p className="leading-relaxed">
            Artist: <strong className="text-sadu-charcoal">{artistName}</strong> &middot; Current Production Grant:{' '}
            <strong className="text-sadu-charcoal">AED {currentGrant.toLocaleString()}</strong>
          </p>
          <span className="text-[11px] text-amber-800 block">
            Government Compliance: Amendments are logged into the institutional audit trail for the Sharjah Central Finance Department.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-sadu-charcoal mb-1">
              Disputed Term Category (بند التعديل المطلوب)
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as NegotiationRound['disputedCategory'])}
              className="w-full rounded border border-sadu-gold/70 bg-white p-2.5 text-xs font-semibold text-sadu-charcoal focus:ring-1 focus:ring-sadu-brick focus:border-sadu-brick"
            >
              <option value="PRODUCTION_GRANT">Production Grant Allocation (مخصصات الإنتاج والدفعات)</option>
              <option value="SHIPPING_TERMS">Shipping & Transit Liabilities (الشحن والتأمين الميداني)</option>
              <option value="INSTALLATION_DATES">Installation Dates & Timeline (مواعيد التركيب والجدول الزمني)</option>
              <option value="OTHER">Other Institutional Provisions (شروط تعاقدية أخرى)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-sadu-charcoal mb-1">
              Formal Institutional Justification (المبررات التفصيلية للطلب)
            </label>
            <textarea
              rows={4}
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Detail reasons for proposed modifications (e.g. scale of calligraphic fabrication, fine-art air freight requirements, material cost breakdown)..."
              className="w-full rounded border border-sadu-gold/70 bg-[#FAF8F5] p-3 text-xs text-sadu-charcoal focus:ring-1 focus:ring-sadu-brick focus:border-sadu-brick"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[#EAE3D9] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D9D2C5] rounded-md text-xs font-bold text-sadu-muted hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!justification.trim()}
              className="flex items-center gap-2 bg-[#8B4513] hover:bg-[#6e350f] disabled:opacity-40 text-white px-5 py-2 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Amendment Request</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
