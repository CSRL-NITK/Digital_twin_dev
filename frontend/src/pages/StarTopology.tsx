import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  NodeResizer,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  addEdge,
} from 'reactflow';
import type { Connection, Edge, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Lock, Check, RotateCcw, Maximize2, Minimize2, ScanLine, Frame, Crosshair, Move } from 'lucide-react';

import NodeDetailsPanel from '../components/NodeDetailsPanel';
import { WaterTank as TankWaterTank } from '../components/nodes/WaterTank';
import { WaterTank as CentralWaterTank } from '../components/nodes/CentralWaterTank';
import { WaterTank as SourceWaterTank } from '../components/nodes/SourceWaterTank';
import { CentrifugalPumpSvg } from '../components/nodes/CentrifugalPump';
import { useAuth } from '../hooks/useAuth';

/* ─── types ──────────────────────────────────────────────────────── */
type LiveNodeData = {
  nodeName?: string;
  nodeType?: string;
  status?: string;
  waterLevel?: number;
  ph?: number;
  tds?: number;
  temperature?: number;
  sensors?: any[];
  /* edit-mode extras */
  editMode?: boolean;
};

/* ─── helpers ────────────────────────────────────────────────────── */
const clampPercentage = (value: number | undefined) =>
  Math.max(0, Math.min(100, value ?? 0));

const deriveTankState = (data: LiveNodeData) => {
  const fillPercentage = clampPercentage(data.waterLevel);
  const temperature = data.temperature ?? 22;
  return {
    fillPercentage,
    temperature,
    isFilling: fillPercentage < 70,
    isDraining: fillPercentage > 85,
    waveSpeed: fillPercentage > 75 ? 'fast' : fillPercentage > 40 ? 'medium' : 'slow',
    waveHeight: temperature > 55 ? 'active' : temperature > 35 ? 'normal' : 'calm',
  } as const;
};

/* ─── node views (with optional NodeResizer) ─────────────────────── */
function TankNodeView({ data, selected }: NodeProps<LiveNodeData>) {
  const tankState = deriveTankState(data ?? {});
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 200, minHeight: 160 }}>
      {data.editMode && (
        <NodeResizer
          minWidth={200} minHeight={160}
          isVisible={selected}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}
      <TankWaterTank
        fillPercentage={tankState.fillPercentage}
        isFilling={tankState.isFilling}
        isDraining={tankState.isDraining}
        waveSpeed={tankState.waveSpeed}
        waveHeight={tankState.waveHeight}
        temperature={tankState.temperature}
      />
    </div>
  );
}

function CentralTankNodeView({ data, selected }: NodeProps<LiveNodeData>) {
  const tankState = deriveTankState(data ?? {});
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 220, minHeight: 160 }}>
      {data.editMode && (
        <NodeResizer
          minWidth={220} minHeight={160}
          isVisible={selected}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}
      <CentralWaterTank
        fillPercentage={tankState.fillPercentage}
        isFilling={tankState.isFilling}
        isDraining={tankState.isDraining}
        waveSpeed={tankState.waveSpeed}
        waveHeight={tankState.waveHeight}
        temperature={tankState.temperature}
      />
    </div>
  );
}

function SourceTankNodeView({ data, selected }: NodeProps<LiveNodeData>) {
  const tankState = deriveTankState(data ?? {});
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 220, minHeight: 160 }}>
      {data.editMode && (
        <NodeResizer
          minWidth={220} minHeight={160}
          isVisible={selected}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}
      <SourceWaterTank
        fillPercentage={tankState.fillPercentage}
        isFilling={tankState.isFilling}
        isDraining={tankState.isDraining}
        waveSpeed={tankState.waveSpeed}
        waveHeight={tankState.waveHeight}
        temperature={tankState.temperature}
      />
    </div>
  );
}

function PumpNodeView({ data, selected }: NodeProps<LiveNodeData>) {
  const status = data?.status ?? 'Healthy';
  const isOn = status !== 'Offline';
  const vibrationBoost = status === 'Critical' ? 1.5 : status === 'Warning' ? 1.15 : 1;
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 200, minHeight: 160 }}>
      {data.editMode && (
        <NodeResizer
          minWidth={200} minHeight={160}
          isVisible={selected}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}
      <CentrifugalPumpSvg
        isOn={isOn}
        rpm={status === 'Critical' ? 2450 : 2900}
        flowRate={45 + clampPercentage(data?.waterLevel) * 0.25}
        pressure={status === 'Critical' ? 3.6 : 4.5}
        temperature={data?.temperature ?? 42}
        vibration={(status === 'Critical' ? 2.8 : status === 'Warning' ? 2.1 : 1.8) * vibrationBoost}
        efficiency={status === 'Critical' ? 74 : status === 'Warning' ? 85 : 92}
      />
    </div>
  );
}

