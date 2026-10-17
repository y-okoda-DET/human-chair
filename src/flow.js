import { A, audioInit, cloth, creak, hammer, pen, saw, scrape, sitThud, spring } from "./audio.js";
import { drawCard, kan } from "./card.js";
import { $, S, reset, say } from "./state.js";
import { ENDING, EPITAPH, INTRO, NIGHTS, PATTERNS, SITTERS } from "./story.js";
import { CHECK, clearCheck, hideWalk, startWalk } from "./walk.js";

export let introTimer=null;
export let playTok=0;
export function playLines(lines,done,dark){ clearTimeout(introTimer); const tok=++playTok; S.state="intro"; S.dark=dark??0.12; $("title").hidden=true; $("result").hidden=true; $("intro").hidden=false; document.body.classList.add("intro"); say("");
  let i=0; const p=$("introp"); let ended=false;
  const fin=()=>{ if(ended||tok!==playTok) return; ended=true; clearTimeout(introTimer); $("intro").hidden=true; document.body.classList.remove("intro"); S.dark=1; done(); };
  const show=()=>{ if(tok!==playTok) return; if(i>=lines.length){ fin(); return; } const [t,d,fx]=lines[i++]; p.classList.remove("on"); setTimeout(()=>{ p.textContent=t; p.classList.add("on"); },60);
    if(fx==="saw") saw(); if(fx==="hammer") hammer(4); if(fx==="cloth"){ cloth(); spring(); } if(fx==="thud"){ sitThud(); S.dark=1; } if(fx==="creak") creak(); if(fx==="pen") pen(); if(fx==="sit"){ sitThud(); setTimeout(()=>{ cloth(); spring(); },300); } if(fx==="scrape"){ scrape(0.3); setTimeout(()=>scrape(0.25),420); }
    introTimer=setTimeout(show,d*1000); };
  $("intro").onclick=()=>{ clearTimeout(introTimer); show(); };
  $("skip").onclick=e=>{ e.stopPropagation(); fin(); };
  show(); }
export function beginIntro(){ audioInit(); A.ctx.resume && A.ctx.resume(); reset(); playLines(INTRO,()=>beginNight(0,true)); }
export function beginNight(i,skipBefore,resume){ hideWalk(); if(!resume) clearCheck(); const N=NIGHTS[i]; S.night=i; S.sus=0; S.heat=0;
  S.picked=false; S.snap={seen:S.seen.slice(),frags:S.frags.slice(),log:Object.assign({},S.log),letter:S.letter.slice()};
  const go=()=>playLines([[`${N.title}　${N.place}`,2.8]],()=>{ const sitDown=()=>{ S.state="wait"; S.wait=2.5; S.steps=0; S.queue=N.queue.map(k=>SITTERS[k]); say("（闇の中で、待つ）",true); };
    if(N.walk) startWalk(()=>arrived(N,sitDown),resume); else sitDown(); },0.05);
  if(resume&&N.walk){ S.dark=1; $("result").hidden=true; startWalk(()=>arrived(N,()=>{ S.state="wait"; S.wait=2.5; S.steps=0; S.queue=N.queue.map(k=>SITTERS[k]); say("（闇の中で、待つ）",true); }),resume); return; }
  if(N.before&&!skipBefore) playLines(N.before,go); else go(); }
// 書斎に辿り着いたら：奥様の椅子と入れ替わる顛末を、黒地に綴る
function arrived(N,sitDown){ clearCheck(); const go=()=>{ sitThud(); sitDown(); }; if(N.arrive) playLines(N.arrive,go,0.05); else go(); }
export function endNight(){ if(S.night+1<NIGHTS.length) pickLine(nightSeen(),()=>beginNight(S.night+1)); else playLines(ENDING,()=>finish(false),0.4); }
export function startGame(){ beginIntro(); }
export function restartGame(){ audioInit(); reset(); beginNight(0,true); }
export function retryNight(){ audioInit(); const n=S.night, snap=S.snap, from=S.walkCaught?CHECK:null; reset(); S.seen=snap.seen; S.frags=snap.frags; S.log=snap.log; S.letter=snap.letter||[]; beginNight(n,true,from||undefined); }
// 手紙に認めた一節（足りなければ、その夜の客から補う）
function letterOf(){ const got=S.seen.map((x,i)=>({name:x.name,frag:S.frags[i]})).filter(x=>x.name!=="佳子夫人"), L=S.letter.slice();
  for(const g of got){ if(L.length>=3) break; if(!L.some(l=>l.frag===g.frag)) L.push(g); } return L.slice(0,3); }
// 結びの客：奥様は、私が認めた手紙を、私の上でお読みになる。その間だけ、画面は奥様の目になる（§は便箋の行、§§で便箋を閉じる）
function readerLines(st){ const L=[[2,"（手紙の封を切る音）"],[5,"……また、見知らぬ方からの原稿だわ。"],[9,"§奥様。"],[12,"§私は、醜い椅子職人でございます。"]];
  let t=16; for(const l of letterOf()){ L.push([t,`§<b>${l.name}</b>。${l.frag}`]); t+=5.5; }
  L.push([t,"§奥様。今、あなたのお掛けになっている、その椅子の中に、"],[t+5,"§§"],[t+6,"（息を呑む音）"],[t+11,"……まさか。"],[t+15,"（夫人は、跳ねるように立ち上がった）"]);
  return Object.assign({},st,{lines:L,dur:t+17,listen:[6.5,t+7]}); }
