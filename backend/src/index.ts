import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import { initMqttService } from './services/mqtt.service';
import bcrypt from 'bcrypt';

// Sync admin, operator, and viewer credentials from .env
async function syncAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  
  try {
    // Admin
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { username: adminUsername },
      update: { passwordHash: adminHash, role: 'admin', name: 'System Administrator' },
      create: { username: adminUsername, passwordHash: adminHash, role: 'admin', name: 'System Administrator' }
    });
    console.log(`User '${adminUsername}' (admin) synced`);

    // Operator
    const operatorHash = await bcrypt.hash('operator123', 10);
    await prisma.user.upsert({
      where: { username: 'operator' },
      update: { passwordHash: operatorHash, role: 'operator', name: 'Field Operator' },
      create: { username: 'operator', passwordHash: operatorHash, role: 'operator', name: 'Field Operator' }
    });
    console.log(`User 'operator' synced`);

    // Viewer
    const viewerHash = await bcrypt.hash('viewer123', 10);
    await prisma.user.upsert({
      where: { username: 'viewer' },
      update: { passwordHash: viewerHash, role: 'viewer', name: 'Dashboard Viewer' },
      create: { username: 'viewer', passwordHash: viewerHash, role: 'viewer', name: 'Dashboard Viewer' }
    });
    console.log(`User 'viewer' synced`);
    
  } catch (error) {
    console.error('Failed to sync users:', error);
  }
}
syncAdminUser();

// Support serialization of BigInt to JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // Must specify exact origin for credentials
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// Security Middlewares
app.use(helmet());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);

// REST APIs
app.get('/api/topologies', async (req, res) => {
  const topologies = await prisma.topology.findMany();
  res.json(topologies);
});

app.get('/api/topologies/:name', async (req, res) => {
  const { name } = req.params;
  // Convert basic param to matching name
  const topologyName = name === 'star' ? 'Star Topology' : name;
  const topology = await prisma.topology.findFirst({
    where: { name: { contains: topologyName, mode: 'insensitive' } },
    include: {
      nodes: {
        include: {
          sensors: true
        }
      },
      edges: true
    }
  });
  if (!topology) {
    return res.status(404).json({ error: 'Topology not found' });
  }
  res.json(topology);
});

app.get('/api/nodes', async (req, res) => {
  const nodes = await prisma.node.findMany({
    include: { sensors: true }
  });
  res.json(nodes);
});

app.get('/api/readings/latest', async (req, res) => {
  const state = twinEngine.getTwinState();
  const formatted = [];
  
  for (const nodeState of Object.values(state)) {
    if (nodeState.dbSensors && nodeState.lastUpdated) {
      const vals: Record<string, number | undefined> = {
        'water_level': nodeState.waterLevel,
        'ph': nodeState.ph,
        'tds': nodeState.tds,
        'temperature': nodeState.temperature
      };
      
      for (const [sType, sVal] of Object.entries(vals)) {
        if (sVal !== undefined) {
          const dbSensor = nodeState.dbSensors.find((s: any) => s.sensorType === sType);
          if (dbSensor) {
            formatted.push({
              sensorId: dbSensor.id,
              value: sVal,
              createdAt: nodeState.lastUpdated
            });
          }
        }
      }
    }
  }
  
  res.json(formatted);
});

app.get('/api/readings/history/:nodeId', async (req, res) => {
  const { nodeId } = req.params;
  const history = await prisma.sensorReading.findMany({
    where: { sensor: { nodeId } },
    include: { sensor: true },
    orderBy: { createdAt: 'desc' },
    take: 200 // get history for all 4 sensors
  });
  res.json(history.reverse());
});

app.patch('/api/nodes/:id/position', async (req, res) => {
  const { id } = req.params;
  const { positionX, positionY } = req.body;
  
  try {
    const updated = await prisma.node.update({
      where: { id },
      data: { positionX, positionY }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update position' });
  }
});

app.patch('/api/nodes/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const updated = await prisma.node.update({
      where: { id },
      data: { status }
    });
    // Emit globally so UI updates without refresh
    io.emit('node:status_update', { id, status });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/nodes', async (req, res) => {
  const { topologyName, nodeName, nodeType, positionX, positionY, status } = req.body;
  try {
    let topology = await prisma.topology.findFirst({
      where: { name: topologyName || 'Star Topology' }
    });
    if (!topology) {
      topology = await prisma.topology.findFirst();
    }
    if (!topology) {
      return res.status(404).json({ error: 'No topology found' });
    }

    const newNode = await prisma.node.create({
      data: {
        topologyId: topology.id,
        nodeName: nodeName || 'New Node',
        nodeType: nodeType || 'tank',
        positionX: Math.round(positionX || 0),
        positionY: Math.round(positionY || 0),
        status: status || 'healthy'
      },
      include: { sensors: true }
    });

    // Attach default sensors for realistic telemetry simulation
    const sensorTypes = ['water_level', 'ph', 'tds', 'temperature'];
    for (const sType of sensorTypes) {
      await prisma.sensor.create({
        data: {
          nodeId: newNode.id,
          sensorName: `${newNode.nodeName} ${sType.replace('_', ' ').toUpperCase()}`,
          sensorType: sType,
          status: 'online'
        }
      });
    }

    const createdWithSensors = await prisma.node.findUnique({
      where: { id: newNode.id },
      include: { sensors: true }
    });

    await twinEngine.reloadDbMapping();
    io.emit('node:created', createdWithSensors);
    res.status(201).json(createdWithSensors);
  } catch (error) {
    console.error('Failed to create node:', error);
    res.status(500).json({ error: 'Failed to create node' });
  }
});

