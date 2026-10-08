AI-Driven Vernacular Architecture (桂北江头村民居参数化生成) — 交付素材
Project 01, slug: vernacular-ai

源素材：jiangtou-ultra-assets.zip（2026-10-07 超高清重渲染）。
  界面图 7680×4320（1920×1080 CSS 视口 DPR 4，真实 WebGL framebuffer 5200×3596）
  hero-cover / generation-process  7680×4320
  hero-axonometric / 结构与分层    7200×5400
  generative-variants             6000×6000
全部图版按内容包围盒重新裁切，**不降分辨率**，只裁掉烧入的小字页眉/页脚；标题与
技术页脚由页面的 .case-figure figcaption 以活字呈现。分层切图保留透明背景，四张
共用同一台相机与同一裁切框（verification-ultra.json 记录的 alpha_bounds 相符），
因此爆炸视图就是它们的原生对齐。裁切框见下方表格；四张分层图必须共用同一框。

比例被 CSS 硬绑定（.case-figure-* / .anatomy-stack）。替换任何一张文件时必须
同步改对应比例，否则 object-fit: cover 会静默裁掉画面边缘。

  文件                            尺寸          版式 token            裁切（源图坐标）
  ------------------------------  ------------  --------------------  --------------------
  cover.webp                      7680 × 4320   .case-cover           interface-cover-8k      整幅
  01-grammar-of-dwelling.webp     5244 × 3114   "wide"                hero-cover-ultra        5244:3114:1323:901
  03-nine-configurations.webp     6000 × 4620   "grid"                generative-variants     6000:4620:0:900
  04-rules-to-geometry.webp       7680 × 2700   "cinema"              generation-process      7680:2700:0:840
  05-interface.webp               7680 × 4320   CaseFigurePair half   interface-cover-8k      整幅
  06-scheme-comparison.webp       7572 × 4260   CaseFigurePair half   interface-comparison-8k 7572:4260:58:51
  07-source-triangulation.webp    4854 × 3900   CaseFigurePair tall   structural-wireframe    4854:3900:1173:972
  08-timber-frame.webp            6030 × 3900   CaseFigurePair tall   structural-mesh         6030:3900:582:948
  layer-01-plinth.webp            2550 × 3900   ArchitectureAnatomy   exploded-layer-base     2550:3900:2325:960
  layer-02-walls.webp             2550 × 3900   ArchitectureAnatomy   exploded-layer-walls    同上
  layer-03-timber.webp            2550 × 3900   ArchitectureAnatomy   exploded-layer-timber   同上
  layer-04-roof.webp              2550 × 3900   ArchitectureAnatomy   exploded-layer-roof     同上

编码：libwebp q=92，四张分层图保留 alpha（yuva420p）。合计约 1.48 MB。
Next 优化器以 quality={90} 输出 AVIF（见 next.config.ts 的 images.qualities）——
这类米白底 1px 细线稿是有损编码最吃亏的内容，默认 q=75 会把瓦垄和木构架的细线
抹平。deviceSizes 已补到 7680：Next 默认只生成到 3840w，4K@2× 的满幅封面会因此
被拉伸。补上后只剩 8K 屏一种组合仍差 6%（0.95×），其余全部无上采样。

分辨率核算（1920 视口实测版面宽度；"余量" = 源像素 ÷ 需要的设备像素）
  文件                        源像素    版面 CSS px    1× 屏余量   2× 屏余量
  --------------------------  --------  ------------  ---------  ---------
  cover.webp                     7680       1760         4.36×     2.18×
  01-grammar-of-dwelling.webp  5244       1419         3.70×     1.85×
  03-nine-configurations.webp  6000       1419         4.23×     2.11×
  04-rules-to-geometry.webp    7680       1419         5.41×     2.71×
  05-interface.webp            7680        698        11.00×     5.50×
  06-scheme-comparison.webp    7572        698        10.85×     5.42×
  07-source-triangulation      4854        698         6.95×     3.48×
  08-timber-frame              6030        698         8.64×     4.32×
  layer-01..04                 2550        451         5.65×     2.83×

全部 ≥1.85×：1920 视口下的任何 DPR、任何窗口宽度都不会被上采样（浏览器实测）。
正文栏固定 1419px 不随视口变宽，所以窗口拉到 4K 也不影响图版；只有满幅封面随
视口走，实测 2560@1× 余量 2.90×、3840@1× 余量 2.09×、1920@2× 余量 2.18×，
只有 3840@2×（8K 屏）仍差 6%。

注意 cover.webp 与 05-interface.webp 是同一张 interface-cover-8k.png：封面是首屏
预告，05 是第 06 章的正式读图。若要去重，删掉 assets 里的 05 条目、把 06 改成
CaseFigure 满幅即可；cover 本身必须保留。

浏览器侧实测（1920×1080）：图版 CSS 1419px 时浏览器取 w=1920（1×）/ w=3840（2×），
分层图 451px 取 w=640/1080，并排图版 698px 取 w=750/1920——全部有余量，无上采样。
next.config.ts 的 minimumCacheTTL 已从默认 4 小时收到 60 秒：优化器响应的
Cache-Control 是 max-age=14400，改图后旧字节会在浏览器里滞留 4 小时。

hero-axonometric-ultra.png / exploded-architecture-ultra.png / structural-transparent
/ hero-transparent / exploded-transparent 目前未进页面（已被更合适的图取代），仍留在
.asset-stage/incoming/ 作为可复用源。

每个 <Image> 的 sizes 按实测版面宽度写死（CaseFigure 1460px / CaseFigurePair
720px / ArchitectureAnatomy 460px / ProjectCover 92vw）。sizes 写窄会让浏览器挑到
偏小的 srcset 候选，换图后若版面宽度变了要一并复核。

注意：不要用 JS 读 <img>.naturalWidth 来判断画质。本机可用内存只有 3.4 GB 时，
Chrome 会把解码后的位图压到 600 px 左右并让 naturalWidth 报这个值，但光栅化时
仍按全分辨率绘制——已用「源放大 / 源降 600 再放大 / 实际渲染」三联像素对比验证。

数字来源（图内页脚与标注区，非估算）：
  模型 id dv2_c233bda44634eeebf2b6 / 660 source components / expansion_v2 · 18 × 32 m
  01 台基与院落 79 parts / +0 m    02 墙体与洞口 292 parts / +8.5 m
  03 木构架   265 parts / +17 m    04 屋面         24 parts / +25.5 m
  79 + 292 + 265 + 24 = 660，与页脚总数一致。
  九宫格：宽度 12.78 / 14.22 / 15.66 m，排数 1 / 2 / 3，diversity_v1，
  种子 20261107–20261309，九个 candidate_id 互不相同，共用同一相机与米制比例。

引用位置：src/data/projects.ts、src/app/work/[slug]/page.tsx、
src/components/project/{CaseFigure,ArchitectureAnatomy}.tsx
联系方式与简历在 src/data/site.ts。