import { disciplines, skills } from "@/data/site";

// The dense beat in the page rhythm, and the clearest statement of method.
// The four rule chains and the tool register carry the section on their own:
// a preview carousel used to sit here too, but it repeated the five projects
// that arrive two scrolls later and auto-advanced every 3.4s. The rules are
// the argument, so the rules get the space.
export function MethodIndex() {
  return (
    <section className="method section-shell" id="method">
      <div className="section-kicker">
        <span>02 / METHOD</span>
        <span>HOW THE WORK IS GENERATED</span>
      </div>
      <div className="method-head">
        <h2 className="method-title">
          One pipeline,
          <br />
          <span className="muted">four surfaces.</span>
        </h2>
        <p className="method-note">
          每个项目都从同一套流程出发：把自然语言、数据与场地条件转成可命名、可调整、
          可复用的参数，再交给几何或界面去生成，最后回到验证。不同的只是生成的对象。
        </p>
      </div>

      <div className="method-grid">
        <ol className="method-disc">
          {disciplines.map((item, i) => (
            <li key={item.name}>
              <span className="method-disc-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="method-disc-name">{item.name}</span>
              <span className="method-disc-detail">{item.detail}</span>
              <span className="method-disc-note">{item.description}</span>
            </li>
          ))}
        </ol>
        <dl className="method-tools">
          {skills.map((group) => (
            <div key={group.category}>
              <dt>{group.category}</dt>
              <dd>{group.tools.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
