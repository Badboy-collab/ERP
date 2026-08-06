const fs = require('fs');
const path = require('path');

const dirToProcess = ['app', 'components'];

const replacements = [
  { regex: /bg-slate-950/g, replacement: 'bg-slate-50' },
  { regex: /bg-slate-900/g, replacement: 'bg-white' },
  { regex: /border-slate-800/g, replacement: 'border-slate-200' },
  { regex: /border-slate-700/g, replacement: 'border-slate-300' },
  { regex: /text-slate-300/g, replacement: 'text-slate-600' },
  { regex: /text-slate-400/g, replacement: 'text-slate-500' },
  { regex: /text-white/g, replacement: 'text-slate-900' },
  { regex: /bg-slate-800/g, replacement: 'bg-slate-100' },
  { regex: /hover:bg-slate-800/g, replacement: 'hover:bg-slate-100' },
  { regex: /hover:bg-slate-700/g, replacement: 'hover:bg-slate-200' },
  { regex: /bg-emerald-950/g, replacement: 'bg-emerald-50' },
  { regex: /text-emerald-400/g, replacement: 'text-emerald-600' },
  { regex: /border-emerald-800/g, replacement: 'border-emerald-200' },
  { regex: /text-emerald-500/g, replacement: 'text-emerald-600' },
  { regex: /bg-rose-950/g, replacement: 'bg-rose-50' },
  { regex: /text-rose-400/g, replacement: 'text-rose-600' },
  { regex: /border-rose-900/g, replacement: 'border-rose-200' },
  { regex: /bg-amber-950/g, replacement: 'bg-amber-50' },
  { regex: /text-amber-400/g, replacement: 'text-amber-600' },
  { regex: /text-amber-500/g, replacement: 'text-amber-600' },
  { regex: /border-amber-900/g, replacement: 'border-amber-200' },
  { regex: /className=\"dark\"/g, replacement: 'className=\"\"' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  replacements.forEach(rule => {
    if (rule.regex.test(content)) {
      content = content.replace(rule.regex, rule.replacement);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

dirToProcess.forEach(d => walkDir(d));
console.log('Done.');
