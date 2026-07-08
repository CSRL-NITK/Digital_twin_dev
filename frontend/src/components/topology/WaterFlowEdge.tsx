import React from 'react';
import { BaseEdge, getSmoothStepPath, useNodes, useEdges, Position, EdgeLabelRenderer } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { getSmartEdge } from '@tisoap/react-flow-smart-edge';

const WaterFlowEdge: React.FC<EdgeProps> = ({
  id,
  source,
  sourceHandleId,
  target,
  targetHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
  style = {},
  data,
  markerEnd,
}) => {
  const nodes = useNodes();
  const edges = useEdges();
  
  // Extract flow properties from edge data
  const isFlowing = data?.isFlowing ?? true;

  // Detect if this edge originates from a shared source handle (a Split)
  const isSplit = edges.filter(e => e.source === source && e.sourceHandle === sourceHandleId).length > 1;
  // Detect if this edge terminates at a shared target handle (a Merge)
  const isMerge = edges.filter(e => e.target === target && e.targetHandle === targetHandleId).length > 1;

  // If isFlowing is false, we want it to look inactive/grayed out
  
  // Base configuration
  const strokeColor = isFlowing ? 'var(--dt-accent, #00ffff)' : '#475569';
  const pipeColor = '#1e293b'; // dark pipe background
  
  // Use smart edge routing (obstacle avoidance) if nodes are available
  // Fallback to smooth step if smart routing fails
  let svgPathString = '';
  
  const LEAD_PX = 42;
  
  let modSourceX = sourceX;
  let modSourceY = sourceY;
  if (sourcePosition === Position.Left) modSourceX -= LEAD_PX;
  if (sourcePosition === Position.Right) modSourceX += LEAD_PX;
  if (sourcePosition === Position.Top) modSourceY -= LEAD_PX;
  if (sourcePosition === Position.Bottom) modSourceY += LEAD_PX;

  let modTargetX = targetX;
  let modTargetY = targetY;
  if (targetPosition === Position.Left) modTargetX -= LEAD_PX;
  if (targetPosition === Position.Right) modTargetX += LEAD_PX;
  if (targetPosition === Position.Top) modTargetY -= LEAD_PX;
  if (targetPosition === Position.Bottom) modTargetY += LEAD_PX;

  try {
    const smartEdge = getSmartEdge({
      sourcePosition,
      targetPosition,
      sourceX: modSourceX,
      sourceY: modSourceY,
      targetX: modTargetX,
      targetY: modTargetY,
      nodes,
      options: {
        nodePadding: 32, // Stronger clearance around nodes
      }
    });
    
    if (smartEdge) {
      svgPathString = `M ${sourceX} ${sourceY} L ${modSourceX} ${modSourceY} ${smartEdge.svgPathString} L ${targetX} ${targetY}`;
    }
  } catch (e) {
    // Ignore smart edge failure
  }
  
  if (!svgPathString) {
    // Fallback to smooth step
    const [path] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 12,
      offset: LEAD_PX,
    });
    svgPathString = path;
  }
  
  // =========================================================================
  // T-JUNCTION CONNECTOR LOGIC
  // We parse our own path to find 90-degree corners. If this edge is part of
  // a Split or Merge, and another sibling edge's target/source extends PAST
  // this corner along the shared trunk, then it's a T-junction overlap!
  // =========================================================================
  const corners: {x: number, y: number}[] = [];
  const regex = /([MLQCZA])([^MLQCZA]*)/gi;
  let match;
  const points: {x: number, y: number}[] = [];
  while ((match = regex.exec(svgPathString)) !== null) {
    const cmd = match[1].toUpperCase();
    const params = match[2].trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (cmd === 'M' || cmd === 'L') points.push({ x: params[0], y: params[1] });
    else if (cmd === 'A') points.push({ x: params[5], y: params[6] });
    else if (cmd === 'Q') points.push({ x: params[2], y: params[3] });
    else if (cmd === 'C') points.push({ x: params[4], y: params[5] });
  }

  const orthoPoints = points.length > 0 ? [points[0]] : [];
  for (let i = 1; i < points.length; i++) {
    const prev = orthoPoints[orthoPoints.length - 1];
    const curr = points[i];
    if (Math.abs(curr.x - prev.x) < 1 && Math.abs(curr.y - prev.y) < 1) continue;
    
    if (Math.abs(curr.x - prev.x) < 1 || Math.abs(curr.y - prev.y) < 1) {
      orthoPoints.push(curr);
    } else {
      const next = i + 1 < points.length ? points[i+1] : null;
      let cornerX = curr.x;
      let cornerY = curr.y;
      
      if (next) {
        if (Math.abs(next.y - curr.y) < 1) {
          cornerX = prev.x;
          cornerY = curr.y;
        } else if (Math.abs(next.x - curr.x) < 1) {
          cornerX = curr.x;
          cornerY = prev.y;
        }
      } else if (orthoPoints.length > 1) {
        const prevPrev = orthoPoints[orthoPoints.length - 2];
        if (Math.abs(prev.x - prevPrev.x) < 1) {
          cornerX = prev.x;
          cornerY = curr.y;
        } else {
          cornerX = curr.x;
          cornerY = prev.y;
        }
      }
      corners.push({ x: cornerX, y: cornerY });
      orthoPoints.push({ x: cornerX, y: cornerY });
      orthoPoints.push(curr);
    }
  }

  const tJunctions = corners.filter(corner => {
    if (isSplit) {
      if (Math.abs(corner.x - modSourceX) < 2) {
        const others = edges.filter(e => e.id !== id && e.source === source && e.sourceHandle === sourceHandleId);
        if (sourcePosition === Position.Bottom) {
          if (others.some(e => (nodes.find(n => n.id === e.target)?.position.y || 0) > corner.y)) return true;
        } else if (sourcePosition === Position.Top) {
          if (others.some(e => (nodes.find(n => n.id === e.target)?.position.y || 0) < corner.y)) return true;
        }
      } else if (Math.abs(corner.y - modSourceY) < 2) {
        const others = edges.filter(e => e.id !== id && e.source === source && e.sourceHandle === sourceHandleId);
        if (sourcePosition === Position.Right) {
          if (others.some(e => (nodes.find(n => n.id === e.target)?.position.x || 0) > corner.x)) return true;
        } else if (sourcePosition === Position.Left) {
          if (others.some(e => (nodes.find(n => n.id === e.target)?.position.x || 0) < corner.x)) return true;
        }
      }
    }
    if (isMerge) {
      if (Math.abs(corner.x - modTargetX) < 2) {
        const others = edges.filter(e => e.id !== id && e.target === target && e.targetHandle === targetHandleId);
        if (targetPosition === Position.Top) {
          if (others.some(e => (nodes.find(n => n.id === e.source)?.position.y || 0) < corner.y)) return true;
        } else if (targetPosition === Position.Bottom) {
          if (others.some(e => (nodes.find(n => n.id === e.source)?.position.y || 0) > corner.y)) return true;
        }
      } else if (Math.abs(corner.y - modTargetY) < 2) {
        const others = edges.filter(e => e.id !== id && e.target === target && e.targetHandle === targetHandleId);
        if (targetPosition === Position.Left) {
          if (others.some(e => (nodes.find(n => n.id === e.source)?.position.x || 0) < corner.x)) return true;
        } else if (targetPosition === Position.Right) {
          if (others.some(e => (nodes.find(n => n.id === e.source)?.position.x || 0) > corner.x)) return true;
        }
      }
    }
    return false;
  });

  
  return (
    <>
      {isFlowing && (
        <style>{`
          @keyframes edgeStreamFlowFast {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -60; }
          }
          @keyframes edgeStreamFlowSuperFast {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -80; }
          }
          @keyframes edgeShimmerPulse {
            0% { opacity: 0.35; }
            50% { opacity: 0.6; }
            100% { opacity: 0.35; }
          }
        `}</style>
      )}

      {/* 1. Base Pipe (Thick dark background) */}
      <BaseEdge
        id={`${id}-base`}
        path={svgPathString}
        style={{
          ...style,
          stroke: pipeColor,
          strokeWidth: isFlowing ? 14 : 10,
          strokeLinejoin: 'round',
          fill: 'none',
        }}
      />
      
      {isFlowing ? (
        <>
          {/* 2. Outer Shimmer Glow */}
          <BaseEdge
            id={`${id}-shimmer`}
            path={svgPathString}
            style={{
              ...style,
              stroke: '#A5F3FC',
              strokeWidth: 10,
              strokeLinejoin: 'round',
              fill: 'none',
              animation: 'edgeShimmerPulse 1.2s ease-in-out infinite',
            }}
          />

          {/* 3. Core Fluid Flow */}
          <BaseEdge
            id={`${id}-core`}
            path={svgPathString}
            style={{
              ...style,
              stroke: '#06B6D4',
              strokeWidth: 8,
              strokeLinejoin: 'round',
              opacity: 0.95,
              fill: 'none',
            }}
          />

          {/* 4. Stream Fast 1 */}
          <BaseEdge
            id={`${id}-fast1`}
            path={svgPathString}
            style={{
              ...style,
              stroke: '#22D3EE',
              strokeWidth: 2,
              strokeDasharray: '12, 16',
              strokeLinejoin: 'round',
              opacity: 0.85,
              fill: 'none',
              animation: 'edgeStreamFlowFast 0.45s linear infinite',
            }}
          />

          {/* 5. Stream Super Fast (Main bubbly stream) */}
          <BaseEdge
            id={`${id}-super`}
            path={svgPathString}
            markerEnd={markerEnd}
            style={{
              ...style,
              stroke: '#FFFFFF',
              strokeWidth: 3,
              strokeDasharray: '8, 12',
              strokeLinejoin: 'round',
              opacity: 0.95,
              fill: 'none',
              animation: 'edgeStreamFlowSuperFast 0.3s linear infinite',
            }}
          />

          {/* 6. Stream Fast 2 */}
          <BaseEdge
            id={`${id}-fast2`}
            path={svgPathString}
            style={{
              ...style,
              stroke: '#0D9488',
              strokeWidth: 2,
              strokeDasharray: '16, 20',
              strokeLinejoin: 'round',
              opacity: 0.75,
              fill: 'none',
              animation: 'edgeStreamFlowFast 0.45s linear infinite',
            }}
          />
        </>
      ) : (
        /* Off state */
        <BaseEdge
          id={id}
          path={svgPathString}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: strokeColor,
            strokeWidth: 2,
            strokeDasharray: '4, 4',
            opacity: 0.4,
            strokeLinecap: 'round',
            fill: 'none',
          }}
        />
      )}

      {/* 7. Edge Label Renderer for UI Connectors (always on top) */}
      <EdgeLabelRenderer>
        {/* 8. T-Junctions for overlapped 90-degree turns */}
        {tJunctions.map((j, idx) => (
          <div
            key={`t-j-${idx}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${j.x}px, ${j.y}px)`,
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            <svg width={32} height={32} viewBox="-16 -16 32 32" style={{ overflow: 'visible' }}>
              <rect x={-16} y={-16} width={32} height={32} rx={6} fill="#3d4048" stroke="#1a1c23" strokeWidth={1.5} filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))" />
              <circle cx={0} cy={0} r={9} fill="#1e293b" stroke="#1a1c23" strokeWidth={1} />
              {isFlowing && <circle cx={0} cy={0} r={5} fill="#06B6D4" className="animate-pulse" />}
              <circle cx={-11} cy={-11} r={1.5} fill="#94a3b8" />
              <circle cx={11} cy={-11} r={1.5} fill="#94a3b8" />
              <circle cx={-11} cy={11} r={1.5} fill="#94a3b8" />
              <circle cx={11} cy={11} r={1.5} fill="#94a3b8" />
            </svg>
          </div>
        ))}
      </EdgeLabelRenderer>
    </>
  );
};

export default WaterFlowEdge;
