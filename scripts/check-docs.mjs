import {readdir,readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const ignored=new Set(['node_modules','.git','.npm-cache','.wrangler','test-app','public']);let count=0,links=0,failed=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(ignored.has(item.name))continue;const path=resolve(dir,item.name);if(item.isDirectory())await walk(path);else if(item.name.endsWith('.md')){count++;const text=await readFile(path,'utf8');for(const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){const href=match[1].split('#')[0];if(!href||/^(https?:|mailto:)/.test(href))continue;links++;try{await access(resolve(dirname(path),decodeURIComponent(href)));}catch{failed.push(path+': '+href);}}}}}
await walk(process.cwd());if(failed.length){console.error(failed.join('\n'));process.exit(1);}console.log(`Documentation links passed: ${count} Markdown files, ${links} local links. Contents still need human review.`);
