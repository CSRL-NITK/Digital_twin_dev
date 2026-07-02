import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, memo } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  NodeResizer,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  useNodes,
  addEdge,
} from 'reactflow';
import type { Connection, Edge, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import Switch from '../components/ui/Switch';
import { io } from 'socket.io-client';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Lock, Check, RotateCcw, Maximize2, Minimize2, Frame, Crosshair, Move, Undo, Redo, Trash2, Layers, Gauge, Activity, Zap, Thermometer, Sliders } from 'lucide-react';

import NodeDetailsPanel from '../components/NodeDetailsPanel';
import { WaterTank as TankWaterTank } from '../components/nodes/WaterTank';
import { CentralWaterTank } from '../components/nodes/CentralWaterTank';
import { WaterTank as SourceWaterTank } from '../components/nodes/SourceWaterTank';
import { CentrifugalPumpSvg } from '../components/nodes/CentrifugalPump';
import { Pump3DSwitch } from '../components/nodes/Pump3DSwitch';
import { FloatingNodePalette } from '../components/topology/FloatingNodePalette';
import { AssetInspectorModal } from '../components/topology/AssetInspectorModal';
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
  allowMoveSwitches?: boolean;
  allowDeleteNodes?: boolean;
  flipHorizontal?: boolean;
  maxCapacity?: number;
  parentAssetId?: string;
  parentAssetName?: string;
  customWidth?: number;
  canControlPump?: boolean;
  switchOffsetX?: number;
  switchOffsetY?: number;
  switchScale?: number;
  inletSwitchOffsetX?: number;
  inletSwitchOffsetY?: number;
  inletSwitchScale?: number;
  outletSwitchOffsetX?: number;
  outletSwitchOffsetY?: number;
  outletSwitchScale?: number;
  inletValveOn?: boolean;
  outletValveOn?: boolean;
  targetPumpId?: string;
  hideSwitch?: boolean;
  inletHideSwitch?: boolean;
  outletHideSwitch?: boolean;
  waveHeightCalm?: number;
  waveHeightNormal?: number;
  waveHeightActive?: number;
  tempThreshold?: number;
  tempMaxThreshold?: number;
  onTogglePump?: (id: string, currentIsOn: boolean) => void;
  onToggleTankValve?: (id: string, valveType: 'inlet' | 'outlet', newVal: boolean) => void;
  onSwitchTransformEnd?: (id: string, x: number, y: number, scale: number, switchType?: 'inlet' | 'outlet') => void;
  onDeleteNode?: (id: string) => void;
  onResizeStart?: (params: any, nodeId?: string) => void;
  onResizeEnd?: (params: any, nodeId?: string) => void;
  onConnectSwitchToPump?: (switchId: string, targetPumpId: string) => void;
  onHidePumpSwitch?: (id: string) => void;
  onHideTankSwitch?: (id: string, valveType: 'inlet' | 'outlet') => void;
};

/* ─── helpers ────────────────────────────────────────────────────── */
const clampPercentage = (value: number | undefined) =>
  Math.max(0, Math.min(100, value ?? 0));

const deriveTankState = (data: LiveNodeData) => {
  const fillPercentage = clampPercentage(data?.waterLevel ?? 65);
  const temperature = data?.temperature ?? 24;
  return {
    fillPercentage,
    temperature,
    isFilling: fillPercentage < 98,
    isDraining: fillPercentage > 1,
    waveSpeed: fillPercentage > 75 ? 'fast' : fillPercentage > 40 ? 'medium' : 'slow',
    waveHeight: temperature > 55 ? 'active' : temperature > 35 ? 'normal' : 'calm',
  } as const;
};

const getDefaultNodeDimensions = (type: string = '', isSensor?: boolean) => {
  if (isSensor || ['water_level', 'ph', 'tds', 'temperature', 'sensor'].includes(type)) {
    return { width: 170, height: 85 };
  }
  if (type === 'switch') {
    return { width: 140, height: 180 };
  }
  if (type === 'pump') {
    return { width: 387, height: 242 };
  }
  if (type.includes('central') || type.includes('source') || type === 'source' || type.includes('tank')) {
    return { width: 295, height: 376 };
  }
  return { width: 295, height: 376 };
};

