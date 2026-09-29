import React from 'react';
import { X, ChevronRight, ExternalLink } from 'lucide-react';
import { ToastAlert } from '../types';

interface ToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
  onSelectToast: (toast: ToastAlert) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onSelectToast,
}) => {
  if (toasts.length === 0) return null;

  return (
    <aside 
      className="fixed bottom-5 right-5 z-[2600] flex flex-col gap-3 max-w-[380px] sm:max-w-[420px] w-full pointer-events-none select-none px-3 sm:px-0"
      aria-live="assertive"
      aria-label="Real-time road hazard detection alerts"
    >
      {toasts.map((toast) => {
        const isCritical = toast.type === 'CRITICAL' || toast.severity === 'HIGH';
        const isMedium = toast.type === 'MEDIUM' || toast.severity === 'MEDIUM';

        // URBANSENSE severity color themes
        const cardStyle = isCritical
          ? 'border-rose-400 bg-white/98 shadow-[0_12px_36px_rgba(225,29,72,0.22),0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-rose-500/25'
          : isMedium
          ? 'border-amber-400 bg-white/98 shadow-[0_12px_36px_rgba(245,158,11,0.22),0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-amber-500/25'
          : 'border-cyan-400 bg-white/98 shadow-[0_12px_36px_rgba(6,182,212,0.22),0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-cyan-500/25';

        const badgeDot = isCritical ? '🔴' : isMedium ? '🟠' : '🔵';
        const badgeLabel = isCritical ? 'CRITICAL ALERT' : isMedium ? 'MEDIUM ALERT' : 'SYSTEM ALERT';
        const badgeColor = isCritical 
          ? 'text-rose-600 font-bold font-mono' 
          : isMedium 
          ? 'text-amber-600 font-bold font-mono' 
          : 'text-cyan-600 font-bold font-mono';

        return (
          <div
            key={toast.id}
            onClick={() => onSelectToast(toast)}
            className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-md transition-all duration-300 cursor-pointer flex flex-col group animate-in slide-in-from-bottom-5 fade-in duration-300 hover:scale-[1.01] active:scale-[0.99] ${cardStyle}`}
            role="alert"
          >
            {/* Top Row: Severity Status + Timestamp */}
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs leading-none" role="img" aria-label="Status icon">
                  {badgeDot}
                </span>
                <span className={`text-[11px] uppercase tracking-wider ${badgeColor}`}>
                  {badgeLabel}
                </span>
                {toast.problemId && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-[#172033] border border-slate-200">
                    {toast.problemId}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#7A8797] font-semibold">
                  {toast.timestamp || 'Just now'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(toast.id);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Dismiss alert"
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Middle Section: Title & Details */}
            <div className="pt-2">
              <h4 className="text-xs sm:text-[13px] font-bold text-[#172033] line-clamp-1 group-hover:text-cyan-700 transition-colors leading-tight">
                {toast.title}
              </h4>
              <p className="text-[11px] text-[#526071] font-mono mt-1 line-clamp-1">
                {toast.description}
              </p>
            </div>

            {/* Bottom Row: Thumbnail + Dispatch / Inspect info */}
            <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-slate-100">
              {toast.thumbnail ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-14 h-9 rounded-md overflow-hidden border border-[#D5DEE8] shrink-0 bg-slate-900 shadow-2xs">
                    <img 
                      src={toast.thumbnail} 
                      alt="Detection thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[10px] font-mono text-[#7A8797] truncate">
                    {toast.vehicleId && (
                      <span className="text-amber-700 font-semibold block truncate">
                        Fleet: {toast.vehicleId}
                      </span>
                    )}
                    <span className="text-cyan-700 underline font-sans font-medium flex items-center gap-0.5 mt-0.5">
                      Click to inspect
                      <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-mono text-[#7A8797]">
                  {toast.vehicleId && (
                    <span className="text-amber-700 font-semibold">
                      Fleet: {toast.vehicleId} • 
                    </span>
                  )}
                  <span className="text-cyan-700 underline font-sans font-medium ml-1">
                    Click to inspect hazard
                  </span>
                </div>
              )}

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#526071] shrink-0">
                YOLOv8 Edge
              </span>
            </div>
          </div>
        );
      })}
    </aside>
  );
};
