import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CityMap } from './components/CityMap';
import { LiveAlertPanel } from './components/LiveAlertPanel';
import { IssueDetailModal } from './components/IssueDetailModal';
import { BusCameraHUDModal } from './components/BusCameraHUDModal';
import { SimulateDetectionModal } from './components/SimulateDetectionModal';
import { AuthorityActionModal } from './components/AuthorityActionModal';
import { LayerManagerPanel } from './components/LayerManagerPanel';
import { UploadInterfaceModal } from './components/UploadInterfaceModal';
import { AssignProblemModal } from './components/AssignProblemModal';
import { SolveProblemModal } from './components/SolveProblemModal';
import { ToastContainer } from './components/ToastContainer';
import { 
  RoadIssue, 
  BusFleet, 
  ActiveLayer, 
  IssueType, 
  Severity,
  AppNotification,
  ToastAlert,
  NotificationType
} from './types';
import { initialRoadIssues, initialBusFleet, generateEvidenceDataUrl } from './data/mockRoadData';
import { AlertTriangle, Bell, CheckCircle2, Sparkles, X } from 'lucide-react';

export default function App() {
  const [issues, setIssues] = useState<RoadIssue[]>(() => {
    const saved = localStorage.getItem('roadvision_issues');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialRoadIssues;
  });

  const [busFleet, setBusFleet] = useState<BusFleet[]>(initialBusFleet);
  const [selectedIssue, setSelectedIssue] = useState<RoadIssue | null>(null);
  const [selectedBusForHUD, setSelectedBusForHUD] = useState<BusFleet | null>(null);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('AI_LAYER');
  const [trackingTab, setTrackingTab] = useState<'PENDING' | 'IN_PROGRESS' | 'SOLVED'>('PENDING');
  const [filterType, setFilterType] = useState<IssueType | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'ALL'>('ALL');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [problemToSolve, setProblemToSolve] = useState<RoadIssue | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
  const [problemToAssign, setProblemToAssign] = useState<RoadIssue | null>(null);
  const [showLayerManager, setShowLayerManager] = useState(false);

  // Fetch persisted problems from backend on initial mount
  useEffect(() => {
    fetch('/api/problems', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then((res) => {
        const contentType = res.headers.get('content-type') || '';
        return res.ok && contentType.includes('application/json') ? res.json() : null;
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.problems) && data.problems.length > 0) {
          const backendIssues: RoadIssue[] = data.problems.map((p: any) => {
            const resolvedLocName = p.locationName || (typeof p.location === 'string' ? p.location : p.location?.address || p.location?.city) || (p.lat && p.lng ? `${p.lat.toFixed(4)}°N, ${p.lng.toFixed(4)}°E` : 'Location not selected');
            const resolvedLat = typeof p.lat === 'number' ? p.lat : (p.location?.latitude || 0);
            const resolvedLng = typeof p.lng === 'number' ? p.lng : (p.location?.longitude || 0);
            const hasLocation = p.hasSelectedLocation ?? (resolvedLat !== 0 && resolvedLng !== 0);

            return {
              ...p,
              id: p.id,
              type: p.type || 'pothole',
              title: p.title || `Detected Hazard ${p.id}`,
              locationName: resolvedLocName,
              lat: resolvedLat,
              lng: resolvedLng,
              hasSelectedLocation: hasLocation,
              location: p.location && typeof p.location === 'object' ? p.location : (hasLocation ? {
                latitude: resolvedLat,
                longitude: resolvedLng,
                address: resolvedLocName,
                formattedAddress: resolvedLocName,
              } : undefined),
              googleMapsUrl: p.googleMapsUrl || (hasLocation ? `https://www.google.com/maps?q=${resolvedLat.toFixed(6)},${resolvedLng.toFixed(6)}` : undefined),
              severity: p.severity || 'HIGH',
              confidence: p.confidence || 94,
              busId: p.busId || 'BUS-03',
              busRoute: p.busRoute || 'Route 1',
              timestamp: p.timestamp || new Date().toLocaleString(),
              status: p.status || 'PENDING',
              verification: p.verification || 'Pending Verification',
              evidenceImage: p.evidenceImage || p.image || '/results/result_1789567316953_vgh5qcj.jpg',
              boundingBoxes: p.boundingBoxes || [],
              assignedAuthority: p.assignedAuthority,
              assignedDept: p.assignedDept,
              assignedPerson: p.assignedPerson,
              assignedCrew: p.assignedCrew,
              workOrderId: p.workOrderId,
              repairNotes: p.repairNotes,
              repairMaterials: p.repairMaterials,
              repairCostEstimateInr: p.repairCostEstimateInr,
              afterRepairImage: p.afterRepairImage,
              dispatchedAt: p.dispatchedAt,
              resolvedAt: p.resolvedAt,
              roadCondition: p.roadCondition,
              priority: p.priority,
              dueDate: p.dueDate,
              notes: p.notes,
              authorityNotes: p.authorityNotes,
              workflowHistory: p.workflowHistory,
              telemetry: p.telemetry || {
                speedKmh: 38,
                zVibrationG: 1.8,
                roadRoughnessIRI: 5.2,
                cameraFov: 'Forward Bus Dashcam',
                weatherCondition: 'Clear Sunlight',
              },
            };
          });

          setIssues(backendIssues);
          try {
            localStorage.setItem('roadvision_issues', JSON.stringify(backendIssues));
          } catch (e) {
            console.error(e);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend problems load note:', err);
      });
  }, []);

  // Real-Time Notification System State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      type: 'CRITICAL',
      title: 'Pothole detected on Station Road',
      description: 'RV-0001 • 8cm depth • High severity',
      problemId: 'RV-0001',
      vehicleId: 'BUS-01',
      timestamp: '2 min ago',
      severity: 'HIGH',
      isRead: false,
      linkIssueId: 'RV-0001',
      thumbnail: '/results/result_1789567316953_vgh5qcj.jpg',
    },
    {
      id: 'notif-2',
      type: 'MEDIUM',
      title: 'Waterlogging detected near Civil Hospital Road',
      description: 'RV-0002 • 15m ahead • Medium severity',
      problemId: 'RV-0002',
      vehicleId: 'BUS-03',
      timestamp: '14 min ago',
      severity: 'MEDIUM',
      isRead: false,
      linkIssueId: 'RV-0002',
      thumbnail: '/results/result_1789567373106_u0r393q.jpg',
    },
    {
      id: 'notif-3',
      type: 'SYSTEM',
      title: 'Model refreshed successfully',
      description: 'YOLOv8 • Version 1.4 • Inference pipeline synced',
      timestamp: '28 min ago',
      isRead: true,
    },
    {
      id: 'notif-4',
      type: 'CRITICAL',
      title: 'Severe Alligator Fatigue Cracking',
      description: 'RV-0003 • Shaktinath Highway Junction • High severity',
      problemId: 'RV-0003',
      vehicleId: 'BUS-02',
      timestamp: '42 min ago',
      severity: 'HIGH',
      isRead: true,
      linkIssueId: 'RV-0003',
      thumbnail: '/results/result_1789567373266_ba0c1y9.jpg',
    },
    {
      id: 'notif-5',
      type: 'SOLVED',
      title: 'Surface Cavity Repaired',
      description: 'RV-0005 • Work order completed by PWD Ward 4',
      problemId: 'RV-0005',
      timestamp: '1 hr ago',
      severity: 'LOW',
      isRead: true,
      linkIssueId: 'RV-0005',
    }
  ]);

  // Stack of active floating toast notifications (Bottom-Right)
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // Unique detection IDs already alerted to prevent duplicate notifications
  const alertedIssueIdsRef = useRef<Set<string>>(new Set(['RV-0002', 'RV-0003', 'RV-0005']));

  const pushToast = (toast: Omit<ToastAlert, 'id'> & { id?: string }) => {
    const toastId = toast.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastAlert = {
      ...toast,
      id: toastId,
      timestamp: toast.timestamp || 'Just now',
    };
    // Stack multiple notifications vertically (up to 4 alerts stacked cleanly)
    setToasts((prev) => [newToast, ...prev.filter((t) => t.id !== toastId).slice(0, 3)]);
    // Auto-dismiss after 7.5 seconds
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== toastId));
    }, 7500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Central Proactive Alert Generator connected directly to AI detections
  const triggerDetectionAlert = (issue: RoadIssue, options?: { showToast?: boolean }) => {
    if (!issue || !issue.id) return;
    alertedIssueIdsRef.current.add(issue.id);

    // Format local time HH:mm (e.g. 17:23)
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const isHighOrCritical = issue.severity === 'HIGH' || issue.priority === 'Critical';
    const isMedium = issue.severity === 'MEDIUM' || issue.priority === 'Medium';
    const notifType: NotificationType = isHighOrCritical ? 'CRITICAL' : isMedium ? 'MEDIUM' : 'PENDING';

    const locSnippet = (issue.locationName || 'Transit Corridor').split(',')[0].trim();
    const typeLabel = issue.type === 'pothole'
      ? 'Pothole'
      : issue.type === 'waterlogging'
      ? 'Waterlogging'
      : issue.type === 'road_damage'
      ? 'Fatigue Cracking'
      : issue.type === 'accident'
      ? 'Debris & Hazard'
      : issue.type.replace('_', ' ');

    const depthInfo = issue.estimatedDimensions?.depthCm
      ? `${issue.estimatedDimensions.depthCm}cm depth • `
      : '';
    const severityLabel = isHighOrCritical ? 'High severity' : isMedium ? 'Medium severity' : 'Low severity';

    // 1. Automatically create / update notification (increases unread count on bell)
    const newNotif: AppNotification = {
      id: `notif-${issue.id}`,
      type: notifType,
      title: `${typeLabel} detected on ${locSnippet}...`,
      description: `${issue.id} • ${depthInfo}${severityLabel}`,
      problemId: issue.id,
      vehicleId: issue.busId,
      timestamp: timeStr,
      severity: issue.severity,
      thumbnail: issue.evidenceImage,
      isRead: false,
      linkIssueId: issue.id,
    };

    setNotifications((prev) => [
      newNotif,
      ...prev.filter((n) => n.id !== newNotif.id && n.problemId !== issue.id),
    ]);

    // 2. Automatically show prominent floating notification toast without user clicking anything
    if (options?.showToast !== false) {
      pushToast({
        id: `toast-${issue.id}`,
        type: notifType,
        title: `${typeLabel} detected on ${locSnippet}...`,
        description: `${issue.id} • ${depthInfo}${severityLabel}`,
        problemId: issue.id,
        vehicleId: issue.busId,
        severity: issue.severity,
        thumbnail: issue.evidenceImage,
        timestamp: timeStr,
      });
    }
  };

  // Automatically pop proactive alert for recent detection on dashboard load
  useEffect(() => {
    const timer = setTimeout(() => {
      const primaryIssue = issues.find((i) => i.id === 'RV-0001') || issues[0];
      if (primaryIssue) {
        triggerDetectionAlert(primaryIssue, { showToast: true });
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleSelectNotification = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    const targetId = notif.linkIssueId || notif.problemId;
    if (targetId) {
      const found = issues.find((i) => i.id === targetId);
      if (found) {
        setSelectedIssue(found);
      }
    }
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleSelectToast = (toast: ToastAlert) => {
    if (toast.problemId) {
      const found = issues.find((i) => i.id === toast.problemId);
      if (found) {
        setSelectedIssue(found);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.problemId === toast.problemId ? { ...n, isRead: true } : n))
      );
    }
    dismissToast(toast.id);
  };

  // Real-time Clock (Strictly India Standard Time - Asia/Kolkata)
  const getISTTime = () => {
    try {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      return `${formatter.format(new Date())} IST`;
    } catch {
      return `${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false })} IST`;
    }
  };

  const [currentTime, setCurrentTime] = useState<string>(getISTTime);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('roadvision_issues', JSON.stringify(issues));
  }, [issues]);

  // Update Clock every second (Asia/Kolkata timezone)
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getISTTime());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Bus Movement Simulation Loop (advances buses along their predefined GPS transit routes)
  useEffect(() => {
    const interval = setInterval(() => {
      setBusFleet((prevFleet) =>
        prevFleet.map((bus) => {
          const coords = bus.routeCoordinates;
          if (!coords || coords.length < 2) return bus;

          let nextIdx = bus.currentWaypointIndex + bus.direction;
          let newDirection = bus.direction;

          if (nextIdx >= coords.length) {
            nextIdx = coords.length - 2;
            newDirection = -1;
          } else if (nextIdx < 0) {
            nextIdx = 1;
            newDirection = 1;
          }

          const targetCoord = coords[nextIdx];
          const currLat = bus.lat;
          const currLng = bus.lng;

          // Interpolate step towards target waypoint
          const stepFactor = 0.12;
          const newLat = currLat + (targetCoord[0] - currLat) * stepFactor;
          const newLng = currLng + (targetCoord[1] - currLng) * stepFactor;

          // Check if close to target waypoint to advance
          const distSq = (targetCoord[0] - newLat) ** 2 + (targetCoord[1] - newLng) ** 2;
          const advancedIdx = distSq < 0.00001 ? nextIdx : bus.currentWaypointIndex;

          return {
            ...bus,
            lat: newLat,
            lng: newLng,
            currentWaypointIndex: advancedIdx,
            direction: newDirection,
            speedKmh: Math.max(22, Math.min(58, bus.speedKmh + Math.floor((Math.random() - 0.5) * 4))),
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Continuous Autonomous Edge AI Detection Loop (Fleet Patrol)
  useEffect(() => {
    const autonomousScanInterval = setInterval(() => {
      // Pick an active bus on the road
      const activeBuses = busFleet.filter((b) => b.cameraStatus === 'ACTIVE');
      if (activeBuses.length === 0) return;
      const selectedBus = activeBuses[Math.floor(Math.random() * activeBuses.length)];
      handleTriggerDetectionFromBus(selectedBus);
    }, 28000); // Autonomous real-time edge hazard detection every 28 seconds

    return () => clearInterval(autonomousScanInterval);
  }, [busFleet]);

  // Handle New Ingestion from Edge AI or Bus
  const handleIngestNewIssue = (newIssue: RoadIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
    setSelectedIssue(newIssue);

    // Persist to backend database as single source of truth
    fetch('/api/problems', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(newIssue),
    }).catch((err) => console.warn('Problem persist note:', err));

    // Automatically trigger proactive notification and floating toast
    triggerDetectionAlert(newIssue, { showToast: true });

    // Increment detections count on the reporting bus
    setBusFleet((prev) =>
      prev.map((b) =>
        b.id === newIssue.busId
          ? {
              ...b,
              detectionsCount: b.detectionsCount + 1,
              lastDetectionTime: 'Just now (' + new Date().toLocaleTimeString() + ')',
            }
          : b
      )
    );
  };

  // Ingest batch of detections flagged from uploaded road video or image
  const handleIngestMultipleDetections = (newIssues: RoadIssue[], generatedRouteBus?: BusFleet) => {
    setIssues((prev) => [...newIssues, ...prev]);

    // Persist batch to backend database
    if (newIssues.length > 0) {
      fetch('/api/problems', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(newIssues),
      }).catch((err) => console.warn('Problem batch persist note:', err));
    }

    if (generatedRouteBus) {
      setBusFleet((prev) => [
        generatedRouteBus,
        ...prev.filter((b) => b.id !== generatedRouteBus.id),
      ]);
    }

    if (newIssues.length > 0) {
      setSelectedIssue(newIssues[0]);

      // Automatically trigger notification & floating toast for each detection
      newIssues.forEach((issue) => {
        triggerDetectionAlert(issue, { showToast: true });
      });

      // Update reporting buses
      const busIds = new Set(newIssues.map((i) => i.busId));
      setBusFleet((prev) =>
        prev.map((b) => {
          if (busIds.has(b.id)) {
            const countForBus = newIssues.filter((i) => i.busId === b.id).length;
            return {
              ...b,
              detectionsCount: b.detectionsCount + countForBus,
              lastDetectionTime: 'Just now (Media Upload)',
            };
          }
          return b;
        })
      );
    }
  };

  // Update Existing Issue (e.g. from Detail Modal)
  const handleUpdateIssue = async (updated: RoadIssue, generatedBus?: BusFleet): Promise<boolean> => {
    // Optimistically update state
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    if (selectedIssue?.id === updated.id) {
      setSelectedIssue(updated);
    }
    try {
      localStorage.setItem(
        'roadvision_issues',
        JSON.stringify(issues.map((i) => (i.id === updated.id ? updated : i)))
      );
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Sync with backend database
    try {
      const res = await fetch(`/api/problems/${updated.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(updated),
      });
      const contentType = res.headers.get('content-type') || '';
      const data = res.ok && contentType.includes('application/json') ? await res.json() : null;

      if (!res.ok || (data && data.success === false)) {
        console.warn('Backend update failed:', data?.error);
        return false;
      }

      if (data?.problem) {
        const saved = data.problem;
        const finalMerged: RoadIssue = {
          ...updated,
          ...saved,
          lat: typeof saved.lat === 'number' && (saved.lat !== 0 || saved.lng !== 0) ? saved.lat : updated.lat,
          lng: typeof saved.lng === 'number' && (saved.lat !== 0 || saved.lng !== 0) ? saved.lng : updated.lng,
          locationName: saved.locationName || updated.locationName,
          evidenceImage: saved.evidenceImage || updated.evidenceImage,
        };
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? finalMerged : i)));
        if (selectedIssue?.id === updated.id) {
          setSelectedIssue(finalMerged);
        }
      }

      if (generatedBus) {
        setBusFleet((prev) => [
          generatedBus,
          ...prev.filter((b) => b.id !== generatedBus.id),
        ]);
        pushToast({
          id: `toast-route-${generatedBus.id}`,
          type: 'SYSTEM',
          title: `Bus Survey Route Deployed: ${generatedBus.routeName}`,
          description: `Fleet bus ${generatedBus.id} dispatched along inspection corridor`,
          vehicleId: generatedBus.id,
          severity: updated.severity,
        });
      }
      return true;
    } catch (e) {
      console.warn('Backend problem update sync note:', e);
      return false;
    }
  };

  // Linear Workflow: Authority Verification Action
  const handleVerifyProblem = async (issueId: string) => {
    try {
      const res = await fetch(`/api/problems/${issueId}/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ verifiedBy: 'Authorized Municipal Inspector', status: 'IN_PROGRESS' }),
      });
      const contentType = res.headers.get('content-type') || '';
      const data = res.ok && contentType.includes('application/json') ? await res.json() : null;
      if (data && data.success && data.problem) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  verification: 'Verified',
                  status: data.problem.status || 'IN_PROGRESS',
                  assignedAuthority: data.problem.assignedAuthority || undefined,
                  authorityNotes: data.problem.authorityNotes,
                  workflowHistory: data.problem.workflowHistory,
                }
              : i
          )
        );
        if (selectedIssue?.id === issueId) {
          setSelectedIssue((prev) =>
            prev
              ? {
                  ...prev,
                  verification: 'Verified',
                  status: data.problem.status || 'IN_PROGRESS',
                  assignedAuthority: data.problem.assignedAuthority || undefined,
                  authorityNotes: data.problem.authorityNotes,
                  workflowHistory: data.problem.workflowHistory,
                }
              : null
          );
        }
        return;
      }
    } catch (e) {
      console.warn('Backend verify call note:', e);
    }
    // Optimistic fallback
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, verification: 'Verified', status: 'IN_PROGRESS' } : i))
    );
    if (selectedIssue?.id === issueId) {
      setSelectedIssue((prev) => (prev ? { ...prev, verification: 'Verified', status: 'IN_PROGRESS' } : null));
    }
  };

  // Linear Workflow: Authority Rejection Action
  const handleRejectProblem = async (issueId: string) => {
    try {
      const res = await fetch(`/api/problems/${issueId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ reason: 'Rejected after municipal review: Non-actionable road variation' }),
      });
      const contentType = res.headers.get('content-type') || '';
      const data = res.ok && contentType.includes('application/json') ? await res.json() : null;
      if (data && data.success && data.problem) {
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  verification: 'Rejected',
                  status: 'Rejected',
                  workflowHistory: data.problem.workflowHistory,
                }
              : i
          )
        );
        if (selectedIssue?.id === issueId) {
          setSelectedIssue((prev) =>
            prev ? { ...prev, verification: 'Rejected', status: 'Rejected', workflowHistory: data.problem.workflowHistory } : null
          );
        }
        return;
      }
    } catch (e) {
      console.warn('Backend reject call note:', e);
    }
    // Optimistic fallback
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, verification: 'Rejected', status: 'Rejected' } : i))
    );
    if (selectedIssue?.id === issueId) {
      setSelectedIssue((prev) => (prev ? { ...prev, verification: 'Rejected', status: 'Rejected' } : null));
    }
  };

  // Linear Workflow: Assign Problem to Department Action
  const handleAssignProblem = async (
    issueId: string,
    assignmentData: {
      assignedAuthority: string;
      assignedDept: string;
      assignedPerson: string;
      priority: any;
      dueDate: string;
      notes: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/problems/${issueId}/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(assignmentData),
      });
      const contentType = res.headers.get('content-type') || '';
      const data = res.ok && contentType.includes('application/json') ? await res.json() : null;
      if (data && data.success && data.problem) {
        const p = data.problem;
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  assignedAuthority: p.assignedAuthority,
                  assignedDept: p.assignedDept,
                  assignedPerson: p.assignedPerson,
                  priority: p.priority,
                  dueDate: p.dueDate,
                  notes: p.notes,
                  status: i.status,
                  workflowHistory: p.workflowHistory,
                }
              : i
          )
        );
        if (selectedIssue?.id === issueId) {
          setSelectedIssue((prev) =>
            prev
              ? {
                  ...prev,
                  assignedAuthority: p.assignedAuthority,
                  assignedDept: p.assignedDept,
                  assignedPerson: p.assignedPerson,
                  priority: p.priority,
                  dueDate: p.dueDate,
                  notes: p.notes,
                  status: prev.status === 'Pending' || prev.status === 'PENDING' ? 'In Progress' : prev.status,
                  workflowHistory: p.workflowHistory,
                }
              : null
          );
        }
        return;
      }
    } catch (e) {
      console.warn('Backend assign call note:', e);
    }
    // Optimistic fallback
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? {
              ...i,
              ...assignmentData,
              status: i.status === 'Pending' || i.status === 'PENDING' ? 'In Progress' : i.status,
            }
          : i
      )
    );
    if (selectedIssue?.id === issueId) {
      setSelectedIssue((prev) =>
        prev
          ? {
              ...prev,
              ...assignmentData,
              status: prev.status === 'Pending' || prev.status === 'PENDING' ? 'In Progress' : prev.status,
            }
          : null
      );
    }
  };

  // Linear Workflow: Update Problem Status Action (Pending / In Progress / Solved)
  const handleUpdateStatus = async (
    issueId: string,
    status: 'Pending' | 'In Progress' | 'Solved' | 'PENDING' | 'IN_PROGRESS' | 'SOLVED',
    notes?: string
  ) => {
    const canonicalStatus =
      status === 'Solved' || status === 'SOLVED'
        ? 'SOLVED'
        : status === 'In Progress' || status === 'IN_PROGRESS'
        ? 'IN_PROGRESS'
        : 'PENDING';

    try {
      const res = await fetch(`/api/problems/${issueId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status: canonicalStatus, notes }),
      });
      const contentType = res.headers.get('content-type') || '';
      const data = res.ok && contentType.includes('application/json') ? await res.json() : null;
      if (data && data.success && data.problem) {
        const prob = data.problem;
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  status: prob.status || canonicalStatus,
                  notes: prob.notes || i.notes,
                  roadCondition: canonicalStatus === 'SOLVED' ? 'Repaired' : i.roadCondition,
                  workflowHistory: prob.workflowHistory || i.workflowHistory,
                  resolvedAt: canonicalStatus === 'SOLVED' ? (i.resolvedAt || new Date().toLocaleTimeString('en-IN') + ' IST') : i.resolvedAt,
                }
              : i
          )
        );
        if (selectedIssue?.id === issueId) {
          setSelectedIssue((prev) =>
            prev
              ? {
                  ...prev,
                  status: prob.status || canonicalStatus,
                  notes: prob.notes || prev.notes,
                  roadCondition: canonicalStatus === 'SOLVED' ? 'Repaired' : prev.roadCondition,
                  workflowHistory: prob.workflowHistory || prev.workflowHistory,
                  resolvedAt: canonicalStatus === 'SOLVED' ? (prev.resolvedAt || new Date().toLocaleTimeString('en-IN') + ' IST') : prev.resolvedAt,
                }
              : null
          );
        }
        return;
      }
    } catch (e) {
      console.warn('Backend status call note:', e);
    }
    // Optimistic fallback
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? {
              ...i,
              status: canonicalStatus,
              roadCondition: canonicalStatus === 'SOLVED' ? 'Repaired' : i.roadCondition,
              resolvedAt: canonicalStatus === 'SOLVED' ? (i.resolvedAt || new Date().toLocaleTimeString('en-IN') + ' IST') : i.resolvedAt,
            }
          : i
      )
    );
    if (selectedIssue?.id === issueId) {
      setSelectedIssue((prev) =>
        prev
          ? {
              ...prev,
              status: canonicalStatus,
              roadCondition: canonicalStatus === 'SOLVED' ? 'Repaired' : prev.roadCondition,
              resolvedAt: canonicalStatus === 'SOLVED' ? (prev.resolvedAt || new Date().toLocaleTimeString('en-IN') + ' IST') : prev.resolvedAt,
            }
          : null
      );
    }
  };

  // Trigger from Bus Camera HUD
  const handleTriggerDetectionFromBus = (bus: BusFleet) => {
    const timestampStr = new Date().toLocaleTimeString() + ' IST';
    const newId = `RV-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomTypes: IssueType[] = ['pothole', 'waterlogging', 'road_damage', 'accident'];
    const chosenType = randomTypes[Math.floor(Math.random() * randomTypes.length)];

    const titleMap: Record<IssueType, string> = {
      pothole: 'Deep Surface Cavity Cluster Detected',
      waterlogging: 'Critical Waterlogging Across Left Lane',
      road_damage: 'Severe Alligator Fatigue Cracking on Surface',
      accident: 'Obstruction & Debris Field on Carriageway',
      construction: 'Unscheduled Trenching Work',
      road_closed: 'Emergency Route Closure',
      traffic_anomaly: 'Vehicle Stoppage Anomaly',
    };

    const newIssue: RoadIssue = {
      id: newId,
      type: chosenType,
      title: titleMap[chosenType],
      locationName: `${bus.routeName} Corridor, Bharuch`,
      lat: bus.lat + (Math.random() - 0.5) * 0.002,
      lng: bus.lng + (Math.random() - 0.5) * 0.002,
      severity: chosenType === 'accident' || chosenType === 'pothole' ? 'HIGH' : 'MEDIUM',
      confidence: Math.round((89 + Math.random() * 9) * 10) / 10,
      busId: bus.id,
      busRoute: bus.routeName,
      timestamp: `${new Date().toISOString().split('T')[0]} ${timestampStr}`,
      status: 'PENDING',
      verification: 'AI_DETECTED',
      evidenceImage: generateEvidenceDataUrl(chosenType, titleMap[chosenType], bus.id, timestampStr),
      boundingBoxes: [
        {
          id: `box-${Date.now()}`,
          label: `${chosenType}_event`,
          confidence: 94.2,
          x: 35,
          y: 40,
          width: 35,
          height: 30,
          color: chosenType === 'accident' || chosenType === 'pothole' ? '#ef4444' : '#f59e0b',
        }
      ],
      telemetry: {
        speedKmh: bus.speedKmh,
        zVibrationG: chosenType === 'pothole' ? 2.62 : 0.94,
        roadRoughnessIRI: 5.6,
        cameraFov: '120° Wide Angle Front Dashcam',
        weatherCondition: 'Clear',
      },
      estimatedDimensions: {
        depthCm: chosenType === 'pothole' ? 8.2 : undefined,
        lengthM: 1.8,
        widthM: 1.2,
        blockedLanes: 1,
      },
      roadCondition: 'Critical',
      priorityScore: 90,
    };

    handleIngestNewIssue(newIssue);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-smart-grid text-[#172033] font-sans antialiased relative selection:bg-cyan-500/20 selection:text-cyan-900">
      
      {/* 1. Header Bar with BEL & System Status */}
      <Header
        activeLayer={activeLayer}
        setActiveLayer={(layer) => {
          setActiveLayer(layer);
          if (layer === 'AI_LAYER') {
            setShowLayerManager(false);
          } else {
            setShowLayerManager(true);
          }
        }}
        issues={issues}
        busFleet={busFleet}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
        onOpenBusCameraModal={(busId) => {
          const b = busId ? busFleet.find((f) => f.id === busId) : busFleet[0];
          setSelectedBusForHUD(b || busFleet[0]);
        }}
        onOpenManualAddModal={() => setIsManualAddModalOpen(true)}
        currentTime={currentTime}
        trackingTab={trackingTab}
        setTrackingTab={setTrackingTab}
        notifications={notifications}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onSelectNotification={handleSelectNotification}
      />

      {/* Main Workspace Layout: City Map (Primary Panel ~70%) + Live Alert Panel (Side Panel ~30%) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Primary View: City Map Visualization (~70%) */}
        <main className="w-full lg:w-[70%] h-full relative overflow-hidden flex flex-col">
          <CityMap
            issues={issues}
            busFleet={busFleet}
            selectedIssue={selectedIssue}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            onSelectBus={(bus) => setSelectedBusForHUD(bus)}
            filterType={filterType}
            setFilterType={setFilterType}
            filterSeverity={filterSeverity}
            setFilterSeverity={setFilterSeverity}
          />
        </main>

        {/* Side Panel: Real-Time Live Alert Feed (~30%) */}
        <div className="w-full lg:w-[30%] h-full flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l border-[#D5DEE8]">
          <LiveAlertPanel
            issues={issues}
            selectedIssue={selectedIssue}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            onOpenEvidence={(issue) => setSelectedIssue(issue)}
            filterType={filterType}
            setFilterType={setFilterType}
            filterSeverity={filterSeverity}
            setFilterSeverity={setFilterSeverity}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
          />
        </div>

      </div>

      {/* Workflow Panel for Authority & Verification / Problem Status Tracking (AI Detection bottom section removed) */}
      {showLayerManager && activeLayer !== 'AI_LAYER' && (
        <LayerManagerPanel
          activeLayer={activeLayer}
          issues={issues}
          onSelectIssue={(issue) => setSelectedIssue(issue)}
          onUpdateIssue={handleUpdateIssue}
          onOpenAssignModal={(issue) => setProblemToAssign(issue)}
          onVerifyProblem={handleVerifyProblem}
          onRejectProblem={handleRejectProblem}
          onUpdateStatus={(issueId, status) => {
            if (status === 'Solved' || status === 'SOLVED') {
              const prob = issues.find((i) => i.id === issueId);
              if (prob) setProblemToSolve(prob);
            } else {
              handleUpdateStatus(issueId, status);
            }
          }}
          onClose={() => setShowLayerManager(false)}
          trackingTab={trackingTab}
          setTrackingTab={setTrackingTab}
        />
      )}

      {/* Floating Real-Time Alert Toasts (Bottom-Right) */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onSelectToast={handleSelectToast}
      />

      {/* Modal 1: Issue Detail View */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdateIssue={handleUpdateIssue}
          onOpenAssignModal={(issue) => setProblemToAssign(issue)}
        />
      )}

      {/* Modal 6: Assign Problem to Municipal Authority / Department */}
      {problemToAssign && (
        <AssignProblemModal
          isOpen={!!problemToAssign}
          issue={problemToAssign}
          onClose={() => setProblemToAssign(null)}
          onAssign={handleAssignProblem}
        />
      )}

      {/* Modal 7: Solve Problem Completion */}
      {problemToSolve && (
        <SolveProblemModal
          isOpen={!!problemToSolve}
          issue={problemToSolve}
          onClose={() => setProblemToSolve(null)}
          onSolve={async (id, notes) => {
            await handleUpdateStatus(id, 'Solved', notes);
          }}
        />
      )}

      {/* Modal 2: Bus Dashcam HUD Viewer */}
      {selectedBusForHUD && (
        <BusCameraHUDModal
          bus={selectedBusForHUD}
          busFleet={busFleet}
          onClose={() => setSelectedBusForHUD(null)}
          onSelectBus={(b) => setSelectedBusForHUD(b)}
          onTriggerDetectionFromBus={handleTriggerDetectionFromBus}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />
      )}

      {/* Modal 3: Simulate Edge Ingestion Packet */}
      {isSimulateModalOpen && (
        <SimulateDetectionModal
          busFleet={busFleet}
          onClose={() => setIsSimulateModalOpen(false)}
          onIngestDetection={handleIngestNewIssue}
        />
      )}

      {/* Modal 4: Manual Authority Action / Road Closure Entry */}
      {isManualAddModalOpen && (
        <AuthorityActionModal
          onClose={() => setIsManualAddModalOpen(false)}
          onAddManualIssue={handleIngestNewIssue}
        />
      )}

      {/* Modal 5: Upload Road Video / Photo Ingestion Interface */}
      {isUploadModalOpen && (
        <UploadInterfaceModal
          busFleet={busFleet}
          onClose={() => setIsUploadModalOpen(false)}
          onIngestDetections={handleIngestMultipleDetections}
        />
      )}

    </div>
  );
}
