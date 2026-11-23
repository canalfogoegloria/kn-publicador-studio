/* Módulo 01 — Catálogo do projeto. Nenhuma credencial de API é armazenada aqui. */
(function(){
  const KN=window.KN=window.KN||{};
  KN.config={
    version:'3.7.1',appName:'KN Publicador Studio',
    platforms:[
      {id:'youtube',name:'YouTube',sub:'Vídeo longo'},
      {id:'shorts',name:'YouTube Shorts',sub:'Vertical'},
      {id:'facebook',name:'Facebook',sub:'Página/Reels'},
      {id:'instagram',name:'Instagram',sub:'Conta profissional'},
      {id:'tiktok',name:'TikTok',sub:'Requer aprovação'},
      {id:'kwai',name:'Kwai',sub:'Integração pendente'},
      {id:'threads',name:'Threads',sub:'API oficial'},
      {id:'pinterest',name:'Pinterest',sub:'API oficial'}
    ],
    profiles:{
      'Fogo & Glória':{colors:['#092d25','#0c6c51','#ecbb58'],locale:'pt-BR',tag:'FogoEGloria'},
      'Midnight Blues & Soul':{colors:['#101a30','#355774','#cab387'],locale:'en-US',tag:'MidnightBluesAndSoul'},
      'Personalizado':{colors:['#0c2430','#267b86','#d1bc91'],locale:'pt-BR',tag:'ConteudoOriginal'}
    }
  };
})();
