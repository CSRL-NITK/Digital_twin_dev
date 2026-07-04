import React from 'react';
import { BaseEdge, getSmoothStepPath, useNodes, Position } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { getSmartEdge } from '@tisoap/react-flow-smart-edge';

const WaterFlowEdge: React.FC<EdgeProps> = ({
  id,
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
  
  // Extract flow properties from edge data
  const isFlowing = data?.isFlowing ?? true;
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
    </>
  );
};

export default WaterFlowEdge;
