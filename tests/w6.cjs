// 見つかる決まり：照らされて置き場の外なら女中が立ち止まり、その間に凹みへ収まれば助かり、収まらなければ露見する
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/')+(process.env.QS?'?'+process.env.QS:''),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300); await p.click('#skip'); await p.waitForTimeout(200); await p.click('#skip');
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:8000});
  const OUT=process.env.OUT||'.';
  const st=()=>p.evaluate(()=>{const W=window.__dbg.W,S=window.__isu(); return {t:+S.t.toFixed(2),state:S.state,x:+W.x.toFixed(2),z:+W.z.toFixed(2),notice:+W.notice.toFixed(2),noticing:!!W.noticeP,pov:+W.povCd.toFixed(1),sub:document.getElementById('sub').textContent}});
  const setup=(x,z,yaw)=>p.evaluate(([x,z,yaw])=>{ const D=window.__dbg,W=D.W; D.tp(x,z,yaw); Object.assign(W,{grace:0,moveT:-9,wob:0,notice:0,noticeP:null,last:0,lastT:-9,povCd:0,povT:0,pardon:2,pardonLit:false});
     const P=D.PATROLS[0]; Object.assign(P,{x:17.5,z:4,i:2,dir:1,wait:0,alert:null}); D.PATROLS[1].x=2.5;D.PATROLS[1].z=7.6; D.PATROLS[2].z=17; },[x,z,yaw]);
  const until=async(fn,s)=>{ const t0=await p.evaluate(()=>window.__isu().t); for(;;){ const r=await st(); if(fn(r)||r.t>t0+s) return r; await p.waitForTimeout(100);} };
  let r;
  // B：凹みの手前で照らされ、立ち止まられた所で一歩、凹みへ収まる
  await setup(13.95,4.58,-Math.PI/2); r=await until(r=>r.noticing||r.state!=='walk',14); console.log('B noticed:',r);
  await p.screenshot({path:OUT+'/n-b1.png'});
  await p.evaluate(()=>window.__dbg.walkStep(1)); r=await until(r=>!r.noticing||r.state!=='walk',8); console.log('B after step:',r);
  await p.waitForTimeout(100); await p.screenshot({path:OUT+'/n-b2.png'});
  // C：はじめから凹みの上。灯りは素通りする
  await setup(10.1,3.42,Math.PI/2); r=await until(r=>r.pov>5||r.noticing||r.state!=='walk',14); console.log('C spot:',r);
  // A：廊下の真ん中。立ち止まられ、そのまま見咎められる
  await setup(12,4,Math.PI/2); r=await until(r=>r.noticing||r.state!=='walk',14); console.log('A noticed:',r);
  r=await until(r=>r.state!=='walk',6); console.log('A end:',r); await p.waitForTimeout(300); await p.screenshot({path:OUT+'/n-a.png'});
  r=await until(r=>r.state==='result',8); console.log('D:',r.state);
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
