/* KN Publicador Studio V2 — presets de tipografia. Independente do editor. */
(function(){
 'use strict';
 const KN=window.KN=window.KN||{};
 const P=(id,name,font,color,stroke,glow,shadow,weight='900',italic=false)=>({id,name,font,color,stroke,glow,shadow,weight,italic});
 const presets=[
  P('gospel','Gospel Luxo','Georgia,serif','#f6d376','#55300e',18,20),
  P('cinema','Cinematográfico','Impact,Arial Black,sans-serif','#ffffff','#1a1c29',5,20),
  P('blues','Blues Vintage','Georgia,Palatino,serif','#eed6a9','#3f302b',1,10,'bold',true),
  P('elegante','Elegante','Palatino Linotype,Georgia,serif','#fff4dc','#433b39',0,9,'bold',true),
  P('viral','Explosão Viral','Impact,Arial Black,sans-serif','#ffe24a','#30100e',11,22),
  P('neon','Neon Moderno','Trebuchet MS,Arial,sans-serif','#c6f8ff','#17698a',24,13),
  P('emocao','Emocional','Georgia,serif','#fbe9e8','#624055',4,13,'bold',true),
  P('minimal','Minimalista','Arial,sans-serif','#ffffff','#243a3c',0,0,'700'),
  P('biblico','Épico Bíblico','Georgia,serif','#f5c87f','#5b3816',12,20),
  P('documentario','Documentário','Trebuchet MS,Arial,sans-serif','#f0e7ff','#302b43',3,8,'700')
 ];
 KN.typography={presets,byId(id){return presets.find(p=>p.id===id)||presets[0]},defaultForProfile(p){return p==='Midnight Blues & Soul'?'blues':p==='Kingdom Fire'?'cinema':'gospel'}};
})();
