// 置き場に収まるたびに続きからの地点が覚えられ、露見したらそこから歩き直す
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
  const chk=()=>p.evaluate(()=>{ const c=window.__dbg.CHECK(); return c&&{id:c.id,x:+c.x.toFixed(2),z:+c.z.toFixed(2)}; });
  // 表の廊下の、長椅子の並び（置き場）へ移って、じっとする
  for(const [x,z] of [[9,4],[13.2,4.58]]){ await p.evaluate(([x,z])=>window.__dbg.tp(x,z,Math.PI/2),[x,z]); const t0=await gt(); while(await gt()<t0+1.5) await p.waitForTimeout(100); console.log('at',x,z,'check',JSON.stringify(await chk())); }
  // 置き場の外へ出て、露見する
  await p.evaluate(()=>window.__dbg.tp(15,4,Math.PI/2)); const t0=await gt(); while(await gt()<t0+1) await p.waitForTimeout(100);
  await p.evaluate(()=>{ const D=window.__dbg; D.W.grace=0; D.walkCaught(D.PATROLS[0],"……椅子が、歩いている。"); });
  await p.waitForFunction(()=>window.__isu().state==='result',null,{timeout:60000});
  console.log('retry button',await p.textContent('#retry'));
  await p.click('#retry'); await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:30000});
  const t1=await gt(); while(await gt()<t1+0.5) await p.waitForTimeout(100);
  console.log('resumed at',await p.evaluate(()=>{ const D=window.__dbg; return {x:+D.W.x.toFixed(2),z:+D.W.z.toFixed(2),inPlace:!!D.inPlace(),maids:D.PATROLS.map(P=>+Math.hypot(P.x-D.W.x,P.z-D.W.z).toFixed(1))}; }));
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
