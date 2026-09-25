import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, X } from 'lucide-react';
import { NegotiationRound } from '../types';

export interface ContractDisputeProps {
  artistName: string;
  currentGrant: number;
  onSubmitAmendment: (
    category: NegotiationRound['disputedCategory'],
    justification: string,
    proposedGrant?: number
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
  const [proposedGrant, setProposedGrant] = useState<number>(currentGrant);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;

    onSubmitAmendment(
      category,
      justification.trim(),
      category === 'PRODUCTION_GRANT' ? proposedGrant : undefined
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white max-w-lg w-full rounded-lg shadow-xl border border-[#D9D2C5] p-6 space-y-5 text-start">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#8B4513]" />
            <h3 id="dispute-modal-title" className="text-lg font-serif font-bold text-[#1A1817]">
              Request Agreement Amendment (طلب تعديل رسمي)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#1A1817] mb-1">
              Disputed Term Category (بند التعديل المطلوب)
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as NegotiationRound['disputedCategory'])}
              className="w-full rounded-md border border-[#D9D2C5] bg-[#FAF8F5] p-2.5 text-xs font-medium text-[#1A1817] focus:ring-1 focus:ring-[#8B4513] focus:border-[#8B4513] outline-hidden cursor-pointer"
            >
              <option value="PRODUCTION_GRANT">Production Grant Allocation (مخصصات الإنتاج والدفعات)</option>
              <option value="SHIPPING_TERMS">Shipping & Transit Liabilities (الشحن والتأمين الميداني)</option>
              <option value="INSTALLATION_DATES">Installation Dates & Timeline (مواعيد التركيب والجدول الزمني)</option>
              <option value="OTHER">Other Institutional Provisions (شروط تعاقدية أخرى)</option>
            </select>
          </div>

          {/* Conditional Proposed Grant Field */}
          {category === 'PRODUCTION_GRANT' && (
            <div>
              <label className="block text-xs font-bold text-[#1A1817] mb-1">
                Proposed Counter-Allocation (المبلغ المقترح بالدرهم)
              </label>
              <div className="relative">
                <span className="absolute start-3 top-2.5 text-stone-400 font-mono text-xs">AED</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={proposedGrant}
                  onChange={e => setProposedGrant(Math.max(0, Number(e.target.value)))}
                  className="w-full ps-12 pe-4 py-2 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-xs font-mono font-semibold focus:ring-1 focus:ring-[#8B4513] focus:border-[#8B4513] outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Justification Text Area */}
          <div>
            <label className="block text-xs font-bold text-[#1A1817] mb-1">
              Formal Institutional Justification (المبررات التفصيلية للطلب)
            </label>
            <textarea
              rows={4}
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Detail reasons for proposed modifications (e.g. scale of calligraphic fabrication, fine-art air freight requirements, material cost breakdown)..."
              className="w-full rounded-md border border-[#D9D2C5] bg-[#FAF8F5] p-3 text-xs text-[#1A1817] focus:ring-1 focus:ring-[#8B4513] focus:border-[#8B4513] outline-hidden resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-[#EAE3D9] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D9D2C5] rounded-md text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!justification.trim()}
              className="flex items-center gap-2 bg-[#8B4513] hover:bg-[#6e350f] disabled:opacity-40 text-white px-5 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
