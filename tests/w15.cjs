// 結び：佳子夫人が、三夜で集めた断片を読み上げる
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  await p.route('**/fonts.googleapis.com/**', r=>r.abort());
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/'),{waitUntil:'load'}); await p.waitForTimeout(500);
  await p.evaluate(()=>{ for(const [k,st] of Object.entries(window.__dbg.SITTERS)){ if(k==='lady2') continue; st.dur=2; st.listen=[]; st.lines=st.lines.slice(0,1).map(l=>[0.2,l[1]]); } });
  await p.click('#start');
  const subs=[]; let fin=null, paper='', picks=[], shotP=0, shotK=0;
  for(let i=0;i<700;i++){
    const st=await p.evaluate(()=>{const S=window.__isu(); S.sus=0; return {state:S.state,who:S.sitter&&S.sitter.name,sub:document.getElementById('sub').textContent,introHidden:document.getElementById('intro').hidden};});
    if(st.who==='佳子夫人'&&st.sub&&subs[subs.length-1]!==st.sub) subs.push(st.sub);
    const pp=await p.evaluate(()=>document.getElementById('paperin').innerText); if(pp.length>paper.length){ paper=pp; if(process.env.OUT&&paper.length>60&&!shotP){ shotP=1; await p.waitForTimeout(1500); await p.screenshot({path:process.env.OUT+'/paper.png'}); } }
    if(await p.evaluate(()=>!document.getElementById('pick').hidden)&&process.env.OUT&&!shotK++) await p.screenshot({path:process.env.OUT+'/pick.png'});
    if(await p.evaluate(()=>!document.getElementById('pick').hidden)) picks.push(await p.evaluate(()=>[...document.querySelectorAll('#picks button')].map(b=>b.innerText).join(' / ')));
    if(st.state==='result'){ fin=await p.textContent('#rh'); break; }
    if(!st.introHidden) await p.click('#intro'); if(await p.evaluate(()=>!document.getElementById('pick').hidden)) await p.click('#picks button:last-child');
    if(st.state==='walk') await p.evaluate(i=>{ const D=window.__dbg; D.W.grace=1e9; if(!D.W.arrived){ D.tp(19.6,17.6,0); window.__isu().t+=1; D.walkStep(i%2?1:-1); } },i);
    await p.waitForTimeout(250);
  }
  console.log('lady lines:\n  '+subs.join('\n  ')); console.log('result',fin); console.log('picks:\n  '+picks.join('\n  ')); console.log('paper:\n'+paper); console.log('letter',await p.evaluate(()=>document.getElementById('letter').innerText));
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
