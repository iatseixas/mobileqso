/* QSO Logbook — coerência cromática v2.6-4
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