const buildCustomConfigs = (nodes: any[]) => {
  const customConfigs: Record<string, any> = {};
  nodes.forEach((n) => {
    if (n.id !== 'viewport-box' && !n.id.startsWith('temp-')) {
      customConfigs[n.id] = {
        flipHorizontal: n.data?.flipHorizontal,
        maxCapacity: n.data?.maxCapacity,
        parentAssetId: n.data?.parentAssetId,
        customWidth: n.data?.customWidth ?? (n.style as any)?.width,
        customHeight: n.data?.customHeight ?? (n.style as any)?.height,
        switchOffsetX: n.data?.switchOffsetX,
        switchOffsetY: n.data?.switchOffsetY,
        switchScale: n.data?.switchScale,
        inletSwitchOffsetX: n.data?.inletSwitchOffsetX,
        inletSwitchOffsetY: n.data?.inletSwitchOffsetY,
        inletSwitchScale: n.data?.inletSwitchScale,
        outletSwitchOffsetX: n.data?.outletSwitchOffsetX,
        outletSwitchOffsetY: n.data?.outletSwitchOffsetY,
        outletSwitchScale: n.data?.outletSwitchScale,
        inletValveOn: n.data?.inletValveOn,
        outletValveOn: n.data?.outletValveOn,
        targetPumpId: n.data?.targetPumpId,
        hideSwitch: n.data?.hideSwitch,
        inletHideSwitch: n.data?.inletHideSwitch,
        outletHideSwitch: n.data?.outletHideSwitch,
        waveHeightCalm: n.data?.waveHeightCalm,
        waveHeightNormal: n.data?.waveHeightNormal,
        waveHeightActive: n.data?.waveHeightActive,
        tempThreshold: n.data?.tempThreshold,
        tempMaxThreshold: n.data?.tempMaxThreshold,
      };
    }
  });
  return customConfigs;
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
  const isFlipped = !!data?.flipHorizontal;
  const isEditSwitches = !!data?.allowMoveSwitches;
  const { zoom } = useViewport();

  const inletOn = data?.inletValveOn !== false;
  const outletOn = data?.outletValveOn !== false;

  const [inletPos, setInletPos] = React.useState({
    x: data?.inletSwitchOffsetX ?? 68.6,
    y: data?.inletSwitchOffsetY ?? 51.2,
  });
  const [inletScale, setInletScale] = React.useState(data?.inletSwitchScale ?? 0.18);

  const [outletPos, setOutletPos] = React.useState({
    x: data?.outletSwitchOffsetX ?? 240.8,
    y: data?.outletSwitchOffsetY ?? 252.8,
  });
  const [outletScale, setOutletScale] = React.useState(data?.outletSwitchScale ?? 0.18);

  React.useEffect(() => {
    if (data?.inletSwitchOffsetX !== undefined) setInletPos(prev => ({ ...prev, x: data.inletSwitchOffsetX! }));
    if (data?.inletSwitchOffsetY !== undefined) setInletPos(prev => ({ ...prev, y: data.inletSwitchOffsetY! }));
    if (data?.inletSwitchScale !== undefined) setInletScale(data.inletSwitchScale);
    if (data?.outletSwitchOffsetX !== undefined) setOutletPos(prev => ({ ...prev, x: data.outletSwitchOffsetX! }));
    if (data?.outletSwitchOffsetY !== undefined) setOutletPos(prev => ({ ...prev, y: data.outletSwitchOffsetY! }));
    if (data?.outletSwitchScale !== undefined) setOutletScale(data.outletSwitchScale);
  }, [data?.inletSwitchOffsetX, data?.inletSwitchOffsetY, data?.inletSwitchScale, data?.outletSwitchOffsetX, data?.outletSwitchOffsetY, data?.outletSwitchScale]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(data?.customWidth || 295);

  React.useLayoutEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.clientWidth || data?.customWidth || 295);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [data?.customWidth]);

  const scaleRatio = containerWidth / 295;

  const handleSwitchDrag = (e: React.MouseEvent, type: 'inlet' | 'outlet') => {
    if (!isEditSwitches) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origPos = type === 'inlet' ? inletPos : outletPos;
    const origScale = type === 'inlet' ? inletScale : outletScale;
    const currentZoom = zoom || 1;

    const onMove = (moveEvt: MouseEvent) => {
      const dx = (moveEvt.clientX - startX) / (currentZoom * scaleRatio);
      const dy = (moveEvt.clientY - startY) / (currentZoom * scaleRatio);
      if (type === 'inlet') setInletPos({ x: origPos.x + dx, y: origPos.y + dy });
      else setOutletPos({ x: origPos.x + dx, y: origPos.y + dy });
    };

    const onUp = (upEvt: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const dx = (upEvt.clientX - startX) / (currentZoom * scaleRatio);
      const dy = (upEvt.clientY - startY) / (currentZoom * scaleRatio);
      data?.onSwitchTransformEnd?.(id, origPos.x + dx, origPos.y + dy, origScale, type);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleSwitchResize = (e: React.MouseEvent, type: 'inlet' | 'outlet') => {
    if (!isEditSwitches) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const origScale = type === 'inlet' ? inletScale : outletScale;
    const origPos = type === 'inlet' ? inletPos : outletPos;
    const currentZoom = zoom || 1;

    const onMove = (moveEvt: MouseEvent) => {
      const dx = (moveEvt.clientX - startX) / (currentZoom * scaleRatio);
      const nextScale = Math.max(0.18, Math.min(1.5, origScale + dx * 0.004));
      if (type === 'inlet') setInletScale(nextScale);
      else setOutletScale(nextScale);
    };

    const onUp = (upEvt: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const dx = (upEvt.clientX - startX) / (currentZoom * scaleRatio);
      const finalScale = Math.max(0.18, Math.min(1.5, origScale + dx * 0.004));
      data?.onSwitchTransformEnd?.(id, origPos.x, origPos.y, finalScale, type);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const effInletX = inletPos.x * scaleRatio;
  const effInletY = inletPos.y * scaleRatio;
  const effInletScale = inletScale * scaleRatio;

  const effOutletX = outletPos.x * scaleRatio;
  const effOutletY = outletPos.y * scaleRatio;
  const effOutletScale = outletScale * scaleRatio;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minWidth: 160, minHeight: 204, position: 'relative' }}>
      <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />

      {/* Inlet Valve Switch */}
      <div
        className="nodrag nopan"
        style={{
          position: 'absolute',
          top: effInletY,
          left: effInletX,
          width: 150 * effInletScale,
          height: 195 * effInletScale,
          zIndex: 35,
          border: isEditSwitches ? '2px solid #c8f135' : 'none',
          backgroundColor: isEditSwitches ? 'rgba(200, 241, 53, 0.08)' : 'transparent',
          borderRadius: 6,
        }}
      >
        {isEditSwitches && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              marginBottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'max-content',
              textAlign: 'center',
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: '#c8f135',
              background: '#17181c',
              border: '1.5px solid #c8f135',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              borderRadius: 4,
              padding: '2px 6px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            {`INLET - ${data?.nodeName?.toUpperCase() || 'TANK'}`}
          </div>
        )}
        <div
          className="nodrag nopan"
          onMouseDown={(e) => handleSwitchDrag(e, 'inlet')}
          style={{ width: '100%', height: '100%', cursor: isEditSwitches ? 'move' : 'default' }}
        >
          <Pump3DSwitch
            isOn={inletOn}
            canControl={!isEditSwitches}
            onToggle={() => {
              if (!isEditSwitches) data?.onToggleTankValve?.(id, 'inlet', !inletOn);
            }}
            scale={effInletScale}
          />
        </div>
        {isEditSwitches && (
          <>
            <div className="nodrag nopan" onMouseDown={(e) => handleSwitchResize(e, 'inlet')} style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, background: '#c8f135', border: '1px solid #17181c', borderRadius: 2, cursor: 'nwse-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={(e) => handleSwitchResize(e, 'inlet')} style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: '#c8f135', border: '1px solid #17181c', borderRadius: 2, cursor: 'nesw-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={(e) => handleSwitchResize(e, 'inlet')} style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, background: '#c8f135', border: '1px solid #17181c', borderRadius: 2, cursor: 'nesw-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={(e) => handleSwitchResize(e, 'inlet')} style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, background: '#c8f135', border: '1px solid #17181c', borderRadius: 2, cursor: 'nwse-resize', zIndex: 40 }} />
          </>
        )}
      </div>

      {/* Outlet Valve Switch */}
      <div
        className="nodrag nopan"
        style={{
          position: 'absolute',
          top: effOutletY,
          left: effOutletX,
          width: 150 * effOutletScale,
          height: 195 * effOutletScale,
          zIndex: 35,
          border: isEditSwitches ? '2px solid #c8f135' : 'none',
          backgroundColor: isEditSwitches ? 'rgba(200, 241, 53, 0.08)' : 'transparent',
          borderRadius: 6,
        }}
      >
        {isEditSwitches && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              marginBottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'max-content',
              textAlign: 'center',
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: '#c8f135',
              background: '#17181c',
              border: '1.5px solid #c8f135',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              borderRadius: 4,
              padding: '2px 6px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            {`OUTLET - ${data?.nodeName?.toUpperCase() || 'TANK'}`}
          </div>
        )}
        <div
          className="nodrag nopan"
          onMouseDown={(e) => handleSwitchDrag(e, 'outlet')}
          style={{ width: '100%', height: '100%', cursor: isEditSwitches ? 'move' : 'default' }}
        >
          <Pump3DSwitch
            isOn={outletOn}
            canControl={!isEditSwitches}
            onToggle={() => {
              if (!isEditSwitches) data?.onToggleTankValve?.(id, 'outlet', !outletOn);
            }}
            scale={effOutletScale}
          />
        </div>
        {isEditSwitches && (
          <>
            <div className="nodrag nopan" onMouseDown={(e) => handleSwitchResize(e, 'outlet')} style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, background: '#c8f135', border: '1px solid #17181c', borderRadius: 2, cursor: 'nwse-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={(e) => handleSwitchResize(e, 'outlet')} style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: '#c8f135', border: '1px solid #17181c', borderRadius: 2, cursor: 'nesw-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={(e) => handleSwitchResize(e, 'outlet')} style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, background: '#c8f135', border: '1px solid #17181c', borderRadius: 2, cursor: 'nesw-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={(e) => handleSwitchResize(e, 'outlet')} style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, background: '#c8f135', border: '1px solid #17181c', borderRadius: 2, cursor: 'nwse-resize', zIndex: 40 }} />
          </>
        )}
      </div>

      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={true}
          minWidth={160} minHeight={204}
          isVisible={selected}
          onResizeStart={(_evt, params) => data.onResizeStart && data.onResizeStart(params, id)}
          onResizeEnd={(_evt, params) => data.onResizeEnd && data.onResizeEnd(params, id)}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}
      <div style={{ width: '100%', height: '100%', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease' }}>
        <TankWaterTank
          fillPercentage={tankState.fillPercentage}
          isFilling={tankState.isFilling && inletOn}
          isDraining={tankState.isDraining && outletOn}
          showInletPipe={true}
          showOutletPipe={true}
          waveSpeed={(!inletOn && !outletOn) ? 'slow' : tankState.waveSpeed}
          waveHeight={(!inletOn && !outletOn) ? 'calm' : tankState.waveHeight}
          temperature={tankState.temperature}
          waveHeightCalm={data?.waveHeightCalm}
          waveHeightNormal={data?.waveHeightNormal}
          waveHeightActive={data?.waveHeightActive}
          tempThreshold={data?.tempThreshold}
          tempMaxThreshold={data?.tempMaxThreshold}
        />
      </div>
    </div>
  );
}

