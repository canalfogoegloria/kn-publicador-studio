/* V3.5 — Captura rápida, importação de imagem e zoom da prévia do vídeo. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
let scale=1;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function setZoom(n){scale=clamp(n,1,3);$('kn-zoom').value=String(Math.round(scale*100));$('kn-zoom-label').textContent=Math.round(scale*100)+'%';
 // O zoom é de inspeção e NÃO altera a resolução nem os pixels do arquivo original.
 const video=$('video');video.style.transform='scale('+scale+')';video.style.transformOrigin='center';}
function init(){
 const v=$('video');const range=$('kn-zoom');let points=new Map(),base=1,dist0=0;
 range.addEventListener('input',()=>setZoom(Number(range.value)/100));$('kn-zoom-reset').addEventListener('click',()=>setZoom(1));
 $('kn-capture-frame').addEventListener('click',()=>{try{
  if(!v.videoWidth)throw Error('Importe um vídeo e escolha um quadro.');
  v.pause();$('capture').click();
  if(document.body.classList.contains('kn-landscape-on'))$('kn-tab-cover').click();
 }catch(e){$('toast').textContent=e.message;$('toast').classList.add('show');}});
 $('kn-add-picture').addEventListener('click',()=>$('cover-image').click());
 $('cover-image').addEventListener('change',()=>{
  if(document.body.classList.contains('kn-landscape-on') && $('cover-image').files.length)$('kn-tab-cover').click();
 });
 // Multi-toque para inspecionar o vídeo: ampliar/reduzir mantendo o controle de tempo original.
 v.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){
  points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===2){const p=[...points.values()];dist0=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1;base=scale;}
 }});
 v.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===2){const p=[...points.values()];setZoom(base*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/dist0);}});
 const stop=e=>points.delete(e.pointerId);['pointerup','pointercancel','lostpointercapture'].forEach(name=>v.addEventListener(name,stop));
 v.addEventListener('loadedmetadata',()=>setZoom(1));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();