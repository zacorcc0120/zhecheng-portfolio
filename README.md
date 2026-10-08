# Zhecheng Cao — Portfolio

曹哲诚的计算设计 / AI 产品设计 / 参数化设计作品集。完整 Next.js App Router 项目，包含首页、作品目录、五个 Case Study、Lab 与 About。所有素材空缺都有明确占位，演示数据不被包装成实验成果。

## 本地启动

安装 Node.js 20.9 或更新的受支持版本，推荐 Node.js 22 / 24。进入本文件所在的项目文件夹：

```bash
npm install
npm run dev
```

访问 **http://localhost:3000**。首次安装需要能访问 npm registry。已提供 `package-lock.json`；希望严格复现依赖时使用 `npm ci`。

```bash
npm run lint       # ESLint，零警告要求
npm run typecheck  # TypeScript
npm run test       # 参数边界、取消任务、几何和数据过滤测试
npm run build     # 正式生产构建
npm start         # 构建后以生产模式启动
npm run format    # Prettier 格式化源码
```

`scripts/dev.mjs` 仅归一化可选预览参数，实际运行标准 Next.js dev server。正常启动仍是 3000 端口；`npm run dev -- --port 3001` 可修改端口。

## 页面

| 地址                   | 内容                                          |
| ---------------------- | --------------------------------------------- |
| `/`                    | 个人定位、设计方法、五个作品、能力与联系      |
| `/work`                | 大型编辑式作品目录                            |
| `/work/vernacular-ai`  | 旗舰研究、自然语言模拟、JSON、参数化院落体块  |
| `/work/lattice-system` | 四类晶格、参数和相机控制、X / Z 演示曲线      |
| `/work/drum-tower`     | 滚动拆解与可调节鼓楼示意模型                  |
| `/work/recoveryx`      | 评估 / 记录 / 追踪 / 报告结构及交互 Dashboard |
| `/work/jiko`           | 时间记录、日常回顾、提醒系统与交互计时器       |
| `/lab`                 | 六个实验入口                                  |
| `/about`               | 个人介绍、教育、分组技能、简历入口            |

## 维护入口

| 文件                                   | 修改内容                                     |
| -------------------------------------- | -------------------------------------------- |
| `src/data/site.ts`                     | 姓名、简介、邮箱、GitHub、LinkedIn、简历地址 |
| `src/data/projects.ts`                 | 项目文案、角色、状态、标签、图片与视频       |
| `src/data/experiments.ts`              | Lab 实验目录                                 |
| `src/data/mock-data.ts`                | 所有仿真与训练 mock 数据                     |
| `src/data/model-assets.ts`             | GLB / GLTF 资源 URL                          |
| `src/app/globals.css`                  | 全站设计 token、布局、字号、响应式与动效     |
| `src/lib/architecture.ts`              | 自然语言解析、参数结构与 provider 接口       |
| `src/lib/lattice.ts`                   | 纯函数晶格几何生成                           |
| `src/components/three/SceneCanvas.tsx` | R3F 模型、灯光与相机                         |

`src/components` 按 `layout / home / project / three / motion / charts / ui` 分类；`src/hooks` 放能力检测。Case Study 使用服务端页面与按需加载的客户端演示组件。

## 你回到电脑后，先补这些

1. 在 `site.ts` 填真实邮箱、GitHub / LinkedIn，以及简历 PDF 地址。
2. 优先补旗舰项目的实地照片、空间图、Grasshopper 截图与最终模型图。
3. 补晶格试件、原始 ANSYS 条件与数据；不要把本项目 mock 数值用作研究结论。
4. 补鼓楼分析与模型图，以及 RecoveryX 真实产品截图。
5. 最后接入 GLB、真实 AI / Grasshopper 接口，并更新研究状态与验证记录。

## 替换图片

文件夹已建立：

```text
public/images/projects/vernacular/
public/images/projects/lattice/
public/images/projects/drum-tower/
public/images/projects/recoveryx/
public/images/projects/jiko/
public/models/
public/videos/
public/resume/
```

例：将照片放入 `public/images/projects/vernacular/field-research.jpg`，再在 `projects.ts` 中把对应 `assets` 记录改为：

```ts
{
  label: "Field research / 调研照片",
  path: "/images/projects/vernacular/field-research.jpg",
  src: "/images/projects/vernacular/field-research.jpg",
  alt: "江头村传统民居院落的实地调研照片",
}
```

`src: null` 显示技术占位，填写路径后使用 Next/Image。`path` 是占位时显示的建议路径，不会发起请求，因此空素材不会产生 404。首页与项目 Hero 的封面由 `cover` 控制，例如：

```ts
cover: "/images/projects/vernacular/cover.jpg";
```

推荐 WebP / JPG，主要展示图长边约 1600–2400 px。先确认图片来源和内容，再修改 alt；不需要把文件命名成代码里的固定名字，只要 URL 一致即可。

## 加入视频

将 MP4 放入 `public/videos/`，在项目记录中增加可选 `video`：

