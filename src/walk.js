import * as THREE from "three";
import { makePost } from "./post.js";
import { A, creak, leatherSquish, noiseBurst, play, scrape, thump, woodKnock } from "./audio.js";
import { $, S, bb, say } from "./state.js";

// ---------- 椅子歩き（第三夜の頭、一度きり。屋敷の一角を3Dで歩く） ----------
// 1マス=約1m。R応接間 F表の廊下 H階段の広間 s大階段 U二階の廊下 D書斎の前 S使用人の通路 B裏階段
export const MAP=[
"#######################",
"#RRRRRR#########HHHHHH#",
"#RRRRRR#########HHHHss#",
"#RRRRRRFFFFFFFFFHHHHss#",
"#RRRRRRFFFFFFFFFHHHHss#",
"#RRRRRR#########HHHHss#",
"#RRRRRR#########HHHHss#",
"##S#############HHHHss#",
"##S###############UUUU#",
"##S###############UUUU#",
"##S###############UUUU#",
"##S###############UUUU#",
"##S###############UUUU#",
"##S###############UUUU#",
"##S###############UUUU#",
"##SSSSSSSBBBBBBBBUUUUU#",
"##################UUUU#",
"##################UUUU#",
"###################DD##",
"#######################"];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const cellAt=(x,z)=>{ const r=MAP[Math.floor(z)]; return r?(r[Math.floor(x)]||"#"):"#"; };
export const floorOf=(c,x,z)=>c==="U"||c==="D"?3:c==="s"?clamp((z-2)/6*3,0,3):c==="B"?clamp((x-9)/8*3,0,3):0;
export const ceilOf=(c,x,z)=>"HsUD".includes(c)?6.4:c==="B"?floorOf(c,x,z)+3.2:3.2;
export const floorAt=(x,z)=>floorOf(cellAt(x,z),x,z);
// 置き場所：絨毯に椅子の脚の凹みが残っている所。ここで止まっていれば、照らされても「ただの椅子」
export const SPOTS=[
  {x:3.2,z:4.1,l:null},{x:2.5,z:1.7,l:null},{x:6.2,z:2.4,l:null},{x:3.4,z:5.4,l:null},
  {x:10.1,z:3.42,l:"飾り棚の陰に"},{x:13.2,z:4.58,l:"長椅子の並びに"},{x:14.2,z:3.42,l:"飾り棚の陰に"},
  {x:16.45,z:6.5,l:"大時計の脇に"},{x:17.6,z:1.42,l:"椅子の列に"},
  {x:18.42,z:11.6,l:"飾り棚の陰に"},{x:21.58,z:12.1,l:"椅子の隣に"},{x:21.58,z:16.6,l:"花台の脇に"}];
export const OBST=[]; // 家具の当たり [x0,z0,x1,z1]
export const PATROLS=[
  {route:[[19,4.4],[12,4],[7.6,4],[4.2,3.6]],spd:0.95,pause:[1.8,3.2],i:0},
  {route:[[2.5,7.6],[2.5,15.5],[9,15.5],[16.6,15.5],[19.6,15.5]],spd:1.25,pause:[0.8,1.6],i:3},
  {route:[[19.6,8.8],[20,13],[19.6,17.2]],spd:0.75,pause:[2.5,4],i:2}];
