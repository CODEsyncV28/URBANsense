import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  ExternalLink, 
  ShieldCheck, 
  Wrench, 
  Clock, 
  Camera, 
  Bus, 
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { RoadIssue, IssueType, Severity } from '../types';

interface LiveAlertPanelProps {
  issues: RoadIssue[];
  selectedIssue: RoadIssue | null;
  onSelectIssue: (issue: RoadIssue) => void;
  onOpenEvidence: (issue: RoadIssue) => void;
  filterType: IssueType | 'ALL';
  setFilterType: (type: IssueType | 'ALL') => void;
  filterSeverity: Severity | 'ALL';
  setFilterSeverity: (sev: Severity | 'ALL') => void;
  onOpenUploadModal: () => void;
  onOpenSimulateModal: () => void;
}

export const LiveAlertPanel: React.FC<LiveAlertPanelProps> = ({
  issues,
  selectedIssue,
  onSelectIssue,
  onOpenEvidence,
  filterType,
  setFilterType,
  filterSeverity,
  setFilterSeverity,
  onOpenUploadModal,
  onOpenSimulateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  // Filter issues based on criteria
  const filteredIssues = issues.filter((issue) => {
    if (filterType !== 'ALL' && issue.type !== filterType) return false;
    if (filterSeverity !== 'ALL' && issue.severity !== filterSeverity) return false;
    const isIssueResolved = issue.status === 'RESOLVED' || issue.status === 'Solved';
    if (statusFilter === 'ACTIVE' && isIssueResolved) return false;
    if (statusFilter === 'RESOLVED' && !isIssueResolved) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        issue.id.toLowerCase().includes(q) ||
        issue.title.toLowerCase().includes(q) ||
        issue.locationName.toLowerCase().includes(q) ||
        issue.busId.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getIssueIcon = (type: IssueType) => {
    switch (type) {
      case 'pothole':
        return '🕳️';
      case 'waterlogging':
        return '🌊';
      case 'road_damage':
        return '⚡';
      case 'accident':
        return '🚨';
      case 'construction':
        return '🚧';
      case 'road_closed':
        return '⛔';
      default:
        return '⚠️';
    }
  };

  const getSeverityBadgeClass = (severity: Severity, isResolved: boolean) => {
    if (isResolved) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs';
    }
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs animate-pulse';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
  };

  return (
    <aside className="w-full lg:w-96 xl:w-[420px] bg-white/95 backdrop-blur-md border-l border-[#D5DEE8] flex flex-col h-full overflow-hidden select-none shrink-0 z-20 shadow-xs">
      
      {/* Top Header of Alert Panel */}
      <div className="p-3 border-b border-[#D5DEE8] bg-[#F9FBFC]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></div>
            <h2 className="font-mono font-bold text-sm text-[#172033] tracking-wider uppercase flex items-center gap-2">
              <span>Detection Feed</span>
              <span className="px-1.5 py-0.2 rounded text-[11px] font-mono bg-cyan-50 text-cyan-700 border border-cyan-200">
                {filteredIssues.length}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-upload-footage-alert-panel"
              onClick={onOpenUploadModal}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-300 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Upload road footage (.mp4, .jpg) to run detection"
            >
              <span>📤 Upload Media</span>
            </button>
            <button
              id="btn-quick-simulate-feed"
              onClick={onOpenSimulateModal}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-xs font-mono bg-white hover:bg-slate-50 text-[#172033] border border-[#D5DEE8] transition-all cursor-pointer shadow-xs"
              title="Simulate media event injection"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
            </button>
          </div>
        </div>

        {/* Framing notice */}
        <p className="text-[10px] font-mono text-[#7A8797] mb-2">
          AI detects defects from pre-recorded footage • Predefined GPS synced
        </p>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A8797]" />
          <input
            id="input-alert-search"
            type="text"
            placeholder="Search location, Bus ID, or Hazard ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded bg-white border border-[#D5DEE8] text-xs font-mono text-[#172033] placeholder-[#7A8797] focus:outline-none focus:border-[#00AFC6] transition-colors shadow-2xs"
          />
        </div>

        {/* Issue Type Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-[#00AFC6] text-white font-bold shadow-2xs'
                : 'bg-white text-[#526071] hover:text-[#172033] border border-[#D5DEE8]'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setFilterType('pothole')}
            className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === 'pothole'
                ? 'bg-[#00AFC6] text-white font-bold shadow-2xs'
                : 'bg-white text-[#526071] hover:text-[#172033] border border-[#D5DEE8]'
            }`}
          >
            <span>🕳️</span>
            <span>Potholes</span>
          </button>
          <button
            onClick={() => setFilterType('waterlogging')}
            className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === 'waterlogging'
                ? 'bg-[#00AFC6] text-white font-bold shadow-2xs'
                : 'bg-white text-[#526071] hover:text-[#172033] border border-[#D5DEE8]'
            }`}
          >
            <span>🌊</span>
            <span>Waterlogging</span>
          </button>
          <button
            onClick={() => setFilterType('road_damage')}
            className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === 'road_damage'
                ? 'bg-[#00AFC6] text-white font-bold shadow-2xs'
                : 'bg-white text-[#526071] hover:text-[#172033] border border-[#D5DEE8]'
            }`}
          >
            <span>⚡</span>
            <span>Cracks</span>
          </button>
          <button
            onClick={() => setFilterType('accident')}
            className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === 'accident'
                ? 'bg-[#00AFC6] text-white font-bold shadow-2xs'
                : 'bg-white text-[#526071] hover:text-[#172033] border border-[#D5DEE8]'
            }`}
          >
            <span>🚨</span>
            <span>Accidents</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#526071] pt-1.5 border-t border-[#D5DEE8]">
          <span className="text-[#7A8797]">Status filter:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`cursor-pointer ${statusFilter === 'ALL' ? 'text-cyan-700 font-bold' : 'hover:text-[#172033]'}`}
            >
              All
            </button>
            <span>•</span>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`cursor-pointer ${statusFilter === 'ACTIVE' ? 'text-amber-600 font-bold' : 'hover:text-[#172033]'}`}
            >
              Active Only
            </button>
            <span>•</span>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`cursor-pointer ${statusFilter === 'RESOLVED' ? 'text-emerald-600 font-bold' : 'hover:text-[#172033]'}`}
            >
              Resolved
            </button>
          </div>
        </div>

      </div>

      {/* Feed List Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredIssues.length === 0 ? (
          <div className="p-8 text-center text-[#7A8797] font-mono text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p>No detection alerts matching filter criteria.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isSelected = selectedIssue?.id === issue.id;
            const isResolved = issue.status === 'RESOLVED' || issue.status === 'Solved';
            const isVerified = issue.verification === 'VERIFIED' || issue.verification === 'Verified';
            const isRejected = issue.verification === 'Rejected' || issue.status === 'Rejected';

            return (
              <div
                key={issue.id}
                id={`alert-card-${issue.id}`}
                onClick={() => onSelectIssue(issue)}
                className={`p-3 rounded-lg border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-cyan-50/70 border-[#00AFC6] shadow-sm ring-1 ring-[#00AFC6]/50'
                    : 'bg-white hover:bg-[#F9FBFC] border-[#D5DEE8] hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Top Row: Icon + ID + Severity + Confidence */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getIssueIcon(issue.type)}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-cyan-700">
                          {issue.id}
                        </span>
                        {isVerified && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>VERIFIED</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-0.5">
                            <span>REJECTED</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#526071] capitalize">
                        {issue.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Severity Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getSeverityBadgeClass(
                        issue.severity,
                        isResolved
                      )}`}
                    >
                      {isResolved ? 'RESOLVED' : isRejected ? 'REJECTED' : `${issue.severity}`}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-700 font-semibold">
                      🤖 {issue.confidence}%
                    </span>
                  </div>
                </div>

                {/* Title & Location */}
                <h3 className="text-xs font-semibold text-[#172033] line-clamp-1 mb-1">
                  {issue.title}
                </h3>
                <p className="text-[11px] text-[#526071] flex items-center gap-1 mb-1.5 line-clamp-1">
                  <span>📍</span>
                  <span>{issue.locationName}</span>
                </p>

                {/* Video Timestamp / Source Media Tag */}
                <div className="flex items-center gap-1.5 mb-2 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-700">
                    ⏱️ {issue.videoTimestamp || (issue.sourceMedia ? `at ${issue.sourceMedia.videoTimestamp}` : '00:14 in clip')}
                  </span>
                  {issue.sourceMedia && (
                    <span className="px-1.5 py-0.5 rounded bg-[#EEF2F6] border border-[#D5DEE8] text-[#526071] truncate max-w-[170px]" title={issue.sourceMedia.fileName}>
                      📁 {issue.sourceMedia.fileName}
                    </span>
                  )}
                </div>

                {/* Bus Detection Telemetry & Time Row */}
                <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded bg-[#F4F7FA] border border-[#D5DEE8] text-[10px] font-mono mb-2">
                  <div className="flex items-center gap-1 text-[#172033]">
                    <Bus className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="text-[#526071]">Bus:</span>
                    <span className="text-amber-700 font-bold truncate">{issue.busId}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#526071] justify-end">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[#526071] truncate">{issue.timestamp.split(' ')[1] || issue.timestamp}</span>
                  </div>
                  <div className="text-[#526071] truncate">
                    Z-Bump: <span className="text-rose-600 font-bold">{issue.telemetry.zVibrationG}G</span>
                  </div>
                  <div className="text-[#526071] truncate text-right">
                    Speed: <span className="text-[#172033] font-medium">{issue.telemetry.speedKmh} km/h</span>
                  </div>
                </div>

                {/* Actions Row: [ View Evidence ] + Dispatch Status */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#D5DEE8]">
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <span className="text-[#7A8797]">Status:</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-semibold ${
                        isResolved
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : isRejected
                          ? 'text-rose-700 bg-rose-50 border border-rose-200'
                          : issue.status === 'In Progress' || issue.status === 'IN_PROGRESS'
                          ? 'text-cyan-700 bg-cyan-50 border border-cyan-200'
                          : issue.assignedAuthority || issue.status === 'DISPATCHED'
                          ? 'text-amber-700 bg-amber-50 border border-amber-200'
                          : 'text-[#526071] bg-[#EEF2F6] border border-[#D5DEE8]'
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>

                  <button
                    id={`btn-view-evidence-${issue.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEvidence(issue);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-50 hover:bg-[#00AFC6] text-cyan-700 hover:text-white border border-cyan-300 hover:border-cyan-500 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Camera className="w-3 h-3" />
                    <span>View Evidence</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Alert Feed Footer Summary */}
      <div className="p-2.5 bg-[#F9FBFC] border-t border-[#D5DEE8] text-[10px] font-mono text-[#526071] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
          <span>Feed: Pre-Recorded Footage • Timeline GPS Synced</span>
        </span>
        <span className="text-[#7A8797]">BEL SIH26124</span>
      </div>

    </aside>
  );
};
