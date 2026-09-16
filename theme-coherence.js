/* QSO Logbook — coerência cromática v2.6-5
   Cada tema controla toda a casca visual do app. O preview por amostras de cor foi removido. */
(function(){
  'use strict';

  const CSS = `
html[data-theme] .card,
html[data-theme] .source-card,
html[data-theme] .qso-card{background:linear-gradient(180deg,var(--card2),var(--card));border-color:var(--line)}
html[data-theme] .source-facts,
html[data-theme] .detail-cell,
html[data-theme] .round-status,
html[data-theme] .round-person,
html[data-theme] .inline-picker,
html[data-theme] .db-editor,
html[data-theme] .db-row,
html[data-theme] .radio-picker-item{background:var(--surface2);border-color:color-mix(in srgb,var(--line) 78%,transparent)}
html[data-theme] .lookup-item,
html[data-theme] .tree-group,
html[data-theme] .db-bank,
html[data-theme] .round-clock,
html[data-theme] .round-stat{background:var(--surface);border-color:var(--line)}
html[data-theme] .lookup-item:active,
html[data-theme] .radio-picker-item:active{background:var(--active)}
html[data-theme] .field input,
html[data-theme] .field select,
html[data-theme] .field textarea,
html[data-theme] .searchbox{background:var(--input);color:var(--text);border-color:var(--line)}
html[data-theme] .field input:focus,
html[data-theme] .field select:focus,
html[data-theme] .field textarea:focus,
html[data-theme] .searchbox:focus{border-color:var(--cyan);box-shadow:0 0 0 2px color-mix(in srgb,var(--cyan) 22%,transparent)}
html[data-theme] .status-pill,
html[data-theme] .badge,
html[data-theme] .toast{background:var(--surface);border-color:var(--line);color:var(--muted)}
html[data-theme] .toast{color:var(--text)}
html[data-theme] .btn,
html[data-theme] .source-btn{background:var(--surface);border-color:var(--line);color:var(--text)}
html[data-theme] .btn.primary,
html[data-theme] .source-btn.primary{background:linear-gradient(180deg,var(--cyan),var(--cyan2));border-color:var(--cyan);color:#fff;box-shadow:0 7px 24px color-mix(in srgb,var(--cyan) 20%,transparent)}
html[data-theme] .source-btn.anatel{color:var(--cyan);border-color:color-mix(in srgb,var(--cyan) 58%,var(--line));background:color-mix(in srgb,var(--surface) 82%,var(--cyan) 18%)}
html[data-theme] .source-call,
html[data-theme] .source-fact-line,
html[data-theme] .source-fact-line .value,
html[data-theme] .qso-call,
html[data-theme] .radio-picker-item b,
html[data-theme] .settings-stat b{color:var(--text)}
html[data-theme] .source-name,
html[data-theme] .qso-sub,
html[data-theme] .inline-picker>summary{color:color-mix(in srgb,var(--text) 82%,var(--muted))}
html[data-theme] .source-card .badge.green{color:var(--text);border-color:color-mix(in srgb,var(--cyan) 45%,var(--line));background:color-mix(in srgb,var(--surface) 84%,var(--cyan) 16%)}
html[data-theme] .source-status-dot{background:var(--cyan)}
html[data-theme] .badge.cyan{color:var(--cyan);border-color:color-mix(in srgb,var(--cyan) 55%,var(--line))}
html[data-theme] .round-num{background:var(--active);color:var(--text)}
html[data-theme] .book-tools{background:linear-gradient(var(--bg) 82%,color-mix(in srgb,var(--bg) 0%,transparent))}
html[data-theme] .bottom-nav{background:color-mix(in srgb,var(--nav) 94%,transparent);border-color:var(--line)}
html[data-theme] .nav-btn.active{background:var(--active);color:var(--cyan)}
html[data-theme] .theme-choice{background:var(--surface);border-color:var(--line);color:var(--text)}
html[data-theme] .theme-choice.active{background:var(--active);border-color:var(--cyan);box-shadow:0 0 0 2px color-mix(in srgb,var(--cyan) 24%,transparent)}
html[data-theme] .theme-choice b{margin-top:0}
html[data-theme] .theme-choice small{color:var(--muted)}
html[data-theme] .danger-zone{background:color-mix(in srgb,var(--surface) 78%,var(--red) 22%);border-color:color-mix(in srgb,var(--line) 55%,var(--red))}
`;

  function apply(){
    if(!document.getElementById('qso-theme-coherence-style')){
      const style=document.createElement('style');
      style.id='qso-theme-coherence-style';
      style.textContent=CSS;
      document.head.appendChild(style);
    }
    document.querySelectorAll('.theme-swatches').forEach(el=>el.remove());
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();

/* Databanks — busca e seleção dentro da própria janela rolável.
   Mantém o formulário de QSO no lugar e evita que listas extensas fiquem sob a barra inferior. */
(function(){
  'use strict';

  const STYLE_ID='qso-databank-inline-scroll-style';
  const TARGETS=['buscar no databank de frequencias','buscar no databank de radios'];

  const CSS=`
.qso-db-inline-window[open]{
  max-height:min(44vh,360px);
  overflow-x:hidden;
  overflow-y:auto;
  overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;
  scrollbar-gutter:stable;
  touch-action:pan-y;
}
.qso-db-inline-window[open]>summary{
  position:sticky;
  top:0;
  z-index:12;
  background:var(--surface2);
}
.qso-db-inline-window[open] .searchbox{
  position:sticky;
  top:64px;
  z-index:11;
}
.qso-db-inline-window[open] .radio-picker-item,
.qso-db-inline-window[open] .lookup-item{
  scroll-margin-top:132px;
}
.qso-db-inline-window[open]::-webkit-scrollbar{width:6px}
.qso-db-inline-window[open]::-webkit-scrollbar-thumb{
  background:color-mix(in srgb,var(--muted) 58%,transparent);
  border-radius:999px;
}
@media (min-width:768px){
  .qso-db-inline-window[open]{max-height:min(55vh,480px)}
}
`;

  function normalize(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();
  }

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=CSS;
    document.head.appendChild(style);
  }

  function enhance(root){
    const scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll('.inline-picker').forEach(picker=>{
      const summary=picker.querySelector(':scope > summary')||picker.querySelector('summary');
      if(!summary) return;
      const title=normalize(summary.textContent);
      if(!TARGETS.some(target=>title.includes(target))) return;

      picker.classList.add('qso-db-inline-window');
      if(picker.dataset.qsoDbWindowReady==='1') return;
      picker.dataset.qsoDbWindowReady='1';

      picker.addEventListener('toggle',()=>{
        if(!picker.open) picker.scrollTop=0;
      });
    });
  }

  function run(){
    installStyle();
    enhance(document);
  }

  document.addEventListener('click',event=>{
    const option=event.target.closest('.qso-db-inline-window .radio-picker-item, .qso-db-inline-window .lookup-item');
    if(!option) return;
    const picker=option.closest('.qso-db-inline-window');
    if(!picker||!picker.open) return;
    window.setTimeout(()=>{
      if(picker.open) picker.removeAttribute('open');
      picker.scrollTop=0;
    },120);
  });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();

  const observer=new MutationObserver(()=>enhance(document));
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();


/* QSO Logbook — busca integrada nos campos FREQUÊNCIA MHZ e RÁDIO/EQUIPAMENTO v2.6-6
   Reutiliza os pickers oficiais e elimina os buscadores soltos abaixo do formulário. */
(function(){
  'use strict';

  const STYLE_ID='qso-integrated-databank-fields-style';
  const CSS="
.qso-integrated-picker{display:block!important;margin:8px 0 0!important;border:1px solid var(--line)!important;border-radius:12px!important;background:var(--surface)!important}
.qso-integrated-picker>summary{cursor:pointer;padding:9px 11px;color:var(--text);font-weight:700;list-style:none}
.qso-integrated-picker>summary::-webkit-details-marker{display:none}
.qso-integrated-picker>summary::before{content:\"⌕ \";color:var(--cyan)}
.qso-integrated-picker[open]{max-height:min(44vh,360px)!important;overflow:hidden!important}
.qso-integrated-picker[open]>.inline-picker-body{min-height:0;max-height:calc(min(44vh,360px) - 48px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 10px 10px}
.qso-integrated-picker[open] .searchbox{position:sticky!important;top:0!important;z-index:12}
@media (min-width:768px){.qso-integrated-picker[open]{max-height:min(55vh,460px)!important}.qso-integrated-picker[open]>.inline-picker-body{max-height:calc(min(55vh,460px) - 48px)}}
";

  const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\s+/g,' ').trim().toLowerCase();

  function install(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=CSS;
    document.head.appendChild(style);
  }

  function labelField(words){
    const labels=[...document.querySelectorAll('label')];
    for(const label of labels){
      const text=norm(label.textContent);
      if(!words.some(word=>text.includes(word)))continue;
      const forId=label.getAttribute('for');
      const input=forId&&document.getElementById(forId);
      const field=input?.closest('.field')||label.closest('.field');
      if(field)return field;
    }
    const fields=[...document.querySelectorAll('.field')];
    return fields.find(field=>{
      const text=norm([...field.children].filter(el=>!el.matches('.inline-picker,.qso-db-inline-window')).map(el=>el.textContent).join(' '));
      return words.some(word=>text.includes(word));
    })||null;
  }

  function integrate(picker,words){
    if(!picker)return;
    const field=labelField(words);
    if(!field){
      picker.hidden=true;
      picker.style.display='none';
      return;
    }
    if(picker.parentElement!==field)field.appendChild(picker);
    picker.hidden=false;
    picker.style.display='';
    picker.classList.add('qso-integrated-picker');
    picker.dataset.qsoIntegrated='1';
    const summary=picker.querySelector(':scope > summary')||picker.querySelector('summary');
    if(summary){
      summary.textContent='Buscar no databank';
      summary.setAttribute('aria-label','Buscar no databank');
    }
  }

  function run(){
    install();
    integrate(document.getElementById('qsoFreqPicker'),['frequencia','frequência']);
    integrate(document.getElementById('qsoRadioPicker'),['radio','rádio','equipamento']);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();

  const observer=new MutationObserver(()=>{
    if(!document.getElementById('qsoFreqPicker')&&!document.getElementById('qsoRadioPicker'))return;
    run();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
