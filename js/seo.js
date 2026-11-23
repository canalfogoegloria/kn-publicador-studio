/* Módulo 03 — Sugestões de metadados, offline e baseadas no texto informado. NÃO é IA. */
(function(){
 const KN=window.KN=window.KN||{};
 const clean=(v)=>String(v||'').trim().replace(/\s+/g,' ');
 const cut=(t,n)=>t.length<=n?t:t.slice(0,n-1).replace(/\s+\S*$/,'')+'…';
 const slug=(s)=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,'');
 const hashtag=(s)=>'#'+slug(s);
 const isEn=(profile)=>KN.config.profiles[profile]?.locale==='en-US';
 function generate(topic,summary,profile){
   const title=clean(topic)||'Novo conteúdo';const desc=clean(summary)||`Confira ${title}.`;
   const en=isEn(profile),mainTag=hashtag(title),brandTag=hashtag(KN.config.profiles[profile]?.tag||'ConteudoOriginal');
   const baseTags=en?[mainTag,brandTag,'#OriginalContent']:[mainTag,brandTag,'#ConteudoOriginal'];
   const hashtags=baseTags.filter(x=>x!=='#').join(' ');
   const share=en?'What did this story make you feel? Share your thoughts in the comments.':'Qual parte desta mensagem mais tocou você? Conte nos comentários.';
   const follow=en?'Subscribe for more original content.':'Acompanhe o canal para mais conteúdos originais.';
   const keep=[title,desc,hashtags,share,follow];
   const yTitle=cut(title+' | '+profile,90),shortTitle=cut(title,75);
   const longDesc=[desc,'',share,follow,'',hashtags].join('\n');
   const tags=[title,profile,'vídeo original','história','conteúdo'].join(', ');
   const data={
    youtube:{title:yTitle,description:longDesc,hashtags,tags,cta:follow},
    shorts:{title:shortTitle,description:cut(desc,210)+'\n\n'+hashtags+' #Shorts',hashtags:hashtags+' #Shorts',tags,cta:share},
    facebook:{title:cut(title,95),description:[title,desc,'',share,'',hashtags].join('\n'),hashtags,tags:'',cta:share},
    instagram:{title:cut(title,85),description:[title,'',desc,'',share,'',hashtags+' #Reels'].join('\n'),hashtags:hashtags+' #Reels',tags:'',cta:share},
    tiktok:{title:cut(title,80),description:cut(title+' — '+desc,170)+'\n'+hashtags,hashtags,tags:'',cta:share},
    kwai:{title:cut(title,75),description:cut(desc,140)+'\n'+hashtags,hashtags,tags:'',cta:follow},
    threads:{title:cut(title,80),description:cut(title+' — '+desc+' '+share,420),hashtags:hashtag(title),tags:'',cta:share},
    pinterest:{title:cut(title,90),description:cut(desc+' '+follow+' '+hashtags,480),hashtags,tags:'',cta:follow}
   };
   if(en){data.youtube.tags=[title,profile,'original video','story','music'].join(', ');}
   return data;
 }
 KN.seo={generate,clean,cut};
})();
