import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const source = 'C:/Indian Servers/AIMLDLAlgorithms/app/src/main/assets';
const destination = path.resolve('public/ai-algorithms');
const folders = {
  search_labs: 'graph-search',
  phase2_labs: 'optimization-search',
  phase3_labs: 'decision-processes',
  phase4_labs: 'sequential-models',
  phase5_labs: 'heuristic-search',
  phase6_labs: 'bayesian-game-search',
  phase7_labs: 'weighted-search',
  phase8_labs: 'bounded-search',
};

const rewrite = (text) => {
  let next = text;
  for (const [oldName, newName] of Object.entries(folders)) {
    next = next.replaceAll(oldName, newName);
  }
  return next;
};

await mkdir(destination, { recursive: true });
for (const [oldName, newName] of Object.entries(folders)) {
  const from = path.join(source, oldName);
  const to = path.join(destination, newName);
  await mkdir(to, { recursive: true });
  for (const file of await readdir(from)) {
    const content = await readFile(path.join(from, file));
    let output = /\.(html|css|js)$/.test(file) && file !== 'gsap.min.js'
      ? rewrite(content.toString('utf8'))
      : content;
    if (file === 'index.html') {
      output = output
        .replace(/AI Algorithms · Phase \d/g, 'AI Algorithms Virtual Lab')
        .replace('</head>', '<link rel="stylesheet" href="../production-embed.css"></head>')
        .replace('</body>', '<script src="../production-embed.js"></script></body>');
    }
    if (oldName === 'phase6_labs' && file === 'construction.js') {
      output = output.replace(
        "location.href='index.html?lab=inference&saved=1'",
        "parent.postMessage({type:'ai-lab-navigate',slug:'bayesian-network-inference',saved:true},location.origin)",
      );
    }
    await writeFile(path.join(to, file), output);
  }
}

for (const file of ['lab-runtime.js', 'lab-polish.css', 'lab-polish.js']) {
  let output = rewrite(await readFile(path.join(source, file), 'utf8'));
  if (file === 'lab-polish.js') {
    output = output.replace(
      /const app=document.getElementById\('app'\),id=new URLSearchParams\(location.search\).get\('lab'\),current=labs.find\(l=>l\[0\]===id\),folder=current\?\.\[1\]\+'_labs';/,
      "const app=document.getElementById('app'),id=new URLSearchParams(location.search).get('lab'),current=labs.find(l=>l[0]===id);",
    );
    const guardStart = output.indexOf(' // Deliberately reject a valid lab key');
    const guardEnd = output.indexOf(' const actual=', guardStart);
    if (guardStart < 0 || guardEnd < 0) throw new Error('Could not adapt lab validation');
    output = output.slice(0, guardStart) +
      " if(id&&!current){app.innerHTML='<main class=\"card lab-error\"><h1>Lab not found</h1></main>'}\n" +
      output.slice(guardEnd);
    output = output.replace(/ const explore=document.createElement\('nav'\);[^\n]+\n/, '');
  }
  await writeFile(path.join(destination, file), output);
}

console.log(`Imported eight AI lab bundles into ${destination}`);
