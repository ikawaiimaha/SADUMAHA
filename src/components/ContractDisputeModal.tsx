import React, { useState } from 'react';
import { FileText, Send, AlertCircle } from 'lucide-react';

interface ContractDisputeProps {
  artistName: string;
  currentGrant: number;
  onSubmitAmendment: (notes: string) => void;
  onClose: () => void;
}

export default function ContractDisputeModal({ artistName, currentGrant, onSubmitAmendment, onClose }: ContractDisputeProps) {
  const [amendmentNotes, setAmendmentNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 font-sans text-start" dir="ltr">
      <div className="bg-white max-w-lg w-full rounded-lg shadow-lg border border-[#D9D2C5] p-6">
        
        <div className="flex items-center gap-2 text-[#8B4513] mb-4 border-b border-[#EAE3D9] pb-3">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-lg font-serif font-bold">Request Agreement Amendment (طلب تعديل)</h3>
        </div>

        <p className="text-xs text-[#6B635B] mb-4 leading-relaxed">
          Artist: <strong className="text-[#1A1817]">{artistName}</strong> | Current Grant: <strong className="text-[#1A1817]">{currentGrant.toLocaleString()} AED</strong>
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-[#1A1817] mb-1">
              Specify Requested Modifications (Tranche Structure, Shipping Liabilities, etc.)
            </label>
            <textarea 
              rows={4}
              value={amendmentNotes}
              onChange={(e) => setAmendmentNotes(e.target.value)}
              placeholder="Enter detailed negotiation notes for the General Coordinator..."
              className="w-full p-3 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-sm focus:ring-1 focus:ring-[#8B4513]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#EAE3D9] pt-4">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#D9D2C5] rounded-md text-xs font-medium text-[#6B635B] hover:bg-stone-50"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={!amendmentNotes.trim()}
            onClick={() => {
              onSubmitAmendment(amendmentNotes);
              onClose();
            }}
            className="flex items-center gap-2 bg-[#8B4513] hover:bg-[#6e350f] disabled:bg-[#D9D2C5] text-white px-5 py-2 rounded-md text-xs font-medium shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Amendment Request
          </button>
        </div>

      </div>
    </div>
  );
}
