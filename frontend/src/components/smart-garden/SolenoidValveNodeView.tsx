import React from 'react';
import { NodeResizer, Handle, Position, useEdges, useReactFlow } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { SolenoidValveAssemblySVG } from './SolenoidValveAssemblySVG';
import { Pump3DSwitch } from '../nodes/Pump3DSwitch';
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
  
  // Track valve state
  const valveState = data?.valveOn !== false && data?.inletValveOn !== false;

  const handleToggleSwitch = () => {
    const nextState = !valveState;
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
          top: '85%',
          width: 8,
          height: 8,
          background: 'transparent',
          border: 'none',
          opacity: 0,
          zIndex: 50,
        }}
      />

      {/* Vector SVG Model View with Horizontal Flip */}
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease', position: 'relative' }}>
        <SolenoidValveAssemblySVG
          valveState={valveState}
          isFlowing={isIncomingFlowing}
          flowRateLmin={data?.flowRate ?? 18.5}
          turbineRpm={data?.turbineRpm ?? 1450}
          className="w-full h-full object-contain"
        />

        {/* Interactive 3D Rocker Switch Replica (Bus Topology Reference - Positioned at marked red box location) */}
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            left: isFlipped ? '25.5%' : '74.5%',
            top: '26%',
            transform: 'translate(-50%, -50%)',
            zIndex: 60,
            cursor: 'pointer',
          }}
          title={valveState ? 'Click 3D switch to turn Valve OFF' : 'Click 3D switch to turn Valve ON'}
        >
          <Pump3DSwitch
            isOn={valveState}
            canControl={true}
            onToggle={handleToggleSwitch}
            scale={0.28}
          />
        </div>
      </div>

      {/* Floating Node Label Badge */}
      <div className="absolute top-[88%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1 rounded shadow pointer-events-none z-50">
        {nodeName}
      </div>
    </div>
  );
}
