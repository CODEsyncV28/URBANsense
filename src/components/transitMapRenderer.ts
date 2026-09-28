import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  SimulatedRoute,
  getPointAtDist,
  CityBlock,
  CityBridge,
  JunctionNode,
  TransitBusData,
  CivilianVehicle,
  TelemetryParticle,
  ProblemMarker,
} from './transitMapWorld';
import { RoadIssue, Severity } from '../types';

export interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  startTime: number;
}

export const getIssueMarkerType = (issue?: RoadIssue | null): 'CRITICAL' | 'MEDIUM' | 'SOLVED' => {
  if (!issue) return 'MEDIUM';
  const statusUpper = (issue.status || '').toUpperCase();
  const roadCondUpper = (issue.roadCondition || '').toUpperCase();

  if (
    statusUpper === 'SOLVED' ||
    statusUpper === 'RESOLVED' ||
    roadCondUpper === 'REPAIRED' ||
    issue.resolvedAt
  ) {
    return 'SOLVED';
  }

  const sevUpper = (issue.severity || '').toUpperCase();
  const prioUpper = (issue.priority || '').toUpperCase();

  if (
    sevUpper === 'HIGH' ||
    prioUpper === 'CRITICAL' ||
    prioUpper === 'HIGH' ||
    roadCondUpper === 'CRITICAL' ||
    issue.type === 'accident'
  ) {
    return 'CRITICAL';
  }

  return 'MEDIUM';
};

