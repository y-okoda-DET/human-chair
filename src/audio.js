
// ---------- Audio ----------
export const A={ctx:null};
export function audioInit(){ if(A.ctx) return; const c=new (window.AudioContext||window.webkitAudioContext)(); A.ctx=c;
  A.master=c.createGain(); A.master.gain.value=0.8; A.master.connect(c.destination);
  const len=c.sampleRate*2, buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0); let last=0;
  for(let i=0;i<len;i++){ const w=Math.random()*2-1; last=(last+0.02*w)/1.02; d[i]=last*3.5; } A.brown=buf;
  const wb=c.createBuffer(1,len,c.sampleRate), wd=wb.getChannelData(0); for(let i=0;i<len;i++) wd[i]=Math.random()*2-1; A.white=wb;
  const amb=c.createBufferSource(); amb.buffer=A.brown; amb.loop=true; const af=c.createBiquadFilter(); af.type="lowpass"; af.frequency.value=180;
  const ag=c.createGain(); ag.gain.value=0.05; amb.connect(af).connect(ag).connect(A.master); amb.start(); loadSamples(); }
// ---------- 録った物音（freesound, CC0）。読み込み前や失敗した時は、合成の音で代わりを務める ----------
A.smp={};
const SMP=["knock1","knock2","knock3","bump","leather1","leather2","scrape","maidstep1","maidstep2","clock"];
function loadSamples(){ for(const n of SMP) fetch(`./snd/${n}.mp3`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,ng)=>A.ctx.decodeAudioData(b,ok,ng))).then(buf=>{ A.smp[n]=buf; }).catch(()=>{}); }
export function play(name,gain=1,rate=1,pan=0,loop=false){ const c=A.ctx, b=A.smp[name]; if(!c||!b) return null;
  const s=c.createBufferSource(); s.buffer=b; s.playbackRate.value=rate; s.loop=loop; const g=c.createGain(); g.gain.value=gain; s.connect(g);
  if(pan&&c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=Math.max(-1,Math.min(1,pan)); g.connect(p).connect(A.master); } else g.connect(A.master);
  s.start(); return {s,g}; }
const pick=a=>a[Math.floor(Math.random()*a.length)], vary=()=>0.88+Math.random()*0.24;
export function noiseBurst(buf,dur,gain,ftype,freq,q){ const c=A.ctx; if(!c) return; const s=c.createBufferSource(); s.buffer=buf; const f=c.createBiquadFilter(); f.type=ftype; f.frequency.value=freq; f.Q.value=q||1;
  const g=c.createGain(); g.gain.setValueAtTime(gain,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur); s.connect(f).connect(g).connect(A.master); s.start(); s.stop(c.currentTime+dur+0.05); }
export function thump(gain){ const c=A.ctx; if(!c) return; const o=c.createOscillator(); o.type="sine"; o.frequency.setValueAtTime(58,c.currentTime); o.frequency.exponentialRampToValueAtTime(38,c.currentTime+0.12);
  const g=c.createGain(); g.gain.setValueAtTime(gain,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.16); o.connect(g).connect(A.master); o.start(); o.stop(c.currentTime+0.2); }
export function creak(){ const c=A.ctx; if(!c) return; const o=c.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(210,c.currentTime); o.frequency.exponentialRampToValueAtTime(120,c.currentTime+0.3);
  const f=c.createBiquadFilter(); f.type="bandpass"; f.frequency.value=600; f.Q.value=6; const g=c.createGain(); g.gain.setValueAtTime(0.12,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.35);
  o.connect(f).connect(g).connect(A.master); o.start(); o.stop(c.currentTime+0.4); }
export const step=(dist)=>noiseBurst(A.brown,0.09,0.5/(1+dist*2),"lowpass",300,1);
export const sitThud=()=>{ thump(0.9); noiseBurst(A.brown,0.4,0.35,"lowpass",220,1); };
export const gasp=()=>noiseBurst(A.white,0.5,0.25,"highpass",900,0.7);
export const exhale=()=>noiseBurst(A.white,0.35,0.07,"bandpass",1400,0.8);
export const rustle=()=>noiseBurst(A.white,0.18,0.06,"bandpass",2500,2);
export const cloth=()=>{ noiseBurst(A.white,0.7,0.09,"bandpass",1800,1.2); setTimeout(()=>noiseBurst(A.white,0.4,0.05,"bandpass",2600,1.5),220); };
export const spring=()=>{ const c=A.ctx; if(!c) return; const o=c.createOscillator(); o.type="triangle"; o.frequency.setValueAtTime(95,c.currentTime); o.frequency.exponentialRampToValueAtTime(70,c.currentTime+0.5);
  const g=c.createGain(); g.gain.setValueAtTime(0.08,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.6); o.connect(g).connect(A.master); o.start(); o.stop(c.currentTime+0.65); };
