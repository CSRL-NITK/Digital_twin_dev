import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing old data (except readings and alerts)...');
  await prisma.sensor.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.node.deleteMany();
  await prisma.topology.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');
  await prisma.user.createMany({
    data: [
    {
        "id": 1,
        "name": "System Administrator",
        "username": "admin",
        "email": null,
        "passwordHash": "$2b$10$2OrNhSObuH/B22iBdCfaHe3wInrBLADwP2Asy5YsadjnrRsYATEra",
        "role": "admin",
        "createdAt": "2026-07-04T15:27:50.106Z"
    },
    {
        "id": 2,
        "name": "Field Operator",
        "username": "operator",
        "email": null,
        "passwordHash": "$2b$10$4Vq/tdcmuSHYkAEQeVMlh.JJ3vUuqES9QvmuRixRe6is54SDiqTJO",
        "role": "operator",
        "createdAt": "2026-07-04T15:27:50.162Z"
    },
    {
        "id": 3,
        "name": "Dashboard Viewer",
        "username": "viewer",
        "email": null,
        "passwordHash": "$2b$10$11kAaMyJmE1WsZC3JlFyzO7RXcMImr8oQO/rRKYPdktHEdquSRP0a",
        "role": "viewer",
        "createdAt": "2026-07-04T15:27:50.213Z"
    },
    {
        "id": 91,
        "name": "Jithesh Kumar",
        "username": "testuser",
        "email": "jeethucodes@gmail.com",
        "passwordHash": "$2b$10$CUa23CU5HQLFh.U3n7IbD.RO7UL4uHUFo6M54tDcpwriC/U/ydqRW",
        "role": "viewer",
        "createdAt": "2026-07-08T19:17:24.294Z"
    }
]
  });

  console.log('Seeding Topologies...');
  await prisma.topology.createMany({
    data: [
    {
        "id": 5,
        "name": "Line Topology",
        "description": "{\"customConfigs\":{\"2\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":false,\"outletValveOn\":false},\"4\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":true,\"outletValveOn\":true},\"5\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":false,\"outletValveOn\":false},\"6\":{\"customWidth\":387,\"customHeight\":242,\"inletValveOn\":true,\"outletValveOn\":true},\"8\":{\"customWidth\":436,\"customHeight\":556,\"inletValveOn\":true,\"outletValveOn\":true},\"9\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":false,\"outletValveOn\":false},\"10\":{\"customWidth\":387,\"customHeight\":242,\"inletValveOn\":true,\"outletValveOn\":true}},\"viewport\":{\"x\":-1344,\"y\":-754,\"w\":2522,\"h\":1261}}",
        "createdAt": "2026-07-09T05:03:38.316Z"
    },
    {
        "id": 1,
        "name": "Star Topology",
        "description": "{\"customConfigs\":{\"2\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":false,\"outletValveOn\":false},\"4\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":true,\"outletValveOn\":true},\"5\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":false,\"outletValveOn\":false},\"6\":{\"customWidth\":387,\"customHeight\":242,\"inletValveOn\":true,\"outletValveOn\":true},\"8\":{\"customWidth\":436,\"customHeight\":556,\"inletValveOn\":true,\"outletValveOn\":true},\"9\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":false,\"outletValveOn\":false},\"10\":{\"customWidth\":387,\"customHeight\":242,\"inletValveOn\":true,\"outletValveOn\":true}},\"viewport\":{\"x\":-1214,\"y\":-645,\"w\":2522,\"h\":1261}}",
        "createdAt": "2026-07-04T21:01:21.240Z"
    },
    {
        "id": 12,
        "name": "Hydroponic Topology",
        "description": "A hydroponic system monitoring network",
        "createdAt": "2026-07-21T10:20:27.640Z"
    },
    {
        "id": 6,
        "name": "bus topology",
        "description": "{\"customConfigs\":{\"2\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":false,\"outletValveOn\":false},\"4\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":true,\"outletValveOn\":true},\"5\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":false,\"outletValveOn\":false},\"6\":{\"customWidth\":387,\"customHeight\":242,\"inletValveOn\":true,\"outletValveOn\":true},\"8\":{\"customWidth\":436,\"customHeight\":556,\"inletValveOn\":true,\"outletValveOn\":true},\"9\":{\"customWidth\":295,\"customHeight\":376,\"inletValveOn\":false,\"outletValveOn\":false},\"10\":{\"customWidth\":387,\"customHeight\":242,\"inletValveOn\":true,\"outletValveOn\":true}},\"viewport\":{\"x\":-1001,\"y\":-507,\"w\":2084,\"h\":1042}}",
        "createdAt": "2026-07-09T05:14:21.382Z"
    },
    {
        "id": 7,
        "name": "Smart Garden Topology",
        "description": "{\"customConfigs\":{},\"viewport\":{\"x\":-600,\"y\":-300,\"w\":1800,\"h\":900}}",
        "createdAt": "2026-08-17T12:00:00.000Z"
    }
]
  });

  console.log('Seeding Nodes...');
  await prisma.node.createMany({
    data: [
    {
        "id": 46,
        "topologyId": 6,
        "nodeName": "TANK-4",
        "nodeType": "tank",
        "positionX": -576,
        "positionY": 51,
        "status": "Critical",
        "attributes": {
            "inlet1On": true,
            "inlet2On": true,
            "inlet3On": true,
            "inlet4On": true,
            "customWidth": 349,
            "maxCapacity": 5000,
            "customHeight": 445,
            "inletValveOn": false,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:14:36.598Z"
    },
    {
        "id": 86,
        "topologyId": 6,
        "nodeName": "TDS sensor-TANK-1",
        "nodeType": "tds",
        "positionX": -591,
        "positionY": -257,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "43"
        },
        "createdAt": "2026-07-20T05:07:40.777Z"
    },
    {
        "id": 84,
        "topologyId": 6,
        "nodeName": "Ultrasonic-TANK-1",
        "nodeType": "water_level",
        "positionX": -494,
        "positionY": -406,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "43"
        },
        "createdAt": "2026-07-20T05:07:40.773Z"
    },
    {
        "id": 87,
        "topologyId": 6,
        "nodeName": "temp sensor-TANK-1",
        "nodeType": "temperature",
        "positionX": -477,
        "positionY": -230,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "43"
        },
        "createdAt": "2026-07-20T05:07:40.778Z"
    },
    {
        "id": 36,
        "topologyId": 5,
        "nodeName": "TANK - 2",
        "nodeType": "tank",
        "positionX": -5,
        "positionY": -398,
        "status": "Critical",
        "attributes": {
            "customWidth": 337,
            "maxCapacity": 5000,
            "customHeight": 429,
            "inletValveOn": false,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:08:50.030Z"
    },
    {
        "id": 79,
        "topologyId": 6,
        "nodeName": "temp sensor-TANK-2",
        "nodeType": "temperature",
        "positionX": -4,
        "positionY": -166,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "44"
        },
        "createdAt": "2026-07-20T05:07:40.761Z"
    },
    {
        "id": 77,
        "topologyId": 6,
        "nodeName": "pH sensor-TANK-2",
        "nodeType": "ph",
        "positionX": 44,
        "positionY": -208,
        "status": "healthy",
        "attributes": {
            "customWidth": 161,
            "customHeight": 157,
            "parentAssetId": "44"
        },
        "createdAt": "2026-07-20T05:07:40.757Z"
    },
    {
        "id": 80,
        "topologyId": 6,
        "nodeName": "Ultrasonic-TANK-4",
        "nodeType": "water_level",
        "positionX": -454,
        "positionY": 117,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "46"
        },
        "createdAt": "2026-07-20T05:07:40.764Z"
    },
    {
        "id": 78,
        "topologyId": 6,
        "nodeName": "TDS sensor-TANK-2",
        "nodeType": "tds",
        "positionX": -100,
        "positionY": -179,
        "status": "healthy",
        "attributes": {
            "customWidth": 101,
            "customHeight": 131,
            "parentAssetId": "44"
        },
        "createdAt": "2026-07-20T05:07:40.759Z"
    },
    {
        "id": 82,
        "topologyId": 6,
        "nodeName": "TDS sensor-TANK-4",
        "nodeType": "tds",
        "positionX": -550,
        "positionY": 267,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "46"
        },
        "createdAt": "2026-07-20T05:07:40.767Z"
    },
    {
        "id": 40,
        "topologyId": 5,
        "nodeName": "TANK - 3",
        "nodeType": "tank",
        "positionX": 389,
        "positionY": -398,
        "status": "Critical",
        "attributes": {
            "customWidth": 339,
            "maxCapacity": 5000,
            "customHeight": 433,
            "inletValveOn": false,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:09:02.024Z"
    },
    {
        "id": 74,
        "topologyId": 5,
        "nodeName": "TDS sensor-TANK-2",
        "nodeType": "tds",
        "positionX": 21,
        "positionY": -194,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "36"
        },
        "createdAt": "2026-07-20T05:07:40.751Z"
    },
    {
        "id": 71,
        "topologyId": 5,
        "nodeName": "temp sensor-TANK-3",
        "nodeType": "temperature",
        "positionX": 532,
        "positionY": -171,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "40"
        },
        "createdAt": "2026-07-20T05:07:40.744Z"
    },
    {
        "id": 94,
        "topologyId": 1,
        "nodeName": "TDS sensor-Tank-2",
        "nodeType": "tds",
        "positionX": 778,
        "positionY": -220,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "9"
        },
        "createdAt": "2026-07-20T05:07:40.794Z"
    },
    {
        "id": 72,
        "topologyId": 5,
        "nodeName": "Ultrasonic-TANK-2",
        "nodeType": "water_level",
        "positionX": 111,
        "positionY": -341,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "36"
        },
        "createdAt": "2026-07-20T05:07:40.747Z"
    },
    {
        "id": 83,
        "topologyId": 6,
        "nodeName": "temp sensor-TANK-4",
        "nodeType": "temperature",
        "positionX": -436,
        "positionY": 294,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "46"
        },
        "createdAt": "2026-07-20T05:07:40.770Z"
    },
    {
        "id": 73,
        "topologyId": 5,
        "nodeName": "pH sensor-TANK-2",
        "nodeType": "ph",
        "positionX": 179,
        "positionY": -219,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "36"
        },
        "createdAt": "2026-07-20T05:07:40.749Z"
    },
    {
        "id": 68,
        "topologyId": 5,
        "nodeName": "Ultrasonic-TANK-3",
        "nodeType": "water_level",
        "positionX": 507,
        "positionY": -338,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "40"
        },
        "createdAt": "2026-07-20T05:07:40.728Z"
    },
    {
        "id": 43,
        "topologyId": 6,
        "nodeName": "TANK-1",
        "nodeType": "tank",
        "positionX": -619,
        "positionY": -469,
        "status": "Warning",
        "attributes": {
            "inlet1On": true,
            "inlet2On": true,
            "inlet3On": true,
            "inlet4On": true,
            "customWidth": 346,
            "maxCapacity": 5000,
            "customHeight": 441,
            "inletValveOn": false,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:14:31.538Z"
    },
    {
        "id": 81,
        "topologyId": 6,
        "nodeName": "pH sensor-TANK-4",
        "nodeType": "ph",
        "positionX": -386,
        "positionY": 238,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "46"
        },
        "createdAt": "2026-07-20T05:07:40.766Z"
    },
    {
        "id": 39,
        "topologyId": 5,
        "nodeName": "TANK - 1",
        "nodeType": "tank",
        "positionX": -431,
        "positionY": -405,
        "status": "Warning",
        "attributes": {
            "customWidth": 343,
            "maxCapacity": 5000,
            "customHeight": 439,
            "inletValveOn": false,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:09:00.791Z"
    },
    {
        "id": 85,
        "topologyId": 6,
        "nodeName": "pH sensor-TANK-1",
        "nodeType": "ph",
        "positionX": -432,
        "positionY": -284,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "43"
        },
        "createdAt": "2026-07-20T05:07:40.775Z"
    },
    {
        "id": 69,
        "topologyId": 5,
        "nodeName": "pH sensor-TANK-3",
        "nodeType": "ph",
        "positionX": 572,
        "positionY": -221,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "40"
        },
        "createdAt": "2026-07-20T05:07:40.739Z"
    },
    {
        "id": 75,
        "topologyId": 5,
        "nodeName": "temp sensor-TANK-2",
        "nodeType": "temperature",
        "positionX": 132,
        "positionY": -174,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "36"
        },
        "createdAt": "2026-07-20T05:07:40.753Z"
    },
    {
        "id": 70,
        "topologyId": 5,
        "nodeName": "TDS sensor-TANK-3",
        "nodeType": "tds",
        "positionX": 414,
        "positionY": -191,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "40"
        },
        "createdAt": "2026-07-20T05:07:40.742Z"
    },
    {
        "id": 76,
        "topologyId": 6,
        "nodeName": "Ultrasonic-TANK-2",
        "nodeType": "water_level",
        "positionX": -16,
        "positionY": -316,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "44"
        },
        "createdAt": "2026-07-20T05:07:40.755Z"
    },
    {
        "id": 9,
        "topologyId": 1,
        "nodeName": "Tank-2",
        "nodeType": "tank",
        "positionX": 740,
        "positionY": -469,
        "status": "Critical",
        "attributes": {
            "customWidth": 392,
            "customHeight": 500,
            "inletValveOn": false,
            "outletValveOn": false
        },
        "createdAt": "2026-07-04T15:36:25.619Z"
    },
    {
        "id": 67,
        "topologyId": 1,
        "nodeName": "temp sensor -957",
        "nodeType": "temperature",
        "positionX": -920,
        "positionY": -226,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "12"
        },
        "createdAt": "2026-07-19T15:04:47.439Z"
    },
    {
        "id": 104,
        "topologyId": 1,
        "nodeName": "Ultrasonic-Tank-3",
        "nodeType": "water_level",
        "positionX": -920,
        "positionY": 151,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "13"
        },
        "createdAt": "2026-07-20T05:07:40.815Z"
    },
    {
        "id": 96,
        "topologyId": 5,
        "nodeName": "Ultrasonic-TANK-1",
        "nodeType": "water_level",
        "positionX": -309,
        "positionY": -346,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "39"
        },
        "createdAt": "2026-07-20T05:07:40.799Z"
    },
    {
        "id": 12,
        "topologyId": 1,
        "nodeName": "Tank- 1",
        "nodeType": "tank",
        "positionX": -978,
        "positionY": -472,
        "status": "Critical",
        "attributes": {
            "customWidth": 362,
            "maxCapacity": 5000,
            "customHeight": 462,
            "inletValveOn": true,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": true,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-08T04:52:35.455Z"
    },
    {
        "id": 106,
        "topologyId": 1,
        "nodeName": "TDS sensor-Tank-3",
        "nodeType": "tds",
        "positionX": -824,
        "positionY": 322,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "13"
        },
        "createdAt": "2026-07-20T05:07:40.819Z"
    },
    {
        "id": 66,
        "topologyId": 1,
        "nodeName": "TDS sensor-819",
        "nodeType": "tds",
        "positionX": -753,
        "positionY": -254,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "12"
        },
        "createdAt": "2026-07-19T15:04:45.359Z"
    },
    {
        "id": 65,
        "topologyId": 1,
        "nodeName": "pH sensor-535",
        "nodeType": "ph",
        "positionX": -979,
        "positionY": -265,
        "status": "healthy",
        "attributes": {
            "customWidth": 161,
            "customHeight": 161,
            "parentAssetId": "12"
        },
        "createdAt": "2026-07-19T15:04:39.745Z"
    },
    {
        "id": 47,
        "topologyId": 6,
        "nodeName": "PUMP",
        "nodeType": "pump",
        "positionX": -64,
        "positionY": 21,
        "status": "Offline",
        "attributes": {
            "pumpOn": false,
            "inlet1On": true,
            "inlet2On": true,
            "inlet3On": true,
            "inlet4On": true,
            "customWidth": 387,
            "maxCapacity": 3000,
            "customHeight": 242,
            "tempThreshold": 55,
            "flipHorizontal": true,
            "maxPumpOutlets": 4,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:14:39.114Z"
    },
    {
        "id": 100,
        "topologyId": 6,
        "nodeName": "Ultrasonic-TANK-3",
        "nodeType": "water_level",
        "positionX": -870,
        "positionY": 124,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "45"
        },
        "createdAt": "2026-07-20T05:07:40.807Z"
    },
    {
        "id": 107,
        "topologyId": 1,
        "nodeName": "temp sensor-Tank-3",
        "nodeType": "temperature",
        "positionX": -982,
        "positionY": 350,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "13"
        },
        "createdAt": "2026-07-20T05:07:40.821Z"
    },
    {
        "id": 105,
        "topologyId": 1,
        "nodeName": "pH sensor-Tank-3",
        "nodeType": "ph",
        "positionX": -1066,
        "positionY": 302,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "13"
        },
        "createdAt": "2026-07-20T05:07:40.817Z"
    },
    {
        "id": 101,
        "topologyId": 6,
        "nodeName": "pH sensor-TANK-3",
        "nodeType": "ph",
        "positionX": -798,
        "positionY": 251,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "45"
        },
        "createdAt": "2026-07-20T05:07:40.809Z"
    },
    {
        "id": 102,
        "topologyId": 6,
        "nodeName": "TDS sensor-TANK-3",
        "nodeType": "tds",
        "positionX": -974,
        "positionY": 283,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "45"
        },
        "createdAt": "2026-07-20T05:07:40.811Z"
    },
    {
        "id": 109,
        "topologyId": 5,
        "nodeName": "pH sensor-TANK-4",
        "nodeType": "ph",
        "positionX": 952,
        "positionY": -208,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "38"
        },
        "createdAt": "2026-07-20T05:07:40.825Z"
    },
    {
        "id": 103,
        "topologyId": 6,
        "nodeName": "temp sensor-TANK-3",
        "nodeType": "temperature",
        "positionX": -850,
        "positionY": 306,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "45"
        },
        "createdAt": "2026-07-20T05:07:40.813Z"
    },
    {
        "id": 95,
        "topologyId": 1,
        "nodeName": "temp sensor-Tank-2",
        "nodeType": "temperature",
        "positionX": 914,
        "positionY": -197,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "9"
        },
        "createdAt": "2026-07-20T05:07:40.796Z"
    },
    {
        "id": 110,
        "topologyId": 5,
        "nodeName": "TDS sensor-TANK-4",
        "nodeType": "tds",
        "positionX": 790,
        "positionY": -181,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "38"
        },
        "createdAt": "2026-07-20T05:07:40.827Z"
    },
    {
        "id": 42,
        "topologyId": 5,
        "nodeName": "Central Tank-629",
        "nodeType": "central_tank",
        "positionX": -1275,
        "positionY": -526,
        "status": "Warning",
        "attributes": {
            "inlet1On": true,
            "inlet2On": false,
            "inlet3On": false,
            "inlet4On": false,
            "customWidth": 490,
            "maxCapacity": 10000,
            "customHeight": 625,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:13:09.528Z"
    },
    {
        "id": 37,
        "topologyId": 5,
        "nodeName": "Centrifugal Pump-483",
        "nodeType": "pump",
        "positionX": -745,
        "positionY": -388,
        "status": "Offline",
        "attributes": {
            "pumpOn": false,
            "customWidth": 273,
            "maxCapacity": 3000,
            "customHeight": 171,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "maxPumpOutlets": 4,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:08:52.174Z"
    },
    {
        "id": 99,
        "topologyId": 5,
        "nodeName": "temp sensor-TANK-1",
        "nodeType": "temperature",
        "positionX": -282,
        "positionY": -174,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "39"
        },
        "createdAt": "2026-07-20T05:07:40.805Z"
    },
    {
        "id": 97,
        "topologyId": 5,
        "nodeName": "pH sensor-TANK-1",
        "nodeType": "ph",
        "positionX": -244,
        "positionY": -219,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "39"
        },
        "createdAt": "2026-07-20T05:07:40.801Z"
    },
    {
        "id": 98,
        "topologyId": 5,
        "nodeName": "TDS sensor-TANK-1",
        "nodeType": "tds",
        "positionX": -405,
        "positionY": -188,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "39"
        },
        "createdAt": "2026-07-20T05:07:40.803Z"
    },
    {
        "id": 38,
        "topologyId": 5,
        "nodeName": "TANK - 4",
        "nodeType": "tank",
        "positionX": 754,
        "positionY": -405,
        "status": "Critical",
        "attributes": {
            "customWidth": 359,
            "maxCapacity": 5000,
            "customHeight": 456,
            "inletValveOn": false,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:08:58.459Z"
    },
    {
        "id": 111,
        "topologyId": 5,
        "nodeName": "temp sensor-TANK-4",
        "nodeType": "temperature",
        "positionX": 914,
        "positionY": -167,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "38"
        },
        "createdAt": "2026-07-20T05:07:40.829Z"
    },
    {
        "id": 108,
        "topologyId": 5,
        "nodeName": "Ultrasonic-TANK-4",
        "nodeType": "water_level",
        "positionX": 890,
        "positionY": -338,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "38"
        },
        "createdAt": "2026-07-20T05:07:40.823Z"
    },
    {
        "id": 45,
        "topologyId": 6,
        "nodeName": "TANK-3",
        "nodeType": "tank",
        "positionX": -1004,
        "positionY": 54,
        "status": "Critical",
        "attributes": {
            "inlet1On": true,
            "inlet2On": true,
            "inlet3On": true,
            "inlet4On": true,
            "customWidth": 367,
            "maxCapacity": 5000,
            "customHeight": 468,
            "inletValveOn": false,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:14:35.273Z"
    },
    {
        "id": 48,
        "topologyId": 6,
        "nodeName": "Central Tank",
        "nodeType": "central_tank",
        "positionX": 339,
        "positionY": -205,
        "status": "Critical",
        "attributes": {
            "inlet1On": true,
            "inlet2On": true,
            "inlet3On": true,
            "inlet4On": true,
            "customWidth": 576,
            "maxCapacity": 10000,
            "customHeight": 734,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:14:40.333Z"
    },
    {
        "id": 88,
        "topologyId": 1,
        "nodeName": "Ultrasonic-Tank-4",
        "nodeType": "water_level",
        "positionX": 946,
        "positionY": 138,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "5"
        },
        "createdAt": "2026-07-20T05:07:40.781Z"
    },
    {
        "id": 93,
        "topologyId": 1,
        "nodeName": "pH sensor-Tank-2",
        "nodeType": "ph",
        "positionX": 964,
        "positionY": -254,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "9"
        },
        "createdAt": "2026-07-20T05:07:40.792Z"
    },
    {
        "id": 13,
        "topologyId": 1,
        "nodeName": "Tank  - 3",
        "nodeType": "tank",
        "positionX": -1074,
        "positionY": 71,
        "status": "Warning",
        "attributes": {
            "customWidth": 405,
            "maxCapacity": 5000,
            "customHeight": 516,
            "inletValveOn": false,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": true,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-08T04:52:37.111Z"
    },
    {
        "id": 5,
        "topologyId": 1,
        "nodeName": "Tank-4",
        "nodeType": "tank",
        "positionX": 783,
        "positionY": 53,
        "status": "Critical",
        "attributes": {
            "customWidth": 430,
            "customHeight": 548,
            "inletValveOn": false,
            "outletValveOn": false
        },
        "createdAt": "2026-07-04T21:01:21.245Z"
    },
    {
        "id": 89,
        "topologyId": 1,
        "nodeName": "pH sensor-Tank-4",
        "nodeType": "ph",
        "positionX": 1036,
        "positionY": 303,
        "status": "healthy",
        "attributes": {
            "customWidth": 162,
            "customHeight": 164,
            "parentAssetId": "5"
        },
        "createdAt": "2026-07-20T05:07:40.783Z"
    },
    {
        "id": 44,
        "topologyId": 6,
        "nodeName": "TANK-2",
        "nodeType": "tank",
        "positionX": -125,
        "positionY": -381,
        "status": "Warning",
        "attributes": {
            "inlet1On": true,
            "inlet2On": true,
            "inlet3On": true,
            "inlet4On": true,
            "customWidth": 320,
            "maxCapacity": 5000,
            "customHeight": 408,
            "inletValveOn": false,
            "outletValveOn": false,
            "tempThreshold": 55,
            "flipHorizontal": false,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-09T05:14:33.082Z"
    },
    {
        "id": 90,
        "topologyId": 1,
        "nodeName": "TDS sensor-Tank-4",
        "nodeType": "tds",
        "positionX": 832,
        "positionY": 337,
        "status": "healthy",
        "attributes": {
            "customWidth": 106,
            "customHeight": 143,
            "parentAssetId": "5"
        },
        "createdAt": "2026-07-20T05:07:40.785Z"
    },
    {
        "id": 92,
        "topologyId": 1,
        "nodeName": "Ultrasonic-Tank-2",
        "nodeType": "water_level",
        "positionX": 890,
        "positionY": -399,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "9"
        },
        "createdAt": "2026-07-20T05:07:40.790Z"
    },
    {
        "id": 14,
        "topologyId": 1,
        "nodeName": "PUMP - 1",
        "nodeType": "pump",
        "positionX": -626,
        "positionY": -14,
        "status": "Warning",
        "attributes": {
            "pumpOn": false,
            "customWidth": 405,
            "maxCapacity": 3000,
            "customHeight": 252,
            "tempThreshold": 55,
            "flipHorizontal": true,
            "maxPumpOutlets": 2,
            "waveHeightCalm": 4.5,
            "tempMaxThreshold": 75,
            "waveHeightActive": 17,
            "waveHeightNormal": 11
        },
        "createdAt": "2026-07-08T04:53:04.292Z"
    },
    {
        "id": 91,
        "topologyId": 1,
        "nodeName": "temp sensor-Tank-4",
        "nodeType": "temperature",
        "positionX": 972,
        "positionY": 352,
        "status": "healthy",
        "attributes": {
            "customWidth": 144,
            "customHeight": 118,
            "parentAssetId": "5"
        },
        "createdAt": "2026-07-20T05:07:40.787Z"
    },
    {
        "id": 10,
        "topologyId": 1,
        "nodeName": "PUMP-2",
        "nodeType": "pump",
        "positionX": 350,
        "positionY": 24,
        "status": "Offline",
        "attributes": {
            "pumpOn": false,
            "customWidth": 399,
            "customHeight": 249
        },
        "createdAt": "2026-07-04T15:36:50.023Z"
    },
    {
        "id": 17,
        "topologyId": 1,
        "nodeName": "Central Tank-734",
        "nodeType": "central_tank",
        "positionX": -212,
        "positionY": -586,
        "status": "Healthy",
        "attributes": {
            "customWidth": 542,
            "customHeight": 691
        },
        "createdAt": "2026-07-08T05:59:34.987Z"
    },
    {
        "id": 64,
        "topologyId": 1,
        "nodeName": "Ultrasonic-704",
        "nodeType": "water_level",
        "positionX": -851,
        "positionY": -403,
        "status": "healthy",
        "attributes": {
            "customWidth": 97,
            "customHeight": 93,
            "parentAssetId": "12"
        },
        "createdAt": "2026-07-19T15:04:35.895Z"
    },
    {
        "id": 112,
        "topologyId": 12,
        "nodeName": "Pump P1",
        "nodeType": "pump",
        "positionX": 53,
        "positionY": 192,
        "status": "Healthy",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.702Z"
    },
    {
        "id": 113,
        "topologyId": 12,
        "nodeName": "Central Reservoir",
        "nodeType": "central_tank",
        "positionX": 336,
        "positionY": 205,
        "status": "Healthy",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.705Z"
    },
    {
        "id": 114,
        "topologyId": 12,
        "nodeName": "Tier 1",
        "nodeType": "tank",
        "positionX": 836,
        "positionY": -45,
        "status": "Healthy",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.715Z"
    },
    {
        "id": 115,
        "topologyId": 12,
        "nodeName": "Tier 2",
        "nodeType": "tank",
        "positionX": 836,
        "positionY": 165,
        "status": "Healthy",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.723Z"
    },
    {
        "id": 116,
        "topologyId": 12,
        "nodeName": "Tier 3",
        "nodeType": "tank",
        "positionX": 836,
        "positionY": 369,
        "status": "Healthy",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.729Z"
    },
    {
        "id": 117,
        "topologyId": 12,
        "nodeName": "Tier 4",
        "nodeType": "tank",
        "positionX": 836,
        "positionY": 592,
        "status": "Healthy",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.736Z"
    },
    {
        "id": 138,
        "topologyId": 7,
        "nodeName": "Solar Panel System",
        "nodeType": "smart_garden_solar_panel",
        "positionX": -11,
        "positionY": -202,
        "status": "healthy",
        "attributes": {
            "customWidth": 569,
            "customHeight": 743
        },
        "createdAt": "2026-08-17T14:25:13.618Z"
    },
    {
        "id": 144,
        "topologyId": 7,
        "nodeName": "Electronic Control Box-549",
        "nodeType": "control_box",
        "positionX": 225,
        "positionY": 117,
        "status": "healthy",
        "attributes": {
            "customWidth": 90,
            "customHeight": 144
        },
        "createdAt": "2026-08-17T14:43:54.694Z"
    },
    {
        "id": 145,
        "topologyId": 7,
        "nodeName": "Solenoid Valve & Meter-636",
        "nodeType": "solenoid_valve",
        "positionX": -325,
        "positionY": 258,
        "status": "healthy",
        "attributes": {
            "customWidth": 504,
            "customHeight": 293
        },
        "createdAt": "2026-08-17T14:43:58.284Z"
    }
]
  });

  console.log('Seeding Edges...');
  await prisma.edge.createMany({
    data: [
    {
        "id": 139,
        "topologyId": 6,
        "sourceNodeId": 45,
        "targetNodeId": 48,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-3",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": -615.3379528974525,
                    "y": 118.47060343712882
                },
                {
                    "x": -615.3379528974525,
                    "y": 498
                },
                {
                    "x": 990.4000799433977,
                    "y": 498.2499960295306
                },
                {
                    "x": 990.4000799433977,
                    "y": -181.75000794526346
                }
            ]
        },
        "createdAt": "2026-07-13T09:41:26.185Z"
    },
    {
        "id": 138,
        "topologyId": 6,
        "sourceNodeId": 46,
        "targetNodeId": 48,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-4",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": -130.33743317298536,
                    "y": 118.1216273883117
                },
                {
                    "x": -130.33743317298536,
                    "y": 431.74996984242557
                },
                {
                    "x": 929.7999417979244,
                    "y": 432
                },
                {
                    "x": 929.7999417979244,
                    "y": -96.22500347283794
                }
            ]
        },
        "createdAt": "2026-07-13T09:41:20.136Z"
    },
    {
        "id": 145,
        "topologyId": 6,
        "sourceNodeId": 47,
        "targetNodeId": 44,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": -187.90012983577537,
                    "y": -1.0374396952646165
                },
                {
                    "x": -188,
                    "y": -372.20239254268427
                }
            ]
        },
        "createdAt": "2026-07-13T09:46:49.222Z"
    },
    {
        "id": 143,
        "topologyId": 6,
        "sourceNodeId": 47,
        "targetNodeId": 43,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": -667.9001298357754,
                    "y": -1.0374396952646165
                },
                {
                    "x": -668,
                    "y": -452.0554031811572
                }
            ]
        },
        "createdAt": "2026-07-13T09:45:22.183Z"
    },
    {
        "id": 140,
        "topologyId": 6,
        "sourceNodeId": 47,
        "targetNodeId": 45,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-13T09:43:57.020Z"
    },
    {
        "id": 147,
        "topologyId": 5,
        "sourceNodeId": 37,
        "targetNodeId": 39,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-13T09:48:53.141Z"
    },
    {
        "id": 148,
        "topologyId": 5,
        "sourceNodeId": 37,
        "targetNodeId": 36,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-13T09:48:55.898Z"
    },
    {
        "id": 149,
        "topologyId": 5,
        "sourceNodeId": 37,
        "targetNodeId": 40,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-13T09:48:58.954Z"
    },
    {
        "id": 150,
        "topologyId": 5,
        "sourceNodeId": 37,
        "targetNodeId": 38,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-13T09:49:01.839Z"
    },
    {
        "id": 48,
        "topologyId": 1,
        "sourceNodeId": 14,
        "targetNodeId": 13,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": -494.59957726580217,
                    "y": -34.27491612665181
                },
                {
                    "x": -725,
                    "y": -34
                }
            ]
        },
        "createdAt": "2026-07-08T06:20:33.117Z"
    },
    {
        "id": 124,
        "topologyId": 5,
        "sourceNodeId": 40,
        "targetNodeId": 42,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": 747.8633705906932,
                    "y": -333.0500614962933
                },
                {
                    "x": 747.8633705906932,
                    "y": 87
                },
                {
                    "x": -1261.4497229647977,
                    "y": 87
                }
            ]
        },
        "createdAt": "2026-07-13T05:57:01.007Z"
    },
    {
        "id": 104,
        "topologyId": 6,
        "sourceNodeId": 48,
        "targetNodeId": 47,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {
            "customCenterX": 890,
            "customCenterY": -50
        },
        "createdAt": "2026-07-09T06:40:28.868Z"
    },
    {
        "id": 125,
        "topologyId": 5,
        "sourceNodeId": 38,
        "targetNodeId": 42,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": 1141.1124700577097,
                    "y": -336.5999987838072
                },
                {
                    "x": 1141.1124700577097,
                    "y": 87
                },
                {
                    "x": -1261.4497229647977,
                    "y": 87
                }
            ]
        },
        "createdAt": "2026-07-13T05:57:05.377Z"
    },
    {
        "id": 152,
        "topologyId": 5,
        "sourceNodeId": 36,
        "targetNodeId": 42,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": 365.7124146189038,
                    "y": -333.6500227372005
                },
                {
                    "x": 365.7124146189038,
                    "y": 89
                },
                {
                    "x": -1261.4497229647977,
                    "y": 89
                }
            ]
        },
        "createdAt": "2026-07-13T09:50:15.097Z"
    },
    {
        "id": 129,
        "topologyId": 1,
        "sourceNodeId": 12,
        "targetNodeId": 17,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-13T09:33:18.797Z"
    },
    {
        "id": 151,
        "topologyId": 5,
        "sourceNodeId": 39,
        "targetNodeId": 42,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": -48.975127307946536,
                    "y": -339.14996611363233
                },
                {
                    "x": -48.975127307946536,
                    "y": 88
                },
                {
                    "x": -1261.4497229647977,
                    "y": 88
                }
            ]
        },
        "createdAt": "2026-07-13T09:49:45.485Z"
    },
    {
        "id": 130,
        "topologyId": 1,
        "sourceNodeId": 17,
        "targetNodeId": 14,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-13T09:33:29.251Z"
    },
    {
        "id": 36,
        "topologyId": 1,
        "sourceNodeId": 14,
        "targetNodeId": 12,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-08T06:11:32.306Z"
    },
    {
        "id": 114,
        "topologyId": 5,
        "sourceNodeId": 42,
        "targetNodeId": 37,
        "edgeType": "pipe",
        "sourcePortId": "outlet-2",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-10T05:22:37.573Z"
    },
    {
        "id": 144,
        "topologyId": 6,
        "sourceNodeId": 43,
        "targetNodeId": 48,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-2",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": 594,
                    "y": -403
                }
            ]
        },
        "createdAt": "2026-07-13T09:46:43.019Z"
    },
    {
        "id": 146,
        "topologyId": 6,
        "sourceNodeId": 44,
        "targetNodeId": 48,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {
            "customPoints": [
                {
                    "x": 278,
                    "y": -322
                },
                {
                    "x": 278,
                    "y": -96
                }
            ]
        },
        "createdAt": "2026-07-13T09:47:10.733Z"
    },
    {
        "id": 131,
        "topologyId": 1,
        "sourceNodeId": 17,
        "targetNodeId": 10,
        "edgeType": "pipe",
        "sourcePortId": "outlet-2",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-13T09:33:38.313Z"
    },
    {
        "id": 154,
        "topologyId": 12,
        "sourceNodeId": 112,
        "targetNodeId": 113,
        "edgeType": "pipe",
        "sourcePortId": null,
        "targetPortId": null,
        "status": "Active",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.744Z"
    },
    {
        "id": 43,
        "topologyId": 1,
        "sourceNodeId": 10,
        "targetNodeId": 9,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-08T06:15:46.411Z"
    },
    {
        "id": 155,
        "topologyId": 12,
        "sourceNodeId": 113,
        "targetNodeId": 114,
        "edgeType": "pipe",
        "sourcePortId": null,
        "targetPortId": null,
        "status": "Active",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.750Z"
    },
    {
        "id": 156,
        "topologyId": 12,
        "sourceNodeId": 113,
        "targetNodeId": 115,
        "edgeType": "pipe",
        "sourcePortId": null,
        "targetPortId": null,
        "status": "Active",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.751Z"
    },
    {
        "id": 157,
        "topologyId": 12,
        "sourceNodeId": 113,
        "targetNodeId": 116,
        "edgeType": "pipe",
        "sourcePortId": null,
        "targetPortId": null,
        "status": "Active",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.752Z"
    },
    {
        "id": 158,
        "topologyId": 12,
        "sourceNodeId": 113,
        "targetNodeId": 117,
        "edgeType": "pipe",
        "sourcePortId": null,
        "targetPortId": null,
        "status": "Active",
        "attributes": {},
        "createdAt": "2026-07-21T10:20:27.753Z"
    },
    {
        "id": 53,
        "topologyId": 1,
        "sourceNodeId": 10,
        "targetNodeId": 5,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-08T06:23:26.741Z"
    },
    {
        "id": 56,
        "topologyId": 1,
        "sourceNodeId": 9,
        "targetNodeId": 17,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-4",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-08T06:40:46.790Z"
    },
    {
        "id": 57,
        "topologyId": 1,
        "sourceNodeId": 13,
        "targetNodeId": 17,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-2",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-08T06:40:54.283Z"
    },
    {
        "id": 58,
        "topologyId": 1,
        "sourceNodeId": 5,
        "targetNodeId": 17,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-3",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-08T06:40:58.861Z"
    },
    {
        "id": 135,
        "topologyId": 6,
        "sourceNodeId": 47,
        "targetNodeId": 46,
        "edgeType": "pipe",
        "sourcePortId": "outlet-1",
        "targetPortId": "inlet-1",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-07-13T09:39:15.423Z"
    },
    {
        "id": 189,
        "topologyId": 7,
        "sourceNodeId": 144,
        "targetNodeId": 138,
        "edgeType": "cable",
        "sourcePortId": "control-out-top",
        "targetPortId": "power-in-pivot-left",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-08-17T14:51:21.681Z"
    },
    {
        "id": 190,
        "topologyId": 7,
        "sourceNodeId": 144,
        "targetNodeId": 145,
        "edgeType": "cable",
        "sourcePortId": "control-out-bottom",
        "targetPortId": "solenoid-port-in-bottom",
        "status": "normal",
        "attributes": {},
        "createdAt": "2026-08-17T14:51:26.491Z"
    }
]
  });

  console.log('Seeding Sensors...');
  await prisma.sensor.createMany({
    data: [
    {
        "id": 167,
        "nodeId": 44,
        "sensorName": "Water Tank-454 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.965Z",
        "createdAt": "2026-07-09T05:14:33.089Z"
    },
    {
        "id": 173,
        "nodeId": 46,
        "sensorName": "Water Tank-336 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Critical",
        "lastSeen": "2026-07-16T10:02:36.968Z",
        "createdAt": "2026-07-09T05:14:36.603Z"
    },
    {
        "id": 168,
        "nodeId": 44,
        "sensorName": "Water Tank-454 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.965Z",
        "createdAt": "2026-07-09T05:14:33.090Z"
    },
    {
        "id": 177,
        "nodeId": 47,
        "sensorName": "Centrifugal Pump-744 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-07-09T05:14:39.118Z",
        "createdAt": "2026-07-09T05:14:39.118Z"
    },
    {
        "id": 178,
        "nodeId": 47,
        "sensorName": "Centrifugal Pump-744 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-07-09T05:14:39.119Z",
        "createdAt": "2026-07-09T05:14:39.119Z"
    },
    {
        "id": 257,
        "nodeId": 67,
        "sensorName": "temp sensor -957 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:47.442Z",
        "createdAt": "2026-07-19T15:04:47.442Z"
    },
    {
        "id": 258,
        "nodeId": 67,
        "sensorName": "temp sensor -957 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:47.444Z",
        "createdAt": "2026-07-19T15:04:47.444Z"
    },
    {
        "id": 259,
        "nodeId": 67,
        "sensorName": "temp sensor -957 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:47.445Z",
        "createdAt": "2026-07-19T15:04:47.445Z"
    },
    {
        "id": 29,
        "nodeId": 10,
        "sensorName": "Centrifugal Pump-759 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-07-04T15:36:50.028Z",
        "createdAt": "2026-07-04T15:36:50.028Z"
    },
    {
        "id": 30,
        "nodeId": 10,
        "sensorName": "Centrifugal Pump-759 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-07-04T15:36:50.030Z",
        "createdAt": "2026-07-04T15:36:50.030Z"
    },
    {
        "id": 31,
        "nodeId": 10,
        "sensorName": "Centrifugal Pump-759 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-07-04T15:36:50.032Z",
        "createdAt": "2026-07-04T15:36:50.032Z"
    },
    {
        "id": 32,
        "nodeId": 10,
        "sensorName": "Centrifugal Pump-759 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-07-04T15:36:50.033Z",
        "createdAt": "2026-07-04T15:36:50.033Z"
    },
    {
        "id": 260,
        "nodeId": 67,
        "sensorName": "temp sensor -957 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:47.446Z",
        "createdAt": "2026-07-19T15:04:47.446Z"
    },
    {
        "id": 45,
        "nodeId": 14,
        "sensorName": "Centrifugal Pump-598 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-07-08T04:53:04.298Z",
        "createdAt": "2026-07-08T04:53:04.298Z"
    },
    {
        "id": 46,
        "nodeId": 14,
        "sensorName": "Centrifugal Pump-598 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-07-08T04:53:04.300Z",
        "createdAt": "2026-07-08T04:53:04.300Z"
    },
    {
        "id": 47,
        "nodeId": 14,
        "sensorName": "Centrifugal Pump-598 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-07-08T04:53:04.301Z",
        "createdAt": "2026-07-08T04:53:04.301Z"
    },
    {
        "id": 48,
        "nodeId": 14,
        "sensorName": "Centrifugal Pump-598 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-07-08T04:53:04.303Z",
        "createdAt": "2026-07-08T04:53:04.303Z"
    },
    {
        "id": 245,
        "nodeId": 64,
        "sensorName": "Ultrasonic-704 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:35.905Z",
        "createdAt": "2026-07-19T15:04:35.905Z"
    },
    {
        "id": 174,
        "nodeId": 46,
        "sensorName": "Water Tank-336 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.968Z",
        "createdAt": "2026-07-09T05:14:36.604Z"
    },
    {
        "id": 175,
        "nodeId": 46,
        "sensorName": "Water Tank-336 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.968Z",
        "createdAt": "2026-07-09T05:14:36.605Z"
    },
    {
        "id": 176,
        "nodeId": 46,
        "sensorName": "Water Tank-336 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.968Z",
        "createdAt": "2026-07-09T05:14:36.606Z"
    },
    {
        "id": 169,
        "nodeId": 45,
        "sensorName": "Water Tank-314 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Critical",
        "lastSeen": "2026-07-16T10:02:36.995Z",
        "createdAt": "2026-07-09T05:14:35.278Z"
    },
    {
        "id": 170,
        "nodeId": 45,
        "sensorName": "Water Tank-314 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.995Z",
        "createdAt": "2026-07-09T05:14:35.280Z"
    },
    {
        "id": 171,
        "nodeId": 45,
        "sensorName": "Water Tank-314 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.995Z",
        "createdAt": "2026-07-09T05:14:35.281Z"
    },
    {
        "id": 172,
        "nodeId": 45,
        "sensorName": "Water Tank-314 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.995Z",
        "createdAt": "2026-07-09T05:14:35.282Z"
    },
    {
        "id": 179,
        "nodeId": 47,
        "sensorName": "Centrifugal Pump-744 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-07-09T05:14:39.120Z",
        "createdAt": "2026-07-09T05:14:39.120Z"
    },
    {
        "id": 180,
        "nodeId": 47,
        "sensorName": "Centrifugal Pump-744 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-07-09T05:14:39.121Z",
        "createdAt": "2026-07-09T05:14:39.121Z"
    },
    {
        "id": 246,
        "nodeId": 64,
        "sensorName": "Ultrasonic-704 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:35.910Z",
        "createdAt": "2026-07-19T15:04:35.910Z"
    },
    {
        "id": 137,
        "nodeId": 37,
        "sensorName": "Centrifugal Pump-483 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-07-09T05:08:52.178Z",
        "createdAt": "2026-07-09T05:08:52.178Z"
    },
    {
        "id": 138,
        "nodeId": 37,
        "sensorName": "Centrifugal Pump-483 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-07-09T05:08:52.179Z",
        "createdAt": "2026-07-09T05:08:52.179Z"
    },
    {
        "id": 139,
        "nodeId": 37,
        "sensorName": "Centrifugal Pump-483 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-07-09T05:08:52.180Z",
        "createdAt": "2026-07-09T05:08:52.180Z"
    },
    {
        "id": 140,
        "nodeId": 37,
        "sensorName": "Centrifugal Pump-483 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-07-09T05:08:52.181Z",
        "createdAt": "2026-07-09T05:08:52.181Z"
    },
    {
        "id": 247,
        "nodeId": 64,
        "sensorName": "Ultrasonic-704 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:35.911Z",
        "createdAt": "2026-07-19T15:04:35.911Z"
    },
    {
        "id": 248,
        "nodeId": 64,
        "sensorName": "Ultrasonic-704 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:35.916Z",
        "createdAt": "2026-07-19T15:04:35.916Z"
    },
    {
        "id": 181,
        "nodeId": 48,
        "sensorName": "Central Tank-133 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Critical",
        "lastSeen": "2026-07-16T10:02:36.933Z",
        "createdAt": "2026-07-09T05:14:40.336Z"
    },
    {
        "id": 182,
        "nodeId": 48,
        "sensorName": "Central Tank-133 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.933Z",
        "createdAt": "2026-07-09T05:14:40.337Z"
    },
    {
        "id": 183,
        "nodeId": 48,
        "sensorName": "Central Tank-133 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.933Z",
        "createdAt": "2026-07-09T05:14:40.338Z"
    },
    {
        "id": 161,
        "nodeId": 43,
        "sensorName": "Water Tank-596 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Warning",
        "lastSeen": "2026-07-16T10:02:36.937Z",
        "createdAt": "2026-07-09T05:14:31.543Z"
    },
    {
        "id": 184,
        "nodeId": 48,
        "sensorName": "Central Tank-133 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.933Z",
        "createdAt": "2026-07-09T05:14:40.339Z"
    },
    {
        "id": 162,
        "nodeId": 43,
        "sensorName": "Water Tank-596 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.937Z",
        "createdAt": "2026-07-09T05:14:31.544Z"
    },
    {
        "id": 163,
        "nodeId": 43,
        "sensorName": "Water Tank-596 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.937Z",
        "createdAt": "2026-07-09T05:14:31.545Z"
    },
    {
        "id": 164,
        "nodeId": 43,
        "sensorName": "Water Tank-596 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.937Z",
        "createdAt": "2026-07-09T05:14:31.547Z"
    },
    {
        "id": 165,
        "nodeId": 44,
        "sensorName": "Water Tank-454 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Warning",
        "lastSeen": "2026-07-16T10:02:36.965Z",
        "createdAt": "2026-07-09T05:14:33.087Z"
    },
    {
        "id": 166,
        "nodeId": 44,
        "sensorName": "Water Tank-454 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-16T10:02:36.965Z",
        "createdAt": "2026-07-09T05:14:33.088Z"
    },
    {
        "id": 305,
        "nodeId": 113,
        "sensorName": "pH Sensor",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.707Z",
        "createdAt": "2026-07-21T10:20:27.707Z"
    },
    {
        "id": 306,
        "nodeId": 113,
        "sensorName": "TDS Sensor",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.710Z",
        "createdAt": "2026-07-21T10:20:27.710Z"
    },
    {
        "id": 307,
        "nodeId": 113,
        "sensorName": "Turbidity Sensor",
        "sensorType": "turbidity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.711Z",
        "createdAt": "2026-07-21T10:20:27.711Z"
    },
    {
        "id": 308,
        "nodeId": 113,
        "sensorName": "Water Temperature Sensor",
        "sensorType": "water_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.712Z",
        "createdAt": "2026-07-21T10:20:27.712Z"
    },
    {
        "id": 309,
        "nodeId": 113,
        "sensorName": "Air Temperature Sensor",
        "sensorType": "air_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.713Z",
        "createdAt": "2026-07-21T10:20:27.713Z"
    },
    {
        "id": 310,
        "nodeId": 113,
        "sensorName": "Light Intensity Sensor",
        "sensorType": "light_intensity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.714Z",
        "createdAt": "2026-07-21T10:20:27.714Z"
    },
    {
        "id": 311,
        "nodeId": 114,
        "sensorName": "pH Sensor",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.716Z",
        "createdAt": "2026-07-21T10:20:27.716Z"
    },
    {
        "id": 312,
        "nodeId": 114,
        "sensorName": "TDS Sensor",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.718Z",
        "createdAt": "2026-07-21T10:20:27.718Z"
    },
    {
        "id": 313,
        "nodeId": 114,
        "sensorName": "Turbidity Sensor",
        "sensorType": "turbidity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.718Z",
        "createdAt": "2026-07-21T10:20:27.718Z"
    },
    {
        "id": 314,
        "nodeId": 114,
        "sensorName": "Water Temperature Sensor",
        "sensorType": "water_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.719Z",
        "createdAt": "2026-07-21T10:20:27.719Z"
    },
    {
        "id": 269,
        "nodeId": 76,
        "sensorName": "Ultrasonic-TANK-2",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.756Z",
        "createdAt": "2026-07-20T05:07:40.756Z"
    },
    {
        "id": 270,
        "nodeId": 77,
        "sensorName": "pH sensor-TANK-2",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.758Z",
        "createdAt": "2026-07-20T05:07:40.758Z"
    },
    {
        "id": 271,
        "nodeId": 78,
        "sensorName": "TDS sensor-TANK-2",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.760Z",
        "createdAt": "2026-07-20T05:07:40.760Z"
    },
    {
        "id": 272,
        "nodeId": 79,
        "sensorName": "temp sensor-TANK-2",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.762Z",
        "createdAt": "2026-07-20T05:07:40.762Z"
    },
    {
        "id": 273,
        "nodeId": 80,
        "sensorName": "Ultrasonic-TANK-4",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.765Z",
        "createdAt": "2026-07-20T05:07:40.765Z"
    },
    {
        "id": 274,
        "nodeId": 81,
        "sensorName": "pH sensor-TANK-4",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.767Z",
        "createdAt": "2026-07-20T05:07:40.767Z"
    },
    {
        "id": 275,
        "nodeId": 82,
        "sensorName": "TDS sensor-TANK-4",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.769Z",
        "createdAt": "2026-07-20T05:07:40.769Z"
    },
    {
        "id": 276,
        "nodeId": 83,
        "sensorName": "temp sensor-TANK-4",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.771Z",
        "createdAt": "2026-07-20T05:07:40.771Z"
    },
    {
        "id": 277,
        "nodeId": 84,
        "sensorName": "Ultrasonic-TANK-1",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.774Z",
        "createdAt": "2026-07-20T05:07:40.774Z"
    },
    {
        "id": 28,
        "nodeId": 9,
        "sensorName": "Water Tank-151 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.050Z",
        "createdAt": "2026-07-04T15:36:25.627Z"
    },
    {
        "id": 278,
        "nodeId": 85,
        "sensorName": "pH sensor-TANK-1",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.776Z",
        "createdAt": "2026-07-20T05:07:40.776Z"
    },
    {
        "id": 279,
        "nodeId": 86,
        "sensorName": "TDS sensor-TANK-1",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.778Z",
        "createdAt": "2026-07-20T05:07:40.778Z"
    },
    {
        "id": 280,
        "nodeId": 87,
        "sensorName": "temp sensor-TANK-1",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.780Z",
        "createdAt": "2026-07-20T05:07:40.780Z"
    },
    {
        "id": 281,
        "nodeId": 88,
        "sensorName": "Ultrasonic-Tank-4",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.783Z",
        "createdAt": "2026-07-20T05:07:40.783Z"
    },
    {
        "id": 282,
        "nodeId": 89,
        "sensorName": "pH sensor-Tank-4",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.785Z",
        "createdAt": "2026-07-20T05:07:40.785Z"
    },
    {
        "id": 283,
        "nodeId": 90,
        "sensorName": "TDS sensor-Tank-4",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.787Z",
        "createdAt": "2026-07-20T05:07:40.787Z"
    },
    {
        "id": 284,
        "nodeId": 91,
        "sensorName": "temp sensor-Tank-4",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.789Z",
        "createdAt": "2026-07-20T05:07:40.789Z"
    },
    {
        "id": 285,
        "nodeId": 92,
        "sensorName": "Ultrasonic-Tank-2",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.791Z",
        "createdAt": "2026-07-20T05:07:40.791Z"
    },
    {
        "id": 253,
        "nodeId": 66,
        "sensorName": "TDS sensor-819 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:45.363Z",
        "createdAt": "2026-07-19T15:04:45.363Z"
    },
    {
        "id": 254,
        "nodeId": 66,
        "sensorName": "TDS sensor-819 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:45.364Z",
        "createdAt": "2026-07-19T15:04:45.364Z"
    },
    {
        "id": 255,
        "nodeId": 66,
        "sensorName": "TDS sensor-819 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:45.366Z",
        "createdAt": "2026-07-19T15:04:45.366Z"
    },
    {
        "id": 256,
        "nodeId": 66,
        "sensorName": "TDS sensor-819 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:45.366Z",
        "createdAt": "2026-07-19T15:04:45.366Z"
    },
    {
        "id": 286,
        "nodeId": 93,
        "sensorName": "pH sensor-Tank-2",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.793Z",
        "createdAt": "2026-07-20T05:07:40.793Z"
    },
    {
        "id": 287,
        "nodeId": 94,
        "sensorName": "TDS sensor-Tank-2",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.795Z",
        "createdAt": "2026-07-20T05:07:40.795Z"
    },
    {
        "id": 288,
        "nodeId": 95,
        "sensorName": "temp sensor-Tank-2",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.798Z",
        "createdAt": "2026-07-20T05:07:40.798Z"
    },
    {
        "id": 289,
        "nodeId": 96,
        "sensorName": "Ultrasonic-TANK-1",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.800Z",
        "createdAt": "2026-07-20T05:07:40.800Z"
    },
    {
        "id": 290,
        "nodeId": 97,
        "sensorName": "pH sensor-TANK-1",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.802Z",
        "createdAt": "2026-07-20T05:07:40.802Z"
    },
    {
        "id": 134,
        "nodeId": 36,
        "sensorName": "Water Tank-543 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.762Z",
        "createdAt": "2026-07-09T05:08:50.035Z"
    },
    {
        "id": 158,
        "nodeId": 42,
        "sensorName": "Central Tank-629 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.716Z",
        "createdAt": "2026-07-09T05:13:09.534Z"
    },
    {
        "id": 159,
        "nodeId": 42,
        "sensorName": "Central Tank-629 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.716Z",
        "createdAt": "2026-07-09T05:13:09.535Z"
    },
    {
        "id": 160,
        "nodeId": 42,
        "sensorName": "Central Tank-629 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.716Z",
        "createdAt": "2026-07-09T05:13:09.536Z"
    },
    {
        "id": 150,
        "nodeId": 40,
        "sensorName": "Water Tank-593 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.739Z",
        "createdAt": "2026-07-09T05:09:02.031Z"
    },
    {
        "id": 146,
        "nodeId": 39,
        "sensorName": "Water Tank-226 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.744Z",
        "createdAt": "2026-07-09T05:09:00.797Z"
    },
    {
        "id": 147,
        "nodeId": 39,
        "sensorName": "Water Tank-226 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.744Z",
        "createdAt": "2026-07-09T05:09:00.798Z"
    },
    {
        "id": 135,
        "nodeId": 36,
        "sensorName": "Water Tank-543 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.762Z",
        "createdAt": "2026-07-09T05:08:50.036Z"
    },
    {
        "id": 142,
        "nodeId": 38,
        "sensorName": "Water Tank-276 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.778Z",
        "createdAt": "2026-07-09T05:08:58.464Z"
    },
    {
        "id": 136,
        "nodeId": 36,
        "sensorName": "Water Tank-543 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.762Z",
        "createdAt": "2026-07-09T05:08:50.037Z"
    },
    {
        "id": 143,
        "nodeId": 38,
        "sensorName": "Water Tank-276 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.778Z",
        "createdAt": "2026-07-09T05:08:58.465Z"
    },
    {
        "id": 151,
        "nodeId": 40,
        "sensorName": "Water Tank-593 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.739Z",
        "createdAt": "2026-07-09T05:09:02.032Z"
    },
    {
        "id": 144,
        "nodeId": 38,
        "sensorName": "Water Tank-276 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.778Z",
        "createdAt": "2026-07-09T05:08:58.466Z"
    },
    {
        "id": 152,
        "nodeId": 40,
        "sensorName": "Water Tank-593 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.739Z",
        "createdAt": "2026-07-09T05:09:02.033Z"
    },
    {
        "id": 148,
        "nodeId": 39,
        "sensorName": "Water Tank-226 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-20T06:46:12.744Z",
        "createdAt": "2026-07-09T05:09:00.799Z"
    },
    {
        "id": 133,
        "nodeId": 36,
        "sensorName": "Water Tank-543 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Critical",
        "lastSeen": "2026-07-20T06:46:12.762Z",
        "createdAt": "2026-07-09T05:08:50.034Z"
    },
    {
        "id": 291,
        "nodeId": 98,
        "sensorName": "TDS sensor-TANK-1",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.804Z",
        "createdAt": "2026-07-20T05:07:40.804Z"
    },
    {
        "id": 292,
        "nodeId": 99,
        "sensorName": "temp sensor-TANK-1",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.806Z",
        "createdAt": "2026-07-20T05:07:40.806Z"
    },
    {
        "id": 293,
        "nodeId": 100,
        "sensorName": "Ultrasonic-TANK-3",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.808Z",
        "createdAt": "2026-07-20T05:07:40.808Z"
    },
    {
        "id": 294,
        "nodeId": 101,
        "sensorName": "pH sensor-TANK-3",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.811Z",
        "createdAt": "2026-07-20T05:07:40.811Z"
    },
    {
        "id": 295,
        "nodeId": 102,
        "sensorName": "TDS sensor-TANK-3",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.812Z",
        "createdAt": "2026-07-20T05:07:40.812Z"
    },
    {
        "id": 296,
        "nodeId": 103,
        "sensorName": "temp sensor-TANK-3",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.814Z",
        "createdAt": "2026-07-20T05:07:40.814Z"
    },
    {
        "id": 297,
        "nodeId": 104,
        "sensorName": "Ultrasonic-Tank-3",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.816Z",
        "createdAt": "2026-07-20T05:07:40.816Z"
    },
    {
        "id": 298,
        "nodeId": 105,
        "sensorName": "pH sensor-Tank-3",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.818Z",
        "createdAt": "2026-07-20T05:07:40.818Z"
    },
    {
        "id": 299,
        "nodeId": 106,
        "sensorName": "TDS sensor-Tank-3",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.820Z",
        "createdAt": "2026-07-20T05:07:40.820Z"
    },
    {
        "id": 300,
        "nodeId": 107,
        "sensorName": "temp sensor-Tank-3",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.822Z",
        "createdAt": "2026-07-20T05:07:40.822Z"
    },
    {
        "id": 301,
        "nodeId": 108,
        "sensorName": "Ultrasonic-TANK-4",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.824Z",
        "createdAt": "2026-07-20T05:07:40.824Z"
    },
    {
        "id": 302,
        "nodeId": 109,
        "sensorName": "pH sensor-TANK-4",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.826Z",
        "createdAt": "2026-07-20T05:07:40.826Z"
    },
    {
        "id": 303,
        "nodeId": 110,
        "sensorName": "TDS sensor-TANK-4",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.828Z",
        "createdAt": "2026-07-20T05:07:40.828Z"
    },
    {
        "id": 315,
        "nodeId": 114,
        "sensorName": "Air Temperature Sensor",
        "sensorType": "air_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.720Z",
        "createdAt": "2026-07-21T10:20:27.720Z"
    },
    {
        "id": 157,
        "nodeId": 42,
        "sensorName": "Central Tank-629 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Warning",
        "lastSeen": "2026-07-20T06:46:12.716Z",
        "createdAt": "2026-07-09T05:13:09.532Z"
    },
    {
        "id": 316,
        "nodeId": 114,
        "sensorName": "Light Intensity Sensor",
        "sensorType": "light_intensity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.721Z",
        "createdAt": "2026-07-21T10:20:27.721Z"
    },
    {
        "id": 261,
        "nodeId": 68,
        "sensorName": "Ultrasonic-TANK-3",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.736Z",
        "createdAt": "2026-07-20T05:07:40.736Z"
    },
    {
        "id": 249,
        "nodeId": 65,
        "sensorName": "pH sensor-535 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:39.750Z",
        "createdAt": "2026-07-19T15:04:39.750Z"
    },
    {
        "id": 250,
        "nodeId": 65,
        "sensorName": "pH sensor-535 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:39.751Z",
        "createdAt": "2026-07-19T15:04:39.751Z"
    },
    {
        "id": 251,
        "nodeId": 65,
        "sensorName": "pH sensor-535 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:39.752Z",
        "createdAt": "2026-07-19T15:04:39.752Z"
    },
    {
        "id": 252,
        "nodeId": 65,
        "sensorName": "pH sensor-535 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-07-19T15:04:39.753Z",
        "createdAt": "2026-07-19T15:04:39.753Z"
    },
    {
        "id": 262,
        "nodeId": 69,
        "sensorName": "pH sensor-TANK-3",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.741Z",
        "createdAt": "2026-07-20T05:07:40.741Z"
    },
    {
        "id": 263,
        "nodeId": 70,
        "sensorName": "TDS sensor-TANK-3",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.743Z",
        "createdAt": "2026-07-20T05:07:40.743Z"
    },
    {
        "id": 264,
        "nodeId": 71,
        "sensorName": "temp sensor-TANK-3",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.745Z",
        "createdAt": "2026-07-20T05:07:40.745Z"
    },
    {
        "id": 265,
        "nodeId": 72,
        "sensorName": "Ultrasonic-TANK-2",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.748Z",
        "createdAt": "2026-07-20T05:07:40.748Z"
    },
    {
        "id": 266,
        "nodeId": 73,
        "sensorName": "pH sensor-TANK-2",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.751Z",
        "createdAt": "2026-07-20T05:07:40.751Z"
    },
    {
        "id": 267,
        "nodeId": 74,
        "sensorName": "TDS sensor-TANK-2",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.752Z",
        "createdAt": "2026-07-20T05:07:40.752Z"
    },
    {
        "id": 268,
        "nodeId": 75,
        "sensorName": "temp sensor-TANK-2",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.754Z",
        "createdAt": "2026-07-20T05:07:40.754Z"
    },
    {
        "id": 304,
        "nodeId": 111,
        "sensorName": "temp sensor-TANK-4",
        "sensorType": "temperature",
        "status": "Online",
        "lastSeen": "2026-07-20T05:07:40.830Z",
        "createdAt": "2026-07-20T05:07:40.830Z"
    },
    {
        "id": 149,
        "nodeId": 40,
        "sensorName": "Water Tank-593 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Critical",
        "lastSeen": "2026-07-20T06:46:12.739Z",
        "createdAt": "2026-07-09T05:09:02.030Z"
    },
    {
        "id": 145,
        "nodeId": 39,
        "sensorName": "Water Tank-226 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Warning",
        "lastSeen": "2026-07-20T06:46:12.744Z",
        "createdAt": "2026-07-09T05:09:00.795Z"
    },
    {
        "id": 141,
        "nodeId": 38,
        "sensorName": "Water Tank-276 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Critical",
        "lastSeen": "2026-07-20T06:46:12.778Z",
        "createdAt": "2026-07-09T05:08:58.463Z"
    },
    {
        "id": 317,
        "nodeId": 115,
        "sensorName": "pH Sensor",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.724Z",
        "createdAt": "2026-07-21T10:20:27.724Z"
    },
    {
        "id": 318,
        "nodeId": 115,
        "sensorName": "TDS Sensor",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.725Z",
        "createdAt": "2026-07-21T10:20:27.725Z"
    },
    {
        "id": 319,
        "nodeId": 115,
        "sensorName": "Turbidity Sensor",
        "sensorType": "turbidity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.726Z",
        "createdAt": "2026-07-21T10:20:27.726Z"
    },
    {
        "id": 320,
        "nodeId": 115,
        "sensorName": "Water Temperature Sensor",
        "sensorType": "water_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.727Z",
        "createdAt": "2026-07-21T10:20:27.727Z"
    },
    {
        "id": 321,
        "nodeId": 115,
        "sensorName": "Air Temperature Sensor",
        "sensorType": "air_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.727Z",
        "createdAt": "2026-07-21T10:20:27.727Z"
    },
    {
        "id": 322,
        "nodeId": 115,
        "sensorName": "Light Intensity Sensor",
        "sensorType": "light_intensity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.728Z",
        "createdAt": "2026-07-21T10:20:27.728Z"
    },
    {
        "id": 323,
        "nodeId": 116,
        "sensorName": "pH Sensor",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.730Z",
        "createdAt": "2026-07-21T10:20:27.730Z"
    },
    {
        "id": 324,
        "nodeId": 116,
        "sensorName": "TDS Sensor",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.731Z",
        "createdAt": "2026-07-21T10:20:27.731Z"
    },
    {
        "id": 325,
        "nodeId": 116,
        "sensorName": "Turbidity Sensor",
        "sensorType": "turbidity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.732Z",
        "createdAt": "2026-07-21T10:20:27.732Z"
    },
    {
        "id": 326,
        "nodeId": 116,
        "sensorName": "Water Temperature Sensor",
        "sensorType": "water_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.734Z",
        "createdAt": "2026-07-21T10:20:27.734Z"
    },
    {
        "id": 327,
        "nodeId": 116,
        "sensorName": "Air Temperature Sensor",
        "sensorType": "air_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.735Z",
        "createdAt": "2026-07-21T10:20:27.735Z"
    },
    {
        "id": 328,
        "nodeId": 116,
        "sensorName": "Light Intensity Sensor",
        "sensorType": "light_intensity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.736Z",
        "createdAt": "2026-07-21T10:20:27.736Z"
    },
    {
        "id": 329,
        "nodeId": 117,
        "sensorName": "pH Sensor",
        "sensorType": "ph",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.737Z",
        "createdAt": "2026-07-21T10:20:27.737Z"
    },
    {
        "id": 330,
        "nodeId": 117,
        "sensorName": "TDS Sensor",
        "sensorType": "tds",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.738Z",
        "createdAt": "2026-07-21T10:20:27.738Z"
    },
    {
        "id": 331,
        "nodeId": 117,
        "sensorName": "Turbidity Sensor",
        "sensorType": "turbidity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.739Z",
        "createdAt": "2026-07-21T10:20:27.739Z"
    },
    {
        "id": 332,
        "nodeId": 117,
        "sensorName": "Water Temperature Sensor",
        "sensorType": "water_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.740Z",
        "createdAt": "2026-07-21T10:20:27.740Z"
    },
    {
        "id": 333,
        "nodeId": 117,
        "sensorName": "Air Temperature Sensor",
        "sensorType": "air_temp",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.741Z",
        "createdAt": "2026-07-21T10:20:27.741Z"
    },
    {
        "id": 334,
        "nodeId": 117,
        "sensorName": "Light Intensity Sensor",
        "sensorType": "light_intensity",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:27.742Z",
        "createdAt": "2026-07-21T10:20:27.742Z"
    },
    {
        "id": 335,
        "nodeId": 112,
        "sensorName": "Energy Consumption Sensor",
        "sensorType": "energy",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:40.423Z",
        "createdAt": "2026-07-21T10:20:40.423Z"
    },
    {
        "id": 336,
        "nodeId": 112,
        "sensorName": "Pump Runtime Sensor",
        "sensorType": "pump_runtime",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:40.457Z",
        "createdAt": "2026-07-21T10:20:40.457Z"
    },
    {
        "id": 337,
        "nodeId": 112,
        "sensorName": "Flow Rate Sensor",
        "sensorType": "water_level",
        "status": "Online",
        "lastSeen": "2026-07-21T10:20:40.474Z",
        "createdAt": "2026-07-21T10:20:40.474Z"
    },
    {
        "id": 57,
        "nodeId": 17,
        "sensorName": "Central Tank-734 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.046Z",
        "createdAt": "2026-07-08T05:59:34.992Z"
    },
    {
        "id": 58,
        "nodeId": 17,
        "sensorName": "Central Tank-734 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.046Z",
        "createdAt": "2026-07-08T05:59:34.993Z"
    },
    {
        "id": 59,
        "nodeId": 17,
        "sensorName": "Central Tank-734 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.046Z",
        "createdAt": "2026-07-08T05:59:34.995Z"
    },
    {
        "id": 60,
        "nodeId": 17,
        "sensorName": "Central Tank-734 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.046Z",
        "createdAt": "2026-07-08T05:59:34.996Z"
    },
    {
        "id": 25,
        "nodeId": 9,
        "sensorName": "Water Tank-151 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Critical",
        "lastSeen": "2026-07-23T05:28:59.050Z",
        "createdAt": "2026-07-04T15:36:25.623Z"
    },
    {
        "id": 26,
        "nodeId": 9,
        "sensorName": "Water Tank-151 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.050Z",
        "createdAt": "2026-07-04T15:36:25.624Z"
    },
    {
        "id": 27,
        "nodeId": 9,
        "sensorName": "Water Tank-151 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.050Z",
        "createdAt": "2026-07-04T15:36:25.626Z"
    },
    {
        "id": 37,
        "nodeId": 12,
        "sensorName": "Water Tank-574 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Critical",
        "lastSeen": "2026-07-23T05:28:59.056Z",
        "createdAt": "2026-07-08T04:52:35.465Z"
    },
    {
        "id": 38,
        "nodeId": 12,
        "sensorName": "Water Tank-574 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.056Z",
        "createdAt": "2026-07-08T04:52:35.467Z"
    },
    {
        "id": 39,
        "nodeId": 12,
        "sensorName": "Water Tank-574 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.056Z",
        "createdAt": "2026-07-08T04:52:35.468Z"
    },
    {
        "id": 40,
        "nodeId": 12,
        "sensorName": "Water Tank-574 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.056Z",
        "createdAt": "2026-07-08T04:52:35.469Z"
    },
    {
        "id": 17,
        "nodeId": 5,
        "sensorName": "Tank 4 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Critical",
        "lastSeen": "2026-07-23T05:28:59.062Z",
        "createdAt": "2026-07-04T21:01:21.251Z"
    },
    {
        "id": 18,
        "nodeId": 5,
        "sensorName": "Tank 4 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.062Z",
        "createdAt": "2026-07-04T21:01:21.251Z"
    },
    {
        "id": 19,
        "nodeId": 5,
        "sensorName": "Tank 4 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.062Z",
        "createdAt": "2026-07-04T21:01:21.251Z"
    },
    {
        "id": 20,
        "nodeId": 5,
        "sensorName": "Tank 4 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.062Z",
        "createdAt": "2026-07-04T21:01:21.251Z"
    },
    {
        "id": 41,
        "nodeId": 13,
        "sensorName": "Water Tank-240 WATER LEVEL",
        "sensorType": "water_level",
        "status": "Warning",
        "lastSeen": "2026-07-23T05:28:59.078Z",
        "createdAt": "2026-07-08T04:52:37.115Z"
    },
    {
        "id": 42,
        "nodeId": 13,
        "sensorName": "Water Tank-240 PH",
        "sensorType": "ph",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.078Z",
        "createdAt": "2026-07-08T04:52:37.117Z"
    },
    {
        "id": 43,
        "nodeId": 13,
        "sensorName": "Water Tank-240 TDS",
        "sensorType": "tds",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.078Z",
        "createdAt": "2026-07-08T04:52:37.118Z"
    },
    {
        "id": 44,
        "nodeId": 13,
        "sensorName": "Water Tank-240 TEMPERATURE",
        "sensorType": "temperature",
        "status": "Healthy",
        "lastSeen": "2026-07-23T05:28:59.078Z",
        "createdAt": "2026-07-08T04:52:37.120Z"
    },
    {
        "id": 411,
        "nodeId": 138,
        "sensorName": "Solar Output Power",
        "sensorType": "power",
        "status": "Online",
        "lastSeen": "2026-08-17T14:25:13.651Z",
        "createdAt": "2026-08-17T14:25:13.651Z"
    },
    {
        "id": 412,
        "nodeId": 138,
        "sensorName": "Solar Irradiance",
        "sensorType": "irradiance",
        "status": "Online",
        "lastSeen": "2026-08-17T14:25:13.654Z",
        "createdAt": "2026-08-17T14:25:13.654Z"
    },
    {
        "id": 416,
        "nodeId": 144,
        "sensorName": "Electronic Control Box-549 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-08-17T14:43:54.697Z",
        "createdAt": "2026-08-17T14:43:54.697Z"
    },
    {
        "id": 417,
        "nodeId": 144,
        "sensorName": "Electronic Control Box-549 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-08-17T14:43:54.699Z",
        "createdAt": "2026-08-17T14:43:54.699Z"
    },
    {
        "id": 418,
        "nodeId": 144,
        "sensorName": "Electronic Control Box-549 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-08-17T14:43:54.701Z",
        "createdAt": "2026-08-17T14:43:54.701Z"
    },
    {
        "id": 419,
        "nodeId": 144,
        "sensorName": "Electronic Control Box-549 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-08-17T14:43:54.702Z",
        "createdAt": "2026-08-17T14:43:54.702Z"
    },
    {
        "id": 420,
        "nodeId": 145,
        "sensorName": "Solenoid Valve & Meter-636 WATER LEVEL",
        "sensorType": "water_level",
        "status": "online",
        "lastSeen": "2026-08-17T14:43:58.286Z",
        "createdAt": "2026-08-17T14:43:58.286Z"
    },
    {
        "id": 421,
        "nodeId": 145,
        "sensorName": "Solenoid Valve & Meter-636 PH",
        "sensorType": "ph",
        "status": "online",
        "lastSeen": "2026-08-17T14:43:58.287Z",
        "createdAt": "2026-08-17T14:43:58.287Z"
    },
    {
        "id": 422,
        "nodeId": 145,
        "sensorName": "Solenoid Valve & Meter-636 TDS",
        "sensorType": "tds",
        "status": "online",
        "lastSeen": "2026-08-17T14:43:58.289Z",
        "createdAt": "2026-08-17T14:43:58.289Z"
    },
    {
        "id": 423,
        "nodeId": 145,
        "sensorName": "Solenoid Valve & Meter-636 TEMPERATURE",
        "sensorType": "temperature",
        "status": "online",
        "lastSeen": "2026-08-17T14:43:58.291Z",
        "createdAt": "2026-08-17T14:43:58.291Z"
    }
]
  });

  console.log('Seed completed perfectly!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
