import Image from "next/image";
import {
  latticeImage,
  modelingImages,
  seatResults,
} from "@/data/lattice-study";
export function StudyImage({
  name,
  caption,
  wide = false,
}: {
  name: string;
  caption: string;
  wide?: boolean;
}) {
  return (
    <figure className={`lattice-evidence ${wide ? "lattice-wide" : ""}`}>
      <a
        href={latticeImage(name)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${caption}，新标签页查看原图`}
      >
        <div className="lattice-image">
          <Image
            src={latticeImage(name)}
            alt={caption}
            fill
            sizes="(max-width: 900px) 100vw, 60vw"
          />
        </div>
      </a>
      <figcaption>
        {caption}
        <span>VIEW IMAGE ↗</span>
      </figcaption>
    </figure>
  );
}
export function LatticeModelStudy() {
  return (
    <div className="lattice-study">
      <p>
        以拓扑、尺度与杆径构建可调整的几何系统。规则蜂巢提供连续的支撑路径，非规则杆网则为局部形态变化提供空间。
      </p>
      <div className="lattice-pair">
        {modelingImages.map((item) => (
          <StudyImage
            key={item.image}
            name={item.image}
            caption={`${item.title} / ${item.caption}`}
          />
        ))}
      </div>
      <h3>试件尺寸、填充率与杆径估算</h3>
      <dl className="lattice-facts">
        <div>
          <dt>试件尺寸</dt>
          <dd>100 × 100 × 40 mm</dd>
        </div>
        <div>
          <dt>目标填充率</dt>
          <dd>≈ 20%</dd>
        </div>
        <div>
          <dt>Voronoi 骨架总长</dt>
          <dd>8,552.62 mm</dd>
        </div>
      </dl>
      <div className="lattice-equation">
        <span className="eyebrow">STRUT RADIUS / APPROXIMATION</span>
        <p>ρ ≈ πr²L / V</p>
        <small>
          用目标填充率关联骨架总长与杆件半径，让不同拓扑在相近材料占比下进行比较。
        </small>
      </div>
      <StudyImage
        name="lattice-workflow"
        caption="Grasshopper / Voronoi 晶格建模流程"
        wide
      />
      <div className="lattice-pair">
        <StudyImage name="printing" caption="数字制造 / 晶格样件打印过程" />
        <StudyImage name="specimens" caption="实体观察 / 不同结构打印样件" />
      </div>
    </div>
  );
}
export function LatticeApplicationStudy() {
  return (
    <div className="lattice-study">
      <p>
        第二阶段转向 350 × 330 × 280 mm 的 PP
        腰托坐垫，研究对象从晶格试件变为曲面开孔结构。
        延续的是“读取受力，再调整几何”的设计方法；前面的 TPU
        试件数据不直接用于预测坐垫性能。
        先读取坐垫原始模型的应力分布，再在中部低应力区域布置渐变开孔，保留坐面与靠背连接处及两侧边缘的连续性。
      </p>
      <div className="lattice-pair">
        <StudyImage name="seat-front" caption="Rhino / 原始坐垫正视模型" />
        <StudyImage name="seat-side" caption="Rhino / 坐垫侧视与腰托轮廓" />
      </div>
      <h3>依据应力分布确定开孔位置</h3>
      <ol className="lattice-method">
        {[
          ["Locate", "识别连接处与边缘的应力集中区域。"],
          [
            "Map",
            "计算 Voronoi 单元中心至控制曲线的距离，将距离映射为缩放系数。",
          ],
          [
            "Generate",
            "把缩放后的多边形映射到目标曲面，形成由中部向边缘渐变的开孔。",
          ],
          ["Compare", "保持材料与边界条件一致，对比原型及 A、B 两种开孔方案。"],
        ].map(([title, body], i) => (
          <li key={title}>
            <strong>
              0{i + 1} / {title}
            </strong>
            <span>{body}</span>
          </li>
        ))}
      </ol>
      <StudyImage
        name="gradient-workflow"
        caption="Grasshopper / 控制曲线驱动的 Voronoi 渐变镂空"
        wide
      />
      <details className="lattice-details">
        <summary>PROCESS ARCHIVE / 拓扑探索与载荷设置</summary>
        <StudyImage
          name="ameba-workflow"
          caption="Ameba / 拓扑优化流程探索"
          wide
        />
        <StudyImage name="load-setup" caption="载荷区域与参数工作流" wide />
      </details>
      <div className="lattice-design-takeaway">
        <span className="eyebrow">DESIGN DECISION / 02</span>
        <h3>保留连接处，在中部区域渐变开孔</h3>
        <p>
          高应力的连接处保持连续，中部区域通过渐变开孔释放空间。结构分析由此成为生成规则的输入。
        </p>
      </div>
      <h3>同一 PP 材料下的三种方案</h3>
      <p>
        固定材料与边界条件，对比原始模型与两种开孔方案。A、B
        方案在本次静力分析中均呈现更低的最大等效应力与总变形，支持在低应力区域继续探索减材设计。
      </p>
      <div className="lattice-trio">
        {seatResults.map((item) => (
          <StudyImage
            key={item.id}
            name={item.image}
            caption={`${item.label} / PP 等效应力`}
          />
        ))}
      </div>
      <div className="table-scroll">
        <table className="lattice-table">
          <caption>PP / STATIC STRUCTURAL / 方案对比</caption>
          <thead>
            <tr>
              <th scope="col">方案</th>
              <th scope="col">最大等效应力 / MPa</th>
              <th scope="col">最大总变形 / mm</th>
            </tr>
          </thead>
          <tbody>
            {seatResults.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                <td>{row.stress.toFixed(2)}</td>
                <td>{row.deformation.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="lattice-details">
        <summary>ANALYSIS CONDITIONS / 材料与边界条件</summary>
        <p>
          PP：弹性模量 1.5 GPa，泊松比 0.4。坐面压力 0.0075 MPa，靠背沿 −Y
          方向压力 0.017
          MPa，坐面底部固定。结果对应当前静力学模型；疲劳、透气与舒适性需通过后续实体测试评估。
        </p>
      </details>
    </div>
  );
}
