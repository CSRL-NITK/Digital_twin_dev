import React from 'react';
import axios from 'axios';
import { BaseEdge, getSmoothStepPath, useNodes, Position, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { getSmartEdge } from '@tisoap/react-flow-smart-edge';

const BACKEND_URL = 'http://localhost:3001';

// Global store to keep track of the exact rendered orthogonal path segments of EVERY pipe
// This allows us to instantly detect if ANY pipe passes straight through a corner to form a T-Junction!
export const globalEdgeSegments = new Map<string, {x: number, y: number}[]>();

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
  const rf = useReactFlow();
  
  // Extract flow properties from edge data
  const isFlowing = data?.isFlowing ?? true;

  // If isFlowing is false, we want it to look inactive/grayed out
  
  // Base configuration
  const strokeColor = isFlowing ? 'var(--dt-accent, #00ffff)' : '#475569';
  const pipeColor = '#1e293b'; // dark pipe background
  
  // Use smart edge routing (obstacle avoidance) if nodes are available
  // Fallback to smooth step if smart routing fails
  let finalSvgPathString = '';
  
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

  const allowEditPipes = data?.allowEditPipes ?? false;

  let pts: {x: number, y: number}[] = [];

  if (data?.customPoints && data.customPoints.length > 0) {
    const p = [...data.customPoints];
    if (Math.abs(modSourceX - p[0].x) < Math.abs(modSourceY - p[0].y)) {
      p[0].x = modSourceX;
    } else {
      p[0].y = modSourceY;
    }
    const last = p.length - 1;
    if (Math.abs(modTargetX - p[last].x) < Math.abs(modTargetY - p[last].y)) {
      p[last].x = modTargetX;
    } else {
      p[last].y = modTargetY;
    }

    pts = [{x: modSourceX, y: modSourceY}, ...p, {x: modTargetX, y: modTargetY}];
    
    let path = `M ${sourceX} ${sourceY} L ${modSourceX} ${modSourceY}`;
    for (const pt of p) {
      path += ` L ${pt.x} ${pt.y}`;
    }
    path += ` L ${modTargetX} ${modTargetY} L ${targetX} ${targetY}`;
    finalSvgPathString = path;
  } else {
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
        finalSvgPathString = `M ${sourceX} ${sourceY} L ${modSourceX} ${modSourceY} ${smartEdge.svgPathString.replace(/^M[^\s]+ [^\s]+ /, '')} L ${targetX} ${targetY}`;
      }
    } catch {
      // Ignore smart edge failure
    }
    
    if (!finalSvgPathString) {
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
      finalSvgPathString = path;
    }

    const regex = /[ML]\s*(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/gi;
    let match;
    const extracted = [];
    while ((match = regex.exec(finalSvgPathString)) !== null) {
      const pt = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
      if (extracted.length === 0 || Math.abs(extracted[extracted.length-1].x - pt.x) > 1 || Math.abs(extracted[extracted.length-1].y - pt.y) > 1) {
        extracted.push(pt);
      }
    }
    if (extracted.length >= 4) {
      pts = extracted.slice(1, extracted.length - 1);
    } else {
      pts = [ {x: modSourceX, y: modSourceY}, {x: modTargetX, y: modTargetY} ];
    }
  }
  
  const svgPathString = finalSvgPathString;
  
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

  // Simplify collinear segments out of orthoPoints to perfectly detect straight overlaps
  const simplifiedPoints: {x: number, y: number}[] = [];
  if (orthoPoints.length > 0) simplifiedPoints.push(orthoPoints[0]);
  for (let i = 1; i < orthoPoints.length - 1; i++) {
    const prev = simplifiedPoints[simplifiedPoints.length - 1];
    const curr = orthoPoints[i];
    const next = orthoPoints[i+1];
    const isCollinearX = Math.abs(prev.x - curr.x) < 1 && Math.abs(curr.x - next.x) < 1;
    const isCollinearY = Math.abs(prev.y - curr.y) < 1 && Math.abs(curr.y - next.y) < 1;
    if (!isCollinearX && !isCollinearY) {
      simplifiedPoints.push(curr);
    }
  }
  if (orthoPoints.length > 1) simplifiedPoints.push(orthoPoints[orthoPoints.length - 1]);

  // Register our exact computed orthogonal path to the global store
  globalEdgeSegments.set(id, simplifiedPoints);

  // Clean up if this edge is deleted
  React.useEffect(() => {
    return () => {
      globalEdgeSegments.delete(id);
    };
  }, [id]);

  const tJunctions = corners.filter(corner => {
    // Check if this corner lies STRICTLY on any segment of ANY OTHER edge in the entire canvas
    for (const [otherId, otherOrthoPoints] of globalEdgeSegments.entries()) {
      if (otherId === id) continue;
      
      for (let i = 0; i < otherOrthoPoints.length - 1; i++) {
        const p1 = otherOrthoPoints[i];
        const p2 = otherOrthoPoints[i+1];
        
        // Is it a vertical segment?
        if (Math.abs(p1.x - p2.x) < 1) {
          if (Math.abs(corner.x - p1.x) < 2) { // Corner shares X
            const minY = Math.min(p1.y, p2.y);
            const maxY = Math.max(p1.y, p2.y);
            // Strictly between (meaning the pipe goes straight past the corner)
            if (corner.y > minY + 2 && corner.y < maxY - 2) return true;
          }
        } 
        // Is it a horizontal segment?
        else if (Math.abs(p1.y - p2.y) < 1) {
          if (Math.abs(corner.y - p1.y) < 2) { // Corner shares Y
            const minX = Math.min(p1.x, p2.x);
            const maxX = Math.max(p1.x, p2.x);
            if (corner.x > minX + 2 && corner.x < maxX - 2) return true;
          }
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

      {/* Invisible interaction paths to drag the pipe lines */}
      {allowEditPipes && pts.length >= 2 && pts.slice(0, -1).map((p1, i) => {
        const p2 = pts[i+1];
        const isHorizontal = Math.abs(p1.y - p2.y) < 1;
        return (
          <line
            key={`drag-${i}`}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            strokeWidth={32}
            stroke="transparent"
            cursor={isHorizontal ? 'ns-resize' : 'ew-resize'}
            pointerEvents="all"
            onDoubleClick={(e) => {
               e.stopPropagation();
               rf.setEdges(eds => eds.map(edge => {
                     if (edge.id === id) {
                        const newData = { ...edge.data };
                        delete newData.customPoints;
                        return { ...edge, data: newData };
                     }
                     return edge;
               }));
               axios.patch(`${BACKEND_URL}/api/edges/${id.replace('-base', '').replace('-core', '')}/attributes`, {
                  attributes: {}
               }).catch(console.error);
            }}
            onPointerDown={(e) => {
               e.stopPropagation();
               const target = e.currentTarget as unknown as HTMLElement;
               target.setPointerCapture(e.pointerId);
               
               const startMouse = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
               const initialPts = [...pts];
               let currentFinalPoints = [...initialPts.slice(1, -1)];

               const onPointerMove = (evt: PointerEvent) => {
                  const currentMouse = rf.screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
                  const dx = Math.round((currentMouse.x - startMouse.x) / 10) * 10;
                  const dy = Math.round((currentMouse.y - startMouse.y) / 10) * 10;
                  if (dx === 0 && dy === 0) return;
                  
                  let newPts = [...initialPts];
                  
                  if (newPts.length === 2) {
                     if (isHorizontal) {
                        newPts.splice(1, 0, { x: newPts[0].x, y: newPts[0].y + dy }, { x: newPts[1].x, y: newPts[1].y + dy });
                     } else {
                        newPts.splice(1, 0, { x: newPts[0].x + dx, y: newPts[0].y }, { x: newPts[1].x + dx, y: newPts[1].y });
                     }
                  } else if (i === 0) {
                     if (isHorizontal) {
                        newPts.splice(1, 0, { x: newPts[0].x, y: newPts[0].y + dy });
                        newPts[2] = { ...newPts[2], y: newPts[2].y + dy };
                     } else {
                        newPts.splice(1, 0, { x: newPts[0].x + dx, y: newPts[0].y });
                        newPts[2] = { ...newPts[2], x: newPts[2].x + dx };
                     }
                  } else if (i === newPts.length - 2) {
                     if (isHorizontal) {
                        newPts.splice(newPts.length - 1, 0, { x: newPts[newPts.length - 1].x, y: newPts[newPts.length - 1].y + dy });
                        newPts[i] = { ...newPts[i], y: newPts[i].y + dy };
                     } else {
                        newPts.splice(newPts.length - 1, 0, { x: newPts[newPts.length - 1].x + dx, y: newPts[newPts.length - 1].y });
                        newPts[i] = { ...newPts[i], x: newPts[i].x + dx };
                     }
                  } else {
                     if (isHorizontal) {
                        newPts[i] = { ...newPts[i], y: newPts[i].y + dy };
                        newPts[i + 1] = { ...newPts[i + 1], y: newPts[i + 1].y + dy };
                     } else {
                        newPts[i] = { ...newPts[i], x: newPts[i].x + dx };
                        newPts[i + 1] = { ...newPts[i + 1], x: newPts[i + 1].x + dx };
                     }
                  }
                  
                  currentFinalPoints = newPts.slice(1, newPts.length - 1);
                  rf.setEdges(eds => eds.map(edge => {
                     if (edge.id === id) {
                        return { ...edge, data: { ...edge.data, customPoints: currentFinalPoints } };
                     }
                     return edge;
                  }));
               };
               
               const onPointerUp = (evt: PointerEvent) => {
                  target.releasePointerCapture(evt.pointerId);
                  target.removeEventListener('pointermove', onPointerMove);
                  target.removeEventListener('pointerup', onPointerUp);
                  axios.patch(`${BACKEND_URL}/api/edges/${id.replace('-base', '').replace('-core', '')}/attributes`, {
                     attributes: { customPoints: currentFinalPoints }
                  }).catch(console.error);
               };
               
               target.addEventListener('pointermove', onPointerMove);
               target.addEventListener('pointerup', onPointerUp);
            }}
          />
        );
      })}

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
