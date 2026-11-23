/* V3.6 — Teclado KN para celular, com sugestões e autocorreção conservadora off-line.
   Sem dependências, rede, permissão de teclado ou troca de foco para fora da capa. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const phone=()=>matchMedia('(pointer: coarse) and (max-width: 1150px)').matches;
const clean=w=>String(w||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const alias=new Map(Object.entries({
 'oracao':'oração','oracoes':'orações','coracao':'coração','coracoes':'corações','voce':'você','voces':'vocês',
 'nao':'não','tambem':'também','gloria':'glória','fe':'fé','biblia':'Bíblia','alem':'além',
 'esperanca':'esperança','musica':'música','video':'vídeo','videos':'vídeos','ceu':'céu','ceu':'céu',
 'jesuz':'Jesus','jessus':'Jesus','deuss':'Deus','milagres':'milagres','amanha':'amanhã',
 'elegancia':'elegância','historia':'história','historias':'histórias','vozes':'vozes','lazaro':'Lázaro',
 'paralitico':'paralítico','familia':'família','sao':'são','irmao':'irmão','irmaos':'irmãos',
 'cristao':'cristão','crista':'cristã','salvacao':'salvação','profecia':'profecia',
 'sabado':'sábado','domingo':'domingo','tres':'três','so':'só','irma':'irmã','amor':'amor'
}));
const words=`Deus Jesus Cristo Senhor Espírito Santo oração glória fé graça milagre vitória amor esperança bênção coração salvação paz alegria vida família luz força louvor adoração poder promessa caminho verdade libertação céu reino bíblia palavra renovo cura cuidado santo santos santidade música vídeo vídeos imagem capa texto título descrição hashtag compartilhar seguir assistir completo hoje amanhã ontem agora sempre nunca ainda juntos tudo todos todas muito muita gente mundo história histórias emocionante emocionante sentir Deus pai filho mãe amigo amiga amigos amigas mulher homem criança crianças manhã tarde noite semana tempo momento momentos lágrima lágrimas chorar sorrir felicidade feliz tristeza dor passou passar vencer venceu vitória vitória grande pequeno novo nova forte poder poderoso poderosa impossível possível recomeço saúde chuva neve luzes brilho brilhante caminho fé obrigado obrigada obrigado obrigado glória grande profundo profunda salmo música blues soul cantar canção canções obrigado amen amém realmente incrível especial lindos bonitas bonito bonita lindo original criador conteúdo você vocês nós não sim também coração oração orações graças alegria bondade misericórdia eterno eternidade meu minha meus minhas seu sua suas seus esperança descansar dormindo acordar despertar Deus trabalhou obra Deus Jesus hoje mundo piano violão guitarra abrir porta portas livre feliz seguidores vídeo completo assista Jesus cura paralítico Lázaro Maria José Paulo Silas Jerusalém Deus Deus Senhor felicidade ontem antes depois aqui lá sem mais menor melhor pior pessoas nosso nossa nossos nossas já até às os as do da de dos das no na aos com por para em muito difícil fácil está estão será foram foi será temos fazer vamos eu você ele ela nós eles elas seu são será porque quando quem onde como qual quais grande exemplo mensagem autor autora texto letras letra fonte fontes tamanho posição aumentar diminuir mover movimento animado publicar publicado publicação canal rede redes reels shorts tiktok kwai facebook instagram youtube`.split(/\s+/).filter(Boolean);
const dictionary=[...new Set([...words,...alias.values()])];
const rows=['qwertyuiop','asdfghjkl','zxcvbnm'];
let opened=false, symbols=false, shift=true, correct=true, suggestionWords=[];
let target=null,host=null,openBtn=null, autBtn=null;
let drawer=null, shortcutTab=null, shortcutCategory='', shortcutPlatform='youtube';
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
function key(txt,handler,cls=''){
 const b=make('button','kn-kbd-key '+cls,txt);b.type='button';b.setAttribute('aria-label',txt);
 b.addEventListener('pointerdown',e=>e.preventDefault()); b.addEventListener('click',handler);return b;
}
function focusTarget(){if(!target)return;target.focus({preventScroll:true});}
function replaceAt(start,end,val){
 if(!target)return;
 const next=target.value.slice(0,start)+val+target.value.slice(end);
 const limit=target.maxLength>0?target.maxLength:20000;if(next.length>limit)return;
 target.setRangeText(val,start,end,'end');
 target.dispatchEvent(new Event('input',{bubbles:true}));
 suggestionRefresh();
}
function insert(txt){
 if(!target)return;
 const s=target.selectionStart??target.value.length,e=target.selectionEnd??s;
 replaceAt(s,e,txt);focusTarget();
}
function backspace(){
 if(!target)return;
 let s=target.selectionStart??target.value.length,e=target.selectionEnd??s;
 if(s===e&&s>0){const prefix=[...target.value.slice(0,s)];const ch=prefix.pop();s-=ch?.length||1;}
 replaceAt(s,e,'');focusTarget();
}
function currentWord(){
 if(!target)return null;
 const value=target.value,s=target.selectionStart??value.length,e=target.selectionEnd??s;
 const pre=value.slice(0,s).match(/[\p{L}]+$/u),post=value.slice(e).match(/^[\p{L}]*/u);
 if(!pre)return null;
 return {start:s-pre[0].length,end:e+(post?.[0]?.length||0),text:pre[0] +(post?.[0]||'')};
}
function lev(a,b){
 if(Math.abs(a.length-b.length)>2)return 3;
 let prev=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  let curr=[i];for(let j=1;j<=b.length;j++)curr[j]=Math.min(curr[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=curr;
 }return prev[b.length];
}
function suggestions(word){
 const norm=clean(word),list=[];
 if(!norm||norm.length<2)return [];
 if(alias.has(norm))list.push(alias.get(norm));
 for(const item of dictionary){
  const n=clean(item);if(n===norm&&item!==word)list.push(item);
 }
 if(word.length>=3){
  const found=[];
  for(const item of dictionary){
   const n=clean(item);
   if(Math.abs(n.length-norm.length)>2||Math.abs(n.length-norm.length)===0&&n[0]!==norm[0])continue;
   const d=lev(norm,n);
   if(d>0&&d<= (word.length>5?2:1))found.push({item,d});
  }
  found.sort((a,b)=>a.d-b.d || a.item.length-b.item.length);
  list.push(...found.slice(0,5).map(v=>v.item));
 }
 return [...new Set(list)].filter(v=>v!==word).slice(0,3);
}
function suggestionRefresh(){
 if(!host)return;const feedback=host.querySelector('.kn-kbd-feedback');if(feedback){feedback.textContent=(target?.value||'').slice(-180)||'Digite seu texto…';}
 const bar=host.querySelector('.kn-kbd-word-suggest'); if(!bar)return;bar.replaceChildren();
 const w=currentWord(), opts=w?suggestions(w.text):[];suggestionWords=opts;if(!opts.length)return;
 for(let i=0;i<3;i++){
  const word=opts[i];let b=key(word||'—',()=>{
   if(!word)return;
   const w=currentWord();if(w)replaceAt(w.start,w.end,word);focusTarget();
  });b.disabled=!word;bar.appendChild(b);
 }
}
function insertSpace(){
 const w=currentWord();
 // A substituição automática é deliberadamente restrita a pares conhecidos.
 if(correct&&w&&alias.has(clean(w.text))){
  const suggestion=alias.get(clean(w.text));
  if(clean(w.text)!==clean(suggestion)||w.text!==suggestion){
   const transformed=/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/u.test(w.text)?suggestion[0].toUpperCase()+suggestion.slice(1):suggestion;
   replaceAt(w.start,w.end,transformed);
  }
 }
 insert(' ');shift=false;drawKeys();
}
function drawKeys(){
 const keys=host.querySelector('.kn-kbd-keys');keys.replaceChildren();
 const layout=symbols?['1234567890','@#$%&*()-','?!:;\'+/=_']:rows;
 for(let i=0;i<layout.length;i++){
  const r=make('div','kn-kbd-row');
  if(i===2)r.append(key(symbols?'ABC':'⇧',()=>{if(symbols)symbols=false;else shift=!shift;drawKeys()},'kn-kbd-special'));
  for(const ch of layout[i]){
   r.append(key(!symbols&&shift?ch.toUpperCase():ch,()=>{
    insert(!symbols&&shift?ch.toUpperCase():ch);
    if(shift&&!symbols)shift=false;
    drawKeys();
   }));
  }
  if(i===2)r.append(key('⌫',backspace,'kn-kbd-special kn-kbd-backspace'));
  keys.append(r);
 }
 const r=make('div','kn-kbd-row');
 r.append(key(symbols?'ABC':'?123',()=>{symbols=!symbols;drawKeys()},'kn-kbd-special kn-kbd-symbols'));
 r.append(key(',',()=>insert(',')));
 r.append(key('Espaço',insertSpace,'kn-kbd-space'));
 r.append(key('.',()=>{insert('.');shift=true;drawKeys()}));
 r.append(key('↵',()=>{insert('\n');shift=true;drawKeys()}));
 r.append(key('✓',close,'kn-kbd-special kn-kbd-done'));
 keys.append(r);
}
function listButton(text,onclick,cls=''){
 const b=key(text,onclick,cls);b.classList.add('kn-kbd-item');return b;
}
function useShortcut(value){
 if(!target)return;
 insert(value);
 shortcutTab=null;drawShortcutDrawer();
}
function layerShortcut(value){
 if(!window.KN?.cover?.addAnimatedCta)return;
 window.KN.cover.addAnimatedCta(value);
 shortcutTab=null;drawShortcutDrawer();
 if(document.body.classList.contains('kn-landscape-on'))document.getElementById('kn-tab-cover')?.click();
}
function selectShortcutTab(tab){
 if(shortcutTab===tab)shortcutTab=null;else{shortcutTab=tab;shortcutCategory='';}
 drawShortcutDrawer();
}
function drawShortcutDrawer(){
 if(!drawer)return;
 const opened=!!shortcutTab;
 drawer.hidden=!opened;
 host?.classList.toggle('kn-kbd-drawer-open',opened);
 const accents=host?.querySelector('.kn-kbd-accents'),letters=host?.querySelector('.kn-kbd-keys'),words=host?.querySelector('.kn-kbd-word-suggest');
 if(accents)accents.hidden=opened;if(letters)letters.hidden=opened;if(words)words.hidden=opened;
 host?.querySelectorAll('.kn-kbd-suggest button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===shortcutTab)));
 if(!opened)return;
 drawer.replaceChildren();
 const lib=window.KN.shortcuts||{},groups=shortcutTab==='emoji'?lib.emojis:shortcutTab==='frase'?lib.frases:null;
 const header=make('div','kn-kbd-drawer-header');header.append(make('strong',null,shortcutTab==='emoji'?'😊 Emojis e símbolos':shortcutTab==='frase'?'💬 Frases prontas':'📣 CTAs por plataforma'));
 header.append(key('⌨ Letras',()=>selectShortcutTab(shortcutTab),'kn-kbd-backletters'));
 drawer.append(header);
 let values=[];
 if(groups){
  const cats=Object.keys(groups);
  if(!cats.includes(shortcutCategory))shortcutCategory=cats[0];
  const nav=make('div','kn-kbd-categories');
  cats.forEach(c=>{const b=key(c,()=>{shortcutCategory=c;drawShortcutDrawer()});if(c===shortcutCategory)b.classList.add('active');nav.append(b)});
  drawer.append(nav);values=groups[shortcutCategory]||[];
 }else{
  const nav=make('div','kn-kbd-categories');
  Object.entries(lib.platformNames||{}).forEach(([id,label])=>{const b=key(label,()=>{shortcutPlatform=id;drawShortcutDrawer()});if(shortcutPlatform===id)b.classList.add('active');nav.append(b)});
  drawer.append(nav);values=lib.ctas?.[shortcutPlatform]||[];
 }
 const container=make('div','kn-kbd-shortcuts');
 values.forEach(v=>{
  const card=make('div','kn-kbd-shortcut');
  card.append(listButton(v,()=>useShortcut(v),'kn-kbd-insert'));
  if(shortcutTab==='cta')card.append(listButton('✦ Na capa',()=>layerShortcut(v),'kn-kbd-to-cover'));
  container.append(card);
 });
 if(shortcutTab==='cta'){
  const prof=document.getElementById('profile')?.value||'';
  if(prof)container.prepend(listButton('🏷 Inserir canal: '+prof,()=>useShortcut(prof),'kn-kbd-profile'));
 }
 drawer.append(container);
}
function render(){
 host.replaceChildren();
 const head=make('div','kn-kbd-head');head.append(make('strong',null,'⌨ Teclado KN'));
 const actions=make('div');
 actions.append(key('A−',()=>{$('text-smaller').click();focusTarget()}));
 actions.append(key('A+',()=>{$('text-larger').click();focusTarget()}));
 autBtn=key('Correção: ligada',()=>{correct=!correct;autBtn.textContent=correct?'Correção: ligada':'Correção: desligada';autBtn.setAttribute('aria-pressed',String(correct));},'kn-kbd-autocorrect');
 autBtn.setAttribute('aria-pressed',String(correct));actions.append(autBtn);
 actions.append(key('Concluir',close,'kn-kbd-done'));
 head.append(actions);host.append(head);
 const feedback=make('div','kn-kbd-feedback');feedback.setAttribute('aria-live','polite');host.append(feedback);
 const tabs=make('div','kn-kbd-suggest');
 for(const [tab,label] of [['emoji','😊 Emojis'],['frase','💬 Frases'],['cta','📣 CTA']]){const b=key(label,()=>selectShortcutTab(tab));b.dataset.tab=tab;b.setAttribute('aria-pressed',String(shortcutTab===tab));tabs.append(b);}
 host.append(tabs);host.append(make('div','kn-kbd-word-suggest'));
 drawer=make('div','kn-kbd-drawer');drawer.hidden=true;host.append(drawer);
 const accent=make('div','kn-kbd-accents');
 for(const letter of 'á à â ã é ê í ó ô õ ú ç Á É Õ'.split(' '))accent.append(key(letter,()=>insert(letter)));
 accent.append(key('😊',()=>insert('😊')));accent.append(key('🙏',()=>insert('🙏')));
 host.append(accent);
 const keys=make('div','kn-kbd-keys');keys.style.cssText='display:flex;flex-direction:column;gap:3px;flex:1;min-height:0';host.append(keys);
 drawKeys();suggestionRefresh();drawShortcutDrawer();
}
function resize(){
 if(!opened)return;
 if(document.body.classList.contains('kn-landscape-on')){
  const tools=$('kn-landscape-tools')?.getBoundingClientRect();
  if(tools){host.style.setProperty('--kn-kb-left',tools.left+'px');host.style.setProperty('--kn-kb-width',tools.width+'px');host.style.setProperty('--kn-kb-top',Math.max(44,tools.top)+'px');}
 }else{
  host.style.removeProperty('--kn-kb-left');host.style.removeProperty('--kn-kb-width');host.style.removeProperty('--kn-kb-top');
 }
}
function open(nextTarget){
 if(!phone())return;
 target=nextTarget||target||$('layer-text');
 if(!target)return;
 if(!opened){opened=true;host.hidden=false;document.body.classList.add('kn-kb-open');}
 render();resize();
 // Em vertical, trazer a capa para a vista sem empurrar o teclado do navegador.
 if(!document.body.classList.contains('kn-landscape-on')&&target.id==='layer-text')requestAnimationFrame(()=>{
  const preview=$('editor-preview');const r=preview.getBoundingClientRect();
  if(r.top<0||r.top>window.innerHeight*.4)preview.scrollIntoView({block:'start',behavior:'instant'});
 });
}
function close(){
 if(!opened)return;opened=false;host.hidden=true;document.body.classList.remove('kn-kb-open');
 target?.blur();window.KN?.cover?.draw();
}
function editable(t){return t&&(t.matches('textarea')||t.matches('input[type="text"],input[type="search"],input:not([type])'))&&!t.disabled&&!t.hidden&&!t.closest('#kn-virtual-keyboard');}
function setupField(t){if(!editable(t))return;
 if(phone()){t.readOnly=true;t.inputMode='none';t.setAttribute('autocomplete','off');t.setAttribute('autocorrect','off');}
 else{t.readOnly=false;t.removeAttribute('inputmode');t.removeAttribute('autocorrect');}}
function setupInput(){document.querySelectorAll('textarea,input').forEach(setupField);openBtn.hidden=!phone();if(!phone())close();}
function init(){
 target=$('layer-text');host=$('kn-virtual-keyboard');openBtn=$('kn-open-keyboard');if(!target||!host||!openBtn)return;
 openBtn.addEventListener('click',()=>{open($('layer-text'));focusTarget();});
 document.addEventListener('pointerdown',e=>{if(editable(e.target))setupField(e.target);},true);
 document.addEventListener('focusin',e=>{if(phone()&&editable(e.target)){setupField(e.target);open(e.target);}});
 document.addEventListener('click',e=>{if(phone()&&editable(e.target))open(e.target);});
 document.addEventListener('input',e=>{if(opened&&e.target===target)suggestionRefresh();});
 document.addEventListener('keyup',e=>{if(opened&&e.target===target)suggestionRefresh();});
 document.addEventListener('pointerdown',e=>{
  if(!opened||!phone())return;
  if(host.contains(e.target)||target?.contains(e.target)||openBtn.contains(e.target)||$('cover').contains(e.target)||editable(e.target))return;
  // Fechar ao mudar para outros controles evita cobrir o painel de ferramentas.
  const tab=e.target.closest('#kn-tab-video,#kn-tab-post');if(tab)close();
 });
 document.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){e.preventDefault();close();}});
 window.addEventListener('resize',()=>{setupInput();resize()});
 new MutationObserver(()=>{if(phone())document.querySelectorAll('textarea,input').forEach(setupField)}).observe(document.body,{childList:true,subtree:true});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',resize);
 setupInput();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.KN=window.KN||{};window.KN.mobileKeyboard={open,close};
})();
