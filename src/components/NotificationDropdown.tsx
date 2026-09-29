import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Bus, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { AppNotification, NotificationType, RoadIssue } from '../types';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onSelectNotification: (notif: AppNotification) => void;
  onClearNotification?: (id: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications = filterMode === 'UNREAD' 
    ? notifications.filter((n) => !n.isRead) 
    : notifications;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'CRITICAL':
        return (
          <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-300 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute opacity-60"></span>
            <AlertTriangle className="w-3.5 h-3.5 relative z-10" />
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        );
      case 'PENDING':
        return (
          <div className="w-7 h-7 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-3.5 h-3.5" />
          </div>
        );
      case 'IN_PROGRESS':
        return (
          <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-300 text-cyan-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
        );
      case 'SOLVED':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        );
      case 'SYSTEM':
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-300 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Cpu className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'CRITICAL':
        return { text: 'Critical Alert', color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'MEDIUM':
        return { text: 'Medium Alert', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'PENDING':
        return { text: 'Pending Review', color: 'text-yellow-800 bg-yellow-50 border-yellow-200' };
      case 'IN_PROGRESS':
        return { text: 'In Progress', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
      case 'SOLVED':
        return { text: 'Resolved', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'SYSTEM':
      default:
        return { text: 'System Update', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[440px] bg-white/95 backdrop-blur-md border border-[#D5DEE8] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,175,198,0.12)] z-50 overflow-hidden flex flex-col font-sans select-none animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header Bar */}
      <div className="p-3 px-3.5 border-b border-[#D5DEE8] bg-white/90 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-300 text-cyan-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-xs text-[#172033] uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white shadow-2xs">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#7A8797] font-mono leading-none mt-0.5">
              Live AI transportation incident alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-semibold text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 border border-transparent hover:border-cyan-200 transition-all cursor-pointer"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close notifications"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar: All vs Unread */}
      <div className="px-3 py-1.5 bg-[#F8FAFC] border-b border-[#D5DEE8] flex items-center justify-between text-xs font-mono shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-white text-cyan-700 font-bold border border-[#D5DEE8] shadow-2xs'
                : 'text-[#526071] hover:text-[#172033]'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilterMode('UNREAD')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filterMode === 'UNREAD'
                ? 'bg-white text-rose-600 font-bold border border-[#D5DEE8] shadow-2xs'
                : 'text-[#526071] hover:text-[#172033]'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <span className="text-[10px] text-[#7A8797]">
          {notifications.length} alerts synced
        </span>
      </div>

      {/* Scrollable Notification List */}
      <div className="overflow-y-auto max-h-[380px] divide-y divide-[#D5DEE8]/60 p-1.5 space-y-1">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-[#7A8797] font-mono text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400/80" />
            <p className="font-semibold text-[#172033]">All caught up!</p>
            <p className="text-[11px] text-[#7A8797] mt-0.5">
              {filterMode === 'UNREAD' 
                ? 'No unread notifications at this time.' 
                : 'No alerts registered in system.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const labelInfo = getTypeLabel(notif.type);

            return (
              <div
                key={notif.id}
                onClick={() => onSelectNotification(notif)}
                className={`p-2.5 rounded-lg transition-all cursor-pointer flex items-start gap-3 relative group ${
                  !notif.isRead
                    ? 'bg-gradient-to-r from-cyan-50/40 via-white to-white hover:bg-cyan-50/60 border border-cyan-200/80 shadow-2xs'
                    : 'bg-white hover:bg-[#F8FAFC] border border-transparent hover:border-[#D5DEE8]'
                }`}
              >
                {/* Type Icon */}
                {getTypeIcon(notif.type)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${labelInfo.color}`}>
                        {labelInfo.text}
                      </span>
                      {notif.problemId && (
                        <span className="font-mono text-[10px] font-bold text-cyan-700">
                          {notif.problemId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7A8797] shrink-0">
                      <span>{notif.timestamp}</span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(0,175,198,0.7)]" title="Unread"></span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-[#172033] line-clamp-1 mb-0.5">
                    {notif.title}
                  </h4>

                  <p className="text-[11px] text-[#526071] line-clamp-2 leading-relaxed">
                    {notif.description}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-[#D5DEE8]/50 text-[10px] font-mono text-[#7A8797]">
                    <div className="flex items-center gap-2 truncate">
                      {notif.vehicleId && (
                        <span className="flex items-center gap-1 text-amber-700 font-semibold truncate">
                          <Bus className="w-2.5 h-2.5" />
                          <span>{notif.vehicleId}</span>
                        </span>
                      )}
                      {notif.severity && (
                        <span className={`font-semibold ${
                          notif.severity === 'HIGH' ? 'text-rose-600' : notif.severity === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {notif.severity} Severity
                        </span>
                      )}
                    </div>

                    <span className="text-cyan-700 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Optional Thumbnail */}
                {notif.thumbnail && (
                  <div className="w-12 h-12 rounded-md overflow-hidden border border-[#D5DEE8] shrink-0 bg-slate-100 self-center">
                    <img 
                      src={notif.thumbnail} 
                      alt="Hazard evidence" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Bar */}
      <div className="p-2 px-3 border-t border-[#D5DEE8] bg-[#F8FAFC] flex items-center justify-between text-[11px] font-mono text-[#526071] shrink-0">
        <button
          onClick={() => setFilterMode('ALL')}
          className="text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>View All Notifications ({notifications.length})</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        <span className="text-[10px] text-emerald-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Edge AI Feed Live</span>
        </span>
      </div>
    </div>
  );
};
