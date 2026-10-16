// 定点の視点と、画面の向きのまま進む操作：各所の見え方を撮り、指で右へ引けば画面の右へ進むかを確かめる
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820},hasTouch:false});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/')+(process.env.QS?'?'+process.env.QS:''),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300); await p.click('#skip'); await p.waitForTimeout(200); await p.click('#skip');
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:30000});
  const OUT=process.env.OUT||'.';
  const gt=()=>p.evaluate(()=>window.__isu().t);
  const waitG=async s=>{ const t0=await gt(); while(await gt()<t0+s) await p.waitForTimeout(100); };
  const tp=(x,z,yaw)=>p.evaluate(([x,z,yaw])=>{ const D=window.__dbg; D.tp(x,z,yaw); D.W.grace=1e9; },[x,z,yaw]);
  for(const [n,x,z,yaw] of [['R',3.2,4.1,Math.PI/2],['F',11.3,4.2,Math.PI/2],['H',18.5,4.5,0],['U',20,11,0],['S',2.5,10,0],['B',12,15.5,Math.PI/2]]){
    await tp(x,z,yaw); await waitG(0.6); const id=await p.evaluate(()=>window.__dbg.W.camId); console.log(n,'cam',id); await p.screenshot({path:`${OUT}/cam-${n}.png`}); }
  // 応接間で、指を右へ引く
  await tp(3.2,4.1,Math.PI/2); await waitG(0.4);
  const a=await p.evaluate(()=>({x:window.__dbg.W.x,z:window.__dbg.W.z}));
  await p.mouse.move(210,400); await p.mouse.down(); await p.mouse.move(250,400,{steps:4}); await waitG(2.2); await p.mouse.up();
  const c=await p.evaluate(()=>({x:window.__dbg.W.x,z:window.__dbg.W.z,sub:document.getElementById('sub').textContent}));
  console.log('drag right in R:',a,'->',c, 'expect z up (screen right = +z here)');
  // 長く押しても輪の外まで引けば急ぎ足で鳴く
  await p.mouse.move(210,400); await p.mouse.down(); await p.mouse.move(210,300,{steps:4}); await waitG(1.2); await p.mouse.up();
  console.log('rush up:',await p.evaluate(()=>({x:window.__dbg.W.x,z:window.__dbg.W.z,wob:window.__dbg.W.wob})));
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
