/**
 * AQUATWIN LOCAL SIMULATION SANDBOX (100% INDEPENDENT)
 * 
 * This file implements a fully isolated client-side (frontend-only) digital twin simulation sandbox.
 * It intercepts all HTTP requests (GET, POST, PATCH, DELETE) and Socket.IO connections made by 
 * the nested TopologyCanvas component to ensure that the Analytics page runs completely in-memory
 * without writing to or reading from the live backend database or socket streams.
 */
import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import axios from 'axios';
import {
  Play, Square, RotateCcw, AlertTriangle, CheckCircle,
  Thermometer
} from 'lucide-react';
const TopologyCanvas = React.lazy(() => import('./TopologyCanvas'));
import { useTheme } from '../components/ThemeProvider';

const BACKEND_URL = 'http://localhost:3001';

export default function WaterDistributionLiveAnalytics({ globalTopologyId }: { globalTopologyId: number | string | null }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // --- States for Simulation Parameters Setup panel ---
  const [initialLevel, setInitialLevel] = useState<number>(50.0);
  const [tds, setTds] = useState<number>(180);
  const [ph, setPh] = useState<number>(7.2);
  const [temperature, setTemperature] = useState<number>(25.0);
  const [scenario, setScenario] = useState<string>('Normal Operation');
  const [simulationSpeed, setSimulationSpeed] = useState<string>('1x (Real-time)');
  const [solventGrams, setSolventGrams] = useState<number>(150);
  const [motorSpeed, setMotorSpeed] = useState<number>(1450);
  const [targetFlow, setTargetFlow] = useState<number>(5.2);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [topologyName, setTopologyName] = useState<string>('Live Water Distribution');

  // --- Simulation Sandbox State (Independent variables) ---
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [localTopologyData, setLocalTopologyData] = useState<any>(null);
  const [simulatedCentralLevel, setSimulatedCentralLevel] = useState<number>(50.0);
  const [simulatedTank1Level, setSimulatedTank1Level] = useState<number>(0.0);
  const [simulatedTank2Level, setSimulatedTank2Level] = useState<number>(0.0);
  const [simulatedTank3Level, setSimulatedTank3Level] = useState<number>(0.0);
  const [simulatedTank4Level, setSimulatedTank4Level] = useState<number>(0.0);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [simulatedTdsHistory, setSimulatedTdsHistory] = useState<number[]>([178, 180, 179, 181, 180, 182, 180]);

  // Track layout structure node mapping IDs
  const centralNodeIdRef = useRef<number | null>(null);
  const tank1NodeIdRef = useRef<number | null>(null);
  const tank2NodeIdRef = useRef<number | null>(null);
  const tank3NodeIdRef = useRef<number | null>(null);
  const tank4NodeIdRef = useRef<number | null>(null);
  const globalTopologyIdRef = useRef(globalTopologyId);
  globalTopologyIdRef.current = globalTopologyId;

  // Ref to hold the latest simulation parameters so the persistent axios interceptor
  // and WebSocket mock can read them without being re-registered.
  const simStateRef = useRef<any>({
    localTopologyData: null,
    simulatedCentralLevel: 50.0,
    simulatedTank1Level: 0.0,
    simulatedTank2Level: 0.0,
    simulatedTank3Level: 0.0,
    simulatedTank4Level: 0.0,
    ph: 7.2,
    tds: 180,
    temperature: 25.0
  });

  // 1. Fetch live layout structure ONCE on mount to build the simulation layout (bypass interceptor using query param)
  useEffect(() => {
    if (!globalTopologyId) return;
    setSimulatedLogs(prev => [`[Sandbox] Initializing offline sandbox layout for topology...`, ...prev].slice(0, 100));
    
    axios.get(`${BACKEND_URL}/api/topologies/${globalTopologyId}?bypass=true`)
      .then(res => {
        setTopologyName(res.data.name || 'Simulation Sandbox');
        
        // Cleanse database-persisted pump/valve status to ensure 100% initial isolation
        const cleansedNodes = (res.data.nodes || []).map((node: any) => {
          const attributes = { ...(node.attributes || {}) };
          if (node.nodeType === 'pump') {
            attributes.pumpOn = isSimulating && (motorSpeed > 0);
          } else if (node.nodeType === 'tank' || node.nodeType === 'central_tank') {
            // Delete these keys on initial load so they default dynamically inside the interceptor
            delete attributes.inletValveOn;
            delete attributes.outletValveOn;
          }
          return { ...node, attributes };
        });

        setLocalTopologyData({ ...res.data, nodes: cleansedNodes });
        
        cleansedNodes.forEach((node: any) => {
          if (node.nodeType !== 'tank' && node.nodeType !== 'central_tank') return;

          const nameClean = (node.nodeName || '').toLowerCase().replace(/[\s-_]/g, '');
          if (nameClean.includes('central')) {
            centralNodeIdRef.current = node.id;
          } else if (nameClean.includes('tank1') || nameClean.includes('t1')) {
            tank1NodeIdRef.current = node.id;
          } else if (nameClean.includes('tank2') || nameClean.includes('t2')) {
            tank2NodeIdRef.current = node.id;
          } else if (nameClean.includes('tank3') || nameClean.includes('t3')) {
            tank3NodeIdRef.current = node.id;
          } else if (nameClean.includes('tank4') || nameClean.includes('t4')) {
            tank4NodeIdRef.current = node.id;
          }
        });
      })
      .catch(console.error);
  }, [globalTopologyId]);

  // We run this exactly ONCE on mount,
  // ensuring the mock is installed BEFORE child components (TopologyCanvas) render/mount.
  useEffect(() => {
    // Hook into Axios Request to intercept all topology queries and modifications
    const interceptorId = axios.interceptors.request.use((config) => {
      const url = config.url || '';
      const method = (config.method || 'get').toLowerCase();

      // ─── LIVE TOPOLOGY GUARD ────────────────────────────────────────────────
      // This interceptor must ONLY be active while the user is on the /analytics
      // route. If the user navigates back to /topology/:id (the live topology),
      // every Axios request must pass through completely untouched so that outlet
      // valve toggles, pump controls, and all node attribute PATCHes reach the
      // real backend database unchanged.
      const isAnalyticsRoute = window.location.pathname.includes('/analytics');
      if (!isAnalyticsRoute) {
        return config;
      }

      // Intercept layout query — SIMULATION ONLY
      const currentTopologyId = globalTopologyIdRef.current;
      if (currentTopologyId && url.includes(`/api/topologies/${currentTopologyId}`) && !url.includes('bypass=true')) {
        config.adapter = async () => {
          const currentData = simStateRef.current.localTopologyData;
          if (!currentData) {
            return {
              data: { nodes: [] },
              status: 200,
              statusText: 'OK',
              headers: {},
              config
            };
          }
          // Return simulated node values inside the nodes data array
          const updatedNodes = currentData.nodes.map((node: any) => {
            const isCentral = Number(node.id) === centralNodeIdRef.current;
            const isT1 = Number(node.id) === tank1NodeIdRef.current;
            const isT2 = Number(node.id) === tank2NodeIdRef.current;
            const isT3 = Number(node.id) === tank3NodeIdRef.current;
            const isT4 = Number(node.id) === tank4NodeIdRef.current;

            let wl = 0;
            if (isCentral) wl = simStateRef.current.simulatedCentralLevel;
            else if (isT1) wl = simStateRef.current.simulatedTank1Level;
            else if (isT2) wl = simStateRef.current.simulatedTank2Level;
            else if (isT3) wl = simStateRef.current.simulatedTank3Level;
            else if (isT4) wl = simStateRef.current.simulatedTank4Level;

            const sensors = node.sensors?.map((s: any) => {
              if (s.sensorType === 'water_level') return { ...s, value: wl };
              if (s.sensorType === 'ph') return { ...s, value: simStateRef.current.ph };
              if (s.sensorType === 'tds') return { ...s, value: simStateRef.current.tds };
              if (s.sensorType === 'temperature') return { ...s, value: simStateRef.current.temperature };
              return s;
            }) || [];

            const attributes = { ...(node.attributes || {}) };
            if (node.nodeType === 'pump') {
              attributes.pumpOn = simStateRef.current.isSimulating && (simStateRef.current.motorSpeed > 0);
            } else if (node.nodeType === 'tank' || node.nodeType === 'central_tank') {
              if (simStateRef.current.isSimulating) {
                // If simulating, inlet default = ON (true)
                attributes.inletValveOn = node.attributes.inletValveOn !== undefined ? node.attributes.inletValveOn : true;
                // outlet default = ON (true) for central tank, OFF (false) for other tanks
                const defaultOutlet = node.nodeType === 'central_tank';
                attributes.outletValveOn = node.attributes.outletValveOn !== undefined ? node.attributes.outletValveOn : defaultOutlet;
              } else {
                // Force OFF when stopped
                attributes.inletValveOn = false;
                attributes.outletValveOn = false;
              }
            }

            return {
              ...node,
              sensors,
              attributes
            };
          });

          return {
            data: { ...currentData, nodes: updatedNodes },
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          };
        };
      }

      // Intercept layout modifications (patch node attributes) — SIMULATION ONLY
      if (url.includes(`/api/nodes/`) && method === 'patch') {
        const parts = url.split('/api/nodes/');
        const nodeId = parseInt(parts[1].split('/')[0]);
        const body = config.data;
        const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;

        // Apply attribute toggle in-memory locally
        setLocalTopologyData((prev: any) => {
          if (!prev) return prev;
          const newNodes = prev.nodes.map((node: any) => {
            if (node.id === nodeId) {
              return {
                ...node,
                attributes: {
                  ...(node.attributes || {}),
                  ...(parsedBody.attributes || {})
                }
              };
            }
            return node;
          });
          const newData = { ...prev, nodes: newNodes };
          simStateRef.current.localTopologyData = newData; // keep ref in sync immediately
          return newData;
        });

        config.adapter = async () => {
          return {
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          };
        };
      }

      // Block all other backend mutations (POST edges, DELETE edges, etc.) — SIMULATION ONLY
      if ((url.includes('/api/edges') || url.includes('/api/nodes')) && (method === 'post' || method === 'delete')) {
        config.adapter = async () => {
          return {
            data: { id: Math.round(Math.random() * 100000).toString(), success: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          };
        };
      }

      return config;
    });

    return () => {
      if ((window as any).__cleanWS) {
        (window as any).__cleanWS();
        delete (window as any).__cleanWS;
      }
      axios.interceptors.request.eject(interceptorId);
    };
  }, []);



  // 4. Evolve sensor parameters in SimulationSensorGenerator
  const displayFlowRate = useMemo(() => {
    const isPumpOn = isSimulating && motorSpeed > 0;
    if (!isPumpOn) return 0;

    let baseFlow = targetFlow * (motorSpeed / 1450);
    if (scenario === 'Mud Impurities') baseFlow *= Math.max(0.2, 1 - solventGrams * 0.002);
    if (scenario === 'Sand Impurities') baseFlow *= Math.max(0.3, 1 - solventGrams * 0.0015);
    return parseFloat(baseFlow.toFixed(1));
  }, [targetFlow, motorSpeed, scenario, solventGrams, isSimulating]);

  const displayPh = useMemo(() => {
    let finalPh = ph;
    if (scenario === 'Salt Impurities') finalPh = Math.max(0, ph - solventGrams * 0.005);
    else if (scenario === 'Mud Impurities') finalPh = Math.max(0, ph - solventGrams * 0.015);
    else if (scenario === 'Alkaline') finalPh = Math.min(14, ph + solventGrams * 0.035);
    return parseFloat(finalPh.toFixed(2));
  }, [ph, scenario, solventGrams]);

  const displayTds = useMemo(() => {
    let finalTds = tds;
    if (scenario === 'Salt Impurities') finalTds = tds + solventGrams * 4.0;
    else if (scenario === 'Mud Impurities') finalTds = tds + solventGrams * 2.0;
    else if (scenario === 'Sand Impurities') finalTds = tds + solventGrams * 0.8;
    else if (scenario === 'Alkaline') finalTds = tds + solventGrams * 1.5;
    return Math.round(finalTds);
  }, [tds, scenario, solventGrams]);

  const displayTemperature = useMemo(() => {
    let finalTemp = temperature;
    if (scenario === 'Salt Impurities') finalTemp = temperature + solventGrams * 0.01;
    return parseFloat(finalTemp.toFixed(1));
  }, [temperature, scenario, solventGrams]);

  const displayHealthIndex = useMemo(() => {
    let baseHealth = 98;
    if (scenario === 'Mud Impurities') baseHealth = Math.max(10, 98 - solventGrams * 0.15);
    else if (scenario === 'Sand Impurities') baseHealth = Math.max(20, 98 - solventGrams * 0.08);
    else if (scenario === 'Salt Impurities') baseHealth = Math.max(40, 98 - solventGrams * 0.05);
    else if (scenario === 'Alkaline') baseHealth = Math.max(30, 98 - solventGrams * 0.1);
    return Math.round(baseHealth);
  }, [scenario, solventGrams]);

  const pressure = useMemo(() => {
    const isPumpOn = isSimulating && motorSpeed > 0;
    if (!isPumpOn) return 0;

    return parseFloat((3.4 * (motorSpeed / 1450)).toFixed(1));
  }, [motorSpeed, isSimulating]);

  // Update simulated TDS sparkline history
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimulatedTdsHistory(prev => [...prev, displayTds].slice(-7));
    }, 3000);
    return () => clearInterval(interval);
  }, [isSimulating, displayTds]);

  // Calculate local simulated alerts based on thresholds
  const alertsList = useMemo(() => {
    const list = [];
    if (displayTds > 700) {
      list.push({
        id: 'alt-tds',
        alertType: 'TDS breach',
        severity: 'Critical',
        message: `TDS concentration (${displayTds} mg/L) exceeded the safety threshold limit of 700 mg/L.`,
        createdAt: new Date()
      });
    }
    if (displayPh < 6.5 || displayPh > 8.5) {
      list.push({
        id: 'alt-ph',
        alertType: 'pH anomaly',
        severity: 'Warning',
        message: `pH level index (${displayPh.toFixed(2)}) is outside the safe range (6.5 - 8.5).`,
        createdAt: new Date()
      });
    }
    if (displayHealthIndex < 80) {
      list.push({
        id: 'alt-health',
        alertType: 'Degraded Health',
        severity: 'Warning',
        message: `Twin filter health index dropped to ${displayHealthIndex}%. Remediation recommended.`,
        createdAt: new Date()
      });
    }
    return list;
  }, [displayTds, displayPh, displayHealthIndex]);

  // 5. Dynamic Contamination Custom CSS styling
  const contaminationStyles = useMemo(() => {
    if (scenario === 'Normal Operation') return {};
    
    const g = solventGrams;
    const f = Math.min(200, g) / 200; // max effect at 200g
    
    const mix = (c1: string, c2: string, pct: number) => {
      const r1 = parseInt(c1.substring(1, 3), 16);
      const g1 = parseInt(c1.substring(3, 5), 16);
      const b1 = parseInt(c1.substring(5, 7), 16);
      const r2 = parseInt(c2.substring(1, 3), 16);
      const g2 = parseInt(c2.substring(3, 5), 16);
      const b2 = parseInt(c2.substring(5, 7), 16);
      const r = Math.round(r1 + (r2 - r1) * pct);
      const g = Math.round(g1 + (g2 - g1) * pct);
      const b = Math.round(b1 + (b2 - b1) * pct);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    let targetColors = {
      frontTop: '#22D3EE', frontBottom: '#0D9488',
      midTop: '#67E8F9', midBottom: '#0F766E',
      backTop: '#A5F3FC', backBottom: '#115E59',
      pipeCore: '#06B6D4', pipeShimmer: '#A5F3FC',
      pipeFast1: '#22D3EE', pipeFast2: '#0D9488'
    };

    if (scenario === 'Mud Impurities') {
      targetColors = {
        frontTop: '#4B3621', frontBottom: '#2F1F10',
        midTop: '#5A4531', midBottom: '#3B2816',
        backTop: '#6E5A48', backBottom: '#433221',
        pipeCore: '#4B3621', pipeShimmer: '#6E5A48',
        pipeFast1: '#5A4531', pipeFast2: '#3B2816'
      };
    } else if (scenario === 'Sand Impurities') {
      targetColors = {
        frontTop: '#E6C280', frontBottom: '#B8934D',
        midTop: '#EDD49E', midBottom: '#A8833B',
        backTop: '#F5E6C4', backBottom: '#8A6A2A',
        pipeCore: '#E6C280', pipeShimmer: '#F5E6C4',
        pipeFast1: '#EDD49E', pipeFast2: '#A8833B'
      };
    } else if (scenario === 'Salt Impurities') {
      targetColors = {
        frontTop: '#F8FAFC', frontBottom: '#CBD5E1',
        midTop: '#FFFFFF', midBottom: '#E2E8F0',
        backTop: '#FFFFFF', backBottom: '#F1F5F9',
        pipeCore: '#F8FAFC', pipeShimmer: '#FFFFFF',
        pipeFast1: '#FFFFFF', pipeFast2: '#CBD5E1'
      };
    } else if (scenario === 'Alkaline') {
      targetColors = {
        frontTop: '#8B5CF6', frontBottom: '#4C1D95',
        midTop: '#A78BFA', midBottom: '#5B21B6',
        backTop: '#C4B5FD', backBottom: '#6D28D9',
        pipeCore: '#8B5CF6', pipeShimmer: '#C4B5FD',
        pipeFast1: '#A78BFA', pipeFast2: '#5B21B6'
      };
    }

    return {
      '--tank-water-front-top': mix('#22D3EE', targetColors.frontTop, f),
      '--tank-water-front-bottom': mix('#0D9488', targetColors.frontBottom, f),
      '--tank-water-mid-top': mix('#67E8F9', targetColors.midTop, f),
      '--tank-water-mid-bottom': mix('#0F766E', targetColors.midBottom, f),
      '--tank-water-back-top': mix('#A5F3FC', targetColors.backTop, f),
      '--tank-water-back-bottom': mix('#115E59', targetColors.backBottom, f),
      '--tank-water-stream-start': mix('#22D3EE', targetColors.frontTop, f),
      '--tank-water-stream-end': mix('#0D9488', targetColors.frontBottom, f),
      '--water-pipe-core': mix('#06B6D4', targetColors.pipeCore, f),
      '--water-pipe-shimmer': mix('#A5F3FC', targetColors.pipeShimmer, f),
      '--water-pipe-fast1': mix('#22D3EE', targetColors.pipeFast1, f),
      '--water-pipe-fast2': mix('#0D9488', targetColors.pipeFast2, f)
    } as React.CSSProperties;
  }, [scenario, solventGrams]);

  // 3. Simulation Engine: Advance local sandbox physics & trigger mock socket callbacks
  useEffect(() => {
    if (!isSimulating || !localTopologyData) return;

    let tickRate = 1500;
    if (simulationSpeed === '2x') tickRate = 750;
    if (simulationSpeed === '0.5x') tickRate = 3000;

    let centralL = simulatedCentralLevel;
    let t1L = simulatedTank1Level;
    let t2L = simulatedTank2Level;
    let t3L = simulatedTank3Level;
    let t4L = simulatedTank4Level;

    const interval = setInterval(() => {
      // --- local simulation calculations ---
      // Check active state of valve/pump toggles in memory
      const centralNode = localTopologyData.nodes.find((n: any) => n.id === centralNodeIdRef.current);
      
      const centralAttrs = centralNode?.attributes || {};

      const isOutletOpen = centralAttrs.outletValveOn !== false;
      const isPumpOn = isSimulating && (motorSpeed > 0);

      // Central Tank drains if outlet valve is open, otherwise stays steady
      if (isOutletOpen) {
        centralL = Math.max(10, centralL - 0.7 + (Math.sin(Date.now() / 6000) * 0.1));
      } else {
        centralL = Math.max(10, Math.min(100, centralL + (Math.sin(Date.now() / 8000) * 0.05)));
      }

      // Outer tanks fill/fluctuate only if pump motor is on
      if (isPumpOn) {
        t1L = Math.min(95, Math.max(0, t1L + 0.22 + (Math.sin(Date.now() / 4000) * 0.1)));
        t2L = Math.min(95, Math.max(0, t2L + 0.18 + (Math.cos(Date.now() / 5000) * 0.08)));
        t3L = Math.min(95, Math.max(0, t3L + 0.20 + (Math.sin(Date.now() / 4500) * 0.12)));
        t4L = Math.min(95, Math.max(0, t4L + 0.15 + (Math.cos(Date.now() / 3800) * 0.07)));
      } else {
        // Slow natural drain/static state when pump is turned off
        t1L = Math.max(0, t1L - 0.1);
        t2L = Math.max(0, t2L - 0.08);
        t3L = Math.max(0, t3L - 0.12);
        t4L = Math.max(0, t4L - 0.05);
      }

      setSimulatedCentralLevel(parseFloat(centralL.toFixed(1)));
      setSimulatedTank1Level(parseFloat(t1L.toFixed(1)));
      setSimulatedTank2Level(parseFloat(t2L.toFixed(1)));
      setSimulatedTank3Level(parseFloat(t3L.toFixed(1)));
      setSimulatedTank4Level(parseFloat(t4L.toFixed(1)));

      // Emit mock socket events so the embedded canvas UI receives the updates
      const emitUpdate = (nodeId: number, wl: number) => {
        const emitFn = (window as any).__emitMockSocketEvent;
        if (emitFn) {
          emitFn('sensor_update', {
            nodeId,
            status: 'Healthy',
            sensors: [
              { sensorType: 'water_level', value: wl },
              { sensorType: 'ph', value: displayPh },
              { sensorType: 'tds', value: displayTds },
              { sensorType: 'temperature', value: displayTemperature }
            ]
          });
        }
      };

      if (centralNodeIdRef.current) emitUpdate(centralNodeIdRef.current, centralL);
      if (tank1NodeIdRef.current) emitUpdate(tank1NodeIdRef.current, t1L);
      if (tank2NodeIdRef.current) emitUpdate(tank2NodeIdRef.current, t2L);
      if (tank3NodeIdRef.current) emitUpdate(tank3NodeIdRef.current, t3L);
      if (tank4NodeIdRef.current) emitUpdate(tank4NodeIdRef.current, t4L);

      // Append logs locally
      const timeStr = new Date().toLocaleTimeString();
      setSimulatedLogs(prev => [
        `[${timeStr}] Physics Tick: Central Tank = ${centralL.toFixed(1)}% | T1 = ${t1L.toFixed(1)}% | Pump Status = ${isPumpOn ? 'RUNNING' : 'STOPPED'}`,
        ...prev
      ].slice(0, 100));

    }, tickRate);

    return () => clearInterval(interval);
  }, [isSimulating, localTopologyData, simulationSpeed, simulatedCentralLevel, simulatedTank1Level, simulatedTank2Level, simulatedTank3Level, simulatedTank4Level, displayPh, displayTds, displayTemperature]);

  // Field container and styling utilities
  const getFieldContainerStyle = (): React.CSSProperties => ({
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  });

  const getSelectInputStyle = (fieldName: string): React.CSSProperties => ({
    height: 42,
    padding: '0 14px',
    borderRadius: 10,
    width: '100%',
    border: `1px solid ${
      focusedField === fieldName
        ? (dark ? '#00ffff' : '#0891b2')
        : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)')
    }`,
    background: dark ? '#22232a' : '#f8fafc',
    fontSize: 14,
    color: dark ? '#f0f0f2' : '#17181c',
    outline: 'none',
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    fontWeight: 600,
    boxShadow: focusedField === fieldName
      ? `0 0 0 3px ${dark ? 'rgba(0,255,255,0.12)' : 'rgba(8,145,178,0.12)'}`
      : 'none',
    transition: 'all 0.15s ease',
  });

  const getLabelStyle = (): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 700,
    color: dark ? '#9ca3af' : '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
    display: 'block'
  });

  const getSubHeaderStyle = (): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 800,
    color: dark ? '#00ffff' : '#0891b2',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 12,
    display: 'block'
  });

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 20,
    height: '100%',
    width: '100%',
    padding: 24,
    boxSizing: 'border-box',
    background: dark ? '#17181c' : '#f8fafc',
    overflow: 'hidden',
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  };

  const cardStyle: React.CSSProperties = {
    background: dark ? '#1c1d22' : '#ffffff',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
    borderRadius: 18,
    padding: 22,
    boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.30)' : '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
    boxSizing: 'border-box',
  };

  // Sync the mutable ref values on every render to ensure the persistent Axios and WS interceptors have the latest state
  simStateRef.current = {
    localTopologyData,
    simulatedCentralLevel,
    simulatedTank1Level,
    simulatedTank2Level,
    simulatedTank3Level,
    simulatedTank4Level,
    ph: displayPh,
    tds: displayTds,
    temperature: displayTemperature,
    isSimulating,
    motorSpeed
  };

  return (
    <div style={containerStyle}>

      {/* =================================================================
         LEFT COLUMN — LIVE CONFIGURATION & WHAT-IF CONTROLS
         ================================================================= */}
      <div style={{ ...cardStyle, width: 330, flexShrink: 0 }}>

        {/* Setup Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c' }}>
            DIGITAL TWIN SETUP
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            background: isSimulating ? 'rgba(6,182,212,0.12)' : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
            border: `1px solid ${isSimulating ? '#06b6d4' : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')}`,
            color: isSimulating ? '#06b6d4' : (dark ? '#9ca3af' : '#6b7280'),
            letterSpacing: '0.04em'
          }}>
            {isSimulating ? 'SIMULATOR ON' : 'MUTED'}
          </span>
        </div>
        <span style={{ fontSize: 10.5, color: '#9ca3af', marginBottom: 20 }}>
          {topologyName} Local Sandbox
        </span>

        {/* Setup Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>

          {/* Central Tank Level */}
          <div style={getFieldContainerStyle()}>
            <label style={getLabelStyle()}>
              Central Tank Water Level (%)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                value={isSimulating ? simulatedCentralLevel.toFixed(1) : initialLevel}
                onChange={(e) => {
                  if (!isSimulating) {
                    const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                    setInitialLevel(val);
                    setSimulatedCentralLevel(val);
                  }
                }}
                readOnly={isSimulating}
                style={{
                  ...getSelectInputStyle('centralLevel'),
                  paddingRight: 28,
                  cursor: isSimulating ? 'not-allowed' : 'default',
                  opacity: isSimulating ? 0.8 : 1
                }}
                min="0"
                max="100"
                step="0.1"
              />
              <span style={{ position: 'absolute', right: 12, fontSize: 13.5, color: '#9ca3af', fontWeight: 600 }}>%</span>
            </div>
            <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, lineHeight: 1.4 }}>
              {isSimulating ? 'Simulated live water level readings.' : 'Edit Water Level (Simulation Stopped)'}
            </p>
          </div>

          {/* Select Scenario */}
          <div style={getFieldContainerStyle()}>
            <label style={getLabelStyle()}>Active Scenario</label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              onFocus={() => setFocusedField('scenario')}
              onBlur={() => setFocusedField(null)}
              style={getSelectInputStyle('scenario')}
            >
              <option value="Normal Operation">Normal Operation</option>
              <option value="Sand Impurities">Sand Impurities</option>
              <option value="Salt Impurities">Salt Impurities</option>
              <option value="Mud Impurities">Mud Impurities</option>
              <option value="Alkaline">Alkaline</option>
            </select>
          </div>

          {/* Live Data Refresh Interval */}
          <div style={getFieldContainerStyle()}>
            <label style={getLabelStyle()}>Simulation Speed</label>
            <select
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(e.target.value)}
              onFocus={() => setFocusedField('simulationSpeed')}
              onBlur={() => setFocusedField(null)}
              style={getSelectInputStyle('simulationSpeed')}
            >
              <option value="1x (Real-time)">1x (Real-time)</option>
              <option value="0.5x">0.5x (Slowed)</option>
              <option value="2x">2x (Accelerated)</option>
            </select>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '12px 0' }} />

          {/* Physical Parameters Sub header */}
          <span style={getSubHeaderStyle()}>Physical Parameters</span>

          {/* Baseline info box */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10,
            background: scenario === 'Normal Operation' ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
            border: `1px solid ${scenario === 'Normal Operation' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: scenario === 'Normal Operation' ? '#22c55e' : '#ef4444',
            fontSize: 12, fontWeight: 600, marginBottom: 16, lineHeight: 1.4
          }}>
            {scenario === 'Normal Operation' ? (
              <>
                <CheckCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Clean baseline sandbox active.</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{scenario} Simulated! System thresholds altered.</span>
              </>
            )}
          </div>

          {/* Solvent amount in grams (Conditional) */}
          {scenario !== 'Normal Operation' && (
            <div style={getFieldContainerStyle()}>
              <label style={getLabelStyle()}>
                {scenario === 'Sand Impurities' && 'Sand (grams)'}
                {scenario === 'Salt Impurities' && 'Salt (grams)'}
                {scenario === 'Mud Impurities' && 'Mud (grams)'}
                {scenario === 'Alkaline' && 'Alkaline agent (grams)'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  value={solventGrams}
                  onChange={(e) => setSolventGrams(Math.max(0, parseFloat(e.target.value) || 0))}
                  onFocus={() => setFocusedField('solventGrams')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...getSelectInputStyle('solventGrams'),
                    paddingRight: 28,
                  }}
                  min="0"
                />
                <span style={{ position: 'absolute', right: 12, fontSize: 13.5, color: '#9ca3af', fontWeight: 600 }}>g</span>
              </div>
            </div>
          )}

          {/* Motor Speed */}
          <div style={getFieldContainerStyle()}>
            <label style={getLabelStyle()}>Pump Motor Speed (RPM)</label>
            <input
              type="number"
              value={motorSpeed}
              onChange={(e) => setMotorSpeed(Math.max(0, parseInt(e.target.value) || 0))}
              onFocus={() => setFocusedField('motorSpeed')}
              onBlur={() => setFocusedField(null)}
              style={getSelectInputStyle('motorSpeed')}
            />
          </div>

          {/* Target Flow */}
          <div style={getFieldContainerStyle()}>
            <label style={getLabelStyle()}>Target Flow Rate (L/s)</label>
            <input
              type="number"
              value={targetFlow}
              onChange={(e) => setTargetFlow(Math.max(0, parseFloat(e.target.value) || 0))}
              onFocus={() => setFocusedField('targetFlow')}
              onBlur={() => setFocusedField(null)}
              style={getSelectInputStyle('targetFlow')}
              step="0.1"
            />
          </div>

        </div>

        {/* Local sandbox simulation toggles */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button
            onClick={() => {
              const nextSimulating = !isSimulating;
              if (nextSimulating) {
                // Reset user valve toggles in local data to fresh defaults (inlet=ON, outlet=OFF) when starting simulation
                setLocalTopologyData((prev: any) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    nodes: prev.nodes.map((node: any) => {
                      if (node.nodeType === 'tank' || node.nodeType === 'central_tank') {
                        const attributes = { ...(node.attributes || {}) };
                        delete attributes.inletValveOn;
                        delete attributes.outletValveOn;
                        return { ...node, attributes };
                      }
                      return node;
                    })
                  };
                });
              }
              setIsSimulating(nextSimulating);
            }}
            style={{
              flex: 3, height: 42, borderRadius: 12, border: 'none',
              background: isSimulating ? '#ef4444' : '#06b6d4',
              color: '#ffffff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              boxShadow: isSimulating ? '0 2px 10px rgba(239,68,68,0.15)' : '0 2px 10px rgba(6,182,212,0.15)',
              transition: 'background 0.2s',
            }}
          >
            {isSimulating ? (
              <>
                <Square size={14} fill="white" />
                <span>Stop simulation</span>
              </>
            ) : (
              <>
                <Play size={14} fill="white" />
                <span>Start simulation</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              // Reset all parameter states to sandbox defaults
              setInitialLevel(50.0);
              setSimulatedCentralLevel(50.0);
              setSimulatedTank1Level(0.0);
              setSimulatedTank2Level(0.0);
              setSimulatedTank3Level(0.0);
              setSimulatedTank4Level(0.0);
              setTds(180);
              setPh(7.2);
              setTemperature(25.0);
              setScenario('Normal Operation');
              setSimulationSpeed('1x (Real-time)');
              setSolventGrams(150);
              setMotorSpeed(1450);
              setTargetFlow(5.2);
              setSimulatedLogs(prev => [`[Sandbox Reset] Simulation states reverted to baseline configs.`, ...prev].slice(0, 100));
            }}
            title="Reset sandbox simulation parameters"
            style={{
              flex: 1, height: 42, borderRadius: 12,
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
              background: dark ? '#22232a' : '#f8fafc',
              color: dark ? '#9ca3af' : '#4b5563',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = dark ? '#2d2e37' : '#e2e8f0';
              e.currentTarget.style.color = dark ? '#ffffff' : '#1e293b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = dark ? '#22232a' : '#f8fafc';
              e.currentTarget.style.color = dark ? '#9ca3af' : '#4b5563';
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* =================================================================
         MIDDLE COLUMN — TOPOLOGY CANVAS (reused original component)
         ================================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%', minHeight: 0, flex: 1 }}>

        {/* Schematic Canvas */}
        <div
          style={{
            flex: 1, background: dark ? '#1c1d22' : '#ffffff',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
            minHeight: 0,
          }}
        >

          {/* Canvas Body — renders the original TopologyCanvas isolated in local sandbox state */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden', ...contaminationStyles }}>
            {globalTopologyId && localTopologyData ? (
              <Suspense fallback={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 13 }}>
                  Loading simulation schematic...
                </div>
              }>
                <TopologyCanvas key={`${isSimulating}-${motorSpeed > 0}`} />
              </Suspense>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 13 }}>
                Loading offline simulation layout...
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Console */}
        <div style={{
          height: 180, background: '#111215', border: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16,
          fontFamily: 'monospace', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.40)', flexShrink: 0
        }}>
          {/* Console Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6
          }}>
            <span style={{ fontSize: 9.5, color: '#00ffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              &gt;_ SIMULATION TELEMETRY CONSOLE
            </span>
            <span style={{ fontSize: 8.5, color: '#6b7280' }}>{simulatedLogs.length} events logged</span>
          </div>

          {/* Log List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: '#a7f3d0' }}>
            {simulatedLogs.map((log, idx) => (
              <div key={idx} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* =================================================================
         RIGHT COLUMN — QUALITY METRICS, HEALTH & ALERTS
         ================================================================= */}
      <div style={{ ...cardStyle, width: 310, flexShrink: 0, gap: 14 }}>

        {/* Header */}
        <span style={{ fontSize: 13, fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c' }}>
          MONITORED TWIN INDEX
        </span>

        {/* Tank Levels Visual Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={getSubHeaderStyle()}>Tank Capacity Metrics</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Central Tank */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b', marginBottom: 6 }}>
                <span>Central Tank</span>
                <span>{simulatedCentralLevel.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${simulatedCentralLevel}%`, background: '#0891b2', borderRadius: 99, transition: 'width 0.6s ease-out' }} />
              </div>
            </div>

            {/* Tank 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b', marginBottom: 6 }}>
                <span>Tank 1</span>
                <span>{simulatedTank1Level.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${simulatedTank1Level}%`, background: '#3b82f6', borderRadius: 99, transition: 'width 0.6s ease-out' }} />
              </div>
            </div>

            {/* Tank 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b', marginBottom: 6 }}>
                <span>Tank 2</span>
                <span>{simulatedTank2Level.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${simulatedTank2Level}%`, background: '#3b82f6', borderRadius: 99, transition: 'width 0.6s ease-out' }} />
              </div>
            </div>

            {/* Tank 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b', marginBottom: 6 }}>
                <span>Tank 3</span>
                <span>{simulatedTank3Level.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${simulatedTank3Level}%`, background: '#3b82f6', borderRadius: 99, transition: 'width 0.6s ease-out' }} />
              </div>
            </div>

            {/* Tank 4 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b', marginBottom: 6 }}>
                <span>Tank 4</span>
                <span>{simulatedTank4Level.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${simulatedTank4Level}%`, background: '#3b82f6', borderRadius: 99, transition: 'width 0.6s ease-out' }} />
              </div>
            </div>

          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '14px 0' }} />

        {/* Quality Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* TDS Concentration */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TDS Concentration</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: displayTds > 700 ? '#ef4444' : '#10b981', marginTop: 2 }}>
                {displayTds} mg/L
              </span>
            </div>
            {/* Sparkline Column Chart */}
            <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 32, width: 80 }}>
              {simulatedTdsHistory.map((val, idx) => {
                const maxVal = Math.max(...simulatedTdsHistory, 1000);
                const pct = (val / maxVal) * 100;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: `${pct}%`,
                      background: val > 700 ? '#ef4444' : '#10b981',
                      borderRadius: '2px 2px 0 0',
                      transition: 'height 0.4s ease-out'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* pH Index */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: dark ? '#f0f0f2' : '#5a5f6b' }}>Active pH Index</span>
            <span style={{
              color: displayPh < 6.5 || displayPh > 8.5 ? '#ef4444' : (dark ? '#f0f0f2' : '#17181c'),
              fontFamily: 'monospace',
              fontSize: 14
            }}>{displayPh}</span>
          </div>

          {/* System Pressure */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: dark ? '#f0f0f2' : '#5a5f6b' }}>System Pressure</span>
            <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{pressure} bar</span>
          </div>

          {/* Total Flow Rate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: dark ? '#f0f0f2' : '#5a5f6b' }}>Total Flow Rate</span>
            <span style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: 14 }}>
              {displayFlowRate} L/s
            </span>
          </div>

          {/* Fluid Temperature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: dark ? '#f0f0f2' : '#5a5f6b' }}>Fluid Temperature</span>
            <span style={{ fontFamily: 'monospace', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Thermometer size={14} color="#6b7280" />
              {displayTemperature.toFixed(1)}°C
            </span>
          </div>

        </div>

        {/* Divider */}
        <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '14px 0' }} />

        {/* System Health Index */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>System Health Index</span>
            <span style={{ color: displayHealthIndex > 80 ? '#10b981' : displayHealthIndex > 50 ? '#f59e0b' : '#ef4444' }}>{displayHealthIndex}%</span>
          </div>
          <div style={{ height: 6, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${displayHealthIndex}%`,
              background: displayHealthIndex > 80 ? '#10b981' : displayHealthIndex > 50 ? '#f59e0b' : '#ef4444',
              borderRadius: 99,
              transition: 'width 0.4s ease-out'
            }} />
          </div>
        </div>

        {/* Active Alerts Sub-box */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <span style={getSubHeaderStyle()}>Live Alerts</span>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertsList.length > 0 ? (
              alertsList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    background: item.severity === 'Critical' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                    borderLeft: `3px solid ${item.severity === 'Critical' ? '#ef4444' : '#f59e0b'}`,
                    padding: '8px 12px',
                    borderRadius: '0 8px 8px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700,
                      color: item.severity === 'Critical' ? '#ef4444' : '#f59e0b',
                      textTransform: 'uppercase', letterSpacing: '0.02em'
                    }}>
                      {item.alertType}
                    </span>
                    <span style={{ fontSize: 9, color: '#9ca3af' }}>
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: dark ? '#f0f0f2' : '#374151', lineHeight: 1.4 }}>
                    {item.message}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 8px' }}>
                <CheckCircle size={20} color="#10b981" style={{ marginBottom: 6 }} />
                <span style={{ fontSize: 10.5, color: '#10b981', fontWeight: 600 }}>All Systems Nominal</span>
                <span style={{ fontSize: 9.5, color: '#9ca3af', marginTop: 2 }}>No active alerts generated.</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
