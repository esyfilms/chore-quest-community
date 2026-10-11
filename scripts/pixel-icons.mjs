// Original Chore Quest pixel illustrations; no downloaded art or generation API.
import {mkdir,writeFile} from 'node:fs/promises';
const out=new URL('../assets/pixel/',import.meta.url);await mkdir(out,{recursive:true});
const ink='#35483a',light='#e2e7cf',coral='#c84d3f',gold='#dba447';
const icons={
 book:[[3,4,8,15,ink],[13,4,8,15,ink],[4,5,6,12,light],[14,5,6,12,light],[11,6,2,15,gold],[5,8,4,1,gold],[15,8,4,1,gold],[5,11,4,1,gold],[15,11,4,1,gold]],
 trash:[[6,7,12,14,ink],[8,9,8,10,light],[5,5,14,2,ink],[9,3,6,2,ink],[10,10,1,8,ink],[13,10,1,8,ink]],
 vacuum:[[6,18,13,3,coral],[5,19,2,3,ink],[18,19,2,3,ink],[11,6,2,12,ink],[11,4,8,2,ink],[17,5,2,7,ink],[13,12,6,2,ink],[11,15,2,3,gold]],
 clothes:[[6,4,4,2,coral],[14,4,4,2,coral],[4,6,16,4,ink],[7,10,10,10,ink],[5,7,14,2,light],[8,9,8,9,light],[10,4,4,4,gold],[9,14,6,2,coral]],
 pot:[[5,11,14,10,ink],[6,12,12,6,coral],[2,12,3,3,ink],[19,12,3,3,ink],[4,9,16,2,ink],[10,7,4,2,ink],[8,2,2,3,light],[14,1,2,4,light]],
 paw:[[8,11,8,8,ink],[6,14,12,4,ink],[9,12,6,5,gold],[4,5,4,5,ink],[10,3,4,5,ink],[16,5,4,5,ink],[3,11,3,4,ink],[19,11,3,4,ink]]
};
for(const [name,rects] of Object.entries(icons))await writeFile(new URL(name+'.svg',out),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">'+rects.map(([x,y,w,h,c])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`).join('')+'</svg>\n');
