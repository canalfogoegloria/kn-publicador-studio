/* KN Publicador Studio V3.7.1 — UI do YouTube. Sem credenciais, sem armazenamento de tokens.
   O HTML aberto via arquivo local mostra estado desabilitado. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const state={online:false,authenticated:false,configured:false,csrf:null,profiles:{},uploading:false,server:null};
const currentProfile=()=> $('profile')?.value || '';
const known=['Fogo & Glória','Midnight Blues & Soul'];
async function request(path,method='GET',data){
 const options={method,credentials:'same-origin',headers:{'Accept':'application/json'}};
 if(method!=='GET'){options.headers['X-KN-CSRF']=state.csrf||'';options.headers['Content-Type']='application/json';options.body=JSON.stringify(data||{});}
 const r=await fetch(path,options);let body;try{body=await r.json();}catch{body={error:'O servidor retornou dados inesperados.'};}
 if(!r.ok)throw Error(body.error||('Erro HTTP '+r.status));return body;
}
function label(text,klass=''){
 const el=$('kn-yt-status');el.textContent=text;el.className='kn-youtube-badge '+klass;
}
function message(s){$('kn-yt-message').textContent=s;}
function onButton(id,cb){$(id)?.addEventListener('click',cb);}
function setLink(id,url,labelText){const parent=$(id);parent.replaceChildren();if(!url)return;
 const link=document.createElement('a');link.textContent=labelText;link.href=url;link.target='_blank';link.rel='noopener noreferrer';parent.append(link);
}
function update(){
 const profile=currentProfile(),info=state.profiles?.[profile]||{state:'disconnected'};
 $('kn-yt-profile').textContent=profile;
 const ready=state.online&&state.authenticated&&state.configured&&known.includes(profile);
 $('kn-yt-connect').disabled=!ready||info.state==='linked'||state.uploading;
 $('kn-yt-login').hidden=!state.online||state.authenticated||!state.server?.authRequired;
 $('kn-yt-pending').hidden=!(ready&&info.state==='pending');
 $('kn-yt-connected').hidden=!(ready&&info.state==='linked');
 if(info.state==='pending'){
  $('kn-yt-found-name').textContent=info.name||'Canal encontrado';
  $('kn-yt-found-id').textContent='ID oficial: '+(info.id||'');
  $('kn-yt-confirm-profile').textContent=profile;
  $('kn-yt-confirm-check').disabled=!info.match;
  $('kn-yt-confirm').disabled=!info.match||!$('kn-yt-confirm-check').checked||state.uploading;
 }
 if(info.state==='linked'){
  $('kn-yt-linked-name').textContent=info.name||'Canal conectado';
  $('kn-yt-linked-id').textContent='ID oficial: '+(info.id||'');
 }
 const draft=window.KN?.youtubeDraft?.();
 const canUpload=ready&&info.state==='linked'&& !!draft?.file && !!String(draft?.title||'').trim()&&['yes','no'].includes($('kn-yt-kids').value)&&$('kn-yt-review-check').checked&&!state.uploading;
 $('kn-yt-upload').disabled=!canUpload;
 if(!state.online){label('Servidor não conectado','warn');message('Este HTML está funcionando como editor local. Para vincular o YouTube, é preciso executar o servidor seguro e cadastrar OAuth no Google Cloud. Nenhum vídeo foi enviado.');return;}
 if(!state.authenticated){label('Painel protegido','warn');message('Entre com a senha do painel privado no servidor para continuar.');return;}
 if(!state.configured){label('Google não configurado','warn');message('Servidor encontrado, mas faltam credenciais OAuth do Google Cloud no servidor. Nada deve ser digitado no HTML.');return;}
 if(!known.includes(profile)){label('Perfil personalizado','warn');message('Para integrar outro canal, cadastre primeiro um perfil oficial e seu destino autorizado.');return;}
 if(info.state==='pending'){label(info.match?'Confirmação necessária':'Canal diferente — conexão bloqueada','warn');message(info.match?`O Google autorizou “${info.name}”. Confira o ID e confirme somente se corresponde a ${profile}.`:`O Google autorizou somente “${info.name}”, e não “${profile}”. Não é possível escolher outro canal apenas mudando o nome no KN. Use “Conectar com Google” para tentar autorizar o canal correto. Se o Google não oferecer a troca de canal, verifique as permissões do canal/Conta de Marca no YouTube.`);return;}
 if(info.state==='linked'){label('Conexão confirmada','ready');message(`Canal “${info.name}” associado a ${profile}. O envio continua sempre privado e exige sua confirmação para cada vídeo.`);return;}
 label('Aguardando conexão');message('Nenhuma conta conectada a este perfil. Use “Conectar com Google” e selecione o canal correto.');
}
async function loadSession(){
 if(location.protocol==='file:'){state.online=false;update();return;}
 try{
  const server=await fetch('/api/session',{credentials:'same-origin',headers:{Accept:'application/json'}});
  if(!server.ok)throw Error('API indisponível');
  const data=await server.json();if(typeof data.authenticated!=='boolean')throw Error('Resposta diferente da API KN');
  state.online=true;state.server=data;state.authenticated=data.authenticated;state.configured=data.configured;state.csrf=data.csrf;
  if(state.authenticated)await refreshStatus();else update();
 }catch{state.online=false;state.authenticated=false;state.profiles={};update();}
}
async function refreshStatus(){
 try{const info=await request('/api/youtube/status');state.configured=info.configured;state.profiles=info.profiles||{};state.authenticated=info.authenticated;update();
  if(info.error)message(info.error);
 }catch(err){state.profiles={};message('Não foi possível consultar o servidor: '+err.message);update();}
}
async function doLogin(){const password=$('kn-yt-password').value;if(!password){message('Informe a senha do painel privado.');return;}
 try{const r=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const body=await r.json();if(!r.ok)throw Error(body.error||'Acesso negado');$('kn-yt-password').value='';await loadSession();}
 catch(e){message('Não foi possível entrar: '+e.message);}
}
async function confirmChannel(){const p=currentProfile(),entry=state.profiles?.[p];if(!entry||entry.state!=='pending'||!$('kn-yt-confirm-check').checked)return;
 try{await request('/api/youtube/confirm','POST',{profile:p,channelId:entry.id,confirm:true});$('kn-yt-confirm-check').checked=false;await refreshStatus();}
 catch(e){message('Não foi possível confirmar: '+e.message);}
}
async function disconnect(){const p=currentProfile(),entry=state.profiles?.[p];if(!entry||entry.state!=='linked')return;
 if(!confirm(`Desconectar o canal “${entry.name}” do perfil “${p}”?`))return;
 try{await request('/api/youtube/disconnect','POST',{profile:p});$('kn-yt-review-check').checked=false;await refreshStatus();}
 catch(e){message('Falha ao desconectar: '+e.message);}
}
async function doUpload(){if($('kn-yt-upload').disabled)return;
 const data=window.KN?.youtubeDraft?.(),entry=state.profiles?.[data.profile];
 if(!data?.file||!entry||entry.state!=='linked')return;
 if(!['yes','no'].includes($('kn-yt-kids').value))return;
 if(!confirm(`ENVIAR COMO PRIVADO?\n\nCanal: ${entry.name}\nPerfil: ${data.profile}\nVídeo: ${data.file.name}\nTítulo: ${data.title}\n\nO vídeo ficará PRIVADO para revisão no YouTube Studio.`))return;
 state.uploading=true;update();$('kn-yt-result').hidden=true;const progress=$('kn-yt-progress-wrap');progress.hidden=false;progressLabel(0);
 try{
  message('Preparando sessão de envio privado com o YouTube…');
  const init=await request('/api/youtube/upload/init','POST',{profile:data.profile,fileName:data.file.name,fileSize:data.file.size,mime:data.file.type||'video/mp4',title:data.title,description:data.description,tags:data.tags,madeForKids:$('kn-yt-kids').value==='yes',confirmPrivate:true});
  if(init.channelId!==entry.id||init.privacy!=='private')throw Error('Canal ou privacidade do envio divergente. Envio cancelado.');
  message('Enviando arquivo original ao YouTube como privado…');
  const result=await transferFile(init.uploadId,data.file);
  if(result.privacy!=='private'||!result.id)throw Error('O YouTube não confirmou o envio privado. Confira no Studio.');
  $('kn-yt-result').replaceChildren();
  const strong=document.createElement('strong');strong.textContent='✓ Vídeo enviado como PRIVADO. ';$('kn-yt-result').append(strong);
  if(/^https:\/\/studio\.youtube\.com\/video\/[\w-]+\/edit$/.test(result.studioUrl)){const a=document.createElement('a');a.href=result.studioUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Abrir no YouTube Studio para revisar';$('kn-yt-result').append(a);}
  $('kn-yt-result').hidden=false;message('Envio privado confirmado pelo YouTube. Revise antes de tornar público.');
  $('kn-yt-review-check').checked=false;
  await refreshStatus();
 }catch(e){message('Não foi possível concluir o envio: '+e.message+' Se houve perda de conexão, confira o YouTube Studio antes de tentar de novo.');}
 finally{state.uploading=false;update();}
}
function progressLabel(p){$('kn-yt-progress-bar').style.width=p+'%';$('kn-yt-progress-text').textContent=p+'%';}
function transferFile(uploadId,file){
 return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();xhr.open('PUT','/api/youtube/upload/'+encodeURIComponent(uploadId),true);
  xhr.responseType='json';xhr.setRequestHeader('X-KN-CSRF',state.csrf||'');xhr.setRequestHeader('Content-Type',file.type||'video/mp4');
  xhr.upload.addEventListener('progress',e=>{if(e.lengthComputable)progressLabel(Math.min(99,Math.round(100*e.loaded/e.total)));});
  xhr.onload=()=>{const data=xhr.response||{};if(xhr.status===200){progressLabel(100);resolve(data);}else reject(Error(data.error||'Falha HTTP '+xhr.status));};
  xhr.onerror=()=>reject(Error('Conexão interrompida durante upload.'));
  xhr.onabort=()=>reject(Error('Envio cancelado.'));
  xhr.send(file);
 });
}
function init(){
 onButton('kn-yt-refresh',loadSession);onButton('kn-yt-login-button',doLogin);
 onButton('kn-yt-connect',()=>{if($('kn-yt-connect').disabled)return;window.location.href='/api/youtube/connect?profile='+encodeURIComponent(currentProfile());});
 onButton('kn-yt-confirm',confirmChannel);onButton('kn-yt-disconnect',disconnect);onButton('kn-yt-upload',doUpload);
 $('kn-yt-confirm-check').addEventListener('change',update);$('kn-yt-review-check').addEventListener('change',update);
 $('kn-yt-kids').addEventListener('change',update);
 $('profile').addEventListener('change',()=>{$('kn-yt-confirm-check').checked=false;$('kn-yt-review-check').checked=false;update();});
 for(const n of ['video-file','topic']){ $(n)?.addEventListener('change',update);$(n)?.addEventListener('input',update); }
 $('metadata-list')?.addEventListener('input',update);
 $('kn-yt-password').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
 window.KN.youtubeUI={refresh:update};
 if(location.hash==='#youtube-connect'){$('kn-youtube-panel').scrollIntoView({block:'center'});history.replaceState(null,'',location.pathname);}
 update();loadSession();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
