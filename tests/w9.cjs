// 続きから：場面が変わった所を覚え、露見したら「続きから」でそこから歩き直せる
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/'),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300); await p.click('#skip'); await p.waitForTimeout(200); await p.click('#skip');
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:30000});
  await p.evaluate(()=>{ window.__dbg.W.grace=1e9; });
  const gt=()=>p.evaluate(()=>window.__isu().t);
  await p.mouse.move(210,500); await p.mouse.down(); await p.mouse.move(170,460,{steps:3});
  await p.waitForFunction(()=>window.__dbg.W.camId==='F',null,{timeout:60000}); const t0=await gt(); while(await gt()<t0+1) await p.waitForTimeout(100); await p.mouse.up();
  const at=await p.evaluate(()=>({x:+window.__dbg.W.x.toFixed(2),z:+window.__dbg.W.z.toFixed(2),cam:window.__dbg.W.camId}));
  console.log('walked to',at);
  await p.evaluate(()=>{ const D=window.__dbg; D.W.grace=0; D.walkCaught(D.PATROLS[0],"……椅子が、歩いている。"); });
  await p.waitForFunction(()=>window.__isu().state==='result',null,{timeout:60000});
  const btn=await p.evaluate(()=>({retry:document.getElementById('retry').textContent,hidden:document.getElementById('retry').hidden}));
  console.log('result button',btn);
  await p.click('#retry'); await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:20000});
  const t1=await gt(); while(await gt()<t1+0.5) await p.waitForTimeout(100);
  console.log('resumed at',await p.evaluate(()=>({x:+window.__dbg.W.x.toFixed(2),z:+window.__dbg.W.z.toFixed(2),cam:window.__dbg.W.camId,overlay:!document.getElementById('result').hidden})));
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
