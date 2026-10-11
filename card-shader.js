// Native WebGPU host for the pinned MIT vgpu Holographic Card shader.
// Only generic foil enters the GPU; names, funds and permissions stay in DOM/app.
function mountCardShader(card){
 card.dataset.cardRenderer='css-foil';
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=card.querySelector('canvas');
 if(!canvas||!navigator.gpu||preference.matches){card.dataset.cardRenderer='css-foil';return ()=>{};}
 let disposed=false,device=null,buffer=null,context=null,frame=0,last=0,visible=true,ready=false;
 const controller=new AbortController(),signal=controller.signal;
 const cleanup=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);controller.abort();observer.disconnect();resize.disconnect();preference.removeEventListener('change',motionChanged);buffer?.destroy();device?.destroy();canvas.remove();card.dataset.cardRenderer='css-foil';};
 const canRun=()=>!disposed&&ready&&visible&&!document.hidden&&!preference.matches&&card.isConnected;
 let pipeline,group,format;
 const draw=t=>{
  frame=0;if(!canRun())return;
  if(t-last>=1000/24){last=t;const phase=t/7000;
   const x=parseFloat(card.style.getPropertyValue('--shine-x'))/100;
   const y=parseFloat(card.style.getPropertyValue('--shine-y'))/100;
   const px=Number.isFinite(x)?(x-.5)*2:Math.sin(phase)*.65,py=Number.isFinite(y)?(y-.5)*2:Math.cos(phase*.8)*.5;
   try{device.queue.writeBuffer(buffer,0,new Float32Array([canvas.width,canvas.height,px*.1,-py*.1,px,py,1,0]));
    const command=device.createCommandEncoder();const pass=command.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),loadOp:'clear',storeOp:'store',clearValue:{r:.07,g:.08,b:.09,a:1}}]});
    pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.draw(3);pass.end();device.queue.submit([command.finish()]);
    card.dataset.cardRenderer='vgpu-shader';
   }catch{cleanup();return;}
  }
  frame=requestAnimationFrame(draw);
 };
 const sync=()=>{if(canRun()){if(!frame)frame=requestAnimationFrame(draw);}else{cancelAnimationFrame(frame);frame=0;}};
 const motionChanged=()=>{if(preference.matches)cleanup();};
 const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);sync();});observer.observe(card);
 const resize=new ResizeObserver(()=>{if(!context||disposed)return;const r=card.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.min(768,Math.round(r.width*dpr)));canvas.height=Math.max(1,Math.min(512,Math.round(r.height*dpr)));});resize.observe(card);
 document.addEventListener('visibilitychange',sync,{signal});preference.addEventListener('change',motionChanged);
 (async()=>{
  const adapter=await navigator.gpu.requestAdapter({powerPreference:'low-power'});if(disposed)return;if(!adapter)throw Error('No GPU adapter');
  device=await adapter.requestDevice();if(disposed){device.destroy();return;}
  device.lost.then(()=>{if(!disposed)cleanup();});
  const response=await fetch(new URL('assets/shaders/holographic-card.wgsl',document.baseURI),{signal});if(!response.ok)throw Error('Shader unavailable');
  const code=await response.text();if(disposed)return;
  const module=device.createShaderModule({code});const info=await module.getCompilationInfo();if(info.messages.some(m=>m.type==='error'))throw Error('Shader compilation failed');
  format=navigator.gpu.getPreferredCanvasFormat();context=canvas.getContext('webgpu');if(!context)throw Error('No WebGPU context');
  context.configure({device,format,alphaMode:'opaque'});
  pipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vs_main'},fragment:{module,entryPoint:'fs_main',targets:[{format}]},primitive:{topology:'triangle-list'}});if(disposed)return;
  buffer=device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer}}]});
  const r=card.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.min(768,Math.round(r.width*dpr)));canvas.height=Math.max(1,Math.min(512,Math.round(r.height*dpr)));
  ready=true;sync();
 })().catch(()=>{cleanup();});
 return cleanup;
}
