import React from 'react';
import { X, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight, Bus } from 'lucide-react';
import { ToastAlert } from '../types';

interface NotificationToastContainerProps {
  toasts: ToastAlert[];
  onDismissToast: (id: string) => void;
  onSelectToast: (toast: ToastAlert) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  toasts,
  onDismissToast,
  onSelectToast,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-5 right-5 z-[2600] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isCritical = toast.type === 'CRITICAL' || toast.severity === 'HIGH';
        const isMedium = toast.type === 'MEDIUM' || toast.severity === 'MEDIUM';

        const borderClass = isCritical 
          ? 'border-rose-500/80 shadow-[0_8px_28px_rgba(244,63,94,0.25)]' 
          : isMedium 
          ? 'border-amber-500/80 shadow-[0_8px_28px_rgba(245,158,11,0.22)]' 
          : 'border-cyan-500/80 shadow-[0_8px_28px_rgba(0,175,198,0.2)]';

        return (
          <div
            key={toast.id}
            onClick={() => onSelectToast(toast)}
            className={`pointer-events-auto bg-white/95 backdrop-blur-md border ${borderClass} rounded-xl p-3 text-xs font-mono transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99] flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 group`}
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {isCritical ? (
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-300 text-rose-600 flex items-center justify-center relative shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute opacity-70"></span>
                  <AlertTriangle className="w-4 h-4 relative z-10" />
                </div>
              ) : isMedium ? (
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center shadow-2xs">
                  <AlertCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.2 rounded border ${
                  isCritical 
                    ? 'text-rose-700 bg-rose-50 border-rose-200' 
                    : isMedium 
                    ? 'text-amber-700 bg-amber-50 border-amber-200' 
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
                  {isCritical ? '🔴 CRITICAL ALERT' : isMedium ? '🟠 MEDIUM ALERT' : '🟢 REPAIRED ALERT'}
                </span>

                {toast.vehicleId && (
                  <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5">
                    <Bus className="w-2.5 h-2.5" />
                    <span>{toast.vehicleId}</span>
                  </span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-[#172033] line-clamp-1 mb-0.5">
                {toast.title}
              </h4>

              <p className="text-[11px] text-[#526071] line-clamp-2 leading-tight">
                {toast.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-cyan-600 font-medium pt-1.5 mt-1 border-t border-slate-200/60">
                <span className="underline">Click to view evidence &amp; inspect</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Optional Thumbnail */}
            {toast.thumbnail && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#D5DEE8] shrink-0 bg-slate-100 self-center">
                <img 
                  src={toast.thumbnail} 
                  alt="Hazard evidence" 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismissToast(toast.id);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Dismiss toast"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
