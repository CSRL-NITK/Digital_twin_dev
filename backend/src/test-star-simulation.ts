import { StarSimulationAgent } from './agents/Star-Simulation.agent';
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
  isPumpRunning: true, // Pump 2 is running, Pump 1 is off
  logs: [
    'Physics Tick: Pump 1 Stopped | Pump 2 Running',
    'Initializing offline sandbox layout for star topology...'
  ]
};

async function main() {
  const query = process.argv.slice(2).join(' ');
  
  if (!query) {
    console.log('Error: Please provide a query to test the Star simulation agent.');
    console.log('Usage: npx ts-node src/test-star-simulation.ts "your question here"');
    console.log('Example: npx ts-node src/test-star-simulation.ts "What happens to Tank-3 if Pump 1 fails?"');
    process.exit(1);
  }

  console.log('--------------------------------------------------');
  console.log(`[TEST USER QUERY]: "${query}"`);
  console.log('--------------------------------------------------');
  console.log('Mocking the active Star Topology sandbox parameters...');
  console.log(`- Active Scenario: ${mockStarState.activeScenario}`);
  console.log(`- Monitored state: Tank-1 = ${mockStarState.tank1Level}%, Tank-3 = ${mockStarState.tank3Level}%`);
  console.log('Querying local DeepSeek-R1 (1.5B) reasoning model...');

  try {
    const agent = new StarSimulationAgent();
    const reply = await agent.handleQuery(query, mockStarState);
    
    console.log('\n[AGENT RESPONSE]:');
    console.log(reply);
    console.log('--------------------------------------------------');
  } catch (error: any) {
    console.error('\n[TEST RUNNER ERROR]:', error.message);
  }
}

main();
