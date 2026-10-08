"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SelectedQuestion } from "@/data/recovery";

/**
 * CH 04 / 问卷与评分规则 的「关键问题」部分。
 *
 * 这一节是参考数据不是叙事：六个问题结构完全相同，每块都带一段理由和
 * 五到六行锚点表，堆起来就是六屏近似的长文。而这一节真正要传达的判断
 * ——MRI-1 权重 3× 但只是 NORMAL，TRI-22 权重只有 2× 却是 HARD RISK——
 * 只有横向比较才看得出来，堆成六块正好把它藏起来。
 *
 * 所以页面本身是一份索引：六行一屏读完，点任意一行，理由与锚点从右侧
 * 抽屉里展开，页面长度不变。
 */
export function RecoveryQuestionIndex({
  items,
}: {
  items: SelectedQuestion[];
}) {
  const [open, setOpen] = useState<SelectedQuestion | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      lastTrigger.current?.focus();
    };
  }, [open]);

  return (
    <>
      <div className="rq">
        {items.map((item) => (
          <button
            className="rq-row"
            key={item.code}
            type="button"
            aria-haspopup="dialog"
            onClick={(event) => {
              lastTrigger.current = event.currentTarget;
              setOpen(item);
            }}
          >
            <span className="rq-code">{item.code}</span>
            <span className="rq-question">{item.question}</span>
            <span className="rq-weight">{item.weight}</span>
            <span className="rq-flag">{item.flag}</span>
            <ArrowUpRight className="rq-go" size={16} strokeWidth={1.3} />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="rq-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              onClick={() => setOpen(null)}
            />

            <motion.aside
              className="rq-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={`${open.code} ${open.title}`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <div className="rq-drawer-head">
                <span className="rq-drawer-code">{open.code}</span>
                <span className="rq-drawer-stage">{open.stage}</span>

                <button
                  className="rq-drawer-close"
                  ref={closeRef}
                  type="button"
                  aria-label="关闭"
                  onClick={() => setOpen(null)}
                >
                  <X size={14} strokeWidth={1.4} />
                </button>
              </div>

              <div className="rq-drawer-body">
                <p className="rq-drawer-title">{open.title}</p>
                <h4 className="rq-drawer-question">{open.question}</h4>

                <div className="rq-drawer-rule">
                  <span>WEIGHT {open.weight}</span>
                  <span>{open.flag}</span>
                </div>

                <span className="rq-label">WHY THIS QUESTION</span>
                <p className="rq-why">{open.rationale}</p>

                <span className="rq-label">SCORING ANCHORS</span>
                <div className="rq-anchors">
                  {open.anchors.map(([score, text]) => (
                    <div key={score}>
                      <strong>{score}</strong>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
