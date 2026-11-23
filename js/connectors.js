/* Módulo 05 — Adaptadores futuros. SEM publicação, sem login, sem chaves no navegador. */
(function(){
 const KN=window.KN=window.KN||{};
 const officialState={
  youtube:'OAuth oficial • modo privado',shorts:'OAuth oficial • modo privado',
  facebook:'API disponível • conexão pendente',instagram:'API disponível • conexão pendente',
  tiktok:'Requer revisão • conexão pendente',kwai:'API para este uso não confirmada',
  threads:'API disponível • conexão pendente',pinterest:'API disponível • conexão pendente'
 };
 KN.connectors={list:officialState,async publish(){throw new Error('Publicação desativada nesta versão. Necessário servidor, OAuth e aprovação da API correspondente.');}};
})();
