import { DashboardAgent } from './agents/Line-Dashboard.agent';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const query = process.argv.slice(2).join(' ');
  
  if (!query) {
    console.log('Error: Please provide a query to test the dashboard agent.');
    console.log('Usage: npx ts-node src/test-dashboard.ts "your question here"');
    console.log('Example: npx ts-node src/test-dashboard.ts "Explain why System Health is low"');
    process.exit(1);
  }

  console.log('--------------------------------------------------');
  console.log(`[TEST USER QUERY]: "${query}"`);
  console.log('--------------------------------------------------');
  console.log('Fetching live dashboard telemetry and querying offline Qwen 3B model...');

  try {
    const agent = new DashboardAgent();
    const reply = await agent.handleQuery(query);
    
    console.log('\n[AGENT RESPONSE]:');
    console.log(reply);
    console.log('--------------------------------------------------');
  } catch (error: any) {
    console.error('\n[TEST RUNNER ERROR]:', error.message);
  }
}

main();
