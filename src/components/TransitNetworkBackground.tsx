import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Bus as BusIcon, 
  X, 
  Gauge, 
  Users, 
  Camera, 
  ChevronRight
} from 'lucide-react';
import { RoadIssue, BusFleet, Severity } from '../types';
import { WORLD_WIDTH, WORLD_HEIGHT, TransitBusData, ProblemMarker } from './transitMapWorld';
import { getCityWorldData } from './cityWorldGeometry';
import { renderTransitMap, getIssueMarkerType, ClickRipple } from './transitMapRenderer';

export interface TransitNetworkBackgroundProps {
  issues?: RoadIssue[];
  busFleet?: BusFleet[];
  onSelectIssue?: (issue: RoadIssue) => void;
  onSelectBus?: (bus: BusFleet) => void;
  filterSeverity?: Severity | 'ALL';
  selectedIssue?: RoadIssue | null;
  className?: string;
}

export const TransitNetworkBackground: React.FC<TransitNetworkBackgroundProps> = ({
  issues = [],
  busFleet = [],
  onSelectIssue,
  onSelectBus,
  filterSeverity = 'ALL',
  selectedIssue,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera state for 2D pan & zoom across the simulated city
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const cameraRef = useRef<{ x: number; y: number; zoom: number }>({ x: 0, y: 0, zoom: 1.0 });
  const hasInitializedCameraRef = useRef<boolean>(false);

  // Hover states for tooltips
  const [hoveredMarker, setHoveredMarker] = useState<{
    markerId: string;
    markerType: 'CRITICAL' | 'MEDIUM' | 'SOLVED';
    problem: RoadIssue | null;
    roadLabel: string;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [hoveredBus, setHoveredBus] = useState<{
    bus: TransitBusData;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Active clicked bus inspector card
  const [activeBusCard, setActiveBusCard] = useState<TransitBusData | null>(null);

  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 800,
  });

  // Mutable refs for animation loop
  const issuesRef = useRef<RoadIssue[]>(issues);
  const busFleetRef = useRef<BusFleet[]>(busFleet);
  const onSelectIssueRef = useRef(onSelectIssue);
  const onSelectBusRef = useRef(onSelectBus);
  const filterSeverityRef = useRef(filterSeverity);

  const hoveredMarkerIdRef = useRef<string | null>(null);
  const hoveredBusIdRef = useRef<string | null>(null);
  const currentMarkersRef = useRef<ProblemMarker[]>([]);
  const currentBusesRef = useRef<TransitBusData[]>([]);
  const busPositionsRef = useRef<Map<string, { worldX: number; worldY: number; screenX: number; screenY: number; angle: number }>>(new Map());
  const clickRipplesRef = useRef<ClickRipple[]>([]);

  // Dragging state for Panning
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  useEffect(() => {
    issuesRef.current = issues;
  }, [issues]);

  useEffect(() => {
    busFleetRef.current = busFleet;
  }, [busFleet]);

  useEffect(() => {
    onSelectIssueRef.current = onSelectIssue;
  }, [onSelectIssue]);

  useEffect(() => {
    onSelectBusRef.current = onSelectBus;
  }, [onSelectBus]);

  useEffect(() => {
    filterSeverityRef.current = filterSeverity;
  }, [filterSeverity]);

  // Soft clamp camera to keep the city in view
  const clampCamera = useCallback((cam: { x: number; y: number; zoom: number }, width: number, height: number) => {
    const minVisibleX = 200;
    const minVisibleY = 150;
    const minX = -WORLD_WIDTH * cam.zoom + minVisibleX;
    const maxX = width - minVisibleX;
    const minY = -WORLD_HEIGHT * cam.zoom + minVisibleY;
    const maxY = height - minVisibleY;

    cam.x = Math.max(minX, Math.min(maxX, cam.x));
    cam.y = Math.max(minY, Math.min(maxY, cam.y));
  }, []);

  // Recenter Camera handler: Center on Grand Suspension Bridge & Central Hub (world: 1800, 1000)
  const handleRecenter = useCallback(() => {
    const width = canvasDimensions.width;
    const height = canvasDimensions.height;
    const targetZoom = 1.0;
    const newCamera = {
      x: width / 2 - 1800 * targetZoom,
      y: height / 2 - 1000 * targetZoom,
      zoom: targetZoom,
    };
    clampCamera(newCamera, width, height);
    cameraRef.current = newCamera;
    setZoomLevel(targetZoom);
  }, [canvasDimensions, clampCamera]);

  // Pan to a specific world location
  const handlePanToWorld = useCallback((worldX: number, worldY: number, targetZoom?: number) => {
    const width = canvasDimensions.width;
    const height = canvasDimensions.height;
    const z = targetZoom || cameraRef.current.zoom;
    const newCamera = {
      x: width / 2 - worldX * z,
      y: height / 2 - worldY * z,
      zoom: z,
    };
    clampCamera(newCamera, width, height);
    cameraRef.current = newCamera;
    setZoomLevel(z);
  }, [canvasDimensions, clampCamera]);

  // Zoom In / Out handlers (centered on viewport center)
  const handleZoom = useCallback((delta: number) => {
    const width = canvasDimensions.width;
    const height = canvasDimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const currentZoom = cameraRef.current.zoom;
    const newZoom = Math.max(0.65, Math.min(1.85, currentZoom + delta));

    const worldX = (centerX - cameraRef.current.x) / currentZoom;
    const worldY = (centerY - cameraRef.current.y) / currentZoom;

    const newCamera = {
      x: centerX - worldX * newZoom,
      y: centerY - worldY * newZoom,
      zoom: newZoom,
    };
    clampCamera(newCamera, width, height);
    cameraRef.current = newCamera;
    setZoomLevel(newZoom);
  }, [canvasDimensions, clampCamera]);

  // Center on selected issue if passed from external feed
  useEffect(() => {
    if (!selectedIssue) return;
    const markers = currentMarkersRef.current;
    const target = markers.find((m) => m.problemId === selectedIssue.id);
    if (target) {
      handlePanToWorld(target.x, target.y, 1.25);
    }
  }, [selectedIssue, handlePanToWorld]);

  // Main Canvas Setup and Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 1200;
    let height = 800;

    // Load city world geometry
    const worldData = getCityWorldData(issuesRef.current);
    currentMarkersRef.current = worldData.problemMarkers;
    currentBusesRef.current = worldData.transitBuses;

    const updateSize = () => {
      const cont = containerRef.current;
      if (!canvas || !cont) return;

      const rect = cont.getBoundingClientRect();
      const newW = Math.max(300, Math.floor(rect.width) || window.innerWidth);
      const newH = Math.max(300, Math.floor(rect.height) || window.innerHeight);

      width = canvas.width = newW;
      height = canvas.height = newH;
      setCanvasDimensions({ width: newW, height: newH });

      // First time camera setup: Center on Central Hub & Grand Bridge (1800, 1000)
      if (!hasInitializedCameraRef.current) {
        const initCamera = {
          x: newW / 2 - 1800 * 1.0,
          y: newH / 2 - 1000 * 1.0,
          zoom: 1.0,
        };
        clampCamera(initCamera, newW, newH);
        cameraRef.current = initCamera;
        setZoomLevel(1.0);
        hasInitializedCameraRef.current = true;
      }
    };

    updateSize();

    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(container);
    window.addEventListener('resize', updateSize);

    let frame = 0;

    const render = () => {
      frame++;

      renderTransitMap(
        ctx,
        width,
        height,
        cameraRef.current,
        frame,
        worldData.routes,
        worldData.bridges,
        worldData.cityBlocks,
        worldData.junctionNodes,
        worldData.transitBuses,
        worldData.civilianVehicles,
        worldData.movingTelemetry,
        worldData.problemMarkers,
        issuesRef.current,
        filterSeverityRef.current,
        hoveredMarkerIdRef.current,
        hoveredBusIdRef.current,
        activeBusCard?.id || null,
        clickRipplesRef.current,
        busPositionsRef.current
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Wheel event listener for smooth zooming centered at mouse pointer
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const currentZoom = cameraRef.current.zoom;
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.max(0.65, Math.min(1.85, currentZoom * zoomFactor));

      const worldX = (mx - cameraRef.current.x) / currentZoom;
      const worldY = (my - cameraRef.current.y) / currentZoom;

      const newCamera = {
        x: mx - worldX * newZoom,
        y: my - worldY * newZoom,
        zoom: newZoom,
      };
      clampCamera(newCamera, width, height);
      cameraRef.current = newCamera;
      setZoomLevel(newZoom);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('wheel', handleWheel);
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [activeBusCard, clampCamera]);

  // Trigger ripple effect on click
  const addRipple = (x: number, y: number, type: 'CRITICAL' | 'MEDIUM' | 'SOLVED') => {
    const color =
      type === 'CRITICAL'
        ? 'rgba(239, 68, 68, ALPHA)'
        : type === 'MEDIUM'
        ? 'rgba(245, 158, 11, ALPHA)'
        : 'rgba(16, 185, 129, ALPHA)';

    clickRipplesRef.current.push({
      x,
      y,
      radius: 12,
      maxRadius: 45,
      color,
      alpha: 0.85,
      startTime: performance.now(),
    });
  };

  // Mouse Down for Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
  };

  // Mouse Move: Pan or Hover Detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle Pan Dragging
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        hasMovedRef.current = true;
      }
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
      clampCamera(cameraRef.current, canvasDimensions.width, canvasDimensions.height);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
      setHoveredMarker(null);
      setHoveredBus(null);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const camera = cameraRef.current;

    // 1. Check Bus Hover
    const buses = currentBusesRef.current;
    const busMap = busPositionsRef.current;
    let foundBus: TransitBusData | null = null;
    let busScreenPos = { x: 0, y: 0 };

    for (const b of buses) {
      const bPos = busMap.get(b.id);
      if (bPos) {
        const dist = Math.hypot(mx - bPos.screenX, my - bPos.screenY);
        if (dist <= 24) {
          foundBus = b;
          busScreenPos = { x: bPos.screenX, y: bPos.screenY };
          break;
        }
      }
    }

    if (foundBus) {
      canvas.style.cursor = 'pointer';
      hoveredBusIdRef.current = foundBus.id;
      hoveredMarkerIdRef.current = null;
      setHoveredMarker(null);
      setHoveredBus({
        bus: foundBus,
        screenX: busScreenPos.x,
        screenY: busScreenPos.y,
      });
      return;
    }

    hoveredBusIdRef.current = null;
    setHoveredBus(null);

    // 2. Check Problem Marker Hover
    const markers = currentMarkersRef.current;
    let foundMarker: ProblemMarker | null = null;
    let markerScreenPos = { x: 0, y: 0 };

    for (const marker of markers) {
      const screenX = marker.x * camera.zoom + camera.x;
      const screenY = marker.y * camera.zoom + camera.y;
      const dist = Math.hypot(mx - screenX, my - screenY);
      if (dist <= 24) {
        foundMarker = marker;
        markerScreenPos = { x: screenX, y: screenY };
        break;
      }
    }

    if (foundMarker) {
      canvas.style.cursor = 'pointer';
      hoveredMarkerIdRef.current = foundMarker.id;

      const currentIssues = issuesRef.current;
      const realProb = currentIssues.find((i) => i.id === foundMarker!.problemId) || null;
      const markerType = realProb ? getIssueMarkerType(realProb) : foundMarker.type;

      setHoveredMarker({
        markerId: foundMarker.id,
        markerType,
        problem: realProb,
        roadLabel: foundMarker.roadLabel,
        screenX: markerScreenPos.x,
        screenY: markerScreenPos.y,
      });
    } else {
      canvas.style.cursor = 'grab';
      hoveredMarkerIdRef.current = null;
      setHoveredMarker(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && !hoveredMarkerIdRef.current && !hoveredBusIdRef.current) {
      canvas.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = 'default';
    hoveredMarkerIdRef.current = null;
    hoveredBusIdRef.current = null;
    setHoveredMarker(null);
    setHoveredBus(null);
  };

  // Interactive Click Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hasMovedRef.current) {
      return; // Was dragging, don't trigger click action
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const camera = cameraRef.current;

    // 1. Bus Click
    const buses = currentBusesRef.current;
    const busMap = busPositionsRef.current;
    for (const b of buses) {
      const bPos = busMap.get(b.id);
      if (bPos) {
        const dist = Math.hypot(mx - bPos.screenX, my - bPos.screenY);
        if (dist <= 26) {
          setActiveBusCard(b);
          addRipple(bPos.worldX, bPos.worldY, 'MEDIUM');
          return;
        }
      }
    }

    // 2. Problem Marker Click
    const markers = currentMarkersRef.current;
    for (const marker of markers) {
      const screenX = marker.x * camera.zoom + camera.x;
      const screenY = marker.y * camera.zoom + camera.y;
      const dist = Math.hypot(mx - screenX, my - screenY);
      if (dist <= 26) {
        const currentIssues = issuesRef.current;
        const realProb = currentIssues.find((i) => i.id === marker.problemId) || currentIssues[0];
        const currentType = realProb ? getIssueMarkerType(realProb) : marker.type;

        addRipple(marker.x, marker.y, currentType);

        if (onSelectIssueRef.current && realProb) {
          onSelectIssueRef.current(realProb);
        }
        return;
      }
    }

    if (activeBusCard) {
      setActiveBusCard(null);
    }
  };

  const handleInspectBusHUD = (bus: TransitBusData) => {
    if (onSelectBusRef.current) {
      const fleets = busFleetRef.current;
      const matched = fleets.find((f) => f.id === bus.id) || fleets[0];
      if (matched) {
        onSelectBusRef.current(matched);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      id="roadvision-transit-visualization-container"
      className={`absolute inset-0 w-full h-full overflow-hidden select-none bg-[#F8FAFC] ${className}`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-grab active:cursor-grabbing pointer-events-auto"
      />

      {/* Floating Navigation Controls (Zoom In, Zoom Out, Recenter) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-[#D5DEE8] shadow-xl pointer-events-auto">
        <button
          onClick={() => handleZoom(0.20)}
          title="Zoom In"
          aria-label="Zoom In"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.20)}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-slate-200 my-0.5" />
        <button
          onClick={handleRecenter}
          title="Recenter Map"
          aria-label="Recenter Map"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-slate-500 font-bold px-0.5">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      {/* Problem Marker Hover Tooltip */}
      {hoveredMarker && (
        <div
          className="absolute pointer-events-none z-30 transition-all duration-75 ease-out animate-in fade-in zoom-in-95"
          style={{
            left: `${Math.max(100, Math.min(canvasDimensions.width - 100, hoveredMarker.screenX))}px`,
            top: `${Math.max(70, hoveredMarker.screenY - 16)}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-white/95 backdrop-blur-md border border-[#D5DEE8] rounded-xl shadow-2xl px-3 py-2 text-left min-w-[160px] max-w-[230px] select-none">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border ${
                  hoveredMarker.markerType === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : hoveredMarker.markerType === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                }`}
              >
                {hoveredMarker.markerType}
              </span>
              <span className="text-[10px] font-mono text-cyan-700 font-bold">
                {hoveredMarker.problem?.confidence ? `${Math.round(hoveredMarker.problem.confidence * 100)}%` : '96%'}
              </span>
            </div>

            <div className="font-mono font-bold text-xs text-[#172033] tracking-wide">
              {hoveredMarker.problem?.id || hoveredMarker.markerId}
            </div>

            <div className="text-[11px] font-medium text-[#526071] capitalize truncate">
              {hoveredMarker.problem?.type ? hoveredMarker.problem.type.replace('_', ' ') : 'Road Anomaly'}
            </div>

            <div className="text-[10px] text-[#7A8797] font-mono truncate mt-0.5">
              {hoveredMarker.roadLabel || hoveredMarker.problem?.locationName?.split(',')[0]}
            </div>

            <div className="mt-1.5 pt-1 border-t border-[#EEF2F6] flex items-center justify-between text-[9px] font-mono text-cyan-700 font-semibold">
              <span>Click to inspect details</span>
              <span>&rarr;</span>
            </div>
          </div>
        </div>
      )}

      {/* Bus Hover Tooltip */}
      {hoveredBus && !activeBusCard && (
        <div
          className="absolute pointer-events-none z-30 transition-all duration-75 ease-out animate-in fade-in zoom-in-95"
          style={{
            left: `${Math.max(100, Math.min(canvasDimensions.width - 100, hoveredBus.screenX))}px`,
            top: `${Math.max(70, hoveredBus.screenY - 16)}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-slate-900/90 text-white backdrop-blur-md border border-cyan-500/60 rounded-xl shadow-2xl px-3 py-2 text-left min-w-[140px] select-none">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-xs text-cyan-400">
                {hoveredBus.bus.label}
              </span>
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{hoveredBus.bus.status}</span>
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-300 mt-0.5 truncate">
              {hoveredBus.bus.routeName.split('(')[0]}
            </div>
            <div className="text-[10px] font-mono text-cyan-300 font-semibold mt-1 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>{hoveredBus.bus.displaySpeed} km/h</span>
            </div>
            <div className="mt-1 pt-1 border-t border-slate-700/80 text-[8.5px] font-mono text-slate-400 text-center">
              Click to inspect bus telemetry
            </div>
          </div>
        </div>
      )}

      {/* Active Bus Card */}
      {activeBusCard && (
        <div className="absolute top-16 right-4 z-30 w-72 max-w-[92vw] bg-white/95 backdrop-blur-md border border-cyan-500/80 rounded-xl shadow-2xl p-3.5 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-300 flex items-center justify-center text-cyan-700">
                <BusIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-sm text-[#172033]">{activeBusCard.id}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    LIVE GPS
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate max-w-[170px]">
                  {activeBusCard.routeName}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveBusCard(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-mono">
            <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Speed</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-600" />
                {activeBusCard.displaySpeed} km/h
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-1.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Occupancy</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                {activeBusCard.occupancy}%
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono mb-3">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 text-[10px]">Next Stop:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[150px]">{activeBusCard.nextStop}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 text-[10px]">AI Scanner:</span>
              <span className="text-cyan-700 font-semibold">{activeBusCard.cameraStatus}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 text-[10px]">Status:</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeBusCard.status}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleInspectBusHUD(activeBusCard)}
            className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-mono text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Open Bus Camera HUD</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        </div>
      )}
    </div>
  );
};
