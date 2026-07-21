import fs from 'fs';
import path from 'path';

function searchDirectory(dir: string, searchTerm: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDirectory(fullPath, searchTerm);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.css'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(searchTerm)) {
        console.log(`Found "${searchTerm}" in: ${fullPath}`);
      }
    }
  }
}

searchDirectory('C:\\Users\\Dell\\Desktop\\hydroponic_testing\\frontend\\src', 'WATER RESOURCE MONITOR');