export const W={on:false,built:false};
export const wc=$("w"), seamEl=$("seam"), wfade=$("wfade");
export let R3=null;
export function tex(w,h,draw,rep){ const c=document.createElement("canvas"); c.width=w; c.height=h; draw(c.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; if(rep) t.repeat.set(rep[0],rep[1]); return t; }
export function noise(g,w,h,a){ const d=g.getImageData(0,0,w,h); for(let i=0;i<d.data.length;i+=4){ const n=(Math.random()-0.5)*a; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } g.putImageData(d,0,0); }
export function build3D(){
  const T=THREE, scene=new T.Scene(); scene.background=new T.Color(0x050302); scene.fog=new T.FogExp2(0x060403,0.04);
  const ren=new T.WebGLRenderer({canvas:wc,antialias:false,stencil:false,depth:false,powerPreference:"high-performance"}); ren.shadowMap.enabled=true; ren.shadowMap.type=T.PCFSoftShadowMap;
  const cam=new T.PerspectiveCamera(62,1,0.05,60);
  // 質感：壁紙と腰板、寄木の床、天井、赤い絨毯、革
  const wallT=tex(256,256,(g,w,h)=>{ g.fillStyle="#26382b"; g.fillRect(0,0,w,h);
    for(let x=0;x<w;x+=32){ g.fillStyle="rgba(150,170,120,.07)"; g.fillRect(x,0,14,h); }
    g.strokeStyle="rgba(190,170,110,.13)"; g.lineWidth=2; for(let y=-32;y<h;y+=48) for(let x=0;x<w;x+=32){ g.beginPath(); g.moveTo(x+16,y); g.quadraticCurveTo(x+30,y+24,x+16,y+48); g.quadraticCurveTo(x+2,y+24,x+16,y); g.stroke(); }
    const wy=h*(1-0.9/3.2); g.fillStyle="#3a2416"; g.fillRect(0,wy,w,h-wy);
    for(let x=0;x<w;x+=64){ g.strokeStyle="rgba(0,0,0,.45)"; g.strokeRect(x+8,wy+12,48,h-wy-22); }
    g.fillStyle="#5a3a22"; g.fillRect(0,wy-5,w,7); noise(g,w,h,18); });
  const floorT=tex(256,256,(g,w,h)=>{ for(let y=0;y<h;y+=32) for(let x=0;x<w;x+=64){ const o=(y/32)%2?32:0, v=40+Math.random()*22;
      g.fillStyle=`rgb(${v+28|0},${v*0.62|0},${v*0.36|0})`; g.fillRect((x+o)%w,y,64,32); g.fillRect((x+o)%w-w,y,64,32); g.strokeStyle="rgba(0,0,0,.5)"; g.strokeRect((x+o)%w,y,64,32); }
    noise(g,w,h,14); });
  const carpetT=tex(128,128,(g,w,h)=>{ g.fillStyle="#5c1414"; g.fillRect(0,0,w,h); g.fillStyle="#7a5a20"; g.fillRect(0,0,8,h); g.fillRect(w-8,0,8,h); noise(g,w,h,22); });
  const ceilT=tex(64,64,(g,w,h)=>{ g.fillStyle="#17110d"; g.fillRect(0,0,w,h); noise(g,w,h,10); });
  const leatherT=tex(128,128,(g,w,h)=>{ g.fillStyle="#4a2116"; g.fillRect(0,0,w,h); for(let i=0;i<500;i++){ g.strokeStyle=`rgba(0,0,0,${Math.random()*0.08})`; g.lineWidth=1; g.beginPath(); const x=Math.random()*w,y=Math.random()*h; g.moveTo(x,y); g.lineTo(x+Math.random()*10-5,y+Math.random()*10-5); g.stroke(); } noise(g,w,h,8); });
  // 写真素材（Poly Haven, CC0）：色・凹凸・粗さと陰。読み込みが済むまでは、手描きの質感で代わりを務める
  const TL=new T.TextureLoader();
  const pbr=(name,rep=1,opt={})=>{ const ld=(k,srgb)=>{ const t=TL.load(`./tex/${name}_${k}.jpg`); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep,rep); t.anisotropy=4; if(srgb) t.colorSpace=T.SRGBColorSpace; return t; };
    const orm=ld("orm"); return new T.MeshStandardMaterial({map:ld("diff",true),normalMap:ld("nor"),roughnessMap:orm,aoMap:orm,metalnessMap:opt.metalness?orm:null,aoMapIntensity:0.8,roughness:1,metalness:0,...opt}); };
  const M={
    wall:new T.MeshStandardMaterial({map:wallT,side:T.FrontSide,roughness:0.9}),
    floor:pbr("parquet",1,{color:0x6e5444,envMapIntensity:0.15,normalScale:new T.Vector2(0.8,0.8)}),
    carpet:pbr("carpet",2,{color:0xd07070,envMapIntensity:0.2}),
    ceil:new T.MeshPhongMaterial({map:ceilT,side:T.FrontSide}),
    wood:pbr("wood",1,{color:0x5a4034,envMapIntensity:0.25,side:T.DoubleSide}),
    leather:pbr("leather",1,{color:0xc89a80,normalScale:new T.Vector2(1.4,1.4)}),
    leather2:pbr("leather",1,{color:0x8a7064}),
    brass:pbr("brass",1,{metalness:1,color:0xe0a85a}),
    dress:new T.MeshPhongMaterial({color:0x14141c,shininess:10}),
    apron:new T.MeshPhongMaterial({color:0xd8d2c4,shininess:5}),
    face:new T.MeshPhongMaterial({color:0xf2ece2,shininess:20,emissive:0x221c18}),
    hair:new T.MeshPhongMaterial({color:0x050404,shininess:60}),
    glowY:new T.MeshBasicMaterial({color:0xffc070}),
    dark:new T.MeshPhongMaterial({color:0x0c0907}),
  };
  // 壁：上は緑に染めた花柄の紋織、下は腰板。u=1mで一巡り、v=天井高3.2m
  { const imgs=["floral_diff","floral_nor","panel_diff","panel_nor"].map(n=>{ const im=new Image(); im.src=`./tex/${n}.jpg`; return im; });
    Promise.all(imgs.map(im=>im.decode())).then(()=>{ const mk=(top,bot,tint)=>{ const c=document.createElement("canvas"); c.width=c.height=1024; const g=c.getContext("2d"), wy=Math.round(1024*(1-0.9/3.2));
        for(let x=0;x<3;x++) for(let y=0;y*320<wy;y++) g.drawImage(top,x*1024/3,y*320,1024/3,320);
        if(tint){ g.globalCompositeOperation="multiply"; g.fillStyle=tint; g.fillRect(0,0,1024,wy); g.globalCompositeOperation="source-over"; }
        for(let x=0;x<3;x++) g.drawImage(bot,0,0,1024,768,x*1024/3,wy,1024/3,1024-wy);
        g.fillStyle=tint?"#2a1608":"#8080ff"; g.fillRect(0,wy-6,1024,8); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=4; return t; };
      const d=mk(imgs[0],imgs[2],"#46704c"); d.colorSpace=T.SRGBColorSpace; M.wall.map=d; M.wall.normalMap=mk(imgs[1],imgs[3],null); M.wall.needsUpdate=true; }).catch(()=>{}); }
  for(const k of ["wall","ceil"]) M[k].map.colorSpace=T.SRGBColorSpace;
  // 写真の部屋から拾った映り込み。革の艶と真鍮だけに使う（床や木に掛けると灰色に浮く）
  TL.load("./tex/studio.jpg",h=>{ h.colorSpace=T.SRGBColorSpace; h.mapping=T.EquirectangularReflectionMapping; const pm=new T.PMREMGenerator(ren); const env=pm.fromEquirectangular(h).texture; for(const [k,i] of [["brass",0.8],["leather",0.12],["leather2",0.08]]){ M[k].envMap=env; M[k].envMapIntensity=i; M[k].needsUpdate=true; } h.dispose(); pm.dispose(); });
  // 床・壁・天井を、マス目から組む
  const G=()=>({p:[],n:[],u:[]});
  // 面の表は法線の側に揃える（上から覗く時、手前の壁と天井は裏向きになって消える）
  const quad=(Gx,a,b,c,d,n,ua,ub,uc,ud)=>{ const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]], cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
    const flip=cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0, vs=flip?[[a,ua],[d,ud],[c,uc],[a,ua],[c,uc],[b,ub]]:[[a,ua],[b,ub],[c,uc],[a,ua],[c,uc],[d,ud]];
    for(const [v,uv] of vs){ Gx.p.push(...v); Gx.n.push(...n); Gx.u.push(...uv); } };
  const mk=(Gx,mat,rs=true)=>{ const g=new T.BufferGeometry(); g.setAttribute("position",new T.Float32BufferAttribute(Gx.p,3)); g.setAttribute("normal",new T.Float32BufferAttribute(Gx.n,3)); g.setAttribute("uv",new T.Float32BufferAttribute(Gx.u,2));
    const m=new T.Mesh(g,mat); m.receiveShadow=rs; scene.add(m); return m; };
  const gW=G(), gF=G(), gC=G(), gCar=G(), gR=G();
  const wall=(Gx,x1,z1,x2,z2,b1,b2,t1,t2,n,fl1,fl2)=>{ const u1=x1+z1,u2=x2+z2; quad(Gx,[x1,b1,z1],[x2,b2,z2],[x2,t2,z2],[x1,t1,z1],n,[u1,(b1-fl1)/3.2],[u2,(b2-fl2)/3.2],[u2,(t2-fl2)/3.2],[u1,(t1-fl1)/3.2]); };
  const rail=(x1,z1,x2,z2,f1,f2,n)=>{ wall(gR,x1,z1,x2,z2,f1+0.86,f2+0.86,f1+0.94,f2+0.94,n,0,0); const L=Math.hypot(x2-x1,z2-z1), k=Math.max(2,Math.round(L/0.22));
    for(let i=0;i<=k;i++){ const t=i/k, x=x1+(x2-x1)*t, z=z1+(z2-z1)*t, f=f1+(f2-f1)*t, dx=(z2-z1)/L*0.03, dz=(x2-x1)/L*0.03; wall(gR,x-dz,z-dx,x+dz,z+dx,f,f,f+0.88,f+0.88,n,0,0); } };
  for(let z=0;z<MAP.length;z++) for(let x=0;x<MAP[z].length;x++){ const c=MAP[z][x]; if(c==="#") continue;
    // 床（大階段と裏階段は段に刻む）
    if(c==="s"||c==="B"){ const Gx=c==="s"?gCar:gF; for(let k=0;k<4;k++){ if(c==="s"){ const z0=z+k/4,z1=z+(k+1)/4, y=floorOf(c,x,z1), y0=floorOf(c,x,z0);
          quad(Gx,[x,y,z0],[x+1,y,z0],[x+1,y,z1],[x,y,z1],[0,1,0],[0,0],[1,0],[1,0.25],[0,0.25]); quad(Gx,[x,y0,z0],[x+1,y0,z0],[x+1,y,z0],[x,y,z0],[0,0,-1],[0,0],[1,0],[1,0.1],[0,0.1]); }
        else { const x0=x+k/4,x1=x+(k+1)/4, y=floorOf(c,x1,z), y0=floorOf(c,x0,z);
          quad(Gx,[x0,y,z],[x1,y,z],[x1,y,z+1],[x0,y,z+1],[0,1,0],[x0/2,z/2],[x1/2,z/2],[x1/2,(z+1)/2],[x0/2,(z+1)/2]); quad(Gx,[x0,y0,z],[x0,y0,z+1],[x0,y,z+1],[x0,y,z],[-1,0,0],[0,0],[1,0],[1,0.1],[0,0.1]); } } }
    else { const y=floorOf(c,x,z); quad(gF,[x,y,z],[x+1,y,z],[x+1,y,z+1],[x,y,z+1],[0,1,0],[x/2,z/2],[(x+1)/2,z/2],[(x+1)/2,(z+1)/2],[x/2,(z+1)/2]); }
    { const a=ceilOf(c,x,z),b=ceilOf(c,x+1,z),cc=ceilOf(c,x+1,z+1),d=ceilOf(c,x,z+1); quad(gC,[x,a,z],[x+1,b,z],[x+1,cc,z+1],[x,d,z+1],[0,-1,0],[x,z],[x+1,z],[x+1,z+1],[x,z+1]); }
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nb=cellAt(x+dx+0.5,z+dz+0.5);
      let x1,z1,x2,z2; if(dx===1){x1=x+1;z1=z;x2=x+1;z2=z+1;} else if(dx===-1){x1=x;z1=z;x2=x;z2=z+1;} else if(dz===1){x1=x;z1=z+1;x2=x+1;z2=z+1;} else {x1=x;z1=z;x2=x+1;z2=z;}
      const n=[-dx,0,-dz], f1=floorOf(c,x1,z1), f2=floorOf(c,x2,z2), c1=ceilOf(c,x1,z1), c2=ceilOf(c,x2,z2);
      if(nb==="#"){ wall(gW,x1,z1,x2,z2,f1,f2,c1,c2,n,f1,f2); continue; }
      const nf1=floorOf(nb,x1,z1), nf2=floorOf(nb,x2,z2), nc1=ceilOf(nb,x1,z1), nc2=ceilOf(nb,x2,z2);
      if(nf1-f1>0.15||nf2-f2>0.15) wall(gW,x1,z1,x2,z2,f1,f2,Math.max(f1,nf1),Math.max(f2,nf2),n,f1,f2);
      if(f1-nf1>0.15||f2-nf2>0.15) rail(x1+dx*0.05,z1+dz*0.05,x2+dx*0.05,z2+dz*0.05,f1,f2,n);
      if(nc1<c1-0.05||nc2<c2-0.05) wall(gW,x1,z1,x2,z2,Math.max(nc1,f1),Math.max(nc2,f2),c1,c2,n,f1,f2); } }
  mk(gW,M.wall); mk(gF,M.floor); mk(gC,M.ceil,false); mk(gCar,M.carpet); mk(gR,M.wood);
  // 家具
  const box=(w,h,d,mat,x,y,z,ry=0,solid=true,cast=true)=>{ const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat); m.position.set(x,y+h/2,z); m.rotation.y=ry; m.castShadow=cast; m.receiveShadow=true; scene.add(m);
    if(solid){ const hw=(Math.abs(Math.cos(ry))*w+Math.abs(Math.sin(ry))*d)/2, hd=(Math.abs(Math.sin(ry))*w+Math.abs(Math.cos(ry))*d)/2; OBST.push([x-hw,z-hd,x+hw,z+hd]); } return m; };
  const cabinet=(x,z,ry)=>{ const y=floorAt(x,z); box(1.1,1.5,0.42,M.wood,x,y,z,ry); box(1.16,0.06,0.48,M.wood,x,y+1.5,z,ry,false);
    const v=new T.Mesh(new T.SphereGeometry(0.13,10,8),M.brass); v.scale.y=1.5; v.position.set(x,y+1.72,z); scene.add(v); };
  const settee=(x,z,ry)=>{ const y=floorAt(x,z); box(1.5,0.42,0.6,M.leather2,x,y,z,ry); const b=box(1.5,0.55,0.14,M.leather2,x,y+0.42,z,ry,false); b.translateZ(-0.24); };
  // 椅子（自分も囮も同じ型。肘掛椅子の胴は人ひとり分）
  function makeChair(mat){ const g=new T.Group(), part=(w,h,d,x,y,z,m=mat)=>{ const p=new T.Mesh(new T.BoxGeometry(w,h,d),m); p.position.set(x,y,z); p.castShadow=true; p.receiveShadow=true; g.add(p); return p; };
    part(0.66,0.2,0.62,0,0.44,0.02); part(0.66,0.16,0.08,0,0.36,0.32); const back=part(0.66,0.78,0.16,0,0.9,-0.24);
    const top=new T.Mesh(new T.CylinderGeometry(0.1,0.1,0.7,14),mat); top.rotation.z=Math.PI/2; top.position.set(0,1.29,-0.25); top.castShadow=true; g.add(top);
    part(0.11,0.24,0.6,-0.36,0.64,0.02); part(0.11,0.24,0.6,0.36,0.64,0.02);
    const legs=[]; for(const [lx,lz] of [[-0.28,0.26],[0.28,0.26],[-0.28,-0.26],[0.28,-0.26]]){ const l=part(0.07,0.34,0.07,lx,0.17,lz,M.wood); legs.push(l); }
    for(let i=0;i<9;i++){ const s=new T.Mesh(new T.SphereGeometry(0.012,5,4),M.brass); s.position.set(-0.3+i*0.075,0.43,0.365); g.add(s); }
    g.userData.legs=legs; g.userData.back=back; return g; }
  // 応接間：夜会の椅子が並ぶ
  for(const [x,z,ry,m] of [[1.6,1.6,Math.PI*0.25,1],[1.5,3.0,Math.PI/2,0],[1.5,5.6,Math.PI*0.75,1],[3.4,6.4,Math.PI,1],[5.3,6.4,Math.PI,0],[5.4,1.6,-Math.PI*0.2,1],[5.0,5.5,-Math.PI*0.8,1]]){
    const c=makeChair(m?M.leather2:M.leather); c.position.set(x,0,z); c.rotation.y=ry; scene.add(c); OBST.push([x-0.36,z-0.36,x+0.36,z+0.36]); }
  { const t=new T.Mesh(new T.CylinderGeometry(0.55,0.55,0.06,20),M.wood); t.position.set(3.6,0.72,2.6); t.castShadow=true; scene.add(t); const p=new T.Mesh(new T.CylinderGeometry(0.06,0.18,0.72,8),M.wood); p.position.set(3.6,0.36,2.6); scene.add(p); OBST.push([3.05,2.05,4.15,3.15]); }
  // 表の廊下
  cabinet(9.0,3.24,0); settee(12.0,4.68,Math.PI); cabinet(15.1,3.24,0);
  // 階段の広間：大時計と椅子の列
  { const y=0; box(0.55,2.2,0.4,M.wood,16.32,y,7.55); const d=new T.Mesh(new T.CircleGeometry(0.17,20),new T.MeshBasicMaterial({color:0xcdbb90})); d.position.set(16.32,1.75,7.34); d.rotation.y=Math.PI; scene.add(d); }
  for(const x of [16.8,18.4]){ const c=makeChair(M.leather2); c.position.set(x,0,1.42); scene.add(c); OBST.push([x-0.36,1.06,x+0.36,1.78]); }
  // 二階の廊下
  cabinet(18.24,10.5,Math.PI/2); { const c=makeChair(M.leather2); c.position.set(21.58,3,13.2); c.rotation.y=-Math.PI/2; scene.add(c); OBST.push([21.22,12.84,21.94,13.56]); }
  { box(0.36,0.9,0.36,M.wood,21.6,3,17.5); const p=new T.Mesh(new T.SphereGeometry(0.3,8,6),new T.MeshPhongMaterial({color:0x1d2a14})); p.position.set(21.6,4.15,17.5); p.scale.y=1.4; scene.add(p); }
  // 肖像画（白い顔だけが浮かぶ）
  const faceT=tex(128,160,(g,w,h)=>{ g.fillStyle="#120c08"; g.fillRect(0,0,w,h); const gr=g.createRadialGradient(64,66,4,64,70,46); gr.addColorStop(0,"#d9cfbf"); gr.addColorStop(1,"rgba(40,30,20,0)"); g.fillStyle=gr; g.beginPath(); g.ellipse(64,70,30,40,0,0,7); g.fill();
    g.fillStyle="#120c08"; g.beginPath(); g.ellipse(52,64,5,3,0,0,7); g.ellipse(76,64,5,3,0,0,7); g.fill(); g.fillRect(56,94,16,2); noise(g,w,h,20); });
  faceT.colorSpace=T.SRGBColorSpace;
  for(const [x,y,z,ry] of [[11.5,1.9,3.02,0],[6.98,1.9,1.6,-Math.PI/2],[21.97,4.9,10.4,-Math.PI/2],[16.03,4.2,4.2,Math.PI/2],[3.0,1.9,15.02,0]]){
    const fr=new T.Mesh(new T.BoxGeometry(0.62,0.78,0.04),M.brass); fr.position.set(x,y,z); fr.rotation.y=ry; scene.add(fr);
    const pic=new T.Mesh(new T.PlaneGeometry(0.52,0.66),new T.MeshPhongMaterial({map:faceT})); pic.position.set(x,y,z); pic.rotation.y=ry; pic.translateZ(0.025); scene.add(pic); }
  // 書斎の扉と、漏れる灯り
  { box(1.2,2.2,0.08,M.wood,20,3,18.98,0,false,false); const leak=new T.Mesh(new T.PlaneGeometry(1.2,0.03),M.glowY); leak.position.set(20,3.01,18.92); leak.rotation.y=Math.PI; scene.add(leak);
    const k=new T.Mesh(new T.PlaneGeometry(0.02,2.1),M.glowY); k.position.set(20,4.06,18.92); k.rotation.y=Math.PI; scene.add(k); }
  // 灯り
  scene.add(new T.HemisphereLight(0x302438,0x0a0604,0.5*Math.PI));
  const glowT=tex(64,64,(g,w,h)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,"rgba(255,220,160,1)"); gr.addColorStop(0.25,"rgba(255,170,80,.45)"); gr.addColorStop(1,"rgba(255,150,60,0)"); g.fillStyle=gr; g.fillRect(0,0,w,h); });
  const glowM=new T.SpriteMaterial({map:glowT,blending:T.AdditiveBlending,depthWrite:false,fog:true,opacity:0.35});
  const glow=(x,y,z,s)=>{ s*=0.45; const sp=new T.Sprite(glowM); sp.position.set(x,y,z); sp.scale.set(s,s,1); scene.add(sp); const b=new T.Mesh(new T.SphereGeometry(0.035,6,5),M.glowY); b.position.set(x,y,z); scene.add(b); return sp; };
  const LIGHTS=[[3.5,2.7,3.6,0xffa860,1.1,8],[11.5,2.5,4,0xff9a50,0.9,7],[18.2,5.2,4.6,0xffb070,1.4,11],[20,5.4,12,0xffa860,1.0,9],[2.5,2.9,12.5,0xd8c8a0,0.6,6],[20,4.4,18.4,0xffc080,1.2,5]];
  for(const [x,y,z,c,i,d] of LIGHTS){ const l=new T.PointLight(c,i*Math.PI,d,1.6); l.position.set(x,y,z); scene.add(l); }
  for(const [x,y,z,s] of [[1.08,2.1,2.4,0.7],[1.08,2.1,4.8,0.7],[10.2,2.1,3.06,0.6],[13.4,2.1,4.94,0.6],[21.92,2.2,4.5,0.7],[18.08,4.9,12.5,0.6],[21.92,4.9,15.5,0.6],[2.5,3.0,12.5,0.5]]) glow(x,y,z,s);
  { const ch=new T.Group(); for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; const b=new T.Mesh(new T.SphereGeometry(0.04,6,5),M.glowY); b.position.set(Math.cos(a)*0.4,0,Math.sin(a)*0.4); ch.add(b); } ch.position.set(18.2,5.2,4.6); scene.add(ch); glow(18.2,5.2,4.6,2.2); glow(3.5,2.7,3.6,1.6); glow(20,4.1,18.9,1.4); }
  // 置き場の凹み：長く椅子が置かれていた跡。脚の四つの窪みと、毛足の潰れた四角
  { const dentT=tex(128,128,(g,w,h)=>{ g.clearRect(0,0,w,h);
      { const gr=g.createRadialGradient(64,64,20,64,64,62); gr.addColorStop(0,"rgba(0,0,0,.45)"); gr.addColorStop(0.7,"rgba(0,0,0,.3)"); gr.addColorStop(1,"rgba(0,0,0,0)"); g.fillStyle=gr; g.fillRect(14,16,100,96); }
      g.strokeStyle="rgba(240,210,165,.16)"; g.lineWidth=2; g.strokeRect(20,22,88,84);
      for(const [x,y] of [[28,30],[100,30],[28,98],[100,98]]){ const gr=g.createRadialGradient(x,y,0,x,y,13); gr.addColorStop(0,"rgba(0,0,0,.95)"); gr.addColorStop(0.5,"rgba(0,0,0,.85)"); gr.addColorStop(0.62,"rgba(245,215,170,.55)"); gr.addColorStop(0.8,"rgba(245,215,170,.25)"); gr.addColorStop(1,"rgba(0,0,0,0)"); g.fillStyle=gr; g.fillRect(x-14,y-14,28,28); } });
    dentT.colorSpace=T.SRGBColorSpace;
    const dm=new T.MeshPhongMaterial({map:dentT,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,shininess:2});
    for(const sp of SPOTS){ const d=new T.Mesh(new T.PlaneGeometry(0.8,0.8),dm); d.rotation.x=-Math.PI/2; d.position.set(sp.x,floorAt(sp.x,sp.z)+0.006,sp.z); d.receiveShadow=true; scene.add(d); } }
  // 自分の椅子
  const me=makeChair(M.leather); scene.add(me);
  // 見回りの女中たち
  for(const P of PATROLS){ const g=new T.Group();
    const skirt=new T.Mesh(new T.CylinderGeometry(0.16,0.33,0.95,12),M.dress); skirt.position.y=0.48; g.add(skirt);
    const ap=new T.Mesh(new T.PlaneGeometry(0.34,0.7),M.apron); ap.position.set(0,0.62,0.255); ap.rotation.x=-0.28; g.add(ap);
    const torso=new T.Mesh(new T.CylinderGeometry(0.13,0.16,0.5,10),M.dress); torso.position.y=1.2; g.add(torso);
    const head=new T.Mesh(new T.SphereGeometry(0.11,14,10),M.face); head.position.y=1.56; g.add(head);
    const hair=new T.Mesh(new T.SphereGeometry(0.118,12,8,0,Math.PI*2,0,Math.PI*0.6),M.hair); hair.position.set(0,1.575,-0.015); g.add(hair);
    const cap=new T.Mesh(new T.BoxGeometry(0.16,0.04,0.08),M.apron); cap.position.set(0,1.67,0.02); g.add(cap);
    const arm=new T.Mesh(new T.CylinderGeometry(0.035,0.035,0.42,6),M.dress); arm.position.set(0.17,1.12,0.16); arm.rotation.x=-1.0; g.add(arm);
    const lamp=new T.Mesh(new T.BoxGeometry(0.1,0.15,0.1),M.glowY); lamp.position.set(0.18,0.98,0.36); g.add(lamp);
    const lg=new T.Sprite(glowM); lg.scale.set(0.5,0.5,1); lg.position.copy(lamp.position); g.add(lg);
    for(const m of [skirt,torso,head]) m.castShadow=true;
    const sl=new T.SpotLight(0xffc27a,3.2*Math.PI,10,0.52,0.45,1.3); sl.castShadow=true; sl.shadow.mapSize.set(512,512); sl.shadow.camera.near=0.3; sl.shadow.bias=-0.002; scene.add(sl); scene.add(sl.target);
    scene.add(g); P.g=g; P.sl=sl; P.lampPos=new T.Vector3(); }
  const post=makePost(ren,scene,cam); window.__post=post;
  const key=new T.PointLight(0xffd2a0,0,3,1.5); scene.add(key); // 寄りの時だけ灯す、人形劇の手持ちの明かり
  R3={T,scene,ren,cam,me,M,post,key}; window.__R3=R3; W.built=true; walkResize(); }

