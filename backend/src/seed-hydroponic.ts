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
  console.log('Seeding Hydroponic Topology...');

  // Delete 'Hydroponic System' if it exists to keep database clean
  await prisma.topology.deleteMany({
    where: { name: 'Hydroponic System' }
  });

  // Find or Create the Hydroponic Topology
  let topology = await prisma.topology.findFirst({
    where: { name: 'Hydroponic Topology' }
  });

  if (topology) {
    console.log(`Found existing Hydroponic Topology (ID: ${topology.id}). Cleaning its nodes & edges to avoid duplicates...`);
    // Delete nodes belonging only to this topology
    await prisma.node.deleteMany({
      where: { topologyId: topology.id }
    });
  } else {
    topology = await prisma.topology.create({
      data: {
        name: 'Hydroponic Topology',
        description: 'A hydroponic system monitoring network',
      },
    });
    console.log(`Created Hydroponic Topology (ID: ${topology.id})`);
  }

  // Create or Update Admin User
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash,
      role: 'admin',
      name: 'System Administrator'
    },
    create: {
      username: adminUsername,
      passwordHash,
      role: 'admin',
      name: 'System Administrator'
    }
  });
  console.log(`Admin user '${adminUsername}' has been configured.`);

  // Create Nodes for Hydroponics
  const nodesData = [
    { name: 'Pump P1', type: 'pump', x: 53, y: 192 },
    { name: 'Central Reservoir', type: 'central_tank', x: 336, y: 205 },
    { name: 'Tier 1', type: 'tank', x: 836, y: -45 },
    { name: 'Tier 2', type: 'tank', x: 836, y: 165 },
    { name: 'Tier 3', type: 'tank', x: 836, y: 369 },
    { name: 'Tier 4', type: 'tank', x: 836, y: 592 },
  ];

  const createdNodes: Record<string, number> = {};

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

    // Create 6 sensors for central reservoir and the tiers
    if (node.type === 'tank' || node.type === 'central_tank') {
      const sensors = [
        { name: 'pH Sensor', type: 'ph' },
        { name: 'TDS Sensor', type: 'tds' },
        { name: 'Turbidity Sensor', type: 'turbidity' },
        { name: 'Water Temperature Sensor', type: 'water_temp' },
        { name: 'Air Temperature Sensor', type: 'air_temp' },
        { name: 'Light Intensity Sensor', type: 'light_intensity' },
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
      console.log(`Created 6 sensors for ${node.name}`);
    }
  }

  // Create Edges
  const edgesData = [
    { source: 'Pump P1', target: 'Central Reservoir' },
    { source: 'Central Reservoir', target: 'Tier 1' },
    { source: 'Central Reservoir', target: 'Tier 2' },
    { source: 'Central Reservoir', target: 'Tier 3' },
    { source: 'Central Reservoir', target: 'Tier 4' },
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

  console.log('Hydroponic System seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