const nodeTypes = {
  tank: TankNodeView,
  central_tank: CentralTankNodeView,
  source_tank: SourceTankNodeView,
  source: SourceTankNodeView,
  pump: PumpNodeView,
};

const BACKEND_URL = 'http://localhost:3001';
const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

/* ─── CUSTOM CONTROLS ─────────────────────────────────────────────
   Must be rendered INSIDE <ReactFlow> so useReactFlow() works.
─────────────────────────────────────────────────────────────────── */
function CustomControls({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const { fitView } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetFlash, setResetFlash] = useState(false);

  /* sync fullscreen state with browser events */
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const handleReset = () => {
    fitView({ duration: 400, padding: 0.12 });
    setResetFlash(true);
    setTimeout(() => setResetFlash(false), 600);
  };

  const btn = (active?: boolean): React.CSSProperties => ({
    width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? '#f3f3f3' : '#ffffff',
    border: 'none',
    cursor: 'pointer',
    color: active ? '#17181c' : '#5a5f6b',
    transition: 'background 0.12s, color 0.12s',
    outline: 'none',
  });

  const hoverIn  = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = '#f3f3f3'; e.currentTarget.style.color = '#17181c'; };
  const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#5a5f6b'; };

  return (
    <div
      style={{
        position: 'absolute', bottom: 24, left: 16, zIndex: 20,
        display: 'flex', flexDirection: 'column',
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.09)',
        borderRadius: 12,
        boxShadow: '0 2px 10px rgba(0,0,0,0.09)',
        overflow: 'hidden',
      }}
    >
      {/* Reset / Fit View */}
      <button
        style={btn(resetFlash)} title="Reset to default position"
        onMouseEnter={hoverIn} onMouseLeave={hoverOut}
        onClick={handleReset}
      >
        <RotateCcw
          size={15} strokeWidth={2.2}
          style={{
            transform: resetFlash ? 'rotate(-360deg)' : 'rotate(0deg)',
            transition: resetFlash ? 'transform 0.5s ease' : 'none',
          }}
        />
      </button>

      {/* divider */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '0 6px' }} />

      {/* Fullscreen */}
      <button
        style={btn()} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        onMouseEnter={hoverIn} onMouseLeave={hoverOut}
        onClick={toggleFullscreen}
      >
        {isFullscreen
          ? <Minimize2 size={15} strokeWidth={2.2} />
          : <Maximize2 size={15} strokeWidth={2.2} />}
      </button>
    </div>
  );
}

/* ─── EDIT MODE BUTTON ───────────────────────────────────────────── */
function EditModeButton({ editMode, onToggle }: { editMode: boolean; onToggle: () => void }) {
  return (
    <button
      id="edit-mode-btn"
      onClick={onToggle}
      title={editMode ? 'Exit Edit Mode' : 'Enter Edit Mode (Admin)'}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 16px', borderRadius: 12, cursor: 'pointer',
        border: editMode
          ? '1.5px solid rgba(200,241,53,0.55)'
          : '1.5px solid rgba(0,0,0,0.10)',
        background: editMode ? '#17181c' : '#ffffff',
        boxShadow: editMode
          ? '0 0 18px rgba(200,241,53,0.20), 0 2px 8px rgba(0,0,0,0.14)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.18s ease',
        fontFamily: FONT,
      }}
    >
      {/* status dot */}
      <span style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: editMode ? '#c8f135' : '#9ca3af',
        boxShadow: editMode ? '0 0 6px rgba(200,241,53,0.7)' : 'none',
        transition: 'all 0.18s ease',
      }} />

      {editMode
        ? <Pencil size={14} strokeWidth={2.5} color="#c8f135" />
        : <Lock size={14} strokeWidth={2} color="#9ca3af" />
      }

      <span style={{
        fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px',
        color: editMode ? '#c8f135' : '#5a5f6b',
        transition: 'color 0.18s',
      }}>
        {editMode ? 'Edit Mode ON' : 'Edit Mode'}
      </span>

      {editMode && (
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, borderRadius: '50%',
          background: 'rgba(200,241,53,0.15)',
          flexShrink: 0,
        }}>
          <Check size={11} strokeWidth={3} color="#c8f135" />
        </span>
      )}
    </button>
  );
}

