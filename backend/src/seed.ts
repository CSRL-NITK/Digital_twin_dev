import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

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

  // Create Nodes
  const nodesData = [
    { name: 'Pump P1', type: 'pump', x: 300, y: 20 },
    { name: 'Central Tank', type: 'central_tank', x: 300, y: 150 },
    { name: 'T1', type: 'tank', x: 300, y: 350 },
    { name: 'T2', type: 'tank', x: 100, y: 250 },
    { name: 'T3', type: 'tank', x: 500, y: 250 },
    { name: 'T4', type: 'tank', x: 300, y: 500 },
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
