
// ---------- State ----------
export const $=id=>document.getElementById(id);
export const sub=$("sub"), susBar=$("sus").firstElementChild, lungBar=$("lung").firstElementChild;
export let S;
export function reset(){ S={night:0,snap:null,state:"title",t:0,q:0,queue:[],sitter:null,ts:0,blobs:[],targets:[],w:0,heat:0,lung:0,hold:false,gaspCd:0,drift:0,tilt:0,sus:0,creakCd:0,listen:null,lineIdx:0,spots:[],frags:[],seen:[],beat:0,pulse:0,dark:1,wait:0,steps:0,caught:false,done:false,fidgetT:0,log:{},whyT:0,listens:0}; }
reset();
// 歩く夜は、乱歩の本の頁のように縦に組み、一字ずつ書きつけてゆく。女中の声は「」で括り、それ以外は私の独白として地の文に
let typeT=null;
export function say(t,dim){ sub.classList.toggle("dim",!!dim); if(typeT){ clearInterval(typeT); typeT=null; }
  if(!document.body.classList.contains("walking")||!t){ sub.textContent=t; sub.className=sub.className.replace(/ ?(voice|mono)/g,""); return; }
  const mono=!/^(……|あら|この屋敷|「)/.test(t), body=mono?t.replace(/^（|）$/g,""):"「"+t.replace(/^「|」$/g,"")+"」";
  sub.classList.toggle("mono",mono); sub.classList.toggle("voice",!mono);
  const html=body.replace(/《(.+?)》/g,"<em>$1</em>"), plain=body.replace(/[《》]/g,""); let n=0; sub.textContent="";
  typeT=setInterval(()=>{ n+=2; if(n>=plain.length){ sub.innerHTML=html; clearInterval(typeT); typeT=null; } else sub.textContent=plain.slice(0,n); },1000/12); }
export function spot(x,y){ S.spots.push({x,y,l:1}); if(S.spots.length>6) S.spots.shift(); }
export const susEl=$("sus"), balI=$("bal").firstElementChild, bb=$("bb");
export function addSus(v,reason){ v=Math.round(v*[0.6,0.8,1][S.night]); S.sus=Math.min(100,S.sus+v); if(reason){ S.log[reason]=(S.log[reason]||0)+1; susEl.classList.add("flash"); setTimeout(()=>susEl.classList.remove("flash"),600); } }

