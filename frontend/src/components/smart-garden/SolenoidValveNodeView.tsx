import React from 'react';
import { NodeResizer, Handle, Position, useEdges, useReactFlow } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { SolenoidValveAssemblySVG } from './SolenoidValveAssemblySVG';
import { Trash2 } from 'lucide-react';

function AdminNodeDeleteBtn({ id, nodeName, allowDelete, onDelete }: { id: string; nodeName?: string; allowDelete?: boolean; onDelete?: (id: string) => void }) {
  const [confirming, setConfirming] = React.useState(false);
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
          Delete {nodeName || 'Solenoid Valve'}?
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

export function SolenoidValveNodeView({ id, data, selected }: NodeProps<any>) {
  const nodeName = data?.nodeName || 'Solenoid Valve & Flow Meter';
  const isFlipped = !!data?.flipHorizontal;
  const edges = useEdges();
  const reactFlow = useReactFlow();

  // Evaluate if water is flowing into this valve node
  const incomingEdge = edges.find(e => e.target === id);
  const isIncomingFlowing = incomingEdge ? ((incomingEdge.data as any)?.isFlowing !== false) : true;
  
  // Electrical Switch State (3D Rocker Power Switch)
  const electricSwitchOn = data?.valveOn !== false && data?.inletValveOn !== false;
  
  // Manual Mechanical Ball Valve State (Vertical Lever Valve)
  const manualValveOpen = data?.manualValveOn !== false;

  const handleToggleElectricSwitch = () => {
    const nextState = !electricSwitchOn;
    reactFlow.setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              valveOn: nextState,
              inletValveOn: nextState,
            },
          };
        }
        return n;
      })
    );
  };

  const handleToggleManualValve = () => {
    const nextState = !manualValveOpen;
    reactFlow.setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              manualValveOn: nextState,
            },
          };
        }
        return n;
      })
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: 120,
        minHeight: 80,
        position: 'relative',
        background: 'transparent',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AdminNodeDeleteBtn id={id} nodeName={nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />

      {data?.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={false}
          minWidth={100}
          minHeight={60}
          isVisible={selected}
          onResizeStart={(_evt, params) => data?.onResizeStart && data.onResizeStart(params, id)}
          onResizeEnd={(_evt, params) => data?.onResizeEnd && data.onResizeEnd(params, id)}
          lineStyle={{ borderColor: '#00ffff', borderWidth: 2 }}
          handleStyle={{ background: '#00ffff', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}

      {/* Water Inlet Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="inlet-1"
        style={{
          left: 0,
          top: '52%',
          width: 8,
          height: 8,
          background: 'transparent',
          border: 'none',
          opacity: 0,
          zIndex: 50,
        }}
      />

      {/* Water Outlet Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="outlet-1"
        style={{
          right: 0,
          top: '92%',
          background: 'transparent',
          border: 'none',
          opacity: 0,
          zIndex: 50,
        }}
      />

      {/* Solenoid Wire Connection Handles for Control Box Link */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="solenoid-port-in-bottom"
        style={{
          left: isFlipped ? '29.9%' : '70.1%',
          top: '46.9%',
          transform: 'translate(-50%, -50%)',
          width: 14,
          height: 14,
          background: '#00ffff',
          border: '2px solid #ffffff',
          borderRadius: '50%',
          boxShadow: '0 0 8px #00ffff',
          opacity: 0.95,
          zIndex: 64,
          cursor: 'pointer',
        }}
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={true}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="solenoid-port-out-bottom"
        style={{
          left: isFlipped ? '29.9%' : '70.1%',
          top: '46.9%',
          transform: 'translate(-50%, -50%)',
          width: 14,
          height: 14,
          background: '#00ffff',
          border: '2px solid #ffffff',
          borderRadius: '50%',
          boxShadow: '0 0 8px #00ffff',
          opacity: 0.95,
          zIndex: 65,
          cursor: 'pointer',
        }}
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={true}
      />

      {/* Vector SVG Model View with Horizontal Flip */}
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease', position: 'relative' }}>
        <SolenoidValveAssemblySVG
          valveState={electricSwitchOn}
          manualValveOpen={manualValveOpen}
          isFlowing={isIncomingFlowing}
          flowRateLmin={data?.flowRate ?? 18.5}
          turbineRpm={data?.turbineRpm ?? 1450}
        />

        {/* 1. Hot-Spot for Electrical 3D Rocker Switch */}
        <div
          className="nodrag nopan"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleElectricSwitch();
          }}
          style={{
            position: 'absolute',
            left: isFlipped ? '19.6%' : '80.4%',
            top: '23.5%',
            width: '12%',
            height: '26%',
            transform: 'translate(-50%, -50%)',
            zIndex: 60,
            cursor: 'pointer',
          }}
          title={electricSwitchOn ? 'Click 3D Rocker Switch to turn Electrical Power OFF' : 'Click 3D Rocker Switch to turn Electrical Power ON'}
        />

        {/* 2. Hot-Spot for Manual Mechanical Ball Valve on Vertical Pipe */}
        <div
          className="nodrag nopan"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleManualValve();
          }}
          style={{
            position: 'absolute',
            left: isFlipped ? '5.2%' : '94.8%',
            top: '83%',
            width: '14%',
            height: '28%',
            transform: 'translate(-50%, -50%)',
            zIndex: 60,
            cursor: 'pointer',
          }}
          title={manualValveOpen ? 'Click Manual Lever Handle to CLOSE water pathway' : 'Click Manual Lever Handle to OPEN water pathway'}
        />
      </div>
    </div>
  );
}
