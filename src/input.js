import { A, audioInit } from "./audio.js";
import { beginNight, jumpLetter, restartGame, retryNight, startGame } from "./flow.js";
import { cv } from "./interior.js";
import { $, S, bb, reset } from "./state.js";
import { W, stick, walkStep, wc } from "./walk.js";

// ---------- Input ----------
export const keys={left:false,right:false};
// 椅子歩きでは、矢印キーは画面の向きのまま進む。Shiftで急ぎ足
const KD={ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0],ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1]}, held=new Set();
const keyStick=e=>{ if(W.on&&!stick.touch){ let x=0,y=0; for(const k of held){ x+=KD[k][0]; y+=KD[k][1]; } const m=Math.hypot(x,y)||1, f=e.shiftKey?1:0.6; stick.x=x/m*f; stick.y=y/m*f; stick.on=held.size>0; } };
addEventListener("keydown",e=>{ if(e.code==="Space"){ if(!e.repeat) S.hold=S.gaspCd<=0; e.preventDefault(); }
  if(KD[e.code]){ if(W.on){ held.add(e.code); keyStick(e); e.preventDefault(); return; } if(e.repeat) return;
    if(e.code==="ArrowLeft"||e.code==="KeyA"){ keys.left=true; walkStep(-1); } if(e.code==="ArrowRight"||e.code==="KeyD"){ keys.right=true; walkStep(1); } } });
addEventListener("keyup",e=>{ if(e.code==="Space") S.hold=false; if(KD[e.code]){ held.delete(e.code); keyStick(e); } if(e.code==="ArrowLeft"||e.code==="KeyA") keys.left=false; if(e.code==="ArrowRight"||e.code==="KeyD") keys.right=false; });
// 画面に指を置いて滑らせると、その向きへ進む。輪の外まで引けば急ぎ足
{ const el=$("stick"), knob=el.firstElementChild, R=56; let id=null, ox=0, oy=0;
  wc.addEventListener("pointerdown",e=>{ if(id!==null) return; e.preventDefault(); id=e.pointerId; ox=e.clientX; oy=e.clientY; wc.setPointerCapture(id);
    Object.assign(stick,{x:0,y:0,on:true,touch:true}); el.style.left=ox+"px"; el.style.top=oy+"px"; knob.style.transform=""; el.hidden=false; });
  wc.addEventListener("pointermove",e=>{ if(e.pointerId!==id) return; let dx=e.clientX-ox, dy=e.clientY-oy; const d=Math.hypot(dx,dy);
    if(d>R){ dx*=R/d; dy*=R/d; } stick.x=dx/R; stick.y=dy/R; knob.style.transform=`translate(${dx}px,${dy}px)`; el.classList.toggle("rush",d>R*0.92); });
  const up=e=>{ if(e.pointerId!==id) return; id=null; Object.assign(stick,{x:0,y:0,on:false,touch:false}); el.hidden=true; el.classList.remove("rush"); };
  wc.addEventListener("pointerup",up); wc.addEventListener("pointercancel",up); }
export function holdBtn(el,on,off){ const d=e=>{e.preventDefault(); el.classList.add("on"); on();}; const u=e=>{el.classList.remove("on"); off();};
  el.addEventListener("pointerdown",d); for(const ev of ["pointerup","pointercancel","pointerleave"]) el.addEventListener(ev,u); el.addEventListener("contextmenu",e=>e.preventDefault()); }
holdBtn($("bb"),()=>{S.hold=S.gaspCd<=0;},()=>{S.hold=false;});
holdBtn($("bl"),()=>{keys.left=true; walkStep(-1);},()=>{keys.left=false;});
holdBtn($("br"),()=>{keys.right=true; walkStep(1);},()=>{keys.right=false;});
cv.addEventListener("pointerdown",e=>{ e.preventDefault(); S.hold=S.gaspCd<=0; $("bb").classList.add("on"); });
for(const ev of ["pointerup","pointercancel"]) cv.addEventListener(ev,()=>{ S.hold=false; $("bb").classList.remove("on"); });
$("start").addEventListener("click",startGame);
$("jump3").addEventListener("click",()=>{ audioInit(); A.ctx.resume&&A.ctx.resume(); reset(); beginNight(2); });
$("jumpL").addEventListener("click",()=>{ audioInit(); A.ctx.resume&&A.ctx.resume(); reset(); jumpLetter(); });
$("again").addEventListener("click",restartGame);
$("retry").addEventListener("click",retryNight);
$("save").addEventListener("click",async()=>{ const b=S.cardBlob; if(!b){ $("toast").textContent="画像を描いております。少々お待ちを。"; return; }
  const file=new File([b],"ningen-isu.png",{type:"image/png"});
  try{ if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],text:S.share}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="ningen-isu.png"; document.body.appendChild(a); a.click(); a.remove(); }catch(e){}
  $("toast").textContent="保存されない時は、画像を長押ししてください。"; });
$("copy").addEventListener("click",()=>{ const t=S.share||""; const done=()=>{$("toast").textContent="写し取りました。";};
  const fb=()=>{ $("toast").textContent=t; }; if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done).catch(fb); else fb(); });