// 夜の終わりに、手紙へ書く一節を一つ選ぶ
export function pickLine(list,done){ if(!list.length){ done(); return; } S.state="pick"; say(""); document.body.classList.add("intro"); const box=$("picks"); box.innerHTML="";
  for(const x of list){ const b=document.createElement("button"); b.innerHTML=`<b>${x.name}</b>${x.frag}`; b.onclick=()=>{ S.letter.push(x); $("pick").hidden=true; document.body.classList.remove("intro"); done(); }; box.appendChild(b); }
  $("pick").hidden=false; }
const nightSeen=()=>S.seen.map((x,i)=>({name:x.name,frag:S.frags[i]})).slice(S.snap?S.snap.seen.length:0);
export function nextSitter(){ if(S.queue[0]&&S.queue[0].final&&!S.picked){ S.picked=true; pickLine(nightSeen(),nextSitter); return; } S.state="sit"; beginSit(S.queue.shift()); }
export function beginSit(st){ if(st.final) st=readerLines(st); S.sitter=st; S.ts=0; S.w=0; S.lineIdx=0; S.listen=null; S.fidgetT=0;
  S.targets=PATTERNS[st.pat].map(b=>b.slice()); S.blobs=S.targets.map(b=>[b[0],b[1],b[2],0]); sitThud(); if(!st.dog){ cloth(); spring(); } say(st.dog?"（何かが、ひらりと飛び乗った）":"（何者かが、どっかと腰を下ろした）"); }

export function endSit(){ S.frags.push(S.sitter.frag); S.seen.push(S.sitter); S.sus*=0.7; if(S.sitter.final){ S.sitter=null; S.w=0; S.state="between"; sitThud(); endNight(); return; } S.state="leave"; S.ts=0; say(S.sitter.dog?"（獣は降りて行った）":"（重みが、ふっと去った）",true); }

export function finish(caught){ hideWalk(); $("pick").hidden=true; $("paper").hidden=true; $("paper").classList.remove("on","shake"); S.done=true; S.caught=caught; S.state="result";
  const n=new Set(S.seen.map(x=>x.name)).size; const heavy=S.seen.slice().sort((a,b)=>b.kg-a.kg)[0];
  const N=NIGHTS[S.night];
  $("rk").textContent=caught?`露見　${N.title}・${N.place}`:"三夜の記録";
  S.epitaph=caught?EPITAPH[Math.floor(Math.random()*EPITAPH.length)]:"";
  $("rh").textContent=caught?S.epitaph:"題は『人間椅子』と、付けたいと存じます。";
  let html="";
  const reasons=Object.entries(S.log).map(([k,v])=>`${k}が${kan(v)}度`).join("、");
  if(caught){ html+=`<p>${S.sitter?S.sitter.name:"何者か"}が立ち上がり、蓋を開けたのでございます。${reasons?`${reasons}。それで十分でした。`:""}</p>`; if(S.frags.length) html+=`<p>書きかけの手紙には、こう記してありました。</p>`; }
  else { html+=`<p>奥様。私は三夜の間、この椅子の胴の中で、${n}人の重みを知ったのでございます。</p>`; if(reasons) html+=`<p class="k">（${reasons}。それでも、気づかれはしませんでした。）</p>`; }
  if(caught) for(const [i,f] of S.frags.entries()) html+=`<p><b>${S.seen[i].name}</b>（${S.seen[i].kg}kg）。${f}</p>`;
  else for(const l of letterOf()) html+=`<p><b>${l.name}</b>。${l.frag}</p>`;
  if(!caught) html+=`<p>追伸。この椅子は些か固い、と皆様が仰います。</p>`;
  $("letter").innerHTML=html;
  const hv=heavy?`最も重き者：${heavy.name}（${heavy.kg}kg）。`:"";
  S.share=caught?`${N.title}、${N.place}にて露見。椅子の胴の中で${n}人の重みを知りました。${hv} #人間椅子`:`三夜を越え、椅子の胴の中で${n}人の重みを知りました。${hv}題は『人間椅子』と致したく。 #人間椅子`;
  S.cardLead=caught?`${N.title}、${N.place}にて`:"三夜、椅子の胴の中で";
  S.cardEnd=caught?null:"題は『人間椅子』と。";
  S.walkCaught=caught&&!!NIGHTS[S.night].walk&&S.sitter&&S.sitter.name==="屋敷の女中";
  $("retry").hidden=!caught||(S.night===0&&!S.walkCaught); $("retry").textContent=S.walkCaught&&CHECK?"続きから":"この夜から"; $("again").textContent=caught&&S.night>0?"初めから":"もう一度";
  $("toast").textContent=""; $("result").hidden=false;
  $("cardimg").removeAttribute("src"); S.cardBlob=null;
  drawCard(n,heavy,caught).catch(e=>console.error(e)); }

