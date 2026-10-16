import { A, creak, exhale, gasp, murmur, noiseBurst, rustle, step, thump } from "./audio.js";
import { beginNight, beginSit, endNight, endSit, finish } from "./flow.js";
import { keys } from "./input.js";
import { U, gl, idx } from "./interior.js";
import { S, addSus, balI, bb, lungBar, say, spot, susBar } from "./state.js";
import { NIGHTS, PATTERNS, SITTERS } from "./story.js";
import { PATROLS, R3, SPOTS, W, inPlace, walkCaught, walkRender, walkStep, walkUpdate } from "./walk.js";

// ---------- Update ----------
export let last=performance.now();
export function update(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; S.t+=dt;
  const sitting=S.state==="sit";
  if(S.state==="wait"){ S.wait-=dt; S.steps-=dt;
    if(S.steps<=0){ S.steps=0.55+Math.random()*0.2; step(Math.max(0,S.wait)); if(S.wait<2.2&&S.wait>0.4) say("（足音が、こちらへ近づいて来る）",true); }
    if(S.wait<=0){ if(S.queue.length){ S.state="sit"; beginSit(S.queue.shift()); } else { S.state="between"; endNight(); } } }
  if(sitting){ const st=S.sitter; S.ts+=dt; S.w=Math.min(1,S.w+dt*2.2); S.heat=Math.min(1,S.heat+dt*0.02);
    while(S.lineIdx<st.lines.length&&st.lines[S.lineIdx][0]<=S.ts){ const l=st.lines[S.lineIdx++][1]; say(l,l.startsWith("（")); if(!l.startsWith("（")&&l!=="……。") murmur(Math.min(9,Math.max(3,Math.round(l.length/3)))); if(l.includes("雑誌")||l.includes("頁")||l.includes("本")) { spot(0.5+Math.random()*0.2-0.1,0.78); rustle(); } if(st.snore&&l.includes("いびき")) thump(0.3); }
    if(!S.listen){ for(const lt of st.listen){ if(S.ts>=lt&&S.ts<lt+0.05){ S.listen={t:3.6,held:0,len:3.6}; S.listens++; bb.classList.add("cue");
          say(st.dog?"（獣が、蓋の隙に鼻を寄せている）":(S.listens===1?"（……上の者が、ふと静まった。耳を澄ませている）":"（……ふと、静まった）")); break; } } }
    else { S.listen.t-=dt; if(S.hold) S.listen.held+=dt;
      if(S.listen.t<=0){ const f=S.listen.held/S.listen.len; S.listen=null; bb.classList.remove("cue");
        if(f<0.7){ addSus(40,"息"); say(st.dog?"（獣が、けたたましく吠えた）":"……今、何か息をしなかったか。"); if(st.dog) noiseBurst(A.white,0.15,0.3,"bandpass",700,3); } else say(st.dog?"（獣は興味を失ったらしい）":"（どうやら、やり過ごした）",true); } }
    S.fidgetT-=dt; if(S.fidgetT<=0&&!S.listen){ S.fidgetT=1/st.fidget*(0.6+Math.random()*0.8);
      const base=PATTERNS[st.pat]; S.targets=base.map(b=>[b[0]+(Math.random()-0.5)*st.jit*2,b[1]+(Math.random()-0.5)*st.jit*2,b[2],b[3]]);
      if(st.dog){ const cx=0.3+Math.random()*0.4, cy=0.35+Math.random()*0.35; S.targets=base.map(b=>[cx+(b[0]-0.5),cy+(b[1]-0.5),b[2],b[3]]); }
      if(Math.random()<0.3) rustle(); }
    if(S.ts>=st.dur) endSit(); }
  if(S.state==="leave"){ S.ts+=dt; S.w=Math.max(0,S.w-dt*1.5); if(S.ts>2.2){ S.sitter=null; S.state="wait"; S.wait=3+Math.random()*3; S.steps=0.3; say("",true); } }
  if(S.state==="walk") walkUpdate(dt);
  if(S.state==="caught"&&W.on&&R3) walkRender(dt);
  if(S.state==="caught"){ S.ts+=dt; S.w=Math.max(0,S.w-dt*3); S.dark=Math.max(0,S.dark-dt*0.6); if(S.ts>2.6) finish(true); }
  // breath
  if(S.gaspCd>0){ S.gaspCd-=dt; S.hold=false; }
  if(S.hold&&S.state!=="walk"){ S.lung=Math.min(1,S.lung+dt/7); if(S.lung>=1){ S.lung=0; S.gaspCd=1.6; gasp(); if(S.state!=="result"){ addSus(sitting?28:8,"息漏れ"); say("（堪え切れず、大きく息が漏れた）"); } } }
  else { if(S.lung>0.15&&S.lungWas>=0.15&&!S.hold&&S.exhaled!==true){ } S.lung=Math.max(0,S.lung-dt/3); }
  if(!S.hold&&S.lungWas>0.5&&S.lung<=0.5) exhale();
  S.lungWas=S.lung;
  // balance
  const inp=S.state==="walk"?0:(keys.right?1:0)-(keys.left?1:0); if(S.state==="walk") S.drift=0;
  S.drift+=(Math.random()-0.5)*dt*(sitting?1.6:0.5); S.drift-=inp*dt*1.1; S.drift=Math.max(-1,Math.min(1,S.drift));
  S.creakCd-=dt;
  S.streakT=(S.streakT||0)-dt; if(S.streakT<=0) S.streak=0;
  if(Math.abs(S.drift)>0.55&&S.creakCd<=0&&S.state!=="result"&&S.state!=="caught"&&S.state!=="intro"){ S.creakCd=1.4; creak(); S.streak=(S.streak||0)+1; S.streakT=5;
    const base=S.listen?30:(sitting?12:6); addSus(Math.round(base*(1+(S.streak-1)*0.7)),"きしみ"); spot(S.drift>0?0.9:0.1,0.4+Math.random()*0.2); S.drift*=0.5;
    if(!S.listen){ if(sitting&&S.streak>=3) say(S.sitter.dog?"（獣が蓋に鼻面を押しつけた）":"……この椅子は、ずいぶんと鳴くな。"); else if(!sitting&&S.streak>=3) say("（隣室で、足音がぴたりと止んだ）"); else say("（椅子が、鳴いた）",true); } }
  S.tilt+=(S.drift*0.07-S.tilt)*Math.min(1,dt*4);
  balI.style.left=((S.drift*0.5+0.5)*100)+"%"; balI.classList.toggle("warn",Math.abs(S.drift)>0.42);
  // suspicion
  S.sus=Math.max(0,S.sus-dt*(sitting?0.4:S.state==="walk"?0.8:1.2));
  if(S.sus>=99&&S.state==="walk"){ const P=PATROLS.slice().sort((a,b)=>Math.hypot(a.x-W.x,a.z-W.z)-Math.hypot(b.x-W.x,b.z-W.z))[0]; if(P&&P.g){ P.lyaw=Math.atan2(W.px-P.x,W.pz-P.z); } walkCaught(P&&P.g?P:null,"……椅子が、歩いている。"); }
  if(S.sus>=99&&(S.state==="sit"||S.state==="wait"||S.state==="leave")){ const wasSit=S.state==="sit"; S.state="caught"; S.ts=0; S.listen=null; bb.classList.remove("cue");
    if(!wasSit){ S.sitter={name:"女中",kg:0,dog:false}; } say(S.sitter&&S.sitter.dog?"（獣は吠え止まぬ。誰かが来る）":(wasSit?"……誰か、居るのか。":"（女中が入って来て、椅子の前で足を止めた）")); }
  window.__isu=()=>S; window.__fin=finish; window.__dbg={SITTERS,NIGHTS,W,walkStep,walkCaught,beginNight,PATROLS,SPOTS,inPlace,tp:(x,z,yaw)=>Object.assign(W,{x,z,px:x,pz:z,vx:x,vz:z,yaw,pyaw:yaw,vyaw:yaw})};
  // heartbeat
  const bpm=58+S.lung*85+S.sus*0.5; S.beat-=dt; if(S.beat<=0){ S.beat=60/bpm; if(S.state!=="intro"&&S.state!=="title") thump(0.15+S.lung*0.5+S.sus*0.003); S.pulse=1; }
  S.pulse=Math.max(0,S.pulse-dt*4);
  // 12fps quantized blob/spot motion
  S.q+=dt; if(S.q>=1/12){ S.q-=1/12;
    for(let i=0;i<S.blobs.length;i++){ const b=S.blobs[i], t=S.targets[i]; b[0]+= (t[0]-b[0])*0.5; b[1]+=(t[1]-b[1])*0.5; b[2]=t[2]; b[3]=t[3]*S.w; }
    for(const s of S.spots) s.l-=0.14; S.spots=S.spots.filter(s=>s.l>0); }
  // HUD
  susBar.style.width=S.sus+"%"; lungBar.style.height=(S.lung*100)+"%";
  // draw
  gl.uniform1f(U.uTime,S.t); gl.uniform1f(U.uTilt,S.tilt); gl.uniform1f(U.uHeat,S.heat); gl.uniform1f(U.uPulse,S.pulse); gl.uniform1f(U.uDark,S.dark);
  const bl=new Float32Array(32); S.blobs.forEach((b,i)=>bl.set(b,i*4)); gl.uniform4fv(U.uBlobs,bl); gl.uniform1i(U.uCount,S.blobs.length);
  const sp=new Float32Array(18); S.spots.forEach((s,i)=>sp.set([s.x,s.y,s.l],i*3)); gl.uniform3fv(U.uSpots,sp); gl.uniform1i(U.uSpotCount,S.spots.length);
  if(!W.on) gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_INT,0);
  requestAnimationFrame(update);
}
requestAnimationFrame(update);

