import React, { useState } from 'react';
import { X, CheckCircle2, Wrench } from 'lucide-react';
import { RoadIssue } from '../types';

interface SolveProblemModalProps {
  isOpen: boolean;
  issue: RoadIssue | null;
  onClose: () => void;
  onSolve: (issueId: string, notes: string) => Promise<void> | void;
}

export const SolveProblemModal: React.FC<SolveProblemModalProps> = ({
  isOpen,
  issue,
  onClose,
  onSolve,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !issue) return null;

  const handleConfirm = async () => {
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution notes.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSolve(issue.id, resolutionNotes);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#D5DEE8] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#D5DEE8] bg-[#F9FBFC]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-[#172033] font-bold text-lg">Mark Problem as Solved</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#526071] hover:text-[#172033] transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm text-[#172033] font-sans bg-white">
          <div className="grid grid-cols-2 gap-2 bg-[#EEF2F6] p-3 rounded-lg border border-[#D5DEE8]">
            <div>
              <span className="text-[#526071] block text-xs">Problem ID:</span>
              <span className="font-bold text-cyan-700">{issue.id}</span>
            </div>
            <div>
              <span className="text-[#526071] block text-xs">Status:</span>
              <span className="text-[#526071]">In Progress → <span className="text-emerald-700 font-bold">Solved</span></span>
            </div>
            <div className="col-span-2">
              <span className="text-[#526071] block text-xs">Problem Type:</span>
              <span className="text-[#172033] capitalize">{issue.type.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[#172033] font-bold block text-xs">Resolution Notes (Required):</label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Enter work completed, materials used, or repair details..."
              className="w-full bg-white border border-[#D5DEE8] rounded-lg p-2.5 text-sm text-[#172033] placeholder-[#7A8797] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#526071] font-bold block text-xs">Completion Image (Optional):</label>
            <div className="w-full border-2 border-dashed border-[#D5DEE8] rounded-lg p-4 text-center cursor-not-allowed opacity-60 bg-[#F9FBFC]">
              <span className="text-[#7A8797] text-xs">Image upload disabled in this demo</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#D5DEE8] bg-[#F9FBFC] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#526071] hover:text-[#172033] border border-[#D5DEE8] font-semibold text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !resolutionNotes.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            <span>Confirm Resolution</span>
          </button>
        </div>
      </div>
    </div>
  );
};
