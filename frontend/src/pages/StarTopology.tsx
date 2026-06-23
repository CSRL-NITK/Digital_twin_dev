import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow';
import type { Connection, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import { io } from 'socket.io-client';

import TankNode from '../components/nodes/TankNode';
import CentralTankNode from '../components/nodes/CentralTankNode';
import PumpNode from '../components/nodes/PumpNode';
import NodeDetailsPanel from '../components/NodeDetailsPanel';

const nodeTypes = {
  tank: TankNode,
  central_tank: CentralTankNode,
  pump: PumpNode,
};

const BACKEND_URL = 'http://localhost:3001';

export default function StarTopology() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [nodeHistory, setNodeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io(BACKEND_URL);

    const fetchTopology = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/topologies/star`);
        
        // Format nodes for React Flow
        const formattedNodes = data.nodes.map((node: any) => ({
          id: node.id,
          type: node.nodeType,
          position: { x: node.positionX, y: node.positionY },
          data: { 
            nodeName: node.nodeName,
            status: node.status,
            nodeType: node.nodeType,
            // placeholders that will be updated by socket
            waterLevel: 0,
            ph: 0,
            tds: 0,
            temperature: 0
          }
        }));

        // Format edges for React Flow
        const formattedEdges = data.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        }));

        setNodes(formattedNodes);
        setEdges(formattedEdges);

        // After fetching topology, fetch latest readings to populate initial values
        const readingsRes = await axios.get(`${BACKEND_URL}/api/readings/latest`);
        const latestReadings = readingsRes.data;
        
        setNodes(nds => nds.map(n => {
          const reading = latestReadings.find((r: any) => r.nodeId === n.id);
          if (reading) {
            return {
              ...n,
              data: {
                ...n.data,
                waterLevel: reading.waterLevel,
                ph: reading.ph,
                tds: reading.tds,
                temperature: reading.temperature,
              }
            };
          }
          return n;
        }));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching topology:', error);
        setLoading(false);
      }
    };

    fetchTopology();

    // Socket listeners
    socket.on('reading:update', (data) => {
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === data.nodeId) {
            // Update selected node data if it's the one currently viewed
            // Using functional update for setSelectedNode to avoid stale closure
            setSelectedNode((prevSelected: any) => {
              if (prevSelected && prevSelected.id === data.nodeId) {
                return {
                  ...prevSelected,
                  waterLevel: data.waterLevel,
                  ph: data.ph,
                  tds: data.tds,
                  temperature: data.temperature,
                  status: data.status
                };
              }
              return prevSelected;
            });

            // Append to history
            setNodeHistory(prev => [...prev, {
              createdAt: new Date().toISOString(),
              waterLevel: data.waterLevel,
              ph: data.ph,
              tds: data.tds,
              temperature: data.temperature,
            }].slice(-50)); // keep last 50

            return {
              ...node,
              data: {
                ...node.data,
                waterLevel: data.waterLevel,
                ph: data.ph,
                tds: data.tds,
                temperature: data.temperature,
                status: data.status
              }
            };
          }
          return node;
        })
      );
    });

    socket.on('node:status_update', (data) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === data.id) {
            setSelectedNode((prevSelected: any) => {
              if (prevSelected && prevSelected.id === data.id) {
                return { ...prevSelected, status: data.status };
              }
              return prevSelected;
            });
            return {
              ...node,
              data: { ...node.data, status: data.status }
            };
          }
          return node;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [setNodes, setEdges]); // socket is now internal

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeDragStop = async (_: React.MouseEvent, node: any) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/nodes/${node.id}/position`, {
        positionX: Math.round(node.position.x),
        positionY: Math.round(node.position.y)
      });
    } catch (e) {
      console.error("Failed to save node position", e);
    }
  };

  const onNodeClick = async (_: React.MouseEvent, node: any) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/readings/history/${node.id}`);
      setNodeHistory(res.data);
      setSelectedNode({ id: node.id, ...node.data });
    } catch (e) {
      console.error("Error fetching history", e);
      // fallback for demo
      setNodeHistory([]);
      setSelectedNode({ id: node.id, ...node.data });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full relative glass-panel overflow-hidden">
      <div className="absolute top-6 left-6 z-10">
        <h2 className="text-2xl font-bold text-white mb-1">Star Topology Network</h2>
        <p className="text-text-muted text-sm">Real-time digital twin visualization</p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Background color="#334155" gap={24} size={2} />
        <Controls className="bg-surface border-white/10 fill-white" />
        <MiniMap 
          className="bg-surface border border-white/10 rounded-lg overflow-hidden" 
          maskColor="rgba(15, 23, 42, 0.7)"
          nodeColor={(n) => {
            if (n.type === 'central_tank') return '#3b82f6';
            if (n.type === 'pump') return '#10b981';
            return '#64748b';
          }}
        />
      </ReactFlow>

      {selectedNode && (
        <NodeDetailsPanel 
          node={selectedNode} 
          history={nodeHistory}
          onClose={() => setSelectedNode(null)} 
        />
      )}
    </div>
  );
}
