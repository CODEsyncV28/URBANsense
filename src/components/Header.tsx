import React from 'react';
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
  Upload
} from 'lucide-react';
import { ActiveLayer, RoadIssue, BusFleet } from '../types';

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
}) => {
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
    <header className="bg-white/95 backdrop-blur-md border-b border-[#D5DEE8] px-4 py-2.5 select-none shrink-0 shadow-xs relative z-30">
      {/* Top Bar: Identity & Realtime System Telemetry */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5">
          {/* UrbanSense Icon: Map Pin + Bus Transport + Urban Sensing */}
          <div 
            className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-50 border border-cyan-500/40 text-cyan-600 shadow-[0_0_12px_rgba(0,175,198,0.15)] shrink-0"
            title="UrbanSense"
            aria-label="UrbanSense Logo"
          >
            <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-600" />
            <Bus className="w-2.5 h-2.5 text-cyan-500 absolute -top-0.5" />
            {/* Sensing pulse */}
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold tracking-wider text-[#172033] uppercase font-mono select-none">
            URBANSENSE
          </h1>
        </div>

        {/* Center: System Status & Telemetry Indicators */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {/* System Online Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-500/30 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold tracking-wide">SYSTEM ACTIVE</span>
          </div>

          {/* AI Media Pipeline */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EEF2F6] border border-[#D5DEE8] text-[#172033]">
            <Cpu className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-[#526071]">AI Input:</span>
            <span className="text-cyan-700 font-semibold">Uploaded Video / Images (YOLOv8)</span>
          </div>

          {/* Active Fleet */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EEF2F6] border border-[#D5DEE8] text-[#172033]">
            <Bus className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[#526071]">Fleet Media:</span>
            <span className="text-amber-700 font-semibold">{busFleet.length} Corridors Synced</span>
          </div>

          {/* Time Readout */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EEF2F6] border border-[#D5DEE8] text-[#526071]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#172033] font-medium">{currentTime}</span>
          </div>
        </div>

        {/* Right: Quick Command Actions */}
        <div className="flex items-center gap-2">
          {/* PRIMARY: Upload Road Video/Image Button */}
          <button
            id="btn-open-upload-interface"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-[#00AFC6] hover:bg-[#0098ad] text-white shadow-sm transition-all cursor-pointer active:scale-95 border border-cyan-400/50"
            title="Upload road footage video/image to run AI detection"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Upload Road Video/Image</span>
          </button>

          {/* Recorded Footage HUD Playback */}
          <button
            id="btn-bus-camera-stream"
            onClick={() => onOpenBusCameraModal()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-white hover:bg-slate-50 text-cyan-700 border border-[#D5DEE8] hover:border-cyan-400 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Inspect pre-recorded dashcam playback & telemetry from fleet buses"
          >
            <Video className="w-3.5 h-3.5 text-cyan-600" />
            <span>Dashcam Playback</span>
          </button>

          {/* Simulate New Detection Event */}
          <button
            id="btn-simulate-ai-detection"
            onClick={onOpenSimulateModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-white hover:bg-slate-50 text-[#172033] border border-[#D5DEE8] hover:border-slate-300 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Quick-simulate pre-recorded packet injection"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulate Packet</span>
          </button>

          {/* Add Manual Issue (Authority Layer) */}
          <button
            id="btn-manual-authority-entry"
            onClick={onOpenManualAddModal}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-white hover:bg-slate-50 text-[#172033] border border-[#D5DEE8] hover:border-slate-300 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Log manual municipal inspection or road closure"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#526071]" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar: The 3 Core Functional Layers Bar & Live Anomaly Tally */}
      <div className="mt-2.5 pt-2 border-t border-[#D5DEE8] flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        
        {/* Workflow Stages Selector */}
        <div className="flex items-center gap-1.5 bg-[#EEF2F6] p-0.5 rounded-lg border border-[#D5DEE8]">
          <button
            id="workflow-tab-ai"
            onClick={() => setActiveLayer('AI_LAYER')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              activeLayer === 'AI_LAYER'
                ? 'bg-white text-cyan-700 border border-cyan-400 shadow-xs font-semibold'
                : 'text-[#526071] hover:text-[#172033] hover:bg-white/60 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-600" />
            <span>AI Detection</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-50 border border-cyan-200 text-cyan-700">
              {issues.length}
            </span>
          </button>

          <button
            id="workflow-tab-authority"
            onClick={() => setActiveLayer('AUTHORITY_LAYER')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              activeLayer === 'AUTHORITY_LAYER'
                ? 'bg-white text-amber-700 border border-amber-400 shadow-xs font-semibold'
                : 'text-[#526071] hover:text-[#172033] hover:bg-white/60 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Authority &amp; Verification</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-50 border border-amber-200 text-amber-700">
              {pendingVerificationCount} Pending
            </span>
          </button>

          <button
            id="workflow-tab-tracking"
            onClick={() => setActiveLayer('MAINTENANCE_LAYER')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              activeLayer === 'MAINTENANCE_LAYER'
                ? 'bg-white text-emerald-700 border border-emerald-400 shadow-xs font-semibold'
                : 'text-[#526071] hover:text-[#172033] hover:bg-white/60 border border-transparent'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>Problem Status Tracking</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700">
              {inProgressCount} Active
            </span>
          </button>
        </div>

        {/* Dynamic Workflow Anomaly & Status Tally */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono flex-wrap">
          <div className="flex items-center gap-1.5" title="Critical/High Severity Unresolved Problems">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-[#526071]">Critical / High:</span>
            <span className="text-rose-600 font-bold">{criticalHighCount}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5" title="Medium Severity Unresolved Problems">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[#526071]">Medium:</span>
            <span className="text-amber-600 font-bold">{mediumCount}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div 
            onClick={() => {
              setActiveLayer('MAINTENANCE_LAYER');
              setTrackingTab?.('PENDING');
            }}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" 
            title="View problems with Pending status"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[#526071]">Pending:</span>
            <span className="text-amber-600 font-semibold">{pendingCount}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div 
            onClick={() => {
              setActiveLayer('MAINTENANCE_LAYER');
              setTrackingTab?.('IN_PROGRESS');
            }}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" 
            title="View problems currently In Progress"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span className="text-[#526071]">In Progress:</span>
            <span className="text-cyan-700 font-semibold">{inProgressCount}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div 
            onClick={() => {
              setActiveLayer('MAINTENANCE_LAYER');
              setTrackingTab?.('SOLVED');
            }}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" 
            title="View Solved and Repaired Problems"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[#526071]">Repaired / Solved:</span>
            <span className="text-emerald-600 font-semibold">{solvedCount}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5" title="False Positives / Closed">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-[#526071]">False Positives:</span>
            <span className="text-slate-600 font-semibold">{falsePositiveCount}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
