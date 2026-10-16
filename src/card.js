import { PATTERNS } from "./story.js";
import { $, S } from "./state.js";

// ---------- 結果カード（縦書き） ----------
export const KAN=["〇","一","二","三","四","五","六","七","八","九"];
export function kan(n){ if(n<10) return KAN[n]; let s=""; const h=Math.floor(n/100), t=Math.floor(n%100/10), o=n%10;
  if(h) s+=(h>1?KAN[h]:"")+"百"; if(t) s+=(t>1?KAN[t]:"")+"十"; if(o) s+=KAN[o]; return s; }
export const ROT="ー…―（）「」『』〜", SMALL="ぁぃぅぇぉっゃゅょァィゥェォッャュョ";
export function vtext(g,str,x,y,size,gap){ gap=gap??1.08; let cy=y;
  for(const ch of str){
    if(ch===" "){ cy+=size*0.5; continue; }
    g.save();
    if("、。".includes(ch)){ g.fillText(ch,x+size*0.6,cy-size*0.62); }
    else if(ROT.includes(ch)){ g.translate(x+size*0.5,cy-size*0.5); g.rotate(Math.PI/2); g.textAlign="center"; g.textBaseline="middle"; g.fillText(ch,0,0); }
    else if(SMALL.includes(ch)){ g.fillText(ch,x+size*0.12,cy-size*0.1); }
    else g.fillText(ch,x,cy);
    g.restore(); cy+=size*gap; }
  return cy; }
export async function drawCard(n,heavy,caught){
  const W=1080,H=1350, c=document.createElement("canvas"); c.width=W; c.height=H; const g=c.getContext("2d");
  try{ await Promise.all(["800 120px","700 52px","500 40px"].map(f=>document.fonts.load(`${f} "Shippori Mincho B1"`,"人間椅子"))); }catch(e){}
  const F=w=>`${w} "Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif`;
  // 革の地
  g.fillStyle="#0d0907"; g.fillRect(0,0,W,H);
  const id=g.getImageData(0,0,W,H), d=id.data;
  for(let i=0;i<d.length;i+=4){ const v=(Math.random()-0.5)*14; d[i]+=v; d[i+1]+=v*0.8; d[i+2]+=v*0.6; }
  g.putImageData(id,0,0);
  // 座った跡（最も重き者の形）
  const pat=PATTERNS[(heavy&&heavy.pat)||"wide"], sw=760, sh=900, ox=(W-sw)/2, oy=420;
  g.globalCompositeOperation="lighter";
  for(const [bx,by,br,bw] of pat){ const x=ox+bx*sw, y=oy+(1-by)*sh, r=br*sw*1.25;
    const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(190,70,32,${0.55*bw})`); gr.addColorStop(0.5,`rgba(120,36,16,${0.32*bw})`); gr.addColorStop(1,"rgba(0,0,0,0)");
    g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
  g.globalCompositeOperation="source-over";
  // 縁の暗がり
  const vg=g.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.75); vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,0.7)"); g.fillStyle=vg; g.fillRect(0,0,W,H);
  // 罫
  g.strokeStyle="rgba(217,145,59,.45)"; g.lineWidth=2; g.strokeRect(36,36,W-72,H-72);
  g.strokeStyle="rgba(217,145,59,.18)"; g.lineWidth=1; g.strokeRect(48,48,W-96,H-96);
  // 題
  g.fillStyle="#E8DCC6"; g.font=F(800)+""; g.font=`800 120px "Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif`;
  vtext(g,"人間椅子",W-250,200,120,1.12);
  g.fillStyle="rgba(232,220,198,.55)"; g.font=`500 30px "Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif`;
  vtext(g,"江戸川乱歩より",W-112,214,30);
  // 本文の列（右から左）
  let x=W-380; const col=(s,size,color,w)=>{ g.fillStyle=color; g.font=`${w||500} ${size}px "Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif`; vtext(g,s,x,200,size); x-=size*1.75; };
  col(S.cardLead||"本日、椅子の胴の中で",44,"#E8DCC6");
  col(`${kan(n)}人の重みを知りました。`,44,"#E8DCC6");
  x-=24;
  if(heavy){ col("最も重き者",34,"rgba(232,220,198,.6)"); col(`${heavy.name}　${kan(heavy.kg)}瓩`,52,"#D9913B",700); }
  x-=24;
  if(caught){ col("露見。",52,"#C24A40",700); const ep=S.epitaph||""; const parts=ep.length>18?[ep.slice(0,ep.indexOf("、")+1)||ep.slice(0,16),ep.slice((ep.indexOf("、")+1)||16)]:[ep];
    for(const p of parts) if(p) col(p,38,"#E8DCC6"); }
  else { col("気づかれはしませんでした。",44,"#E8DCC6"); if(S.cardEnd){ x-=24; col(S.cardEnd,48,"#D9913B",700); } }
  // 署名
  g.fillStyle="rgba(232,220,198,.5)"; g.font=`500 28px "Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif`; g.textBaseline="alphabetic";
  g.fillText("#人間椅子",84,H-90);
  const blob=await new Promise(r=>c.toBlob(r,"image/png")); S.cardBlob=blob;
  $("cardimg").src=URL.createObjectURL(blob); }

