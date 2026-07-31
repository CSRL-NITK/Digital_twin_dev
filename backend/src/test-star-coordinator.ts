import { StarCoordinatorAgent } from './agents/Star-Coordinator.agent';
import { SandboxState } from './agents/Line-Simulation.agent';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const mockStarState: SandboxState = {
  centralLevel: 42.2,
  tank1Level: 3.6,
  tank2Level: 2.3,
  tank3Level: 25.6,
  tank4Level: 30.3,
  activeScenario: 'Pump 1 Failure',
  simulationSpeed: '2x (Accelerated)',
  motorSpeed: 1450,
  pressure: 1.7,
  flowRate: 2.6,
  ph: 7.2,
  tds: 180,
  temperature: 25.0,
  isPumpRunning: true,
  logs: ['Physics Tick: Pump 1 Stopped | Pump 2 Running']
};

async function main() {
  const query = process.argv.slice(2).join(' ');
  
  if (!query) {
    console.log('Error: Please provide a query to test the Star coordinator agent.');
    console.log('Usage: npx ts-node src/test-star-coordinator.ts "your question here"');
    console.log('Example: npx ts-node src/test-star-coordinator.ts "Is the pump running on the star topology?"');
    console.log('Example: npx ts-node src/test-star-coordinator.ts "What is the overall health score of the star network?"');
    console.log('Example: npx ts-node src/test-star-coordinator.ts "What happens if Pump 1 fails in the simulation?"');
    process.exit(1);
  }

  console.log('--------------------------------------------------');
  console.log(`[TEST USER QUERY]: "${query}"`);
  console.log('--------------------------------------------------');
  console.log('Initializing Star LLM Coordinator (qwen2.5:3b) to determine route...');

  try {
    const coordinator = new StarCoordinatorAgent();
    const reply = await coordinator.handleQuery(query, mockStarState);
    
    console.log('\n[AGENT RESPONSE]:');
    console.log(reply);
    console.log('--------------------------------------------------');
  } catch (error: any) {
    console.error('\n[TEST RUNNER ERROR]:', error.message);
  }
}

main();
