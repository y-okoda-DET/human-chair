// 続きから（廊下）で即座に見つからないこと／息を殺せば灯りを凌げること
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/'),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300); await p.click('#skip'); await p.waitForTimeout(200); await p.click('#skip');
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:30000});
  const gt=()=>p.evaluate(()=>window.__isu().t); const wait=async s=>{ const t0=await gt(); while(await gt()<t0+s) await p.waitForTimeout(100); };
  // 女中が廊下を下ってくる最中に、廊下へ踏み込む
  await p.evaluate(()=>{ const D=window.__dbg; D.W.grace=1e9; Object.assign(D.PATROLS[0],{x:10,z:4,i:2,dir:1,wait:0}); D.tp(6.6,4.1,Math.PI/2); });
  await wait(0.3); await p.evaluate(()=>{ window.__dbg.tp(7.3,4.1,Math.PI/2); }); await wait(0.5);
  console.log('cam',await p.evaluate(()=>window.__dbg.W.camId));
  await p.evaluate(()=>{ const D=window.__dbg; D.W.grace=0; D.walkCaught(D.PATROLS[0],"……椅子が、歩いている。"); });
  await p.waitForFunction(()=>window.__isu().state==='result',null,{timeout:60000});
  await p.click('#retry'); await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:20000});
  const r0=await p.evaluate(()=>{ const D=window.__dbg, P=D.PATROLS[0]; return {me:[+D.W.x.toFixed(1),+D.W.z.toFixed(1)],maid:[+P.x.toFixed(1),+P.z.toFixed(1)],d:+Math.hypot(P.x-D.W.x,P.z-D.W.z).toFixed(1)}; });
  console.log('resume',r0);
  await wait(4); console.log('after 4s still', await p.evaluate(()=>window.__isu().state));
  // 息を殺す：置き場の外で灯りに照らされても、見逃しを使わず、見咎められない
  await p.evaluate(()=>{ const D=window.__dbg; D.W.grace=1e9; D.tp(11.5,3.9,Math.PI/2); D.W.pardon=0; Object.assign(D.PATROLS[0],{x:13.5,z:4.0,i:1,dir:1,wait:99,yaw:-Math.PI/2,lyaw:-Math.PI/2,tyaw:-Math.PI/2}); });
  await wait(0.8); await p.keyboard.down('Space'); await wait(0.3); await p.evaluate(()=>{ window.__dbg.W.grace=0; });
  await wait(3); const h=await p.evaluate(()=>({pardon:window.__dbg.W.pardon,notice:!!window.__dbg.W.noticeP,state:window.__isu().state,lung:+window.__isu().lung.toFixed(2),sub:document.getElementById('sub').textContent}));
  console.log('holding',h);
  await wait(4); const g=await p.evaluate(()=>({pardon:window.__dbg.W.pardon,notice:!!window.__dbg.W.noticeP,state:window.__isu().state,sub:document.getElementById('sub').textContent}));
  console.log('breath ran out',g); await p.keyboard.up('Space');
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
