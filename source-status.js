/* QSO Logbook — status visual das fontes v2.6-20
   Frame laranja = ainda não confirmado / não localizado / consulta indisponível.
   Frame verde = o indicativo selecionado foi localizado positivamente naquela fonte.
   O clique no selo nunca altera o estado por si só. */
(function(){
  'use strict';
  if(window.__qsoSourceStatusV2620)return;
  window.__qsoSourceStatusV2620=true;

  const STYLE_ID='qso-source-status-style';
  const CACHE_TTL=15*60*1000;
  const cache=new Map();
  let generation=0;
  let uiTimer=null;

  const CSS=`
.source-btn.qso-source-pending{
  border:2px solid #ff9800!important;
  box-shadow:0 0 0 1px rgba(255,152,0,.18)!important;
}
.source-btn.qso-source-confirmed{
  border:2px solid #39d98a!important;
  box-shadow:0 0 0 1px rgba(57,217,138,.22),0 0 8px rgba(57,217,138,.18)!important;
}
.source-btn.qso-source-checking{
  border:2px solid #ff9800!important;
  box-shadow:0 0 0 1px rgba(255,152,0,.18)!important;
}
`;

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=CSS;
    document.head.appendChild(style);
  }

  function normCall(value){
    return String(value||'').toUpperCase().trim().replace(/[^A-Z0-9/]/g,'');
  }

  function escRx(value){
    return String(value||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  }

  function sourceButtons(source){
    if(source==='anatel')return [...document.querySelectorAll('[data-anatel-call]')];
    return [...document.querySelectorAll(`.source-btn[data-source="${source}"]`)];
  }

  function setVisual(source,state,call){
    const target=normCall(call);
    sourceButtons(source).forEach(btn=>{
      const btnCall=normCall(btn.dataset.call||btn.dataset.anatelCall||'');
      if(target&&btnCall&&btnCall!==target)return;
      if(!btn.dataset.qsoSourceTitle)btn.dataset.qsoSourceTitle=btn.getAttribute('title')||source.toUpperCase();
      btn.classList.remove('qso-source-pending','qso-source-confirmed','qso-source-checking');
      const confirmed=state==='confirmed';
      const checking=state==='checking';
      btn.classList.add(confirmed?'qso-source-confirmed':checking?'qso-source-checking':'qso-source-pending');
      btn.dataset.qsoSourceState=confirmed?'confirmed':checking?'checking':'pending';
      const status=confirmed?'IDENTIFICADO':checking?'CONSULTANDO':'NÃO CONFIRMADO';
      btn.setAttribute('title',`${btn.dataset.qsoSourceTitle} — ${status}`);
      btn.setAttribute('aria-label',`${btn.dataset.qsoSourceTitle} — ${status}`);
    });
  }

  function selectedCall(){
    const anatel=document.querySelector('#lookupResults [data-anatel-call]');
    if(anatel)return normCall(anatel.dataset.anatelCall);
    const source=document.querySelector('#lookupResults .source-btn[data-source][data-call]');
    if(source)return normCall(source.dataset.call);
    return '';
  }

  function resetVisible(call=''){
    const c=normCall(call||selectedCall());
    ['radioid','qrz','echolink','bm'].forEach(s=>setVisual(s,'pending',c));
    if(c&&sourceButtons('anatel').some(b=>normCall(b.dataset.anatelCall)===c))setVisual('anatel','confirmed',c);
    else setVisual('anatel','pending',c);
  }

  async function fetchText(url,ms=6500){
    const ctrl=('AbortController' in window)?new AbortController():null;
    const timer=ctrl?setTimeout(()=>ctrl.abort(),ms):null;
    try{
      const resp=await fetch(url,{
        method:'GET',mode:'cors',credentials:'omit',cache:'no-store',
        headers:{Accept:'text/plain, application/json;q=0.9, text/html;q=0.8, */*;q=0.7'},
        signal:ctrl?ctrl.signal:undefined
      });
      if(!resp.ok)throw new Error('HTTP '+resp.status);
      return await resp.text();
    }finally{if(timer)clearTimeout(timer);}
  }

  function looseJson(text){
    let t=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
    try{return JSON.parse(t);}catch(_){ }
    const starts=[t.indexOf('{'),t.indexOf('[')].filter(i=>i>=0);
    if(!starts.length)return null;
    const start=Math.min(...starts),end=Math.max(t.lastIndexOf('}'),t.lastIndexOf(']'));
    if(end<start)return null;
    try{return JSON.parse(t.slice(start,end+1));}catch(_){return null;}
  }

  function arrayFromJson(j){
    if(Array.isArray(j))return j;
    if(!j||typeof j!=='object')return null;
    for(const key of ['results','users','data','result','items']){
      if(Array.isArray(j[key]))return j[key];
      if(j[key]&&typeof j[key]==='object')return [j[key]];
    }
    if(j.callsign||j.indicativo||j.username||j.call||j.id||j.radio_id)return [j];
    if(Number(j.count)===0||Number(j.total)===0)return [];
    return null;
  }

  function exactCallFromObject(obj,call){
    if(!obj||typeof obj!=='object')return false;
    const candidates=[obj.callsign,obj.indicativo,obj.username,obj.call,obj.Call,obj.Callsign];
    return candidates.some(v=>normCall(v)===call);
  }

  function radioIdQuickPositive(call,text){
    const raw=String(text||''),rx=escRx(call);
    if(new RegExp(`FOUND\\s+0\\s+MATCH(?:ES)?\\s+FOR\\s+["']?${rx}["']?`,'i').test(raw))return false;
    if(new RegExp(`FOUND\\s+[1-9]\\d*\\s+MATCH(?:ES)?\\s+FOR\\s+["']${rx}["']`,'i').test(raw)&&
       /DIRECT\s+MATCH(?:ES)?/i.test(raw)&&new RegExp(`\\b${rx}\\b`,'i').test(raw))return true;
    if(new RegExp(`\\|\\s*\\d{5,10}\\s*\\|\\s*${rx}\\s*\\|`,'i').test(raw))return true;
    return null;
  }

  async function verifyRadioId(call){
    const q=encodeURIComponent(call);
    const api=[
      `https://radioid.net/api/dmr/user/?callsign=${q}`,
      `https://database.radioid.net/api/dmr/user/?callsign=${q}`,
      `https://radioid.net/api/users?callsign=${q}&per_page=10&page=1`
    ];
    let explicitNegative=false;
    for(const url of api){
      try{
        const j=looseJson(await fetchText(url,5200)),list=arrayFromJson(j);
        if(Array.isArray(list)){
          if(list.some(x=>exactCallFromObject(x,call)))return true;
          if(list.length===0)explicitNegative=true;
        }
      }catch(_){ }
    }
    const quick=`https://radioid.net/database/quicksearch?q=${q}&jscheck=1`;
    for(const url of [`https://r.jina.ai/${quick}`,`https://r.jina.ai/http://${quick.replace(/^https?:\/\//,'')}`]){
      try{
        const result=radioIdQuickPositive(call,await fetchText(url,6500));
        if(result===true)return true;
        if(result===false)explicitNegative=true;
      }catch(_){ }
    }
    return explicitNegative?false:null;
  }

  function qrzPositive(call,text){
    const raw=String(text||''),rx=escRx(call),flat=raw.toUpperCase().replace(/\s+/g,' ').trim();
    if(new RegExp(`0\\s+MATCH(?:ES)?\\s+FOR\\s*:?\\s*["']?${rx}["']?`,'i').test(raw)||
       /CALLSIGN\s+NOT\s+FOUND|NO\s+SUCH\s+CALLSIGN|NOT\s+IN\s+(?:THE\s+)?DATABASE/i.test(raw))return false;
    if(new RegExp(`(?:^|\\n)\\s*(?:TITLE\\s*:\\s*)?${rx}\\s*-\\s*CALLSIGN\\s+LOOKUP\\s+BY\\s+QRZ\\s+HAM\\s+RADIO`,'im').test(raw))return true;
    if(new RegExp(`\\b${rx}\\b[\\s\\S]{0,650}(?:LOGIN\\s+IS\\s+REQUIRED\\s+FOR\\s+ADDITIONAL\\s+DETAIL|HAM\\s+MEMBER\\s+LOOKUPS|LOG\\s+A\\s+NEW\\s+CONTACT\\s+WITH|BIOGRAPHY)`,'i').test(raw))return true;
    const pos=flat.indexOf(call);
    if(pos>=0){
      const part=flat.slice(pos,pos+750);
      if(['LOGIN IS REQUIRED FOR ADDITIONAL DETAIL','HAM MEMBER LOOKUPS','LOG A NEW CONTACT WITH','BIOGRAPHY'].some(x=>part.includes(x)))return true;
    }
    return null;
  }

  async function verifyQrz(call){
    const page=`https://www.qrz.com/db/${encodeURIComponent(call)}`;
    let explicitNegative=false;
    for(const url of [page,`https://r.jina.ai/${page}`,`https://r.jina.ai/http://${page.replace(/^https?:\/\//,'')}`]){
      try{
        const result=qrzPositive(call,await fetchText(url,url===page?4500:6500));
        if(result===true)return true;
        if(result===false)explicitNegative=true;
      }catch(_){ }
    }
    return explicitNegative?false:null;
  }

  function echoPositive(call,text){
    const flat=String(text||'').toUpperCase().replace(/\s+/g,' '),target=call.toUpperCase();
    if((/NO\s+MATCH(?:ING)?\s+CALLSIGN|CALLSIGN\s+NOT\s+FOUND|NOT\s+VALIDATED|NOT\s+REGISTERED/.test(flat))&&flat.includes(target))return false;
    if(flat.includes(target)&&(/REGISTERED\s+WITH\s+ECHOLINK/.test(flat)||/VALIDATED/.test(flat)||/REGISTERED/.test(flat)))return true;
    return null;
  }

  async function verifyEchoLink(call){
    const page=`https://www.echolink.org/validation/callsign.jsp?call=${encodeURIComponent(call)}`;
    let explicitNegative=false;
    for(const url of [page,`https://r.jina.ai/${page}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(page)}`]){
      try{
        const result=echoPositive(call,await fetchText(url,url===page?4500:6500));
        if(result===true)return true;
        if(result===false)explicitNegative=true;
      }catch(_){ }
    }
    return explicitNegative?false:null;
  }

  function brandMeisterJsonPositive(call,j){
    if(!j||typeof j!=='object')return null;
    const list=Array.isArray(j)?j:[j];
    if(list.some(x=>exactCallFromObject(x,call)))return true;
    if(j.error||j.message||j.status===404||list.length===0)return false;
    return null;
  }

  async function verifyBrandMeister(call){
    const q=encodeURIComponent(call);
    const urls=[
      `https://api.brandmeister.network/v2/user/byCall/${q}`,
      `https://api.brandmeister.network/v2/device/byCall?callsign=${q}`
    ];
    let explicitNegative=false;
    for(const base of urls){
      for(const url of [base,`https://r.jina.ai/${base}`]){
        try{
          const result=brandMeisterJsonPositive(call,looseJson(await fetchText(url,url===base?4500:6500)));
          if(result===true)return true;
          if(result===false)explicitNegative=true;
        }catch(_){ }
      }
    }
    return explicitNegative?false:null;
  }

  const verifiers={radioid:verifyRadioId,qrz:verifyQrz,echolink:verifyEchoLink,bm:verifyBrandMeister};

  function cacheKey(call,source){return `${call}|${source}`;}
  function getCached(call,source){
    const item=cache.get(cacheKey(call,source));
    if(!item||Date.now()-item.at>CACHE_TTL)return undefined;
    return item.value;
  }
  function putCached(call,source,value){
    if(value===true||value===false)cache.set(cacheKey(call,source),{value,at:Date.now()});
  }

  async function checkSource(call,source,token){
    const cached=getCached(call,source);
    if(cached!==undefined){
      if(token===generation&&selectedCall()===call)setVisual(source,cached?'confirmed':'pending',call);
      return;
    }
    setVisual(source,'checking',call);
    let result=null;
    try{result=await verifiers[source](call);}catch(err){console.warn(`[QSO] Falha ao consultar ${source}:`,err);}
    putCached(call,source,result);
    if(token!==generation||selectedCall()!==call)return;
    setVisual(source,result===true?'confirmed':'pending',call);
  }

  function startForVisibleCard(){
    installStyle();
    const call=selectedCall();
    if(!call)return;
    const token=++generation;
    resetVisible(call);
    setVisual('anatel','confirmed',call);
    for(const source of ['radioid','qrz','echolink','bm'])checkSource(call,source,token);
  }

  function clearOnLookupChange(){
    generation++;
    resetVisible('');
  }

  function bind(){
    installStyle();
    const lookup=document.getElementById('lookup');
    if(lookup&&lookup.dataset.qsoSourceStatusBound!=='1'){
      lookup.dataset.qsoSourceStatusBound='1';
      lookup.addEventListener('input',clearOnLookupChange,true);
    }
    const call=document.getElementById('call');
    if(call&&call.dataset.qsoSourceStatusBound!=='1'){
      call.dataset.qsoSourceStatusBound='1';
      call.addEventListener('input',()=>{if(normCall(call.value)!==selectedCall())clearOnLookupChange();},true);
    }
    if(selectedCall())startForVisibleCard();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();

  new MutationObserver(()=>{
    clearTimeout(uiTimer);
    uiTimer=setTimeout(()=>{
      installStyle();
      const call=selectedCall();
      if(call){
        const card=document.querySelector('#lookupResults .source-card');
        if(card&&card.dataset.qsoSourceStatusCall!==call){
          card.dataset.qsoSourceStatusCall=call;
          startForVisibleCard();
        }
      }
    },45);
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
