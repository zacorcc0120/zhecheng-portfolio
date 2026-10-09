"use client";

import { useCallback, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { disciplines, skills } from "@/data/site";
import {
  DOMAIN_KEYS,
  readDomains,
  sculptBreathe,
  type SculptParams,
} from "@/lib/sculpture";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { SculptureStage } from "./SculptureStage";
import { PRACTICE_TUNING } from "./SculptureScene";

/**
 * 01 / PRACTICE + 02 / METHOD, as one scene (brief §04).
 *
 * These were two sections that happened to be adjacent: a wall of type, then a
 * list of type, with a small instrument panel trying to stand in for the link
 * between them. They are now one composition — statement across the top, the
 * running form and the argument together in the middle, the four disciplines
 * underneath driving that form.
 *
 * The four disciplines are a GENERATIVE MODE SELECTOR (§06.3). They are not
 * labels beside a picture; each one is a reading of the same parameter vector,
 * and moving between readings is an interpolation, so every intermediate state
 * is another member of the same family rather than a cross-fade between two
 * different objects. Choosing one holds the rotation (§06.4) and says so.
 */

const DOMAIN_LABEL = ["01", "02", "03", "04"];
const DRIFT_PERIOD = 34000; // seconds for a full pass through the four domains
const REVEAL_FRAMES = 165; // ≈2.7s of the form lifting out of its grid

export function PracticeScene() {
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, { margin: "260px 0px 260px 0px" });

  const pick = useRef(-1);
  const hold = useRef(-1);
  const [focus, setFocus] = useState(-1);
  const [held, setHeld] = useState(-1);

  const mix = useRef(0.55);
  const frames = useRef(0);
  const revealRef = useRef(0);
  // Derived, not latched into state: an effect that calls setState here would
  // cascade a render for something the frame loop already knows.
  const armed = inView;

  /**
   * Runs once per animated frame, straight off the shared clock.
   *
   * Everything that decides what the form looks like happens here rather than
   * in React state, so a domain change is a couple of float assignments and not
   * a render pass.
   */
  const driver = useCallback((time: number): SculptParams => {
    const held = hold.current;
    const hovered = pick.current;
    const target = held >= 0 ? held : hovered >= 0 ? hovered : (time / DRIFT_PERIOD) * DOMAIN_KEYS.length;
    mix.current += (target - mix.current) * 0.032;

    // Geometry reveals form alongside the type: the surface starts as a ruled
    // grid barely lifted and reaches its full volume over a couple of seconds.
    // Under reduced motion the reveal is simply complete — the frozen state has
    // to be the finished object, not a half-built one.
    if (frames.current < REVEAL_FRAMES) frames.current += 1;
    const k = Math.min(1, frames.current / REVEAL_FRAMES);
    const lift = armed ? 0.24 + 0.76 * (1 - Math.pow(1 - k, 3)) : 1;
    revealRef.current = lift;

    const r = readDomains(mix.current);
    const b = sculptBreathe(time, 19);
    return {
      rise: r.rise * b.rise * lift,
      span: r.span * b.span,
      twist: r.twist * b.twist,
      ribDepth: r.ribDepth * b.ribDepth,
      density: r.density * b.density,
      fold: r.fold * b.fold,
      close: r.close * b.close,
      lattice: r.lattice,
      surface: 1,
    };
  }, [armed]);

  const enter = (i: number) => {
    pick.current = i;
    setFocus(i);
  };
  const leave = () => {
    pick.current = -1;
    setFocus(-1);
  };
  const choose = (i: number) => {
    const next = hold.current === i ? -1 : i;
    hold.current = next;
    setHeld(next);
    if (next >= 0) pick.current = i;
    setFocus(next >= 0 ? next : pick.current);
  };

  return (
    <section className="practice section-shell" id="introduction" ref={section}>
      <div className="section-kicker">
        <span>01 / PRACTICE</span>
        <span>02 / METHOD</span>
      </div>

      <MaskReveal
        as="h2"
        className="practice-statement"
        lineClassName="practice-line"
        lines={["数字产品、参数化建筑", "与计算结构。"]}
        stagger={0.08}
      />

      <div className="practice-stage">
        <div className="practice-copy">
          <p className="practice-lead">我把设计看成一套可以运行的系统，而不是一组界面。</p>
          <p className="practice-body">
            从桂北传统民居的生成式参数化工作流，到微信小程序里的时间记录与日常回顾，
            再到晶格结构与鼓楼形制的规则提取——对象不同，但都在做同一件事：
            把模糊的需求变成可命名、可调整的参数，交给系统去生成，再回到人的判断。
          </p>
          <p className="practice-note">
            下面四个领域不是四个项目类别，而是同一套生成系统的四组读数。
            指向其中一个，右侧的形态会连续地变过去。
          </p>
        </div>

        <div className="practice-visual">
          <SculptureStage
            className="sculpture-practice"
            tuning={PRACTICE_TUNING}
            driver={driver}
            label="参数化雕塑：一个扭转的肋骨壳体在连续变化，当前读数对应高亮的那个设计领域。这是设计方法的图示，不是求解结果。"
          />
          <span className="practice-annot meta-key" aria-hidden="true">
            GENERATIVE STUDY · ONE SURFACE, FOUR READINGS
          </span>
        </div>
      </div>

      <div className="practice-domains">
        <div className="practice-domains-head">
          <p className="practice-domains-title">One pipeline, four surfaces.</p>
          <button
            type="button"
            className="practice-hold"
            data-on={held >= 0 ? "true" : "false"}
            onClick={() => {
              hold.current = -1;
              setHeld(-1);
              setFocus(pick.current);
            }}
            aria-pressed={held >= 0}
            hidden={held < 0}
          >
            RESUME AUTO
          </button>
        </div>

        <ol className="practice-list">
          {disciplines.map((item, i) => (
            <li key={item.name}>
              <button
                type="button"
                className="practice-item"
                data-focus={focus === i ? "true" : "false"}
                data-held={held === i ? "true" : "false"}
                data-key={DOMAIN_KEYS[i]}
                onPointerEnter={() => enter(i)}
                onPointerLeave={leave}
                onFocus={() => enter(i)}
                onBlur={leave}
                onClick={() => choose(i)}
                aria-pressed={held === i}
              >
                <span className="practice-item-index">{DOMAIN_LABEL[i]}</span>
                <span className="practice-item-name">{item.name}</span>
                <span className="practice-item-detail">{item.detail}</span>
                <span className="practice-item-note">{item.description}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <dl className="practice-tools">
        {skills.map((group) => (
          <div key={group.category}>
            <dt>{group.category}</dt>
            <dd>{group.tools.join(" · ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