/* ─── EDIT MODE BANNER ───────────────────────────────────────────── */
function EditModeBanner() {
  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 20, display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 16px', borderRadius: 99,
      background: '#17181c',
      border: '1px solid rgba(200,241,53,0.30)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.20)',
      fontFamily: FONT, pointerEvents: 'none',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#c8f135',
        boxShadow: '0 0 6px rgba(200,241,53,0.7)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#c8f135', letterSpacing: '0.04em' }}>
        ADMIN EDIT MODE
      </span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', letterSpacing: '-0.1px' }}>
        Drag to reposition · Select to resize
      </span>
    </div>
  );
}

/* ─── DASHBOARD VIEWPORT BOX ──────────────────────────────────────────
   Screen-centred overlay: shows the exact pixel area that
   dashboard viewers see. Does NOT need ReactFlow context.         */
function DashboardViewportBox({
  show, size, font,
}: {
  show: boolean;
  size: { w: number; h: number } | null;
  font: string;
}) {
  if (!show || !size) return null;

  return (
    <div style={{
      position: 'absolute', zIndex: 18, pointerEvents: 'none',
      // Always screen-centred — this IS the viewer's pixel window
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width:  size.w,
      height: size.h,
      border: '2px dashed rgba(200,241,53,0.90)',
      borderRadius: 20,
      // Vignette outside the box
      boxShadow: '0 0 0 2000px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(200,241,53,0.18)',
      background: 'transparent',
    }}>
      {/* Top-centre label */}
      <span style={{
        position: 'absolute', top: -28, left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: font, fontSize: 11, fontWeight: 700,
        color: '#c8f135', letterSpacing: '0.06em',
        background: 'rgba(23,24,28,0.90)', padding: '3px 12px',
        borderRadius: 6, whiteSpace: 'nowrap',
      }}>
        DASHBOARD VIEWPORT — {size.w} × {size.h}px  |  centred at (0, 0)
      </span>
      {/* Corner dots */}
      {(['0%','0%'] as const) && [
        ['0%','0%'], ['100%','0%'], ['0%','100%'], ['100%','100%'],
      ].map(([cx, cy], i) => (
        <span key={i} style={{
          position: 'absolute', left: cx, top: cy,
          width: 12, height: 12,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          background: '#c8f135',
          boxShadow: '0 0 8px rgba(200,241,53,0.85)',
        }} />
      ))}
    </div>
  );
}

/* ─── CANVAS CROSSHAIR ───────────────────────────────────────────────
   Must be INSIDE <ReactFlow> so useViewport() has context.
   viewport.x / viewport.y = screen position of world origin (0,0).
   Lines move with the canvas as user pans / zooms.              */