export const renderTransitMap = (
  ctx: CanvasRenderingContext2D,
  viewWidth: number,
  viewHeight: number,
  camera: { x: number; y: number; zoom: number },
  frame: number,
  routes: SimulatedRoute[],
  bridges: CityBridge[],
  cityBlocks: CityBlock[],
  junctionNodes: JunctionNode[],
  transitBuses: TransitBusData[],
  civilianVehicles: CivilianVehicle[],
  movingTelemetry: TelemetryParticle[],
  problemMarkers: ProblemMarker[],
  issues: RoadIssue[],
  filterSeverity: Severity | 'ALL',
  hoveredMarkerId: string | null,
  hoveredBusId: string | null,
  activeBusId: string | null,
  clickRipples: ClickRipple[],
  busPositionsMap: Map<string, { worldX: number; worldY: number; screenX: number; screenY: number; angle: number }>
) => {
  // Clear viewport with clean, soft background
  ctx.clearRect(0, 0, viewWidth, viewHeight);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  ctx.save();
  // Transform to world space
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // 1. Seamless Vector Grid
  ctx.strokeStyle = 'rgba(218, 228, 239, 0.45)';
  ctx.lineWidth = 1;
  const gridStep = 180;
  for (let gx = -100; gx <= WORLD_WIDTH + 100; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, -100);
    ctx.lineTo(gx, WORLD_HEIGHT + 100);
    ctx.stroke();
  }
  for (let gy = -100; gy <= WORLD_HEIGHT + 100; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(-100, gy);
    ctx.lineTo(WORLD_WIDTH + 100, gy);
    ctx.stroke();
  }

  // 2. Parks & Greenery Zones
  ctx.save();
  ctx.fillStyle = 'rgba(224, 242, 233, 0.75)';
  ctx.strokeStyle = 'rgba(182, 218, 198, 0.65)';
  ctx.lineWidth = 1.2;

  // Central Civic Park
  ctx.beginPath();
  ctx.roundRect(1440, 930, 240, 100, 10);
  ctx.fill();
  ctx.stroke();

  // Northwest Nature Reserve
  ctx.beginPath();
  ctx.roundRect(240, 480, 420, 140, 12);
  ctx.fill();
  ctx.stroke();

  // Tech Campus Courtyard Garden
  ctx.beginPath();
  ctx.roundRect(1440, 450, 240, 90, 8);
  ctx.fill();
  ctx.stroke();

  // Southwest Community Park
  ctx.beginPath();
  ctx.roundRect(300, 1760, 400, 120, 10);
  ctx.fill();
  ctx.stroke();

  // Eastern Marina Esplanade
  ctx.beginPath();
  ctx.roundRect(2650, 1340, 320, 110, 10);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // 3. Winding Riverway (Flowing North to South around X: 2200 - 2500)
  ctx.save();
  const riverGrad = ctx.createLinearGradient(2350, 0, 2150, WORLD_HEIGHT);
  riverGrad.addColorStop(0, '#D8EAF8');
  riverGrad.addColorStop(0.5, '#CEE2F2');
  riverGrad.addColorStop(1, '#D8EAF8');

  ctx.fillStyle = riverGrad;
  ctx.strokeStyle = '#B9D5EE';
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  // East Bank
  ctx.moveTo(2580, -80);
  ctx.bezierCurveTo(2600, 300, 2520, 700, 2480, 1000);
  ctx.bezierCurveTo(2440, 1300, 2380, 1700, 2300, WORLD_HEIGHT + 80);
  // West Bank
  ctx.lineTo(1980, WORLD_HEIGHT + 80);
  ctx.bezierCurveTo(2050, 1700, 2120, 1300, 2050, 1000);
  ctx.bezierCurveTo(2100, 700, 2220, 300, 2200, -80);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle water animated ripples
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) {
    const yOffset = ((frame * 0.35 + i * 280) % (WORLD_HEIGHT + 160)) - 80;
    const progressY = yOffset / WORLD_HEIGHT;
    const riverCenterX = 2380 - progressY * 200;
    ctx.beginPath();
    ctx.moveTo(riverCenterX - 30, yOffset);
    ctx.quadraticCurveTo(riverCenterX, yOffset + Math.sin(frame * 0.03 + i) * 5, riverCenterX + 30, yOffset);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Secondary Grid Streets (Connecting districts into a dense city fabric)
  ctx.save();
  ctx.strokeStyle = '#E6EDF5';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Connecting cross-streets across Central Downtown
  const streetSegments: [number, number, number, number][] = [
    [1200, 740, 1950, 740],
    [1200, 920, 1950, 920],
    [1200, 1200, 1950, 1200],
    [1200, 1340, 1950, 1340],
    [1440, 680, 1440, 1350],
    [1760, 680, 1760, 1350],

    // West Logistics Streets
    [250, 740, 950, 740],
    [250, 940, 950, 940],
    [250, 1200, 950, 1200],
    [470, 680, 470, 1300],

    // Tech Campus Streets
    [1200, 300, 1950, 300],
    [1440, 120, 1440, 580],
    [1700, 120, 1700, 580],

    // East Harbor Cargo Streets
    [2650, 740, 3250, 740],
    [2650, 900, 3250, 900],
    [2650, 1200, 3250, 1200],
    [2900, 680, 2900, 1350],

    // South Depot Streets
    [1200, 1660, 1950, 1660],
    [1200, 1820, 1950, 1820],
    [1480, 1450, 1480, 1950],
    [1700, 1450, 1700, 1950],

    // Southwest Residential Streets
    [250, 1580, 950, 1580],
    [250, 1740, 950, 1740],
    [470, 1400, 470, 1900],

    // Southeast Marina Streets
    [2650, 1600, 3250, 1600],
    [2650, 1780, 3250, 1780],
    [2850, 1450, 2850, 1950],
  ];

  ctx.beginPath();
  streetSegments.forEach(([x1, y1, x2, y2]) => {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  });
  ctx.stroke();
  ctx.restore();

  // 5. City Blocks & Building Footprints
  ctx.save();
  cityBlocks.forEach((b) => {
    let fillColor = '#E9EEF4';
    let strokeColor = '#D4DEE8';

    if (b.type === 'commercial') {
      fillColor = '#E3EDF6';
      strokeColor = '#C8D8E8';
    } else if (b.type === 'industrial') {
      fillColor = '#E2E8F0';
      strokeColor = '#CBD5E1';
    } else if (b.type === 'civic') {
      fillColor = '#EAEFF5';
      strokeColor = '#CBD5E1';
    } else if (b.type === 'airport') {
      fillColor = '#DEE7F2';
      strokeColor = '#B8CEE2';
    } else if (b.type === 'depot') {
      fillColor = '#DFECE8';
      strokeColor = '#BED6CF';
    } else if (b.type === 'residential') {
      fillColor = '#E8EFF3';
      strokeColor = '#CBD5E1';
    }

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.0;

    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, b.r || 4);
    ctx.fill();
    ctx.stroke();

    // Subtle rooftop architectural accent
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
  });
  ctx.restore();

  // District Sector Name Callouts
  ctx.save();
  ctx.fillStyle = '#8392A5';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.letterSpacing = '1px';
  const districtLabels: { text: string; x: number; y: number }[] = [
    { text: 'CENTRAL CIVIC PLAZA', x: 1450, y: 790 },
    { text: 'TRANSIT TERMINAL HUB', x: 1720, y: 1195 },
    { text: 'WEST LOGISTICS QUAD', x: 380, y: 790 },
    { text: 'AIRPORT AERO CARGO', x: 380, y: 195 },
    { text: 'TECH INNOVATION CAMPUS', x: 1450, y: 180 },
    { text: 'EAST MARITIME PORT', x: 2800, y: 750 },
    { text: 'BUS OPERATIONS DEPOT', x: 1450, y: 1490 },
    { text: 'PARKSIDE RESIDENTIAL', x: 380, y: 1450 },
    { text: 'RIVERFRONT MARINA', x: 2800, y: 1460 },
  ];
  districtLabels.forEach((dl) => {
    ctx.fillText(dl.text, dl.x, dl.y);
  });
  ctx.restore();

  // 6. Major Road Network Underlayer (Pavement & Curbs)
  routes.forEach((route) => {
    if (route.samples.length === 0) return;

    ctx.save();
    ctx.beginPath();
    route.samples.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });

    // Outer road bed
    ctx.strokeStyle = route.isHighway ? '#CBD7E4' : '#D6E0EC';
    ctx.lineWidth = route.isHighway ? 22 : 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Road surface
    ctx.strokeStyle = route.isHighway ? '#E2EAF2' : '#E8EFF6';
    ctx.lineWidth = route.isHighway ? 16 : 8.5;
    ctx.stroke();

    // Highway center dashes
    if (route.isHighway) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([10, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  });

  // 7. Bridges (Crossing the Riverway)
  bridges.forEach((bridge) => {
    ctx.save();
    const bridgeStartX = bridge.startX;
    const bridgeEndX = bridge.endX;
    const bridgeY = bridge.y;
    const bridgeSpan = bridgeEndX - bridgeStartX;
    const deckHeight = bridge.deckWidth;

    // Deck shadow on water
    ctx.fillStyle = 'rgba(30, 60, 90, 0.16)';
    ctx.beginPath();
    ctx.roundRect(bridgeStartX + 6, bridgeY + deckHeight / 2 + 4, bridgeSpan - 12, 14, 4);
    ctx.fill();

    // Concrete Abutments
    ctx.fillStyle = '#94A3B8';
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(bridgeStartX - 8, bridgeY - deckHeight / 2 - 3, 16, deckHeight + 6, 3);
    ctx.roundRect(bridgeEndX - 8, bridgeY - deckHeight / 2 - 3, 16, deckHeight + 6, 3);
    ctx.fill();
    ctx.stroke();

    // Road Deck
    ctx.fillStyle = '#CBD7E4';
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(bridgeStartX - 4, bridgeY - deckHeight / 2, bridgeSpan + 8, deckHeight, 3);
    ctx.fill();
    ctx.stroke();

    // Deck asphalt surface
    ctx.fillStyle = '#E2EAF2';
    ctx.fillRect(bridgeStartX - 2, bridgeY - deckHeight / 2 + 3, bridgeSpan + 4, deckHeight - 6);

    // Guardrails
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bridgeStartX, bridgeY - deckHeight / 2);
    ctx.lineTo(bridgeEndX, bridgeY - deckHeight / 2);
    ctx.moveTo(bridgeStartX, bridgeY + deckHeight / 2);
    ctx.lineTo(bridgeEndX, bridgeY + deckHeight / 2);
    ctx.stroke();

    // Suspension Towers & Pylons (if pylonHeight > 0)
    if (bridge.pylonHeight > 0) {
      const pylon1X = bridgeStartX + bridgeSpan * 0.32;
      const pylon2X = bridgeStartX + bridgeSpan * 0.68;
      const pylonH = bridge.pylonHeight;

      ctx.fillStyle = '#475569';
      ctx.fillRect(pylon1X - 3, bridgeY - pylonH, 6, pylonH * 2);
      ctx.fillRect(pylon2X - 3, bridgeY - pylonH, 6, pylonH * 2);
      ctx.fillRect(pylon1X - 8, bridgeY - pylonH + 4, 16, 4);
      ctx.fillRect(pylon2X - 8, bridgeY - pylonH + 4, 16, 4);

      // Cable Stays
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pylon1X, bridgeY - pylonH + 4);
      ctx.lineTo(bridgeStartX + 10, bridgeY - deckHeight / 2);
      ctx.moveTo(pylon1X, bridgeY - pylonH + 4);
      ctx.lineTo(pylon1X - bridgeSpan * 0.16, bridgeY - deckHeight / 2);
      ctx.moveTo(pylon1X, bridgeY - pylonH + 4);
      ctx.lineTo(pylon1X + bridgeSpan * 0.16, bridgeY - deckHeight / 2);

      ctx.moveTo(pylon2X, bridgeY - pylonH + 4);
      ctx.lineTo(pylon2X - bridgeSpan * 0.16, bridgeY - deckHeight / 2);
      ctx.moveTo(pylon2X, bridgeY - pylonH + 4);
      ctx.lineTo(pylon2X + bridgeSpan * 0.16, bridgeY - deckHeight / 2);
      ctx.moveTo(pylon2X, bridgeY - pylonH + 4);
      ctx.lineTo(bridgeEndX - 10, bridgeY - deckHeight / 2);
      ctx.stroke();
    }

    // Bridge center lane dashes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(bridgeStartX, bridgeY);
    ctx.lineTo(bridgeEndX, bridgeY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  });

  // 8. Cyan & Teal Transit Corridor Lines (Smart-City Overlay)
  routes.forEach((route) => {
    if (route.samples.length === 0) return;

    ctx.save();
    ctx.beginPath();
    route.samples.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });

    ctx.strokeStyle = route.color;
    ctx.lineWidth = route.isHighway ? 5.0 : 3.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (route.isSecondary) {
      ctx.setLineDash([8, 8]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.stroke();
    ctx.restore();
  });

  // 9. Junction Signal Nodes
  junctionNodes.forEach((node) => {
    const pulse = Math.sin(frame * 0.025 + node.phase) * 0.5 + 0.5;
    const currentRadius = node.baseRadius + pulse * 1.0;

    if (node.hasSignal) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, currentRadius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 175, 198, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.globalAlpha = 0.6 + pulse * 0.35;
    ctx.shadowColor = node.color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  });

  // 10. Moving Telemetry Particles
  movingTelemetry.forEach((dot) => {
    const route = routes.find((r) => r.id === dot.routeId);
    if (!route || route.totalLength === 0) return;

    dot.progress = (dot.progress + dot.speed) % route.totalLength;
    const pos = getPointAtDist(route, dot.progress);

    const trailPos = getPointAtDist(route, dot.progress - 26);
    ctx.beginPath();
    ctx.moveTo(trailPos.x, trailPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, dot.size * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = dot.color;
    ctx.shadowColor = dot.color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // 11. Civilian Vehicles
  civilianVehicles.forEach((veh) => {
    const route = routes.find((r) => r.id === veh.routeId);
    if (!route || route.totalLength === 0) return;

    veh.progress = (veh.progress + veh.speed * veh.direction + route.totalLength) % route.totalLength;
    const pos = getPointAtDist(route, veh.progress);
    const heading = veh.direction === 1 ? pos.angle : pos.angle + Math.PI;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(heading);

    const vLen = 13;
    const vWid = 6.5;

    // Headlight cone
    ctx.fillStyle = 'rgba(0, 175, 198, 0.16)';
    ctx.beginPath();
    ctx.moveTo(vLen / 2, -2.0);
    ctx.lineTo(vLen / 2 + 10, -4.5);
    ctx.lineTo(vLen / 2 + 10, 4.5);
    ctx.lineTo(vLen / 2, 2.0);
    ctx.closePath();
    ctx.fill();

    // Chassis
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = veh.color;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(-vLen / 2, -vWid / 2, vLen, vWid, 2.0);
    ctx.fill();
    ctx.stroke();

    // Windshield
    ctx.fillStyle = veh.color;
    ctx.fillRect(vLen / 2 - 4.5, -vWid / 2 + 1.2, 2.0, vWid - 2.4);

    ctx.restore();
  });

  // 12. Public Transit Animated Buses
  busPositionsMap.clear();

  transitBuses.forEach((bus) => {
    const route = routes.find((r) => r.id === bus.routeId);
    if (!route || route.totalLength === 0) return;

    bus.progress = (bus.progress + bus.speed * bus.direction + route.totalLength) % route.totalLength;
    const pos = getPointAtDist(route, bus.progress);
    const heading = bus.direction === 1 ? pos.angle : pos.angle + Math.PI;

    // Transform world to screen coordinates for hit-testing
    const screenX = pos.x * camera.zoom + camera.x;
    const screenY = pos.y * camera.zoom + camera.y;
    busPositionsMap.set(bus.id, { worldX: pos.x, worldY: pos.y, screenX, screenY, angle: heading });

    const isHovered = hoveredBusId === bus.id;
    const isSelected = activeBusId === bus.id;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(heading);

    const scaleMult = isHovered || isSelected ? 1.25 : 1.0;
    const bLen = 26 * scaleMult;
    const bWid = 12 * scaleMult;

    // Motion trail
    ctx.strokeStyle = 'rgba(0, 175, 198, 0.28)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-bLen / 2, 0);
    ctx.lineTo(-bLen / 2 - 18, 0);
    ctx.stroke();

    // Headlight cone
    ctx.fillStyle = isHovered ? 'rgba(0, 175, 198, 0.38)' : 'rgba(0, 175, 198, 0.22)';
    ctx.beginPath();
    ctx.moveTo(bLen / 2, -3.2);
    ctx.lineTo(bLen / 2 + 18, -8.0);
    ctx.lineTo(bLen / 2 + 18, 8.0);
    ctx.lineTo(bLen / 2, 3.2);
    ctx.closePath();
    ctx.fill();

    // Hover glow ring
    if (isHovered || isSelected) {
      ctx.beginPath();
      ctx.arc(0, 0, bLen * 0.85, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 175, 198, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    // Bus body
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = isHovered ? '#008ba3' : bus.color;
    ctx.lineWidth = isHovered ? 2.6 : 1.8;
    if (isHovered) {
      ctx.shadowColor = 'rgba(0, 175, 198, 0.8)';
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.roundRect(-bLen / 2, -bWid / 2, bLen, bWid, 3.2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Roof color stripe
    ctx.fillStyle = bus.color;
    ctx.fillRect(-bLen / 2 + 5, -2.0, bLen - 10, 4.0);

    // Front windshield
    ctx.fillStyle = bus.color;
    ctx.fillRect(bLen / 2 - 5.5, -bWid / 2 + 1.8, 2.8, bWid - 3.6);

    // Side windows
    ctx.fillStyle = 'rgba(0, 175, 198, 0.65)';
    ctx.fillRect(-bLen / 2 + 4, -bWid / 2 + 1.6, 3.5, 1.8);
    ctx.fillRect(0, -bWid / 2 + 1.6, 3.5, 1.8);
    ctx.fillRect(-bLen / 2 + 4, bWid / 2 - 3.4, 3.5, 1.8);
    ctx.fillRect(0, bWid / 2 - 3.4, 3.5, 1.8);

    ctx.restore();
  });

  // 13. Click Ripples
  if (clickRipples.length > 0) {
    const now = performance.now();
    for (let i = clickRipples.length - 1; i >= 0; i--) {
      const r = clickRipples[i];
      const elapsed = now - r.startTime;
      const duration = 380;
      const progress = Math.min(1, elapsed / duration);
      const currentRadius = r.radius + (r.maxRadius - r.radius) * progress;
      const currentAlpha = r.alpha * (1 - progress);

      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color.replace('ALPHA', currentAlpha.toFixed(2));
      ctx.lineWidth = 3.0 * (1 - progress * 0.6);
      ctx.stroke();
      ctx.restore();

      if (progress >= 1) {
        clickRipples.splice(i, 1);
      }
    }
  }

  // 14. AI Problem Markers (RED, ORANGE, GREEN)
  problemMarkers.forEach((alert) => {
    const realIssue = issues.find((i) => i.id === alert.problemId);
    const currentType = realIssue ? getIssueMarkerType(realIssue) : alert.type;
    const isHovered = hoveredMarkerId === alert.id;

    // Severity filtering
    let opacityMultiplier = 1.0;
    if (filterSeverity && filterSeverity !== 'ALL') {
      if (filterSeverity === 'HIGH' && currentType !== 'CRITICAL') {
        opacityMultiplier = 0.25;
      } else if (filterSeverity === 'MEDIUM' && currentType !== 'MEDIUM') {
        opacityMultiplier = 0.25;
      } else if (filterSeverity === 'LOW' && currentType !== 'SOLVED') {
        opacityMultiplier = 0.25;
      }
    }

    let centerColor = '#ef4444';
    let glowColor = isHovered ? 'rgba(239, 68, 68, 0.9)' : 'rgba(239, 68, 68, 0.5)';
    let haloColor = 'rgba(239, 68, 68, ';
    let pulseRate = 0.028;
    let innerRadius = isHovered ? 10.5 : 8.0;
    let outerBaseRadius = isHovered ? 19 : 15;
    let outerPulseRange = 3.4;
    let glowBlur = isHovered ? 20 : 11;
    let ringLineWidth = isHovered ? 2.6 : 1.9;

    if (currentType === 'MEDIUM') {
      centerColor = '#f59e0b';
      glowColor = isHovered ? 'rgba(245, 158, 11, 0.9)' : 'rgba(245, 158, 11, 0.45)';
      haloColor = 'rgba(245, 158, 11, ';
      pulseRate = 0.022;
      innerRadius = isHovered ? 9.5 : 7.4;
      outerBaseRadius = isHovered ? 17 : 14;
      outerPulseRange = 2.8;
      glowBlur = isHovered ? 17 : 9;
      ringLineWidth = isHovered ? 2.4 : 1.7;
    } else if (currentType === 'SOLVED') {
      centerColor = '#10b981';
      glowColor = isHovered ? 'rgba(16, 185, 129, 0.9)' : 'rgba(16, 185, 129, 0.4)';
      haloColor = 'rgba(16, 185, 129, ';
      pulseRate = 0.016;
      innerRadius = isHovered ? 9.0 : 7.0;
      outerBaseRadius = isHovered ? 16 : 13.2;
      outerPulseRange = 2.4;
      glowBlur = isHovered ? 15 : 8;
      ringLineWidth = isHovered ? 2.2 : 1.5;
    }

    ctx.save();
    ctx.globalAlpha = opacityMultiplier;

    const pulse = Math.sin(frame * pulseRate + alert.phase) * 0.5 + 0.5;
    const currentOuterRadius = outerBaseRadius + pulse * outerPulseRange;

    // Halo disk
    ctx.beginPath();
    ctx.arc(alert.x, alert.y, currentOuterRadius, 0, Math.PI * 2);
    const haloAlpha = isHovered
      ? Math.max(0.12, 0.28 - pulse * 0.10)
      : Math.max(0.04, 0.16 - pulse * 0.08);
    ctx.fillStyle = `${haloColor}${haloAlpha})`;
    ctx.fill();

    // Pulsing outer ring
    ctx.beginPath();
    ctx.arc(alert.x, alert.y, currentOuterRadius, 0, Math.PI * 2);
    const ringAlpha = isHovered
      ? Math.max(0.35, 0.85 - pulse * 0.28)
      : Math.max(0.15, 0.50 - pulse * 0.25);
    ctx.strokeStyle = `${haloColor}${ringAlpha})`;
    ctx.lineWidth = ringLineWidth;
    ctx.stroke();

    // Center core
    ctx.beginPath();
    ctx.arc(alert.x, alert.y, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = centerColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
    ctx.fill();
    ctx.shadowBlur = 0;

    // White center pip
    ctx.beginPath();
    ctx.arc(alert.x, alert.y, innerRadius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();
  });

  ctx.restore();
};
