import React, { useState } from 'react';
import { X, Trash2, Link } from 'lucide-react';
import type { Node, Edge, Connection } from 'reactflow';
import { NODE_PORTS } from '../../utils/ports';

interface FlowConnectionsMenuProps {
  nodes: Node[];
  edges: Edge[];
  onClose: () => void;
  onSaveEdge: (params: Connection | Edge) => void;
  onDeleteEdge: (edgeId: string) => void;
  activeNodeId: string | null;
}

const FlowConnectionsMenu: React.FC<FlowConnectionsMenuProps> = ({
  nodes,
  edges,
  onClose,
  onSaveEdge,
  onDeleteEdge,
  activeNodeId
}) => {
  const [candidatePort, setCandidatePort] = useState<{ portType: 'outlet' | 'inlet', portId: string } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>(''); // format: "nodeId:portId"

  if (!activeNodeId) {
    return (
      <div style={{ background: 'rgba(23, 24, 28, 0.90)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '16px', minWidth: 320, color: '#fff', fontFamily: '"Inter", sans-serif' }}>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, textAlign: 'center' }}>Click on a node on the canvas to configure its connections.</p>
      </div>
    );
  }

  const activeNode = nodes.find(n => n.id === activeNodeId);
  if (!activeNode) return null;

  const nodeType = activeNode.type || 'unknown';
  const nodePorts = NODE_PORTS[nodeType] || { outlets: [], inlets: [] };

  const getNodeName = (id: string) => {
    const node = nodes.find(n => n.id === id);
    return node ? node.data?.nodeName || id : id;
  };

  let activeNodeInlets = [...nodePorts.inlets];
  if (nodeType === 'central_tank') {
    const in1 = activeNode.data?.inlet1On ?? true;
    const in2 = activeNode.data?.inlet2On ?? true;
    const in3 = activeNode.data?.inlet3On ?? true;
    const in4 = activeNode.data?.inlet4On ?? true;
    activeNodeInlets = [];
    if (in1) activeNodeInlets.push('inlet-1');
    if (in2) activeNodeInlets.push('inlet-2');
    if (in3) activeNodeInlets.push('inlet-3');
    if (in4) activeNodeInlets.push('inlet-4');
  }

  const handleConnect = () => {
    if (!candidatePort || !selectedCandidate) return;
    const [targetNodeId, targetPortId] = selectedCandidate.split(':');
    
    let newEdge: any;
    if (candidatePort.portType === 'outlet') {
      newEdge = {
        id: `edge-${activeNodeId}-${candidatePort.portId}-${targetNodeId}-${targetPortId}-${Date.now()}`,
        source: activeNodeId,
        sourceHandle: candidatePort.portId,
        target: targetNodeId,
        targetHandle: targetPortId,
      };
    } else {
      newEdge = {
        id: `edge-${targetNodeId}-${targetPortId}-${activeNodeId}-${candidatePort.portId}-${Date.now()}`,
        source: targetNodeId,
        sourceHandle: targetPortId,
        target: activeNodeId,
        targetHandle: candidatePort.portId,
      };
    }

    onSaveEdge(newEdge);
    setCandidatePort(null);
    setSelectedCandidate('');
  };

  // Helper to find existing connections for a specific port on the active node
  const getPortConnections = (portType: 'outlet' | 'inlet', portId: string) => {
    if (portType === 'outlet') {
      return edges.filter(e => e.source === activeNodeId && (!e.sourceHandle || e.sourceHandle === portId));
    } else {
      return edges.filter(e => e.target === activeNodeId && (!e.targetHandle || e.targetHandle === portId));
    }
  };

  // Helper to get valid candidates for a port
  const getValidCandidates = (portType: 'outlet' | 'inlet') => {
    const candidates: { nodeId: string, nodeName: string, portId: string }[] = [];
    nodes.forEach(node => {
      if (node.id === activeNodeId) return; // No self loops
      const ports = NODE_PORTS[node.type || 'unknown'] || { outlets: [], inlets: [] };
      
      if (portType === 'outlet') {
        // Find free inlets on other nodes
        let targetInlets = [...ports.inlets];
        let isSingleActiveInlet = false;
        
        if (node.type === 'central_tank') {
           const in1 = node.data?.inlet1On ?? true;
           const in2 = node.data?.inlet2On ?? true;
           const in3 = node.data?.inlet3On ?? true;
           const in4 = node.data?.inlet4On ?? true;
           targetInlets = [];
           if (in1) targetInlets.push('inlet-1');
           if (in2) targetInlets.push('inlet-2');
           if (in3) targetInlets.push('inlet-3');
           if (in4) targetInlets.push('inlet-4');
           
           if (targetInlets.length === 1) {
              isSingleActiveInlet = true;
           }
        }

        targetInlets.forEach(inlet => {
          const inletConnsCount = edges.filter(e => e.target === node.id && (!e.targetHandle || e.targetHandle === inlet)).length;
          const maxInletConns = isSingleActiveInlet ? 10 : 1;
          
          if (inletConnsCount < maxInletConns) {
            candidates.push({ nodeId: node.id, nodeName: node.data?.nodeName || node.id, portId: inlet });
          }
        });
      } else {
        // Find free outlets on other nodes
        ports.outlets.forEach(outlet => {
          const outletConnsCount = edges.filter(e => e.source === node.id && (!e.sourceHandle || e.sourceHandle === outlet)).length;
          let maxOutletConns = 1;
          if (node.type === 'pump') maxOutletConns = node.data?.maxPumpOutlets || 2;
          
          if (outletConnsCount < maxOutletConns) {
            candidates.push({ nodeId: node.id, nodeName: node.data?.nodeName || node.id, portId: outlet });
          }
        });
      }
    });
    return candidates;
  };

  const activeNodeEdges = edges.filter(e => e.source === activeNodeId || e.target === activeNodeId);

  return (
    <>
      <style>{`
        .react-flow__node[data-id="${activeNodeId}"] {
          box-shadow: 0 0 0 3px #00ffff, 0 0 24px rgba(0, 255, 255, 0.6) !important;
          border-radius: 12px;
          transition: all 0.2s ease;
          z-index: 1000 !important;
        }
        .flow-connections-menu::-webkit-scrollbar {
          width: 6px;
        }
        .flow-connections-menu::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .flow-connections-menu::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .flow-connections-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      <div className="flow-connections-menu" style={{
        background: 'rgba(23, 24, 28, 0.90)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.40)', minWidth: 320, zIndex: 50, backdropFilter: 'blur(10px)',
        color: '#fff', fontFamily: '"Inter", sans-serif',
        maxHeight: '75vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#00ffff' }}>
            Connections for {activeNode.data?.nodeName || activeNodeId}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={16} />
          </button>
        </div>

        {/* Outlets Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Outlets</h4>
          {nodePorts.outlets.length === 0 ? (
             <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>No outlets available.</div>
          ) : nodePorts.outlets.map(portId => {
            const conns = getPortConnections('outlet', portId);
            let maxConns = 1;
            if (nodeType === 'pump') maxConns = activeNode.data?.maxPumpOutlets || 2;
            const isFull = conns.length >= maxConns;
            const isConnecting = candidatePort?.portId === portId && candidatePort.portType === 'outlet';
            
            return (
              <div key={portId} style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{portId}</span>
                  <span style={{ fontSize: 11, background: isFull ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: isFull ? '#ef4444' : '#22c55e', padding: '2px 6px', borderRadius: 10 }}>
                    {conns.length}/{maxConns}
                  </span>
                </div>
                {conns.map(conn => (
                  <div key={conn.id} style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ➔ {getNodeName(conn.target)} ({conn.targetHandle || 'inlet-1'})
                    <button onClick={() => onDeleteEdge(conn.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: 'auto' }}><Trash2 size={12}/></button>
                  </div>
                ))}
                {!isFull && (
                  isConnecting ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <select value={selectedCandidate} onChange={e => setSelectedCandidate(e.target.value)} style={{ padding: '6px', borderRadius: 4, background: '#111216', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, outline: 'none' }}>
                        <option value="">-- Select Target --</option>
                        {getValidCandidates('outlet').map(c => (
                          <option key={`${c.nodeId}:${c.portId}`} value={`${c.nodeId}:${c.portId}`}>
                            {c.nodeName} ({c.portId})
                          </option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={handleConnect} style={{ flex: 1, padding: '4px', background: '#00ffff', color: '#000', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Connect</button>
                        <button onClick={() => {setCandidatePort(null); setSelectedCandidate('');}} style={{ padding: '4px 8px', background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setCandidatePort({ portType: 'outlet', portId })} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0, 255, 255, 0.1)', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.2)', padding: '4px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer', width: 'fit-content' }}>
                      <Link size={12} /> Connect
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* Inlets Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Inlets</h4>
          {activeNodeInlets.length === 0 ? (
             <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>No inlets available.</div>
          ) : activeNodeInlets.map(portId => {
            const conns = getPortConnections('inlet', portId);
            const maxConns = (nodeType === 'central_tank' && activeNodeInlets.length === 1) ? 10 : 1;
            const isFull = conns.length >= maxConns;
            const isConnecting = candidatePort?.portId === portId && candidatePort.portType === 'inlet';
            return (
              <div key={portId} style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{portId}</span>
                  <span style={{ fontSize: 11, background: isFull ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: isFull ? '#ef4444' : '#22c55e', padding: '2px 6px', borderRadius: 10 }}>
                    {conns.length}/{maxConns}
                  </span>
                </div>
                {conns.map(conn => (
                  <div key={conn.id} style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4 }}>
                    From {getNodeName(conn.source)} ({conn.sourceHandle || 'outlet-1'}) ➔
                    <button onClick={() => onDeleteEdge(conn.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: 'auto' }}><Trash2 size={12}/></button>
                  </div>
                ))}
                {!isFull && (
                  isConnecting ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <select value={selectedCandidate} onChange={e => setSelectedCandidate(e.target.value)} style={{ padding: '6px', borderRadius: 4, background: '#111216', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, outline: 'none' }}>
                        <option value="">-- Select Source --</option>
                        {getValidCandidates('inlet').map(c => (
                          <option key={`${c.nodeId}:${c.portId}`} value={`${c.nodeId}:${c.portId}`}>
                            {c.nodeName} ({c.portId})
                          </option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={handleConnect} style={{ flex: 1, padding: '4px', background: '#00ffff', color: '#000', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Connect</button>
                        <button onClick={() => {setCandidatePort(null); setSelectedCandidate('');}} style={{ padding: '4px 8px', background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setCandidatePort({ portType: 'inlet', portId })} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0, 255, 255, 0.1)', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.2)', padding: '4px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer', width: 'fit-content' }}>
                      <Link size={12} /> Connect
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginTop: 8 }} />

        {/* Existing Connections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: 13, color: '#e2e8f0' }}>Node Connections</h4>
          <div style={{
            maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
            paddingRight: 4
          }}>
            {activeNodeEdges.length === 0 && (
              <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>No connections exist.</div>
            )}
            {activeNodeEdges.map(edge => (
              <div key={edge.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4,
                fontSize: 12
              }}>
                <span style={{ color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                  {getNodeName(edge.source)} ➔ {getNodeName(edge.target)}
                </span>
                <button
                  onClick={() => onDeleteEdge(edge.id)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444',
                    padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Delete Connection"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FlowConnectionsMenu;