function CanvasCrosshair({ show }: { show: boolean }) {
  const { x: vpX, y: vpY } = useViewport();
  if (!show) return null;

  const LINE = '1.5px dashed rgba(200,241,53,0.60)';
  const LABEL: React.CSSProperties = {
    position: 'absolute',
    fontFamily: FONT, fontSize: 10, fontWeight: 700,
    color: 'rgba(200,241,53,0.75)', letterSpacing: '0.06em',
    pointerEvents: 'none', whiteSpace: 'nowrap',
    background: 'rgba(23,24,28,0.70)', padding: '2px 6px', borderRadius: 4,
  };

  return (
    <>
      {/* Horizontal line — at canvas Y = 0 */}
      <div style={{
        position: 'absolute', pointerEvents: 'none', zIndex: 16,
        top: vpY, left: 0, right: 0, height: 0,
        borderTop: LINE,
      }}>
        {/* Label: left edge */}
        <span style={{ ...LABEL, top: 6, left: 12 }}>Y = 0</span>
        {/* Label: right edge */}
        <span style={{ ...LABEL, top: 6, right: 12 }}>Y = 0</span>
        {/* Tick mark at center intersection */}
        <div style={{
          position: 'absolute', left: vpX, top: -4,
          width: 1, height: 8, background: '#c8f135', transform: 'translateX(-50%)',
        }} />
      </div>

      {/* Vertical line — at canvas X = 0 */}
      <div style={{
        position: 'absolute', pointerEvents: 'none', zIndex: 16,
        left: vpX, top: 0, bottom: 0, width: 0,
        borderLeft: LINE,
      }}>
        {/* Label: top edge */}
        <span style={{ ...LABEL, top: 12, left: 6 }}>X = 0</span>
        {/* Label: bottom edge */}
        <span style={{ ...LABEL, bottom: 12, left: 6 }}>X = 0</span>
        {/* Tick mark at center intersection */}
        <div style={{
          position: 'absolute', top: vpY, left: -4,
          height: 1, width: 8, background: '#c8f135', transform: 'translateY(-50%)',
        }} />
      </div>

      {/* Origin dot at world (0, 0) */}
      <div style={{
        position: 'absolute', pointerEvents: 'none', zIndex: 17,
        left: vpX, top: vpY,
        transform: 'translate(-50%, -50%)',
        width: 12, height: 12, borderRadius: '50%',
        background: '#c8f135',
        boxShadow: '0 0 0 5px rgba(200,241,53,0.15), 0 0 16px rgba(200,241,53,0.65)',
      }} />

      {/* Origin label */}
      <span style={{
        ...LABEL,
        position: 'absolute', zIndex: 17, pointerEvents: 'none',
        left: vpX + 14, top: vpY + 14,
        fontSize: 11, fontWeight: 800,
        color: '#c8f135', background: 'rgba(23,24,28,0.85)',
      }}>
        (0, 0) ORIGIN
      </span>
    </>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
export default function StarTopology() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { selectedNode, setSelectedNode } = useOutletContext<any>();
  const [nodeHistory, setNodeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Three independent sub-toggles — only active while editMode is ON
  const [showViewport, setShowViewport]       = useState(false); // dashboard viewport box
  const [showCrosshair, setShowCrosshair]     = useState(false); // X/Y axis guides
  const [allowMoveResize, setAllowMoveResize] = useState(false); // drag + resize nodes
  const [dashboardViewSize, setDashboardViewSize] = useState<{ w: number; h: number } | null>(null);
  const { isAdmin } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── inject pulse keyframe once ─────────────────────────── */
  useEffect(() => {
    const id = 'dt-pulse-kf';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = `@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`;
      document.head.appendChild(s);
    }
  }, []);

  /* ── push/pull editMode into node data + clear panel/sub-toggles on change ─ */
  useEffect(() => {
    if (editMode) {
      setSelectedNode(null);
    } else {
      // Reset all sub-toggles when edit mode turns off
      setShowViewport(false);
      setShowCrosshair(false);
      setAllowMoveResize(false);
    }
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        draggable: editMode && allowMoveResize,
        data: { ...n.data, editMode, allowMoveResize },
      }))
    );
  }, [editMode, allowMoveResize, setNodes, setSelectedNode]);

  /* ── sync allowMoveResize into node data independently ─────────────── */
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        draggable: editMode && allowMoveResize,
        data: { ...n.data, allowMoveResize },
      }))
    );
  }, [allowMoveResize, editMode, setNodes]);

  /* ── Live size tracking: useLayoutEffect captures size synchronously on first
     render (before fullscreen can interfere), ResizeObserver keeps it updated,
     fullscreenchange fires update after exit so size is always fresh.         */
  const dashboardSizeRef = useRef<{ w: number; h: number } | null>(null);

  const captureSize = useCallback(() => {
    const el = containerRef.current;
    if (!el || document.fullscreenElement) return;
    const r = el.getBoundingClientRect();
    const size = { w: Math.round(r.width), h: Math.round(r.height) };
    if (size.w > 0 && size.h > 0) {
      dashboardSizeRef.current = size;
      setDashboardViewSize(size);
    }
  }, []);

  // Fire synchronously after first paint — before any user interaction
  useLayoutEffect(() => {
    captureSize();
  }, [captureSize]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(captureSize);
    ro.observe(el);
    // Re-capture after fullscreen exits
    const onFs = () => { if (!document.fullscreenElement) captureSize(); };
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      ro.disconnect();
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [captureSize]);

  /* ── Rule 1: Edit Mode ON → enter fullscreen automatically ── */
  useEffect(() => {
    if (editMode && !document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    }
  }, [editMode]);

  /* ── Rule 2: Fullscreen exited (ESC / button) → turn off Edit Mode ── */
  useEffect(() => {
    const onFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs) setEditMode(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  /* ── initial fetch + socket ─────────────────────────────── */
  useEffect(() => {
    const socket = io(BACKEND_URL);

    const fetchTopology = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/topologies/star`);

        const formattedNodes = data.nodes.map((node: any) => ({
          id: node.id,
          type: node.nodeType,
          position: { x: node.positionX, y: node.positionY },
          draggable: false, // locked by default; edit mode enables
          style: node.width && node.height
            ? { width: node.width, height: node.height }
            : undefined,
          data: {
            nodeName: node.nodeName,
            status: node.status,
            nodeType: node.nodeType,
            waterLevel: 0, ph: 0, tds: 0, temperature: 0,
            editMode: false,
          },
        }));

        const formattedEdges = data.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          animated: true,
          style: { stroke: 'var(--dt-accent)', strokeWidth: 1.5, opacity: 0.7 },
        }));

        setNodes(formattedNodes);
        setEdges(formattedEdges);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching topology:', error);
        setLoading(false);
      }
    };

    fetchTopology();

    socket.on('sensor_update', (data) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== data.nodeId) return node;
          const wl   = data.sensors.find((s: any) => s.sensorType === 'water_level')?.value;
          const ph   = data.sensors.find((s: any) => s.sensorType === 'ph')?.value;
          const tds  = data.sensors.find((s: any) => s.sensorType === 'tds')?.value;
          const temp = data.sensors.find((s: any) => s.sensorType === 'temperature')?.value;

          setSelectedNode((prev: any) => {
            if (prev && prev.id === data.nodeId)
              return { ...prev, waterLevel: wl, ph, tds, temperature: temp, status: data.status, sensors: data.sensors };
            return prev;
          });
          setNodeHistory((h) => [...h, { createdAt: new Date().toISOString(), waterLevel: wl, ph, tds, temperature: temp }].slice(-50));

          return { ...node, data: { ...node.data, waterLevel: wl, ph, tds, temperature: temp, status: data.status } };
        })
      );
    });

    socket.on('node:status_update', (data) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== data.id) return node;
          setSelectedNode((prev: any) => {
            if (prev && prev.id === data.id) return { ...prev, status: data.status };
            return prev;
          });
          return { ...node, data: { ...node.data, status: data.status } };
        })
      );
    });

    return () => { socket.disconnect(); };
  }, [setNodes, setEdges, setSelectedNode]);

  /* ── save position on drag stop ─────────────────────────── */
  const onNodeDragStop = async (_: React.MouseEvent, node: any) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/nodes/${node.id}/position`, {
        positionX: Math.round(node.position.x),
        positionY: Math.round(node.position.y),
      });
    } catch (e) { console.error('Failed to save position', e); }
  };

  /* ── save size on resize stop ────────────────────────────── */
  const onNodeResizeEnd = async (_: any, node: any) => {
    if (!node.style?.width && !node.style?.height) return;
    try {
      await axios.patch(`${BACKEND_URL}/api/nodes/${node.id}/position`, {
        positionX: Math.round(node.position.x),
        positionY: Math.round(node.position.y),
      });
    } catch (e) { console.error('Failed to save size', e); }
  };

  /* ── node click ─────────────────────────────────────────── */
  const onNodeClick = async (_: React.MouseEvent, node: any) => {
    // In edit mode, clicks are for drag/resize only — suppress details panel
    if (editMode) return;
    try {
      const nodeRes = await axios.get(`${BACKEND_URL}/api/nodes`);
      const target  = nodeRes.data.find((n: any) => n.id === node.id);
      setNodeHistory([]);
      setSelectedNode({ id: node.id, ...node.data, sensors: target?.sensors || [] });
    } catch {
      setNodeHistory([]);
      setSelectedNode({ id: node.id, ...node.data, sensors: [] });
    }
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  const onPaneClick = () => setSelectedNode(null);

  /* ── loading ────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden rounded-[24px]" style={{ background: '#ffffff' }}>

      {/* Top-right admin button row */}
      {isAdmin && (
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>

          {/* ── 3 sub-toggle buttons, only when edit mode is ON ─── */}
          {editMode && (() => {
            const SubBtn = ({
              id, icon: Icon, label, active, onToggle,
            }: {
              id: string;
              icon: React.ElementType;
              label: string;
              active: boolean;
              onToggle: () => void;
            }) => (
              <button
                id={id}
                onClick={onToggle}
                title={label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                  border: active
                    ? '1.5px solid rgba(200,241,53,0.50)'
                    : '1.5px solid rgba(0,0,0,0.09)',
                  background: active ? '#17181c' : '#ffffff',
                  boxShadow: active
                    ? '0 0 12px rgba(200,241,53,0.12), 0 2px 6px rgba(0,0,0,0.10)'
                    : '0 2px 6px rgba(0,0,0,0.07)',
                  fontFamily: FONT, transition: 'all 0.15s ease',
                }}
              >
                <Icon size={13} strokeWidth={2.2} color={active ? '#c8f135' : '#9ca3af'} />
                <span style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: '-0.1px',
                  color: active ? '#c8f135' : '#5a5f6b',
                }}>
                  {label}
                </span>
                {/* ON indicator dot */}
                <span style={{
                  width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                  background: active ? '#c8f135' : 'transparent',
                  boxShadow: active ? '0 0 4px rgba(200,241,53,0.8)' : 'none',
                  transition: 'all 0.15s ease',
                }} />
              </button>
            );

            return (
              <>
                {/* Divider */}
                <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,0.10)', margin: '0 2px' }} />
                <SubBtn
                  id="btn-viewport"
                  icon={Frame}
                  label="Viewport"
                  active={showViewport}
                  onToggle={() => setShowViewport(v => !v)}
                />
                <SubBtn
                  id="btn-guide"
                  icon={Crosshair}
                  label="Guide"
                  active={showCrosshair}
                  onToggle={() => setShowCrosshair(v => !v)}
                />
                <SubBtn
                  id="btn-move"
                  icon={Move}
                  label="Move & Resize"
                  active={allowMoveResize}
                  onToggle={() => setAllowMoveResize(v => !v)}
                />
                {/* Divider */}
                <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,0.10)', margin: '0 2px' }} />
              </>
            );
          })()}

          {/* Edit Mode toggle — always shown for admin */}
          <EditModeButton editMode={editMode} onToggle={() => setEditMode((v) => !v)} />
        </div>
      )}

      {/* Edit mode active banner */}
      {editMode && <EditModeBanner />}

      {/* Viewport Guide box — screen-centred overlay showing dashboard canvas bounds */}
      <DashboardViewportBox
        show={editMode && showViewport}
        size={dashboardViewSize}
        font={FONT}
      />

      {/* Canvas border highlight when edit mode is ON */}
      {editMode && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 24, zIndex: 1, pointerEvents: 'none',
          border: '2px solid rgba(200,241,53,0.30)',
          boxShadow: 'inset 0 0 32px rgba(200,241,53,0.04)',
        }} />
      )}

      {/* ── old screen-space crosshair removed; now inside ReactFlow as CanvasCrosshair ── */}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeResizeEnd={onNodeResizeEnd}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        nodesDraggable={editMode && allowMoveResize}
        nodesConnectable={false}
        fitView
        className="bg-white"
        style={{ width: '100%', height: '100%', background: '#ffffff' }}
      >
        <Background gap={28} size={1.2} color="#e0e0e0" style={{ opacity: 0.8 }} />
        <CustomControls containerRef={containerRef} />

        {/* Canvas crosshair — tracks real world (0,0), pans with canvas */}
        <CanvasCrosshair show={editMode && showCrosshair} />

        {/* MiniMap — only in fullscreen, bottom-right, dark themed */}
        {isFullscreen && (
          <MiniMap
            position="bottom-right"
            nodeColor={(node) => {
              const status = node.data?.status;
              if (status === 'Critical') return '#ef4444';
              if (status === 'Warning')  return '#f59e0b';
              if (status === 'Offline')  return '#6b7280';
              return '#22c55e';
            }}
            nodeStrokeWidth={0}
            maskColor="rgba(23,24,28,0.55)"
            style={{
              background: '#17181c',
              border: '1px solid rgba(200,241,53,0.20)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.04)',
              width: 200,
              height: 130,
              marginBottom: 8,
              marginRight: 8,
            }}
          />
        )}
      </ReactFlow>

      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          history={nodeHistory}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
