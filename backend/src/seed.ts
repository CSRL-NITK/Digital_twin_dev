import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create Topology
  const topology = await prisma.topology.create({
    data: {
      name: 'Star Topology',
      description: 'A star topology water distribution network',
    },
  });

  console.log(`Created Topology: ${topology.name} (${topology.id})`);

  // Create or Update Admin User
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: 'System Administrator'
    },
    create: {
      username: adminUsername,
      passwordHash,
      role: 'ADMIN',
      name: 'System Administrator'
    }
  });
  console.log(`Admin user '${adminUsername}' has been configured.`);

  // Create Nodes
  const nodesData = [
    { name: 'Pump P1', type: 'pump', x: 53, y: 192 },
    { name: 'Central Tank', type: 'central_tank', x: 336, y: 205 },
    { name: 'T1', type: 'tank', x: 836, y: -45 },
    { name: 'T2', type: 'tank', x: 836, y: 165 },
    { name: 'T3', type: 'tank', x: 836, y: 369 },
    { name: 'T4', type: 'tank', x: 836, y: 592 },
  ];

  const createdNodes: Record<string, string> = {};

  for (const node of nodesData) {
    const created = await prisma.node.create({
      data: {
        topologyId: topology.id,
        nodeName: node.name,
        nodeType: node.type,
        positionX: node.x,
        positionY: node.y,
        status: 'Healthy',
      },
    });
    createdNodes[node.name] = created.id;
    console.log(`Created Node: ${node.name} (${created.id})`);

    // Create sensors for tanks
    if (node.type === 'tank' || node.type === 'central_tank') {
      const sensors = [
        { name: 'pH Sensor', type: 'ph' },
        { name: 'TDS Sensor', type: 'tds' },
        { name: 'Temperature Sensor', type: 'temperature' },
        { name: 'Ultrasonic Sensor', type: 'water_level' },
      ];

      for (const s of sensors) {
        await prisma.sensor.create({
          data: {
            nodeId: created.id,
            sensorName: s.name,
            sensorType: s.type,
            status: 'Online',
          }
        });
      }
      console.log(`Created 4 sensors for ${node.name}`);
    }
  }

  // Create Edges
  const edgesData = [
    { source: 'Pump P1', target: 'Central Tank' },
    { source: 'Central Tank', target: 'T1' },
    { source: 'Central Tank', target: 'T2' },
    { source: 'Central Tank', target: 'T3' },
    { source: 'Central Tank', target: 'T4' },
  ];

  for (const edge of edgesData) {
    await prisma.edge.create({
      data: {
        topologyId: topology.id,
        sourceNodeId: createdNodes[edge.source],
        targetNodeId: createdNodes[edge.target],
        edgeType: 'pipe',
        status: 'Active',
      },
    });
    console.log(`Created Edge: ${edge.source} -> ${edge.target}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
