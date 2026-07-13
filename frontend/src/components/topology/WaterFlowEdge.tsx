import React from 'react';
import axios from 'axios';
import { BaseEdge, getSmoothStepPath, useNodes, Position, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { getSmartEdge } from '@tisoap/react-flow-smart-edge';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Global store to keep track of the exact rendered orthogonal path segments of EVERY pipe
// This allows us to instantly detect if ANY pipe passes straight through a corner to form a T-Junction!
export const globalEdgeSegments = new Map<string, {x: number, y: number}[]>();

function getRoundedPath(points: {x: number, y: number}[], radius: number = 12) {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const distPrev = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const distNext = Math.hypot(next.x - curr.x, next.y - curr.y);
    const currentRadius = Math.min(radius, distPrev / 2, distNext / 2);
    if (currentRadius <= 0) {
      path += ` L ${curr.x} ${curr.y}`;
      continue;
    }
    const b1x = curr.x + (prev.x - curr.x) * (currentRadius / distPrev);
    const b1y = curr.y + (prev.y - curr.y) * (currentRadius / distPrev);
    const b2x = curr.x + (next.x - curr.x) * (currentRadius / distNext);
    const b2y = curr.y + (next.y - curr.y) * (currentRadius / distNext);
    path += ` L ${b1x} ${b1y}`;
    path += ` Q ${curr.x} ${curr.y} ${b2x} ${b2y}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

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
  let allCorners: {x: number, y: number}[] = [];

  if (data?.customPoints && data.customPoints.length > 0) {
    // Deep copy to prevent React state mutation which causes tracking bugs!
    const p = data.customPoints.map((pt: any) => ({ ...pt }));
    
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
    allCorners = [{x: sourceX, y: sourceY}, ...pts, {x: targetX, y: targetY}];
  } else {
    let smartEdgeSuccess = false;
    let parsePath = '';
    try {
      const smartEdge = getSmartEdge({
        sourcePosition, targetPosition, sourceX: modSourceX, sourceY: modSourceY, targetX: modTargetX, targetY: modTargetY, nodes,
        options: { nodePadding: 32 }
      });
      if (smartEdge) {
        parsePath = `M ${sourceX} ${sourceY} L ${modSourceX} ${modSourceY} ${smartEdge.svgPathString.replace(/^M[^\s]+ [^\s]+ /, '')} L ${targetX} ${targetY}`;
        smartEdgeSuccess = true;
      }
    } catch { }
    
    // Safely parse the path into perfectly orthogonal points
    if (!smartEdgeSuccess) {
      // Force borderRadius: 0 so we don't extract arcs which cause diagonal slants!
      const [orthoPath] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 0, offset: LEAD_PX });
      parsePath = orthoPath;
    }

    const regex = /[ML]\s*(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/gi;
    let match;
    const extracted = [];
    while ((match = regex.exec(parsePath)) !== null) {
      const pt = { x: Math.round(parseFloat(match[1])), y: Math.round(parseFloat(match[2])) };
      if (extracted.length === 0 || Math.abs(extracted[extracted.length-1].x - pt.x) > 0 || Math.abs(extracted[extracted.length-1].y - pt.y) > 0) {
        extracted.push(pt);
      }
    }
    
    // Strip all collinear inline points so dragging doesn't break
    const corners = [];
    for (let i = 0; i < extracted.length; i++) {
      if (i === 0 || i === extracted.length - 1) {
        corners.push(extracted[i]);
      } else {
        const prev = corners[corners.length - 1];
        const curr = extracted[i];
        const next = extracted[i + 1];
        const isHorizontal = Math.abs(prev.y - curr.y) < 1 && Math.abs(curr.y - next.y) < 1;
        const isVertical = Math.abs(prev.x - curr.x) < 1 && Math.abs(curr.x - next.x) < 1;
        if (!isHorizontal && !isVertical) {
          corners.push(curr);
        }
      }
    }

    allCorners = corners;

    const p = corners.filter(pt => {
       const isSrc = Math.abs(pt.x - sourceX) < 1 && Math.abs(pt.y - sourceY) < 1;
       const isTgt = Math.abs(pt.x - targetX) < 1 && Math.abs(pt.y - targetY) < 1;
       const isModSrc = Math.abs(pt.x - modSourceX) < 1 && Math.abs(pt.y - modSourceY) < 1;
       const isModTgt = Math.abs(pt.x - modTargetX) < 1 && Math.abs(pt.y - modTargetY) < 1;
       return !isSrc && !isTgt && !isModSrc && !isModTgt;
    });

    pts = [{x: modSourceX, y: modSourceY}, ...p, {x: modTargetX, y: modTargetY}];
  }
  
  finalSvgPathString = getRoundedPath(allCorners, 12);
  const svgPathString = finalSvgPathString;
  
  // Simplify collinear segments out of allCorners to perfectly detect straight overlaps
  const simplifiedPoints: {x: number, y: number}[] = [];
  if (allCorners.length > 0) simplifiedPoints.push(allCorners[0]);
  for (let i = 1; i < allCorners.length - 1; i++) {
    const prev = simplifiedPoints[simplifiedPoints.length - 1];
    const curr = allCorners[i];
    const next = allCorners[i+1];
    const isCollinearX = Math.abs(prev.x - curr.x) < 5 && Math.abs(curr.x - next.x) < 5;
    const isCollinearY = Math.abs(prev.y - curr.y) < 5 && Math.abs(curr.y - next.y) < 5;
    if (!isCollinearX && !isCollinearY) {
      simplifiedPoints.push(curr);
    }
  }
  if (allCorners.length > 1) simplifiedPoints.push(allCorners[allCorners.length - 1]);

  // Register our exact computed orthogonal path to the global store
  globalEdgeSegments.set(id, simplifiedPoints);

  // Clean up if this edge is deleted
  React.useEffect(() => {
    return () => {
      globalEdgeSegments.delete(id);
    };
  }, [id]);

  const tJunctions = simplifiedPoints.filter((corner, idx) => {
    // Ignore start and end points
    if (idx === 0 || idx === simplifiedPoints.length - 1) return false;
    
    // Check if this corner lies STRICTLY on any segment of ANY OTHER edge in the entire canvas
    for (const [otherId, otherOrthoPoints] of globalEdgeSegments.entries()) {
      if (otherId === id) continue;
      
      for (let i = 0; i < otherOrthoPoints.length - 1; i++) {
        const p1 = otherOrthoPoints[i];
        const p2 = otherOrthoPoints[i+1];
        
        // Is it a vertical segment?
        if (Math.abs(p1.x - p2.x) < 5) {
          if (Math.abs(corner.x - p1.x) < 10) { // Corner shares X
            const minY = Math.min(p1.y, p2.y);
            const maxY = Math.max(p1.y, p2.y);
            // Strictly between (meaning the pipe goes straight past the corner)
            if (corner.y > minY + 2 && corner.y < maxY - 2) return true;
          }
        } 
        // Is it a horizontal segment?
        else if (Math.abs(p1.y - p2.y) < 5) {
          if (Math.abs(corner.y - p1.y) < 10) { // Corner shares Y
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
