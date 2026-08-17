import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedSmartGarden() {
  console.log('Seeding Smart Garden Topology...');

  // Find or Create the Smart Garden Topology
  let topology = await prisma.topology.findFirst({
    where: {
      OR: [
        { name: 'Smart Garden Topology' },
        { name: 'smart garden' },
        { name: 'Smart Garden' }
      ]
    }
  });

  if (topology) {
    console.log(`Found existing Smart Garden Topology (ID: ${topology.id}). Cleaning nodes & edges...`);
    await prisma.node.deleteMany({
      where: { topologyId: topology.id }
    });
  } else {
    topology = await prisma.topology.create({
      data: {
        name: 'Smart Garden Topology',
        description: JSON.stringify({
          customConfigs: {},
          viewport: { x: -600, y: -300, w: 1800, h: 900 }
        })
      }
    });
    console.log(`Created Smart Garden Topology (ID: ${topology.id})`);
  }

  // Exact Nodes configured by the user in DB
  const nodesData = [
    {
      key: 'solar_panel',
      name: 'Solar Panel System',
      type: 'smart_garden_solar_panel',
      x: -11,
      y: -202,
      attributes: { customWidth: 569, customHeight: 743 },
      sensors: [
        { name: 'Solar Output Power', type: 'power' },
        { name: 'Solar Irradiance', type: 'irradiance' }
      ]
    },
    {
      key: 'control_box',
      name: 'Electronic Control Box-549',
      type: 'control_box',
      x: 225,
      y: 117,
      attributes: { customWidth: 90, customHeight: 144 },
      sensors: [
        { name: 'Electronic Control Box-549 WATER LEVEL', type: 'water_level' },
        { name: 'Electronic Control Box-549 PH', type: 'ph' },
        { name: 'Electronic Control Box-549 TDS', type: 'tds' },
        { name: 'Electronic Control Box-549 TEMPERATURE', type: 'temperature' }
      ]
    },
    {
      key: 'solenoid_valve',
      name: 'Solenoid Valve & Meter-636',
      type: 'solenoid_valve',
      x: -325,
      y: 258,
      attributes: { customWidth: 504, customHeight: 293 },
      sensors: [
        { name: 'Solenoid Valve & Meter-636 WATER LEVEL', type: 'water_level' },
        { name: 'Solenoid Valve & Meter-636 PH', type: 'ph' },
        { name: 'Solenoid Valve & Meter-636 TDS', type: 'tds' },
        { name: 'Solenoid Valve & Meter-636 TEMPERATURE', type: 'temperature' }
      ]
    }
  ];

  const createdNodesMap: Record<string, number> = {};

  for (const node of nodesData) {
    const created = await prisma.node.create({
      data: {
        topologyId: topology.id,
        nodeName: node.name,
        nodeType: node.type,
        positionX: node.x,
        positionY: node.y,
        status: 'healthy',
        attributes: node.attributes
      }
    });
    createdNodesMap[node.key] = created.id;
    console.log(`Created Node: ${node.name} (ID: ${created.id}) at (${node.x}, ${node.y})`);

    for (const s of node.sensors) {
      await prisma.sensor.create({
        data: {
          nodeId: created.id,
          sensorName: s.name,
          sensorType: s.type,
          status: 'Online'
        }
      });
    }
    console.log(`Created ${node.sensors.length} sensors for ${node.name}`);
  }

  // Exact Edges configured by the user in DB
  const edgesData = [
    {
      sourceKey: 'control_box',
      targetKey: 'solar_panel',
      sourcePortId: 'control-out-top',
      targetPortId: 'power-in-pivot-left',
      edgeType: 'cable'
    },
    {
      sourceKey: 'control_box',
      targetKey: 'solenoid_valve',
      sourcePortId: 'control-out-bottom',
      targetPortId: 'solenoid-port-in-bottom',
      edgeType: 'cable'
    }
  ];

  for (const edge of edgesData) {
    await prisma.edge.create({
      data: {
        topologyId: topology.id,
        sourceNodeId: createdNodesMap[edge.sourceKey],
        targetNodeId: createdNodesMap[edge.targetKey],
        sourcePortId: edge.sourcePortId,
        targetPortId: edge.targetPortId,
        edgeType: edge.edgeType,
        status: 'normal'
      }
    });
    console.log(`Created Cable Edge: ${edge.sourceKey} (${edge.sourcePortId}) -> ${edge.targetKey} (${edge.targetPortId})`);
  }

  console.log('Smart Garden Topology seeding completed successfully.');
  return topology;
}

if (require.main === module) {
  seedSmartGarden()
    .catch((err) => {
      console.error('Error seeding Smart Garden:', err);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
      pool.end();
    });
}