app.patch('/api/nodes/:id', async (req, res) => {
  const { id } = req.params;
  const { nodeName, status, nodeType } = req.body;
  try {
    const updated = await prisma.node.update({
      where: { id },
      data: {
        ...(nodeName && { nodeName }),
        ...(status && { status }),
        ...(nodeType && { nodeType })
      },
      include: { sensors: true }
    });
    await twinEngine.reloadDbMapping();
    io.emit('node:updated', updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update node' });
  }
});

app.delete('/api/nodes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.node.delete({
      where: { id }
    }).catch((err) => {
      console.warn(`Notice on deleting node ${id} (may not exist in DB):`, err.message || err);
    });
    await twinEngine.reloadDbMapping();
    io.emit('node:deleted', { id });
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ error: 'Failed to delete node' });
  }
});

app.post('/api/edges', async (req, res) => {
  const { source, target, sourceHandle, targetHandle, topologyName } = req.body;
  try {
    let topology = await prisma.topology.findFirst({
      where: { name: topologyName || 'Star Topology' }
    });
    if (!topology) topology = await prisma.topology.findFirst();
    if (!topology) return res.status(404).json({ error: 'No topology found' });

    const newEdge = await prisma.edge.create({
      data: {
        topologyId: topology.id,
        sourceNodeId: source,
        targetNodeId: target,
        sourcePortId: sourceHandle || null,
        targetPortId: targetHandle || null,
        edgeType: 'pipe',
        status: 'normal'
      }
    });
    io.emit('edge:created', newEdge);
    res.status(201).json(newEdge);
  } catch (error) {
    console.error('Failed to create edge:', error);
    res.status(500).json({ error: 'Failed to create edge' });
  }
});

app.delete('/api/edges/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.edge.delete({ where: { id } }).catch(() => {});
    io.emit('edge:deleted', { id });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete edge' });
  }
});

app.get('/api/alerts', async (req, res) => {
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json(alerts);
});

// Endpoint to update topology viewport / custom asset configs (saved as JSON in description)
app.patch('/api/topologies/:name/viewport', async (req, res) => {
  const { name } = req.params;
  const topologyName = name === 'star' ? 'Star Topology' : name;
  const { x, y, w, h, customConfigs } = req.body;
  
  try {
    const topology = await prisma.topology.findFirst({ where: { name: topologyName } });
    if (!topology) {
      return res.status(404).json({ error: 'Topology not found' });
    }
    
    // Parse existing description or start fresh
    let config: any = {};
    if (topology.description) {
      try { config = JSON.parse(topology.description); } catch (e) {}
    }
    
    if (x !== undefined && y !== undefined && w !== undefined && h !== undefined) {
      config.viewport = { x, y, w, h };
    }
    if (customConfigs !== undefined) {
      config.customConfigs = { ...(config.customConfigs || {}), ...customConfigs };
    }
    
    await prisma.topology.update({
      where: { id: topology.id },
      data: { description: JSON.stringify(config) }
    });
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('Failed to update topology viewport:', error);
    res.status(500).json({ error: 'Failed to update viewport' });
  }
});

// Endpoint for Python generator to push new readings
app.post('/api/telemetry', async (req, res) => {
  res.status(400).json({ error: "REST telemetry ingestion is deprecated. Use MQTT." });
});

io.on('connection', (socket) => {
  console.log('A client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// MQTT Broker Setup
const { Aedes } = require('aedes');
const mqttServerFactory = require('aedes-server-factory');
const MQTT_PORT = 1883;

import { twinEngine } from './services/twin.service';
import { alertEngine } from './services/alert.service';

Aedes.createBroker().then((aedes: any) => {
  aedes.on('client', (client: any) => {
    console.log('Aedes client connected:', client ? client.id : client);
  });
  aedes.on('clientError', (client: any, err: any) => console.log('Aedes Client error:', client ? client.id : '', err));
  aedes.on('connectionError', (client: any, err: any) => console.log('Aedes Connection error:', client ? client.id : '', err));

  const mqttServer = mqttServerFactory.createServer(aedes);
  mqttServer.listen(MQTT_PORT, '0.0.0.0', () => {
    console.log(`MQTT Broker running on port ${MQTT_PORT}`);
    
    // Initialize Twin Engine & Alert Engine
    twinEngine.setSocketServer(io);
    twinEngine.initDbMapping();
    alertEngine.setSocketServer(io);

    // Initialize the external MQTT service pipeline
    initMqttService(io);
  });
}).catch((err: any) => {
  console.error('Failed to start Aedes broker:', err);
});
