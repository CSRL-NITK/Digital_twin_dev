import React from 'react';
import axios from 'axios';
import { BaseEdge, getSmoothStepPath, useNodes, Position, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { getSmartEdge } from '@tisoap/react-flow-smart-edge';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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

export const CorrugatedCableEdge: React.FC<EdgeProps> = ({
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

  const allowEditWires = data?.allowEditWires ?? false;
  const allowDeleteWires = data?.allowDeleteNodes ?? false;

  let pts: {x: number, y: number}[] = [];
  let allCorners: {x: number, y: number}[] = [];

  if (data?.customPoints && data.customPoints.length > 0) {
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
    
    if (!smartEdgeSuccess) {
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
  
  const finalSvgPathString = getRoundedPath(allCorners, 12);
  const svgPathString = finalSvgPathString;

  let midX = (sourceX + targetX) / 2;
  let midY = (sourceY + targetY) / 2;
  if (allCorners.length >= 2) {
    const midIdx = Math.floor(allCorners.length / 2);
    const p1 = allCorners[midIdx - 1];
    const p2 = allCorners[midIdx];
    midX = (p1.x + p2.x) / 2;
    midY = (p1.y + p2.y) / 2;
  }

  return (
    <>
      {/* Outer Flexible Black Conduit Pipe */}
      <BaseEdge
        id={`${id}-conduit-outer`}
        path={svgPathString}
        style={{
          ...style,
          stroke: '#11161d',
          strokeWidth: 8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
        }}
      />

      {/* Corrugated Outer Ribbed Texture */}
      <BaseEdge
        id={`${id}-conduit-ribs`}
        path={svgPathString}
        style={{
          ...style,
          stroke: '#334155',
          strokeWidth: 3,
          strokeDasharray: '3,4',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
        }}
      />

      {/* Inner Core Cable Accent */}
      <BaseEdge
        id={`${id}-conduit-core`}
        path={svgPathString}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#0f172a',
          strokeWidth: 1,
          strokeLinejoin: 'round',
          fill: 'none',
        }}
      />

      {/* Invisible interaction paths to drag the wire lines */}
      {allowEditWires && pts.length >= 2 && pts.slice(0, -1).map((p1, i) => {
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
                  
                  const newPts = [...initialPts];
                  
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

      {allowDeleteWires && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)`,
              pointerEvents: 'all',
              zIndex: 1001,
            }}
            className="nodrag nopan"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                rf.setEdges((eds) => eds.filter((edge) => edge.id !== id));
                const cleanId = id.replace('-base', '').replace('-core', '');
                axios.delete(`${BACKEND_URL}/api/edges/${cleanId}`).catch(console.error);
              }}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#ef4444',
                border: '1.5px solid #ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 'bold',
                lineHeight: 1,
                transition: 'transform 0.1s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#ef4444';
              }}
              title="Delete Wire"
            >
              ✕
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CorrugatedCableEdge;
