// 置き場の外でも、動かずにいれば二度までは見逃される。三度目は女中が立ち止まる
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/'),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300); await p.click('#skip'); await p.waitForTimeout(200); await p.click('#skip');
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:30000});
  const st=()=>p.evaluate(()=>{const W=window.__dbg.W,S=window.__isu(); return {t:+S.t.toFixed(1),state:S.state,pardon:W.pardon,noticing:!!W.noticeP,sub:document.getElementById('sub').textContent}});
  const setup=()=>p.evaluate(()=>{ const D=window.__dbg,W=D.W; D.tp(12,4,Math.PI/2); Object.assign(W,{grace:0,moveT:-9,wob:0,notice:0,noticeP:null,povCd:0,povT:0,pardonCd:0});
     const P=D.PATROLS[0]; Object.assign(P,{x:17.5,z:4,i:2,dir:1,wait:0,alert:null}); D.PATROLS[1].x=2.5;D.PATROLS[1].z=7.6; });
  const away=()=>p.evaluate(()=>{ const P=window.__dbg.PATROLS[0]; Object.assign(P,{x:19.5,z:7.5,wait:99,alert:null}); });
  const until=async(fn,s)=>{ const t0=(await st()).t; for(;;){ const r=await st(); if(fn(r)||r.t>t0+s) return r; await p.waitForTimeout(100);} };
  for(let k=1;k<=3;k++){ await setup(); const r=await until(r=>r.pardon>=k||r.noticing||r.state!=='walk',14); console.log('encounter',k,r); await away(); await until(()=>false,1.5); }
  const r=await until(r=>r.state!=='walk',4); console.log('end',r.state,r.sub);
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
