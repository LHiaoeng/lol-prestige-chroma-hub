import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function isSensitiveDeploymentArtifact(file: string): boolean {
  return /\.map$/i.test(file)
    || /(^|\/)prestige-chromas\.json$/i.test(file)
    || /(^|\/)(data|assets|migrations?)\//i.test(file)
    || /\.(?:db|sqlite|sqlite3)(?:-(?:wal|shm|journal))?$/i.test(file)
    || /\.sql(?:\.(?:gz|br|zip))?$/i.test(file);
}

export function auditBuild(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) visit(path); else files.push(relative(root, path).replaceAll('\\', '/'));
    }
  };
  visit(root);
  const sensitive = files.filter(isSensitiveDeploymentArtifact);
  if (sensitive.length) throw new Error(`Sensitive deployment artifacts detected: ${sensitive.join(', ')}`);
  if (!files.includes('index.html') || !files.includes('zh-cn/index.html') || !files.includes('404.html')) throw new Error('Required static pages are missing');
  const fileSet = new Set(files);
  for (const file of files.filter((entry) => entry.endsWith('.html') && !entry.startsWith('zh-cn/') && entry !== '404.html')) {
    const html = readFileSync(join(root, file), 'utf8');
    const canonical = html.match(/<link rel="canonical" href="(https:\/\/chromaart\.lol[^"#]*)"/)?.[1];
    if (!canonical) continue;
    const pathname = new URL(canonical).pathname;
    const counterpart = `zh-cn${pathname === '/' ? '/index.html' : `${pathname}index.html`}`.replace(/^\//, '');
    if (!fileSet.has(counterpart)) {
      throw new Error(`Missing Simplified Chinese counterpart for ${file}: ${counterpart}`);
    }
  }
  return files;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(`Audited ${auditBuild(resolve(process.argv[2] || 'dist')).length} files`); } catch (error) { console.error(error); process.exitCode = 1; }
}
