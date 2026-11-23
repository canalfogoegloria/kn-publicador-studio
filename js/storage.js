/* Módulo 02 — Armazenamento LOCAL; não armazena mídia, tokens ou segredos. */
(function(){
  const KN=window.KN=window.KN||{};
  const prefix='kn_publicador_limpo_20261123_';
  KN.storage={
    get(key,fallback){try{const str=localStorage.getItem(prefix+key);return str===null?fallback:JSON.parse(str);}catch(e){return fallback;}},
    set(key,value){try{localStorage.setItem(prefix+key,JSON.stringify(value));return true;}catch(e){return false;}},
    remove(key){try{localStorage.removeItem(prefix+key)}catch(e){}},
  };
})();
