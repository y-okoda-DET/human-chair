const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/')+(process.env.QS?'?'+process.env.QS:''),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300); await p.click('#skip'); await p.waitForTimeout(200); await p.click('#skip');
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:8000});
  const wait=async s=>{ const t0=await p.evaluate(()=>window.__isu().t); await p.waitForFunction(t=>window.__isu().t>t,t0+s,{timeout:60000}); };
  await p.evaluate(()=>{ window.__dbg.W.grace=1e9; });
  const shots=(process.argv[2]||'').split(',');
  const at={start:[3.2,4.1,Math.PI/2],front:[8,4,Math.PI/2],hall:[17,4,Math.PI/2],stairs:[20.9,2.5,0],up:[19.8,9.5,0],back:[2.5,9,0],bstairs:[8,15.5,Math.PI/2]};
  for(const k of shots){ const [x,z,y]=at[k]; await p.evaluate(([x,z,y])=>{ window.__dbg.tp(x,z,y); window.__dbg.W.idle=0; window.__dbg.W.inK=0; },[x,z,y]); await wait(0.4); await p.screenshot({path:(process.env.OUT||'.')+'/v-'+k+'.png'}); }
  if(process.argv[3]){ await wait(2.5); await p.screenshot({path:(process.env.OUT||'.')+'/v-inside.png'}); }
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
