const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message)); p.on('console',m=>{ if(m.type()==='error') logs.push('CON '+m.text()); });
  
  await p.goto((process.env.BASE||'http://localhost:4173/'),{waitUntil:'load'}); await p.waitForTimeout(500);
  // 早送り：各客を短く、聴き耳なし
  await p.evaluate(()=>{ for(const st of Object.values(window.__dbg.SITTERS)){ st.dur=2; st.listen=[]; st.lines=st.lines.slice(0,1).map(l=>[0.2,l[1]]); } });
  await p.click('#start');
  const seenStates=new Set(); let introTexts=new Set();
  for(let i=0;i<500;i++){
    const st=await p.evaluate(()=>{const S=window.__isu(); return {state:S.state,night:S.night,seen:S.seen.length,txt:document.getElementById('introp').textContent,introHidden:document.getElementById('intro').hidden};});
    seenStates.add(`${st.state}:${st.night}`); if(!st.introHidden) introTexts.add(st.txt);
    if(st.state==='result') break;
    if(!st.introHidden) await p.click('#intro'); if(await p.evaluate(()=>!document.getElementById('pick').hidden)) await p.click('#picks button:last-child'); // 一文ずつ送る
    if(st.state==='walk') await p.evaluate(i=>{ const D=window.__dbg; D.W.grace=1e9; if(!D.W.arrived){ D.tp(19.6,17.6,0); window.__isu().t+=1; D.walkStep(i%2?1:-1); } },i);
    await p.waitForTimeout(400);
  }
  const fin=await p.evaluate(()=>{const S=window.__isu(); return {state:S.state,seen:S.seen.map(x=>x.name),rk:document.getElementById('rk').textContent,rh:document.getElementById('rh').textContent,share:S.share,retryHidden:document.getElementById('retry').hidden};});
  console.log('states',[...seenStates].join(' '));
  console.log('overlay texts:\n  '+[...introTexts].join('\n  '));
  console.log('final',JSON.stringify(fin,null,1));
  await p.waitForFunction(()=>!!window.__isu().cardBlob,null,{timeout:20000});
  const b64=await p.evaluate(async()=>{ const b=window.__isu().cardBlob; const buf=new Uint8Array(await b.arrayBuffer()); let s=''; for(const x of buf) s+=String.fromCharCode(x); return btoa(s); });
  fs.writeFileSync('card-full3d.png',Buffer.from(b64,'base64'));
  // 第二夜で露見 → この夜から
  await p.evaluate(()=>{ const S=window.__isu(); S.night=1; S.snap={seen:[],frags:[],log:{}}; window.__fin(true); });
  console.log('caught n2: retry hidden =',await p.evaluate(()=>document.getElementById('retry').hidden), 'again =', await p.textContent('#again'), 'rk =', await p.textContent('#rk'));
  await p.click('#retry'); await p.waitForTimeout(300);
  console.log('after retry: night',await p.evaluate(()=>window.__isu().night),'overlay',await p.textContent('#introp'));
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
