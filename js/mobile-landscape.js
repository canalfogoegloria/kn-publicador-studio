/* V3.3 — Layout exclusivo do celular deitado, com áreas independentes.
 * Reparenta nós originais e os devolve à posição original ao sair da paisagem;
 * nunca duplica campos ou cria IDs de edição substitutos. */
(function(){
 'use strict';
 const query=window.matchMedia('(orientation: landscape) and (pointer: coarse) and (max-height: 680px) and (min-width: 580px)');
 const mount=$('landscape-studio');
 if(!mount)return;
 const anchors=new Map();
 // Mover somente nós completos para preservar todos os eventos de sua implementação original.
 let active=false,tab='video', fauxFullscreen=false;
 const slot=(node,parent)=>{
  if(!node||!parent)return;
  if(!anchors.has(node)){
   const a=document.createComment('posição original de '+(node.id||node.className));
   node.parentNode.insertBefore(a,node);
   anchors.set(node,a);
  }
  parent.appendChild(node);
 };
 const restore=()=>{
  for(const [node,anchor] of [...anchors.entries()].reverse()){
   anchor.parentNode.insertBefore(node,anchor);anchor.remove();
  }
  anchors.clear();
 };
 const hide=(element,yes)=>{if(element)element.hidden=!!yes};
 function refreshMediaPlaceholder(){
  const v=$('video');
  const ready=!!(v.currentSrc||v.getAttribute('src')) && !v.hidden && v.error===null;
  hide($('kn-video-empty'),ready);
 }
 function fullscreenActive(){return !!(document.fullscreenElement||document.webkitFullscreenElement||fauxFullscreen);}
 function syncFullscreen(){
  const activeNow=fullscreenActive();
  $('kn-fullscreen-exit').hidden=!activeNow;
  $('kn-fullscreen').textContent=activeNow?'←':'⛶';
  $('kn-fullscreen').setAttribute('aria-label',activeNow?'Voltar da tela cheia':'Vídeo em tela cheia');
 }
 async function exitFullscreen(){
  if(document.fullscreenElement && document.exitFullscreen){try{await document.exitFullscreen();}catch(e){}}
  else if(document.webkitFullscreenElement && document.webkitExitFullscreen){try{document.webkitExitFullscreen();}catch(e){}}
  fauxFullscreen=false;
  $('kn-video-target').classList.remove('kn-faux-fullscreen');
  syncFullscreen();
 }
 async function enterFullscreen(){
  const v=$('video');
  if(!v.getAttribute('src'))return;
  if(fullscreenActive()){await exitFullscreen();return;}
  const host=$('kn-video-target');
  try{
   if(typeof host.requestFullscreen==='function')await host.requestFullscreen({navigationUI:'hide'});
   else if(typeof host.webkitRequestFullscreen==='function')host.webkitRequestFullscreen();
   else throw new Error('API indisponível');
  }catch(e){
   // Android / arquivos locais podem não permitir a API: manter retorno acessível.
   fauxFullscreen=true;host.classList.add('kn-faux-fullscreen');
  }
  syncFullscreen();
 }
 function setTab(name){
  if(!active)return;
  tab=name;
  ['video','cover','post'].forEach(x=>{
   hide($('kn-'+x+'-stage'),x!==name);
   hide($('kn-'+x+'-tools'),x!==name);
   const b=$('kn-tab-'+x);b.classList.toggle('active',x===name);b.setAttribute('aria-pressed',String(x===name));
  });
  $('landscape-mode-label').textContent= name==='video'?'VÍDEO':name==='cover'?'FOTO / CAPA':'PUBLICAÇÕES';
  $('kn-landscape-tools').scrollTop=0;
  if(name!=='video')$('video').pause();
  if(name==='cover')requestAnimationFrame(()=>window.KN?.cover?.draw());
 }
 function enter(){
  if(active)return;
  active=true;
  // A ordem de reparenting é intencional: preview e tools são irmãos independentes.
  const main=document.querySelector('.mainpanel');
  // Mover as ETAPAS completas deixa seus campos e listeners intactos.
  const p1=main.children[0],p2=main.children[1],p3=$('editor-panel'),p4=main.children[3],p5=$('kn-youtube-panel');
  slot($('video'),$('kn-video-target'));
  slot($('kn-frame-actions'),$('kn-frame-quick'));
  slot(p1,$('kn-video-tools'));
  // Tema e resumo ficam na aba de publicação junto da geração SEO.
  slot([...p1.querySelectorAll('.field-row.two')].at(-1),$('kn-post-tools'));
  slot(p2,$('kn-post-tools'));
  slot(p4,$('kn-post-tools'));
  slot(p5,$('kn-post-tools'));
  slot($('editor-preview'),$('kn-cover-preview-target'));
  slot(p3.querySelector('.cover-setup'),$('kn-cover-tools'));
  slot($('editor-tools'),$('kn-cover-tools'));
  slot(p3.querySelector('.cover-export'),$('kn-cover-tools'));
  // Os detalhes de plataforma ficam na aba Postar, para o player ficar livre.
  // O painel de identidade permaneceu na página original sem alterações.
  document.body.classList.add('kn-landscape-on');
  mount.hidden=false;
  refreshMediaPlaceholder();
  setTab(tab);
  requestAnimationFrame(()=>window.KN?.cover?.draw());
 }
 function leave(){
  if(!active)return;
  if(fullscreenActive())exitFullscreen();
  $('video').pause();
  restore();
  document.body.classList.remove('kn-landscape-on');
  mount.hidden=true;
  active=false;
  requestAnimationFrame(()=>window.KN?.cover?.draw());
 }
 function evalMedia(){if(query.matches)enter();else leave();}
 // Hoist a helper with explicit lexical scope to avoid depending on globals.
 function $(id){return document.getElementById(id);}
 function format(sec){if(!Number.isFinite(sec)||sec<0)return '00:00';const n=Math.floor(sec);const h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
 function syncTimeline(){
  const v=$('video'),valid=Number.isFinite(v.duration)&&v.duration>0;
  $('kn-seek').disabled=!valid;
  $('kn-seek').value=valid?String(Math.round(1000*v.currentTime/v.duration)):'0';
  $('kn-timeline-time').textContent=format(v.currentTime)+' / '+format(v.duration);
  $('kn-timeline-end').textContent=format(v.duration);
  $('kn-play').textContent=v.paused?'▶':'Ⅱ';
  $('kn-mute').textContent=v.muted?'🔇':'🔊';
  refreshMediaPlaceholder();
 }
 function init(){
  const v=$('video');
  for(const name of ['video','cover','post'])$('kn-tab-'+name).addEventListener('click',()=>setTab(name));
  $('kn-play').addEventListener('click',()=>{if(!v.getAttribute('src'))return;v.paused?v.play().catch(()=>{}):v.pause();syncTimeline();});
  $('kn-back').textContent='↶';$('kn-forward').textContent='↷';
  $('kn-back').addEventListener('click',()=>{if(Number.isFinite(v.duration))v.currentTime=Math.max(0,v.currentTime-5);});
  $('kn-forward').addEventListener('click',()=>{if(Number.isFinite(v.duration))v.currentTime=Math.min(v.duration,v.currentTime+5);});
  $('kn-mute').addEventListener('click',()=>{v.muted=!v.muted;syncTimeline();});
  $('kn-fullscreen').addEventListener('click',enterFullscreen);
  $('kn-fullscreen-exit').addEventListener('click',exitFullscreen);
  ['fullscreenchange','webkitfullscreenchange'].forEach(name=>document.addEventListener(name,syncFullscreen));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&fullscreenActive())exitFullscreen();});
  $('kn-tools-top').addEventListener('click',()=>{$('kn-landscape-tools').scrollTo({top:0,behavior:'smooth'});});
  $('kn-tools-wide').addEventListener('click',()=>{
   const expanded=mount.classList.toggle('kn-tools-wide');
   $('kn-tools-wide').textContent=expanded?'⤡ Reduzir':'⤢ Ampliar';
   $('kn-tools-wide').setAttribute('aria-pressed',String(expanded));
   requestAnimationFrame(()=>window.KN?.cover?.draw());
  });
  $('video-file').addEventListener('change',()=>{
   // Aguarda a seleção do arquivo refletir no <video>, depois atualiza o placeholder.
   requestAnimationFrame(refreshMediaPlaceholder);
  });
  $('kn-seek').addEventListener('input',e=>{if(Number.isFinite(v.duration)&&v.duration>0)v.currentTime=Number(e.target.value)*v.duration/1000;});
  ['loadedmetadata','timeupdate','durationchange','play','pause','seeked','emptied','error'].forEach(event=>v.addEventListener(event,syncTimeline));
  query.addEventListener?.('change',evalMedia);
  if(!query.addEventListener)query.addListener(evalMedia);
  evalMedia();syncTimeline();syncFullscreen();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
