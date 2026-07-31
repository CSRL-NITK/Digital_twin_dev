import { BusCoordinatorAgent } from './agents/Bus-Coordinator.agent';
import { SandboxState } from './agents/Line-Simulation.agent';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const mockBusState: SandboxState = {
  centralLevel: 42.2,
  tank1Level: 3.6,
  tank2Level: 2.3,
  tank3Level: 2.6,
  tank4Level: 2.3,
  activeScenario: 'Normal Operation',
  simulationSpeed: '2x (Accelerated)',
  motorSpeed: 1450,
  pressure: 3.4,
  flowRate: 5.2,
  ph: 7.2,
  tds: 180,
  temperature: 25.0,
  isPumpRunning: true,
  logs: ['Physics Tick: Central Tank = 42.2% | Pump Status = RUNNING']
};

async function main() {
  const query = process.argv.slice(2).join(' ');
  
  if (!query) {
    console.log('Error: Please provide a query to test the Bus coordinator agent.');
    console.log('Usage: npx ts-node src/test-bus-coordinator.ts "your question here"');
    console.log('Example: npx ts-node src/test-bus-coordinator.ts "Is the pump running on the bus topology?"');
    console.log('Example: npx ts-node src/test-bus-coordinator.ts "What is the overall health score of the bus network?"');
    console.log('Example: npx ts-node src/test-bus-coordinator.ts "What happens if we turn off the pump in the simulation?"');
    process.exit(1);
  }

  console.log('--------------------------------------------------');
  console.log(`[TEST USER QUERY]: "${query}"`);
  console.log('--------------------------------------------------');
  console.log('Initializing Bus LLM Coordinator (qwen2.5:3b) to determine route...');

  try {
    const coordinator = new BusCoordinatorAgent();
    const reply = await coordinator.handleQuery(query, mockBusState);
    
    console.log('\n[AGENT RESPONSE]:');
    console.log(reply);
    console.log('--------------------------------------------------');
  } catch (error: any) {
    console.error('\n[TEST RUNNER ERROR]:', error.message);
  }
}

main();
