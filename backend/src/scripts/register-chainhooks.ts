import { ChainhooksService } from '../services/chainhooks.service';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('=== StacksLotto Chainhook Registration ===\n');
  
  const service = new ChainhooksService();
  
  try {
    await service.initialize();
    
    console.log('\nRegistering chainhooks...\n');
    await service.registerAllHooks();
    
    console.log('\n=== Registration Complete ===');
    console.log('Registered hooks:', service.getRegisteredHooks());
    
  } catch (error) {
    console.error('Registration failed:', error);
    process.exit(1);
  }
}

main();
