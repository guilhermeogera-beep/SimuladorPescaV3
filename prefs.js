/* ============================================================================
   PREFS — sincroniza as configurações "novas" (exibição, prêmios, segurança,
   testes, troca de linha, peixes na tela) no config.json do GitHub (repo v3).
   - Sobe SÓ de aparelho COM token (o totem só lê).
   - aplicarPrefs(cfg): grava as prefs vindas do config.json no localStorage.
   - syncPrefs(): sobe as prefs atuais pro GitHub (debounced, mescla, 409-safe).
   NÃO entram: cadeado (destravado), token, carretel, limite (local por aparelho).
   ========================================================================== */
(function(){
  const GH_REPO='guilhermeogera-beep/SimuladorPescaV3', GH_CONFIG='config.json';
  const PREFS_KEYS=[
    'simpesca2_hud_linha','simpesca2_hud_estado','simpesca2_hud_barra','simpesca2_hud_carretel','simpesca2_hud_sync','simpesca2_hud_peso',
    'simpesca2_mostrar_teste',
    'simpesca2_hud_premio_bone','simpesca2_hud_premio_boia','simpesca2_premio_bone_min','simpesca2_premio_boia_min',
    'simpesca2_hud_corrente','simpesca2_jam_ativo','simpesca2_jam_limite','simpesca2_jam_ms',
    'simpesca2_troca_teste','simpesca2_troca_mostrar','simpesca2_troca_metros','simpesca2_troca_velocidade','simpesca2_troca_rampa',
    'simpesca2_peixe_pirarara','simpesca2_peixe_tambaqui','simpesca2_peixe_tucunare','simpesca2_peixe_dourado','simpesca2_peixe_trairao','simpesca2_peixe_jau'
  ];
  function ghToken(){ return (localStorage.getItem('simpesca2_github_token')||'').trim(); }

  window.prefsBadge=function(st){   // selo flutuante de status (criado sob demanda; só aparece onde sincroniza)
    let e=document.getElementById('prefsStatus');
    if(!e){ e=document.createElement('div'); e.id='prefsStatus'; e.style.cssText='position:fixed;bottom:12px;right:12px;z-index:1200;font-size:0.72rem;font-weight:700;padding:7px 13px;border-radius:9px;background:rgba(10,20,32,0.95);border:1px solid #1a2736;font-family:Segoe UI,sans-serif;'; document.body.appendChild(e); }
    const m={pend:['⏳ salvando config…','#ffd600'],saving:['☁️ salvando…','#7b8d9e'],ok:['✅ salvo na nuvem','#00e676'],off:['📴 offline — sobe depois','#ffd600'],err:['❌ falha (confira o token)','#ff1744']};
    const x=m[st]||['','']; e.textContent=x[0]; e.style.color=x[1]; e.style.display=x[0]?'block':'none';
    if(st==='ok'){ setTimeout(()=>{ const el=document.getElementById('prefsStatus'); if(el) el.style.display='none'; }, 2500); }
  };

  window.PREFS_KEYS=PREFS_KEYS;
  window.aplicarPrefs=function(cfg){   // config.json -> localStorage (pro totem receber as prefs do PC)
    if(cfg && cfg.prefs && typeof cfg.prefs==='object'){
      PREFS_KEYS.forEach(k=>{ const v=cfg.prefs[k]; if(v!=null) localStorage.setItem(k, String(v)); });
    }
  };
  function coletarPrefs(){ const p={}; PREFS_KEYS.forEach(k=>{ const v=localStorage.getItem(k); if(v!=null) p[k]=v; }); return p; }

  let timer=null, enviando=false;
  window.syncPrefs=function(){   // chamado ao mudar uma config nova
    if(!ghToken()) return;       // sem token (totem) não sobe
    if(window.prefsBadge) window.prefsBadge('pend');
    clearTimeout(timer); timer=setTimeout(enviar, 1500);
  };
  async function enviar(){
    const tk=ghToken(); if(!tk||enviando) return;
    if(!navigator.onLine){ if(window.prefsBadge) window.prefsBadge('off'); return; }
    enviando=true; if(window.prefsBadge) window.prefsBadge('saving');
    const headers={'Authorization':'token '+tk,'Accept':'application/vnd.github+json'}, url='https://api.github.com/repos/'+GH_REPO+'/contents/'+GH_CONFIG;
    let sha=null, cfg=null, existia=false;
    try{ const g=await fetch(url,{headers,cache:'no-store'});
      if(g.ok){ const j=await g.json(); sha=j.sha; existia=true; try{ cfg=JSON.parse(decodeURIComponent(escape(atob((j.content||'').replace(/\s/g,''))))); }catch(e){ cfg=null; } }
      else if(g.status===404){ cfg={versao:2,tipo:'config'}; existia=false; }
      else { enviando=false; if(window.prefsBadge) window.prefsBadge('err'); return; }
    }catch(e){ enviando=false; if(window.prefsBadge) window.prefsBadge('err'); return; }
    if(existia && (!cfg || typeof cfg!=='object')){ enviando=false; if(window.prefsBadge) window.prefsBadge('err'); return; }   // existe mas não leu -> NÃO sobrescreve o resto
    cfg=cfg||{versao:2,tipo:'config'};
    cfg.prefs=Object.assign({}, cfg.prefs||{}, coletarPrefs());   // mescla (preserva cal/gen/sync/desafio)
    cfg.criado=new Date().toISOString();
    const content=btoa(unescape(encodeURIComponent(JSON.stringify(cfg,null,2))));
    const body={message:'auto: prefs', content}; if(sha) body.sha=sha;
    let r; try{ r=await fetch(url,{method:'PUT',headers,body:JSON.stringify(body)}); }catch(e){ enviando=false; if(window.prefsBadge) window.prefsBadge('err'); return; }
    if(r && (r.status===409||r.status===422)){   // sha desatualizou -> rebusca e tenta 1x
      try{ const g=await fetch(url,{headers,cache:'no-store'}); if(g.ok){ body.sha=(await g.json()).sha; r=await fetch(url,{method:'PUT',headers,body:JSON.stringify(body)}); } }catch(e){}
    }
    enviando=false; if(window.prefsBadge) window.prefsBadge((r&&r.ok)?'ok':'err');
  }
  window.addEventListener('online',()=>{ if(ghToken()) window.syncPrefs(); });
})();