```ts
video: {
  src: "/videos/vernacular-workflow.mp4",
  poster: "/images/projects/vernacular/video-poster.jpg",
  captions: "/videos/vernacular-workflow.zh.vtt",
  caption: "自然语言到参数化模型的工作流录屏",
}
```

它会自动出现在成果区域，使用原生播放控件和 `preload="metadata"`，不会自动播放。有口述说明时请提供 WebVTT 字幕；无口述视频可省略 captions。

## 接入真实 3D 模型

将模型放入 `public/models/`，在 `src/data/model-assets.ts` 填 URL，例如 `architecture: "/models/vernacular-ai.glb"`。建议用 GLB，减少外部纹理路径问题。

查看器自动居中、缩放，并保留相机旋转 / 缩放功能。GLB 是静态几何，因此接入真实 GLB 时会禁用程序化参数，避免暗示滑块仍在改变模型。若要驱动真实参数化模型，需要接入 Grasshopper / Rhino 生成接口，并以新模型更新资源 URL。纯 glTF 文件的关联纹理和 `.bin` 必须同时放入正确的相对目录。

目前模型都属于简化示意：Octet 基于面心连接，Kelvin 使用截角八面体骨架，Honeycomb 使用六边形棱柱；Voronoi 为非规则杆网示意，没有实现 Voronoi 求解器。Density 是重复数量，不是实测相对密度。杆径的 u 是展示模型单位。

## 接入真实 AI

`src/lib/architecture.ts` 定义了 `ArchitectureProvider`。现有 provider 完全本地运行，支持中文 / 英文的开间、进数、屋顶高度、天井和照壁，包含默认值、边界约束和 AbortSignal 取消。

后续用你自己的 provider 替换 `architectureProvider.generate`：

1. 创建服务端 `src/app/api/generate/route.ts`。
2. 服务端调用模型和建筑知识库，校验返回 JSON，再返回 `ArchitectureResult`。
3. 前端通过 `fetch('/api/generate', { method: 'POST', body: JSON.stringify({prompt}), signal })` 调用。
4. 将参数交给真实建模服务，处理错误、超时与模型版本。

API Key 只放服务端环境变量，不使用 `NEXT_PUBLIC_` 前缀，不写进前端或 Git。页面中的“Knowledge verified — demo rules only”仅指本地演示规则，不代表完成了地方知识验证。

## 添加项目

向 `projects.ts` 增加符合 `Project` 的对象。首页、作品目录、静态详情路由、SEO 和 Next Project 链接自动读取该数据。普通 Case Study 不需要再创建路由文件；全新交互种类则扩展 `ProjectKind` 与 `ProjectDemo.tsx`。

## 设计、性能与无障碍

- 暖灰白底 / 黑色文字 / 极少量橄榄灰用于模型和数据；大字、分隔线与留白组织内容。
- 使用系统现代无衬线字体栈，避免安装和构建时依赖 Google Fonts。可在 `--font-body` 或 `next/font/local` 接入你有授权的字体。
- 动效采用 Framer Motion、IntersectionObserver 与原生轻量 reveal；没有额外加入 GSAP / Lenis，避免两套滚动系统。
- 普通滚动、锚点和浏览器返回行为保留；不劫持滚轮缩放模型。
- Three.js 只在项目查看器进入视野时通过 `dynamic(..., {ssr:false})` 加载；静止时按需渲染，DPR 上限 1.5，晶格采用 InstancedMesh。
- 浏览器不支持 WebGL2 时自动进入可调几何投影模式，保留参数、键盘、旋转和缩放；自动旋转禁用。
- 尊重 `prefers-reduced-motion`；自动旋转默认关闭；滚动监听、动画、观察器、OrbitControls 和生成任务均有清理。
- 390 / 768 / 1024 / 1440 / 1920 布局均有相应断点策略；键盘可操作菜单、标签组、范围输入与相机。
- 数据图提供语义化标题、单位与精确数据表。所有演示数据集中管理并显式标注。

## 部署到 Vercel

1. 将项目上传到你自己的 GitHub 仓库。
2. 在 Vercel 导入该仓库，Framework Preset 使用 **Next.js**。
3. Build Command：`npm run build`。Install Command 保持 `npm install` 或 `npm ci`，输出目录使用默认值。
4. 添加 `NEXT_PUBLIC_SITE_URL`，值为你的最终 HTTPS 域名，用于 canonical、sitemap、robots 与 OpenGraph 的绝对地址。
5. 部署后检查首页、项目内页、图片与 3D 模型。

项目不依赖特定托管平台，没有数据库或密钥要求；本次未替你公开部署。已配置页面 title / description / OpenGraph / Twitter metadata、favicon、robots 与 sitemap。真实社交分享图片未提供，当前不伪造项目封面作分享图。

## 依赖与参考

Next.js / React / TypeScript / Tailwind CSS / Framer Motion / Three.js / React Three Fiber / Lucide。图表使用轻量 SVG，没有加入额外图表框架。

- [Next.js client lazy loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

详细验证记录见 `VALIDATION.md`。真实项目图、视频、GLB、简历、联系方式、AI 服务和 ANSYS 数据需由你后续补入；不影响首版本地运行。
