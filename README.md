# 人間椅子 (human-chair)

江戸川乱歩「人間椅子」(1925) を原作にした、ブラウザで遊ぶ潜伏ゲームの試作。
スマホ・PC対応。Vite + Three.js（r186）で組み、静的なファイルとして書き出す。

- `src/` — 本編。序章、三夜（第一夜ホテルのロビーは手ほどき、夜会の広間、奥様の書斎）、手紙が返ってくる結末
  - `state.js` 状態と字幕 / `story.js` 客・夜・台詞 / `flow.js` 夜の流れと結果 / `loop.js` 毎フレームの更新
  - `interior.js` 椅子の内側（WebGL2の直書き）/ `audio.js` 音（Web Audioの合成）/ `card.js` 結果の縦書き画像
  - `walk.js` 第三夜の椅子歩き（間取り、見回り、見つかる規則、3D）/ `post.js` 画面の仕上げと画質の自動調整
- `legacy/prototype.html` — 一枚のHTMLだった頃の試作（参照用）
- `tests/` — Playwright で通しプレイと規則を確かめるスクリプト
- `docs/plan.html` — 企画書
- `docs/selection.html` — 原作選定メモ（候補8作の比較と企画3案）

## 遊び方

```
npm install
npm run dev        # 開発（http://localhost:5173/）
npm run build      # dist/ に書き出す
```

音が出るのでイヤホン推奨。URL に `?q=low|mid|high` を付けると画質の段を固定できる（既定は端末から自動、重ければ解像度を自動で下げる）。

確かめ方：`npm run build && npx vite preview --port 4173` を立てて、`NODE_PATH=$(npm root -g) node tests/run4.cjs`（三夜の通し）、`tests/w4.cjs front|back`（二つの道を歩き切れるか）、`tests/w6.cjs`（照らされた時の規則）。

- 上の者が耳を澄ませたら、息を殺す（画面長押し / Space）
- 椅子が鳴いたら、重心を戻す（左右ボタン / ← →）
- 第三夜の頭だけ、椅子は応接間から階上の書斎まで、屋敷の中を歩く（3D、three.js r128）。左右の脚を交互に出すと進み、同じ脚を続けると向きを変える。表の廊下と大階段を行くか、使用人の通路と裏階段を行くかは自由
- 見回りの灯りに照らされても、置き場所（飾り棚の陰、椅子の列など）で止まっていれば「ただの椅子」。場違いな所で照らされると一度目は応接間へ引き戻され、二度目は露見。動いている所を見られたら露見
- 歩くと椅子の背後から、止まると椅子の中から革の隙間越しに見る。やり過ごした時だけ、女中の目線に一瞬切り替わる
- 気配が満ちたら、露見。第二夜以降は「この夜から」やり直せる
- 結果は縦書きの画像（1080×1350）として残せる

## 原作

本文は青空文庫で読める。作者没後70年を過ぎており、自由に翻案できる。

## 素材の出典

写真の質感と録った物音は、どれも CC0（パブリックドメイン）です。帰属表示は不要ですが、作者を記します。

- 質感（Poly Haven）：fabric_leather_02（Rob Tuytel）、herringbone_parquet（Jenelle van Heerden, Sergej Majboroda）、quatrefoil_jacquard_fabric・floral_jacquard（colormass, Rico Cilliers）、wood_table_001（Dimitrios Savva, Rico Cilliers）、wooden_panels（Dimitrios Savva）、HDRI brown_photostudio_01（Sergej Majboroda）
- 家具（Poly Haven）：round_wooden_table_01（Ulan Cabanilla）、brass_candleholders（Tina）、Chandelier_01（Kirill Sannikov）、potted_plant_02（Rico Cilliers）、vintage_cabinet_01（Rico Cilliers）、vintage_oil_lamp（Monsta3D）、mantel_clock_01（Yann Kervran, Rico Cilliers）、fancy_picture_frame_01・02（Rob Tuytel, Rico Cilliers）、side_table_tall_01（James Ray Cock）、vintage_grandfather_clock_01（Yann Kervran, James Ray Cock）、lantern_chandelier_01（Kirill Sannikov）
- 真鍮（ambientCG）：Metal048B
- 物音（freesound）：kyles #637353、badbear904 #702165、Crinkem #501015、IENBA #536187、Joao_Janz #485145、ftpalad #119914、blukotek #412751

`public/tex` の `*_orm.jpg` は、赤＝陰（AO）、緑＝粗さ、青＝金属らしさを一枚に詰めたものです。
