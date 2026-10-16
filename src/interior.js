
// ---------- WebGL ----------
export const cv = document.getElementById("c");
export const gl = cv.getContext("webgl2", {antialias:false, alpha:false});
export const VS = `#version 300 es
in vec2 aPos;
uniform vec2 uScale; uniform float uTilt; uniform vec4 uBlobs[8]; uniform int uCount;
out vec2 vUv; out float vP; out vec3 vPos;
float pressure(vec2 uv){ float p=0.0; for(int i=0;i<8;i++){ if(i>=uCount) break; vec4 b=uBlobs[i]; float d=distance(uv,b.xy)/max(b.z,0.001); p+=b.w*exp(-d*d*2.2);} return p; }
void main(){
  vec2 uv=aPos*0.5+0.5; vUv=uv; float p=pressure(uv); vP=p;
  vec3 pos=vec3(aPos, p*0.45); vPos=pos;
  float persp=1.0/(1.9-pos.z); vec2 sp=pos.xy*persp*1.35;
  float c=cos(uTilt), s=sin(uTilt); sp=vec2(sp.x*c-sp.y*s, sp.x*s+sp.y*c);
  gl_Position=vec4(sp*uScale, 0.0, 1.0);
}`;
export const FS = `#version 300 es
precision highp float;
in vec2 vUv; in float vP; in vec3 vPos;
uniform float uTime,uHeat,uPulse,uDark; uniform vec3 uSpots[6]; uniform int uSpotCount;
out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ return noise(p)*0.5+noise(p*2.1)*0.3+noise(p*4.3)*0.2; }
void main(){
  vec3 N=normalize(cross(dFdx(vPos),dFdy(vPos)));
  float g=fbm(vUv*38.0); float pores=smoothstep(0.6,0.8,noise(vUv*170.0));
  vec3 base=vec3(0.105,0.068,0.052)*(0.75+0.5*g)-pores*0.025;
  vec3 L=normalize(vec3(0.15,0.85,0.55));
  float diff=max(dot(N,L),0.0);
  vec3 col=base*(0.22+diff*1.0);
  float spec=pow(max(dot(reflect(-L,N),vec3(0,0,1)),0.0),28.0)*0.22;
  col+=spec*vec3(0.55,0.42,0.3);
  float p=clamp(vP,0.0,1.3);
  col=mix(col,vec3(0.50,0.21,0.12),p*0.5);
  col+=vec3(0.28,0.09,0.02)*uHeat*smoothstep(0.05,1.2,p);
  for(int i=0;i<6;i++){ if(i>=uSpotCount) break; vec3 s=uSpots[i]; float d=distance(vUv,s.xy); col+=vec3(0.95,0.8,0.55)*s.z*exp(-d*d*700.0); }
  float seam=exp(-pow((vUv.y-0.975)*70.0,2.0))*0.3*(0.85+0.15*sin(uTime*1.7));
  col+=seam*vec3(0.9,0.72,0.45);
  float r=length(vUv-0.5);
  col*=1.0-smoothstep(0.3,0.8,r)*(0.8+0.2*uPulse);
  col*=uDark;
  o=vec4(col,1.0);
}`;
export function sh(t,s){ const x=gl.createShader(t); gl.shaderSource(x,s); gl.compileShader(x); if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(x)); return x; }
export const prog=gl.createProgram(); gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(prog); gl.useProgram(prog);
export const N=90, verts=[], idx=[];
for(let j=0;j<=N;j++)for(let i=0;i<=N;i++) verts.push(i/N*2-1, j/N*2-1);
for(let j=0;j<N;j++)for(let i=0;i<N;i++){ const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1; idx.push(a,b,c,b,d,c); }
export const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
export const vb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
export const loc=gl.getAttribLocation(prog,"aPos"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
export const ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(idx),gl.STATIC_DRAW);
export const U={}; for(const n of ["uScale","uTilt","uBlobs","uCount","uTime","uHeat","uPulse","uDark","uSpots","uSpotCount"]) U[n]=gl.getUniformLocation(prog,n);
export function resize(){ const d=Math.min(devicePixelRatio||1,2); cv.width=innerWidth*d; cv.height=innerHeight*d; gl.viewport(0,0,cv.width,cv.height);
  const a=cv.width/cv.height; const s=a>1?[1.25,1.25*a]:[1.25/a,1.25]; gl.uniform2f(U.uScale,s[0],s[1]); }
addEventListener("resize",resize); resize();

