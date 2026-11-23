/* KN V3 — Motion: animação de fundo, sem alterar o vídeo original. */
(function(){
 'use strict';
 const KN=window.KN=window.KN||{}, $=id=>document.getElementById(id);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const defaults={mode:'zoom-in',amount:18,duration:8,effect:'none',density:44,speed:50,light:'none'};
 let state={...defaults},previewPlaying=false,previewTime=0,rafId=0,started=0,notify=()=>{},download=()=>{},exporting=false;
 const snapshot=()=>({...state});
 const ease=v=>v*v*(3-2*v);
 function drawBackground(ctx,image,w,h,time){
  if(!image)return false;
  const sw=image.naturalWidth||image.videoWidth||image.width,sh=image.naturalHeight||image.videoHeight||image.height;
  if(!sw||!sh)return false;
  const p=ease(clamp(time/Math.max(1,state.duration),0,1));
  const a=clamp(state.amount,0,60)/100;
  let zoom=1,dx=0,dy=0;
  const slide=2*p-1;
  switch(state.mode){
   case 'zoom-in': zoom=1+a*p;break;
   case 'zoom-out':zoom=1+a*(1-p);break;
   case 'zoom-soft':zoom=1+a*(.5+.5*Math.sin(Math.PI*2*(time/state.duration)-Math.PI/2));break;
   case 'pan-left': zoom=1+a;dx=-slide;break;
   case 'pan-right':zoom=1+a;dx=slide;break;
   case 'pan-up': zoom=1+a;dy=-slide;break;
   case 'pan-down':zoom=1+a;dy=slide;break;
   case 'pan-diag':zoom=1+a;dx=slide;dy=slide;break;
   case 'zoom-pan':zoom=1+a*(.4+.6*p);dx=(2*p-1)*.75;dy=(1-2*p)*.45;break;
   case 'none':default:zoom=1;break;
  }
  const base=Math.max(w/sw,h/sh),scale=base*zoom,dw=sw*scale,dh=sh*scale;
  ctx.drawImage(image,(w-dw)/2+dx*(dw-w)/2,(h-dh)/2+dy*(dh-h)/2,dw,dh);
  return true;
 }
 function setPreviewLabel(){
  const b=$('motion-preview'),status=$('animation-status');
  if(b)b.textContent=previewPlaying?'⏸ Pausar prévia':'▶ Ver movimento';
  if(status&&!exporting)status.textContent=previewPlaying?`Prévia em movimento • ${previewTime.toFixed(1)} s / ${state.duration} s`:'Pronto para animar • exportação Full HD sem áudio';
 }
 function frame(ts){if(!previewPlaying)return;
  previewTime=((ts-started)/1000)%state.duration;
  KN.cover.draw();setPreviewLabel();rafId=requestAnimationFrame(frame);
 }
 function play(){if(previewPlaying)return;previewPlaying=true;started=performance.now()-previewTime*1000;rafId=requestAnimationFrame(frame);setPreviewLabel();}
 function pause(){if(!previewPlaying)return;previewPlaying=false;cancelAnimationFrame(rafId);setPreviewLabel();KN.cover.draw();}
 function stop(){pause();previewTime=0;KN.cover.draw();setPreviewLabel();}
 function sync(){for(const [id,key] of [['motion-mode','mode'],['motion-strength','amount'],['motion-duration','duration'],['effect-type','effect'],['effect-density','density'],['effect-speed','speed'],['light-type','light']]){
  if($(id))$(id).value=state[key];
 }const a=$('motion-strength-value'),d=$('effect-density-value'),s=$('effect-speed-value');
  if(a)a.textContent=state.amount+'%';if(d)d.textContent=state.density+'%';if(s)s.textContent=state.speed+'%';setPreviewLabel();
 }
 function restore(value){if(!value||typeof value!=='object')return;
  const next={...defaults};for(const key of Object.keys(defaults)){
   if(!(key in value))continue;
   if(typeof defaults[key]==='number'){const x=Number(value[key]);if(Number.isFinite(x))next[key]=x;}
   else next[key]=String(value[key]).slice(0,40);
  }
  next.duration=[5,8,10,15,30].includes(next.duration)?next.duration:8;
  next.amount=clamp(next.amount,0,60);next.density=clamp(next.density,0,100);next.speed=clamp(next.speed,0,100);
  state=next;stop();sync();
 }
 function chooseMime(){if(typeof MediaRecorder==='undefined')return null;
  const opts=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  return opts.find(m=>MediaRecorder.isTypeSupported(m))||null;
 }
 async function exportVideo(){
  if(exporting)return;
  if(!HTMLCanvasElement.prototype.captureStream||!chooseMime()){
   notify('Seu navegador não permite gravar esta animação. Teste Chrome ou Edge atualizado.');return;
  }
  pause();exporting=true;let stream=null,recorder=null,frameId=0;
  const button=$('download-animation');if(button)button.disabled=true;
  const status=$('animation-status');
  const size=KN.quality.targets[$('ratio').value];
  const canvas=document.createElement('canvas');canvas.width=size.w;canvas.height=size.h;
  const ctx=canvas.getContext('2d',{alpha:false});
  try{
   // Conteúdo gerado no próprio navegador, sem áudio e sem alterar o vídeo importado.
   const mime=chooseMime(),ext=mime.includes('mp4')?'mp4':'webm';
   KN.cover.drawTo(ctx,size.w,size.h,0,false);
   stream=canvas.captureStream(30);
   recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:9500000});
   const chunks=[];const duration=state.duration;
   recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
   recorder.onerror=e=>{if(status)status.textContent='O navegador falhou durante a gravação.';notify('Falha na gravação: '+(e.error?.message||'erro desconhecido'));};
   recorder.onstop=()=>{
    cancelAnimationFrame(frameId);stream?.getTracks().forEach(t=>t.stop());
    exporting=false;if(button)button.disabled=false;
    const blob=new Blob(chunks,{type:mime});
    if(blob.size){const title=($('topic').value||'fundo_vivo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w-]+/g,'_').slice(0,50)||'fundo_vivo';
     download(blob,`${title}_${size.w}x${size.h}_animado.${ext}`,mime);
     if(status)status.textContent=`Vídeo ${size.w} × ${size.h} exportado em ${ext.toUpperCase()} • sem áudio`;
     notify('Vídeo animado exportado em '+ext.toUpperCase()+'. Confira o arquivo antes de publicar.');
    }else{if(status)status.textContent='Falha: arquivo de vídeo vazio.';notify('O navegador não gerou dados do vídeo.');}
   };
   let start=null;recorder.start(250);
   const drawFrame=ts=>{
    if(!start)start=ts;
    const seconds=Math.min(duration,(ts-start)/1000);
    KN.cover.drawTo(ctx,size.w,size.h,seconds,false);
    if(status)status.textContent=`Exportando vídeo Full HD: ${Math.round(100*seconds/duration)}% • mantenha esta aba aberta`;
    if(seconds<duration&&recorder.state==='recording')frameId=requestAnimationFrame(drawFrame);
    else if(recorder.state==='recording')recorder.stop();
   };
   frameId=requestAnimationFrame(drawFrame);
  }catch(err){cancelAnimationFrame(frameId);stream?.getTracks().forEach(t=>t.stop());
   try{if(recorder&&recorder.state!=='inactive')recorder.stop();}catch(_e){}
   exporting=false;if(button)button.disabled=false;
   if(status)status.textContent='Não foi possível exportar nesta configuração.';
   notify('Erro ao gravar vídeo: '+err.message);
  }
 }
 function exportTransparent(){const size=KN.quality.targets[$('ratio').value];
  const canvas=document.createElement('canvas');canvas.width=size.w;canvas.height=size.h;
  KN.effects.render(canvas.getContext('2d'),size.w,size.h,previewTime,state);
  canvas.toBlob(blob=>{
   if(!blob){notify('Não foi possível gerar PNG transparente.');return;}
   download(blob,`efeitos_transparentes_${size.w}x${size.h}.png`,'image/png');
   notify('Camada de efeitos exportada em PNG transparente.');
  },'image/png');
 }
 function init(options={}){notify=options.notify||notify;download=options.download||download;
  for(const [id,key] of [['motion-mode','mode'],['motion-strength','amount'],['motion-duration','duration'],['effect-type','effect'],['effect-density','density'],['effect-speed','speed'],['light-type','light']]){
   const input=$(id);if(!input)continue;
   input.addEventListener(input.tagName==='SELECT'?'change':'input',()=>{
    state[key]=typeof defaults[key]==='number'?Number(input.value):input.value;
    if(key==='duration'&&previewPlaying){started=performance.now()-previewTime*1000;}
    sync();KN.cover.draw();
   });
  }
  $('motion-preview')?.addEventListener('click',()=>previewPlaying?pause():play());
  $('motion-reset')?.addEventListener('click',()=>{stop();restore(defaults);notify('Movimento e efeitos redefinidos.');});
  $('download-animation')?.addEventListener('click',exportVideo);
  $('download-effect-png')?.addEventListener('click',exportTransparent);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  sync();
 }
 KN.motion={init,drawBackground,snapshot,restore,currentTime:()=>previewTime,isPlaying:()=>previewPlaying,play,pause,stop,exportVideo};
})();
