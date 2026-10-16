// 書斎への道行き：近づくほど独白が熱を帯び、辿り着くと奥様の椅子と入れ替わる
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/'),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300);
  const before=[]; for(let i=0;i<12;i++){ const st=await p.evaluate(()=>({s:window.__isu().state,t:document.getElementById('introp').textContent})); if(st.s==='walk') break; if(!before.includes(st.t)) before.push(st.t); await p.click('#intro'); await p.waitForTimeout(250); }
  console.log('before:\n  '+before.join('\n  '));
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:30000});
  const OUT=process.env.OUT||'.';
  await p.evaluate(()=>{ const D=window.__dbg; D.W.grace=1e9; D.PATROLS.forEach(P=>{ P.x=2.5; P.z=12; P.wait=1e9; }); });
  const said=[];
  for(const [x,z] of [[16.5,4],[18,6],[19.5,9],[20,12],[20,14.5],[20.2,16.2]]){
    await p.evaluate(([x,z])=>{ const D=window.__dbg; D.tp(x,z,0); window.__isu().t+=6; },[x,z]);
    await p.waitForTimeout(900); await p.evaluate(()=>{ window.__isu().t+=6; }); await p.waitForTimeout(900);
    said.push(await p.evaluate(()=>[+window.__isu().near.toFixed(2),Object.keys(window.__dbg.W.said).filter(k=>k.startsWith('lure')).join(','),document.getElementById('sub').textContent]));
  }
  console.log('approach:'); for(const s of said) console.log('  ',JSON.stringify(s));
  await p.waitForTimeout(1500); await p.screenshot({path:OUT+'/lure-door.png'});
  await p.evaluate(()=>{ const D=window.__dbg; D.tp(20.2,17.7,0); window.__isu().t+=1; D.walkStep(1); });
  const arr=[]; for(let i=0;i<40;i++){ const st=await p.evaluate(()=>({s:window.__isu().state,t:document.getElementById('introp').textContent,h:document.getElementById('intro').hidden})); if(!st.h&&st.t&&!arr.includes(st.t)) arr.push(st.t); if(st.s==='wait'||st.s==='sit') break; await p.waitForTimeout(400); if(!st.h) await p.click('#intro'); }
  console.log('arrive:\n  '+arr.join('\n  '));
  console.log('state', await p.evaluate(()=>window.__isu().state));
  console.log(logs.length?logs.join('\n'):'no errors');
  await b.close();
})();