export function walkResize(){ if(R3){ R3.ren.setSize(innerWidth,innerHeight,false); R3.cam.aspect=innerWidth/innerHeight; R3.cam.updateProjectionMatrix(); R3.post.resize(); }
  // 椅子の中：革の継ぎ目に開いた細い隙間
  const d=Math.min(devicePixelRatio||1,2), w=innerWidth, h=innerHeight; seamEl.width=w*d; seamEl.height=h*d; const g=seamEl.getContext("2d"); g.setTransform(d,0,0,d,0,0);
  g.clearRect(0,0,w,h); const lg=g.createRadialGradient(w/2,h*0.44,10,w/2,h*0.44,Math.max(w,h)*0.8); lg.addColorStop(0,"#2a140c"); lg.addColorStop(1,"#050302"); g.fillStyle=lg; g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){ g.strokeStyle=`rgba(${Math.random()<0.5?0:90},${Math.random()<0.5?0:50},0,${Math.random()*0.07})`; g.lineWidth=1; const x=Math.random()*w,y=Math.random()*h; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.random()*16-8,y+Math.random()*16-8); g.stroke(); }
  const cy=h*0.44, sw=Math.min(w*0.9,640), sh=Math.max(34,h*0.1);
  const slit=k=>{ g.beginPath(); g.moveTo(w/2-sw/2*k,cy); g.quadraticCurveTo(w/2,cy-sh*k,w/2+sw/2*k,cy); g.quadraticCurveTo(w/2,cy+sh*0.8*k,w/2-sw/2*k,cy); };
  g.save(); g.globalCompositeOperation="destination-out"; for(const [k,a] of [[1.08,0.25],[1.0,0.35],[0.9,0.5],[0.78,0.8],[0.6,1]]){ g.fillStyle=`rgba(0,0,0,${a})`; slit(k); g.fill(); } g.restore();
  g.strokeStyle="rgba(150,110,70,.3)"; g.lineWidth=2; g.setLineDash([7,9]);
  for(const s of [-1,1]){ g.beginPath(); g.moveTo(w/2-sw/2-12,cy+s*4); g.quadraticCurveTo(w/2,cy+s*(s<0?sh+12:sh*0.8+12),w/2+sw/2+12,cy+s*4); g.stroke(); } g.setLineDash([]); }
