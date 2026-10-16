// 引き返す女中：応接間を見回ったあと廊下へ戻る間は、立ち止まらず振り返らず、物音にも向き直らない
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/'),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300); await p.click('#skip'); await p.waitForTimeout(200); await p.click('#skip');
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:8000});
  await p.evaluate(()=>{ const D=window.__dbg; D.W.grace=1e9; D.tp(2.5,1.7,0); const P=D.PATROLS[0]; Object.assign(P,{x:4.25,z:3.6,i:3,wait:0.2,dir:1}); });
  const gt=()=>p.evaluate(()=>window.__isu().t); let t0=await gt(), maxTurn=0, maxWait=0, heardOnce=false, minX=99;
  while(await gt()<t0+14){ await p.waitForTimeout(150);
    const r=await p.evaluate(()=>{ const P=window.__dbg.PATROLS[0]; let da=Math.abs(((P.lyaw-P.yaw)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI); return {dir:P.dir,i:P.i,x:P.x,da,wait:P.wait,alert:!!P.alert}; });
    if(r.dir===-1&&r.i>0){ if(!heardOnce){ heardOnce=true; await p.evaluate(()=>window.__dbg.heard&&window.__dbg.heard()); }
      if(r.x>5) { maxTurn=Math.max(maxTurn,r.da); maxWait=Math.max(maxWait,r.wait); } if(r.alert) logs.push('ALERT while leaving'); }
    minX=Math.min(minX,r.x); }
  const end=await p.evaluate(()=>{ const P=window.__dbg.PATROLS[0]; return {x:+P.x.toFixed(1),i:P.i,dir:P.dir}; });
  console.log('leaving: max look-away from heading',maxTurn.toFixed(2),'max wait',maxWait.toFixed(2),'end',end, 'state',await p.evaluate(()=>window.__isu().state));
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
