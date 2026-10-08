import Image from "next/image";
import { TowerSteps } from "./TowerSteps";

const ruleGroups = [
  {
    index: "01",
    title: "Plan geometry",
    chinese: "平面与柱网",
    items: [
      "Plan sides / 平面边数",
      "Base radius / 底层控制半径",
      "Column spacing / 柱网间距",
      "Inner column distance / 内柱距离",
    ],
  },
  {
    index: "02",
    title: "Vertical hierarchy",
    chinese: "竖向层级",
    items: [
      "Total height / 总体高度",
      "Number of eaves / 层檐数量",
      "Floor elevation / 层间标高",
      "Top structure height / 顶部高度",
    ],
  },
  {
    index: "03",
    title: "Proportion",
    chinese: "比例与收分",
    items: [
      "Layer scaling / 逐层缩放",
      "Taper ratio / 收分比例",
      "Eave projection / 屋檐出挑",
      "Section relationship / 截面关系",
    ],
  },
  {
    index: "04",
    title: "Members",
    chinese: "构件尺度",
    items: [
      "Primary columns / 主柱",
      "Secondary columns / 次柱",
      "Horizontal members / 横向梁枋",
      "Radial members / 向心构件",
    ],
  },
];

const structuralStages = [
  {
    index: "01",
    title: "Primary columns",
    chinese: "主要支撑柱",
    image: "/images/projects/drum-tower/primary-columns-display.webp",
    body: "从底层平面和柱网关系开始，生成承担主要竖向关系的柱体体系。",
  },
  {
    index: "02",
    title: "Horizontal framework",
    chinese: "横向构架",
    image: "/images/projects/drum-tower/horizontal-frame-display.webp",
    body: "依据每层标高建立环向梁枋，使不同柱体在水平方向形成连续结构关系。",
  },
  {
    index: "03",
    title: "Vertical framework",
    chinese: "竖向构架",
    image: "/images/projects/drum-tower/vertical-frame-display.webp",
    body: "连接不同层级的关键节点，将逐层缩放后的平面关系组织为整体竖向骨架。",
  },
];

