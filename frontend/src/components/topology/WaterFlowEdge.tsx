import React from 'react';
import { BaseEdge, getSmoothStepPath, useNodes, useEdges, Position } from 'reactflow';
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

      {/* 7. Automatic Split/Merge Joints */}
      {isSplit && (
        <g transform={`translate(${modSourceX}, ${modSourceY})`} style={{ zIndex: 100 }}>
          {/* Main joint block */}
          <rect x={-16} y={-16} width={32} height={32} rx={6} fill="#3d4048" stroke="#1a1c23" strokeWidth={1.5} filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))" />
          {/* Inner core */}
          <circle cx={0} cy={0} r={9} fill="#1e293b" stroke="#1a1c23" strokeWidth={1} />
          {isFlowing && <circle cx={0} cy={0} r={5} fill="#06B6D4" className="animate-pulse" />}
          {/* Bolt details */}
          <circle cx={-11} cy={-11} r={1.5} fill="#94a3b8" />
          <circle cx={11} cy={-11} r={1.5} fill="#94a3b8" />
          <circle cx={-11} cy={11} r={1.5} fill="#94a3b8" />
          <circle cx={11} cy={11} r={1.5} fill="#94a3b8" />
        </g>
      )}

      {isMerge && (
        <g transform={`translate(${modTargetX}, ${modTargetY})`} style={{ zIndex: 100 }}>
          {/* Main joint block */}
          <rect x={-16} y={-16} width={32} height={32} rx={6} fill="#3d4048" stroke="#1a1c23" strokeWidth={1.5} filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))" />
          {/* Inner core */}
          <circle cx={0} cy={0} r={9} fill="#1e293b" stroke="#1a1c23" strokeWidth={1} />
          {isFlowing && <circle cx={0} cy={0} r={5} fill="#06B6D4" className="animate-pulse" />}
          {/* Bolt details */}
          <circle cx={-11} cy={-11} r={1.5} fill="#94a3b8" />
          <circle cx={11} cy={-11} r={1.5} fill="#94a3b8" />
          <circle cx={-11} cy={11} r={1.5} fill="#94a3b8" />
          <circle cx={11} cy={11} r={1.5} fill="#94a3b8" />
        </g>
      )}
    </>
  );
};

export default WaterFlowEdge;
