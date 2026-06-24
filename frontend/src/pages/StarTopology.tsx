import { useState, useEffect, useCallback } from 'react';
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
import { useOutletContext } from 'react-router-dom';

import TankNode from '../components/nodes/TankNode';
import CentralTankNode from '../components/nodes/CentralTankNode';
import PumpNode from '../components/nodes/PumpNode';

const nodeTypes = {
  tank: TankNode,
  central_tank: CentralTankNode,
  pump: PumpNode,
};

const BACKEND_URL = 'http://localhost:3001';

export default function StarTopology() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { selectedNode, setSelectedNode } = useOutletContext<any>();
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

        const formattedEdges = data.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          animated: true,
          style: { stroke: 'var(--dt-accent)', strokeWidth: 1.5, opacity: 0.7 },
        }));

        setNodes(formattedNodes);
        setEdges(formattedEdges);

        // After fetching topology, you could fetch latest readings to populate initial values
        // const readingsRes = await axios.get(`${BACKEND_URL}/api/readings/latest`);
        
        setNodes(nds => nds.map(n => {
          // The backend currently returns a flat list of all latest sensorReadings.
          // We can just rely on the socket updates.
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
    socket.on('sensor_update', (data) => {
      // data: { nodeId, status, sensors: [{ sensorType, value, status, sensorId }] }
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === data.nodeId) {
            
            // Extract values for the summary card
            const wl = data.sensors.find((s:any) => s.sensorType === 'water_level')?.value;
            const ph = data.sensors.find((s:any) => s.sensorType === 'ph')?.value;
            const tds = data.sensors.find((s:any) => s.sensorType === 'tds')?.value;
            const temp = data.sensors.find((s:any) => s.sensorType === 'temperature')?.value;

            setSelectedNode((prevSelected: any) => {
              if (prevSelected && prevSelected.id === data.nodeId) {
                return {
                  ...prevSelected,
                  waterLevel: wl,
                  ph: ph,
                  tds: tds,
                  temperature: temp,
                  status: data.status,
                  sensors: data.sensors
                };
              }
              return prevSelected;
            });

            // Append to history
            setNodeHistory(prev => [...prev, {
              createdAt: new Date().toISOString(),
              waterLevel: wl,
              ph: ph,
              tds: tds,
              temperature: temp,
            }].slice(-50)); // keep last 50

            return {
              ...node,
              data: {
                ...node.data,
                waterLevel: wl,
                ph: ph,
                tds: tds,
                temperature: temp,
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
  }, [setNodes, setEdges, setSelectedNode]);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeDragStop = async (_: React.MouseEvent, node: any) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/nodes/${node.id}/position`, {
        positionX: Math.round(node.position.x),
        positionY: Math.round(node.position.y)
      });
    } catch (e) {
      console.error("Failed to save position", e);
    }
  };

  const onNodeClick = async (_: React.MouseEvent, node: any) => {
    try {
      // First try to fetch the node details to get sensors
      const nodeRes = await axios.get(`${BACKEND_URL}/api/nodes`);
      const targetNode = nodeRes.data.find((n:any) => n.id === node.id);
      
      setNodeHistory([]); // We'll rely on live socket for history chart to avoid complex grouping here
      setSelectedNode({ id: node.id, ...node.data, sensors: targetNode?.sensors || [] });
    } catch (e) {
      console.error("Error fetching history", e);
      setNodeHistory([]);
      setSelectedNode({ id: node.id, ...node.data, sensors: [] });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle click on canvas background to deselect node
  const onPaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent rounded-[24px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
        style={{ width: '100%', height: '100%' }}
      >
        <Background gap={24} size={1.5} color="var(--color-border)" className="opacity-50" />
        <Controls className="bg-surface border-border fill-text-muted rounded-xl overflow-hidden shadow-sm" />
        <MiniMap 
          className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm" 
          maskColor="var(--color-surface-light)"
          nodeColor={(n) => {
            if (n.type === 'central_tank') return 'var(--color-primary)';
            if (n.type === 'pump') return 'var(--color-success)';
            return 'var(--color-secondary)';
          }}
        />
      </ReactFlow>
    </div>
  );
}
