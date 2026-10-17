// 試作用「手紙を選ぶところから」：三度選び、結びの夫人に読まれ、結びの一枚が出る
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:420,height:820}});
  const logs=[]; p.on('pageerror',e=>logs.push('ERR '+e.message));
  await p.goto((process.env.BASE||'http://localhost:4173/'),{waitUntil:'load'}); await p.waitForTimeout(500);
  await p.click('#jumpL'); const picks=[];
  for(let i=0;i<3;i++){ await p.waitForSelector('#pick:not([hidden])',{timeout:10000}); picks.push(await p.evaluate(()=>document.querySelectorAll('#picks button').length)); await p.click('#picks button:first-child'); await p.waitForTimeout(300); }
  console.log('pick options per night',picks.join(','));
  await p.evaluate(()=>{ const S=window.__isu(); S.sitter&&(S.sitter.listen=[]); });
  let paper=''; for(let i=0;i<300;i++){ const st=await p.evaluate(()=>{ const S=window.__isu(); S.sus=0; S.hold=true; return {s:S.state,pp:document.getElementById('paperin').innerText,ih:document.getElementById('intro').hidden}; }); if(st.pp.length>paper.length) paper=st.pp; if(st.s==='result') break; if(!st.ih) await p.click('#intro'); await p.waitForTimeout(250); }
  console.log('paper:\n'+paper);
  await p.waitForTimeout(7000); if(process.env.OUT) await p.screenshot({path:process.env.OUT+'/fin.png'});
  console.log('fin shown',await p.evaluate(()=>!document.getElementById('fin').hidden));
  await p.click('#finbtn'); console.log('result shown',await p.evaluate(()=>!document.getElementById('result').hidden), await p.textContent('#letter'));
  console.log(logs.join('\n')||'no errors'); await b.close();
})();
