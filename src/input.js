import { A, audioInit } from "./audio.js";
import { beginNight, restartGame, retryNight, startGame } from "./flow.js";
import { cv } from "./interior.js";
import { $, S, bb, reset } from "./state.js";
import { walkStep } from "./walk.js";

// ---------- Input ----------
export const keys={left:false,right:false};
addEventListener("keydown",e=>{ if(e.repeat) return; if(e.code==="Space"){ S.hold=S.gaspCd<=0; e.preventDefault(); } if(e.code==="ArrowLeft"||e.code==="KeyA"){ keys.left=true; walkStep(-1); } if(e.code==="ArrowRight"||e.code==="KeyD"){ keys.right=true; walkStep(1); } });
addEventListener("keyup",e=>{ if(e.code==="Space") S.hold=false; if(e.code==="ArrowLeft"||e.code==="KeyA") keys.left=false; if(e.code==="ArrowRight"||e.code==="KeyD") keys.right=false; });
export function holdBtn(el,on,off){ const d=e=>{e.preventDefault(); el.classList.add("on"); on();}; const u=e=>{el.classList.remove("on"); off();};
  el.addEventListener("pointerdown",d); for(const ev of ["pointerup","pointercancel","pointerleave"]) el.addEventListener(ev,u); el.addEventListener("contextmenu",e=>e.preventDefault()); }
holdBtn($("bb"),()=>{S.hold=S.gaspCd<=0;},()=>{S.hold=false;});
holdBtn($("bl"),()=>{keys.left=true; walkStep(-1);},()=>{keys.left=false;});
holdBtn($("br"),()=>{keys.right=true; walkStep(1);},()=>{keys.right=false;});
cv.addEventListener("pointerdown",e=>{ e.preventDefault(); S.hold=S.gaspCd<=0; $("bb").classList.add("on"); });
for(const ev of ["pointerup","pointercancel"]) cv.addEventListener(ev,()=>{ S.hold=false; $("bb").classList.remove("on"); });
$("start").addEventListener("click",startGame);
$("jump3").addEventListener("click",()=>{ audioInit(); A.ctx.resume&&A.ctx.resume(); reset(); beginNight(2); });
$("again").addEventListener("click",restartGame);
$("retry").addEventListener("click",retryNight);
$("save").addEventListener("click",async()=>{ const b=S.cardBlob; if(!b){ $("toast").textContent="画像を描いております。少々お待ちを。"; return; }
  const file=new File([b],"ningen-isu.png",{type:"image/png"});
  try{ if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],text:S.share}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="ningen-isu.png"; document.body.appendChild(a); a.click(); a.remove(); }catch(e){}
  $("toast").textContent="保存されない時は、画像を長押ししてください。"; });
$("copy").addEventListener("click",()=>{ const t=S.share||""; const done=()=>{$("toast").textContent="写し取りました。";};
  const fb=()=>{ $("toast").textContent=t; }; if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done).catch(fb); else fb(); });
