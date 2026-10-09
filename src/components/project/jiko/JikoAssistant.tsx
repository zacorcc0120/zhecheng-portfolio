"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { ease, motion as m, stagger } from "@/lib/motion-tokens";

/**
 * How the assistant turns a sentence into an item.
 *
 * The point being made is the shape of the interaction, not the intelligence:
 * a natural-language sentence becomes a structured proposal, and nothing is
 * saved until the reader confirms it. That confirmation step is the design
 * decision — the assistant proposes, the person decides.
 *
 * The three parse results below are written by hand to match the structure the
 * real assistant produces. They are not responses from DeepSeek and the page
 * says so, directly above them: a case study that faked a model response would
 * be claiming a capability it cannot show.
 */

type Example = {
  id: string;
  input: string;
  fields: { label: string; value: string; kind: string }[];
  result: string;
};

const EXAMPLES: Example[] = [
  {
    id: "fitness",
    input: "明天下午三点去健身。",
    fields: [
      { label: "EVENT", value: "健身", kind: "activity" },
      { label: "DATE", value: "明天", kind: "date" },
      { label: "TIME", value: "15:00", kind: "time" },
    ],
    result: "日程草稿 · 明天 15:00 健身",
  },
  {
    id: "focus",
    input: "帮我记一下，今晚八点前把作品集终审发出去。",
    fields: [
      { label: "EVENT", value: "作品集终审", kind: "activity" },
      { label: "DATE", value: "今天", kind: "date" },
      { label: "TIME", value: "20:00", kind: "deadline" },
    ],
    result: "待办草稿 · 今天 20:00 前发出",
  },
  {
    id: "record",
    input: "刚才那半小时算作产品原型修改。",
    fields: [
      { label: "EVENT", value: "产品原型修改", kind: "activity" },
      { label: "SPAN", value: "最近 00:30", kind: "duration" },
    ],
    result: "补记草稿 · 产品原型修改 00:30",
  },
];

export function JikoAssistant() {
  const [picked, setPicked] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const calm = useReducedMotion();

  const example = EXAMPLES.find((item) => item.id === picked) ?? null;
  const isConfirmed = confirmed === picked;

  const choose = (id: string) => {
    setPicked(id);
    // Changing the sentence invalidates a previous confirmation — the reader
    // must confirm the proposal they are actually looking at.
    setConfirmed((current) => (current === id ? current : null));
  };

  const enter = (duration: number, delay = 0) => ({
    initial: calm ? { opacity: 0 } : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: calm ? 0 : duration,
      delay: calm ? 0 : delay,
      ease: ease.out,
    },
  });

  return (
    <div className="jiko-assistant">
      <div className="jiko-assistant-input">
        <div className="jiko-assistant-input-head">
          <Sparkles size={16} />
          <span className="meta-key">小迹助手 / NATURAL LANGUAGE</span>
        </div>

        <ul className="jiko-assistant-examples">
          {EXAMPLES.map((item, i) => (
            <li key={item.id}>
              <motion.button
                type="button"
                className={picked === item.id ? "is-active" : ""}
                onClick={() => choose(item.id)}
                {...enter(m.ui, i * stagger.ui)}
              >
                “{item.input}”
              </motion.button>
            </li>
          ))}
        </ul>
      </div>

      <div className="jiko-assistant-output" aria-live="polite">
        {example ? (
          <>
            <ol className="jiko-assistant-fields">
              {example.fields.map((field, i) => (
                <motion.li key={field.label} {...enter(m.ui, 0.06 + i * stagger.micro)}>
                  <span className="jiko-assistant-field-label meta-key">
                    {field.label}
                  </span>
                  <span className="jiko-assistant-field-value">{field.value}</span>
                  <span className="jiko-assistant-field-kind">{field.kind}</span>
                </motion.li>
              ))}
            </ol>

            <motion.div
              className={`jiko-assistant-preview${isConfirmed ? " is-confirmed" : ""}`}
              {...enter(m.content, 0.16)}
            >
              <span className="meta-key">
                {isConfirmed ? "已加入提醒" : "结构化预览 · 待确认"}
              </span>
              <strong>{example.result}</strong>
              <button
                type="button"
                className="jiko-assistant-confirm"
                onClick={() => setConfirmed(example.id)}
                disabled={isConfirmed}
              >
                <Check size={15} />
                {isConfirmed ? "已确认" : "确认并加入"}
              </button>
            </motion.div>
          </>
        ) : (
          <p className="jiko-assistant-empty">
            选择左侧任意一句，查看它被解析成哪些字段，以及在确认之前会停在什么状态。
          </p>
        )}
      </div>

      <p className="jiko-assistant-note">
        以上为交互原理示意：字段与解析结果依据真实助手的输出结构手工编写，
        <strong>不是 DeepSeek 的实时响应</strong>，也不会创建任何真实提醒。
        小程序中的助手接入 DeepSeek 理解活动与时间信息，解析完成后仍需用户确认，
        再由微信订阅消息发送到期通知。
      </p>
    </div>
  );
}