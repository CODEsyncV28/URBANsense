import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  BezierCurve,
  SimulatedRoute,
  createSpline,
  CityBlock,
  CityBridge,
  JunctionNode,
  TransitBusData,
  CivilianVehicle,
  TelemetryParticle,
  ProblemMarker,
} from './transitMapWorld';
import { RoadIssue } from '../types';

export const getCityWorldData = (issues: RoadIssue[]) => {
  // 1. Bridges across the winding river (River is around X: 2050 - 2450)
  const bridges: CityBridge[] = [
    {
      id: 'bridge-main',
      name: 'Grand Suspension Bridge',
      startX: 2050,
      endX: 2450,
      y: 1000,
      deckWidth: 38,
      pylonHeight: 58,
    },
    {
      id: 'bridge-north',
      name: 'North Parkway River Span',
      startX: 2200,
      endX: 2550,
      y: 420,
      deckWidth: 30,
      pylonHeight: 42,
    },
    {
      id: 'bridge-south',
      name: 'South Causeway Bridge',
      startX: 1950,
      endX: 2350,
      y: 1580,
      deckWidth: 32,
      pylonHeight: 44,
    },
  ];

  // 2. City Blocks: dense urban fabric distributed across all districts
  const cityBlocks: CityBlock[] = [
    // --- Central Business District & Civic Plaza (X: 1200 - 1950, Y: 750 - 1350) ---
    { x: 1300, y: 820, w: 120, h: 90, r: 4, label: 'Central Tower 1', type: 'commercial' },
    { x: 1440, y: 820, w: 130, h: 90, r: 4, label: 'Metro Exchange', type: 'civic' },
    { x: 1680, y: 820, w: 120, h: 90, r: 4, label: 'Financial Plaza A', type: 'commercial' },
    { x: 1820, y: 820, w: 130, h: 90, r: 4, label: 'Commerce Center', type: 'commercial' },

    { x: 1300, y: 1080, w: 130, h: 100, r: 4, label: 'Grand Concourse', type: 'civic' },
    { x: 1450, y: 1080, w: 120, h: 100, r: 4, label: 'City Hall Annex', type: 'civic' },
    { x: 1680, y: 1080, w: 130, h: 100, r: 4, label: 'Transit Terminal', type: 'commercial' },
    { x: 1830, y: 1080, w: 120, h: 100, r: 4, label: 'Commerce Tower B', type: 'commercial' },

    { x: 1300, y: 680, w: 160, h: 80, r: 4, label: 'Judicial Complex', type: 'civic' },
    { x: 1680, y: 680, w: 170, h: 80, r: 4, label: 'North Plaza Office', type: 'commercial' },
    { x: 1300, y: 1240, w: 150, h: 80, r: 4, label: 'South Mall Complex', type: 'commercial' },
    { x: 1680, y: 1240, w: 160, h: 80, r: 4, label: 'Telecomm Headquarters', type: 'commercial' },

    // --- West Cloverleaf & Logistics District (X: 250 - 950, Y: 750 - 1300) ---
    { x: 300, y: 820, w: 160, h: 110, r: 4, label: 'West Logistics Quad 1', type: 'industrial' },
    { x: 490, y: 820, w: 170, h: 110, r: 4, label: 'Regional Freight Hub', type: 'industrial' },
    { x: 300, y: 1080, w: 160, h: 120, r: 4, label: 'Harbor Gateway Depot', type: 'industrial' },
    { x: 490, y: 1080, w: 170, h: 120, r: 4, label: 'Intermodal Yard A', type: 'industrial' },
    { x: 840, y: 820, w: 130, h: 100, r: 4, label: 'West Office Tower', type: 'commercial' },
    { x: 840, y: 1080, w: 130, h: 100, r: 4, label: 'Service Center', type: 'commercial' },
    { x: 300, y: 680, w: 180, h: 80, r: 4, label: 'Equipment Depot', type: 'industrial' },
    { x: 510, y: 680, w: 150, h: 80, r: 4, label: 'Warehouse B', type: 'industrial' },

    // --- Airport Corridor & Aviation District (Northwest: X: 200 - 950, Y: 120 - 580) ---
    { x: 260, y: 220, w: 200, h: 90, r: 6, label: 'Terminal 1 & 2 Main', type: 'airport' },
    { x: 490, y: 220, w: 180, h: 90, r: 6, label: 'Air Cargo Facility 1', type: 'airport' },
    { x: 260, y: 350, w: 160, h: 100, r: 6, label: 'Aero Freight Hub', type: 'airport' },
    { x: 450, y: 350, w: 220, h: 100, r: 6, label: 'Aviation Hangars A', type: 'airport' },
    { x: 740, y: 220, w: 160, h: 100, r: 4, label: 'Airport Hotel & Suites', type: 'commercial' },
    { x: 740, y: 350, w: 160, h: 100, r: 4, label: 'Flight Operations', type: 'commercial' },

    // --- Tech Campus & Innovation Park (North-Central: X: 1200 - 1950, Y: 120 - 580) ---
    { x: 1300, y: 200, w: 150, h: 95, r: 4, label: 'AI Institute Campus', type: 'civic' },
    { x: 1480, y: 200, w: 160, h: 95, r: 4, label: 'Nanotech Science Labs', type: 'civic' },
    { x: 1720, y: 200, w: 160, h: 95, r: 4, label: 'Cybernetics Hall', type: 'commercial' },
    { x: 1300, y: 340, w: 140, h: 90, r: 4, label: 'Bioengineering Quad', type: 'civic' },
    { x: 1470, y: 340, w: 170, h: 90, r: 4, label: 'Robotics Center', type: 'commercial' },
    { x: 1720, y: 340, w: 150, h: 90, r: 4, label: 'Clean Energy Campus', type: 'commercial' },

    // --- East Harbor & Maritime Logistics (Northeast & East: X: 2650 - 3250, Y: 680 - 1350) ---
    { x: 2700, y: 780, w: 180, h: 110, r: 4, label: 'Maritime Container Wharf', type: 'industrial' },
    { x: 2920, y: 780, w: 220, h: 110, r: 4, label: 'Port Crane Facility A', type: 'industrial' },
    { x: 2700, y: 1080, w: 170, h: 120, r: 4, label: 'Harbor Warehouse Yard', type: 'industrial' },
    { x: 2910, y: 1080, w: 230, h: 120, r: 4, label: 'Dry Bulk Cargo Apron', type: 'industrial' },
    { x: 2700, y: 920, w: 160, h: 110, r: 4, label: 'Cold Storage Terminal', type: 'industrial' },
    { x: 2900, y: 920, w: 240, h: 110, r: 4, label: 'Customs Clearance Post', type: 'civic' },

    // --- Northeast Maritime Tech & Energy Park (X: 2650 - 3250, Y: 150 - 580) ---
    { x: 2700, y: 200, w: 170, h: 95, r: 4, label: 'Harbor Research Lab', type: 'civic' },
    { x: 2900, y: 200, w: 220, h: 95, r: 4, label: 'Ocean Freight Analytics', type: 'commercial' },
    { x: 2700, y: 340, w: 180, h: 100, r: 4, label: 'Offshore Energy Center', type: 'industrial' },
    { x: 2920, y: 340, w: 200, h: 100, r: 4, label: 'Wind Power Monitoring', type: 'industrial' },

    // --- South Bus Depot & Fleet Maintenance (South-Central: X: 1200 - 1950, Y: 1450 - 2000) ---
    { x: 1300, y: 1520, w: 160, h: 120, r: 4, label: 'Bus Central Maintenance', type: 'depot' },
    { x: 1490, y: 1520, w: 180, h: 120, r: 4, label: 'Transit Dispatch Facility', type: 'depot' },
    { x: 1720, y: 1520, w: 160, h: 120, r: 4, label: 'Fleet Technical Services', type: 'depot' },
    { x: 1300, y: 1700, w: 170, h: 110, r: 4, label: 'EV Rapid Charging Stalls', type: 'depot' },
    { x: 1500, y: 1700, w: 170, h: 110, r: 4, label: 'Chassis Overhaul Shop', type: 'depot' },
    { x: 1720, y: 1700, w: 150, h: 110, r: 4, label: 'Transit Parts Logistics', type: 'depot' },

    // --- Southwest Residential District (X: 250 - 950, Y: 1400 - 2000) ---
    { x: 300, y: 1480, w: 150, h: 95, r: 4, label: 'Greenwood Quads A', type: 'residential' },
    { x: 480, y: 1480, w: 160, h: 95, r: 4, label: 'Greenwood Quads B', type: 'residential' },
    { x: 300, y: 1630, w: 160, h: 100, r: 4, label: 'Riverside Townhomes', type: 'residential' },
    { x: 490, y: 1630, w: 150, h: 100, r: 4, label: 'Parkside Estates', type: 'residential' },
    { x: 740, y: 1480, w: 140, h: 100, r: 4, label: 'Civic High School', type: 'civic' },
    { x: 740, y: 1630, w: 150, h: 100, r: 4, label: 'Sports Arena Center', type: 'civic' },

    // --- Southeast Urban Promenade & Marina (X: 2550 - 3250, Y: 1450 - 2000) ---
    { x: 2650, y: 1500, w: 170, h: 100, r: 4, label: 'Marina Tower Condos', type: 'residential' },
    { x: 2860, y: 1500, w: 190, h: 100, r: 4, label: 'Waterfront Boardwalk', type: 'commercial' },
    { x: 2650, y: 1660, w: 180, h: 100, r: 4, label: 'Riverview Terraces A', type: 'residential' },
    { x: 2870, y: 1660, w: 180, h: 100, r: 4, label: 'Riverview Terraces B', type: 'residential' },
  ];

  // 3. Simulated Multi-Tier Roads spanning the entire metropolis
  // Highway 1: Grand Arterial across whole map through Central Hub and across Grand Suspension Bridge
  const c1: BezierCurve[] = [
    { p0: { x: -60, y: 1000 }, p1: { x: 350, y: 1000 }, p2: { x: 550, y: 1000 }, p3: { x: 750, y: 1000 } },
    { p0: { x: 750, y: 1000 }, p1: { x: 1100, y: 1000 }, p2: { x: 1350, y: 1000 }, p3: { x: 1600, y: 1000 } },
    { p0: { x: 1600, y: 1000 }, p1: { x: 1850, y: 1000 }, p2: { x: 1980, y: 1000 }, p3: { x: 2050, y: 1000 } }, // Enter Bridge
    { p0: { x: 2050, y: 1000 }, p1: { x: 2180, y: 1000 }, p2: { x: 2320, y: 1000 }, p3: { x: 2450, y: 1000 } }, // Cross Bridge
    { p0: { x: 2450, y: 1000 }, p1: { x: 2650, y: 1000 }, p2: { x: 3000, y: 1000 }, p3: { x: 3460, y: 1000 } },
  ];

  // Highway 2: Central North-South Spine (Tech Campus to Central Hub to South Depot)
  const c2: BezierCurve[] = [
    { p0: { x: 1600, y: -60 }, p1: { x: 1600, y: 350 }, p2: { x: 1600, y: 700 }, p3: { x: 1600, y: 1000 } },
    { p0: { x: 1600, y: 1000 }, p1: { x: 1600, y: 1300 }, p2: { x: 1600, y: 1650 }, p3: { x: 1600, y: 2260 } },
  ];

  // Highway 3: West Corridor (Airport to West Interchange to Residential South)
  const c3: BezierCurve[] = [
    { p0: { x: 750, y: -60 }, p1: { x: 750, y: 350 }, p2: { x: 750, y: 700 }, p3: { x: 750, y: 1000 } },
    { p0: { x: 750, y: 1000 }, p1: { x: 750, y: 1350 }, p2: { x: 750, y: 1750 }, p3: { x: 750, y: 2260 } },
  ];

  // Highway 4: East Harbor Beltway (North Harbor to Freight Docks to Southeast Marina)
  const c4: BezierCurve[] = [
    { p0: { x: 2750, y: -60 }, p1: { x: 2750, y: 350 }, p2: { x: 2750, y: 700 }, p3: { x: 2750, y: 1000 } },
    { p0: { x: 2750, y: 1000 }, p1: { x: 2750, y: 1350 }, p2: { x: 2750, y: 1750 }, p3: { x: 2750, y: 2260 } },
  ];

  // Secondary 1: Northern Crosstown Parkway (Airport across Tech Campus over North Bridge to East)
  const c5: BezierCurve[] = [
    { p0: { x: -60, y: 420 }, p1: { x: 400, y: 420 }, p2: { x: 750, y: 420 }, p3: { x: 1100, y: 420 } },
    { p0: { x: 1100, y: 420 }, p1: { x: 1400, y: 420 }, p2: { x: 1800, y: 420 }, p3: { x: 2200, y: 420 } }, // North Bridge start
    { p0: { x: 2200, y: 420 }, p1: { x: 2320, y: 420 }, p2: { x: 2430, y: 420 }, p3: { x: 2550, y: 420 } }, // Over Bridge
    { p0: { x: 2550, y: 420 }, p1: { x: 2850, y: 420 }, p2: { x: 3150, y: 420 }, p3: { x: 3460, y: 420 } },
  ];

  // Secondary 2: Southern Ring Boulevard (Residential through Depot across South Causeway to Marina)
  const c6: BezierCurve[] = [
    { p0: { x: -60, y: 1580 }, p1: { x: 400, y: 1580 }, p2: { x: 750, y: 1580 }, p3: { x: 1200, y: 1580 } },
    { p0: { x: 1200, y: 1580 }, p1: { x: 1450, y: 1580 }, p2: { x: 1750, y: 1580 }, p3: { x: 1950, y: 1580 } }, // South Causeway start
    { p0: { x: 1950, y: 1580 }, p1: { x: 2080, y: 1580 }, p2: { x: 2220, y: 1580 }, p3: { x: 2350, y: 1580 } }, // Over Causeway
    { p0: { x: 2350, y: 1580 }, p1: { x: 2650, y: 1580 }, p2: { x: 3050, y: 1580 }, p3: { x: 3460, y: 1580 } },
  ];

  // Secondary 3: Airport Expressway Spur (Curved connection from Terminal to West Interchange)
  const c7: BezierCurve[] = [
    { p0: { x: 350, y: 220 }, p1: { x: 350, y: 550 }, p2: { x: 500, y: 800 }, p3: { x: 750, y: 1000 } },
  ];

  // Secondary 4: Tech Diagonal Link (Curved link from Tech Campus to Central Hub)
  const c8: BezierCurve[] = [
    { p0: { x: 1300, y: 420 }, p1: { x: 1400, y: 600 }, p2: { x: 1500, y: 800 }, p3: { x: 1600, y: 1000 } },
  ];

  // Secondary 5: Harbor Maritime Loop (Connecting Freight Yard docks)
  const c9: BezierCurve[] = [
    { p0: { x: 2450, y: 1000 }, p1: { x: 2600, y: 850 }, p2: { x: 2850, y: 700 }, p3: { x: 3100, y: 700 } },
    { p0: { x: 3100, y: 700 }, p1: { x: 3250, y: 850 }, p2: { x: 3250, y: 1150 }, p3: { x: 3100, y: 1300 } },
    { p0: { x: 3100, y: 1300 }, p1: { x: 2850, y: 1300 }, p2: { x: 2600, y: 1150 }, p3: { x: 2450, y: 1000 } },
  ];

  // Secondary 6: Bus Operations Transitway (Connecting Central Hub to Bus Maintenance Depot)
  const c10: BezierCurve[] = [
    { p0: { x: 1600, y: 1000 }, p1: { x: 1500, y: 1180 }, p2: { x: 1500, y: 1400 }, p3: { x: 1500, y: 1580 } },
  ];

  const routes: SimulatedRoute[] = [
    createSpline('H1', 'Grand Highway (Suspension Bridge Corridor)', 'bridge', c1, 'rgba(0, 175, 198, 0.55)', true),
    createSpline('H2', 'North-South Central Spine', 'center', c2, 'rgba(2, 132, 199, 0.50)', true),
    createSpline('H3', 'West Corridor Parkway', 'west', c3, 'rgba(13, 148, 136, 0.50)', true),
    createSpline('H4', 'East Harbor Coastal Beltway', 'bridge', c4, 'rgba(2, 132, 199, 0.50)', true),
    createSpline('S1', 'Northern Crosstown Parkway', 'north', c5, 'rgba(0, 175, 198, 0.42)', false, true),
    createSpline('S2', 'Southern Ring Boulevard & Causeway', 'depot', c6, 'rgba(13, 148, 136, 0.42)', false, true),
    createSpline('S3', 'Airport Express Spur', 'north', c7, 'rgba(14, 165, 233, 0.42)', false, true),
    createSpline('S4', 'Tech Diagonal Link', 'tech', c8, 'rgba(2, 132, 199, 0.42)', false, true),
    createSpline('S5', 'Harbor Maritime Loop', 'bridge', c9, 'rgba(0, 175, 198, 0.38)', false, true),
    createSpline('S6', 'Bus Operations Transitway', 'depot', c10, 'rgba(13, 148, 136, 0.42)', false, true),
  ];

  // 4. Interconnected Junction Nodes across all intersections
  const junctionNodes: JunctionNode[] = [
    { x: 1600, y: 1000, baseRadius: 6.5, color: '#00AFC6', phase: 0.1, hasSignal: true, label: 'Grand Central Hub' },
    { x: 750, y: 1000, baseRadius: 5.8, color: '#0284c7', phase: 1.2, hasSignal: true, label: 'West Cloverleaf' },
    { x: 2050, y: 1000, baseRadius: 5.2, color: '#00AFC6', phase: 2.1, hasSignal: true, label: 'Bridge West Abutment' },
    { x: 2450, y: 1000, baseRadius: 5.2, color: '#00AFC6', phase: 3.0, hasSignal: true, label: 'Bridge East Abutment' },
    { x: 2750, y: 1000, baseRadius: 5.0, color: '#0284c7', phase: 0.9, hasSignal: true, label: 'Harbor Junction' },
    { x: 750, y: 420, baseRadius: 4.8, color: '#0d9488', phase: 1.8, hasSignal: true, label: 'Airport Junction' },
    { x: 1600, y: 420, baseRadius: 5.0, color: '#0284c7', phase: 2.7, hasSignal: true, label: 'Tech Quad' },
    { x: 2200, y: 420, baseRadius: 4.5, color: '#00AFC6', phase: 3.4, hasSignal: true, label: 'North Bridge West' },
    { x: 2550, y: 420, baseRadius: 4.5, color: '#00AFC6', phase: 3.9, hasSignal: true, label: 'North Bridge East' },
    { x: 750, y: 1580, baseRadius: 4.8, color: '#0d9488', phase: 0.5, hasSignal: true, label: 'Residential Cross' },
    { x: 1600, y: 1580, baseRadius: 5.5, color: '#00AFC6', phase: 1.6, hasSignal: true, label: 'Depot Gateway' },
    { x: 1950, y: 1580, baseRadius: 4.5, color: '#0284c7', phase: 2.5, hasSignal: true, label: 'Causeway West' },
    { x: 2350, y: 1580, baseRadius: 4.5, color: '#0284c7', phase: 3.1, hasSignal: true, label: 'Causeway East' },
    { x: 2750, y: 1580, baseRadius: 4.8, color: '#0284c7', phase: 1.1, hasSignal: true, label: 'Marina Junction' },
  ];

  // 5. Public Transit Animated Buses
  const transitBuses: TransitBusData[] = [
    // Bus 1: BUS-07 crossing the Grand Suspension Bridge on Highway 1
    {
      id: 'BUS-07',
      routeId: 'H1',
      routeName: 'Route 4B (Central - Grand Bridge - Harbor)',
      progress: (routes[0]?.totalLength || 3500) * 0.62,
      speed: 0.75,
      displaySpeed: 42,
      direction: 1,
      color: '#00AFC6',
      label: 'BUS-07',
      status: 'ON ROUTE',
      nextStop: 'Grand Bridge East Overpass',
      occupancy: 68,
      lastDetection: 'Deep Surface Cavity Cluster',
      cameraStatus: 'ACTIVE (YOLOv8 Edge AI)',
    },
    // Bus 2: BUS-12 traveling westbound across the Grand Suspension Bridge
    {
      id: 'BUS-12',
      routeId: 'H1',
      routeName: 'Route 9A (Harbor - Grand Bridge - Central)',
      progress: (routes[0]?.totalLength || 3500) * 0.69,
      speed: 0.72,
      displaySpeed: 39,
      direction: -1,
      color: '#0284c7',
      label: 'BUS-12',
      status: 'IN TRANSIT',
      nextStop: 'Central Transit Concourse',
      occupancy: 74,
      lastDetection: 'Waterlogging Left Lane',
      cameraStatus: 'ACTIVE (Sony IMX390 1080p)',
    },
    // Bus 3: BUS-03 on North-South Highway 2 (Central Hub to South Depot)
    {
      id: 'BUS-03',
      routeId: 'H2',
      routeName: 'Route 1A (Tech Campus - Central - Depot)',
      progress: (routes[1]?.totalLength || 2300) * 0.48,
      speed: 0.70,
      displaySpeed: 41,
      direction: 1,
      color: '#0d9488',
      label: 'BUS-03',
      status: 'SCANNING',
      nextStop: 'Grand Central Plaza',
      occupancy: 56,
      lastDetection: 'Alligator Fatigue Cracking',
      cameraStatus: 'ACTIVE (NVIDIA Orin Nano)',
    },
    // Bus 4: BUS-19 on Highway 3 (Airport to West Cloverleaf)
    {
      id: 'BUS-19',
      routeId: 'H3',
      routeName: 'Route 3 Express (Aero Corridor - West Hub)',
      progress: (routes[2]?.totalLength || 2300) * 0.38,
      speed: 0.76,
      displaySpeed: 45,
      direction: 1,
      color: '#0284c7',
      label: 'BUS-19',
      status: 'ON ROUTE',
      nextStop: 'West Cloverleaf Flyover',
      occupancy: 81,
      lastDetection: 'Obstruction Debris Field',
      cameraStatus: 'ACTIVE (Road Hazard AI)',
    },
    // Bus 5: BUS-24 on Northern Crosstown Parkway crossing North Bridge
    {
      id: 'BUS-24',
      routeId: 'S1',
      routeName: 'Route 2 Loop (Airport - Tech - North Bridge)',
      progress: (routes[4]?.totalLength || 3500) * 0.67,
      speed: 0.66,
      displaySpeed: 36,
      direction: 1,
      color: '#00AFC6',
      label: 'BUS-24',
      status: 'ON ROUTE',
      nextStop: 'North Bridge River Span',
      occupancy: 51,
      lastDetection: 'Surface Cavity Cluster',
      cameraStatus: 'ACTIVE (28.4 FPS)',
    },
    // Bus 6: BUS-01 on Southern Ring Boulevard crossing South Causeway
    {
      id: 'BUS-01',
      routeId: 'S2',
      routeName: 'Route 5 Ring (South Depot - Causeway - Marina)',
      progress: (routes[5]?.totalLength || 3500) * 0.58,
      speed: 0.68,
      displaySpeed: 38,
      direction: 1,
      color: '#0d9488',
      label: 'BUS-01',
      status: 'SCANNING',
      nextStop: 'South Causeway Approach',
      occupancy: 62,
      lastDetection: 'Pavement Crack Anomaly',
      cameraStatus: 'ACTIVE (Edge Detection)',
    },
    // Bus 7: BUS-05 on Harbor Maritime Loop
    {
      id: 'BUS-05',
      routeId: 'S5',
      routeName: 'Route 8 Harbor Maritime Feeder',
      progress: (routes[8]?.totalLength || 2200) * 0.40,
      speed: 0.64,
      displaySpeed: 34,
      direction: 1,
      color: '#00AFC6',
      label: 'BUS-05',
      status: 'IN TRANSIT',
      nextStop: 'Container Terminal Gate 4',
      occupancy: 69,
      lastDetection: 'Lane Edge Erosion',
      cameraStatus: 'ACTIVE (Jetson Orin)',
    },
    // Bus 8: BUS-09 on Bus Operations Transitway
    {
      id: 'BUS-09',
      routeId: 'S6',
      routeName: 'Route 6 Depot Shuttle (Central to Depot)',
      progress: (routes[9]?.totalLength || 900) * 0.50,
      speed: 0.62,
      displaySpeed: 32,
      direction: 1,
      color: '#0284c7',
      label: 'BUS-09',
      status: 'SCANNING',
      nextStop: 'Fleet Maintenance Stall 3',
      occupancy: 42,
      lastDetection: 'Expansion Joint Separation',
      cameraStatus: 'ACTIVE (IR + RGB Dual)',
    },
  ];

  // 6. Civilian Vehicles (22 cars and utility vehicles)
  const civilianVehicles: CivilianVehicle[] = [
    { id: 'CV1', routeId: 'H1', progress: (routes[0]?.totalLength || 3500) * 0.15, speed: 0.95, direction: 1, color: 'rgba(82, 96, 113, 0.8)' },
    { id: 'CV2', routeId: 'H1', progress: (routes[0]?.totalLength || 3500) * 0.32, speed: 0.92, direction: -1, color: 'rgba(2, 132, 199, 0.8)' },
    { id: 'CV3', routeId: 'H1', progress: (routes[0]?.totalLength || 3500) * 0.60, speed: 1.05, direction: 1, color: 'rgba(0, 175, 198, 0.8)' }, // On Grand Bridge
    { id: 'CV4', routeId: 'H1', progress: (routes[0]?.totalLength || 3500) * 0.68, speed: 0.98, direction: -1, color: 'rgba(82, 96, 113, 0.8)' }, // On Grand Bridge
    { id: 'CV5', routeId: 'H1', progress: (routes[0]?.totalLength || 3500) * 0.85, speed: 0.94, direction: 1, color: 'rgba(13, 148, 136, 0.8)' },
    { id: 'CV6', routeId: 'H2', progress: (routes[1]?.totalLength || 2300) * 0.20, speed: 0.88, direction: 1, color: 'rgba(82, 96, 113, 0.8)' },
    { id: 'CV7', routeId: 'H2', progress: (routes[1]?.totalLength || 2300) * 0.55, speed: 0.90, direction: -1, color: 'rgba(2, 132, 199, 0.8)' },
    { id: 'CV8', routeId: 'H2', progress: (routes[1]?.totalLength || 2300) * 0.80, speed: 0.92, direction: 1, color: 'rgba(82, 96, 113, 0.8)' },
    { id: 'CV9', routeId: 'H3', progress: (routes[2]?.totalLength || 2300) * 0.25, speed: 0.91, direction: 1, color: 'rgba(0, 175, 198, 0.8)' },
    { id: 'CV10', routeId: 'H3', progress: (routes[2]?.totalLength || 2300) * 0.70, speed: 0.89, direction: -1, color: 'rgba(82, 96, 113, 0.8)' },
    { id: 'CV11', routeId: 'H4', progress: (routes[3]?.totalLength || 2300) * 0.30, speed: 0.93, direction: 1, color: 'rgba(2, 132, 199, 0.8)' },
    { id: 'CV12', routeId: 'H4', progress: (routes[3]?.totalLength || 2300) * 0.65, speed: 0.95, direction: -1, color: 'rgba(13, 148, 136, 0.8)' },
    { id: 'CV13', routeId: 'S1', progress: (routes[4]?.totalLength || 3500) * 0.25, speed: 0.86, direction: 1, color: 'rgba(82, 96, 113, 0.8)' },
    { id: 'CV14', routeId: 'S1', progress: (routes[4]?.totalLength || 3500) * 0.70, speed: 0.88, direction: -1, color: 'rgba(82, 96, 113, 0.8)' }, // On North Bridge
    { id: 'CV15', routeId: 'S2', progress: (routes[5]?.totalLength || 3500) * 0.35, speed: 0.85, direction: 1, color: 'rgba(2, 132, 199, 0.8)' },
    { id: 'CV16', routeId: 'S2', progress: (routes[5]?.totalLength || 3500) * 0.62, speed: 0.87, direction: -1, color: 'rgba(0, 175, 198, 0.8)' }, // On South Causeway
    { id: 'CV17', routeId: 'S3', progress: (routes[6]?.totalLength || 1200) * 0.40, speed: 0.90, direction: 1, color: 'rgba(82, 96, 113, 0.8)' },
    { id: 'CV18', routeId: 'S4', progress: (routes[7]?.totalLength || 1000) * 0.50, speed: 0.89, direction: 1, color: 'rgba(82, 96, 113, 0.8)' },
    { id: 'CV19', routeId: 'S5', progress: (routes[8]?.totalLength || 2200) * 0.60, speed: 0.84, direction: 1, color: 'rgba(13, 148, 136, 0.8)' },
    { id: 'CV20', routeId: 'H1', progress: (routes[0]?.totalLength || 3500) * 0.45, speed: 0.96, direction: 1, color: 'rgba(2, 132, 199, 0.8)' },
    { id: 'CV21', routeId: 'H2', progress: (routes[1]?.totalLength || 2300) * 0.35, speed: 0.90, direction: -1, color: 'rgba(82, 96, 113, 0.8)' },
    { id: 'CV22', routeId: 'S1', progress: (routes[4]?.totalLength || 3500) * 0.50, speed: 0.87, direction: 1, color: 'rgba(0, 175, 198, 0.8)' },
  ];

  // 7. Telemetry Particles
  const movingTelemetry: TelemetryParticle[] = [
    { routeId: 'H1', progress: 400, speed: 1.5, size: 2.5, color: '#00AFC6', label: 'GPS' },
    { routeId: 'H1', progress: 2150, speed: 1.6, size: 2.6, color: '#0284c7', label: 'AI_SCAN' },
    { routeId: 'H2', progress: 700, speed: 1.4, size: 2.3, color: '#0d9488', label: 'TELEMETRY' },
    { routeId: 'H3', progress: 1200, speed: 1.5, size: 2.5, color: '#00AFC6', label: 'BUS_STREAM' },
    { routeId: 'S1', progress: 1000, speed: 1.4, size: 2.3, color: '#0284c7', label: 'GPS' },
    { routeId: 'S2', progress: 1800, speed: 1.3, size: 2.3, color: '#0d9488', label: 'AI_SCAN' },
  ];

  // 8. Problem Markers mapped to real problem records
  const getRealId = (index: number, fallback: string) => {
    return issues[index]?.id || fallback;
  };

  const problemMarkers: ProblemMarker[] = [
    // Marker 1: RV-0001 (CRITICAL - Grand Suspension Bridge Approach)
    {
      id: 'marker-rv-0001',
      problemId: getRealId(0, 'RV-0001'),
      district: 'bridge',
      x: 2020,
      y: 1000,
      phase: 0.0,
      type: 'CRITICAL',
      roadLabel: 'Grand Bridge West Approach',
    },
    // Marker 2: RV-0002 (MEDIUM - Northern River Parkway Bridge)
    {
      id: 'marker-rv-0002',
      problemId: getRealId(1, 'RV-0002'),
      district: 'north',
      x: 2380,
      y: 420,
      phase: 1.1,
      type: 'MEDIUM',
      roadLabel: 'North Parkway River Span',
    },
    // Marker 3: RV-0003 (SOLVED - South Causeway Repaired)
    {
      id: 'marker-rv-0003',
      problemId: getRealId(2, 'RV-0003'),
      district: 'depot',
      x: 2150,
      y: 1580,
      phase: 0.8,
      type: 'SOLVED',
      roadLabel: 'South Causeway Approach',
    },
    // Marker 4: RV-0004 (CRITICAL - West Cloverleaf Interchange)
    {
      id: 'marker-rv-0004',
      problemId: getRealId(3, 'RV-0004'),
      district: 'west',
      x: 750,
      y: 1000,
      phase: 2.1,
      type: 'CRITICAL',
      roadLabel: 'West Cloverleaf Flyover',
    },
    // Marker 5: RV-0005 (SOLVED - East Maritime Port Sector 4)
    {
      id: 'marker-rv-0005',
      problemId: getRealId(4, 'RV-0005'),
      district: 'bridge',
      x: 2950,
      y: 1000,
      phase: 4.8,
      type: 'SOLVED',
      roadLabel: 'Maritime Freight Corridor',
    },
    // Marker 6: RV-0006 (MEDIUM - Tech Innovation Quad Intersection)
    {
      id: 'marker-rv-0006',
      problemId: getRealId(5, 'RV-0006'),
      district: 'tech',
      x: 1600,
      y: 420,
      phase: 3.2,
      type: 'MEDIUM',
      roadLabel: 'Tech Campus Boulevard',
    },
    // Marker 7: RV-0007 (CRITICAL - Grand Bridge East Overpass)
    {
      id: 'marker-rv-0007',
      problemId: getRealId(6, 'RV-0007'),
      district: 'bridge',
      x: 2470,
      y: 1000,
      phase: 4.2,
      type: 'CRITICAL',
      roadLabel: 'Grand Bridge East Overpass',
    },
    // Marker 8: RV-0008 (MEDIUM - Airport Access Expressway)
    {
      id: 'marker-rv-0008',
      problemId: getRealId(7, 'RV-0008'),
      district: 'north',
      x: 480,
      y: 420,
      phase: 5.3,
      type: 'MEDIUM',
      roadLabel: 'Airport Cargo Terminal Corridor',
    },
    // Marker 9: RV-0009 (SOLVED - South Bus Depot Gateway)
    {
      id: 'marker-rv-0009',
      problemId: getRealId(8, 'RV-0009'),
      district: 'depot',
      x: 1600,
      y: 1580,
      phase: 2.7,
      type: 'SOLVED',
      roadLabel: 'South Depot Maintenance Gateway',
    },
    // Marker 10: RV-0010 (CRITICAL - Grand Central Hub West Sliproad)
    {
      id: 'marker-rv-0010',
      problemId: getRealId(9, 'RV-0010'),
      district: 'center',
      x: 1520,
      y: 1000,
      phase: 1.5,
      type: 'CRITICAL',
      roadLabel: 'Central Concourse Sliproad',
    },
  ];

  return {
    bridges,
    cityBlocks,
    routes,
    junctionNodes,
    transitBuses,
    civilianVehicles,
    movingTelemetry,
    problemMarkers,
  };
};
