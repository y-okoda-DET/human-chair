// 道を塞ぐ椅子：廊下の真ん中で止まっていても、女中は脇をよけて通り過ぎる
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/'),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300); await p.click('#skip'); await p.waitForTimeout(200); await p.click('#skip');
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:20000});
  const gt=()=>p.evaluate(()=>window.__isu().t);
  for(const [x,z] of [[11.0,4.0],[13.2,4.4]]){
    await p.evaluate(([x,z])=>{ const D=window.__dbg; D.W.grace=1e9; D.tp(x,z,Math.PI/2); Object.assign(D.PATROLS[0],{x:14.5,z:4.1,i:1,dir:1,wait:0,alert:null}); },[x,z]);
    const t0=await gt(); while(await gt()<t0+9) await p.waitForTimeout(150);
    console.log('chair at',x,z,'maid now',await p.evaluate(()=>{ const P=window.__dbg.PATROLS[0]; return [+P.x.toFixed(2),+P.z.toFixed(2),P.i]; }));
  }
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
