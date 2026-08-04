/* ============================================================================
   MENU COMPARTILHADO — SimPesca v3
   Cada página inclui:
     <script>window.MENU_ATUAL='exibicao';           // id da página atual (opcional)
              window.PAGINA_TEM_BLE=true;             // mostra o botão Conectar (opcional)
              window.conectarBLE=function(){...};     // o que o botão Conectar chama (opcional)
     </script>
     <script src="menu.js"></script>
   A página pode refletir o estado da conexão chamando:
     window.menuStatusConexao(true|false, 'texto opcional');
   ========================================================================== */
(function(){
  // --- itens do menu lateral (drawer) ---
  const LINKS=[
    {ic:'⚙️', nome:'Configuração de exibição', pg:'exibicao.html',        id:'exibicao'},
    {ic:'📏', nome:'Calibração do encoder',     pg:'motor.html',           id:'motor'},
    {ic:'🎚️', nome:'Controle manual',           pg:'motor.html',           id:'motor'},
    {ic:'🔧', nome:'Configuração do motor',     pg:'motor.html',           id:'motor'},
    {ic:'🎬', nome:'Gerador de simulações curtas', pg:'motor.html',        id:'motor'},
    {ic:'🐟', nome:'Gerador de simulação desafio', pg:'desafio.html', id:'desafio'},
    {ic:'🏆', nome:'Ranking',                    pg:'ranking.html',         id:'ranking'},
    {ic:'🔗', nome:'Conexão GitHub',             pg:'github.html',          id:'github'},
    {ic:'↔️', nome:'Importação / exportação',    pg:'importexport.html',    id:'importexport'}
  ];
  // --- jogos (topo direito) ---
  const JOGOS=[
    {ic:'🎣', nome:'Quem enrola mais linha',        curto:'Enrola +', pg:'jogo.html',    id:'jogo'},
    {ic:'⏱', nome:'Quem pega o peixe mais rápido', curto:'Pega +',   pg:'desafio.html', id:'desafio'}
  ];

  const atual = window.MENU_ATUAL || '';
  const temBLE = !!window.PAGINA_TEM_BLE;

  // --------------------------------------------------------------- estilos
  const css = `
  :root{ --mnu-accent:#00d4ff; --mnu-bg:#0a1420; --mnu-border:#1a2736; --mnu-txt:#e0e6ed; --mnu-dim:#7b8d9e; }
  #mnuTopbar{position:fixed;top:0;left:0;right:0;height:52px;z-index:900;display:flex;align-items:center;
    gap:8px;padding:0 10px;background:rgba(5,10,15,0.92);backdrop-filter:blur(6px);border-bottom:1px solid var(--mnu-border);}
  #mnuHamb{width:40px;height:40px;flex-shrink:0;background:transparent;border:1px solid var(--mnu-border);border-radius:9px;
    cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:0;}
  #mnuHamb span{display:block;width:20px;height:2px;background:var(--mnu-accent);border-radius:2px;}
  #mnuTitulo{font-size:0.82rem;font-weight:800;letter-spacing:1px;color:var(--mnu-accent);white-space:nowrap;
    overflow:hidden;text-overflow:ellipsis;}
  #mnuTopRight{margin-left:auto;display:flex;align-items:center;gap:6px;flex-shrink:0;}
  .mnu-jogo{background:transparent;border:1px solid var(--mnu-border);color:var(--mnu-dim);border-radius:9px;
    font-family:inherit;font-size:0.72rem;font-weight:700;padding:7px 10px;cursor:pointer;white-space:nowrap;
    display:flex;align-items:center;gap:5px;line-height:1;}
  .mnu-jogo.ativo{border-color:var(--mnu-accent);color:#fff;background:rgba(0,212,255,0.16);}
  .mnu-jogo .mnu-jogo-txt{display:inline;}
  #mnuConectar{background:var(--mnu-accent);border:none;color:#04121a;border-radius:9px;font-family:inherit;
    font-size:0.74rem;font-weight:900;padding:8px 12px;cursor:pointer;white-space:nowrap;line-height:1;}
  #mnuConectar.conectado{background:#00e676;}
  #mnuConectar.ocupado{opacity:0.6;}
  #mnuBackdrop{position:fixed;inset:0;z-index:950;background:rgba(0,0,0,0.55);opacity:0;pointer-events:none;
    transition:opacity .2s;}
  #mnuBackdrop.aberto{opacity:1;pointer-events:auto;}
  #mnuDrawer{position:fixed;top:0;left:0;bottom:0;width:270px;max-width:82vw;z-index:960;background:var(--mnu-bg);
    border-right:1px solid var(--mnu-accent);transform:translateX(-100%);transition:transform .22s ease;
    display:flex;flex-direction:column;box-shadow:6px 0 26px rgba(0,0,0,0.5);}
  #mnuDrawer.aberto{transform:translateX(0);}
  #mnuDrawerHead{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;
    border-bottom:1px solid var(--mnu-border);}
  #mnuDrawerHead b{color:var(--mnu-accent);font-size:0.95rem;letter-spacing:2px;}
  #mnuFechar{background:transparent;border:none;color:var(--mnu-dim);font-size:1.3rem;cursor:pointer;line-height:1;padding:4px;}
  #mnuLista{overflow-y:auto;padding:8px 0;flex:1;}
  .mnu-link{display:flex;align-items:center;gap:12px;padding:13px 18px;color:var(--mnu-txt);text-decoration:none;
    font-size:0.9rem;cursor:pointer;border-left:3px solid transparent;}
  .mnu-link:active{background:rgba(0,212,255,0.08);}
  .mnu-link.ativo{background:rgba(0,212,255,0.12);border-left-color:var(--mnu-accent);color:#fff;font-weight:700;}
  .mnu-link .mnu-ic{width:22px;text-align:center;font-size:1.05rem;flex-shrink:0;}
  .mnu-sep{font-size:0.62rem;letter-spacing:2px;color:var(--mnu-dim);text-transform:uppercase;padding:12px 18px 4px;}
  body{padding-top:52px;}   /* empurra o conteúdo pra baixo da barra fixa */
  @media(max-width:420px){ .mnu-jogo .mnu-jogo-txt{display:none;} #mnuTitulo{display:none;} }
  `;
  const st=document.createElement('style'); st.id='mnuEstilo'; st.textContent=css; document.head.appendChild(st);

  // --------------------------------------------------------------- topbar
  const jogosHtml = JOGOS.map(j=>{
    const cl = j.id===atual ? 'mnu-jogo ativo' : 'mnu-jogo';
    const onclick = j.id===atual ? '' : `onclick="location.href='${j.pg}'"`;
    return `<button class="${cl}" ${onclick} title="${j.nome}"><span>${j.ic}</span><span class="mnu-jogo-txt">${j.curto}</span></button>`;
  }).join('');
  const conectarHtml = temBLE ? `<button id="mnuConectar" onclick="(window.conectarBLE&&window.conectarBLE())">🔌 Conectar</button>` : '';
  const tituloAtual = (LINKS.concat(JOGOS.map(j=>({id:j.id,nome:j.nome}))).find(x=>x.id===atual)||{}).nome || 'SimPesca';

  const bar=document.createElement('div'); bar.id='mnuTopbar';
  bar.innerHTML =
    `<button id="mnuHamb" aria-label="Menu" title="Menu"><span></span><span></span><span></span></button>`+
    `<span id="mnuTitulo">${tituloAtual}</span>`+
    `<div id="mnuTopRight">${jogosHtml}${conectarHtml}</div>`;
  document.body.appendChild(bar);

  // --------------------------------------------------------------- drawer
  const back=document.createElement('div'); back.id='mnuBackdrop'; document.body.appendChild(back);
  const drw=document.createElement('div'); drw.id='mnuDrawer';
  const linksHtml = LINKS.map(l=>{
    const cl = l.id===atual ? 'mnu-link ativo' : 'mnu-link';
    return `<a class="${cl}" href="${l.pg}"><span class="mnu-ic">${l.ic}</span><span>${l.nome}</span></a>`;
  }).join('');
  const jogosDrawer = JOGOS.map(j=>{
    const cl = j.id===atual ? 'mnu-link ativo' : 'mnu-link';
    return `<a class="${cl}" href="${j.pg}"><span class="mnu-ic">${j.ic}</span><span>${j.nome}</span></a>`;
  }).join('');
  drw.innerHTML =
    `<div id="mnuDrawerHead"><b>SIMPESCA</b><button id="mnuFechar" aria-label="Fechar">✕</button></div>`+
    `<div id="mnuLista">`+
      `<div class="mnu-sep">🎮 Jogos</div>${jogosDrawer}`+
      `<div class="mnu-sep">🛠️ Configurações</div>${linksHtml}`+
    `</div>`;
  document.body.appendChild(drw);

  function abrir(){ back.classList.add('aberto'); drw.classList.add('aberto'); }
  function fechar(){ back.classList.remove('aberto'); drw.classList.remove('aberto'); }
  document.getElementById('mnuHamb').addEventListener('click', abrir);
  document.getElementById('mnuFechar').addEventListener('click', fechar);
  back.addEventListener('click', fechar);

  // --------------------------------------------------------------- API de conexão p/ a página
  window.menuStatusConexao=function(ok, txt){
    const b=document.getElementById('mnuConectar'); if(!b) return;
    b.classList.toggle('conectado', !!ok); b.classList.remove('ocupado');
    b.textContent = txt || (ok ? '✅ Conectado' : '🔌 Conectar');
  };
  window.menuConexaoOcupado=function(txt){
    const b=document.getElementById('mnuConectar'); if(!b) return;
    b.classList.add('ocupado'); b.textContent = txt || '⏳ Conectando...';
  };
})();
