import React, { useState } from 'react';
import { 
  Filter, 
  Activity, 
  Radio, 
  Crosshair, 
  AlertTriangle, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { RoadIssue, BusFleet, IssueType, Severity } from '../types';
import { TransitNetworkBackground } from './TransitNetworkBackground';

interface CityMapProps {
  issues: RoadIssue[];
  busFleet: BusFleet[];
  selectedIssue: RoadIssue | null;
  onSelectIssue: (issue: RoadIssue) => void;
  onSelectBus: (bus: BusFleet) => void;
  filterType: IssueType | 'ALL';
  setFilterType: (type: IssueType | 'ALL') => void;
  filterSeverity: Severity | 'ALL';
  setFilterSeverity: (sev: Severity | 'ALL') => void;
}

export const CityMap: React.FC<CityMapProps> = ({
  issues,
  busFleet,
  selectedIssue,
  onSelectIssue,
  onSelectBus,
  filterSeverity,
  setFilterSeverity,
}) => {
  const [showLegend, setShowLegend] = useState(true);

  const activeIssues = issues.filter((i) => i.status !== 'Solved' && i.status !== 'Rejected');
  const highHazards = activeIssues.filter((i) => i.severity === 'HIGH');
  const mediumHazards = activeIssues.filter((i) => i.severity === 'MEDIUM');

  return (
    <div className="relative w-full h-full flex flex-col bg-[#F4F7FA] overflow-hidden select-none">
      
      {/* 0. Live Interactive AI Transit System Visualization Canvas Layer */}
      <TransitNetworkBackground
        issues={issues}
        busFleet={busFleet}
        onSelectIssue={onSelectIssue}
        onSelectBus={onSelectBus}
        filterSeverity={filterSeverity}
        selectedIssue={selectedIssue}
      />

      {/* Floating Top Control Bar (Left) - Non-map Telemetry HUD */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 px-2.5 rounded-lg border border-[#D5DEE8] shadow-md pointer-events-auto">
        <div className="flex items-center gap-2 pr-2 border-r border-[#D5DEE8] text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
          <span className="text-cyan-700 font-bold tracking-wider">AI SYSTEM VISUALIZATION</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-[#526071]">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Smart-City Transit Grid</span>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Telemetry Active</span>
          </span>
        </div>
      </div>

      {/* Floating Filter Badges (Top-Right) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-lg border border-[#D5DEE8] shadow-md flex items-center gap-1.5 text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#7A8797] text-[11px]">Severity:</span>
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                filterSeverity === sev
                  ? sev === 'HIGH'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : sev === 'MEDIUM'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : sev === 'LOW'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-[#00AFC6] text-white font-bold'
                  : 'text-[#526071] hover:text-[#172033]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Anomaly Inspector Callout (if an issue is selected in feed or workflow) */}
      {selectedIssue && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 max-w-md w-[92%] sm:w-auto bg-white/95 backdrop-blur-md border border-[#00AFC6] rounded-lg p-3 shadow-xl pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                selectedIssue.severity === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-300' :
                selectedIssue.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-300' :
                'bg-cyan-50 text-cyan-700 border border-cyan-300'
              }`}>
                {selectedIssue.severity} HAZARD
              </span>
              <span className="text-xs font-mono text-cyan-700 font-semibold">{selectedIssue.id}</span>
            </div>
            <button
              onClick={() => onSelectIssue(selectedIssue)}
              className="text-xs font-mono text-cyan-700 hover:text-cyan-900 cursor-pointer"
            >
              [Inspect Evidence]
            </button>
          </div>
          <p className="text-xs text-[#172033] font-medium line-clamp-1 mb-1">{selectedIssue.title}</p>
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#526071]">
            <span className="truncate">{selectedIssue.locationName}</span>
            <span className="text-cyan-700 shrink-0">{(selectedIssue.confidence * 100).toFixed(0)}% Conf</span>
          </div>
        </div>
      )}

      {/* Subtle Corner Telemetry Grids (Control Room Ambient Details) */}
      <div className="absolute top-14 left-4 z-0 pointer-events-none hidden sm:block opacity-40">
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-600">
          <Crosshair className="w-3 h-3 text-cyan-500" />
          <span>SYS.SEC // 04-TRANSIT</span>
        </div>
      </div>

      <div className="absolute bottom-16 right-4 z-0 pointer-events-none hidden sm:block opacity-35">
        <div className="text-right text-[9px] font-mono text-[#7A8797] leading-tight">
          <div>LOC.STREAM // DECORATIVE_BG</div>
          <div>RES // 60FPS_VECTOR_CANVAS</div>
        </div>
      </div>

      {/* Floating Bottom Legend & Telemetry Status */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md p-2.5 rounded-lg border border-[#D5DEE8] shadow-xl max-w-xs hidden md:block pointer-events-auto">
          <div className="flex items-center justify-between gap-4 border-b border-[#D5DEE8] pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              <span className="font-mono text-[11px] font-bold text-[#172033]">TRANSIT NETWORK TELEMETRY</span>
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="text-[10px] text-[#7A8797] hover:text-[#172033] font-mono cursor-pointer"
            >
              [Hide]
            </button>
          </div>

          {/* Priority Marker Legend */}
          <div className="space-y-1 pb-2 mb-2 border-b border-[#D5DEE8] text-[10px] font-mono">
            <div className="text-[9px] uppercase tracking-wider font-bold text-[#7A8797]">Problem Priority</div>
            <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs"></span>
              <span>● RED — Critical / High</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs"></span>
              <span>● ORANGE — Medium / Pending</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs"></span>
              <span>● GREEN — Solved / Repaired</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono text-[#526071]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#526071]">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>Critical Hazards:</span>
              </span>
              <span className="text-rose-600 font-bold">{highHazards.length} Detected</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#526071]">
                <Activity className="w-3 h-3 text-amber-500" />
                <span>Medium Hazards:</span>
              </span>
              <span className="text-amber-600 font-bold">{mediumHazards.length} Detected</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#526071]">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Transit Fleet Units:</span>
              </span>
              <span className="text-cyan-700 font-bold">{busFleet.length} Active Units</span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-[#D5DEE8] text-[10px] text-[#7A8797] font-mono flex items-center justify-between">
            <span>AI Visualization Layer</span>
            <span className="text-cyan-700 font-semibold">{issues.length} Total Telemetry Records</span>
          </div>
        </div>
      )}

      {/* Re-open legend button if hidden */}
      {!showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          className="absolute bottom-3 left-3 z-10 bg-white/95 px-2 py-1 rounded text-xs font-mono text-cyan-700 border border-[#D5DEE8] shadow-md pointer-events-auto cursor-pointer"
        >
          [Show Telemetry]
        </button>
      )}

    </div>
  );
};
