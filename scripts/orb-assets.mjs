// Thinking Orbs, de85557ca220332586d070d8788c0e1d6e877a0d, MIT Jakub Antalik.
// Offline adaptation: original orbit geometry -> grid-quantized vector squares.
import {frameOrbits} from './vendor/thinking-orbs/orbits.ts';
import {writeFile} from 'node:fs/promises';
let groups='';
for(let i=0;i<12;i++){
 const {dots}=frameOrbits(32,i*.65,{orbitN:4,ghostN:8,particles:2,ghostR:.6,partR:1,partRDepth:.5,rMin:.5});
 groups+='<g class="cq-orb-frame" style="--orb-phase:'+(-((12-i)%12)*.15).toFixed(2)+'s">'+dots.map(d=>{const n=d.a===undefined?2:1;return '<rect x="'+Math.round(d.x-n/2)+'" y="'+Math.round(d.y-n/2)+'" width="'+n+'" height="'+n+'" opacity="'+(d.a===undefined?1:Math.max(.16,d.a)).toFixed(2)+'"/>';}).join('')+'</g>';
}
const styles='<style>.cq-orb-frame{opacity:0;animation:cqOrbFrames 1.8s steps(1,end) infinite;animation-delay:var(--orb-phase)}@keyframes cqOrbFrames{0%,8.32%{opacity:1}8.33%,100%{opacity:0}}.effects-paused .cq-orb-frame{animation-play-state:paused}.orb-static .cq-orb-frame{animation:none;opacity:0}.orb-static .cq-orb-frame:first-of-type{opacity:1}.network-active .orb-static .cq-orb-frame{animation:cqOrbFrames 1.8s steps(1,end) infinite;animation-delay:var(--orb-phase)}@media(prefers-reduced-motion:reduce){.cq-orb-frame,.network-active .orb-static .cq-orb-frame{animation:none!important;opacity:0}.cq-orb-frame:first-of-type{opacity:1}}</style>';
const svg='<svg xmlns="http://www.w3.org/2000/svg" class="pixel-orb" viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor">'+styles+groups+'</svg>';
await writeFile(new URL('../pixel-orb.js',import.meta.url),'// Vector pixel adaptation of Thinking Orbs geometry; see assets/sketch/THINKING-ORBS-LICENSE.txt\nfunction pixelOrbMarkup(size=24){return '+JSON.stringify(svg)+'.replace(\'class="pixel-orb"\',\'class="pixel-orb" style="width:\'+Math.max(16,Math.min(80,Number(size)||24))+\'px;height:\'+Math.max(16,Math.min(80,Number(size)||24))+\'px" width="\'+Math.max(16,Math.min(80,Number(size)||24))+\'" height="\'+Math.max(16,Math.min(80,Number(size)||24))+\'"\');}\n');
await writeFile(new URL('../assets/sketch/pixel-orb.svg',import.meta.url),svg);
console.log('Generated 12 vector frames from pinned Thinking Orbs numeric geometry.');
