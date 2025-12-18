import { ChainhooksService } from '../services/chainhooks.service';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('=== StacksLotto Chainhook Status ===\n');
  
  const service = new ChainhooksService();
  
  try {
    await service.initialize();
    
    const hooks = await service.listHooks();
    
    console.log(`\nTotal Chainhooks: ${hooks.length}\n`);
    
    hooks.forEach((hook: any, index: number) => {
      console.log(`${index + 1}. ${hook.definition?.name || 'Unnamed'}`);
      console.log(`   UUID: ${hook.uuid}`);
      console.log(`   Enabled: ${hook.status?.enabled || false}`);
      console.log(`   Status: ${hook.status?.status || 'unknown'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Status check failed:', error);
    process.exit(1);
  }
}

main();
