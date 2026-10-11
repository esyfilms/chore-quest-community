import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('public/',import.meta.url);
await mkdir(out,{recursive:true});await rm(new URL('assets/avatar-alpha.png',out),{force:true});let html=await readFile(new URL('index.html',root),'utf8');
let js=await readFile(new URL('app.js',root),'utf8');
js=js.replaceAll(';init();',';').replaceAll('+b.dataset.resubmit','b.dataset.resubmit').replaceAll('+b.dataset.detail','b.dataset.detail');
// Cloud uses UUID strings, so sorting follows the server's newest-first ordering.
js=js.replace(/^const svg=.*$/m,`const svg=k=>'<img alt="" src="assets/'+({bed:'bed-alpha',table:'dishes-alpha',toys:'coin-alpha'}[k]||'coin-alpha')+'.webp">';`);
js=js.replaceAll('assets/coin.png','assets/coin-alpha.webp');
js=js.replace('shown.slice().sort((a,b)=>b.id-a.id)','shown');
// Disabled preview buttons remain as hidden DOM targets for the original render function.
html=html.slice(0,html.indexOf('<script>'))+'<script src="app.js" defer></script><script src="member-card.js" defer></script><script src="admin-family.js" defer></script><script src="insights.js" defer></script><script src="cloud-client.js" defer></script><script src="feedback.js" defer></script></body></html>';
html=html.replace('<body>','<body class="cloud-loading">');
html=html.replace('Chore Quest · Mockup','Chore Quest').replace('<head>','<head><link rel="stylesheet" href="cloud.css">');
html=html.replaceAll('assets/dog.png','assets/buddy-bot/front-idle/01.png').replaceAll('assets/coin.png','assets/coin-alpha.webp').replaceAll('assets/wallet.png','assets/wallet-alpha.webp').replaceAll('assets/avatar.png','assets/buddy-bot/front-idle/01.png');
html=html.replace('SMALL CHORES BIGGER TOMORROWS','THE FAMILY CHORE JOURNAL');
html=html.replace('</head>','<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#faf9f3"><meta name="apple-mobile-web-app-capable" content="yes"><link rel="apple-touch-icon" href="/assets/app-icons/icon-180.png"><script src="/pwa.js" defer></script></head>');
for(const name of ['manifest.webmanifest','pwa.js','sw.js'])await cp(new URL(name,import.meta.url),new URL(name,out));
html=html.replace('</head>','<link rel="stylesheet" href="journal.css"><link rel="stylesheet" href="member-card.css"></head>');
for(const name of ['insights.js','admin-family.js','journal.css','feedback.js','member-card.css','member-card.js'])await cp(new URL(name,import.meta.url),new URL(name,out));
for(const name of ['buddy.js','buddy.css','drawably.css','pixel-orb.js','card-shader.js','family-rules.js','gift-topups.js','gift-qr.js'])await cp(new URL(name,root),new URL(name,out));
await writeFile(new URL('index.html',out),html);await writeFile(new URL('app.js',out),js);await cp(new URL('cloud-client.js',import.meta.url),new URL('cloud-client.js',out));await cp(new URL('assets/',root),new URL('assets/',out),{recursive:true,filter:source=>!String(source).endsWith('avatar-alpha.png')});
await writeFile(new URL('cloud.css',out),'.cloud-loading main,.cloud-loading aside,.cloud-loading #profile{visibility:hidden}.auth-screen{padding:24px 4px}.auth-screen h1{font-size:28px}.auth-dog{width:100px;height:100px;object-fit:contain;margin-bottom:20px}.auth-screen label{display:block;margin:18px 0;font-size:14px}.auth-screen input[type=password]{display:block;width:100%;min-height:46px;border:1px solid #cfdce2;border-radius:9px;padding:10px;margin-top:6px;font-size:16px;background:#fffdf7}.auth-screen .primary{width:100%;margin-top:10px}.auth-link{display:block;min-height:44px;background:none;text-decoration:underline;margin-top:12px;font-size:14px}.action:disabled{opacity:.55;cursor:wait}');
console.log('Built cloud app; the original demo remains unchanged.');
