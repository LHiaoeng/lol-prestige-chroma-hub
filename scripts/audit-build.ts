import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function auditBuild(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) visit(path); else files.push(relative(root, path).replaceAll('\\', '/'));
    }
  };
  visit(root);
  const sensitive = files.filter((file) =>
    /\.map$/i.test(file)
    || /(^|\/)prestige-chromas\.json$/i.test(file)
    || /(^|\/)(data|assets|migrations?)\//i.test(file)
    || /\.(?:db|sqlite|sqlite3|sql)$/i.test(file)
  );
  if (sensitive.length) throw new Error(`Sensitive deployment artifacts detected: ${sensitive.join(', ')}`);
  if (!files.includes('index.html') || !files.includes('404.html')) throw new Error('Required static pages are missing');
  return files;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(`Audited ${auditBuild(resolve(process.argv[2] || 'dist')).length} files`); } catch (error) { console.error(error); process.exitCode = 1; }
}
