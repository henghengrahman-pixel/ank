const { getSettings, getMarkets, getMeta, saveMeta } = require('./data');
const { saveDailyResult, getLatestResultByMarket } = require('./results');

function decodeHtml(s='') {
  return String(s)
    .replace(/&nbsp;?/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(s='') {
  return decodeHtml(s)
    .toUpperCase()
    .replace(/\bPOOLS?\b/g, '')
    .replace(/[^A-Z0-9]+/g, '')
    .trim();
}

function validNumber(s='') {
  return /^\d{4,5}$/.test(String(s));
}

function parseWdbandar(html) {
  const out = [];
  const cards = String(html).split(/<div[^>]*class=["'][^"']*hasil-card(?:\s|["'])/i).slice(1);
  for (const chunk of cards) {
    const block = chunk;
    const nameM = block.match(/<div[^>]*class=["'][^"']*hasil-name[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const dateM = block.match(/<div[^>]*class=["'][^"']*hasil-head-right[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const periodM = block.match(/<div[^>]*class=["'][^"']*hasil-period[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const numberStart = block.search(/<div[^>]*class=["'][^"']*hasil-number-container[^"']*["'][^>]*>/i);
    if (!nameM || !dateM || numberStart < 0) continue;
    const numberArea = block.slice(numberStart);
    const digits = [...numberArea.matchAll(/<div[^>]*class=["'][^"']*lottery-draw-number[^"']*["'][^>]*>\s*([0-9])\s*<\/div>/gi)]
      .map(m => m[1]).join('').slice(0, 5);
    if (!validNumber(digits)) continue;
    const name = decodeHtml(nameM[1]);
    const date = decodeHtml(dateM[1]).match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
    const period = decodeHtml(periodM?.[1] || '').match(/\d+/)?.[0] || '';
    if (!name || !date) continue;
    out.push({ sourceType:'wdbandar', name, normalizedName: normalizeName(name), date, period, number: digits });
  }
  return dedupe(out);
}

function parseKakaktogel(html) {
  const out=[];
  const re=/<(?:button|div)[^>]*class=["'][^"']*result[^"']*["'][^>]*>([\s\S]*?)(?=<\/(?:button|div)>)/gi;
  let m;
  while((m=re.exec(String(html)))) {
    const b=m[1];
    const nm=b.match(/<div[^>]*class=["'][^"']*pasaran[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const km=b.match(/<div[^>]*class=["'][^"']*keluaran[^"']*["'][^>]*>\s*([0-9]{4,5})\s*<\/div>/i);
    const dm=b.match(/<div[^>]*class=["'][^"']*tanggal[^"']*["'][^>]*>\s*([0-9]{2})-([0-9]{2})-([0-9]{4})\s*<\/div>/i);
    if(!nm||!km||!dm) continue;
    const name=decodeHtml(nm[1]);
    if(!name) continue;
    out.push({sourceType:'kakaktogel',name,normalizedName:normalizeName(name),date:`${dm[3]}-${dm[2]}-${dm[1]}`,period:'',number:km[1]});
  }
  return dedupe(out);
}

function dedupe(items){
  const map=new Map();
  for(const x of items){ const k=`${x.normalizedName}|${x.date}|${x.period}|${x.number}`; if(!map.has(k)) map.set(k,x); }
  return [...map.values()];
}

function detectParser(html) {
  if (/lottery-draw-number/i.test(html) && /hasil-name/i.test(html)) return 'wdbandar';
  if (/class=["'][^"']*keluaran/i.test(html) && /class=["'][^"']*pasaran/i.test(html)) return 'kakaktogel';
  return 'unknown';
}

function parseSource(html) {
  const type=detectParser(html);
  if(type==='wdbandar') return {type, results:parseWdbandar(html)};
  if(type==='kakaktogel') return {type, results:parseKakaktogel(html)};
  return {type:'unknown',results:[]};
}

function marketKeys(market){
  const vals=[market.autoSourceName, market.name, ...(Array.isArray(market.autoAliases)?market.autoAliases:[])].filter(Boolean);
  return [...new Set(vals.map(normalizeName).filter(Boolean))];
}

function matchResult(market, sourceResults){
  const keys=marketKeys(market);
  return sourceResults.find(r=>keys.includes(r.normalizedName)) || null;
}

function splitUrls(primary, fallbacks) {
  const raw = [primary, ...String(fallbacks || '').split(/[\n,]+/)]
    .map(x => String(x || '').trim()).filter(Boolean);
  const seen = new Set();
  const urls = [];
  for (const value of raw) {
    if (!/^https?:\/\//i.test(value)) continue;
    let u;
    try { u = new URL(value).toString(); } catch { continue; }
    if (!seen.has(u)) { seen.add(u); urls.push(u); }
  }
  return urls;
}

function browserHeaders(url, uaIndex=0, cookie='') {
  const uas = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
  ];
  const origin = new URL(url).origin;
  const h = {
    'user-agent': uas[uaIndex % uas.length],
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'upgrade-insecure-requests': '1',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'referer': `${origin}/`
  };
  if (cookie) h.cookie = cookie;
  return h;
}

function parseSetCookie(headers) {
  let raw = '';
  if (typeof headers.getSetCookie === 'function') {
    const arr = headers.getSetCookie();
    raw = Array.isArray(arr) ? arr.join(',') : '';
  }
  if (!raw) raw = headers.get('set-cookie') || '';
  if (!raw) return '';
  return raw.split(/,(?=[^;,]+=)/).map(x => x.split(';')[0].trim()).filter(Boolean).join('; ');
}

function looksLikeChallenge(html='') {
  const s = String(html).toLowerCase();
  return s.includes('cf-chl-') || s.includes('just a moment') || s.includes('attention required') ||
    s.includes('access denied') || s.includes('captcha') || s.includes('verify you are human');
}

async function fetchOnce(url, timeoutMs, uaIndex=0, cookie='') {
  const controller=new AbortController();
  const t=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const res=await fetch(url,{
      signal:controller.signal,
      redirect:'follow',
      headers:browserHeaders(url,uaIndex,cookie)
    });
    const text = await res.text();
    return {status:res.status, ok:res.ok, text, finalUrl:res.url || url, cookie:parseSetCookie(res.headers)};
  } finally { clearTimeout(t); }
}

async function fetchTextSmart(primaryUrl, fallbackUrls, timeoutMs=15000) {
  const urls = splitUrls(primaryUrl, fallbackUrls);
  if (!urls.length) throw new Error('URL sumber AUTO belum valid');
  const attempts=[];

  for (const sourceUrl of urls) {
    let cookie='';
    for (let uaIndex=0; uaIndex<3; uaIndex++) {
      let target = sourceUrl;
      if (uaIndex > 0) {
        const u = new URL(sourceUrl);
        u.searchParams.set('_ar', String(Date.now()));
        target = u.toString();
      }
      try {
        const r = await fetchOnce(target, timeoutMs, uaIndex, cookie);
        if (r.cookie) cookie = r.cookie;
        attempts.push({url:sourceUrl,status:r.status,challenge:looksLikeChallenge(r.text)});
        if (r.ok && !looksLikeChallenge(r.text) && r.text.length > 500) {
          const parsed = parseSource(r.text);
          if (parsed.type !== 'unknown' && parsed.results.length) {
            return {html:r.text, usedUrl:sourceUrl, finalUrl:r.finalUrl, attempts, parsed};
          }
        }
        if (r.status !== 403 && r.status !== 429 && r.ok) break;
      } catch (e) {
        attempts.push({url:sourceUrl,status:'ERR',error:e.name === 'AbortError' ? 'timeout' : (e.message || String(e))});
      }
    }
  }

  const statuses = attempts.map(a => `${a.url}=${a.status}${a.challenge?'(challenge)':''}`).join(' | ');
  const has403 = attempts.some(a => a.status === 403);
  if (has403) throw new Error(`HTTP 403 dari sumber. Request sudah dicoba dengan browser headers/retry tetapi server tetap menolak akses. ${statuses}`);
  throw new Error(`Gagal mengambil result dari semua URL sumber. ${statuses}`);
}

let scanning=false;
async function scanAutoResults({force=false}={}){
  if(scanning) return {ok:false,error:'scan_sedang_berjalan'};
  scanning=true;
  const settings=getSettings();
  const cfg=settings.autoResult||{};
  const meta=getMeta();
  try{
    if(!force && cfg.enabled!==true) return {ok:false,error:'auto_result_off'};
    const url=String(cfg.sourceUrl||'').trim();
    const fetched=await fetchTextSmart(url, cfg.fallbackUrls || '', Math.max(5000, Math.min(60000, Number(cfg.timeoutMs)||15000)));
    const parsed=fetched.parsed || parseSource(fetched.html);
    if(parsed.type==='unknown') throw new Error('Struktur sumber tidak dikenali');
    if(!parsed.results.length) throw new Error('Tidak ada result valid 4D/5D yang ditemukan');

    let saved=0, matched=0, skippedSame=0;
    const details=[];
    for(const market of getMarkets()){
      if(market.autoEnabled===false) continue;
      const found=matchResult(market, parsed.results);
      if(!found) continue;
      matched++;
      const latest=getLatestResultByMarket(market.slug);
      if(latest && latest.date===found.date && latest.prize1===found.number && String(latest.sourcePeriod||'')===String(found.period||'')){
        skippedSame++;
        details.push({market:market.name,status:'same',number:found.number,date:found.date,sourceName:found.name});
        continue;
      }
      saveDailyResult(market.slug,{
        date:found.date,
        prize1:found.number,
        resultTime:market.resultTime||'00:00',
        source:'auto', sourceType:parsed.type, sourceName:found.name, sourcePeriod:found.period, sourceUrl:fetched.usedUrl
      });
      saved++;
      details.push({market:market.name,status:'saved',number:found.number,date:found.date,sourceName:found.name});
    }
    meta.autoResultStatus={ok:true,sourceType:parsed.type,sourceUrl:url,usedSourceUrl:fetched.usedUrl,finalUrl:fetched.finalUrl,lastScanAt:new Date().toISOString(),found:parsed.results.length,matched,saved,skippedSame,error:'',attempts:fetched.attempts,details:details.slice(0,100)};
    saveMeta(meta);
    return {ok:true,...meta.autoResultStatus};
  }catch(err){
    meta.autoResultStatus={ok:false,sourceUrl:(getSettings().autoResult||{}).sourceUrl||'',lastScanAt:new Date().toISOString(),found:0,matched:0,saved:0,error:err.message||String(err)};
    saveMeta(meta);
    return {ok:false,...meta.autoResultStatus};
  }finally{scanning=false;}
}

let timer=null;
function startAutoResultLoop(){
  if(timer) clearInterval(timer);
  const tick=async()=>{
    const cfg=(getSettings().autoResult||{});
    if(cfg.enabled===true) {
      const meta=getMeta();
      const last=Date.parse(meta.autoResultStatus?.lastScanAt || 0) || 0;
      const wait=Math.max(10, Math.min(3600, Number(cfg.intervalSeconds)||30))*1000;
      if(Date.now()-last >= wait) await scanAutoResults();
    }
  };
  setTimeout(tick,3000);
  timer=setInterval(tick,5000);
  return timer;
}

module.exports={normalizeName,parseWdbandar,parseKakaktogel,parseSource,matchResult,fetchTextSmart,scanAutoResults,startAutoResultLoop};
