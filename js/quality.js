/* KN Publicador Studio V2 — inspeção da resolução de mídia. Não reprocessa vídeos. */
(function(){
 'use strict';
 const KN=window.KN=window.KN||{};
 const targets={'16:9':{w:1920,h:1080},'9:16':{w:1080,h:1920},'1:1':{w:1080,h:1080}};
 function check(w,h){
  const portrait=h>w*1.08,square=Math.abs(w-h)<Math.max(w,h)*.08;
  const ratio=square?'1:1':portrait?'9:16':'16:9';
  const t=targets[ratio],ok=w>=t.w&&h>=t.h;
  return {width:w,height:h,ratio,ok,target:`${t.w} × ${t.h}`,label:ok?'Full HD ou superior — arquivo original preservado':'Abaixo da resolução-alvo — não há aumento real de detalhes'};
 }
 KN.quality={targets,check};
})();
