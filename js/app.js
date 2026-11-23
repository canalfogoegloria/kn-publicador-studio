/* Módulo 06 — Aplicativo; sem chamadas externas, sem credenciais, sem upload automático. */
(function(){
 'use strict';
 const KN=window.KN;const $=id=>document.getElementById(id);
 const selected=new Set(['youtube','shorts','facebook','instagram','tiktok']);
 let data={},videoUrl=null,videoInfo={},toastTimeout=null;
 const escape=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const el=(tag,txt)=>{const node=document.createElement(tag);if(txt!==undefined)node.textContent=txt;return node};
 const val=id=>$(id).value;
 function notify(message){const box=$('toast');box.textContent=message;box.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>box.classList.remove('show'),3600);}
 function platformName(id){return KN.config.platforms.find(x=>x.id===id)?.name||id}
 function toSlug(s){return String(s||'conteudo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,55).toLowerCase()||'conteudo'}
 function downloadBlob(data,filename,type){const blob=data instanceof Blob?data:new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
 function info(){return {profile:val('profile'),owner:KN.seo.clean(val('owner')),topic:KN.seo.clean(val('topic')),summary:KN.seo.clean(val('summary')),videoName:videoInfo.name||null,videoDurationSeconds:videoInfo.duration||null,videoWidth:videoInfo.width||null,videoHeight:videoInfo.height||null,coverResolution:KN.quality.targets[val('ratio')]||null,coverFormat:val('ratio'),coverText:val('cover-text'),publishDate:val('publish-date'),publishTime:val('publish-time'),platforms:[...selected]};}
 function currentPackage(){const body=info();return {schemaVersion:'3.0',generatedAt:new Date().toISOString(),appIdentity:{appName:KN.config.appName,appVersion:KN.config.version,ownerDeclared:body.owner||null,officialAppIdsConfigured:false,authStatus:'NOT_CONNECTED',verifiedByPlatforms:false,important:'Este bloco local NÃO é enviado como sinal de recomendação às plataformas. A identidade efetiva exige OAuth e IDs oficiais.'},content:body,metadata:Object.fromEntries([...selected].map(k=>[k,data[k]||{}])),animation:KN.motion.snapshot(),postingStatus:'DRAFT_ONLY_NOT_UPLOADED'};}
 function allowedPlatforms(){const p=val('profile');return new Set(p==='Midnight Blues & Soul'?['youtube','shorts']:p==='Fogo & Glória'?['youtube','shorts','facebook','instagram','tiktok']:[]);}
 function buildPlatforms(){
  const allowed=allowedPlatforms();for(const id of [...selected])if(!allowed.has(id))selected.delete(id);
  const box=$('platform-list');box.replaceChildren();
  for(const p of KN.config.platforms){const label=el('label');label.className='platform-check';const input=document.createElement('input');input.type='checkbox';input.checked=selected.has(p.id);input.disabled=!allowed.has(p.id);label.title=input.disabled?'Rede não cadastrada neste perfil':p.name;input.addEventListener('change',()=>{input.checked?selected.add(p.id):selected.delete(p.id);renderMetadata();});const span=el('span',p.name);label.append(input,span);box.append(label)}
  const connector=$('connector-list');connector.replaceChildren();
  for(const p of KN.config.platforms){const row=el('div');row.className='connector';const name=el('strong',p.name);const status=el('small',KN.connectors.list[p.id]);row.append(name,status);connector.append(row)}
 }
 function renderMetadata(){
  const target=$('metadata-list');target.replaceChildren();
  if(!selected.size){const empty=el('div','Selecione pelo menos uma plataforma.');empty.className='empty';target.append(empty);return;}
  let count=0;
  for(const id of selected){if(!data[id])continue;count++;
   const card=el('article');card.className='meta-card';const head=el('div');head.className='meta-head';head.append(el('strong',platformName(id)),el('small','EDITÁVEL • NÃO PUBLICADO'));card.append(head);
   const fields=el('div');fields.className='meta-fields';
   for(const [prop,labelText] of [['title','Título / frase de destaque'],['description','Descrição / legenda'],['hashtags','Hashtags'],['tags','Tags (quando aplicável)'],['cta','Chamada para ação']]){
    if(prop==='tags'&&!['youtube','shorts'].includes(id))continue;
    const label=el('label',labelText);const input=(prop==='description')?document.createElement('textarea'):document.createElement('input');
    if(prop==='description')input.rows=5;else input.type='text';
    input.value=data[id][prop]||'';input.addEventListener('input',()=>{data[id][prop]=input.value;});label.append(input);fields.append(label);
   }
   card.append(fields);const actions=el('div');actions.className='meta-actions';const copy=el('button','Copiar esta rede');copy.type='button';copy.className='secondary';copy.addEventListener('click',()=>copyText(composeText(id,data[id])));actions.append(copy);card.append(actions);target.append(card);
  }
  if(!count){const empty=el('div','Clique em “Gerar sugestões” para preparar os textos das plataformas selecionadas.');empty.className='empty';target.append(empty)}
 }
 function composeText(id,row){return `${platformName(id)}\n\nTÍTULO: ${row.title||''}\n\nDESCRIÇÃO:\n${row.description||''}\n\nHASHTAGS: ${row.hashtags||''}${row.tags?'\n\nTAGS: '+row.tags:''}\n\nCTA: ${row.cta||''}`;}
 async function copyText(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text)}else{const area=el('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();if(!document.execCommand('copy'))throw Error('Sem permissão para copiar');area.remove()}notify('Texto copiado.')}catch(e){notify('Não foi possível copiar neste navegador. Use a exportação TXT.')}}
 function generate(){if(!val('topic').trim()){notify('Escreva o tema do vídeo antes de gerar os textos.');$('topic').focus();return;}
  const fresh=KN.seo.generate(val('topic'),val('summary'),val('profile'));for(const id of selected)data[id]=fresh[id];renderMetadata();if(!val('cover-text').trim())$('cover-text').value=val('topic');renderCover();notify('Sugestões preparadas. Revise antes de publicar.');}
 function renderCover(){try{KN.cover.render($('cover'),{profile:val('profile'),ratio:val('ratio'),text:val('cover-text')||val('topic')||'NOVO CONTEÚDO'});}catch(e){notify('Não foi possível gerar a capa: '+e.message)}}
 function createVideoPreview(file){
  if(videoUrl)URL.revokeObjectURL(videoUrl);videoUrl=null;videoInfo={};const video=$('video');
  video.pause();video.removeAttribute('src');video.load();KN.cover.clear();
  const quality=$('video-quality');quality.className='quality-indicator';
  if(!file){video.hidden=true;$('file-name').textContent='Escolher vídeo do dispositivo';quality.textContent='Vídeo ainda não selecionado • o original será preservado sem alteração.';renderCover();return;}
  videoInfo={name:file.name,sizeBytes:file.size,mimeType:file.type};$('file-name').textContent=file.name;
  videoUrl=URL.createObjectURL(file);video.src=videoUrl;video.hidden=false;
  video.addEventListener('loadedmetadata',()=>{
   videoInfo.duration=Number.isFinite(video.duration)?Math.round(video.duration):null;
   videoInfo.width=video.videoWidth;videoInfo.height=video.videoHeight;
   const result=KN.quality.check(videoInfo.width,videoInfo.height);
   quality.className='quality-indicator '+(result.ok?'ok':'warn');
   quality.textContent=`Vídeo original: ${result.width} × ${result.height} px • ${result.label}. Meta do formato ${result.ratio}: ${result.target}. Nenhuma recompressão na V3.`;
   if(result.ratio!=='1:1'&&result.ratio!==val('ratio')){$('ratio').value=result.ratio;KN.cover.setRatio(result.ratio);}
   notify('Vídeo carregado. Confira a resolução e pause no quadro desejado para a capa.');
  },{once:true});
  video.addEventListener('error',()=>{quality.className='quality-indicator warn';quality.textContent='O navegador não conseguiu ler este vídeo. O arquivo original não foi alterado.';notify('O navegador não conseguiu reproduzir este arquivo. Tente MP4 (H.264).');},{once:true});
  renderCover();
 }
 function downloadCover(){try{const canvas=KN.cover.exportCanvas(),d=KN.quality.targets[val('ratio')];
  const file=toSlug(val('topic'))+'_'+d.w+'x'+d.h+'.png';
  canvas.toBlob(blob=>{if(blob){downloadBlob(blob,file,'image/png');notify(`Capa PNG ${d.w} × ${d.h} exportada sem controles de seleção.`);}else notify('Falha ao gerar PNG.');},'image/png');
 }catch(e){notify('Não foi possível exportar a capa: '+e.message)}}
 function saveDraft(){const body={info:info(),metadata:data,cover:KN.cover.serialize()};if(KN.storage.set('draft',body))notify('Rascunho salvo neste navegador (sem o vídeo).');else notify('Este navegador não permitiu salvar o rascunho.');}
 function restoreDraft(){const draft=KN.storage.get('draft',null);if(!draft?.info)return;
  if(draft.info.profile==='Kingdom Fire')draft.info.profile='Midnight Blues & Soul';
  for(const [key,id] of [['profile','profile'],['owner','owner'],['topic','topic'],['summary','summary'],['coverFormat','ratio'],['coverText','cover-text'],['publishDate','publish-date'],['publishTime','publish-time']])if(draft.info[key]!==undefined)$(id).value=draft.info[key];
  selected.clear();for(const id of draft.info.platforms||[])if(KN.config.platforms.some(p=>p.id===id))selected.add(id);data=draft.metadata||{};videoInfo={name:draft.info.videoName||null,duration:draft.info.videoDurationSeconds||null};
  if(videoInfo.name)$('file-name').textContent=videoInfo.name+' — selecione novamente para prévia';
 }
 function addPlan(){if(!val('topic').trim()){notify('Informe o tema primeiro.');return;}if(!val('publish-date')){notify('Escolha uma data planejada.');return;}if(!selected.size){notify('Selecione pelo menos uma rede.');return;}
  const queue=KN.storage.get('queue',[]);queue.push({id:String(Date.now())+'-'+Math.floor(Math.random()*10000),title:val('topic'),profile:val('profile'),date:val('publish-date'),time:val('publish-time'),platforms:[...selected],status:'PLANEJADO LOCALMENTE'});
  if(KN.storage.set('queue',queue)){renderQueue();notify('Planejamento registrado. O aplicativo NÃO vai publicar sozinho.')}else notify('O navegador não permitiu salvar este planejamento.');
 }
 function renderQueue(){const list=$('queue-list');list.replaceChildren();const queue=KN.storage.get('queue',[]);if(!queue.length){const empty=el('div','Nenhuma publicação planejada neste navegador.');empty.className='empty';list.append(empty);return;}
  for(const item of queue){const row=el('div');row.className='queue-item';const main=el('div');main.append(el('strong',item.title));main.append(el('small',`${item.date||''} ${item.time||''} • ${(item.platforms||[]).map(platformName).join(', ')} • ${item.status}`));const remove=el('button','Remover');remove.className='ghost';remove.setAttribute('aria-label','Remover planejamento '+item.title);remove.addEventListener('click',()=>{KN.storage.set('queue',KN.storage.get('queue',[]).filter(x=>x.id!==item.id));renderQueue()});row.append(main,remove);list.append(row)}
 }
 function buildTxt(){const pack=currentPackage();let out=`KN PUBLICADOR STUDIO — V3.7\n${pack.content.topic}\nCanal: ${pack.content.profile}\nCriador declarado: ${pack.content.owner||'Não informado'}\n\nRASCUNHO LOCAL — NÃO PUBLICADO\n\n`;
  for(const id of selected)if(data[id])out+=composeText(id,data[id])+'\n\n'+'-'.repeat(36)+'\n\n';return out;}
 KN.youtubeDraft=()=>({
   profile:val('profile'),
   file:$('video-file').files?.[0]||null,
   topic:val('topic').trim(),
   title:(data.youtube?.title||data.shorts?.title||val('topic')).trim(),
   description:(()=>{const d=data.youtube||data.shorts||{};let t=String(d.description||val('summary')).trim();const tags=String(d.hashtags||'').trim();if(tags&&!t.includes(tags))t+=(t?'\n\n':'')+tags;return t;})(),
   tags:Array.isArray(data.youtube?.tags)?data.youtube.tags:String(data.youtube?.tags||'').split(',').map(s=>s.trim()).filter(Boolean)
 });
 function init(){restoreDraft();KN.cover.init({toast:notify});KN.motion.init({notify,download:downloadBlob});KN.cover.restore(KN.storage.get('draft',null)?.cover);buildPlatforms();renderMetadata();renderCover();renderQueue();
  $('owner-display').textContent=val('owner').trim()||'Não informado';
  $('owner').addEventListener('input',()=>$('owner-display').textContent=val('owner').trim()||'Não informado');
  $('video-file').addEventListener('change',e=>createVideoPreview(e.target.files?.[0]));
  $('profile').addEventListener('change',()=>{KN.cover.setProfile(val('profile'));buildPlatforms();renderMetadata();});$('ratio').addEventListener('change',()=>KN.cover.setRatio(val('ratio')));$('cover-text').addEventListener('input',()=>KN.cover.setMainText(val('cover-text')));
  $('generate').addEventListener('click',generate);$('render-cover').addEventListener('click',renderCover);
  $('capture').addEventListener('click',()=>{try{KN.cover.capture($('video'));renderCover();notify('Quadro capturado para a capa.');}catch(e){notify(e.message)}});
  $('download-cover').addEventListener('click',downloadCover);$('save').addEventListener('click',saveDraft);
  $('copy-all').addEventListener('click',()=>{if(!Object.keys(data).length){notify('Gere as sugestões antes de copiar.');return;}copyText(buildTxt())});
  $('export').addEventListener('click',()=>{downloadBlob(JSON.stringify(currentPackage(),null,2),toSlug(val('topic'))+'_metadados.json','application/json;charset=utf-8');notify('Metadados exportados.');});
  $('export-txt').addEventListener('click',()=>{downloadBlob(buildTxt(),toSlug(val('topic'))+'_publicacoes.txt','text/plain;charset=utf-8');notify('Textos exportados.');});
  $('add-plan').addEventListener('click',addPlan);$('clear-plan').addEventListener('click',()=>{KN.storage.remove('queue');renderQueue();notify('Planejamento local apagado.')});
  $('clear-draft').addEventListener('click',()=>{KN.storage.remove('draft');notify('Rascunho armazenado apagado; os campos atuais continuam até recarregar.');});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
