import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Support serialization of BigInt to JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

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
      nodes: true,
      edges: true
    }
  });
  if (!topology) {
    return res.status(404).json({ error: 'Topology not found' });
  }
  res.json(topology);
});

app.get('/api/nodes', async (req, res) => {
  const nodes = await prisma.node.findMany();
  res.json(nodes);
});

app.get('/api/readings/latest', async (req, res) => {
  // Get latest reading for each node
  const nodes = await prisma.node.findMany();
  const latestReadings = await Promise.all(
    nodes.map(async (node) => {
      const reading = await prisma.sensorReading.findFirst({
        where: { nodeId: node.id },
        orderBy: { createdAt: 'desc' },
      });
      return { nodeId: node.id, reading };
    })
  );
  
  const formatted = latestReadings
    .filter(r => r.reading !== null)
    .map(r => r.reading);
    
  res.json(formatted);
});

app.get('/api/readings/history/:nodeId', async (req, res) => {
  const { nodeId } = req.params;
  const history = await prisma.sensorReading.findMany({
    where: { nodeId },
    orderBy: { createdAt: 'desc' },
    take: 50 // limit history for UI
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

app.get('/api/alerts', async (req, res) => {
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json(alerts);
});

// Endpoint for Python generator to push new readings
app.post('/api/telemetry', async (req, res) => {
  try {
    const { nodeId, waterLevel, ph, tds, temperature } = req.body;
    
    // Save to DB
    const reading = await prisma.sensorReading.create({
      data: {
        nodeId,
        waterLevel,
        ph,
        tds,
        temperature
      }
    });
    
    // Determine status rules
    let status = 'Healthy';
    if (ph === -999 || temperature === -999 || tds === -999) {
      status = 'Offline';
    } else {
      if (ph < 6.5 || ph > 8.5) status = 'Warning';
      if (waterLevel < 30) status = 'Warning';
      if (waterLevel < 15) status = 'Critical';
    }
    
    // Update Node status if changed
    const node = await prisma.node.findUnique({ where: { id: nodeId } });
    if (node && node.status !== status) {
      await prisma.node.update({
        where: { id: nodeId },
        data: { status }
      });
      
      // Create Alert
      if (status !== 'Healthy') {
        await prisma.alert.create({
          data: {
            nodeId,
            alertType: status === 'Critical' ? 'Water Level Critical' : 'Out of Bounds',
            severity: status,
            message: `Node ${node.nodeName} is in ${status} state (WL: ${waterLevel}, pH: ${ph})`
          }
        });
      }
    }

    // Emit to clients
    io.emit('reading:update', {
      nodeId,
      waterLevel,
      ph,
      tds,
      temperature,
      status
    });

    res.status(200).json({ success: true, reading });
  } catch (error) {
    console.error('Error inserting telemetry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
