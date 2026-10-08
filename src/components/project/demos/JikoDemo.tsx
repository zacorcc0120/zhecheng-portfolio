"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Sparkles } from "lucide-react";

const categories = [
  { id: "work", label: "工作", color: "#d9d1c2" },
  { id: "study", label: "学习", color: "#cab9e8" },
  { id: "exercise", label: "运动", color: "#d9ef74" },
  { id: "life", label: "生活", color: "#a8cfcb" },
] as const;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export default function JikoDemo() {
  const [active, setActive] = useState<(typeof categories)[number]>(
    categories[0],
  );
  const [seconds, setSeconds] = useState(203);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [running]);

  const progress = useMemo(
    () => Math.min((seconds / 1500) * 100, 100),
    [seconds],
  );

  return (
    <div className="jiko-demo">
      <div className="jiko-demo-bar">
        <span className="eyebrow">LIVE PRODUCT STUDY</span>
        <span>本地交互演示 · 不保存数据</span>
      </div>
      <div className="jiko-demo-grid">
        <section className="jiko-timer-panel" aria-label="JIKO 计时器交互演示">
          <div className="jiko-demo-greeting">
            <div>
              <span>9月19日 · 周六</span>
              <h3>Hello，上午好</h3>
            </div>
            <span>桂林市 · 26° 晴</span>
          </div>
          <div
            className="jiko-timer-ring"
            style={{
              background: `conic-gradient(${active.color} ${progress}%, #ffffff18 ${progress}% 100%)`,
            }}
          >
            <div className="jiko-timer-core">
              <strong aria-live="polite">{formatTime(seconds)}</strong>
              <span>{active.label}记录</span>
            </div>
          </div>
          <div className="jiko-categories" aria-label="选择记录类型">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={active.id === category.id ? "is-active" : ""}
                onClick={() => setActive(category)}
              >
                <span style={{ background: category.color }} />
                {category.label}
              </button>
            ))}
          </div>
          <div className="jiko-timer-actions">
            <button
              type="button"
              aria-label="重置计时器"
              onClick={() => {
                setRunning(false);
                setSeconds(0);
              }}
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              className="jiko-primary-action"
              onClick={() => setRunning((value) => !value)}
            >
              {running ? <Pause size={19} /> : <Play size={19} />}
              {running ? "暂停记录" : "开始记录"}
            </button>
          </div>
        </section>
        <aside className="jiko-insight-panel">
          <div className="jiko-insight-heading">
            <span className="eyebrow">TODAY / 03 RECORDS</span>
            <strong>今天留下的轨迹</strong>
          </div>
          <ol className="jiko-record-list">
            <li>
              <time>08:30</time>
              <span>阅读与整理资料</span>
              <em>01:25</em>
            </li>
            <li>
              <time>10:12</time>
              <span>产品细节修改</span>
              <em>02:18</em>
            </li>
            <li className="is-current">
              <time>NOW</time>
              <span>{active.label}记录</span>
              <em>{formatTime(seconds)}</em>
            </li>
          </ol>
          <div className="jiko-assistant-card">
            <Sparkles size={18} />
            <div>
              <strong>小迹助手</strong>
              <p>“提醒我今晚八点整理作品集。”</p>
            </div>
            <span>→</span>
          </div>
          <p className="jiko-demo-note">
            真实产品通过 DeepSeek 理解自然语言，并由微信订阅消息发送到期提醒。
          </p>
        </aside>
      </div>
    </div>
  );
}