// 革越しのくぐもった声：音節ごとの低い唸り
export function murmur(n){ const c=A.ctx; if(!c) return; let t=c.currentTime+0.05;
  for(let i=0;i<n;i++){ const o=c.createOscillator(); o.type="sawtooth"; const f0=120+Math.random()*70; o.frequency.setValueAtTime(f0,t); o.frequency.linearRampToValueAtTime(f0*(0.85+Math.random()*0.3),t+0.14);
    const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=420; lp.Q.value=0.8; const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.05,t+0.03); g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);
    o.connect(lp).connect(g).connect(A.master); o.start(t); o.stop(t+0.18); t+=0.17+Math.random()*0.08; } }
export const saw=()=>{ for(let i=0;i<5;i++) setTimeout(()=>noiseBurst(A.white,0.16,0.12,"bandpass",2200,3),i*230); };
export const hammer=(n)=>{ for(let i=0;i<n;i++) setTimeout(()=>{ thump(0.5); noiseBurst(A.white,0.05,0.2,"highpass",3000,1); },i*420); };


// ---------- 誇張した物音：人形劇の椅子らしく、木と革と詰め物を大げさに鳴らす ----------
// 木の脚が床を叩く、乾いた短い音（高めの胴鳴りと、打撃のかちり）
export function woodKnock(g=0.5){ if(play(pick(["knock1","knock2","knock3"]),g*1.6,vary())) return; const c=A.ctx; if(!c) return; const t=c.currentTime, f=150+Math.random()*60;
  const o=c.createOscillator(); o.type="triangle"; o.frequency.setValueAtTime(f*2.2,t); o.frequency.exponentialRampToValueAtTime(f,t+0.05);
  const v=c.createGain(); v.gain.setValueAtTime(g,t); v.gain.exponentialRampToValueAtTime(0.001,t+0.12); o.connect(v).connect(A.master); o.start(t); o.stop(t+0.14);
  noiseBurst(A.white,0.025,g*0.6,"bandpass",3200,2); }
// 革がたわむ、湿った軋み（ゆっくり揺れる帯域の雑音）
export function leatherSquish(g=0.25,dur=0.5){ if(play(dur>0.6?"leather2":"leather1",Math.min(1,g*3),vary())) return; const c=A.ctx; if(!c) return; const t=c.currentTime, s=c.createBufferSource(); s.buffer=A.brown;
  const f=c.createBiquadFilter(); f.type="bandpass"; f.Q.value=4; f.frequency.setValueAtTime(260,t); f.frequency.linearRampToValueAtTime(520,t+dur*0.4); f.frequency.linearRampToValueAtTime(190,t+dur);
  const v=c.createGain(); v.gain.setValueAtTime(0.0001,t); v.gain.exponentialRampToValueAtTime(g,t+dur*0.25); v.gain.exponentialRampToValueAtTime(0.001,t+dur);
  s.connect(f).connect(v).connect(A.master); s.start(t); s.stop(t+dur+0.05); }
// 脚が床を掻く、ざらついた音
export function scrape(g=0.18){ if(play("scrape",g*4,vary())) return; const c=A.ctx; if(!c) return; const t=c.currentTime, s=c.createBufferSource(); s.buffer=A.white;
  const f=c.createBiquadFilter(); f.type="bandpass"; f.Q.value=6; f.frequency.setValueAtTime(900,t); f.frequency.exponentialRampToValueAtTime(1800,t+0.18);
  const v=c.createGain(); v.gain.setValueAtTime(0.0001,t); v.gain.linearRampToValueAtTime(g,t+0.03);
  for(let i=1;i<6;i++) v.gain.linearRampToValueAtTime(g*(i%2?0.3:1),t+0.03+i*0.03); v.gain.exponentialRampToValueAtTime(0.001,t+0.22);
  s.connect(f).connect(v).connect(A.master); s.start(t); s.stop(t+0.25); }
