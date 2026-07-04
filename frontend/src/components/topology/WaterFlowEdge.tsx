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
      
      {/* 2. Inner Liquid (Solid tint to show filled pipe) */}
      {isFlowing && (
        <BaseEdge
          id={`${id}-liquid`}
          path={svgPathString}
          style={{
            ...style,
            stroke: strokeColor,
            strokeWidth: 8,
            strokeLinejoin: 'round',
            opacity: 0.25,
            fill: 'none',
          }}
        />
      )}

      {/* 3. Inner Flow Stream (Animated bright dashes/bubbles) */}
      <BaseEdge
        id={id}
        path={svgPathString}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isFlowing ? '#ffffff' : strokeColor,
          strokeWidth: isFlowing ? 6 : 2,
          strokeDasharray: isFlowing ? '6, 14' : '4, 4',
          opacity: isFlowing ? 1 : 0.4,
          filter: isFlowing ? 'drop-shadow(0px 0px 8px rgba(0,255,255,0.8))' : 'none',
          animation: isFlowing ? 'dash-flow 0.6s linear infinite' : 'none',
          strokeLinecap: 'round',
          fill: 'none',
        }}
      />
    </>
  );
};

export default WaterFlowEdge;
