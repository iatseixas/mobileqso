/* QSO Logbook — Databank Anatel v2.6-3
   Mantém somente uma base ANATEL visível e atualiza HAM_DB a partir do pacote oficial.
   O ZIP é filtrado antes da extração: somente o CSV de Radioamador é aproveitado. */
(function(){
  'use strict';

  const VERSION='2.6-5';
  const ANATEL_ZIP_URL='https://www.anatel.gov.br/dadosabertos/paineis_de_dados/outorga_e_licenciamento/estacoes_licenciadas.zip';
  let useLocalPackage=false;
  const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  const norm=v=>String(v??'').trim();
  const key=v=>norm(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const readU16=(a,o)=>a[o]|(a[o+1]<<8);
  const readU32=(a,o)=>(a[o]|(a[o+1]<<8)|(a[o+2]<<16)|(a[o+3]<<24))>>>0;

  function decodeBytes(bytes){
    let txt=new TextDecoder('utf-8').decode(bytes);
    const bad=(txt.match(/\uFFFD/g)||[]).length;
    if(bad>8){try{txt=new TextDecoder('windows-1252').decode(bytes)}catch(_){}}
    return txt.replace(/^\uFEFF/,'');
  }

  function parseCsv(text){
    const rows=[]; let row=[],field='',quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(quoted){
        if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}
        else if(ch==='"') quoted=false;
        else field+=ch;
      }else if(ch==='"') quoted=true;
      else if(ch===';'){row.push(field);field='';}
      else if(ch==='\n'){row.push(field);rows.push(row);row=[];field='';}
      else if(ch!=='\r') field+=ch;
    }
    if(field.length||row.length){row.push(field);rows.push(row);}
    return rows;
  }

  function zipDirectory(buffer){
    const a=new Uint8Array(buffer); let eocd=-1;
    for(let i=a.length-22;i>=Math.max(0,a.length-65557);i--){if(readU32(a,i)===0x06054b50){eocd=i;break;}}
    if(eocd<0) throw new Error('ZIP inválido');
    const count=readU16(a,eocd+10), centralOff=readU32(a,eocd+16), dec=new TextDecoder();
    const out=[]; let p=centralOff;
    for(let n=0;n<count;n++){
      if(readU32(a,p)!==0x02014b50) throw new Error('Diretório ZIP inválido');
      const method=readU16(a,p+10), compSize=readU32(a,p+20), rawSize=readU32(a,p+24);
      const nameLen=readU16(a,p+28), extraLen=readU16(a,p+30), commentLen=readU16(a,p+32), localOff=readU32(a,p+42);
      const name=dec.decode(a.slice(p+46,p+46+nameLen));
      out.push({name,method,compSize,rawSize,localOff});
      p+=46+nameLen+extraLen+commentLen;
    }
    return {bytes:a,entries:out};
  }

  async function extractEntry(zip,entry){
    const a=zip.bytes,o=entry.localOff;
    if(readU32(a,o)!==0x04034b50) throw new Error('Entrada ZIP inválida');
    const nameLen=readU16(a,o+26),extraLen=readU16(a,o+28),start=o+30+nameLen+extraLen;
    const comp=a.slice(start,start+entry.compSize);
    if(entry.method===0) return comp;
    if(entry.method===8&&typeof DecompressionStream!=='undefined'){
      const ds=new DecompressionStream('deflate-raw');
      return new Uint8Array(await new Response(new Blob([comp]).stream().pipeThrough(ds)).arrayBuffer());
    }
    throw new Error('Compressão ZIP não suportada neste navegador');
  }

  const SIGNATURE=['INDICATIVO','SERVICO','NUMERO DA ESTACAO','NOME DA ENTIDADE','MUNICIPIO DA ESTACAO','UF DA ESTACAO'];
  function headerScore(bytes){
    const first=(decodeBytes(bytes.slice(0,Math.min(bytes.length,16384))).split(/\r?\n/,1)[0]||'');
    const h=key(first);
    return SIGNATURE.filter(x=>h.includes(x)).length;
  }

  async function pickRadioamadorCsv(buffer){
    const zip=zipDirectory(buffer);
    let candidates=zip.entries.filter(e=>/\.csv$/i.test(e.name));
    if(!candidates.length) throw new Error('O pacote ANATEL não contém arquivos CSV');
    candidates=candidates.sort((a,b)=>{
      const sa=/ESTACOES?[_ -]?RADIOAMADOR/i.test(key(a.name))?100:/RADIOAMADOR/i.test(key(a.name))?80:0;
      const sb=/ESTACOES?[_ -]?RADIOAMADOR/i.test(key(b.name))?100:/RADIOAMADOR/i.test(key(b.name))?80:0;
      return sb-sa;
    });
    for(const entry of candidates){
      const data=await extractEntry(zip,entry);
      if(headerScore(data)>=SIGNATURE.length) return {name:entry.name,bytes:data};
    }
    throw new Error('Arquivo Estacoes_Radioamador.csv não localizado ou incompatível');
  }

  function dateStamp(v){const m=norm(v).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?Date.UTC(+m[3],+m[2]-1,+m[1]):NaN;}
  function statusRank(v){const s=key(v);if(s==='ATIVA')return 3;if(s&&s!=='N/I')return 2;return 1;}

  function aggregate(text){
    const matrix=parseCsv(text);
    if(matrix.length<2) throw new Error('CSV ANATEL vazio');
    const headers=matrix[0].map(key),col={}; headers.forEach((h,i)=>col[h]=i);
    const req=['INDICATIVO','SERVICO','NUMERO DA ESTACAO','NOME DA ENTIDADE','COER','MUNICIPIO DA ESTACAO','UF DA ESTACAO','DATA DO PRIMEIRO LICENCIAMENTO','DATA DO ULTIMO LICENCIAMENTO','STATUS DA VALIDADE'];
    const missing=req.filter(h=>col[h]==null);
    if(missing.length) throw new Error('CSV ANATEL incompatível: '+missing.join(', '));
    const map=new Map(),order=[];
    for(const r of matrix.slice(1)){
      if(!r?.length) continue;
      const service=key(r[col['SERVICO']]);
      if(service&&!service.includes('RADIOAMADOR')) continue;
      const call=norm(r[col['INDICATIVO']]).toUpperCase();
      if(!call) continue;
      let x=map.get(call);
      if(!x){
        x={call,name:'',city:'',uf:'',clazz:'',first:'',firstTs:Infinity,last:'',lastTs:-Infinity,status:'N/I',statusRank:0,stations:new Set(),fallbackStations:0};
        map.set(call,x); order.push(call);
      }
      const name=norm(r[col['NOME DA ENTIDADE']]),city=norm(r[col['MUNICIPIO DA ESTACAO']]),uf=norm(r[col['UF DA ESTACAO']]).toUpperCase();
      const clazz=norm(r[col['COER']]),first=norm(r[col['DATA DO PRIMEIRO LICENCIAMENTO']]),last=norm(r[col['DATA DO ULTIMO LICENCIAMENTO']]);
      const status=norm(r[col['STATUS DA VALIDADE']])||'N/I',station=norm(r[col['NUMERO DA ESTACAO']]);
      if(!x.name&&name)x.name=name; if(!x.city&&city)x.city=city; if(!x.uf&&uf)x.uf=uf;
      if((!x.clazz||key(x.clazz)==='N/I')&&clazz)x.clazz=clazz;
      const fts=dateStamp(first); if(Number.isFinite(fts)&&fts<x.firstTs){x.firstTs=fts;x.first=first;}else if(!x.first&&first)x.first=first;
      const lts=dateStamp(last); if(Number.isFinite(lts)&&lts>x.lastTs){x.lastTs=lts;x.last=last;}else if(!x.last&&last)x.last=last;
      const sr=statusRank(status); if(sr>x.statusRank){x.statusRank=sr;x.status=status;}
      if(station)x.stations.add(station); else x.fallbackStations++;
    }
    if(!map.size) throw new Error('Nenhum registro de Radioamador encontrado');
    const data=order.map(call=>{const x=map.get(call);return [x.call,x.name,x.city,x.uf,x.clazz||'N/A',x.first,x.last,x.status||'N/I',x.stations.size||x.fallbackStations||1];});
    return {data,stationCount:data.reduce((n,r)=>n+(Number(r[8])||0),0)};
  }

  async function installCsv(bytes,sourceName='Estacoes_Radioamador.csv'){
    const result=aggregate(decodeBytes(bytes));
    HAM_DB=result.data;
    STATION_COUNT=result.stationCount;
    await saveDatabank('ham');
    renderFreq(); renderQsoRadioSearch(); setStatus();
    try{await renderStats();}catch(_){ }
    renderDatabankPanel('stations');
    toast(`Databank ANATEL atualizado • ${HAM_DB.length.toLocaleString('pt-BR')} indicativos • ${STATION_COUNT.toLocaleString('pt-BR')} estações`);
    console.info('[QSO Logbook] ANATEL instalado:',sourceName,HAM_DB.length,STATION_COUNT);
  }

  async function importPackage(file){
    const name=(file?.name||'').toLowerCase();
    if(name.endsWith('.csv')) return installCsv(new Uint8Array(await file.arrayBuffer()),file.name);
    const picked=await pickRadioamadorCsv(await file.arrayBuffer());
    return installCsv(picked.bytes,picked.name);
  }

  function openPackagePicker(){
    const input=document.createElement('input');
    input.type='file';
    input.accept='.zip,.csv,application/zip,application/x-zip-compressed,text/csv,text/plain';
    input.setAttribute('aria-label','Selecionar pacote ANATEL');
    input.style.cssText='position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:.01;z-index:2147483647;pointer-events:auto';
    const cleanup=()=>{try{input.remove()}catch(_){}};
    input.addEventListener('change',async()=>{
      const file=input.files&&input.files[0];
      if(!file){cleanup();return;}
      try{
        toast('Lendo pacote ANATEL...');
        await importPackage(file);
        useLocalPackage=false;
      }catch(err){
        console.error(err);
        toast('Falha no pacote ANATEL: '+(err.message||'arquivo inválido'));
      }finally{cleanup();}
    },{once:true});
    input.addEventListener('cancel',cleanup,{once:true});
    document.body.appendChild(input);
    try{
      if(typeof input.showPicker==='function') input.showPicker();
      else input.click();
    }catch(err){
      try{input.click()}catch(_){cleanup();toast('Não foi possível abrir Arquivos no iPhone.');}
    }
  }

  async function downloadDatabank(button){
    // Safari/iOS bloqueia o fetch CORS da ANATEL e também pode bloquear um picker
    // disparado somente depois de uma Promise. Por isso, no iPhone o picker é
    // aberto diretamente dentro do gesto do usuário, no primeiro toque.
    if(IS_IOS){
      openPackagePicker();
      return;
    }
    if(useLocalPackage){openPackagePicker();return;}
    const old=button.textContent; button.disabled=true; button.textContent='Baixando...';
    try{
      const resp=await fetch(ANATEL_ZIP_URL,{cache:'no-store',mode:'cors'});
      if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const type=(resp.headers.get('content-type')||'').toLowerCase();
      const buf=await resp.arrayBuffer();
      if(!buf.byteLength||type.includes('text/html')) throw new Error('Resposta ANATEL bloqueada');
      const file=new File([buf],'estacoes_licenciadas.zip',{type:'application/zip'});
      await importPackage(file);
      useLocalPackage=false;
    }catch(err){
      console.warn('[QSO Logbook] Download direto ANATEL indisponível:',err);
      useLocalPackage=true;
      toast('Servidor ANATEL bloqueou o download direto. Toque novamente em Baixar Databank para selecionar o ZIP/CSV.');
    }finally{button.disabled=false;button.textContent=old;}
  }

  const originalRender=renderDatabankPanel;
  renderDatabankPanel=function(keyName){
    if(keyName!=='stations') return originalRender(keyName);
    const det=document.querySelector('.db-bank[data-bank="stations"]'); if(!det)return;
    const body=det.querySelector('.db-bank-body');
    body.innerHTML=`<div class="db-meta"><span class="badge">Databank Anatel</span><span class="badge">${STATION_COUNT.toLocaleString('pt-BR')} estações</span><span class="badge">${dbStateFor('stations')}</span></div><div class="db-actions"><button class="btn primary full" type="button" data-anatel-download>Baixar Databank</button></div><div class="db-excel-note">O QSO Logbook aproveita somente o CSV de Radioamador do pacote oficial da ANATEL. Os demais arquivos do ZIP são descartados automaticamente. No iPhone, Baixar Databank abre diretamente o app Arquivos para selecionar o ZIP/CSV da ANATEL. O QSO Logbook filtra automaticamente apenas o arquivo de Radioamador.</div>`;
    body.querySelector('[data-anatel-download]').onclick=e=>downloadDatabank(e.currentTarget);
  };

  function applyUi(){
    const ham=document.querySelector('.db-bank[data-bank="ham"]');
    if(ham){ham.hidden=true;ham.style.display='none';ham.setAttribute('aria-hidden','true');}
    const stations=document.querySelector('.db-bank[data-bank="stations"]');
    const title=stations?.querySelector('summary span'); if(title)title.textContent='Databank Anatel';
    const hint=document.querySelector('#databanksCard .hint');
    if(hint)hint.textContent='O Databank Anatel é atualizado pelo pacote oficial de estações licenciadas. O QSO Logbook identifica automaticamente o arquivo de Radioamador dentro do ZIP e descarta os demais arquivos.';
    if(typeof DATABANK_META!=='undefined'&&DATABANK_META.stations)DATABANK_META.stations.label='Databank Anatel';
    if(stations?.open)renderDatabankPanel('stations');
  }

  applyUi();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyUi,{once:true});
  window.addEventListener('pageshow',applyUi);
  console.info('[QSO Logbook] Databank Anatel runtime',VERSION);
})();
