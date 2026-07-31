import { LineLiveAgent } from './agents/Line-Live.agent';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const query = process.argv.slice(2).join(' ');
  
  if (!query) {
    console.log('Error: Please provide a query to test the agent.');
    console.log('Usage: npx ts-node src/test-agent.ts "your question here"');
    console.log('Example: npx ts-node src/test-agent.ts "Why is Tank-4 in warning?"');
    process.exit(1);
  }

  console.log('--------------------------------------------------');
  console.log(`[TEST USER QUERY]: "${query}"`);
  console.log('--------------------------------------------------');
  console.log('Fetching live telemetry and querying local Qwen model...');

  try {
    const agent = new LineLiveAgent();
    
    // We can expose the context builder for verification or just print the response
    const reply = await agent.handleQuery(query);
    
    console.log('\n[AGENT RESPONSE]:');
    console.log(reply);
    console.log('--------------------------------------------------');
  } catch (error: any) {
    console.error('\n[TEST RUNNER ERROR]:', error.message);
  }
}

main();
