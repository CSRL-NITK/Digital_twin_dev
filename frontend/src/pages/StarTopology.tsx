import { useState, useEffect, useCallback, useRef, useLayoutEffect, memo } from 'react';
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
import Switch from '../components/ui/Switch';
import { io } from 'socket.io-client';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Lock, Check, RotateCcw, Maximize2, Minimize2, Frame, Crosshair, Move, Undo, Redo, Trash2, Layers, Gauge, Activity, Zap, Thermometer } from 'lucide-react';

import NodeDetailsPanel from '../components/NodeDetailsPanel';
import { WaterTank as TankWaterTank } from '../components/nodes/WaterTank';
import { CentralWaterTank } from '../components/nodes/CentralWaterTank';
import { WaterTank as SourceWaterTank } from '../components/nodes/SourceWaterTank';
import { CentrifugalPumpSvg } from '../components/nodes/CentrifugalPump';
import { FloatingNodePalette } from '../components/topology/FloatingNodePalette';
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
  allowMoveResize?: boolean;
  allowDeleteNodes?: boolean;
  onDeleteNode?: (id: string) => void;
  onResizeStart?: (params: any) => void;
  onResizeEnd?: (params: any) => void;
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

function AdminNodeDeleteBtn({ id, nodeName, allowDelete, onDelete }: { id: string; nodeName?: string; allowDelete?: boolean; onDelete?: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!allowDelete || !onDelete) return null;

  if (confirming) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: -16, right: -10, zIndex: 50,
          background: '#17181c', border: '1.5px solid #ef4444',
          borderRadius: 8, padding: '4px 8px',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.15s ease',
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap' }}>
          Delete {nodeName || 'Asset'}?
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          style={{
            background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4,
            padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s'
          }}
        >
          Yes
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }}
          style={{
            background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 4,
            padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s'
          }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setConfirming(true);
      }}
      title="Delete Asset"
      style={{
        position: 'absolute', top: -10, right: -10, zIndex: 30,
        width: 26, height: 26, borderRadius: '50%',
        background: '#ef4444', color: '#ffffff', border: '2px solid #ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
      }}
    >
      <Trash2 size={13} strokeWidth={2.5} />
    </button>
  );
}

/* ─── node views (with optional NodeResizer) ─────────────────────── */
function TankNodeView({ id, data, selected }: NodeProps<LiveNodeData>) {
  const tankState = deriveTankState(data ?? {});
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 200, minHeight: 160 }}>
      <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />
      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={true}
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

function CentralTankNodeView({ id, data, selected }: NodeProps<LiveNodeData>) {
  const tankState = deriveTankState(data ?? {});
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 220, minHeight: 160 }}>
      <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />
      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={true}
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

function SourceTankNodeView({ id, data, selected }: NodeProps<LiveNodeData>) {
  const tankState = deriveTankState(data ?? {});
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 220, minHeight: 160 }}>
      <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />
      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={true}
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

function PumpNodeView({ id, data, selected }: NodeProps<LiveNodeData>) {
  const status = data?.status ?? 'Healthy';
  const isOn = status !== 'Offline';
  const vibrationBoost = status === 'Critical' ? 1.5 : status === 'Warning' ? 1.15 : 1;
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 200, minHeight: 160 }}>
      <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />
      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={true}
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


