// ---------- 画面の仕上げ：陰影、光のにじみ、トーンマップ、フィルムの粒、画質の自動調整 ----------
import { HalfFloatType, Uniform } from "three";
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, SMAAEffect, Effect } from "postprocessing";
import { N8AOPostPass } from "n8ao";

// 12コマで刻む粒子、ときどき走る傷、わずかなちらつき、暗部は青緑・明部は琥珀の色調
const FILM = /* glsl */`
uniform float uFrame; uniform float uFlick;
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec3 c=inputColor.rgb*uFlick;
  float l=dot(c,vec3(.299,.587,.114)); c=mix(vec3(l),c,0.82);
  c*=mix(vec3(0.86,0.99,0.97),vec3(1.08,0.98,0.84),smoothstep(0.02,0.45,l));
  // 粒子と傷は見た目の明るさ（ガンマ空間）で足す
  vec3 g=pow(max(c,0.),vec3(1./2.2));
  g+=(h(uv*vec2(913.,1373.)+uFrame*1.7)-0.5)*0.045;
  float sx=h(vec2(uFrame,1.3)); if(h(vec2(uFrame,7.1))>0.74) g-=0.035*smoothstep(0.0016,0.,abs(uv.x-sx));
  outputColor=vec4(pow(max(g,0.),vec3(2.2)),inputColor.a);
}`;
class ExposureEffect extends Effect {
  constructor(v){ super("ExposureEffect", "uniform float uExp; void mainImage(const in vec4 i, const in vec2 uv, out vec4 o){ o=vec4(i.rgb*uExp,i.a); }", { uniforms: new Map([["uExp", new Uniform(v)]]) }); }
}
class FilmEffect extends Effect {
  constructor(){ super("FilmEffect", FILM, { uniforms: new Map([["uFrame", new Uniform(0)], ["uFlick", new Uniform(1)]]) }); }
}

// 画質の段：URLの ?q=low|mid|high で固定できる。無ければ端末から選び、重ければ解像度を下げる
export function pickTier(){
  const q = new URLSearchParams(location.search).get("q");
  if (q === "low" || q === "mid" || q === "high") return q;
  const coarse = matchMedia("(pointer:coarse)").matches;
  return coarse ? "mid" : "high";
}
const TIERS = {
  low:  { maxScale: 0.75, ao: false, bloom: true, smaa: false, shadow: 512 },
  mid:  { maxScale: 1.0,  ao: true,  bloom: true, smaa: true,  shadow: 512 },
  high: { maxScale: 1.5,  ao: true,  bloom: true, smaa: true,  shadow: 1024 },
};

const EXPOSURE = Number(new URLSearchParams(location.search).get("exp")) || 3.6;
const NOPOST = new URLSearchParams(location.search).get("post") === "0";
export function makePost(ren, scene, cam){
  const tier = pickTier(), T = TIERS[tier];
  const composer = new EffectComposer(ren, { frameBufferType: HalfFloatType });
  composer.addPass(new RenderPass(scene, cam));
  let ao = null;
  if (T.ao){
    ao = new N8AOPostPass(scene, cam, innerWidth, innerHeight);
    Object.assign(ao.configuration, { aoRadius: 0.9, distanceFalloff: 0.6, intensity: 2.2, halfRes: tier !== "high", gammaCorrection: false, color: { r: 0, g: 0, b: 0 } });
    if (ao.setQualityMode) ao.setQualityMode(tier === "high" ? "Medium" : "Performance");
    composer.addPass(ao);
  }
  const film = new FilmEffect();
  const fx = [];
  if (T.bloom) fx.push(new BloomEffect({ intensity: 1.1, luminanceThreshold: 0.85, luminanceSmoothing: 0.3, mipmapBlur: true, radius: 0.72 }));
  const exposure = new ExposureEffect(EXPOSURE);
  fx.push(exposure, new ToneMappingEffect({ mode: ToneMappingMode.AGX }), new VignetteEffect({ offset: 0.3, darkness: 0.62 }), film);
  composer.addPass(new EffectPass(cam, ...fx));
  if (T.smaa) composer.addPass(new EffectPass(cam, new SMAAEffect()));
  // 画質の自動調整：1.5秒ごとに平均のフレーム時間を見て、解像度を上げ下げする
  const st = { scale: Math.min(devicePixelRatio || 1, T.maxScale), acc: 0, n: 0, t: 0 };
  const apply = () => { ren.setPixelRatio(st.scale); composer.setSize(innerWidth, innerHeight); };
  apply();
  return {
    tier, T, composer, ao, film, st, resize: apply,
    // draw=false の時は測るだけで描かない（12コマで刻む時、描かないコマは前の絵が残る）
    render(dt, t, draw = true){
      if (NOPOST){ if (draw) ren.render(scene, cam); return; }
      const fr = Math.floor(t * 12), u = film.uniforms;
      if (u.get("uFrame").value !== fr){ u.get("uFrame").value = fr; u.get("uFlick").value = 0.96 + 0.06 * Math.random(); }
      st.acc += dt; st.n++; st.t += dt;
      if (st.t > 1.5){
        const fps = st.n / st.acc; st.acc = 0; st.n = 0; st.t = 0;
        const cap = Math.min(devicePixelRatio || 1, T.maxScale);
        if (fps < 26 && st.scale > 0.5){ st.scale = Math.max(0.5, st.scale * 0.85); apply(); }
        else if (fps < 22 && ao && ao.enabled !== false){ ao.enabled = false; }
        else if (fps > 52 && st.scale < cap){ st.scale = Math.min(cap, st.scale * 1.1); apply(); }
      }
      if (draw) composer.render(dt);
    },
  };
}
