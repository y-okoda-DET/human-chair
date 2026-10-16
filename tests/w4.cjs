// 道筋の確認：見回りを止めて、表の道と裏の道を歩き切れるか
const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/')+(process.env.QS?'?'+process.env.QS:''),{waitUntil:'load'});
  await p.click('#jump3'); await p.waitForTimeout(300); await p.click('#skip'); await p.waitForTimeout(200); await p.click('#skip');
  await p.waitForFunction(()=>window.__isu().state==='walk',null,{timeout:8000});
  const route=process.argv[2]||'front';
  const res=await p.evaluate((route)=>{ const D=window.__dbg, W=D.W, S=window.__isu(); W.grace=1e9; S.sus=0;
    // 目的地の列に向けて、向き直りと前進を繰り返す（時刻を進めて連打判定を避ける）
    const legs=[]; const goals=route==='front'?[[7.5,4],[16.5,4],[19.6,2.4],[20.9,1.6],[20.9,8.6],[19.8,9.2],[19.6,18.4]]:[[2.5,4.1],[2.5,15.5],[17.5,15.5],[19.6,15.5],[19.6,18.4]];
    let side=-1, n=0, bumps=0, log=[];
    for(const [gx,gz] of goals){ for(let k=0;k<200;k++){ const dx=gx-W.x, dz=gz-W.z; if(Math.hypot(dx,dz)<0.3||W.arrived) break;
        const want=Math.atan2(dx,dz); let da=((want-W.yaw)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI;
        S.t+=1; if(Math.abs(da)>0.27){ const s=da>0?-1:1; W.last=s; D.walkStep(s); }
        else { const bx=W.x,bz=W.z; side=-side; W.last=-side; D.walkStep(side); if(W.x===bx&&W.z===bz){ bumps++; log.push([gx,gz,+W.x.toFixed(2),+W.z.toFixed(2)]); break; } } n++; } }
    return {x:W.x,z:W.z,arrived:W.arrived,n,bumps,log:log.slice(0,5)}; },route);
  console.log(route,JSON.stringify(res));
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
