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
  const subs=[]; let fin=null;
  for(let i=0;i<700;i++){
    const st=await p.evaluate(()=>{const S=window.__isu(); S.sus=0; return {state:S.state,who:S.sitter&&S.sitter.name,sub:document.getElementById('sub').textContent,introHidden:document.getElementById('intro').hidden};});
    if(st.who==='佳子夫人'&&st.sub&&subs[subs.length-1]!==st.sub) subs.push(st.sub);
    if(st.state==='result'){ fin=await p.textContent('#rh'); break; }
    if(!st.introHidden) await p.click('#intro');
    if(st.state==='walk') await p.evaluate(i=>{ const D=window.__dbg; D.W.grace=1e9; if(!D.W.arrived){ D.tp(19.6,17.6,0); window.__isu().t+=1; D.walkStep(i%2?1:-1); } },i);
    await p.waitForTimeout(250);
  }
  console.log('lady lines:\n  '+subs.join('\n  ')); console.log('result',fin);
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
