import React from 'react';
import { NodeResizer, Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { ControllerModelSvg } from './ControllerModelSvg';
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
          Delete {nodeName || 'Control Box'}?
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

export function ControlBoxNodeView({ id, data, selected }: NodeProps<any>) {
  const nodeName = data?.nodeName || 'Electronic Control Box';
  const isFlipped = !!data?.flipHorizontal;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: 100,
        minHeight: 100,
        position: 'relative',
        background: 'transparent',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
      }}
    >
      <AdminNodeDeleteBtn id={id} nodeName={nodeName} allowDelete={data?.allowDeleteNodes} onDelete={data?.onDeleteNode} />

      {data?.allowMoveResize && (
        <NodeResizer
          keepAspectRatio={false}
          minWidth={80}
          minHeight={80}
          isVisible={selected}
          onResizeStart={(_evt, params) => data?.onResizeStart && data.onResizeStart(params, id)}
          onResizeEnd={(_evt, params) => data?.onResizeEnd && data.onResizeEnd(params, id)}
          lineStyle={{ borderColor: '#00ffff', borderWidth: 2 }}
          handleStyle={{ background: '#00ffff', borderColor: '#17181c', width: 10, height: 10, borderRadius: 3 }}
        />
      )}

      {/* Invisible Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="control-out"
        style={{
          right: 0,
          top: '50%',
          width: 6,
          height: 6,
          background: 'transparent',
          border: 'none',
          opacity: 0,
          zIndex: 50,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="control-in"
        style={{
          left: 0,
          top: '50%',
          width: 6,
          height: 6,
          background: 'transparent',
          border: 'none',
          opacity: 0,
          zIndex: 50,
        }}
      />

      {/* Vector SVG Model View with Horizontal Flip */}
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease' }}>
        <ControllerModelSvg className="w-full h-full object-contain" />
      </div>

      {/* Floating Node Label Badge */}
      <div className="absolute top-[88%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1 rounded shadow pointer-events-none z-50">
        {nodeName}
      </div>
    </div>
  );
}