addEventListener("resize",()=>{ if(W.on) walkResize(); });
export const BTN={bl:$("bl").innerHTML,bb:$("bb").innerHTML,br:$("br").innerHTML};
// 定点の視点：斜め上から箱庭を覗く。どこでも同じ向きから覗くので、指の向きが入れ替わらない。
// 天井と手前の壁は上から透けて消える。廊下と階段では、向きを保ったまま椅子に合わせて滑る
// 高さは ?view=high|mid|low で見比べられる（既定は mid）
const VIEWS={high:{back:7.0,up:8.4},mid:{back:7.8,up:6.0},low:{back:8.2,up:4.0}};
const VIEW={dx:Math.SQRT1_2,dz:Math.SQRT1_2,...(VIEWS[new URLSearchParams(location.search).get("view")]||VIEWS.mid)};
const oblique=(id,x,y,z)=>({id,p:[x-VIEW.dx*VIEW.back,y+VIEW.up,z-VIEW.dz*VIEW.back],l:[x,y,z]});
export function camFor(x,z){ const c=cellAt(x,z);
  if(c==="R") return oblique("R",4.2,0,4.2);
  if(c==="F") return oblique("F",clamp(x,9,14.5),0,4.0);
  if(c==="H"||c==="s") return oblique("H",19,0.8,4.6);
  if((c==="U"||c==="D")&&!(z>=15&&z<16&&x<18)) return oblique("U",20,3,clamp(z,10.5,17.2));
  if(c==="S"&&z<15) return oblique("S",2.5,0,clamp(z,8.5,14.5));
  const cx=clamp(x,4,16.5); return oblique("B",cx,floorAt(cx,15.5),15.5); }
