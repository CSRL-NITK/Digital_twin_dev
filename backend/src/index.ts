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
import bcrypt from 'bcrypt';
import { twinEngine } from './services/twin.service';
import { alertEngine } from './services/alert.service';

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

// Global API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60000, 
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);

// REST APIs
app.get('/api/topologies', async (req, res) => {
  const topologies = await prisma.topology.findMany({
    include: {
      _count: {
        select: { nodes: true, edges: true },
      },
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(topologies);
});

app.post('/api/topologies', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const newTopology = await prisma.topology.create({
      data: { name, description },
    });
    res.status(201).json(newTopology);
  } catch (error) {
    console.error('Error creating topology:', error);
    res.status(500).json({ error: 'Failed to create topology' });
  }
});

app.patch('/api/topologies/:id', async (req, res) => {
  try {
    const topologyId = parseInt(req.params.id, 10);
    if (isNaN(topologyId)) return res.status(400).json({ error: 'Invalid ID' });
    
    const { name, description } = req.body;
    const updated = await prisma.topology.update({
      where: { id: topologyId },
      data: { name, description },
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating topology:', error);
    res.status(500).json({ error: 'Failed to update topology' });
  }
});

app.delete('/api/topologies/:id', async (req, res) => {
  try {
    const topologyId = parseInt(req.params.id, 10);
    if (isNaN(topologyId)) return res.status(400).json({ error: 'Invalid ID' });
    
    await prisma.topology.delete({
      where: { id: topologyId },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting topology:', error);
    res.status(500).json({ error: 'Failed to delete topology' });
  }
});

app.get('/api/topologies/:id', async (req, res) => {
  const topologyId = parseInt(req.params.id, 10);
  if (isNaN(topologyId)) {
    return res.status(400).json({ error: 'Invalid topology ID' });
  }
  const topology = await prisma.topology.findUnique({
    where: { id: topologyId },
    include: {
      nodes: {
        include: { sensors: true }
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
  const take = req.query.take ? parseInt(req.query.take as string, 10) : undefined;
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
  
  const nodes = await prisma.node.findMany({
    take,
    skip,
    include: { sensors: true }
  });
  res.json(nodes);
});

app.get('/api/readings/latest', async (req, res) => {
  const state = await twinEngine.getTwinState();
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
  const nodeId = parseInt(req.params.nodeId, 10);
  const history = await prisma.sensorReading.findMany({
    where: { sensor: { nodeId } },
    include: { sensor: true },
    orderBy: { createdAt: 'desc' },
    take: 200 // get history for all 4 sensors
  });
  res.json(history.reverse());
});

app.patch('/api/nodes/:id/position', async (req, res) => {
  const id = parseInt(req.params.id, 10);
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
  const id = parseInt(req.params.id, 10);
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
  const id = parseInt(req.params.id, 10);
  const { nodeName, status, nodeType, attributes } = req.body;
  try {
    const existingNode = await prisma.node.findUnique({ where: { id } });
    if (!existingNode) return res.status(404).json({ error: 'Node not found' });

    let mergedAttributes = existingNode.attributes;
    if (attributes !== undefined) {
      const currentAttrs = (existingNode.attributes as object) || {};
      mergedAttributes = { ...currentAttrs, ...attributes };
    }

    const updated = await prisma.node.update({
      where: { id },
      data: {
        ...(nodeName !== undefined && { nodeName }),
        ...(status !== undefined && { status }),
        ...(nodeType !== undefined && { nodeType }),
        ...(attributes !== undefined && { attributes: mergedAttributes as any })
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
  const id = parseInt(req.params.id, 10);
  try {
    await prisma.node.delete({
      where: { id }
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
        sourceNodeId: parseInt(source, 10),
        targetNodeId: parseInt(target, 10),
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
  const id = parseInt(req.params.id, 10);
  try {
    await prisma.edge.delete({ where: { id } });
    io.emit('edge:deleted', { id });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete edge' });
  }
});

app.get('/api/alerts', async (req, res) => {
  const take = req.query.take ? parseInt(req.query.take as string, 10) : 50;
  const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
  
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    skip
  });
  res.json(alerts);
});

// Endpoint to update topology viewport / custom asset configs (saved as JSON in description)
app.patch('/api/topologies/:id/viewport', async (req, res) => {
  const topologyId = parseInt(req.params.id, 10);
  const { x, y, w, h, customConfigs } = req.body;
  
  if (isNaN(topologyId)) {
    return res.status(400).json({ error: 'Invalid topology ID' });
  }

  try {
    const topology = await prisma.topology.findUnique({ where: { id: topologyId } });
    if (!topology) {
      return res.status(404).json({ error: 'Topology not found' });
    }
    
    let descriptionObj: any = {};
    if (topology.description) {
      try {
        descriptionObj = JSON.parse(topology.description);
      } catch (e) {}
    }
    
    if (x !== undefined && y !== undefined && w !== undefined && h !== undefined) {
      descriptionObj.viewport = { x, y, w, h };
    }
    if (customConfigs !== undefined) {
      descriptionObj.customConfigs = customConfigs;
    }
    
    const updated = await prisma.topology.update({
      where: { id: topologyId },
      data: { description: JSON.stringify(descriptionObj) }
    });
    
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update viewport' });
  }
});


// Endpoint for ThingsBoard Rule Engine Webhook
app.post('/api/telemetry/thingsboard', async (req, res) => {
  try {
    // ThingsBoard will push JSON payload containing telemetry
    const { deviceName, telemetry } = req.body;
    
    if (!deviceName || !telemetry) {
      return res.status(400).json({ error: "Missing deviceName or telemetry in payload" });
    }

    // Pass data directly to Digital Twin Engine
    await twinEngine.updateTwin(deviceName, telemetry);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error processing webhook' });
  }
});

io.on('connection', (socket) => {
  console.log('A client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  
  // Initialize Twin Engine & Alert Engine
  twinEngine.setSocketServer(io);
  twinEngine.initDbMapping();
  alertEngine.setSocketServer(io);
});
