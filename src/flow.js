import { A, audioInit, cloth, creak, hammer, saw, sitThud, spring } from "./audio.js";
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
    if(fx==="saw") saw(); if(fx==="hammer") hammer(4); if(fx==="cloth"){ cloth(); spring(); } if(fx==="thud"){ sitThud(); S.dark=1; } if(fx==="creak") creak();
    introTimer=setTimeout(show,d*1000); };
  $("intro").onclick=()=>{ clearTimeout(introTimer); show(); };
  $("skip").onclick=e=>{ e.stopPropagation(); fin(); };
  show(); }
export function beginIntro(){ audioInit(); A.ctx.resume && A.ctx.resume(); reset(); playLines(INTRO,()=>beginNight(0,true)); }
export function beginNight(i,skipBefore,resume){ hideWalk(); if(!resume) clearCheck(); const N=NIGHTS[i]; S.night=i; S.sus=0; S.heat=0;
  S.snap={seen:S.seen.slice(),frags:S.frags.slice(),log:Object.assign({},S.log)};
  const go=()=>playLines([[`${N.title}　${N.place}`,2.8]],()=>{ const sitDown=()=>{ S.state="wait"; S.wait=2.5; S.steps=0; S.queue=N.queue.map(k=>SITTERS[k]); say("（闇の中で、待つ）",true); };
    if(N.walk) startWalk(()=>{ clearCheck(); sitThud(); sitDown(); },resume); else sitDown(); },0.05);
  if(resume&&N.walk){ S.dark=1; $("result").hidden=true; startWalk(()=>{ clearCheck(); sitThud(); S.state="wait"; S.wait=2.5; S.steps=0; S.queue=N.queue.map(k=>SITTERS[k]); say("（闇の中で、待つ）",true); },resume); return; }
  if(N.before&&!skipBefore) playLines(N.before,go); else go(); }
export function endNight(){ if(S.night+1<NIGHTS.length) beginNight(S.night+1); else playLines(ENDING,()=>finish(false),0.4); }
export function startGame(){ beginIntro(); }
export function restartGame(){ audioInit(); reset(); beginNight(0,true); }
export function retryNight(){ audioInit(); const n=S.night, snap=S.snap, from=S.walkCaught?CHECK:null; reset(); S.seen=snap.seen; S.frags=snap.frags; S.log=snap.log; beginNight(n,true,from||undefined); }
export function beginSit(st){ S.sitter=st; S.ts=0; S.w=0; S.lineIdx=0; S.listen=null; S.fidgetT=0;
  S.targets=PATTERNS[st.pat].map(b=>b.slice()); S.blobs=S.targets.map(b=>[b[0],b[1],b[2],0]); sitThud(); if(!st.dog){ cloth(); spring(); } say(st.dog?"（何かが、ひらりと飛び乗った）":"（何者かが、どっかと腰を下ろした）"); }

export function endSit(){ S.frags.push(S.sitter.frag); S.seen.push(S.sitter); S.sus*=0.7; if(S.sitter.final){ S.sitter=null; S.w=0; S.state="between"; sitThud(); endNight(); return; } S.state="leave"; S.ts=0; say(S.sitter.dog?"（獣は降りて行った）":"（重みが、ふっと去った）",true); }

export function finish(caught){ hideWalk(); S.done=true; S.caught=caught; S.state="result";
  const n=new Set(S.seen.map(x=>x.name)).size; const heavy=S.seen.slice().sort((a,b)=>b.kg-a.kg)[0];
  const N=NIGHTS[S.night];
  $("rk").textContent=caught?`露見　${N.title}・${N.place}`:"三夜の記録";
  S.epitaph=caught?EPITAPH[Math.floor(Math.random()*EPITAPH.length)]:"";
  $("rh").textContent=caught?S.epitaph:"題は『人間椅子』と、付けたいと存じます。";
  let html="";
  const reasons=Object.entries(S.log).map(([k,v])=>`${k}が${kan(v)}度`).join("、");
  if(caught){ html+=`<p>${S.sitter?S.sitter.name:"何者か"}が立ち上がり、蓋を開けたのでございます。${reasons?`${reasons}。それで十分でした。`:""}</p>`; if(S.frags.length) html+=`<p>書きかけの手紙には、こう記してありました。</p>`; }
  else { html+=`<p>奥様。私は三夜の間、この椅子の胴の中で、${n}人の重みを知ったのでございます。</p>`; if(reasons) html+=`<p class="k">（${reasons}。それでも、気づかれはしませんでした。）</p>`; }
  for(const [i,f] of S.frags.entries()) html+=`<p><b>${S.seen[i].name}</b>（${S.seen[i].kg}kg）。${f}</p>`;
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

