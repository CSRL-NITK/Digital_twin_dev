import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Smart Garden Topology...');

  // Find or Create the Smart Garden Topology
  let topology = await prisma.topology.findFirst({
    where: {
      OR: [
        { name: 'Smart Garden Topology' },
        { name: 'Smart Garden' },
      ],
    },
  });

  if (topology) {
    console.log(`Found existing Smart Garden Topology (ID: ${topology.id}). Cleaning its nodes, edges, and sensors...`);
    await prisma.node.deleteMany({
      where: { topologyId: topology.id },
    });
    // Update name to standard 'Smart Garden Topology' if needed
    if (topology.name !== 'Smart Garden Topology') {
      await prisma.topology.update({
        where: { id: topology.id },
        data: { name: 'Smart Garden Topology' },
      });
    }
  } else {
    topology = await prisma.topology.create({
      data: {
        name: 'Smart Garden Topology',
        description: '{"customConfigs":{},"viewport":{"x":-600,"y":-300,"w":1800,"h":900}}',
      },
    });
    console.log(`Created Smart Garden Topology (ID: ${topology.id})`);
  }

  // Define Nodes for Smart Garden
  const nodesData = [
    { name: 'Garden Water Reservoir', type: 'source_tank', x: -520, y: 40 },
    { name: 'Solar Panel System', type: 'smart_garden_solar_panel', x: -220, y: -220 },
    { name: 'IoT Control Unit (Arduino Nano 33)', type: 'smart_garden_control_box', x: -180, y: 60 },
    { name: 'Solenoid Valve & Flow Assembly', type: 'smart_garden_solenoid_valve', x: 220, y: 60 },
    { name: 'System 3D Power Switch', type: 'smart_garden_switch', x: 220, y: -160 },
    { name: 'Main Irrigation Pump', type: 'pump', x: -200, y: 320 },
    { name: 'Garden Bed Dispenser', type: 'tank', x: 580, y: 60 },
  ];

  const createdNodes: Record<string, number> = {};

  for (const n of nodesData) {
    const created = await prisma.node.create({
      data: {
        topologyId: topology.id,
        nodeName: n.name,
        nodeType: n.type,
        positionX: n.x,
        positionY: n.y,
        status: 'healthy',
      },
    });
    createdNodes[n.name] = created.id;
    console.log(`  ✓ Created Node: ${n.name} [ID: ${created.id}] (${n.type})`);
  }

  // Define Edges (Cables & Pipes)
  const edgesData = [
    {
      source: 'Solar Panel System',
      target: 'IoT Control Unit (Arduino Nano 33)',
      type: 'corrugatedCable',
      sourcePort: 'output-electrical',
      targetPort: 'input-power',
    },
    {
      source: 'System 3D Power Switch',
      target: 'Solenoid Valve & Flow Assembly',
      type: 'corrugatedCable',
      sourcePort: 'output-switch',
      targetPort: 'input-switch-power',
    },
    {
      source: 'IoT Control Unit (Arduino Nano 33)',
      target: 'Main Irrigation Pump',
      type: 'corrugatedCable',
      sourcePort: 'output-relay',
      targetPort: 'input-pump-power',
    },
    {
      source: 'Garden Water Reservoir',
      target: 'Main Irrigation Pump',
      type: 'waterFlow',
      sourcePort: 'outflow',
      targetPort: 'inlet',
    },
    {
      source: 'Main Irrigation Pump',
      target: 'Solenoid Valve & Flow Assembly',
      type: 'waterFlow',
      sourcePort: 'outlet',
      targetPort: 'water-inlet',
    },
    {
      source: 'Solenoid Valve & Flow Assembly',
      target: 'Garden Bed Dispenser',
      type: 'waterFlow',
      sourcePort: 'water-outlet',
      targetPort: 'inflow',
    },
  ];

  for (const e of edgesData) {
    const sourceId = createdNodes[e.source];
    const targetId = createdNodes[e.target];
    if (sourceId && targetId) {
      const createdEdge = await prisma.edge.create({
        data: {
          topologyId: topology.id,
          sourceNodeId: sourceId,
          targetNodeId: targetId,
          edgeType: e.type,
          sourcePortId: e.sourcePort,
          targetPortId: e.targetPort,
          status: 'normal',
        },
      });
      console.log(`  ✓ Created Edge (${e.type}): ${e.source} -> ${e.target} [ID: ${createdEdge.id}]`);
    }
  }

  // Define Sensors & Initial Telemetry Readings
  const sensorsConfig = [
    {
      nodeName: 'Solenoid Valve & Flow Assembly',
      sensors: [
        { name: 'Water Flow Rate Sensor', type: 'flow_meter', initialValue: 4.8 },
        { name: 'Solenoid Valve Voltage', type: 'voltage', initialValue: 12.0 },
      ],
    },
    {
      nodeName: 'Solar Panel System',
      sensors: [
        { name: 'Solar Output Power', type: 'power', initialValue: 45.2 },
        { name: 'Solar Irradiance', type: 'irradiance', initialValue: 850.0 },
      ],
    },
    {
      nodeName: 'IoT Control Unit (Arduino Nano 33)',
      sensors: [
        { name: 'MCU Temperature Sensor', type: 'temperature', initialValue: 34.5 },
      ],
    },
    {
      nodeName: 'Garden Water Reservoir',
      sensors: [
        { name: 'Water Level Sensor', type: 'water_level', initialValue: 88.5 },
        { name: 'Water Temperature Sensor', type: 'water_temp', initialValue: 24.2 },
      ],
    },
  ];

  let totalSensors = 0;
  for (const group of sensorsConfig) {
    const nodeId = createdNodes[group.nodeName];
    if (!nodeId) continue;

    for (const s of group.sensors) {
      const sensor = await prisma.sensor.create({
        data: {
          nodeId,
          sensorName: s.name,
          sensorType: s.type,
          status: 'Online',
        },
      });
      totalSensors++;

      // Seed initial reading
      await prisma.sensorReading.create({
        data: {
          sensorId: sensor.id,
          value: s.initialValue,
        },
      });
      console.log(`  ✓ Created Sensor: ${s.name} (${s.type}) on ${group.nodeName} [Initial: ${s.initialValue}]`);
    }
  }

  console.log(`\n🎉 Smart Garden Topology Seed Completed!`);
  console.log(`   - Topology ID: ${topology.id}`);
  console.log(`   - Nodes: ${nodesData.length}`);
  console.log(`   - Edges: ${edgesData.length}`);
  console.log(`   - Sensors: ${totalSensors}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding Smart Garden Topology:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
