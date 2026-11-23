/* KN Publicador Studio V3.1 — Canvas, seleção, gestos multi-toque, camadas e histórico. */
(function(){
 'use strict';
 const KN=window.KN=window.KN||{};
 const $=id=>document.getElementById(id);
 const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
 const copy=o=>JSON.parse(JSON.stringify(o));
 const animDefault=()=>({entry:'none',exit:'none',start:0,enter:1.8,hold:3,out:0.8});
 const makeLayer=(id,text,x,y,size,preset)=>({id,text,x,y,size,rotation:0,preset:preset||'gospel',fontOverride:'',colorOverride:'',visible:true,locked:false,anim:animDefault()});
 const state={layers:[makeLayer('main','NOVO CONTEÚDO',.5,.46,112,'gospel')],selected:'main',ratio:'16:9',profile:'Fogo & Glória',captured:null,background:null,backgroundUrl:null,history:[],future:[],bounds:{},pointers:new Map(),gesture:null,changed:false,canvas:null,gestureOrigin:null,pendingDeselect:false,lastTap:null};
 let toast=()=>{};
 const dimensions=()=>KN.quality.targets[state.ratio]||KN.quality.targets['16:9'];
 const selectedLayer=()=>state.layers.find(l=>l.id===state.selected)||null;
 function history(){state.history.push(copy({layers:state.layers,selected:state.selected}));if(state.history.length>40)state.history.shift();state.future=[];}
 function restoreHistory(from,to){if(!from.length)return;to.push(copy({layers:state.layers,selected:state.selected}));const snap=from.pop();state.layers=snap.layers;state.selected=snap.selected;syncControls();draw();}
 function fontString(layer,style,size){return `${style.italic?'italic ':''}${style.weight||'900'} ${size}px ${layer.fontOverride||style.font}`;}
 function wrap(ctx,text,maxWidth){
  const result=[];for(const paragraph of String(text||' ').split('\n')){
   const words=paragraph.split(/\s+/).filter(Boolean);let line='';
   for(const word of words){
    const proposed=line?line+' '+word:word;
    if(line&&ctx.measureText(proposed).width>maxWidth){result.push(line);line=word;}else line=proposed;
   }
   result.push(line||' ');
  }
  return result.slice(0,7);
 }
 function background(ctx,w,h,time=0){
  const p=KN.config.profiles[state.profile]||KN.config.profiles.Personalizado;
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,p.colors[0]);g.addColorStop(.62,p.colors[1]);g.addColorStop(1,p.colors[0]);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const src=state.background||state.captured;
  if(src){const sw=src.naturalWidth||src.videoWidth||src.width,sh=src.naturalHeight||src.videoHeight||src.height;
   if(sw&&sh){KN.motion.drawBackground(ctx,src,w,h,time);}
  }
  const overlay=ctx.createLinearGradient(0,0,0,h);overlay.addColorStop(0,'rgba(4,9,15,.36)');overlay.addColorStop(.45,'rgba(4,9,15,.08)');overlay.addColorStop(1,'rgba(3,12,17,.72)');ctx.fillStyle=overlay;ctx.fillRect(0,0,w,h);
 }
 function layerMetrics(ctx,layer,w,h){
  const style=KN.typography.byId(layer.preset),size=layer.size,limit=w*.88;
  ctx.save();ctx.font=fontString(layer,style,size);const lines=wrap(ctx,layer.text,limit);
  const lineHeight=size*1.10;
  const widths=lines.map(line=>ctx.measureText(line).width);
  const maxWidth=Math.min(limit,Math.max(60,...widths));
  ctx.restore();return {style,size,lines,lineHeight,maxWidth,height:lineHeight*lines.length};
 }
 function animationState(l,time,active){
  const a={...animDefault(),...(l.anim||{})};
  if(!active||(a.entry==='none'&&a.exit==='none'))return {visible:true,alpha:1,scale:1,dy:0,reveal:1,typing:false,glow:0};
  const begin=Math.max(0,Number(a.start)||0),enter=Math.max(.2,Number(a.enter)||1.8),hold=Math.max(.5,Number(a.hold)||3),out=Math.max(.2,Number(a.out)||.8);
  const p=(time-begin)/enter;
  if(time<begin)return {visible:false};
  let alpha=1,scale=1,dy=0,reveal=1,typing=false,glow=0;
  const inP=Math.min(1,Math.max(0,p));
  if(p<1){
   if(a.entry==='type'){reveal=inP;typing=true;}
   if(a.entry==='fade')alpha=inP;
   if(a.entry==='slide-up'){alpha=inP;dy=90*(1-inP);}
   if(a.entry==='zoom'){alpha=inP;scale=.62+.38*inP;}
   if(a.entry==='glow'){alpha=inP;glow=(1-inP)*48;}
  }
  const endIn=begin+enter,endHold=endIn+hold;
  if(a.exit!=='none'&&time>endHold){
   const q=Math.min(1,Math.max(0,(time-endHold)/out));
   if(q>=1)return {visible:false};
   if(a.exit==='erase'){typing=true;reveal=1-q;}
   if(a.exit==='fade')alpha=1-q;
   if(a.exit==='slide-down'){alpha=1-q;dy=q*90;}
   if(a.exit==='shrink'){alpha=1-q;scale=1-q*.65;}
  }
  return {visible:true,alpha,scale,dy,reveal,typing,glow};
 }
 const glyphs=s=>{if(typeof Intl!=='undefined'&&Intl.Segmenter){const seg=new Intl.Segmenter('pt',{granularity:'grapheme'});return [...seg.segment(s)].map(v=>v.segment);}return Array.from(s);};
 function paintLayer(ctx,l,w,h,selected,time=0,animated=false){
  const anim=animationState(l,time,animated);if(!anim.visible)return;
  const {style,size,lines,lineHeight,maxWidth,height}=layerMetrics(ctx,l,w,h);
  const x=l.x*w,y=l.y*h;ctx.save();ctx.translate(x,y+anim.dy);ctx.rotate(l.rotation);ctx.scale(anim.scale,anim.scale);ctx.globalAlpha*=anim.alpha;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=fontString(l,style,size);ctx.lineJoin='round';
  const top=-(lines.length-1)*lineHeight/2;
  const color=l.colorOverride||style.color;
  const maxChars=lines.reduce((n,t)=>n+glyphs(t).length,0);
  let remaining=anim.typing?Math.floor(maxChars*anim.reveal):maxChars;
  lines.forEach((line,i)=>{
   const glyph=glyphs(line),visible=anim.typing?glyph.slice(0,Math.max(0,remaining)).join(''):line;
   if(anim.typing)remaining-=glyph.length;
   if(!visible)return;
   const yy=top+i*lineHeight;
   const typingOffset=anim.typing?-ctx.measureText(line).width/2:0;
   ctx.textAlign=anim.typing?'left':'center';
   if(style.glow||anim.glow){ctx.shadowColor=color;ctx.shadowBlur=(style.glow||0)+anim.glow;}
   if(style.shadow){ctx.save();ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=style.shadow;ctx.shadowOffsetY=6;ctx.lineWidth=Math.max(3,size*.07);ctx.strokeStyle='rgba(5,10,12,.65)';ctx.strokeText(visible,typingOffset,yy);ctx.restore();}
   if(['gospel','biblico'].includes(l.preset)){
    ctx.shadowBlur=0;for(let d=7;d>0;d-=2){ctx.strokeStyle=d>3?'#5c3818':'#a57932';ctx.lineWidth=d+2;ctx.strokeText(visible,typingOffset,yy+d*.9);}
   }
   ctx.shadowBlur=style.glow;
   ctx.lineWidth=style.stroke==='transparent'?0:Math.max(1,size*.053);
   ctx.strokeStyle=style.stroke;if(ctx.lineWidth)ctx.strokeText(visible,typingOffset,yy);
   if(['gospel','biblico','viral'].includes(l.preset)&&!l.colorOverride){const grad=ctx.createLinearGradient(0,yy-size*.54,0,yy+size*.54);grad.addColorStop(0,'#fff9c7');grad.addColorStop(.45,color);grad.addColorStop(1,l.preset==='viral'?'#d68c16':'#ae7432');ctx.fillStyle=grad;}else ctx.fillStyle=color;
   ctx.fillText(visible,typingOffset,yy);ctx.shadowBlur=0;
   if(anim.typing && remaining<=0 && Math.floor(time*4)%2===0){
    const xCursor=typingOffset+ctx.measureText(visible).width+size*.04;
    ctx.save();ctx.shadowBlur=0;ctx.fillStyle=color;ctx.fillRect(xCursor, yy-size*.52, Math.max(3,size*.025),size*1.04);ctx.restore();
   }
  });
  state.bounds[l.id]={x,y,w:maxWidth+38,h:height+38,rotation:l.rotation};
  if(selected){
   const bw=maxWidth+38,bh=height+38;
   // O tamanho dos controles acompanha a escala visual: no celular eles continuam tocáveis.
   const rect=state.canvas?.getBoundingClientRect();
   const scale=Math.max(.07,rect?.width/w||.3);
   const radius=clamp(8/scale,11,42);
   ctx.shadowBlur=0;ctx.setLineDash([Math.max(6,10/scale),Math.max(4,6/scale)]);
   ctx.lineWidth=Math.max(2,2/scale);ctx.strokeStyle=l.locked?'#f1a78b':'#dcfff3';
   ctx.strokeRect(-bw/2,-bh/2,bw,bh);ctx.setLineDash([]);
   ctx.fillStyle=l.locked?'#bf806c':'#52d1bd';ctx.strokeStyle='#05272a';ctx.lineWidth=Math.max(2,2/scale);
   for(const [hx,hy] of [[-bw/2,-bh/2],[bw/2,-bh/2],[bw/2,bh/2],[-bw/2,bh/2]]){
    ctx.beginPath();ctx.arc(hx,hy,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
   }
   if(!l.locked){
    const rod=clamp(26/scale,30,95);
    ctx.beginPath();ctx.moveTo(0,-bh/2);ctx.lineTo(0,-bh/2-rod);ctx.strokeStyle='#dcfff3';ctx.stroke();
    ctx.beginPath();ctx.arc(0,-bh/2-rod,radius*1.12,0,Math.PI*2);
    ctx.fillStyle='#f2d49a';ctx.fill();ctx.strokeStyle='#05272a';ctx.stroke();
   }
  }
  ctx.restore();
 }
 function drawOn(ctx,w,h,handles=false,time=0,animated=false){ctx.clearRect(0,0,w,h);background(ctx,w,h,time);KN.effects.render(ctx,w,h,time,KN.motion.snapshot());state.bounds={};for(const l of state.layers){if(l.visible!==false)paintLayer(ctx,l,w,h,handles&&l.id===state.selected,time,animated);}}
 function draw(){const cv=state.canvas||$('cover');if(!cv)return;const {w,h}=dimensions();const scale=Math.min(1,900/Math.max(w,h)),pw=Math.round(w*scale),ph=Math.round(h*scale);if(cv.width!==pw)cv.width=pw;if(cv.height!==ph)cv.height=ph;const ctx=cv.getContext('2d');ctx.setTransform(pw/w,0,0,ph/h,0,0);drawOn(ctx,w,h,!KN.motion.isPlaying(),KN.motion.currentTime(),KN.motion.isPlaying());const label=$('cover-resolution');if(label)label.textContent=`${w} × ${h} px • PNG Full HD`;}
 function drawTo(ctx,w,h,time,handles=false){ctx.setTransform(1,0,0,1,0,0);drawOn(ctx,w,h,handles,time,true);}
 function exportCanvas(){const {w,h}=dimensions(),off=document.createElement('canvas');off.width=w;off.height=h;drawOn(off.getContext('2d'),w,h,false,KN.motion.currentTime(),false);draw();return off;}
 function syncControls(){
  const s=selectedLayer(),box=$('layer-list');if(!box)return;
  box.replaceChildren();
  for(const l of [...state.layers].reverse()){
   const b=document.createElement('button');b.type='button';b.className='layer-chip'+(l.id===state.selected?' active':'');
   b.setAttribute('aria-pressed',String(l.id===state.selected));
   const label=document.createElement('span');label.textContent=(l.id===state.selected?'▣ ':'□ ')+(l.text||'Texto vazio').slice(0,34);
   const flags=document.createElement('small');flags.textContent=(l.visible===false?'◌ ':'')+(l.locked?'🔒':'');
   b.append(label,flags);b.addEventListener('click',()=>select(l.id));box.appendChild(b);
  }
  const empty=!s;
  for(const id of ['layer-text','style','font-family','font-size','color-text','rotation','delete-layer','duplicate-layer','raise-layer','lower-layer','toggle-lock','toggle-visible','text-smaller','text-larger']){
   if($(id))$(id).disabled=empty;
  }
  if(s){
   const editor=$('layer-text');
   // Não redefina .value enquanto a pessoa digita: mantém cursor, acentos e seleção no celular.
   if(document.activeElement!==editor||editor.dataset.layerId!==s.id)editor.value=s.text;
   editor.dataset.layerId=s.id;
   $('style').value=s.preset;
   $('font-family').value=s.fontOverride||'auto';
   $('font-size').value=s.size;
   const color=s.colorOverride||KN.typography.byId(s.preset).color;
   $('color-text').value=/^#[0-9a-fA-F]{6}$/.test(color)?color:'#ffffff';
   $('rotation').value=clamp(Math.round(s.rotation*180/Math.PI),-180,180);
   for(const id of ['rotation','font-size','text-smaller','text-larger'])$(id).disabled=!!s.locked;
   $('toggle-lock').textContent=s.locked?'🔒 Destravar posição':'🔓 Travar posição';
   $('toggle-visible').textContent=s.visible===false?'◌ Mostrar camada':'◉ Visível';
   $('toggle-lock').setAttribute('aria-pressed',String(!!s.locked));
   $('toggle-visible').setAttribute('aria-pressed',String(s.visible!==false));
   const anim={...animDefault(),...(s.anim||{})};
   for(const [id,key] of [['text-entry','entry'],['text-exit','exit'],['text-start','start'],['text-in-time','enter'],['text-hold','hold'],['text-out-time','out']]){
    if($(id)){$(id).value=String(anim[key]);$(id).disabled=false;}
   }
   refreshAnimationLabels();
   const i=state.layers.indexOf(s);
   $('raise-layer').disabled=i>=state.layers.length-1;
   $('lower-layer').disabled=i<=0;
  }
  refreshLabels();
 }
 function refreshAnimationLabels(){
  const l=selectedLayer(),a={...animDefault(),...(l?.anim||{})};
  for(const [id,k] of [['text-start-value','start'],['text-in-value','enter'],['text-hold-value','hold'],['text-out-value','out']])if($(id))$(id).textContent=Number(a[k]).toFixed(1).replace('.',',')+' s';
  const desc=$('text-animation-hint');if(desc){const total=Number(a.start)+Number(a.enter)+Number(a.hold)+(a.exit==='none'?0:Number(a.out));desc.textContent=l?'Texto selecionado • início '+Number(a.start).toFixed(1)+' s • sequência até '+total.toFixed(1)+' s. Duração do vídeo no bloco “Fundo Vivo”.':'Selecione uma frase';}
 }
 function setAnimation(options){update(l=>{l.anim={...animDefault(),...(l.anim||{}),...options};});}
 function addAnimatedCta(text){addLayer(text||'🔔 INSCREVA-SE');setAnimation({entry:'zoom',exit:'fade',start:0,enter:.7,hold:3,out:.8});}
 function refreshLabels(){
  const s=selectedLayer();
  $('size-value').textContent=s?Math.round(s.size)+' px':'—';
  $('rotation-value').textContent=s?Math.round(s.rotation*180/Math.PI)+'°':'—';
  const status=$('selection-status');if(status)status.textContent=s?
   ('Selecionado: '+(s.text||'Texto vazio').slice(0,28)+(s.locked?' • 🔒 posição travada':'')+(s.visible===false?' • oculto':'')):
   'Toque em um texto na capa para selecionar';
 }
 function select(id){state.selected=id;syncControls();draw();}
 function update(fn,save=true){const l=selectedLayer();if(!l)return;if(save)history();fn(l);syncControls();draw();}
 function setMainText(text){const m=state.layers.find(l=>l.id==='main');if(m){m.text=text||'NOVO CONTEÚDO';if(state.selected==='main')syncControls();draw();}}
 function setProfile(profile){state.profile=profile;const preset=KN.typography.defaultForProfile(profile);state.layers.forEach(l=>{if(l.id==='main')l.preset=preset;});syncControls();draw();}
 function setRatio(ratio){if(!(ratio in KN.quality.targets))return;state.ratio=ratio;draw();}
 function addLayer(text){history();const id='layer-'+Date.now()+'-'+Math.floor(Math.random()*1e6);const preset=selectedLayer()?.preset||KN.typography.defaultForProfile(state.profile);
  state.layers.push(makeLayer(id,text||'NOVO TEXTO',.50,.65,74,preset));select(id);}
 function deleteLayer(){const l=selectedLayer();if(!l)return;if(state.layers.length===1){toast('Mantenha ao menos uma camada de texto.');return;}
  history();state.layers=state.layers.filter(x=>x.id!==l.id);select(state.layers[state.layers.length-1].id);}
 function duplicateLayer(){const l=selectedLayer();if(!l)return;history();
  const c=copy(l);c.id='layer-'+Date.now()+'-'+Math.floor(Math.random()*1e6);c.x=clamp(l.x+.045,.02,.98);c.y=clamp(l.y+.045,.02,.98);
  state.layers.splice(state.layers.indexOf(l)+1,0,c);select(c.id);toast('Texto duplicado. Arraste para reposicionar.');}
 function moveLayer(direction){const l=selectedLayer();if(!l)return;const i=state.layers.indexOf(l),j=i+direction;if(j<0||j>=state.layers.length)return;
  history();[state.layers[i],state.layers[j]]=[state.layers[j],state.layers[i]];syncControls();draw();}
 function toggleLayer(key){update(l=>{if(key==='visible')l.visible=l.visible===false;else l.locked=!l.locked;});}
 function setSizeDelta(mult){const l=selectedLayer();if(!l||l.locked)return;update(x=>{x.size=clamp(Math.round(x.size*mult),18,440);});}
 function nudge(dx,dy){const l=selectedLayer();if(!l||l.locked)return;history();l.x=clamp(l.x+dx,.02,.98);l.y=clamp(l.y+dy,.02,.98);draw();}
 function capture(video){if(!video||!video.videoWidth||!video.videoHeight)throw Error('Carregue um vídeo reproduzível e pause no quadro desejado.');
  const temp=document.createElement('canvas');temp.width=video.videoWidth;temp.height=video.videoHeight;temp.getContext('2d').drawImage(video,0,0,temp.width,temp.height);state.captured=temp;state.background=null;draw();}
 function clear(){state.captured=null;state.background=null;if(state.backgroundUrl){URL.revokeObjectURL(state.backgroundUrl);state.backgroundUrl=null;}draw();}
 function importImage(file){if(!file)return;const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{if(state.backgroundUrl)URL.revokeObjectURL(state.backgroundUrl);state.backgroundUrl=url;state.background=im;draw();toast('Foto aplicada ao fundo da capa.');};im.onerror=()=>{URL.revokeObjectURL(url);toast('Não foi possível abrir a imagem.');};im.src=url;}
 function getPoint(e){const r=state.canvas.getBoundingClientRect(),{w,h}=dimensions();
  return {x:(e.clientX-r.left)/r.width*w,y:(e.clientY-r.top)/r.height*h};}
 function localPoint(p,b){const dx=p.x-b.x,dy=p.y-b.y,c=Math.cos(-b.rotation),si=Math.sin(-b.rotation);
  return {x:dx*c-dy*si,y:dx*si+dy*c};}
 function hit(p){for(let i=state.layers.length-1;i>=0;i--){const l=state.layers[i],b=state.bounds[l.id];if(!b||l.visible===false)continue;
   const t=localPoint(p,b);if(Math.abs(t.x)<=b.w/2+15&&Math.abs(t.y)<=b.h/2+15)return l.id;
  }return null;}
 function handleHit(p){const l=selectedLayer(),b=l&&state.bounds[l.id];if(!b||l.visible===false||l.locked)return null;
  const t=localPoint(p,b),rect=state.canvas.getBoundingClientRect(),{w}=dimensions();
  const scale=Math.max(.07,rect.width/w),touchRadius=clamp(17/scale,21,75),rod=clamp(26/scale,30,95);
  if(Math.hypot(t.x,t.y+b.h/2+rod)<touchRadius)return 'rotate';
  for(const [x,y] of [[-b.w/2,-b.h/2],[b.w/2,-b.h/2],[b.w/2,b.h/2],[-b.w/2,b.h/2]]){
   if(Math.hypot(t.x-x,t.y-y)<touchRadius)return 'resize';
  }return null;
 }
 const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const dist=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y),angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
 function startGesture(mode='auto'){
  const l=selectedLayer(),ps=[...state.pointers.values()];state.gesture=null;
  if(!l||l.locked)return;
  if(ps.length>=2){const [a,b]=ps,m=mid(a,b);
   state.gesture={mode:'pinch',distance:Math.max(1,dist(a,b)),angle:angle(a,b),size:l.size,rotation:l.rotation,x:l.x,y:l.y,mid:m};
  }else if(ps.length===1){const p=ps[0],b=state.bounds[l.id];
   const c={mode:mode==='auto'?'drag':mode,p,x:l.x,y:l.y,size:l.size,rotation:l.rotation};
   if(mode==='resize'&&b){c.originDistance=Math.max(1,dist(p,{x:b.x,y:b.y}));}
   if(mode==='rotate'&&b){c.startAngle=angle({x:b.x,y:b.y},p);}
   state.gesture=c;
  }
 }
 function onPointerDown(e){if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();
  const p=getPoint(e),first=state.pointers.size===0,handle=first?handleHit(p):null;
  state.pointers.set(e.pointerId,p);
  try{state.canvas.setPointerCapture(e.pointerId);}catch(_e){}
  if(first){
   const id=handle?state.selected:hit(p);
   state.pendingDeselect=!id;
   if(id&&id!==state.selected)select(id);
   state.changed=false;
   state.gestureOrigin=copy({layers:state.layers,selected:state.selected});
   if(e.pointerType==='touch'&&id){
    const now=performance.now(),last=state.lastTap;
    if(last&&last.id===id&&now-last.time<380&&dist(last.p,p)<55){
     $('layer-text').focus();$('layer-text').select();state.lastTap=null;
    }else state.lastTap={id,time:now,p};
   }
   startGesture(handle||(!id?'idle':'drag'));
  }else{
   // Dois dedos transformam a camada ativa, mesmo se um deles estiver fora do texto.
   state.pendingDeselect=false;startGesture();
  }
 }
 function onPointerMove(e){if(!state.pointers.has(e.pointerId))return;e.preventDefault();
  const p=getPoint(e);state.pointers.set(e.pointerId,p);
  const g=state.gesture,l=selectedLayer();if(!g||!l||l.locked)return;
  const {w,h}=dimensions(),ps=[...state.pointers.values()];
  if(ps.length>=2){
   if(g.mode!=='pinch'){startGesture();return;}
   const [a,b]=ps,m=mid(a,b);
   l.size=clamp(g.size*dist(a,b)/g.distance,18,440);
   l.rotation=g.rotation+angle(a,b)-g.angle;
   l.x=clamp(g.x+(m.x-g.mid.x)/w,.02,.98);
   l.y=clamp(g.y+(m.y-g.mid.y)/h,.02,.98);
  }else if(g.mode==='drag'){
   l.x=clamp(g.x+(p.x-g.p.x)/w,.02,.98);
   l.y=clamp(g.y+(p.y-g.p.y)/h,.02,.98);
  }else if(g.mode==='resize'){
   const center={x:g.x*w,y:g.y*h};
   l.size=clamp(g.size*Math.max(1,dist(center,p))/g.originDistance,18,440);
  }else if(g.mode==='rotate'){
   const center={x:g.x*w,y:g.y*h};
   l.rotation=g.rotation+angle(center,p)-g.startAngle;
  }else return;
  state.changed=true;draw();
  $('font-size').value=clamp(Math.round(l.size),18,440);
  $('rotation').value=clamp(Math.round(l.rotation*180/Math.PI),-180,180);
  refreshLabels();
 }
 function onPointerUp(e){if(!state.pointers.has(e.pointerId))return;
  state.pointers.delete(e.pointerId);try{state.canvas.releasePointerCapture(e.pointerId);}catch(_e){}
  if(!state.pointers.size){
   if(state.changed&&state.gestureOrigin){
    if(JSON.stringify(state.gestureOrigin.layers)!==JSON.stringify(state.layers)){
     state.history.push(state.gestureOrigin);if(state.history.length>40)state.history.shift();state.future=[];
    }
   }else if(state.pendingDeselect){state.selected=null;}
   state.changed=false;state.gestureOrigin=null;state.gesture=null;state.pendingDeselect=false;
  }else{
   startGesture();
  }
  syncControls();draw();
 }
 function bindControls(){const cv=state.canvas;
  cv.addEventListener('pointerdown',onPointerDown);
  cv.addEventListener('pointermove',onPointerMove);
  cv.addEventListener('pointerup',onPointerUp);
  cv.addEventListener('pointercancel',onPointerUp);
  cv.addEventListener('lostpointercapture',onPointerUp);
  cv.addEventListener('dblclick',()=>{const l=selectedLayer();if(l){$('layer-text').focus();$('layer-text').select();}});
  cv.addEventListener('keydown',e=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();restoreHistory(state.history,state.future);return;}
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();restoreHistory(state.future,state.history);return;}
   const step=e.shiftKey?.022:.006;
   const directions={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
   if(directions[e.key]){e.preventDefault();nudge(...directions[e.key]);}
   if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteLayer();}
   if(e.key==='Escape'){state.selected=null;syncControls();draw();}
  });
  $('add-layer').addEventListener('click',()=>addLayer('NOVO TEXTO'));
  $('add-cta').addEventListener('click',()=>addLayer('ASSISTA COMPLETO'));
  $('duplicate-layer').addEventListener('click',duplicateLayer);
  $('delete-layer').addEventListener('click',deleteLayer);
  $('raise-layer').addEventListener('click',()=>moveLayer(1));
  $('lower-layer').addEventListener('click',()=>moveLayer(-1));
  $('toggle-lock').addEventListener('click',()=>toggleLayer('locked'));
  $('toggle-visible').addEventListener('click',()=>toggleLayer('visible'));
  $('text-smaller').addEventListener('click',()=>setSizeDelta(.90));
  $('text-larger').addEventListener('click',()=>setSizeDelta(1.10));
  $('undo-cover').addEventListener('click',()=>restoreHistory(state.history,state.future));
  $('redo-cover').addEventListener('click',()=>restoreHistory(state.future,state.history));
  const liveText=$('layer-text');
  function viewportSize(){const v=window.visualViewport;document.documentElement.style.setProperty('--kn-visual-height',(v?.height||window.innerHeight)+'px');}
  viewportSize();window.visualViewport?.addEventListener('resize',viewportSize);
  liveText.addEventListener('focus',()=>{
   history();document.body.classList.add('typing-cover');viewportSize();
   if(window.matchMedia('(max-width:850px)').matches && !document.body.classList.contains('kn-landscape-on')){
    requestAnimationFrame(()=>{
     const preview=$('editor-preview');const r=preview.getBoundingClientRect();
     if(r.top<0||r.top>window.innerHeight*.55)preview.scrollIntoView({block:'start',behavior:'instant'});
    });
   }
  });
  liveText.addEventListener('blur',()=>document.body.classList.remove('typing-cover'));
  $('layer-text').addEventListener('input',e=>{
   const s=selectedLayer();if(!s)return;s.text=e.target.value;
   if(s.id==='main')$('cover-text').value=s.text;
   syncControls();draw();
  });
  for(const [id,key] of [['style','preset'],['font-family','fontOverride']]){
   const elem=$(id);elem.addEventListener('change',()=>update(s=>{
    let v=elem.value;if(key==='fontOverride'&&v==='auto')v='';s[key]=v;
   }));
  }
  for(const [id,key] of [['font-size','size'],['rotation','rotation'],['color-text','colorOverride']]){
   $(id).addEventListener('pointerdown',()=>{if(selectedLayer())history();});
   $(id).addEventListener('keydown',()=>{if(selectedLayer())history();});
   $(id).addEventListener('input',e=>{
    const l=selectedLayer();if(!l||(l.locked&&key!=='colorOverride'))return;
    l[key]=key==='rotation'?Number(e.target.value)*Math.PI/180:key==='size'?Number(e.target.value):e.target.value;
    draw();refreshLabels();
   });
  }
  $('cover-image').addEventListener('change',e=>importImage(e.target.files?.[0]));
  for(const [id,key] of [['text-entry','entry'],['text-exit','exit'],['text-start','start'],['text-in-time','enter'],['text-hold','hold'],['text-out-time','out']]){
   const input=$(id);if(!input)continue;
   input.addEventListener(input.tagName==='SELECT'?'change':'input',()=>{
    const l=selectedLayer();if(!l)return;
    l.anim={...animDefault(),...(l.anim||{}),[key]:['entry','exit'].includes(key)?input.value:Number(input.value)};
    refreshAnimationLabels();draw();
   });
  }
  $('text-typing-preset')?.addEventListener('click',()=>setAnimation({entry:'type',exit:'erase',start:0,enter:2.5,hold:2.5,out:1.1}));
  $('text-anim-preview')?.addEventListener('click',()=>KN.motion.play());
 }
 function serialize(){return {ratio:state.ratio,layers:copy(state.layers),selected:state.selected,motion:KN.motion.snapshot()};}
 function restore(v){if(!v||!Array.isArray(v.layers)||!v.layers.length)return;state.layers=v.layers.filter(l=>typeof l.text==='string'&&Number.isFinite(l.x)&&Number.isFinite(l.y)).slice(0,12).map(l=>({...l,size:clamp(Number(l.size)||112,18,440),locked:!!l.locked,visible:l.visible!==false,anim:{...animDefault(),...(l.anim||{})}}));if(!state.layers.length)return;state.selected=state.layers.find(x=>x.id===v.selected)?.id||state.layers[0].id;if(v.motion)KN.motion.restore(v.motion);syncControls();draw();}
 function init(options={}){state.canvas=$('cover');toast=options.toast||(()=>{});state.profile=$('profile').value;state.ratio=$('ratio').value;
  const style=$('style');style.replaceChildren();for(const p of KN.typography.presets){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;style.appendChild(o);}
  bindControls();syncControls();draw();}
 function render(canvas,{profile,ratio,text}){if(state.canvas&&canvas!==state.canvas)state.canvas=canvas;if(profile&&profile!==state.profile)state.profile=profile;
  if(ratio&&ratio!==state.ratio)state.ratio=ratio;if(text!==undefined){const m=state.layers.find(l=>l.id==='main');if(m&&text!==m.text)m.text=text;}
  draw();}
 KN.cover={init,render,draw,drawTo,capture,clear,exportCanvas,setMainText,setProfile,setRatio,serialize,restore,selectedLayer,addLayer,addAnimatedCta,setAnimation};
})();
