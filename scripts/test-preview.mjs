// Generate a separate, password-free, in-memory app. Never a cloud build input.
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('../test-app/',import.meta.url);
await mkdir(out,{recursive:true});
let html=await readFile(new URL('index.html',root),'utf8');
html=html.slice(0,html.indexOf('<script>'))+'<script src="app.js" defer></script><script src="test-identity.js" defer></script><script src="member-card.js" defer></script><script src="insights.js" defer></script><script src="test-mode.js" defer></script></body></html>';
html=html.replace('<title>Chore Quest · Mockup</title>','<title>Chore Quest · Local test app</title>').replace('</head>','<link rel="stylesheet" href="journal.css"><link rel="stylesheet" href="member-card.css"></head>');
html=html.replace('<main>','<div class="test-banner"><strong>LOCAL TEST · Sample family</strong>No password. Changes stay in this tab and reset on refresh. No cloud connection.<div class="test-controls"><button class="action" id="testChild">Child view</button><button class="action" id="testAdmin">Admin view</button><button class="action" id="testCard">Open my card</button></div></div><main>');
for(const [before,after] of [['assets/coin.png','assets/coin-alpha.webp'],['assets/wallet.png','assets/wallet-alpha.webp'],['assets/avatar.png','assets/buddy-bot/front-idle/01.png']])html=html.replaceAll(before,after);
await writeFile(new URL('index.html',out),html);
for(const name of ['app.js','buddy.js','buddy.css','drawably.css','pixel-orb.js','card-shader.js','family-rules.js','gift-topups.js','gift-qr.js'])await cp(new URL(name,root),new URL(name,out));
for(const name of ['insights.js','member-card.js','member-card.css','journal.css'])await cp(new URL('cloudflare/'+name,root),new URL(name,out));
await cp(new URL('assets/',root),new URL('assets/',out),{recursive:true,filter:p=>!String(p).endsWith('avatar-alpha.png')});
await writeFile(new URL('test-identity.js',out),`const cloudUser={id:'local-child',username:'DemoKid',role:'child'},selectedChild=cloudUser;\n`);
await cp(new URL('test-mode.js',root),new URL('test-mode.js',out));
console.log('Built test-app: sample data only, no cloud-client or Worker credentials.');
