/* QSO Logbook — Rodada separada do Livro + relatório A4/PDF v2.6-19
   Rodada e QSO direto são registros independentes. Participantes da Rodada
   permanecem somente no histórico da própria Rodada. */
(function(){
  'use strict';
  if(window.__qsoRoundSeparationV2619)return;
  window.__qsoRoundSeparationV2619=true;
  // Impede o normalizador legado de Rodadas em qsos de iniciar.
  window.__qsoRoundBookNormalizer=true;

  const STATE_LABELS={waiting:'AGUARDANDO',speaking:'COM A PALAVRA',done:'CONCLUÍDO',skipped:'PULADO',absent:'AUSENTE'};
  let cleanupBusy=false,cleanupTimer=null;

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const durationText=ms=>{
    ms=Math.max(0,Number(ms)||0);
    const total=Math.floor(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  async function noRoundAutoLog(person){
    if(person){person.qsoLogged=false;person.qsoId='';}
    try{
      if(typeof currentRound!=='undefined'&&currentRound){
        currentRound.autoLog=false;
        if(typeof saveRound==='function')await saveRound();
      }
    }catch(_){ }
    scheduleCleanup(80);
    return null;
  }

  function overrideRoundAutoLog(){
    try{window.roundAutoLogQso=noRoundAutoLog;}catch(_){ }
    try{if(typeof roundAutoLogQso==='function')roundAutoLogQso=noRoundAutoLog;}catch(_){ }
  }

  async function cleanupRoundQsos(){
    if(cleanupBusy||typeof getAll!=='function'||typeof del!=='function')return;
    cleanupBusy=true;
    try{
      const rounds=await getAll('rounds');
      const linkedIds=new Set();
      for(const round of rounds||[]){
        let changed=false;
        if(round&&round.autoLog!==false){round.autoLog=false;changed=true;}
        for(const person of round?.people||[]){
          if(person?.qsoId)linkedIds.add(String(person.qsoId));
          if(person&&(person.qsoLogged||person.qsoId)){
            person.qsoLogged=false;
            person.qsoId='';
            changed=true;
          }
        }
        if(changed&&typeof put==='function')await put('rounds',round);
      }

      let removed=0;
      const qsos=await getAll('qsos');
      for(const q of qsos||[]){
        const generatedByRound=q&&(
          linkedIds.has(String(q.id??''))||
          q.__roundBookNormalized===true||
          q.contactType==='round'||
          q.isRound===true||
          q.roundBookVersion!=null
        );
        if(generatedByRound&&q.id!=null){
          await del('qsos',q.id);
          removed++;
        }
      }

      try{
        if(typeof currentRound!=='undefined'&&currentRound){
          let activeChanged=currentRound.autoLog!==false;
          currentRound.autoLog=false;
          for(const person of currentRound.people||[]){
            if(person.qsoLogged||person.qsoId){person.qsoLogged=false;person.qsoId='';activeChanged=true;}
          }
          if(activeChanged&&typeof saveRound==='function')await saveRound();
        }
      }catch(_){ }

      if(removed){
        try{if(typeof renderBook==='function')await renderBook();}catch(_){ }
        try{if(typeof renderStats==='function')await renderStats();}catch(_){ }
      }
    }catch(err){
      console.warn('[QSO] Não foi possível separar registros antigos da Rodada:',err);
    }finally{
      cleanupBusy=false;
    }
  }

  function scheduleCleanup(delay=220){
    clearTimeout(cleanupTimer);
    cleanupTimer=setTimeout(cleanupRoundQsos,delay);
  }

  function hideAutoLogControls(){
    for(const id of ['roundAutoLogStart','roundAutoLogActive']){
      const input=document.getElementById(id);
      if(!input)continue;
      input.checked=false;
      input.disabled=true;
      input.setAttribute('aria-hidden','true');
      const wrap=input.closest('label,.field,.toggle,.check')||input.parentElement;
      if(wrap)wrap.style.setProperty('display','none','important');
    }
    document.querySelectorAll('.round-person-meta').forEach(meta=>{
      const hasOrder=/arraste|reordenar|↑|↓/i.test(meta.textContent||'');
      meta.textContent=hasOrder?'Registro exclusivo da Rodada • arraste para reordenar ou use ↑ ↓':'Registro exclusivo da Rodada';
    });
  }

  async function findRound(roundId){
    if(roundId==='active'){
      try{if(typeof currentRound!=='undefined'&&currentRound)return JSON.parse(JSON.stringify(currentRound));}catch(_){ }
    }
    if(typeof getAll!=='function')return null;
    const rounds=await getAll('rounds');
    return (rounds||[]).find(r=>String(r.id)===String(roundId))||null;
  }

  function reportDocument(round){
    const people=round?.people||[];
    const rows=people.map((p,i)=>`<tr>
      <td class="n">${i+1}</td>
      <td class="call">${esc(p.call||'—')}</td>
      <td>${esc(p.name||'—')}</td>
      <td>${esc([p.city,p.uf].filter(Boolean).join('/')||'—')}</td>
      <td>${esc(STATE_LABELS[p.status]||p.status||'—')}</td>
      <td class="time">${esc(durationText(p.durationMs||0))}</td>
    </tr>`).join('');
    const title=round?.name||'Rodada';
    const total=people.length;
    const completed=people.filter(p=>Number(p.completedTurns)>0||p.status==='done').length;
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)} — Relatório de Rodada</title><style>
      @page{size:A4 portrait;margin:7mm}
      *{box-sizing:border-box}
      body{margin:0;color:#000;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:9.5pt;line-height:1.25}
      header{border-bottom:1.2px solid #000;padding-bottom:2.5mm;margin-bottom:3mm}
      h1{font-size:15pt;line-height:1.1;margin:0 0 1mm;text-transform:uppercase}
      .sub{font-size:9pt;font-weight:700;letter-spacing:.3px}
      .meta{display:grid;grid-template-columns:1.55fr .75fr .7fr .9fr;gap:1.5mm;margin:0 0 3mm}
      .box{border:1px solid #777;padding:1.6mm 1.8mm;min-height:11mm}
      .box b{display:block;font-size:7.5pt;text-transform:uppercase;margin-bottom:.6mm}
      .summary{display:flex;gap:5mm;margin:0 0 2.5mm;font-size:9pt;font-weight:700}
      table{width:100%;border-collapse:collapse;table-layout:fixed}
      thead{display:table-header-group}
      tr{break-inside:avoid;page-break-inside:avoid}
      th,td{border:.25mm solid #777;padding:1.5mm 1.4mm;vertical-align:top}
      th{font-size:8pt;text-transform:uppercase;background:#eee;text-align:left}
      .n{width:8mm;text-align:center}.call{width:24mm;font-weight:700}.time{width:19mm;text-align:center}
      th:nth-child(4),td:nth-child(4){width:29mm}th:nth-child(5),td:nth-child(5){width:28mm}
      footer{margin-top:5mm;display:grid;grid-template-columns:1fr 1fr;gap:14mm;font-size:8.5pt}
      .sign{padding-top:9mm;border-top:.25mm solid #444;text-align:center}
      .note{margin-top:3mm;font-size:7.8pt;color:#333}
    </style></head><body>
      <header><h1>Relatório de Rodada</h1><div class="sub">QSO LOGBOOK — registro exclusivo da Rodada</div></header>
      <section class="meta">
        <div class="box"><b>Rodada</b>${esc(title)}</div>
        <div class="box"><b>Frequência</b>${esc(round?.freq||'—')} MHz</div>
        <div class="box"><b>Modo</b>${esc(round?.mode||'—')}</div>
        <div class="box"><b>Diretor</b>${esc(round?.director||'—')}</div>
        <div class="box"><b>Início</b>${esc(round?.started||'—')}</div>
        <div class="box"><b>Encerramento</b>${esc(round?.ended||'—')}</div>
        <div class="box"><b>Ciclo</b>${esc(round?.cycle||1)}</div>
        <div class="box"><b>Duração total</b>${esc(durationText((round?.endedAt||Date.now())-(round?.startedAt||Date.now())))}</div>
      </section>
      <div class="summary"><span>Participantes: ${total}</span><span>Com passagem concluída: ${completed}</span></div>
      <table><thead><tr><th class="n">Nº</th><th class="call">Indicativo</th><th>Nome</th><th>Cidade/UF</th><th>Situação</th><th class="time">Tempo</th></tr></thead><tbody>${rows||'<tr><td colspan="6">Nenhum participante registrado.</td></tr>'}</tbody></table>
      <div class="note">Documento formatado em A4 com margens estreitas. Para gerar o arquivo PDF, selecione “Salvar como PDF” na janela de impressão.</div>
      <footer><div class="sign">Diretor da Rodada</div><div class="sign">Operador / Conferência</div></footer>
    </body></html>`;
  }

  async function printRound(roundId){
    const round=await findRound(roundId);
    if(!round){
      try{if(typeof toast==='function')toast('Rodada não localizada');}catch(_){ }
      return;
    }
    const frame=document.createElement('iframe');
    frame.setAttribute('aria-hidden','true');
    frame.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(frame);
    const doc=frame.contentDocument||frame.contentWindow.document;
    doc.open();doc.write(reportDocument(round));doc.close();
    setTimeout(()=>{
      try{frame.contentWindow.focus();frame.contentWindow.print();}
      finally{setTimeout(()=>frame.remove(),3000);}
    },180);
  }

  function addReportButtons(){
    document.querySelectorAll('[data-round-history-delete]').forEach(delBtn=>{
      const row=delBtn.closest('.row')||delBtn.parentElement;
      if(!row||row.querySelector('[data-round-report]'))return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='btn small';btn.dataset.roundReport=delBtn.dataset.roundHistoryDelete;
      btn.textContent='PDF / IMPRIMIR A4';
      btn.onclick=e=>{e.preventDefault();e.stopPropagation();printRound(btn.dataset.roundReport);};
      row.insertBefore(btn,delBtn);
    });

    const active=document.getElementById('roundActive');
    if(active&&active.style.display!=='none'&&!active.querySelector('#roundReportActiveRow')){
      const row=document.createElement('div');row.className='row';row.id='roundReportActiveRow';row.style.marginTop='10px';
      const btn=document.createElement('button');btn.type='button';btn.className='btn small';btn.textContent='PDF / IMPRIMIR A4';
      btn.onclick=e=>{e.preventDefault();printRound('active');};
      row.appendChild(btn);active.appendChild(row);
    }
    if(active&&active.style.display==='none')document.getElementById('roundReportActiveRow')?.remove();
  }

  function refreshUi(){
    overrideRoundAutoLog();
    hideAutoLogControls();
    addReportButtons();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{refreshUi();scheduleCleanup(120);},{once:true});
  else{refreshUi();scheduleCleanup(120);}

  let uiTimer=null;
  new MutationObserver(()=>{
    clearTimeout(uiTimer);
    uiTimer=setTimeout(()=>{refreshUi();scheduleCleanup(180);},40);
  }).observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('focus',()=>{refreshUi();scheduleCleanup(80);});
  setTimeout(()=>scheduleCleanup(0),2200);
})();
