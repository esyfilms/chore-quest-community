// Drawably 0.4.2, pinned 013c1a2dadf8d5b87c92698f18a60682711e4bfc.
// Pure geometry only; MIT notice ships alongside generated assets.
import {writeFile} from 'node:fs/promises';
import {roughLine, roughCheckmark, roughRoundedRect} from './vendor/drawably/rough.ts';
const out=new URL('../assets/sketch/',import.meta.url);
const shapes={underline:[240,12,roughLine(3,6,237,6,{seed:42,roughness:.45})],check:[48,48,roughCheckmark(8,9,32,29,{seed:12,roughness:.55})]};
for(const [name,[w,h,d]] of Object.entries(shapes))await writeFile(new URL(name+'.svg',out),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><!-- Geometry: Drawably, MIT, Daniel Belyi 2026. See DRAWABLY-LICENSE.txt. --><path d="${d}" fill="none" stroke="#d64d3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`);

for(const [name,color] of [['button-frame','#344c3b'],['button-frame-light','#fff5dc']]){const d=roughRoundedRect(3,3,294,50,9,{seed:117,roughness:1.5});await writeFile(new URL(name+'.svg',out),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 56" preserveAspectRatio="none"><!-- Drawably 0.4.2; MIT notice alongside. --><path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`);}
const panel=roughRoundedRect(5,5,390,230,15,{seed:228,roughness:1.2});
await writeFile(new URL('panel-frame.svg',out),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="none"><!-- Drawably MIT; local geometry, no runtime. --><path d="${panel}" fill="none" stroke="#344c3b" stroke-opacity=".72" stroke-width="1.6"/></svg>`);
