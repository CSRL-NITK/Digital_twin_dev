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
  
  const LEAD_PX = 16;
  
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
          strokeWidth: isFlowing ? 8 : 6,
          strokeLinejoin: 'round',
          fill: 'none',
        }}
      />
      
      {/* 2. Inner Flow Stream (Animated dots/dashes) */}
      <BaseEdge
        id={id}
        path={svgPathString}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: isFlowing ? 4 : 2,
          strokeDasharray: isFlowing ? '6, 12' : '4, 4',
          opacity: isFlowing ? 0.9 : 0.4,
          filter: isFlowing ? 'drop-shadow(0px 0px 6px rgba(0,255,255,0.6))' : 'none',
          animation: isFlowing ? 'dash-flow 1s linear infinite' : 'none',
          strokeLinecap: 'round',
          fill: 'none',
        }}
      />
    </>
  );
};

export default WaterFlowEdge;
