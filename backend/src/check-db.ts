import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const topologies = await prisma.topology.findMany({
    include: {
      _count: {
        select: { nodes: true, edges: true }
      }
    }
  });
  console.log(JSON.stringify(topologies, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
