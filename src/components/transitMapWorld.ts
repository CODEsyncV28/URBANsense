import { RoadIssue } from '../types';

export const WORLD_WIDTH = 3400;
export const WORLD_HEIGHT = 2200;

export interface Point {
  x: number;
  y: number;
}

export interface BezierCurve {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

export interface RouteSample {
  x: number;
  y: number;
  angle: number;
  dist: number;
}

export interface SimulatedRoute {
  id: string;
  name: string;
  district: string;
  samples: RouteSample[];
  totalLength: number;
  color: string;
  isHighway?: boolean;
  isSecondary?: boolean;
}

export interface CityBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  label?: string;
  type?: 'commercial' | 'industrial' | 'residential' | 'civic' | 'airport' | 'depot';
}

export interface CityBridge {
  id: string;
  name: string;
  startX: number;
  endX: number;
  y: number;
  deckWidth: number;
  pylonHeight: number;
}

export interface JunctionNode {
  x: number;
  y: number;
  baseRadius: number;
  color: string;
  phase: number;
  hasSignal?: boolean;
  label?: string;
}

export interface TransitBusData {
  id: string;
  routeId: string;
  routeName: string;
  progress: number;
  speed: number;
  displaySpeed: number;
  direction: 1 | -1;
  color: string;
  label: string;
  status: 'ON ROUTE' | 'IN TRANSIT' | 'SCANNING';
  nextStop: string;
  occupancy: number;
  lastDetection: string;
  cameraStatus: string;
}

export interface CivilianVehicle {
  id: string;
  routeId: string;
  progress: number;
  speed: number;
  direction: 1 | -1;
  color: string;
}

export interface TelemetryParticle {
  routeId: string;
  progress: number;
  speed: number;
  size: number;
  color: string;
  label?: string;
}

export interface ProblemMarker {
  id: string;
  problemId: string;
  district: string;
  x: number;
  y: number;
  phase: number;
  type: 'CRITICAL' | 'MEDIUM' | 'SOLVED';
  roadLabel: string;
}

// Cubic Bezier helpers
export const getCubicBezier = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  return {
    x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
  };
};

export const getCubicBezierAngle = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): number => {
  const u = 1 - t;
  const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return Math.atan2(dy, dx);
};

export const createSpline = (
  id: string,
  name: string,
  district: string,
  curves: BezierCurve[],
  color: string,
  isHighway = false,
  isSecondary = false
): SimulatedRoute => {
  const samples: RouteSample[] = [];
  let totalLength = 0;

  curves.forEach((curve) => {
    const steps = 140;
    let prevPt = curve.p0;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = getCubicBezier(curve.p0, curve.p1, curve.p2, curve.p3, t);
      const angle = getCubicBezierAngle(curve.p0, curve.p1, curve.p2, curve.p3, t);

      if (samples.length > 0) {
        totalLength += Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y);
      }

      samples.push({ x: pt.x, y: pt.y, angle, dist: totalLength });
      prevPt = pt;
    }
  });

  return { id, name, district, samples, totalLength, color, isHighway, isSecondary };
};

export const getPointAtDist = (route: SimulatedRoute, dist: number): { x: number; y: number; angle: number } => {
  const samples = route.samples;
  if (!samples || samples.length === 0) return { x: 0, y: 0, angle: 0 };

  const norm = ((dist % route.totalLength) + route.totalLength) % route.totalLength;

  let low = 0;
  let high = samples.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (samples[mid].dist < norm) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const idx = Math.max(0, Math.min(samples.length - 2, low - 1));
  const s0 = samples[idx];
  const s1 = samples[idx + 1];
  const seg = s1.dist - s0.dist;
  const factor = seg > 0.001 ? (norm - s0.dist) / seg : 0;

  return {
    x: s0.x + (s1.x - s0.x) * factor,
    y: s0.y + (s1.y - s0.y) * factor,
    angle: s0.angle + (s1.angle - s0.angle) * factor,
  };
};
