const fs = require('fs');
const files = [
  'src/components/dashboard/navigation-panel.tsx',
  'src/components/dashboard/map-panel.tsx',
  'src/components/dashboard/camera-feeds-panel.tsx',
  'src/components/dashboard/dashboard-header.tsx',
  'src/components/dashboard/dashboard-view.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/border-white\/10/g, 'border-border');
  content = content.replace(/divide-white\/10/g, 'divide-border');
  content = content.replace(/bg-white\/10/g, 'bg-foreground/10');
  content = content.replace(/bg-white\/5/g, 'bg-foreground/5');
  content = content.replace(/bg-white\/20/g, 'bg-foreground/20');
  content = content.replace(/text-white\/20/g, 'text-foreground/20');
  content = content.replace(/shadow-\[0_0_0_1px_rgba\(26,58,56,0\.28\)_inset\]/g, 'shadow-[0_0_0_1px_var(--border)_inset]');
  content = content.replace(/shadow-\[0_0_0_1px_rgba\(255,255,255,0\.05\)_inset\]/g, 'shadow-[0_0_0_1px_var(--border)_inset]');
  fs.writeFileSync(file, content);
}
console.log('Fixed themes');