export function DrumTowerSystem() {
  return (
    <div className="drum-system">
      {/* RULE EXTRACTION */}
      <div className="dt-subsection">
        <div className="dt-heading">
          <span>01 / RULE EXTRACTION</span>

          <h3>提取平面、层级与构件参数</h3>

          <p>
            鼓楼并不是由孤立尺寸组成，而是由平面、柱网、层级、比例与构件
            之间的相互关系共同决定。参数化转译首先需要把这些隐性关系拆解成
            可以被 Grasshopper 读取和修改的变量。
          </p>
        </div>

        <div className="dt-rule-grid">
          {ruleGroups.map((group) => (
            <article key={group.index}>
              <span>{group.index}</span>

              <div>
                <h4>{group.title}</h4>
                <strong>{group.chinese}</strong>
              </div>

              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      {/* GLOBAL PARAMETERS */}
      <div className="dt-subsection">
        <div className="dt-heading">
          <span>02 / PARAMETRIC CONTROL</span>

          <h3>在 Grasshopper 中设置联动参数</h3>

          <p>
            参数并不是独立滑块。平面边数、层数、高度与收分关系会同时影响
            后续节点、线框和构件几何，因此整个模型被组织成一条具有数据依赖
            关系的生成链。
          </p>
        </div>

        <figure className="dt-image dt-image-wide">
          <div className="dt-image-frame">
            <Image
              unoptimized
              src="/images/projects/drum-tower/parameters-display.webp"
              alt="侗族鼓楼 Grasshopper 参数控制面板"
              fill
              sizes="100vw"
              className="dt-img-contain"
            />
          </div>

          <figcaption>
            <span>GLOBAL PARAMETERS</span>
            <span>Grasshopper parameter controls</span>
          </figcaption>
        </figure>

        <figure className="dt-image dt-image-wide">
          <div className="dt-image-frame dt-image-frame-gh">
            <Image
              unoptimized
              src="/images/projects/drum-tower/grasshopper-system-display.webp"
              alt="侗族鼓楼完整 Grasshopper 参数化系统"
              fill
              sizes="100vw"
              className="dt-img-contain"
            />
          </div>

          <figcaption>
            <span>GRASSHOPPER DEFINITION</span>
            <span>Linked generative logic</span>
          </figcaption>
        </figure>
      </div>

      {/* PIPELINE */}
      <div className="dt-subsection">
        <div className="dt-heading">
          <span>03 / GENERATION PIPELINE</span>

          <h3>从柱网生成梁柱构架</h3>

          <p>
            与逐层手工建模不同，模型从少量全局变量出发，依次生成平面基准、
            柱网、竖向层级、缩放关系和结构线框，最终再把线框转化为实体构件。
          </p>
        </div>

        <TowerSteps />
      </div>

      {/* STRUCTURAL GENERATION */}
      <div className="dt-subsection">
        <div className="dt-heading">
          <span>04 / STRUCTURAL GENERATION</span>

          <h3>分步查看柱体与梁枋</h3>

          <p>
            生成过程被拆分为多个可检查的结构阶段，使模型不仅输出最终外形，
            也能观察鼓楼从柱网、梁枋到完整空间构架逐步形成的过程。
          </p>
        </div>

        <div className="dt-structure-grid">
          {structuralStages.map((stage) => (
            <article key={stage.index}>
              <div className="dt-structure-image">
                <Image
                  unoptimized
                  src={stage.image}
                  alt={stage.chinese}
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className="dt-img-contain"
                />
              </div>

              <div className="dt-structure-caption">
                <span>{stage.index}</span>

                <div>
                  <h4>{stage.title}</h4>
                  <strong>{stage.chinese}</strong>
                  <p>{stage.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* VARIATIONS */}
      <div className="dt-subsection">
        <div className="dt-heading">
          <span>05 / DESIGN VARIATIONS</span>

          <h3>比较四角与八角配置</h3>

          <p>
            平面边数作为全局输入之一，可以改变底层多边形与柱网组织，同时
            保留后续层级、缩放和构件生成逻辑。四角与八角模型因此成为同一
            参数系统下的不同输出，而不是两个独立模型。
          </p>
        </div>

        <div className="dt-variation-grid">
          <figure>
            <div className="dt-variation-image">
              <Image
                unoptimized
                src="/images/projects/drum-tower/square-model-display.webp"
                alt="四角鼓楼参数化模型"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="dt-img-contain"
              />
            </div>

            <figcaption>
              <span>01</span>

              <div>
                <strong>Square configuration</strong>
                <small>四角鼓楼</small>
              </div>
            </figcaption>
          </figure>

          <figure>
            <div className="dt-variation-image">
              <Image
                unoptimized
                src="/images/projects/drum-tower/octagonal-model-display.webp"
                alt="八角鼓楼参数化模型"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="dt-img-contain"
              />
            </div>

            <figcaption>
              <span>02</span>

              <div>
                <strong>Octagonal configuration</strong>
                <small>八角鼓楼</small>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>

      {/* EXPLODED */}
      <div className="dt-subsection">
        <div className="dt-heading">
          <span>06 / STRUCTURAL EXPRESSION</span>

          <h3>用爆炸图检查构架层级</h3>

          <p>
            爆炸表达进一步分离不同层级，使参数系统中的垂直序列、
            重复构架与整体塔式形态能够同时被阅读。
          </p>
        </div>

        <figure className="dt-image dt-image-exploded">
          <div className="dt-image-frame">
            <Image
              unoptimized
              src="/images/projects/drum-tower/exploded-structure-display.webp"
              alt="侗族鼓楼构架爆炸图"
              fill
              sizes="100vw"
              className="dt-img-contain"
            />
          </div>

          <figcaption>
            <span>EXPLODED STRUCTURE</span>
            <span>Layer hierarchy & structural repetition</span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