function CentralTankNodeView({ id, data, selected }: NodeProps<LiveNodeData>) {
  const tankState = deriveTankState(data ?? {});
  const isFlipped = !!data?.flipHorizontal;
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 170, minHeight: 200 }}>
      <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />
      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={true}
          minWidth={170} minHeight={200}
          isVisible={selected}
          onResizeStart={(_evt, params) => data.onResizeStart && data.onResizeStart(params, id)}
          onResizeEnd={(_evt, params) => data.onResizeEnd && data.onResizeEnd(params, id)}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}
      <div style={{ width: '100%', height: '100%', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease' }}>
        <CentralWaterTank
          fillPercentage={tankState.fillPercentage}
          isFilling={tankState.isFilling}
          isDraining={tankState.isDraining}
          waveSpeed={tankState.waveSpeed}
          waveHeight={tankState.waveHeight}
          temperature={tankState.temperature}
          waveHeightCalm={data?.waveHeightCalm}
          waveHeightNormal={data?.waveHeightNormal}
          waveHeightActive={data?.waveHeightActive}
          tempThreshold={data?.tempThreshold}
          tempMaxThreshold={data?.tempMaxThreshold}
        />
      </div>
    </div>
  );
}

function SourceTankNodeView({ id, data, selected }: NodeProps<LiveNodeData>) {
  const tankState = deriveTankState(data ?? {});
  const isFlipped = !!data?.flipHorizontal;
  return (
    <div style={{ width: '100%', height: '100%', minWidth: 170, minHeight: 200 }}>
      <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />
      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={true}
          minWidth={170} minHeight={200}
          isVisible={selected}
          onResizeStart={(_evt, params) => data.onResizeStart && data.onResizeStart(params, id)}
          onResizeEnd={(_evt, params) => data.onResizeEnd && data.onResizeEnd(params, id)}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}
      <div style={{ width: '100%', height: '100%', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease' }}>
        <SourceWaterTank
          fillPercentage={tankState.fillPercentage}
          isFilling={tankState.isFilling}
          isDraining={tankState.isDraining}
          waveSpeed={tankState.waveSpeed}
          waveHeight={tankState.waveHeight}
          temperature={tankState.temperature}
          waveHeightCalm={data?.waveHeightCalm}
          waveHeightNormal={data?.waveHeightNormal}
          waveHeightActive={data?.waveHeightActive}
          tempThreshold={data?.tempThreshold}
          tempMaxThreshold={data?.tempMaxThreshold}
        />
      </div>
    </div>
  );
}

function SwitchNodeView({ id, data, selected }: NodeProps<LiveNodeData>) {
  const allNodes = useNodes();
  const targetPumpId = data?.targetPumpId;
  const targetPump = targetPumpId ? allNodes.find(n => n.id === targetPumpId) : null;

  const status = (targetPump?.data as LiveNodeData | undefined)?.status ?? data?.status ?? 'Healthy';
  const isOn = status !== 'Offline';
  const canControl = true;
  const isEditSwitches = !!data?.allowMoveSwitches;
  const { zoom } = useViewport();

  const [switchScale, setSwitchScale] = React.useState(data?.switchScale ?? 0.6);

  React.useEffect(() => {
    setSwitchScale(data?.switchScale ?? 0.6);
  }, [data?.switchScale]);

  const handleSwitchResizeMouseDown = (e: React.MouseEvent) => {
    if (!isEditSwitches) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const origScale = switchScale;
    const currentZoom = zoom || 1;

    const onMove = (moveEvt: MouseEvent) => {
      const dx = (moveEvt.clientX - startX) / currentZoom;
      const nextScale = Math.max(0.25, Math.min(1.8, origScale + dx * 0.005));
      setSwitchScale(nextScale);
    };

    const onUp = (upEvt: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const dx = (upEvt.clientX - startX) / currentZoom;
      const finalScale = Math.max(0.25, Math.min(1.8, origScale + dx * 0.005));
      data?.onSwitchTransformEnd?.(id, 0, 0, finalScale);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const boxWidth = 150 * switchScale;
  const boxHeight = 195 * switchScale;

  return (
    <div style={{ width: '100%', height: '100%', minWidth: 140, minHeight: 180, position: 'relative' }}>
      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={true}
          minWidth={140} minHeight={180}
          isVisible={selected}
          onResizeStart={(_evt, params) => data.onResizeStart && data.onResizeStart(params, id)}
          onResizeEnd={(_evt, params) => data.onResizeEnd && data.onResizeEnd(params, id)}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}

      {/* 3D Switch Box */}
      <div
        className="nodrag nopan"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: boxWidth,
          height: boxHeight,
          zIndex: 35,
          border: isEditSwitches ? '2px solid #c8f135' : 'none',
          backgroundColor: isEditSwitches ? 'rgba(200, 241, 53, 0.08)' : 'transparent',
          borderRadius: 6,
        }}
      >
        <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />
        {isEditSwitches && (
          <div style={{ position: 'absolute', top: -18, left: 0, right: 0, textAlign: 'center', fontSize: 9, fontWeight: 800, color: '#c8f135', background: '#17181c', borderRadius: 3, padding: '2px 4px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            {`SWITCH - ${data?.nodeName?.toUpperCase() || 'CONTROL'}`}
          </div>
        )}
        <div style={{ width: '100%', height: '100%' }}>
          <Pump3DSwitch
            isOn={isOn}
            canControl={canControl && !isEditSwitches}
            onToggle={() => {
              if (!isEditSwitches) data?.onTogglePump?.(targetPumpId || id, isOn);
            }}
            scale={switchScale}
          />
        </div>
        {isEditSwitches && (
          <>
            <div className="nodrag nopan" onMouseDown={handleSwitchResizeMouseDown} style={{ position: 'absolute', top: -5, left: -5, width: 10, height: 10, background: '#c8f135', border: '1.5px solid #17181c', borderRadius: 3, cursor: 'nwse-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={handleSwitchResizeMouseDown} style={{ position: 'absolute', top: -5, right: -5, width: 10, height: 10, background: '#c8f135', border: '1.5px solid #17181c', borderRadius: 3, cursor: 'nesw-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={handleSwitchResizeMouseDown} style={{ position: 'absolute', bottom: -5, left: -5, width: 10, height: 10, background: '#c8f135', border: '1.5px solid #17181c', borderRadius: 3, cursor: 'nesw-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={handleSwitchResizeMouseDown} style={{ position: 'absolute', bottom: -5, right: -5, width: 10, height: 10, background: '#c8f135', border: '1.5px solid #17181c', borderRadius: 3, cursor: 'nwse-resize', zIndex: 40 }} />
          </>
        )}
      </div>
    </div>
  );
}
function PumpNodeView({ id, data, selected }: NodeProps<LiveNodeData>) {
  const allNodes = useNodes();
  const targetPumpId = data?.targetPumpId;
  const targetPump = targetPumpId && targetPumpId !== id ? allNodes.find(n => n.id === targetPumpId) : null;

  const status = (targetPump?.data as LiveNodeData | undefined)?.status ?? data?.status ?? 'Healthy';
  const isOn = status !== 'Offline';
  const vibrationBoost = status === 'Critical' ? 1.5 : status === 'Warning' ? 1.15 : 1;
  const isFlipped = !!data?.flipHorizontal;
  const canControl = true;
  const isEditSwitches = !!data?.allowMoveSwitches;
  const { zoom } = useViewport();

  const [switchPos, setSwitchPos] = React.useState({
    x: data?.switchOffsetX ?? 186.5,
    y: data?.switchOffsetY ?? 140.4,
  });
  const [switchScale, setSwitchScale] = React.useState(data?.switchScale ?? 0.18);

  React.useEffect(() => {
    if (data?.switchOffsetX !== undefined) setSwitchPos(prev => ({ ...prev, x: data.switchOffsetX! }));
    if (data?.switchOffsetY !== undefined) setSwitchPos(prev => ({ ...prev, y: data.switchOffsetY! }));
    if (data?.switchScale !== undefined) setSwitchScale(data.switchScale);
  }, [data?.switchOffsetX, data?.switchOffsetY, data?.switchScale]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(data?.customWidth || 387);

  React.useLayoutEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.clientWidth || data?.customWidth || 387);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [data?.customWidth]);

  const scaleRatio = containerWidth / 387;

  const handleSwitchMouseDown = (e: React.MouseEvent) => {
    if (!isEditSwitches) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = switchPos.x;
    const origY = switchPos.y;
    const currentZoom = zoom || 1;

    const onMove = (moveEvt: MouseEvent) => {
      const dx = (moveEvt.clientX - startX) / (currentZoom * scaleRatio);
      const dy = (moveEvt.clientY - startY) / (currentZoom * scaleRatio);
      setSwitchPos({ x: origX + dx, y: origY + dy });
    };

    const onUp = (upEvt: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const dx = (upEvt.clientX - startX) / (currentZoom * scaleRatio);
      const dy = (upEvt.clientY - startY) / (currentZoom * scaleRatio);
      data?.onSwitchTransformEnd?.(id, origX + dx, origY + dy, switchScale);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleSwitchResizeMouseDown = (e: React.MouseEvent) => {
    if (!isEditSwitches) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const origScale = switchScale;
    const currentZoom = zoom || 1;

    const onMove = (moveEvt: MouseEvent) => {
      const dx = (moveEvt.clientX - startX) / (currentZoom * scaleRatio);
      const nextScale = Math.max(0.18, Math.min(1.5, origScale + dx * 0.004));
      setSwitchScale(nextScale);
    };

    const onUp = (upEvt: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const dx = (upEvt.clientX - startX) / (currentZoom * scaleRatio);
      const finalScale = Math.max(0.18, Math.min(1.5, origScale + dx * 0.004));
      data?.onSwitchTransformEnd?.(id, switchPos.x, switchPos.y, finalScale);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const effX = switchPos.x * scaleRatio;
  const effY = switchPos.y * scaleRatio;
  const effScale = switchScale * scaleRatio;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minWidth: 160, minHeight: 100, position: 'relative' }}>
      <AdminNodeDeleteBtn id={id} nodeName={data?.nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />

      <div
        className="nodrag nopan"
        style={{
          position: 'absolute',
          top: effY,
          left: effX,
          width: 150 * effScale,
          height: 195 * effScale,
          zIndex: 35,
          border: isEditSwitches ? '2px solid #c8f135' : 'none',
          backgroundColor: isEditSwitches ? 'rgba(200, 241, 53, 0.08)' : 'transparent',
          borderRadius: 6,
        }}
      >
        {isEditSwitches && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              marginBottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'max-content',
              textAlign: 'center',
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: '#c8f135',
              background: '#17181c',
              border: '1.5px solid #c8f135',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              borderRadius: 4,
              padding: '2px 6px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            {`POWER - ${data?.nodeName?.toUpperCase() || 'PUMP'}`}
          </div>
        )}
        <div
          className="nodrag nopan"
          onMouseDown={isEditSwitches ? handleSwitchMouseDown : undefined}
          style={{
            width: '100%',
            height: '100%',
            cursor: isEditSwitches ? 'move' : 'default',
          }}
        >
          <Pump3DSwitch
            isOn={isOn}
            canControl={canControl && !isEditSwitches}
            onToggle={() => {
              if (!isEditSwitches) data?.onTogglePump?.(targetPumpId || id, isOn);
            }}
            scale={effScale}
          />
        </div>

        {/* ── Exact 4 Corner Square Resize Handles matching NodeResizer ── */}
        {isEditSwitches && (
          <>
            <div className="nodrag nopan" onMouseDown={handleSwitchResizeMouseDown} style={{ position: 'absolute', top: -5, left: -5, width: 10, height: 10, background: '#c8f135', border: '1.5px solid #17181c', borderRadius: 3, cursor: 'nwse-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={handleSwitchResizeMouseDown} style={{ position: 'absolute', top: -5, right: -5, width: 10, height: 10, background: '#c8f135', border: '1.5px solid #17181c', borderRadius: 3, cursor: 'nesw-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={handleSwitchResizeMouseDown} style={{ position: 'absolute', bottom: -5, left: -5, width: 10, height: 10, background: '#c8f135', border: '1.5px solid #17181c', borderRadius: 3, cursor: 'nesw-resize', zIndex: 40 }} />
            <div className="nodrag nopan" onMouseDown={handleSwitchResizeMouseDown} style={{ position: 'absolute', bottom: -5, right: -5, width: 10, height: 10, background: '#c8f135', border: '1.5px solid #17181c', borderRadius: 3, cursor: 'nwse-resize', zIndex: 40 }} />
          </>
        )}
      </div>
      {data.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={true}
          minWidth={160} minHeight={100}
          isVisible={selected}
          onResizeStart={(_evt, params) => data.onResizeStart && data.onResizeStart(params, id)}
          onResizeEnd={(_evt, params) => data.onResizeEnd && data.onResizeEnd(params, id)}
          lineStyle={{ borderColor: '#c8f135', borderWidth: 2 }}
          handleStyle={{ background: '#c8f135', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}
      <div style={{ width: '100%', height: '100%', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease' }}>
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
          onResizeStart={(_evt, params) => data.onResizeStart && data.onResizeStart(params, id)}
          onResizeEnd={(_evt, params) => data.onResizeEnd && data.onResizeEnd(params, id)}
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
          {data?.parentAssetName && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '1px 5px', borderRadius: 4, marginTop: 2, display: 'inline-block', width: 'fit-content' }}>
              🔗 {data.parentAssetName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewportGuideNode({ id, data, selected }: NodeProps<any>) {
  const { allowMoveResize } = data;
  return (
    <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      {allowMoveResize && (
        <NodeResizer
          minWidth={200}
          keepAspectRatio={true}
          isVisible={selected}
          onResizeStart={(_evt, params) => data.onResizeStart && data.onResizeStart(params, id || 'viewport-box')}
          onResizeEnd={(_evt, params) => data.onResizeEnd && data.onResizeEnd(params, id || 'viewport-box')}
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
const SwitchNodeViewMemo = memo(SwitchNodeView);
const PumpNodeViewMemo = memo(PumpNodeView);
const SensorNodeViewMemo = memo(SensorNodeView);

const nodeTypes = {
  viewportGuide: ViewportGuideNodeMemo,
  tank: TankNodeViewMemo,
  central_tank: CentralTankNodeViewMemo,
  source_tank: SourceTankNodeViewMemo,
  source: SourceTankNodeViewMemo,
  switch: SwitchNodeViewMemo,
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
      fitBounds({ x: vpNode.position.x, y: vpNode.position.y, width: parseFloat(vpNode.style?.width as string), height: parseFloat(vpNode.style?.height as string) }, { duration: 400, padding: isFullscreen ? 0.20 : 0 });
    } else {
      setCenter(0, 0, { zoom: isFullscreen ? 0.85 : 1, duration: 400 });
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
  const [allowMoveSwitches, setAllowMoveSwitches] = useState(false); // move & resize switches
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [showSensorPalette, setShowSensorPalette] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [allowDeleteNodes, setAllowDeleteNodes] = useState(false);
  const [allowCustomizeNodes, setAllowCustomizeNodes] = useState(false);
  const [activeCustomizeNodeId, setActiveCustomizeNodeId] = useState<string | null>(null);
  const [initialViewportConfig, setInitialViewportConfig] = useState<any>(null);
  const [isViewportReady, setIsViewportReady] = useState(false);
  
  const { isAdmin, role } = useAuth();
  const canControlPump = isAdmin || role === 'operator';
  const containerRef = useRef<HTMLDivElement>(null);
  const interactivityRef = useRef({
    editMode: false,
    allowMoveResize: false,
    allowMoveNodes: false,
    allowResizeNodes: false,
    allowDeleteNodes: false,
    allowMoveSwitches: false,
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

  /* ── Resize Handlers ───────────────────────────────────── */
  const handleNodeResizeStart = useCallback((params: any, _nodeId?: string) => {
    isInteractingRef.current = true;
    resizeStartDim.current = {
      x: Math.round(params.x),
      y: Math.round(params.y),
      w: Math.round(params.width),
      h: Math.round(params.height),
    };
  }, []);

  const handleNodeResizeEnd = useCallback(async (params: any, nodeId?: string) => {
    isInteractingRef.current = false;
    const targetId = nodeId || params?.id || 'viewport-box';
    const newX = Math.round(params.x);
    const newY = Math.round(params.y);
    const newW = Math.round(params.width);
    const newH = Math.round(params.height);

    if (resizeStartDim.current) {
      if (Math.abs(newW - resizeStartDim.current.w) > 1 || Math.abs(newH - resizeStartDim.current.h) > 1) {
        setUndoStack((prev) => [
          ...prev,
          {
            type: 'resize',
            nodeId: targetId,
            oldValue: resizeStartDim.current,
            newValue: { x: newX, y: newY, w: newW, h: newH },
          },
        ]);
        setRedoStack([]);
      }
    }

    if (targetId === 'viewport-box') {
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
      try {
        await axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, {
          x: newX, y: newY, w: newW, h: newH,
        });
      } catch (e) {}
      return;
    }

    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
        if (n.id === targetId) {
          return {
            ...n,
            position: { x: newX, y: newY },
            style: { ...n.style, width: newW, height: newH },
            data: {
              ...n.data,
              customWidth: newW,
              customHeight: newH,
            },
          };
        }
        return n;
      });

      const customConfigs = buildCustomConfigs(updatedNodes);

      axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, { customConfigs }).catch(console.error);
      return updatedNodes;
    });

    try {
      await axios.patch(`${BACKEND_URL}/api/nodes/${targetId}/position`, {
        positionX: newX, positionY: newY,
      });
    } catch (e) { console.error('Failed to save resize position', e); }
  }, [setNodes]);

  /* ── Pump ON/OFF Switch Helper ──────────────────────── */
  const handleTogglePump = useCallback(async (id: string, currentIsOn: boolean) => {
    const nextStatus = currentIsOn ? 'Offline' : 'Healthy';
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: { ...n.data, status: nextStatus },
          };
        }
        return n;
      })
    );
    setSelectedNode((prev: any) => {
      if (prev && prev.id === id) {
        return { ...prev, status: nextStatus };
      }
      return prev;
    });
    try {
      await axios.patch(`${BACKEND_URL}/api/nodes/${id}`, { status: nextStatus });
    } catch (e) {
      console.error('Failed to toggle pump status:', e);
    }
  }, [setNodes]);

  /* ── Pump/Tank Switch Move/Resize Helper ──────────────────── */
  const handleSwitchTransformEnd = useCallback((id: string, x: number, y: number, scale: number, switchType?: 'inlet' | 'outlet') => {
    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
        if (n.id === id) {
          if (switchType === 'inlet') {
            return {
              ...n,
              data: {
                ...n.data,
                inletSwitchOffsetX: x,
                inletSwitchOffsetY: y,
                inletSwitchScale: scale,
              },
            };
          } else if (switchType === 'outlet') {
            return {
              ...n,
              data: {
                ...n.data,
                outletSwitchOffsetX: x,
                outletSwitchOffsetY: y,
                outletSwitchScale: scale,
              },
            };
          } else {
            return {
              ...n,
              data: {
                ...n.data,
                switchOffsetX: x,
                switchOffsetY: y,
                switchScale: scale,
              },
            };
          }
        }
        return n;
      });

      const customConfigs = buildCustomConfigs(updatedNodes);
      axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, { customConfigs }).catch(console.error);
      return updatedNodes;
    });
  }, [setNodes]);

  /* ── Tank Valve ON/OFF Helper ──────────────────────── */
  const handleToggleTankValve = useCallback((id: string, valveType: 'inlet' | 'outlet', newVal: boolean) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              [valveType === 'inlet' ? 'inletValveOn' : 'outletValveOn']: newVal,
            },
          };
        }
        return n;
      });
      const customConfigs = buildCustomConfigs(updatedNodes);
      axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, { customConfigs }).catch(console.error);
      return updatedNodes;
    });
  }, [setNodes]);

  /* ── Switch Magnetic Wire Connection Helper ──────────────────── */
  const handleConnectSwitchToPump = useCallback((switchId: string, targetPumpId: string) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
        if (n.id === switchId) {
          return {
            ...n,
            data: {
              ...n.data,
              targetPumpId,
            },
          };
        }
        return n;
      });

      const customConfigs = buildCustomConfigs(updatedNodes);
      axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, { customConfigs }).catch(console.error);
      return updatedNodes;
    });
  }, [setNodes]);

  /* ── Hide Embedded Pump Switch Helper ──────────────────────── */
  const handleHidePumpSwitch = useCallback((id: string) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              hideSwitch: true,
            },
          };
        }
        return n;
      });

      const customConfigs = buildCustomConfigs(updatedNodes);
      axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, { customConfigs }).catch(console.error);
      return updatedNodes;
    });
  }, [setNodes]);

  /* ── Hide Embedded Tank Switch Helper ──────────────────────── */
  const handleHideTankSwitch = useCallback((id: string, valveType: 'inlet' | 'outlet') => {
    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              [valveType === 'inlet' ? 'inletHideSwitch' : 'outletHideSwitch']: true,
            },
          };
        }
        return n;
      });

      const customConfigs = buildCustomConfigs(updatedNodes);
      axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, { customConfigs }).catch(console.error);
      return updatedNodes;
    });
  }, [setNodes]);

  /* ── Delete Node Helper ──────────────────────────────── */
  const handleDeleteNode = useCallback(async (id: string) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/nodes/${id}`);
    } catch (e) {
      console.warn('Backend delete node notice:', e);
    } finally {
      setNodes((nds) => {
        const remaining = nds.filter((n) => n.id !== id);
        const customConfigs = buildCustomConfigs(remaining);
        axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, { customConfigs }).catch(console.error);
        return remaining;
      });
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    }
  }, [setNodes, setEdges]);

  /* ── Unified Effect: push editMode/allowMoveResize/showViewport into nodes ─ */
  useEffect(() => {
    interactivityRef.current = { editMode, allowMoveResize, allowMoveNodes, allowResizeNodes, allowDeleteNodes, allowMoveSwitches };

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
      setAllowCustomizeNodes(false);
      setActiveCustomizeNodeId(null);
      setUndoStack([]);
      setRedoStack([]);
    }

    setNodes((nds) => {
      if (!editMode) {
        nds.forEach((n) => {
          if (n.id !== 'viewport-box' && !n.id.startsWith('temp-')) {
            axios.patch(`${BACKEND_URL}/api/nodes/${n.id}/position`, {
              positionX: Math.round(n.position?.x ?? 0),
              positionY: Math.round(n.position?.y ?? 0),
            }).catch(() => {});
          }
        });
        const customConfigs = buildCustomConfigs(nds);
        axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, { customConfigs }).catch(() => {});
      }
      return nds.map((n) => {
        if (n.id === 'viewport-box') {
          const isViewportInteractive = allowMoveResize && (allowMoveViewport || allowResizeViewport);
          return {
            ...n,
            hidden: !(editMode && showViewport),
            draggable: editMode && allowMoveResize && allowMoveViewport,
            style: { ...n.style, pointerEvents: isViewportInteractive ? 'auto' : 'none' },
            data: {
              ...n.data,
              allowMoveResize: allowMoveResize && allowResizeViewport,
              onResizeStart: handleNodeResizeStart,
              onResizeEnd: handleNodeResizeEnd,
            }
          };
        }
        const isSwitchNode = n.type === 'switch';
        const canDrag = isSwitchNode
          ? (editMode && allowMoveSwitches)
          : (editMode && allowMoveResize && allowMoveNodes && !allowMoveSwitches);

        return {
          ...n,
          draggable: canDrag,
          data: {
            ...n.data,
            editMode,
            allowMoveResize: allowMoveResize && allowResizeNodes && !allowMoveSwitches,
            allowMoveSwitches: editMode && allowMoveSwitches,
            allowDeleteNodes,
            canControlPump,
            onTogglePump: handleTogglePump,
            onToggleTankValve: handleToggleTankValve,
            onSwitchTransformEnd: handleSwitchTransformEnd,
            onConnectSwitchToPump: handleConnectSwitchToPump,
            onHidePumpSwitch: handleHidePumpSwitch,
            onHideTankSwitch: handleHideTankSwitch,
            onDeleteNode: handleDeleteNode,
            onResizeStart: handleNodeResizeStart,
            onResizeEnd: handleNodeResizeEnd,
          },
        };
      });
    });
  }, [editMode, allowMoveResize, allowMoveNodes, allowResizeNodes, allowMoveSwitches, allowMoveViewport, allowResizeViewport, showViewport, allowDeleteNodes, canControlPump, handleTogglePump, handleToggleTankValve, handleSwitchTransformEnd, handleConnectSwitchToPump, handleHidePumpSwitch, handleHideTankSwitch, setNodes, setSelectedNode, handleDeleteNode, handleNodeResizeStart, handleNodeResizeEnd]);

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

  /* ── Rule 1: Edit Mode ON → enter fullscreen automatically & center viewport box ── */
  useEffect(() => {
    if (editMode) {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen().catch(console.error);
      }
      if (rfInstance) {
        setTimeout(() => {
          const vpNode = rfInstance.getNodes().find((n: any) => n.id === 'viewport-box');
          if (vpNode) {
            rfInstance.fitBounds({
              x: vpNode.position.x,
              y: vpNode.position.y,
              width: parseFloat(vpNode.style?.width as string) || 1000,
              height: parseFloat(vpNode.style?.height as string) || 500,
            }, { duration: 400, padding: 0.20 });
          } else {
            rfInstance.setCenter(0, 0, { zoom: 0.85, duration: 400 });
          }
        }, 150);
      }
    } else if (rfInstance && !document.fullscreenElement) {
      setTimeout(() => {
        const vpNode = rfInstance.getNodes().find((n: any) => n.id === 'viewport-box');
        if (vpNode) {
          rfInstance.fitBounds({
            x: vpNode.position.x,
            y: vpNode.position.y,
            width: parseFloat(vpNode.style?.width as string) || 1000,
            height: parseFloat(vpNode.style?.height as string) || 500,
          }, { duration: 400, padding: 0 });
        }
      }, 150);
    }
  }, [editMode, rfInstance]);

  /* ── Rule 2: Fullscreen exited (ESC / button) → turn off Edit Mode ── */
  useEffect(() => {
    const onFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs) {
        setEditMode(false);
      } else if (rfInstance) {
        setTimeout(() => {
          const vpNode = rfInstance.getNodes().find((n: any) => n.id === 'viewport-box');
          if (vpNode) {
            rfInstance.fitBounds({
              x: vpNode.position.x,
              y: vpNode.position.y,
              width: parseFloat(vpNode.style?.width as string) || 1000,
              height: parseFloat(vpNode.style?.height as string) || 500,
            }, { duration: 400, padding: 0.20 });
          } else {
            rfInstance.setCenter(0, 0, { zoom: 0.85, duration: 400 });
          }
        }, 150);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [rfInstance]);

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

        let vpConfig = { x: -500, y: -250, w: 1000, h: 500 };
        let customConfigs: Record<string, any> = {};
        if (data.description) {
          try {
            const parsed = JSON.parse(data.description);
            if (parsed.viewport && parsed.viewport.w) vpConfig = parsed.viewport;
            if (parsed.customConfigs) customConfigs = parsed.customConfigs;
          } catch (e) {}
        }

        const formattedNodes = data.nodes
          .filter((node: any) => node.nodeType !== 'switch')
          .map((node: any) => {
          const cfg = customConfigs[node.id] || {};
          const parentNode = cfg.parentAssetId ? data.nodes.find((n: any) => n.id === cfg.parentAssetId) : null;
          const defDims = getDefaultNodeDimensions(node.nodeType);
          const w = cfg.customWidth || (node.width && node.height ? node.width : defDims.width);
          const h = cfg.customHeight || (node.width && node.height ? node.height : defDims.height);
          return {
            id: node.id,
            type: node.nodeType,
            position: { x: node.positionX, y: node.positionY },
            draggable: false, // locked by default; edit mode enables
            style: { width: w, height: h },
            data: {
              nodeName: node.nodeName,
              status: node.status,
              nodeType: node.nodeType,
              waterLevel: 0, ph: 0, tds: 0, temperature: 0,
              editMode: false,
              flipHorizontal: cfg.flipHorizontal,
              maxCapacity: cfg.maxCapacity,
              parentAssetId: cfg.parentAssetId,
              parentAssetName: parentNode ? parentNode.nodeName : undefined,
              customWidth: w,
              customHeight: h,
              switchOffsetX: cfg.switchOffsetX,
              switchOffsetY: cfg.switchOffsetY,
              switchScale: cfg.switchScale,
              inletSwitchOffsetX: cfg.inletSwitchOffsetX,
              inletSwitchOffsetY: cfg.inletSwitchOffsetY,
              inletSwitchScale: cfg.inletSwitchScale,
              outletSwitchOffsetX: cfg.outletSwitchOffsetX,
              outletSwitchOffsetY: cfg.outletSwitchOffsetY,
              outletSwitchScale: cfg.outletSwitchScale,
              inletValveOn: cfg.inletValveOn ?? true,
              outletValveOn: cfg.outletValveOn ?? true,
              hideSwitch: cfg.hideSwitch,
              inletHideSwitch: cfg.inletHideSwitch,
              outletHideSwitch: cfg.outletHideSwitch,
              waveHeightCalm: cfg.waveHeightCalm,
              waveHeightNormal: cfg.waveHeightNormal,
              waveHeightActive: cfg.waveHeightActive,
              tempThreshold: cfg.tempThreshold,
              tempMaxThreshold: cfg.tempMaxThreshold,
              onTogglePump: handleTogglePump,
              onToggleTankValve: handleToggleTankValve,
              onConnectSwitchToPump: handleConnectSwitchToPump,
              onHidePumpSwitch: handleHidePumpSwitch,
              onHideTankSwitch: handleHideTankSwitch,
              onDeleteNode: handleDeleteNode,
            },
          };
        });
        const formattedEdges = data.edges.map((edge: any) => {
          const srcNode = formattedNodes.find((n: any) => n.id === edge.sourceNodeId);
          const tgtNode = formattedNodes.find((n: any) => n.id === edge.targetNodeId);

          let isFlowing = true;
          if (srcNode) {
            if (srcNode.type === 'pump' && srcNode.data?.status === 'Offline') isFlowing = false;
            if ((srcNode.type === 'tank' || srcNode.type === 'central_tank') && srcNode.data?.outletValveOn === false) isFlowing = false;
          }
          if (tgtNode) {
            if (tgtNode.type === 'pump' && tgtNode.data?.status === 'Offline') isFlowing = false;
            if (tgtNode.type === 'tank' || tgtNode.type === 'central_tank') {
              if (tgtNode.data?.inletValveOn === false) isFlowing = false;
              const hasOutgoingEdges = data.edges.some((e: any) => e.sourceNodeId === tgtNode.id);
              if (!hasOutgoingEdges && tgtNode.data?.outletValveOn === false) isFlowing = false;
            }
          }

          return {
            id: edge.id,
            source: edge.sourceNodeId,
            target: edge.targetNodeId,
            animated: isFlowing,
            style: {
              stroke: isFlowing ? 'var(--dt-accent)' : '#475569',
              strokeWidth: isFlowing ? 2 : 1.5,
              opacity: isFlowing ? 0.85 : 0.35,
              strokeDasharray: isFlowing ? undefined : '5 5',
            },
          };
        });
        
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

    socket.on('node:updated', (updatedNode) => {
      if (isInteractingRef.current) return;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== updatedNode.id) return node;
          setSelectedNode((prev: any) => {
            if (prev && prev.id === updatedNode.id) return { ...prev, status: updatedNode.status, nodeName: updatedNode.nodeName };
            return prev;
          });
          return { ...node, data: { ...node.data, status: updatedNode.status, nodeName: updatedNode.nodeName } };
        })
      );
    });

    socket.on('node:created', (newNode) => {
      if (newNode.nodeType === 'switch') return;
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
            style: getDefaultNodeDimensions(newNode.nodeType, isSensor),
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

    // Auto-resync on socket reconnection after sleep/idle
    socket.on('connect', () => {
      fetchTopology();
    });

    // Auto-resync immediately when browser tab regains visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (socket.disconnected) {
          socket.connect();
        } else {
          fetchTopology();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.disconnect();
    };
  }, [setNodes, setEdges, setSelectedNode, handleDeleteNode]);

  /* ── Sync Edge Animations & Styles with Node Switch/Valve Statuses ── */
  useEffect(() => {
    setEdges((eds) => {
      let changed = false;
      const nextEds = eds.map((e) => {
        const srcNode = nodes.find((n) => n.id === e.source);
        const tgtNode = nodes.find((n) => n.id === e.target);

        let isFlowing = true;

        // Check source node status/switches
        if (srcNode) {
          if (srcNode.type === 'pump' && srcNode.data?.status === 'Offline') {
            isFlowing = false;
          }
          if ((srcNode.type === 'tank' || srcNode.type === 'central_tank') && srcNode.data?.outletValveOn === false) {
            isFlowing = false;
          }
        }

        // Check target node status/switches
        if (tgtNode) {
          if (tgtNode.type === 'pump' && tgtNode.data?.status === 'Offline') {
            isFlowing = false;
          }
          if (tgtNode.type === 'tank' || tgtNode.type === 'central_tank') {
            if (tgtNode.data?.inletValveOn === false) isFlowing = false;
            const hasOutgoingEdges = eds.some((edge) => edge.source === tgtNode.id);
            if (!hasOutgoingEdges && tgtNode.data?.outletValveOn === false) isFlowing = false;
          }
        }

        const nextAnimated = isFlowing;
        const nextStroke = isFlowing ? 'var(--dt-accent)' : '#475569';
        const nextOpacity = isFlowing ? 0.85 : 0.35;
        const nextDash = isFlowing ? undefined : '5 5';

        if (
          e.animated !== nextAnimated ||
          e.style?.stroke !== nextStroke ||
          e.style?.opacity !== nextOpacity ||
          e.style?.strokeDasharray !== nextDash
        ) {
          changed = true;
          return {
            ...e,
            animated: nextAnimated,
            style: {
              ...e.style,
              stroke: nextStroke,
              strokeWidth: isFlowing ? 2 : 1.5,
              opacity: nextOpacity,
              strokeDasharray: nextDash,
            },
          };
        }
        return e;
      });

      return changed ? nextEds : eds;
    });
  }, [nodes, setEdges]);

  
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
    const newX = Math.round(node.position?.x ?? 0);
    const newY = Math.round(node.position?.y ?? 0);
    const newW = node.id === 'viewport-box' ? (parseFloat(node.style?.width as string) || 1000) : undefined;
    const newH = node.id === 'viewport-box' ? (parseFloat(node.style?.height as string) || 500) : undefined;

    if (dragStartPos.current) {
      const dx = Math.abs(newX - dragStartPos.current.x);
      const dy = Math.abs(newY - dragStartPos.current.y);
      if (dx >= 1 || dy >= 1) {
        const action: HistoryAction = {
          type: 'move',
          nodeId: node.id,
          oldValue: { ...dragStartPos.current },
          newValue: { x: newX, y: newY, w: newW, h: newH }
        };
        setUndoStack(prev => [...prev, action]);
        setRedoStack([]);
      }
    }

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


  const handleSaveCustomNode = async (nodeId: string, updatedProps: any) => {
    try {
      if (updatedProps.nodeName) {
        await axios.patch(`${BACKEND_URL}/api/nodes/${nodeId}`, {
          nodeName: updatedProps.nodeName,
        });
      }

      setNodes((nds) => {
        const updatedNodes = nds.map(n => {
          if (n.id === nodeId) {
            const parentName = updatedProps.parentAssetId
              ? nds.find(p => p.id === updatedProps.parentAssetId)?.data?.nodeName
              : undefined;
            const newStyle = (updatedProps.customWidth && updatedProps.customHeight)
              ? { ...n.style, width: updatedProps.customWidth, height: updatedProps.customHeight }
              : n.style;
            return {
              ...n,
              style: newStyle,
              data: {
                ...n.data,
                nodeName: updatedProps.nodeName,
                flipHorizontal: updatedProps.flipHorizontal,
                maxCapacity: updatedProps.maxCapacity,
                parentAssetId: updatedProps.parentAssetId,
                parentAssetName: parentName,
                customWidth: updatedProps.customWidth,
                customHeight: updatedProps.customHeight,
                waveHeightCalm: updatedProps.waveHeightCalm,
                waveHeightNormal: updatedProps.waveHeightNormal,
                waveHeightActive: updatedProps.waveHeightActive,
                tempThreshold: updatedProps.tempThreshold,
                tempMaxThreshold: updatedProps.tempMaxThreshold,
              }
            };
          }
          return n;
        });

        const customConfigs = buildCustomConfigs(updatedNodes);

        axios.patch(`${BACKEND_URL}/api/topologies/star/viewport`, {
          customConfigs,
        }).catch(console.error);

        return updatedNodes;
      });
    } catch (err) {
      console.error('Failed to save node customizations:', err);
    }
  };

  /* ── node click ─────────────────────────────────────────── */
  const onNodeClick = async (_: React.MouseEvent, node: any) => {
    if (editMode) {
      if (allowCustomizeNodes && node.id !== 'viewport-box') {
        setActiveCustomizeNodeId(node.id);
      }
      return;
    }
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
    async (params: Connection | Edge) => {
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: 'var(--dt-accent)', strokeWidth: 2, opacity: 0.85 },
      }, eds));
      if (params.source && params.target) {
        try {
          await axios.post(`${BACKEND_URL}/api/edges`, {
            source: params.source,
            target: params.target,
          });
        } catch (e) { console.error('Failed to save edge', e); }
      }
    },
    [setEdges]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach((edge) => {
        axios.delete(`${BACKEND_URL}/api/edges/${edge.id}`).catch(() => {});
      });
    },
    []
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
    const { width: nodeW, height: nodeH } = getDefaultNodeDimensions(type, isSensor);

    const rawPos = rfInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const posX = Math.round(rawPos.x - nodeW / 2);
    const posY = Math.round(rawPos.y - nodeH / 2);

    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const targetName = `${label || type}-${Math.floor(Math.random() * 900 + 100)}`;
    const { editMode: em, allowMoveResize: amr, allowMoveNodes: amn, allowResizeNodes: arn, allowDeleteNodes: adn, allowMoveSwitches: ams } = interactivityRef.current;
    const isSwitchDrop = type === 'switch';
    const canDragDrop = isSwitchDrop ? (em && ams) : (em && amr && amn && !ams);

    const optimisticNode = {
      id: tempId,
      type,
      position: { x: posX, y: posY },
      draggable: canDragDrop,
      style: { width: nodeW, height: nodeH },
      data: {
        nodeName: targetName,
        status: 'healthy',
        nodeType: type,
        waterLevel: 65, ph: 7.1, tds: 210, temperature: 24,
        inletSwitchOffsetX: type !== 'pump' ? 68.6 : undefined,
        inletSwitchOffsetY: type !== 'pump' ? 51.2 : undefined,
        inletSwitchScale: type !== 'pump' ? 0.18 : undefined,
        outletSwitchOffsetX: type !== 'pump' ? 240.8 : undefined,
        outletSwitchOffsetY: type !== 'pump' ? 252.8 : undefined,
        outletSwitchScale: type !== 'pump' ? 0.18 : undefined,
        switchOffsetX: type === 'pump' ? 186.5 : undefined,
        switchOffsetY: type === 'pump' ? 140.4 : undefined,
        switchScale: type === 'pump' ? 0.18 : undefined,
        editMode: em,
        allowMoveResize: amr && arn && !ams,
        allowMoveSwitches: em && ams,
        allowDeleteNodes: adn,
        onDeleteNode: handleDeleteNode,
        onTogglePump: handleTogglePump,
        onSwitchTransformEnd: handleSwitchTransformEnd,
        onConnectSwitchToPump: handleConnectSwitchToPump,
        onHidePumpSwitch: handleHidePumpSwitch,
        onHideTankSwitch: handleHideTankSwitch,
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
  }, [rfInstance, setNodes, handleDeleteNode, handleTogglePump, handleSwitchTransformEnd, handleConnectSwitchToPump, handleHidePumpSwitch, handleHideTankSwitch]);

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
                    <Switch
                      checked={allowMoveNodes}
                      onChange={(val) => { setAllowMoveNodes(val); if (val) setAllowMoveSwitches(false); }}
                      label="Move Nodes"
                    />
                    <Switch
                      checked={allowResizeNodes}
                      onChange={(val) => { setAllowResizeNodes(val); if (val) setAllowMoveSwitches(false); }}
                      label="Resize Nodes"
                    />
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 0' }} />
                    <Switch
                      checked={allowMoveSwitches}
                      onChange={(val) => {
                        setAllowMoveSwitches(val);
                        if (val) {
                          setAllowMoveNodes(false);
                          setAllowResizeNodes(false);
                        }
                      }}
                      label="Move & Resize Switches"
                    />
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

      {/* ── Customize Assets button placed directly below Edit Mode ON when edit mode is active ── */}
      {isAdmin && editMode && (
        <div style={{ position: 'absolute', top: 76, right: 16, zIndex: 30 }}>
          <button
            onClick={() => {
              const nextVal = !allowCustomizeNodes;
              setAllowCustomizeNodes(nextVal);
              if (nextVal) {
                setAllowMoveResize(false);
                setShowPaletteMenu(false);
                setShowDeleteMenu(false);
              } else {
                setActiveCustomizeNodeId(null);
              }
            }}
            title="Customize Assets"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
              border: allowCustomizeNodes
                ? '1.5px solid rgba(200,241,53,0.55)'
                : '1.5px solid rgba(0,0,0,0.09)',
              background: allowCustomizeNodes ? '#17181c' : '#ffffff',
              boxShadow: allowCustomizeNodes
                ? '0 0 16px rgba(200,241,53,0.2), 0 4px 12px rgba(0,0,0,0.15)'
                : '0 2px 8px rgba(0,0,0,0.08)',
              fontFamily: FONT, transition: 'all 0.15s ease',
            }}
          >
            <Sliders size={14} strokeWidth={2.2} color={allowCustomizeNodes ? '#c8f135' : '#9ca3af'} />
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '-0.1px',
              color: allowCustomizeNodes ? '#c8f135' : '#5a5f6b',
            }}>
              Customize Assets
            </span>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: allowCustomizeNodes ? '#c8f135' : 'transparent',
              boxShadow: allowCustomizeNodes ? '0 0 6px rgba(200,241,53,0.9)' : 'none',
              transition: 'all 0.15s ease',
            }} />
          </button>
        </div>
      )}

      {/* Asset Inspector Modal */}
      {editMode && activeCustomizeNodeId && (
        (() => {
          const activeNode = nodes.find(n => n.id === activeCustomizeNodeId);
          if (!activeNode) return null;
          return (
            <AssetInspectorModal
              node={activeNode}
              allNodes={nodes}
              onClose={() => setActiveCustomizeNodeId(null)}
              onSave={handleSaveCustomNode}
            />
          );
        })()
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
        onEdgesDelete={onEdgesDelete}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        nodesDraggable={editMode && allowMoveResize}
        nodesConnectable={editMode}
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
