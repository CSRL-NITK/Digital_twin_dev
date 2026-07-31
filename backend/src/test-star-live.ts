import { StarLiveAgent } from './agents/Star-Live.agent';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const query = process.argv.slice(2).join(' ');
  
  if (!query) {
    console.log('Error: Please provide a query to test the Star Live agent.');
    console.log('Usage: npx ts-node src/test-star-live.ts "your question here"');
    console.log('Example: npx ts-node src/test-star-live.ts "Is the pump running on the star topology?"');
    console.log('Example: npx ts-node src/test-star-live.ts "What is the pH level of Tank-2 on the star topology?"');
    process.exit(1);
  }

  console.log('--------------------------------------------------');
  console.log(`[TEST USER QUERY]: "${query}"`);
  console.log('--------------------------------------------------');
  console.log('Fetching live Star Topology telemetry and querying offline Qwen 1.5B model...');

  try {
    const agent = new StarLiveAgent();
    const reply = await agent.handleQuery(query);
    
    console.log('\n[AGENT RESPONSE]:');
    console.log(reply);
    console.log('--------------------------------------------------');
  } catch (error: any) {
    console.error('\n[TEST RUNNER ERROR]:', error.message);
  }
}

main();