function SensorNodeView({ id, data, selected }: NodeProps<LiveNodeData>) {
  const type = data?.nodeType || 'water_level';
  const name = data?.nodeName || 'Telemetry Sensor';

  const configs: Record<string, { icon: any; color: string; val: string }> = {
    water_level: { icon: <Gauge size={18} />, color: '#38bdf8', val: `${data?.waterLevel ?? 65}%` },
    ph: { icon: <Activity size={18} />, color: '#10b981', val: `${data?.ph ?? 7.12} pH` },
    tds: { icon: <Zap size={18} />, color: '#f59e0b', val: `${data?.tds ?? 210} ppm` },
    temperature: { icon: <Thermometer size={18} />, color: '#ef4444', val: `${data?.temperature ?? 24.5}°C` },
  };
  const cfg = configs[type] || configs.water_level;

  return (
    <div style={{ width: '100%', height: '100%', minWidth: 170, minHeight: 85 }}>
      <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />
      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={false}
          minWidth={170} minHeight={85}
          isVisible={selected}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}
      <div style={{
        width: '100%', height: '100%',
        background: '#ffffff',
        border: selected ? '2px solid #c8f135' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 14,
        padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`,
          color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          {cfg.icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#5a5f6b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {name}
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#17181c', fontVariantNumeric: 'tabular-nums' }}>
            {cfg.val}
          </span>
        </div>
      </div>
    </div>
  );
}

function ViewportGuideNode({ data, selected }: NodeProps<any>) {
  const { allowMoveResize } = data;
  return (
    <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      {allowMoveResize && (
        <NodeResizer
          minWidth={200}
          keepAspectRatio={true}
          isVisible={selected}
          onResizeStart={(_evt, params) => data.onResizeStart && data.onResizeStart(params)}
          onResizeEnd={(_evt, params) => data.onResizeEnd && data.onResizeEnd(params)}
          lineStyle={{ borderColor: 'rgba(200,241,53,0.9)', borderWidth: 2, borderStyle: 'dashed', pointerEvents: 'auto' }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3, pointerEvents: 'auto' }}
        />
      )}
      <div style={{
        width: '100%', height: '100%',
        border: '2px dashed rgba(200,241,53,0.90)',
        borderRadius: 20,
        boxShadow: `0 0 0 4000px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(200,241,53,0.18)`,
      }}>
        <span style={{
          position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, color: '#c8f135',
          background: 'rgba(23,24,28,0.90)', padding: '3px 12px', borderRadius: 6, whiteSpace: 'nowrap',
        }}>
          DASHBOARD VIEWPORT CAMERA
        </span>
      </div>
    </div>
  );
}

const ViewportGuideNodeMemo = memo(ViewportGuideNode);
const TankNodeViewMemo = memo(TankNodeView);
const CentralTankNodeViewMemo = memo(CentralTankNodeView);
const SourceTankNodeViewMemo = memo(SourceTankNodeView);
const PumpNodeViewMemo = memo(PumpNodeView);
const SensorNodeViewMemo = memo(SensorNodeView);

const nodeTypes = {
  viewportGuide: ViewportGuideNodeMemo,
  tank: TankNodeViewMemo,
  central_tank: CentralTankNodeViewMemo,
  source_tank: SourceTankNodeViewMemo,
  source: SourceTankNodeViewMemo,
  pump: PumpNodeViewMemo,
  water_level: SensorNodeViewMemo,
  ph: SensorNodeViewMemo,
  tds: SensorNodeViewMemo,
  temperature: SensorNodeViewMemo,
  sensor: SensorNodeViewMemo,
};

const BACKEND_URL = 'http://localhost:3001';
const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

/* ─── CUSTOM CONTROLS ─────────────────────────────────────────────
   Must be rendered INSIDE <ReactFlow> so useReactFlow() works.
─────────────────────────────────────────────────────────────────── */
function CustomControls({ containerRef, onUndo, onRedo, canUndo, canRedo }: { containerRef: React.RefObject<HTMLDivElement | null>, onUndo?: () => void, onRedo?: () => void, canUndo?: boolean, canRedo?: boolean }) {
  const { setCenter, fitBounds, getNodes } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetFlash, setResetFlash] = useState(false);

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
    const nodes = getNodes();
    const vpNode = nodes.find(n => n.id === 'viewport-box');
    if (vpNode) {
      fitBounds({ x: vpNode.position.x, y: vpNode.position.y, width: parseFloat(vpNode.style?.width as string), height: parseFloat(vpNode.style?.height as string) }, { duration: 400, padding: 0 });
    } else {
      setCenter(0, 0, { zoom: 1, duration: 400 });
    }
    setResetFlash(true);
    setTimeout(() => setResetFlash(false), 600);
  };

  const btnSize = isFullscreen ? 36 : 28;
  const btn = (active?: boolean): React.CSSProperties => ({
    width: btnSize, height: btnSize,
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
          size={isFullscreen ? 15 : 13} strokeWidth={2.2}
          style={{
            transform: resetFlash ? 'rotate(-360deg)' : 'rotate(0deg)',
            transition: resetFlash ? 'transform 0.5s ease' : 'none',
          }}
        />
      </button>

      {/* Undo */}
      {isFullscreen && onUndo && (
        <>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '0 6px' }} />
          <button
            style={{...btn(), opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed'}} title="Undo"
            onMouseEnter={canUndo ? hoverIn : undefined} onMouseLeave={hoverOut}
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo size={isFullscreen ? 15 : 13} strokeWidth={2.2} />
          </button>
        </>
      )}

      {/* Redo */}
      {isFullscreen && onRedo && (
        <>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '0 6px' }} />
          <button
            style={{...btn(), opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed'}} title="Redo"
            onMouseEnter={canRedo ? hoverIn : undefined} onMouseLeave={hoverOut}
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo size={isFullscreen ? 15 : 13} strokeWidth={2.2} />
          </button>
        </>
      )}

      {/* divider */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '0 6px' }} />

      {/* Fullscreen */}
      <button
        style={btn()} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        onMouseEnter={hoverIn} onMouseLeave={hoverOut}
        onClick={toggleFullscreen}
      >
        {isFullscreen
          ? <Minimize2 size={isFullscreen ? 15 : 13} strokeWidth={2.2} />
          : <Maximize2 size={isFullscreen ? 15 : 13} strokeWidth={2.2} />}
      </button>
    </div>
  );
}

/* ─── EDIT MODE BUTTON ───────────────────────────────────────────── */
function EditModeButton({ editMode, onToggle, isFullscreen = true }: { editMode: boolean; onToggle: () => void; isFullscreen?: boolean }) {
  const isSmall = isFullscreen === false;
  return (
    <button
      id="edit-mode-btn"
      onClick={onToggle}
      title={editMode ? 'Exit Edit Mode' : 'Enter Edit Mode (Admin)'}
      style={{
        display: 'flex', alignItems: 'center', gap: isSmall ? 6 : 8,
        padding: isSmall ? '6px 12px' : '9px 16px', borderRadius: isSmall ? 8 : 12, cursor: 'pointer',
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
        width: isSmall ? 5 : 7, height: isSmall ? 5 : 7, borderRadius: '50%', flexShrink: 0,
        background: editMode ? '#c8f135' : '#9ca3af',
        boxShadow: editMode ? '0 0 6px rgba(200,241,53,0.7)' : 'none',
        transition: 'all 0.18s ease',
      }} />

      {editMode
        ? <Pencil size={14} strokeWidth={2.5} color="#c8f135" />
        : <Lock size={14} strokeWidth={2} color="#9ca3af" />
      }

      <span style={{
        fontSize: isSmall ? 11 : 13, fontWeight: 700, letterSpacing: '-0.2px',
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
        Arrange components & customize the canvas
      </span>
    </div>
  );
}

/* ─── DASHBOARD VIEWPORT BOX ──────────────────────────────────────────
   Screen-centred overlay: shows the exact pixel area that
   dashboard viewers see. Does NOT need ReactFlow context.         */

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

type HistoryAction = {
  type: 'move' | 'resize';
  nodeId: string;
  oldValue: { x: number, y: number, w?: number, h?: number };
  newValue: { x: number, y: number, w?: number, h?: number };
};

/* ── MAIN COMPONENT ── */
export default function StarTopology() {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { selectedNode, setSelectedNode } = useOutletContext<any>();
  const [nodeHistory, setNodeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);
  const dragStartPos = useRef<any>(null);
  const isInteractingRef = useRef(false);
  const resizeStartDim = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Three independent sub-toggles — only active while editMode is ON
  const [showViewport, setShowViewport]       = useState(false); // dashboard viewport box
  const [showCrosshair, setShowCrosshair]     = useState(false); // X/Y axis guides
  const [allowMoveResize, setAllowMoveResize] = useState(false);
  const [allowMoveNodes, setAllowMoveNodes] = useState(false);
  const [allowResizeNodes, setAllowResizeNodes] = useState(false);
  const [allowMoveViewport, setAllowMoveViewport] = useState(false);
  const [allowResizeViewport, setAllowResizeViewport] = useState(false); // drag + resize nodes
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [showSensorPalette, setShowSensorPalette] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [allowDeleteNodes, setAllowDeleteNodes] = useState(false);
  const [initialViewportConfig, setInitialViewportConfig] = useState<any>(null);
  const [isViewportReady, setIsViewportReady] = useState(false);
  
  const { isAdmin } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const interactivityRef = useRef({
    editMode: false,
    allowMoveResize: false,
    allowMoveNodes: false,
    allowResizeNodes: false,
    allowDeleteNodes: false,
  });

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

  /* ── Delete Node Helper ──────────────────────────────── */
  const handleDeleteNode = useCallback(async (id: string) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/nodes/${id}`);
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    } catch (e) {
      console.error('Failed to delete node:', e);
    }
  }, [setNodes, setEdges]);

  /* ── Unified Effect: push editMode/allowMoveResize/showViewport into nodes ─ */
  useEffect(() => {
    interactivityRef.current = { editMode, allowMoveResize, allowMoveNodes, allowResizeNodes, allowDeleteNodes };

    if (editMode) {
      setSelectedNode(null);
    } else {
      // Reset all sub-toggles when edit mode turns off
      // eslint-disable-next-line
      setShowViewport(false);
      setShowCrosshair(false);
      setAllowMoveResize(false);
      setShowPaletteMenu(false);
      setShowNodePalette(false);
      setShowSensorPalette(false);
      setShowDeleteMenu(false);
      setAllowDeleteNodes(false);
      setUndoStack([]);
      setRedoStack([]);
    }

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === 'viewport-box') {
          const isViewportInteractive = allowMoveResize && (allowMoveViewport || allowResizeViewport);
          return {
            ...n,
            hidden: !(editMode && showViewport),
            draggable: editMode && allowMoveResize && allowMoveViewport,
            style: { ...n.style, pointerEvents: isViewportInteractive ? 'auto' : 'none' },
            data: { ...n.data, allowMoveResize: allowMoveResize && allowResizeViewport }
          };
        }
        return {
          ...n,
          draggable: editMode && allowMoveResize && allowMoveNodes,
          data: { ...n.data, editMode, allowMoveResize: allowMoveResize && allowResizeNodes, allowDeleteNodes, onDeleteNode: handleDeleteNode },
        };
      })
    );
  }, [editMode, allowMoveResize, allowMoveNodes, allowResizeNodes, allowMoveViewport, allowResizeViewport, showViewport, allowDeleteNodes, setNodes, setSelectedNode, handleDeleteNode]);

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

  /* ── Sync Viewport when both ReactFlow and Topology data are ready ── */
  useEffect(() => {
    if (rfInstance && initialViewportConfig) {
      // Delay slightly just to ensure DOM is fully painted
      setTimeout(() => {
        rfInstance.fitBounds({ 
          x: initialViewportConfig.x, 
          y: initialViewportConfig.y, 
          width: initialViewportConfig.w, 
          height: initialViewportConfig.h 
        }, { duration: 0, padding: 0 });
        requestAnimationFrame(() => setIsViewportReady(true));
      }, 50);
    }
  }, [rfInstance, initialViewportConfig]);

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

        let vpConfig = { x: -500, y: -250, w: 1000, h: 500 };
        if (data.description) {
          try {
            const parsed = JSON.parse(data.description);
            if (parsed.viewport && parsed.viewport.w) vpConfig = parsed.viewport;
          } catch (e) {}
        }
        
        const viewportNode = {
          id: 'viewport-box',
          type: 'viewportGuide',
          position: { x: vpConfig.x, y: vpConfig.y },
          style: { width: vpConfig.w, height: vpConfig.h, zIndex: 9999 },
          hidden: true,
          draggable: false,
          data: {
            allowMoveResize: false,
            onResizeStart: (params: any) => {
              resizeStartDim.current = { x: Math.round(params.x), y: Math.round(params.y), w: Math.round(params.width), h: Math.round(params.height) };
            },
            onResizeEnd: (params: any) => {
              const newX = Math.round(params.x); const newY = Math.round(params.y);
              const newW = Math.round(params.width); const newH = Math.round(params.height);

              if (resizeStartDim.current) {
                if (Math.abs(newW - resizeStartDim.current.w) > 1 || Math.abs(newH - resizeStartDim.current.h) > 1) {
                  setUndoStack(prev => [...prev, {
                    type: 'resize',
                    nodeId: 'viewport-box',
                    oldValue: resizeStartDim.current,
                    newValue: { x: newX, y: newY, w: newW, h: newH }
                  }]);
                  setRedoStack([]);
                }
              }

              // Update React state so future drags don't overwrite DB with old sizes
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.id === 'viewport-box') {
                    return {
                      ...n,
                      position: { x: newX, y: newY },
                      style: { ...n.style, width: newW, height: newH },
                    };
                  }
                  return n;
                })
              );

              axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, {
                x: newX, y: newY,
                w: newW, h: newH
              }).catch(console.error);
            }
          }
        };

        setNodes([...formattedNodes, viewportNode]);
        
        setEdges(formattedEdges);
        setLoading(false);
        setInitialViewportConfig(vpConfig);

      } catch (error) {
        console.error('Error fetching topology:', error);
        setLoading(false);
      }
    };

    fetchTopology();

    socket.on('sensor_update', (data) => {
      if (isInteractingRef.current) return;
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
      if (isInteractingRef.current) return;
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

    socket.on('node:created', (newNode) => {
      setNodes((nds) => {
        if (nds.some((n) => n.id === newNode.id)) return nds;
        const isSensor = ['water_level', 'ph', 'tds', 'temperature', 'sensor'].includes(newNode.nodeType);
        const wl   = newNode.sensors?.find((s: any) => s.sensorType === 'water_level')?.value ?? 65;
        const ph   = newNode.sensors?.find((s: any) => s.sensorType === 'ph')?.value ?? 7.1;
        const tds  = newNode.sensors?.find((s: any) => s.sensorType === 'tds')?.value ?? 210;
        const temp = newNode.sensors?.find((s: any) => s.sensorType === 'temperature')?.value ?? 24;

        const cleanNds = nds.filter((n) => !(n.id.startsWith('temp-') && n.data?.nodeName === newNode.nodeName));
        const { editMode: em, allowMoveResize: amr, allowMoveNodes: amn, allowResizeNodes: arn, allowDeleteNodes: adn } = interactivityRef.current;

        return [
          ...cleanNds,
          {
            id: newNode.id,
            type: newNode.nodeType,
            position: { x: newNode.positionX, y: newNode.positionY },
            draggable: em && amr && amn,
            style: isSensor
              ? { width: 170, height: 85 }
              : { width: newNode.nodeType.includes('central') || newNode.nodeType.includes('source') ? 220 : 200, height: 160 },
            data: {
              nodeName: newNode.nodeName,
              status: newNode.status,
              nodeType: newNode.nodeType,
              waterLevel: wl, ph, tds, temperature: temp,
              editMode: em,
              allowMoveResize: amr && arn,
              allowDeleteNodes: adn,
              onDeleteNode: handleDeleteNode
            }
          }
        ];
      });
    });

    return () => { socket.disconnect(); };
  }, [setNodes, setEdges, setSelectedNode, handleDeleteNode]);

  
  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);

    // Apply visually
    setNodes(nds => nds.map(n => {
      if (n.id === action.nodeId) {
        const updated = { ...n, position: { x: action.oldValue.x, y: action.oldValue.y } };
        if (action.oldValue.w) {
          updated.style = { ...updated.style, width: action.oldValue.w, height: action.oldValue.h };
        }
        return updated;
      }
      return n;
    }));

    // Apply to DB
    if (action.nodeId === 'viewport-box') {
      try {
        await axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, {
          x: action.oldValue.x, y: action.oldValue.y,
          w: action.oldValue.w || 1000, h: action.oldValue.h || 500
        });
      } catch (e) {}
    } else {
      try {
        await axios.patch(`${BACKEND_URL}/api/nodes/${action.nodeId}/position`, {
          positionX: action.oldValue.x, positionY: action.oldValue.y,
        });
      } catch (e) {}
    }
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);

    // Apply visually
    setNodes(nds => nds.map(n => {
      if (n.id === action.nodeId) {
        const updated = { ...n, position: { x: action.newValue.x, y: action.newValue.y } };
        if (action.newValue.w) {
          updated.style = { ...updated.style, width: action.newValue.w, height: action.newValue.h };
        }
        return updated;
      }
      return n;
    }));

    // Apply to DB
    if (action.nodeId === 'viewport-box') {
      try {
        await axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, {
          x: action.newValue.x, y: action.newValue.y,
          w: action.newValue.w || 1000, h: action.newValue.h || 500
        });
      } catch (e) {}
    } else {
      try {
        await axios.patch(`${BACKEND_URL}/api/nodes/${action.nodeId}/position`, {
          positionX: action.newValue.x, positionY: action.newValue.y,
        });
      } catch (e) {}
    }
  };

  /* ── save position on drag stop ── */
  const onNodeDragStart = (_: React.MouseEvent, node: any) => {
    isInteractingRef.current = true;
    dragStartPos.current = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
    if (node.id === 'viewport-box') {
      dragStartPos.current.w = parseFloat(node.style?.width as string) || 1000;
      dragStartPos.current.h = parseFloat(node.style?.height as string) || 500;
    }
  };

  const onNodeDragStop = async (_: React.MouseEvent, node: any) => {
    isInteractingRef.current = false;
    if (!dragStartPos.current) return;
    
    const newX = Math.round(node.position.x);
    const newY = Math.round(node.position.y);
    const newW = node.id === 'viewport-box' ? (parseFloat(node.style?.width as string) || 1000) : undefined;
    const newH = node.id === 'viewport-box' ? (parseFloat(node.style?.height as string) || 500) : undefined;

    const dx = Math.abs(newX - dragStartPos.current.x);
    const dy = Math.abs(newY - dragStartPos.current.y);
    if (dx < 1 && dy < 1) return; // ignore accidental clicks

    const action: HistoryAction = {
      type: 'move',
      nodeId: node.id,
      oldValue: { ...dragStartPos.current },
      newValue: { x: newX, y: newY, w: newW, h: newH }
    };

    setUndoStack(prev => [...prev, action]);
    setRedoStack([]);

    if (node.id === 'viewport-box') {
      try {
        await axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, {
          x: newX, y: newY, w: newW, h: newH
        });
      } catch (e) {}
      return;
    }
    
    try {
      await axios.patch(`${BACKEND_URL}/api/nodes/${node.id}/position`, {
        positionX: newX, positionY: newY,
      });
    } catch (e) { console.error('Failed to save position', e); }
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
  const onPaneClick = () => {
    setSelectedNode(null);
    setShowPaletteMenu(false);
    setShowDeleteMenu(false);
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    let type = event.dataTransfer.getData('application/reactflow/nodeType');
    let label = event.dataTransfer.getData('application/reactflow/nodeName');
    if (!type) {
      try {
        const parsed = JSON.parse(event.dataTransfer.getData('text/plain'));
        type = parsed.nodeType;
        label = parsed.nodeName;
      } catch (e) {}
    }
    if (!type || !rfInstance) return;

    const isSensor = ['water_level', 'ph', 'tds', 'temperature', 'sensor'].includes(type);
    const nodeW = isSensor ? 170 : type.includes('central') || type.includes('source') ? 220 : 200;
    const nodeH = isSensor ? 85 : 160;

    const rawPos = rfInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const posX = Math.round(rawPos.x - nodeW / 2);
    const posY = Math.round(rawPos.y - nodeH / 2);

    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const targetName = `${label || type}-${Math.floor(Math.random() * 900 + 100)}`;
    const { editMode: em, allowMoveResize: amr, allowMoveNodes: amn, allowResizeNodes: arn, allowDeleteNodes: adn } = interactivityRef.current;

    const optimisticNode = {
      id: tempId,
      type,
      position: { x: posX, y: posY },
      draggable: em && amr && amn,
      style: { width: nodeW, height: nodeH },
      data: {
        nodeName: targetName,
        status: 'healthy',
        nodeType: type,
        waterLevel: 65, ph: 7.1, tds: 210, temperature: 24,
        editMode: em,
        allowMoveResize: amr && arn,
        allowDeleteNodes: adn,
        onDeleteNode: handleDeleteNode
      }
    };

    setNodes((nds) => [...nds, optimisticNode]);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/nodes`, {
        topologyName: 'Star Topology',
        nodeName: targetName,
        nodeType: type,
        positionX: posX,
        positionY: posY,
        status: 'healthy'
      });

      const newNode = res.data;
      const wl   = newNode.sensors?.find((s: any) => s.sensorType === 'water_level')?.value ?? 65;
      const ph   = newNode.sensors?.find((s: any) => s.sensorType === 'ph')?.value ?? 7.1;
      const tds  = newNode.sensors?.find((s: any) => s.sensorType === 'tds')?.value ?? 210;
      const temp = newNode.sensors?.find((s: any) => s.sensorType === 'temperature')?.value ?? 24;

      setNodes((nds) => {
        // If socket already added real ID, remove temp node
        if (nds.some((n) => n.id === newNode.id)) {
          return nds.filter((n) => n.id !== tempId);
        }
        return nds.map((n) => n.id === tempId ? {
          ...n,
          id: newNode.id,
          position: { x: newNode.positionX, y: newNode.positionY },
          data: { ...n.data, waterLevel: wl, ph, tds, temperature: temp }
        } : n);
      });
    } catch (err) {
      console.error('Failed to spawn new node:', err);
      // Revert optimistic spawn if API fails
      setNodes((nds) => nds.filter((n) => n.id !== tempId));
    }
  }, [rfInstance, setNodes, handleDeleteNode]);

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

      {/* Top-left admin buttons (Viewport, Guide) */}
      {isAdmin && editMode && (
        <div style={{
          position: 'absolute', top: 16, left: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <button
            id="btn-viewport"
            onClick={() => setShowViewport(v => !v)}
            title="Viewport"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
              border: showViewport
                ? '1.5px solid rgba(200,241,53,0.50)'
                : '1.5px solid rgba(0,0,0,0.09)',
              background: showViewport ? '#17181c' : '#ffffff',
              boxShadow: showViewport
                ? '0 0 12px rgba(200,241,53,0.12), 0 2px 6px rgba(0,0,0,0.10)'
                : '0 2px 6px rgba(0,0,0,0.07)',
              fontFamily: FONT, transition: 'all 0.15s ease',
            }}
          >
            <Frame size={13} strokeWidth={2.2} color={showViewport ? '#c8f135' : '#9ca3af'} />
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '-0.1px',
              color: showViewport ? '#c8f135' : '#5a5f6b',
            }}>
              Viewport
            </span>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              background: showViewport ? '#c8f135' : 'transparent',
              boxShadow: showViewport ? '0 0 4px rgba(200,241,53,0.8)' : 'none',
              transition: 'all 0.15s ease',
            }} />
          </button>
          
          <button
            id="btn-guide"
            onClick={() => setShowCrosshair(v => !v)}
            title="Guide"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
              border: showCrosshair
                ? '1.5px solid rgba(200,241,53,0.50)'
                : '1.5px solid rgba(0,0,0,0.09)',
              background: showCrosshair ? '#17181c' : '#ffffff',
              boxShadow: showCrosshair
                ? '0 0 12px rgba(200,241,53,0.12), 0 2px 6px rgba(0,0,0,0.10)'
                : '0 2px 6px rgba(0,0,0,0.07)',
              fontFamily: FONT, transition: 'all 0.15s ease',
            }}
          >
            <Crosshair size={13} strokeWidth={2.2} color={showCrosshair ? '#c8f135' : '#9ca3af'} />
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '-0.1px',
              color: showCrosshair ? '#c8f135' : '#5a5f6b',
            }}>
              Guide
            </span>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              background: showCrosshair ? '#c8f135' : 'transparent',
              boxShadow: showCrosshair ? '0 0 4px rgba(200,241,53,0.8)' : 'none',
              transition: 'all 0.15s ease',
            }} />
          </button>

          {/* ── Asset Palette toggle button moved to left row ─── */}
          <div style={{ position: 'relative', display: 'flex' }}>
            <button
              id="btn-palette"
              onClick={() => {
                if (showPaletteMenu) {
                  setShowNodePalette(false);
                  setShowSensorPalette(false);
                } else {
                  setAllowMoveResize(false);
                  setShowDeleteMenu(false);
                }
                setShowPaletteMenu(v => !v);
              }}
              title="Asset Palette"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                border: showPaletteMenu
                  ? '1.5px solid rgba(200,241,53,0.50)'
                  : '1.5px solid rgba(0,0,0,0.09)',
                background: showPaletteMenu ? '#17181c' : '#ffffff',
                boxShadow: showPaletteMenu
                  ? '0 0 12px rgba(200,241,53,0.12), 0 2px 6px rgba(0,0,0,0.10)'
                  : '0 2px 6px rgba(0,0,0,0.07)',
                fontFamily: FONT, transition: 'all 0.15s ease',
              }}
            >
              <Layers size={13} strokeWidth={2.2} color={showPaletteMenu ? '#c8f135' : '#9ca3af'} />
              <span style={{
                fontSize: 12, fontWeight: 700, letterSpacing: '-0.1px',
                color: showPaletteMenu ? '#c8f135' : '#5a5f6b',
              }}>
                Asset Palette
              </span>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                background: showPaletteMenu ? '#c8f135' : 'transparent',
                boxShadow: showPaletteMenu ? '0 0 4px rgba(200,241,53,0.8)' : 'none',
                transition: 'all 0.15s ease',
              }} />
            </button>
            {showPaletteMenu && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 6,
                background: 'rgba(23, 24, 28, 0.70)', border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.20)', minWidth: 170, zIndex: 50, backdropFilter: 'blur(10px)'
              }}>
                <Switch checked={showNodePalette} onChange={setShowNodePalette} label="Node Palette" />
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 0' }} />
                <Switch checked={showSensorPalette} onChange={setShowSensorPalette} label="Sensor Palette" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top-right admin button row */}
      {isAdmin && (
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>

          {/* ── Move & Resize / Asset Palette / Delete Assets toggle buttons, only when edit mode is ON ─── */}
          {editMode && (
            <>
              {/* Divider */}
              <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,0.10)', margin: '0 2px' }} />

              {/* ── Delete Assets toggle button ─── */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <button
                  id="btn-delete-assets"
                  onClick={() => {
                    if (showDeleteMenu) {
                      setAllowDeleteNodes(false);
                    } else {
                      setAllowMoveResize(false);
                      setShowPaletteMenu(false);
                    }
                    setShowDeleteMenu(v => !v);
                  }}
                  title="Delete Assets"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                    border: showDeleteMenu
                      ? '1.5px solid rgba(200,241,53,0.50)'
                      : '1.5px solid rgba(0,0,0,0.09)',
                    background: showDeleteMenu ? '#17181c' : '#ffffff',
                    boxShadow: showDeleteMenu
                      ? '0 0 12px rgba(200,241,53,0.12), 0 2px 6px rgba(0,0,0,0.10)'
                      : '0 2px 6px rgba(0,0,0,0.07)',
                    fontFamily: FONT, transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={13} strokeWidth={2.2} color={showDeleteMenu ? '#c8f135' : '#9ca3af'} />
                  <span style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '-0.1px',
                    color: showDeleteMenu ? '#c8f135' : '#5a5f6b',
                  }}>
                    Delete Assets
                  </span>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                    background: showDeleteMenu ? '#c8f135' : 'transparent',
                    boxShadow: showDeleteMenu ? '0 0 4px rgba(200,241,53,0.8)' : 'none',
                    transition: 'all 0.15s ease',
                  }} />
                </button>
                {showDeleteMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 6,
                    background: 'rgba(23, 24, 28, 0.70)', border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.20)', minWidth: 160, zIndex: 50, backdropFilter: 'blur(10px)'
                  }}>
                    <Switch checked={allowDeleteNodes} onChange={setAllowDeleteNodes} label="Enable Deletion Icon" />
                  </div>
                )}
              </div>

              {/* ── Move & Resize toggle button ─── */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <button
                  id="btn-move"
                  onClick={() => {
                    if (allowMoveResize) {
                      setAllowMoveNodes(false);
                      setAllowResizeNodes(false);
                      setAllowMoveViewport(false);
                      setAllowResizeViewport(false);
                    } else {
                      setShowPaletteMenu(false);
                      setShowDeleteMenu(false);
                    }
                    setAllowMoveResize(v => !v);
                  }}
                  title="Move & Resize"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                    border: allowMoveResize
                      ? '1.5px solid rgba(200,241,53,0.50)'
                      : '1.5px solid rgba(0,0,0,0.09)',
                    background: allowMoveResize ? '#17181c' : '#ffffff',
                    boxShadow: allowMoveResize
                      ? '0 0 12px rgba(200,241,53,0.12), 0 2px 6px rgba(0,0,0,0.10)'
                      : '0 2px 6px rgba(0,0,0,0.07)',
                    fontFamily: FONT, transition: 'all 0.15s ease',
                  }}
                >
                  <Move size={13} strokeWidth={2.2} color={allowMoveResize ? '#c8f135' : '#9ca3af'} />
                  <span style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '-0.1px',
                    color: allowMoveResize ? '#c8f135' : '#5a5f6b',
                  }}>
                    Move & Resize
                  </span>
                  {/* ON indicator dot */}
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                    background: allowMoveResize ? '#c8f135' : 'transparent',
                    boxShadow: allowMoveResize ? '0 0 4px rgba(200,241,53,0.8)' : 'none',
                    transition: 'all 0.15s ease',
                  }} />
                </button>
                {allowMoveResize && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 6,
                    background: 'rgba(23, 24, 28, 0.70)', border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.20)', minWidth: 150, zIndex: 50, backdropFilter: 'blur(10px)'
                  }}>
                    <Switch checked={allowMoveNodes} onChange={setAllowMoveNodes} label="Move Nodes" />
                    <Switch checked={allowResizeNodes} onChange={setAllowResizeNodes} label="Resize Nodes" />
                    {showViewport && (
                      <>
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 0' }} />
                        <Switch checked={allowMoveViewport} onChange={setAllowMoveViewport} label="Move Viewport" />
                        <Switch checked={allowResizeViewport} onChange={setAllowResizeViewport} label="Resize Viewport" />
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Divider */}
              <div style={{ width: 1, height: 28, background: 'rgba(0,0,0,0.10)', margin: '0 2px' }} />
            </>
          )}

          {/* Edit Mode toggle — always shown for admin */}
          <EditModeButton editMode={editMode} onToggle={() => setEditMode((v) => !v)} isFullscreen={isFullscreen} />
        </div>
      )}

      {/* Edit mode active banner */}
      {editMode && <EditModeBanner />}
      {editMode && (showNodePalette || showSensorPalette) && (
        <FloatingNodePalette showNodePalette={showNodePalette} showSensorPalette={showSensorPalette} isMenuOpen={showPaletteMenu} />
      )}

      {/* Viewport Guide box moved inside ReactFlow */}

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
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        nodesDraggable={editMode && allowMoveResize}
        nodesConnectable={false}
        onlyRenderVisibleElements={true}
        minZoom={0.15}
        maxZoom={3.5}
        onInit={(instance) => {
  setRfInstance(instance);
}}
        className="bg-white"
        style={{ width: '100%', height: '100%', background: '#ffffff', opacity: isViewportReady ? 1 : 0, transition: 'opacity 0.25s ease-in-out' }}
      >
        <Background gap={isFullscreen ? 36 : 28} size={1.2} color="#e0e0e0" style={{ opacity: 0.8 }} />
        <CustomControls containerRef={containerRef} onUndo={handleUndo} onRedo={handleRedo} canUndo={undoStack.length > 0} canRedo={redoStack.length > 0} />

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