// 指で示した向きへ、脚を交互に出してよちよち進む。強く押せば急ぎ足になり、椅子が鳴く
export const stick={x:0,y:0,on:false};
export function autoStep(wx,wz,rush){ if(S.state!=="walk"||W.arrived) return;
  W.moveT=S.t; W.idle=0; W.side=W.side>0?-1:1; W.lift=1;
  const want=Math.atan2(wx,wz); let d=((want-W.yaw)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;
  const turn=clamp(d,-Math.PI/6,Math.PI/6); W.yaw+=turn; d-=turn;
  if(Math.abs(d)>Math.PI/4){ legThud(); W.wob=Math.min(1.2,W.wob+0.2); return; }
  const y0=floorAt(W.x,W.z), fx=Math.sin(W.yaw)*0.5, fz=Math.cos(W.yaw)*0.5;
  let moved=false; for(const [mx,mz] of [[fx,fz],[fx,0],[0,fz]]){ if(Math.hypot(mx,mz)<0.2) continue; if(canStand(W.x+mx,W.z+mz,y0)){ W.x+=mx; W.z+=mz; moved=true; break; } }
  if(moved){ legThud(); if(!W.said.first){ W.said.first=1; insert("legs",1.0); leatherSquish(0.3,0.8); } }
  else { thump(0.4); if(!play("bump",0.9,0.95+Math.random()*0.1)) woodKnock(0.8); leatherSquish(0.25,0.4); if(S.t-(W.bumpT||-9)>6){ W.bumpT=S.t; insert("legs",0.5); } if(!W.said.bump){ W.said.bump=1; say("（ごつり、と何かに当たった）",true); } }
  if(rush){ creak(); scrape(0.2); heard(); W.wob=Math.min(1.2,W.wob+0.5); } else W.wob=Math.min(1.2,W.wob+0.32);
  arriveCheck(); }
export function arriveCheck(){ if(cellAt(W.x,W.z)==="D"&&!W.arrived){ W.arrived=true; S.sus*=0.5; say("（書斎の扉の前に、辿り着いた。私は、元の椅子に戻った）"); wfade.style.opacity=1; setTimeout(()=>{ const d=W.done; hideWalk(); d&&d(); },2600); } }
// 人形の手ぶれ：こまごとに、ほんの僅か位置と角度が揺らぐ
const jit=a=>(Math.random()-0.5)*2*a;
export const START={x:3.2,z:4.1,yaw:Math.PI/2};
export const NOTICE=1.3; // 女中が立ち止まってから、見咎めるまでの秒
export function startWalk(done){
  if(!W.built) build3D();
  Object.assign(W,{on:true,done,x:START.x,z:START.z,yaw:START.yaw,px:START.x,pz:START.z,pyaw:START.yaw,vx:START.x,vz:START.z,vyaw:START.yaw,last:0,lastT:-9,moveT:-9,wob:0,lift:0,side:0,q:0,inK:0,
    notice:0,noticeP:null,insT:0,insK:"",insD:1,nStep:0,stepT:0,cam:null,camId:"",mapYaw:0,litPass:0,povT:0,povP:null,povCd:6,grace:2,arrived:false,said:{},idle:0,hint:0,cue:false});
  PATROLS.forEach((P,k)=>{ Object.assign(P,{x:P.route[P.i][0],z:P.route[P.i][1],dir:1,wait:k===0?3:1,yaw:0,lyaw:0,st:0,alert:null,q:0}); P.i=Math.min(P.i+1,P.route.length-1); });
  if(!W.clock){ const k=play("clock",0,1,0,true); if(k) W.clock=k; }
  walkResize(); wc.hidden=false; seamEl.hidden=false; wfade.style.opacity=0; document.body.classList.add("walking"); S.state="walk"; S.sitter=null; S.blobs=[]; S.w=0;
  $("bb").innerHTML='じっとする<small>押している間 / Space</small>';
  say("そろり、そろり。……足音がしたら、ただの椅子に戻るのです。"); }
export function hideWalk(){ if(!W.on&&wc.hidden) return; W.on=false; if(W.clock){ try{ W.clock.s.stop(); }catch(e){} W.clock=null; } wc.hidden=true; seamEl.hidden=true; wfade.style.opacity=0; document.body.classList.remove("walking");
  $("bl").innerHTML=BTN.bl; $("bb").innerHTML=BTN.bb; $("br").innerHTML=BTN.br; bb.classList.remove("cue"); }
export function legThud(){ thump(0.25); woodKnock(0.4); W.nStep=(W.nStep||0)+1; if(W.nStep%3===0) leatherSquish(0.1,0.4); }
// 寄りの差し込み：ここぞという一瞬だけ、椅子の脚や革に寄る
export function insert(kind,dur){ W.insK=kind; W.insT=dur; W.insD=dur; }
export function stepAt(dist,pan){ if(play(Math.random()<0.5?"maidstep1":"maidstep2",1.1/(1+dist*0.45),0.9+Math.random()*0.15,pan)) return; const c=A.ctx; if(!c) return; const s=c.createBufferSource(); s.buffer=A.brown; const f=c.createBiquadFilter(); f.type="lowpass"; f.frequency.value=380;
  const g=c.createGain(); g.gain.setValueAtTime(0.7/(1+dist*0.55),c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.1); s.connect(f).connect(g);
  if(c.createStereoPanner){ const p=c.createStereoPanner(); p.pan.value=clamp(pan,-1,1); g.connect(p).connect(A.master); } else g.connect(A.master); s.start(); s.stop(c.currentTime+0.15); }
export function canStand(x,z,y0){ for(const [ox,oz] of [[0.27,0.27],[-0.27,0.27],[0.27,-0.27],[-0.27,-0.27],[0,0]]){ const px=x+ox,pz=z+oz, c=cellAt(px,pz); if(c==="#") return false; if(Math.abs(floorOf(c,px,pz)-y0)>0.4) return false;
    for(const o of OBST) if(px>o[0]&&px<o[2]&&pz>o[1]&&pz<o[3]) return false; } return true; }
export function inPlace(){ for(const s of SPOTS) if(Math.hypot(s.x-W.x,s.z-W.z)<0.62) return s; return null; }
export function heard(){ for(const P of PATROLS){ const d=Math.hypot(P.x-W.x,P.z-W.z); if(d<6.5&&Math.abs(floorAt(P.x,P.z)-floorAt(W.x,W.z))<2) P.alert={x:W.x,z:W.z,t:2.6}; } }
export function walkStep(side){ if(S.state!=="walk"||W.arrived) return; if(S.hold) return;
  const now=S.t; W.moveT=now; W.idle=0;
  if(now-W.lastT<0.22){ W.wob=Math.min(1.2,W.wob+0.5); creak(); heard(); W.lastT=now; W.last=side; return; }
  W.lastT=now; W.side=side; W.lift=1;
  if(side===W.last){ W.yaw+=side<0?Math.PI/6:-Math.PI/6; W.wob=Math.min(1.2,W.wob+0.2); legThud(); W.last=0; return; } // 同じ脚を続けると、その場で向きを変える
  W.last=side; W.wob=Math.min(1.2,W.wob+0.32);
  const fx=Math.sin(W.yaw), fz=Math.cos(W.yaw), y0=floorAt(W.x,W.z), nx=W.x+fx*0.5, nz=W.z+fz*0.5;
  if(canStand(nx,nz,y0)){ W.x=nx; W.z=nz; legThud(); }
  else { creak(); thump(0.5); heard(); W.wob=Math.min(1.2,W.wob+0.4); if(!W.said.bump){ W.said.bump=1; say("（ごつり、と何かに当たった）",true); } }
  arriveCheck(); }
export function seesChair(P){ const d=Math.hypot(W.px-P.x,W.pz-P.z); if(d>8.5) return false; const fy=floorAt(P.x,P.z), cy=floorAt(W.px,W.pz); if(Math.abs(fy-cy)>1.7) return false;
  const a=Math.atan2(W.px-P.x,W.pz-P.z); let da=Math.abs(((a-P.lyaw)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI); if(d>0.9&&da>0.5) return false;
  const ay=fy+1.0, by=cy+0.7, n=Math.ceil(d/0.15); for(let i=1;i<n;i++){ const t=i/n, x=P.x+(W.px-P.x)*t, z=P.z+(W.pz-P.z)*t, y=ay+(by-ay)*t, c=cellAt(x,z); if(c==="#"||y<floorOf(c,x,z)+0.05||y>ceilOf(c,x,z)) return false; }
  return true; }
export function walkCaught(P,line){ S.state="caught"; S.ts=0; bb.classList.remove("cue"); S.sitter={name:"屋敷の女中",kg:0,dog:false}; W.povP=P; W.povT=99; creak(); noiseBurst(A.white,0.4,0.25,"highpass",3000,1); say(line); }
export function patrolUpdate(P,dt){ const T=R3.T;
  if(P.alert){ P.alert.t-=dt; const a=Math.atan2(P.alert.x-P.x,P.alert.z-P.z); P.tyaw=a; if(P.alert.t<=0) P.alert=null; }
  else if(P.wait>0){ P.wait-=dt; P.tyaw=P.yaw+Math.sin(S.t*1.3)*0.7; }
  else { const [tx,tz]=P.route[P.i], dx=tx-P.x, dz=tz-P.z, d=Math.hypot(dx,dz);
    const ax=W.px-P.x, az=W.pz-P.z, along=(ax*dx+az*dz)/d, side=Math.abs(ax*dz-az*dx)/d, block=along>0&&along<0.9&&side<0.5;
    if(d<0.05){ P.wait=P.pause[0]+Math.random()*(P.pause[1]-P.pause[0]); if(P.i===P.route.length-1) P.dir=-1; if(P.i===0) P.dir=1; P.i+=P.dir; }
    else if(!block){ const s=Math.min(d,P.spd*dt); P.x+=dx/d*s; P.z+=dz/d*s; P.yaw=Math.atan2(dx,dz); P.tyaw=P.yaw;
      P.st-=dt; if(P.st<=0){ P.st=0.55/P.spd; const dd=Math.hypot(P.x-W.px,P.z-W.pz); if(dd<15){ const rx=-Math.cos(W.pyaw), rz=Math.sin(W.pyaw); stepAt(dd,((P.x-W.px)*rx+(P.z-W.pz)*rz)/Math.max(1,dd)); } } } }
  let da=((P.tyaw-P.lyaw)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI; P.lyaw+=clamp(da,-dt*2.6,dt*2.6);
  // 姿は12コマで刻む
  P.q+=dt; if(P.q>=1/12){ P.q-=1/12; const y=floorAt(P.x,P.z), bob=P.wait>0?0:Math.abs(Math.sin(S.t*7))*0.03; P.g.position.set(P.x+jit(0.006),y+bob,P.z+jit(0.006)); P.g.rotation.set(jit(0.012),P.lyaw+jit(0.02),(P.wait>0?0:(Math.floor(S.t*2.6)%2?0.035:-0.035))+jit(0.012));
    P.sl.intensity=3.2*Math.PI*(0.92+Math.random()*0.14); }
  const y=floorAt(P.x,P.z); P.lampPos.set(P.x+Math.sin(P.lyaw)*0.36+Math.cos(P.lyaw)*0.18,y+1.05,P.z+Math.cos(P.lyaw)*0.36-Math.sin(P.lyaw)*0.18);
  P.sl.position.copy(P.lampPos); P.sl.target.position.set(P.x+Math.sin(P.lyaw)*4,y,P.z+Math.cos(P.lyaw)*4); }
export function walkUpdate(dt){
  if(!R3){ return; }
  W.wob=Math.max(0,W.wob-dt*(S.hold?3.2:0.55)); W.lift=Math.max(0,W.lift-dt*3.5); W.idle+=dt; W.grace-=dt; W.povCd-=dt;
  const k=Math.min(1,dt*9); W.px+=(W.x-W.px)*k; W.pz+=(W.z-W.pz)*k; let dy=((W.yaw-W.pyaw)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI; W.pyaw+=dy*k;
  if(S.state==="walk"&&!W.arrived) for(const P of PATROLS) patrolUpdate(P,dt);
  // 広間の大時計：近づくほど、秒を刻む音が大きくなる
  if(!W.clock&&A.smp&&A.smp.clock){ W.clock=play("clock",0,1,0,true); }
  if(W.clock){ const d=Math.hypot(W.px-16.3,W.pz-7.5)+Math.abs(floorAt(W.px,W.pz))*1.5; W.clock.g.gain.value=0.5/(1+d*d*0.08); }
  // 指の向きを、いまの視点から屋敷の向きへ直す。押している間は視点が切り替わっても向きを保つ
  { const m=Math.hypot(stick.x,stick.y); W.stepT-=dt;
    if(!stick.on||m<0.2) W.mapYaw=W.camYaw||0;
    if(S.state==="walk"&&!S.hold&&m>=0.2&&W.stepT<=0){ const rush=m>0.85, c=Math.cos(W.mapYaw), sn=Math.sin(W.mapYaw), ix=stick.x/m, iy=-stick.y/m;
      // 前＝視線の向き(sin,cos)、右＝(-cos, sin)
      autoStep(sn*iy-c*ix, c*iy+sn*ix, rush); W.stepT=rush?0.26:0.5; } }
  // 見つかるかどうか：決まりは一つ。灯りに照らされた時、椅子が置き場（凹みの上）に静かに収まっていなければ、女中は立ち止まる。
  // 立ち止まっている間に収まれば「気のせい」、収まらなければ露見
  if(S.state==="walk"&&!W.arrived&&W.grace<=0){ let lit=null, near=false;
    for(const P of PATROLS){ if(seesChair(P)){ lit=P; break; } const d=Math.hypot(P.x-W.px,P.z-W.pz); if(d<7&&Math.abs(floorAt(P.x,P.z)-floorAt(W.px,W.pz))<1.7) near=true; }
    const spot=inPlace(), moving=S.t-W.moveT<0.4||W.wob>0.45, odd=!spot||moving;
    if(lit&&odd){ if(!W.noticeP){ W.noticeP=lit; say("あら……？"); thump(0.7); leatherSquish(0.4,0.9); insert("back",0.75); }
      W.notice+=dt; if(W.notice>NOTICE){ walkCaught(W.noticeP,moving?"……椅子が、歩いている。":"……こんな所に、椅子なんて。"); return; } }
    else if(W.noticeP){ W.notice-=dt*0.8; if(W.notice<=0){ const P=W.noticeP; W.notice=0; W.noticeP=null; P.alert=null; W.litPass=0;
        if(lit){ W.povCd=14; W.povP=P; W.povT=1.7; } say("……気のせいね。"); } }
    else if(lit){ W.litPass+=dt; if(W.litPass>0.9&&W.povCd<=0){ W.litPass=0; W.povCd=14; W.povP=lit; W.povT=1.7; say(["……ただの椅子ね。","（灯りが、椅子の上を素通りした）","この屋敷の椅子は、どれも陰気だこと。"][Math.floor(Math.random()*3)]); } }
    else W.litPass=Math.max(0,W.litPass-dt*0.5);
    // 立ち止まった女中は、灯りを椅子へ向けたまま動かない
    if(W.noticeP) W.noticeP.alert={x:W.px,z:W.pz,t:0.5};
    const cue=!!lit||near||!!W.noticeP; if(cue!==W.cue){ W.cue=cue; bb.classList.toggle("cue",cue); if(cue&&!W.said.near){ W.said.near=1; say("（灯りが、こちらへ来る）"); } } }
  // 置き場所に身を寄せた時だけ、ひと言
  if(S.state==="walk"&&W.idle>1.2){ const s=inPlace(); if(s&&s.l&&!W.said[s.l+s.x]){ W.said[s.l+s.x]=1; say(`（${s.l}、身を寄せた）`,true); } }
  if(S.state==="walk"&&W.idle>6&&!W.said.rule){ W.said.rule=1; say("椅子の在るべき所に在る限り、誰も椅子などに目を留めはしませぬ。"); }
  // 椅子の姿は12コマで刻む
  W.q+=dt; if(W.q>=1/12){ W.q-=1/12; W.vx+=(W.x-W.vx)*0.6; W.vz+=(W.z-W.vz)*0.6; let d2=((W.yaw-W.vyaw)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI; W.vyaw+=d2*0.6;
    const me=R3.me, sway=Math.sin(S.t*9)*W.wob*0.08, y=floorAt(W.vx,W.vz); me.position.set(W.vx+jit(0.004),y+W.lift*0.06,W.vz+jit(0.004)); me.rotation.set(jit(0.008),W.vyaw+W.side*W.lift*0.14+jit(0.012),W.side*W.lift*0.09+sway+jit(0.008));
    { const br=S.hold||W.noticeP?0:Math.sin(S.t*1.7)*Math.min(1,W.idle), bk=me.userData.back; bk.scale.set(1+br*0.02,1+br*0.025,1+br*0.22); }
    me.userData.legs.forEach((l,i)=>{ const left=i%2===0; l.position.y=0.17+((W.side<0)===left&&i<2?W.lift*0.08:0); }); }
  walkRender(dt); }
export function walkRender(dt){ const cam=R3.cam, T=R3.T;
  const fx=Math.sin(W.pyaw), fz=Math.cos(W.pyaw), fy=floorAt(W.px,W.pz);
  // 動いている間は定点から覗き、息を殺せば椅子の中から
  const want=S.hold&&S.state==="walk"?1:0; W.inK+=(want-W.inK)*Math.min(1,dt*(want?2.6:5));
  // 画面は12コマで刻む：コマが替わる時だけ視点を動かし、描く
  const fr=Math.floor(S.t*12), tick=fr!==W.frame; W.frame=fr;
  const cf=camFor(W.px,W.pz); if(!W.cam||cf.id!==W.camId){ W.camId=cf.id; W.cam={p:new T.Vector3(...cf.p),l:new T.Vector3(...cf.l)}; }
  else if(tick){ W.cam.p.lerp(new T.Vector3(...cf.p),0.25); W.cam.l.lerp(new T.Vector3(...cf.l),0.25); }
  W.camYaw=Math.atan2(W.cam.l.x-W.cam.p.x,W.cam.l.z-W.cam.p.z);
  const ins=new T.Vector3(W.px+fx*0.3,fy+0.6,W.pz+fz*0.3), insL=new T.Vector3(W.px+fx*3,fy+0.75,W.pz+fz*3);
  const e=W.inK*W.inK*(3-2*W.inK);
  if(W.insT>0&&S.state==="walk"){ W.insT-=dt; const k=1-W.insT/W.insD, sd=W.insK==="legs"?1:-1;
    const rx=Math.cos(W.pyaw)*sd, rz=-Math.sin(W.pyaw)*sd;
    if(W.insK==="legs"){ cam.position.set(W.px+rx*1.25+fx*0.5,fy+0.14,W.pz+rz*1.25+fz*0.5); cam.lookAt(W.px,fy+0.22+k*0.04,W.pz); cam.fov=40; }
    else { cam.position.set(W.px+fx*1.6+rx*0.45,fy+0.5,W.pz+fz*1.6+rz*0.45); cam.lookAt(W.px,fy+0.7,W.pz); cam.fov=40-k*8; }
    R3.key.position.set(cam.position.x+rx*0.4,cam.position.y+0.5,cam.position.z+rz*0.4); R3.key.intensity=2.2*Math.PI;
    seamEl.style.opacity=0; cam.updateProjectionMatrix(); R3.me.visible=true; R3.post.render(dt,S.t,tick||STEP12===false); return; }
  R3.key.intensity=0;
  if(W.povT>0&&W.povP){ W.povT-=dt; const P=W.povP, y=floorAt(P.x,P.z); cam.position.set(P.x+Math.sin(P.lyaw)*0.1,y+1.5,P.z+Math.cos(P.lyaw)*0.1); cam.lookAt(W.px,fy+0.55,W.pz); cam.fov=42; seamEl.style.opacity=0; }
  else if(e<0.5){ cam.position.copy(W.cam.p); cam.lookAt(W.cam.l); cam.fov=50; seamEl.style.opacity=String(clamp(e*4,0,1)); }
  else { cam.position.copy(ins); cam.lookAt(insL); cam.fov=46; seamEl.style.opacity="1"; }
  cam.updateProjectionMatrix(); R3.me.visible=e<0.5||W.povT>0; R3.post.render(dt,S.t,tick||STEP12===false); }
const STEP12=new URLSearchParams(location.search).get("koma")==="0"?false:true;
