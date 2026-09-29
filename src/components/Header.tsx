import React, { useState } from 'react';
import { 
  Bus, 
  MapPin,
  ShieldAlert, 
  Cpu, 
  Wrench, 
  Video, 
  Radio, 
  Sparkles, 
  PlusCircle,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  Bell
} from 'lucide-react';
import { ActiveLayer, RoadIssue, BusFleet, AppNotification } from '../types';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  activeLayer: ActiveLayer;
  setActiveLayer: (layer: ActiveLayer) => void;
  issues: RoadIssue[];
  busFleet: BusFleet[];
  onOpenUploadModal: () => void;
  onOpenSimulateModal: () => void;
  onOpenBusCameraModal: (busId?: string) => void;
  onOpenManualAddModal: () => void;
  currentTime: string;
  trackingTab?: 'PENDING' | 'IN_PROGRESS' | 'SOLVED';
  setTrackingTab?: (tab: 'PENDING' | 'IN_PROGRESS' | 'SOLVED') => void;
  notifications?: AppNotification[];
  onMarkAllNotificationsAsRead?: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeLayer,
  setActiveLayer,
  issues,
  busFleet,
  onOpenUploadModal,
  onOpenSimulateModal,
  onOpenBusCameraModal,
  onOpenManualAddModal,
  currentTime,
  trackingTab,
  setTrackingTab,
  notifications = [],
  onMarkAllNotificationsAsRead,
  onSelectNotification,
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isSolved = (s: string) => s === 'Solved' || s === 'SOLVED' || s === 'RESOLVED';
  const isFalsePositive = (i: RoadIssue) => i.verification === 'FALSE_POSITIVE' || i.verification === 'False Positive' || i.status === 'Closed' || i.status === 'CLOSED';
  const isPending = (s: string) => s === 'Pending' || s === 'PENDING';
  const isInProgress = (s: string) => s === 'In Progress' || s === 'IN_PROGRESS' || s === 'DISPATCHED';

  const criticalHighCount = issues.filter(
    (i) => (i.severity === 'HIGH' || i.priority === 'Critical') && !isSolved(i.status) && !isFalsePositive(i)
  ).length;
  const mediumCount = issues.filter(
    (i) => (i.severity === 'MEDIUM' || i.priority === 'Medium') && !isSolved(i.status) && !isFalsePositive(i)
  ).length;
  const pendingCount = issues.filter((i) => isPending(i.status) && !isFalsePositive(i)).length;
  const inProgressCount = issues.filter((i) => isInProgress(i.status) && !isFalsePositive(i)).length;
  const solvedCount = issues.filter((i) => isSolved(i.status) && !isFalsePositive(i)).length;
  const falsePositiveCount = issues.filter((i) => isFalsePositive(i)).length;
  const pendingVerificationCount = issues.filter(
    (i) => i.verification === 'Pending Verification' || i.verification === 'AI_DETECTED'
  ).length;
  const activeBuses = busFleet.filter((b) => b.cameraStatus === 'ACTIVE').length;

  return (
    <header className="select-none shrink-0 relative z-30">
      {/* 1. TOP CONTROL BAR */}
      <div className="bg-white/95 backdrop-blur-md border-b border-[#D5DEE8] px-4 py-2.5 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          
          {/* Left: Branding + Core System Telemetry */}
          <div className="flex items-center flex-wrap gap-3 sm:gap-4">
            {/* Brand Identity */}
            <div className="flex items-center gap-2.5">
              <div 
                className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-50 to-white border border-cyan-500/40 text-cyan-600 shadow-[0_0_15px_rgba(0,175,198,0.2)] shrink-0"
                title="UrbanSense"
                aria-label="UrbanSense Logo"
              >
                <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-600" />
                <Bus className="w-2.5 h-2.5 text-cyan-500 absolute -top-0.5" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-wider text-[#172033] uppercase font-mono select-none leading-none">
                  URBANSENSE
                </h1>
                <span className="text-[9px] font-mono text-[#7A8797] tracking-widest uppercase block mt-0.5">
                  Intelligent Transportation Network
                </span>
              </div>
            </div>

            <div className="hidden lg:block w-px h-6 bg-[#D5DEE8]" />

            {/* System Status Indicators beside branding */}
            <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
              {/* System Active Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/90 border border-emerald-500/40 text-emerald-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold tracking-wide text-[11px]">SYSTEM ACTIVE</span>
              </div>

              {/* AI Media Pipeline */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#D5DEE8] text-[#172033] shadow-2xs">
                <Cpu className="w-3.5 h-3.5 text-cyan-600" />
                <span className="text-[#526071] text-[11px]">AI Input:</span>
                <span className="text-cyan-700 font-semibold text-[11px]">Uploaded Video / Images (YOLOv8)</span>
              </div>

              {/* Active Fleet */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#D5DEE8] text-[#172033] shadow-2xs">
                <Bus className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[#526071] text-[11px]">Fleet Media:</span>
                <span className="text-amber-700 font-semibold text-[11px]">{busFleet.length} Corridors Synced</span>
              </div>
            </div>
          </div>

          {/* Right: Time Displayed Clearly + Grouped Actions */}
          <div className="flex items-center flex-wrap gap-2.5 justify-end">
            {/* Time Readout */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F8FAFC] border border-[#D5DEE8] text-[#526071] font-mono shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              <span className="text-[#172033] font-semibold text-xs">{currentTime}</span>
            </div>

            {/* Notification Bell with Unread Badge & Dropdown */}
            <div className="relative">
              <button
                id="btn-header-notifications"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`relative flex items-center justify-center p-2 rounded-md transition-all cursor-pointer shadow-2xs border ${
                  isNotificationOpen
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-[#D5DEE8] text-[#172033] hover:border-cyan-300'
                }`}
                title={`Notifications (${unreadCount} unread)`}
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4 text-cyan-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold shadow-xs">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
                    <span className="relative">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              <NotificationDropdown
                notifications={notifications}
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                onMarkAllAsRead={() => onMarkAllNotificationsAsRead?.()}
                onSelectNotification={(notif) => {
                  onSelectNotification?.(notif);
                  setIsNotificationOpen(false);
                }}
              />
            </div>

            {/* PRIMARY: Upload Road Video/Image Button */}
            <button
              id="btn-open-upload-interface"
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-[#00AFC6] via-[#00A2B8] to-[#0891B2] hover:from-[#009cb1] hover:to-[#0284c7] text-white shadow-[0_2px_12px_rgba(0,175,198,0.28)] transition-all cursor-pointer active:scale-95 border border-cyan-300/40"
              title="Upload road footage video/image to run AI detection"
            >
              <Upload className="w-3.5 h-3.5 text-white" />
              <span>Upload Road Video/Image</span>
            </button>

            {/* Recorded Footage HUD Playback */}
            <button
              id="btn-bus-camera-stream"
              onClick={() => onOpenBusCameraModal()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-cyan-700 border border-[#D5DEE8] hover:border-cyan-400 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Inspect pre-recorded dashcam playback & telemetry from fleet buses"
            >
              <Video className="w-3.5 h-3.5 text-cyan-600" />
              <span>Dashcam Playback</span>
            </button>

            {/* Simulate New Detection Event */}
            <button
              id="btn-simulate-ai-detection"
              onClick={onOpenSimulateModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-[#172033] border border-[#D5DEE8] hover:border-slate-300 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Quick-simulate pre-recorded packet injection"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Packet</span>
            </button>

            {/* Add Manual Issue (Authority Layer) */}
            <button
              id="btn-manual-authority-entry"
              onClick={onOpenManualAddModal}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-[#172033] border border-[#D5DEE8] hover:border-slate-300 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Log manual municipal inspection or road closure"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#526071]" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATUS NAVIGATION SUB-BAR (Clearly separated from header) */}
      <div className="bg-[#F8FAFC]/95 backdrop-blur-md border-b border-[#D5DEE8] px-4 py-1.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 shadow-2xs">
        
        {/* Left: Workflow Stages Selector */}
        <div className="flex items-center gap-1.5 bg-[#EEF2F6] p-0.5 rounded-lg border border-[#D5DEE8]">
          <button
            id="workflow-tab-ai"
            onClick={() => setActiveLayer('AI_LAYER')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeLayer === 'AI_LAYER'
                ? 'bg-white text-cyan-700 border border-cyan-400 shadow-xs font-semibold'
                : 'text-[#526071] hover:text-[#172033] hover:bg-white/60 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-600" />
            <span>AI Detection</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold">
              {issues.length}
            </span>
          </button>

          <button
            id="workflow-tab-authority"
            onClick={() => setActiveLayer('AUTHORITY_LAYER')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeLayer === 'AUTHORITY_LAYER'
                ? 'bg-white text-amber-700 border border-amber-400 shadow-xs font-semibold'
                : 'text-[#526071] hover:text-[#172033] hover:bg-white/60 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Authority &amp; Verification</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-50 border border-amber-200 text-amber-700 font-bold">
              {pendingVerificationCount} Pending
            </span>
          </button>

          <button
            id="workflow-tab-tracking"
            onClick={() => setActiveLayer('MAINTENANCE_LAYER')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeLayer === 'MAINTENANCE_LAYER'
                ? 'bg-white text-emerald-700 border border-emerald-400 shadow-xs font-semibold'
                : 'text-[#526071] hover:text-[#172033] hover:bg-white/60 border border-transparent'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>Problem Status Tracking</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
              {inProgressCount} Active
            </span>
          </button>
        </div>

        {/* Right: Existing Counters (Values & Functionality Preserved) */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono flex-wrap">
          {/* Critical / High */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50/90 border border-rose-200/90" title="Critical/High Severity Unresolved Problems">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-[#526071] text-[11px]">Critical / High:</span>
            <span className="text-rose-600 font-bold text-[11px]">{criticalHighCount}</span>
          </div>
          
          {/* Medium */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50/90 border border-amber-200/90" title="Medium Severity Unresolved Problems">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[#526071] text-[11px]">Medium:</span>
            <span className="text-amber-600 font-bold text-[11px]">{mediumCount}</span>
          </div>

          {/* Pending */}
          <div 
            onClick={() => {
              setActiveLayer('MAINTENANCE_LAYER');
              setTrackingTab?.('PENDING');
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50/70 border border-amber-200/70 cursor-pointer hover:bg-amber-100/70 transition-colors" 
            title="View problems with Pending status"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span className="text-[#526071] text-[11px]">Pending:</span>
            <span className="text-amber-700 font-semibold text-[11px]">{pendingCount}</span>
          </div>

          {/* In Progress */}
          <div 
            onClick={() => {
              setActiveLayer('MAINTENANCE_LAYER');
              setTrackingTab?.('IN_PROGRESS');
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-50/70 border border-cyan-200/70 cursor-pointer hover:bg-cyan-100/70 transition-colors" 
            title="View problems currently In Progress"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            <span className="text-[#526071] text-[11px]">In Progress:</span>
            <span className="text-cyan-700 font-semibold text-[11px]">{inProgressCount}</span>
          </div>

          {/* Repaired / Solved */}
          <div 
            onClick={() => {
              setActiveLayer('MAINTENANCE_LAYER');
              setTrackingTab?.('SOLVED');
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50/70 border border-emerald-200/70 cursor-pointer hover:bg-emerald-100/70 transition-colors" 
            title="View Solved and Repaired Problems"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[#526071] text-[11px]">Repaired / Solved:</span>
            <span className="text-emerald-700 font-semibold text-[11px]">{solvedCount}</span>
          </div>

          {/* False Positives */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/80 border border-slate-200" title="False Positives / Closed">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span className="text-[#526071] text-[11px]">False Positives:</span>
            <span className="text-slate-600 font-semibold text-[11px]">{falsePositiveCount}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
