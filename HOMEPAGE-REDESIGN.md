# Homepage visual redesign V2

本地改版记录，2026-10-10。未部署、未推送。

## 改动范围

- `src/components/home/PracticeScene.tsx`：四个领域驱动真实项目展品；替换旧雕塑入口。
- `src/components/home/RulesStudy.tsx`：真实建筑源模型的四层构造演示；替换重复的肋条曲面。
- `src/components/home/Exhibition.module.css`：独立作用域的布局、响应式与动效。
- `src/app/page.tsx`：移除 Rules 原来的整行大标题和独立模型容器，接入一体化构图。

Hero、Selected Works、导航和各 Case Study 的组件与内容未改。About / Contact 保留现有布局、文字揭示、深色背景和邮箱交互。

开始时 Git 工作区干净。恢复参考分支：`codex/checkpoint-editorial-v2`。旧雕塑源文件保留在仓库中，但新版首页不再导入或渲染它们。

## 视觉选择

先在独立本地预览服务制作三种实际构图，并在 Chrome 截图比较：

| 候选 | 表达 | 选择 |
| --- | --- | --- |
| A / Computational Atlas | 左侧设计声明，右侧鼓楼拆解模型与参考图，底部领域索引 | 用于 Practice；能让建筑、产品和晶格共用坐标体系而不强迫几何变形 |
| B / Generative Architecture | 左侧规则与构造次序，右侧四层建筑分解图 | 用于 Rules；源图视角一致、结构清楚，并有已记录的构件数 |
| C / Structural Morphology | 深色横向研究图版与 Kelvin 晶格渲染 | 未采用；现有渲染适合展示成果，但缺少同样完整的连续阶段素材 |

构图参考是建筑展览中的图版、实物和索引关系。保持原有纸色 `#f2f2ef`、墨色 `#111111`、规则线 `#d1d1ca`，说明文字使用 `#62625d`。保留现有 display/body/mono 字体变量，不添加外部字体。左对齐声明与右侧展品形成主次，界面截图不伪装为实时运行的产品。

候选截图：`output/playwright/candidates-a.png`、`candidates-b.png`、`candidates-c.png`。

## 真实素材

所有图片均来自现有 `public/images/projects/`，没有调用生成图像、视频或付费 API，没有替换原始文件。

- Parametric Design：`drum-tower/exploded-structure-display.webp`、`drum-tower/cover-hero.webp`。
- AI Workflow：`vernacular/cover.webp`，配合项目已有的自然语言 → JSON → Grasshopper 工作流说明。
- Digital Product：`jiko/weekly-review.webp`、`jiko/appearance-system.webp`。
- Computational Design：`lattice/cover-editorial.webp`。按后续反馈移除左下角的实体样件实拍小图，主渲染图占据完整展示区域。
- Rules：`vernacular/layer-01-plinth.webp` 至 `layer-04-roof.webp`。四张透明图保持原有轴测投影与相对构造位置。

79 / 292 / 265 / 24 的构件数来自原有 `ArchitectureAnatomy.tsx`；累积显示数为 79 / 371 / 636 / 660。这些是源模型记录，不是网页计算出来的仿真结果。

## 交互与动效

- Practice：hover / focus 临时预览，click / Enter 锁定；离开时返回锁定项，没有锁定项则返回鼓楼。提供明确的取消锁定按钮。
- 展品始终挂载，图片提前加载；切换用 500 ms 交叉淡入与 8 px 位移，不重新创建模型或请求生成服务。
- Rules：直接选层进入 EXPLORE；AUTO 每 4.8 秒推进一层；PAUSE 保持当前阶段。用户选层不会被自动播放覆盖。
- 分层揭示使用 500 ms 透明度变化和 600 ms 图版重新定位，源图相机视角保持不变。
- 页签隐藏或 Rules 离开视口时停止定时器。图片完成加载后才允许自动演进。
- 减少动态效果时禁用自动播放和空间过渡，手动交互仍可用。服务端和客户端首次渲染保持一致，避免此偏好触发 hydration 错误。
- 支持 CSS scroll timeline 的浏览器在 Rules 离开时轻微淡出图版；其他浏览器保持普通滚动。
- 标题复用现有整行 MaskReveal，About / Contact 继续使用原有一次性揭示。

## 检查与截图

- 生产构建、TypeScript、5 项已有测试通过。
- 修改的 TypeScript/TSX 文件 ESLint 零警告。
- 全仓库 `npm run lint` 仍报告已有的 4 条警告，位于被 Git 忽略的 `career-resume/qa/render.mjs` 和 `render-en.mjs`；没有修改这些简历工作文件。
- Chrome 检查 1920、1440、1280、1024、768、390 px：文档宽度等于视口宽度，所有新增展示图片加载成功。
- 查看默认鼓楼、AI Workflow、JIKO、晶格、建筑台基、完整构造，以及 About / Contact。根据截图放大了 AI 工作流的主图，并调整手机端屋面与图注的距离。
- 单独保留 390 × 844 的真实视口截图，避免长元素截图中的固定导航拼接伪影影响判断。
- 最终 21 项浏览器检查通过：hover 恢复默认、锁定后预览与恢复、focus 预览、Enter 锁定、取消锁定、构件计数、手动阶段保持、AUTO 推进、PAUSE 保持、离屏停播、reduced-motion 刷新与静态保持、手动探索、四个项目链接 HTTP 成功，以及页面运行错误为零。减少动态效果下首次刷新出现的 hydration 问题已修复并通过复测。

最终截图在 `output/playwright/`：`practice-1440.png`、`ai-1440.png`、`product-1440.png`、`lattice-1440.png`、`plinth-1440.png`、`rules-1440.png`，以及对应移动端与其他宽度的截图。

## 性能与限制

两个新版区域不创建 canvas / WebGL，不使用 requestAnimationFrame 循环，也没有每帧创建几何或由滚动事件触发 React 重渲染。新增资源沿用 Next Image，保留尺寸容器，隐藏展品预加载以换取首次切换稳定性。

Rules 是基于真实模型导出图的构造阅读体验，不是浏览器端 CAD、参数求解器或新的建筑生成后端。手机端已做浏览器视口验证，未在实体手机上测量 GPU / 电量 / FPS。旧雕塑的未使用源码尚未整体清理。全站原有 Hero / Selected Works 的性能不在这次替换范围内。

## 本地预览

验收服务：<http://127.0.0.1:3108/#introduction>。Rules：<http://127.0.0.1:3108/#rules>。

服务退出后可运行：

```powershell
npm run build
npm run start -- --port 3108 --hostname 127.0.0.1
```

开发预览使用已有的 `npm run dev` 服务。候选构图仅存在于本地 `tmp/` 与截图目录，不加入正式页面路由。
