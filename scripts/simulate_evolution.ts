import { runSimulation } from '../lib/evolved_strategy.ts';

console.log('Running simulation...');
const result = runSimulation();
console.log(JSON.stringify(result, null, 2));
