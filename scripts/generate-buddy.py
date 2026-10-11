"""Draw a generic pixel robot from rectangles. No input images or external packages."""
from pathlib import Path
import json,struct,zlib,math
root=Path(__file__).resolve().parent.parent
palette={'ink':(37,64,56,255),'mint':(162,216,183,255),'cream':(248,240,204,255),'gold':(232,177,62,255),'pink':(222,116,112,255)}
def png(width,height,pixels):
 def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
 raw=b''.join(b'\0'+bytes(pixels[y*width*4:(y+1)*width*4]) for y in range(height))
 return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
def robot(motion,i):
 data=bytearray(64*64*4)
 def rect(x,y,w,h,c):
  for yy in range(max(0,y),min(64,y+h)):
   for xx in range(max(0,x),min(64,x+w)):data[(yy*64+xx)*4:(yy*64+xx+1)*4]=bytes(palette[c])
 shift=-round(5*math.sin(i/7*math.pi)) if motion=='jump' else (i%2 if motion=='walk' else 0)
 rect(29,10+shift,4,7,'ink');rect(28,8+shift,6,4,'gold')
 rect(17,16+shift,30,24,'ink');rect(20,19+shift,24,18,'mint')
 blink=i in (3,4) and motion=='front-idle'
 rect(24,24+shift,4,1 if blink else 5,'ink');rect(36,24+shift,4,1 if blink else 5,'ink')
 rect(29,32+shift,7,2,'ink');rect(22,32+shift,3,2,'pink');rect(40,32+shift,3,2,'pink')
 rect(22,41+shift,20,14,'ink');rect(25,43+shift,14,9,'cream');rect(30,45+shift,4,4,'gold')
 rect(17,42+shift,4,10,'ink');rect(43,35+shift if motion in ('paw','wag','front-happy') else 42+shift,4,10,'ink')
 step=2 if motion=='walk' and i%2 else 0
 rect(24,55+shift,6,5-step,'ink');rect(35,55+shift,6,3+step,'ink')
 if motion=='bark':rect(49,22+shift,4,2,'gold');rect(51,27+shift,5,2,'gold')
 return png(64,64,data)
base=root/'assets/buddy-bot';motions={'front-idle':8,'front-pet':8,'front-happy':8,'jump':8,'walk':8,'bark':8,'wag':8,'paw':7}
for motion,count in motions.items():
 (base/motion).mkdir(parents=True,exist_ok=True)
 for i in range(count):(base/motion/f'{i+1:02}.png').write_bytes(robot(motion,i))
(base/'motions.json').write_text(json.dumps({k:{'frames':v,'frameMs':260 if k=='front-idle' else 120} for k,v in motions.items()},indent=2)+'\n')
for name in ['dog.png','avatar.png']:(root/'assets'/name).write_bytes(robot('front-idle',0))
print('Generated 63 transparent robot frames and two compatibility aliases; no source artwork read.')
# Standalone launcher icons use the same robot on a plain cream tile.
source=robot('front-idle',0);pos=8;packed=b''
while pos<len(source):
 n=struct.unpack('>I',source[pos:pos+4])[0];kind=source[pos+4:pos+8]
 if kind==b'IDAT':packed+=source[pos+8:pos+8+n]
 pos+=12+n
raw=zlib.decompress(packed);rgba=b''.join(raw[y*257+1:y*257+257] for y in range(64))
icons=root/'assets/app-icons';icons.mkdir(exist_ok=True)
for size in [180,192,512]:
 out=bytearray(size*size*4)
 for y in range(size):
  for x in range(size):
   sx=min(63,x*64//size);sy=min(63,y*64//size);pixel=rgba[(sy*64+sx)*4:(sy*64+sx+1)*4]
   out[(y*size+x)*4:(y*size+x+1)*4]=pixel if pixel[3] else bytes((250,249,243,255))
 (icons/f'icon-{size}.png').write_bytes(png(size,size,out))
