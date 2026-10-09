"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ease, motion as m } from "@/lib/motion-tokens";

/**
 * The four delivered screens, shown as what they are: four phones of the same
 * product, read left to right.
 *
 * An earlier pass tried to give each screen its own composition — one full-width
 * feature, one asymmetric pair, one magnified crop. At this size those three
 * extra arrangements cropped the 848×1855 renders mid-device, so the reader saw
 * fragments of dark backdrop instead of screens. One row of intact renders is
 * more legible than three clever crops, and it is the same four delivered files
 * either way — nothing here is redrawn, resampled or generated.
 *
 * The strip is not a footnote, though: these are the only real interface in the
 * chapter, so they carry the full measure and open into a lightbox on click.
 */

type Screen = {
  src: string;
  alt: string;
  label: string;
  meta: string;
};

const SCREENS: Screen[] = [
  {
    src: "/images/projects/jiko/weekly-review.webp",
    alt: "JIKO 每周回顾界面：顶部日历条、本周时间分布圆环与活动时长列表",
    label: "每周回顾",
    meta: "周视图 / 时间分布 / 活动占比",
  },
  {
    src: "/images/projects/jiko/ai-assistant.webp",
    alt: "JIKO 计时首页与小迹助手：圆环计时器、当天记录与自然语言输入框",
    label: "计时与小迹助手",
    meta: "计时器 / 当天记录 / 自然语言入口",
  },
  {
    src: "/images/projects/jiko/theme-system.webp",
    alt: "JIKO 外观设置：精选主题色、壁纸存在感与柔化、交互触感与界面动效开关",
    label: "主题设置",
    meta: "主题色 / 壁纸强度 / 触感与动效",
  },
  {
    src: "/images/projects/jiko/appearance-system.webp",
    alt: "JIKO 外观设置：显示模式、全局壁纸与六种计时圆环样式选择",
    label: "圆环与显示模式",
    meta: "深浅色 / 壁纸 / 圆环样式",
  },
];

export function JikoGallery() {
  const [open, setOpen] = useState<number | null>(null);
  const calm = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const show = useCallback((index: number) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setOpen(index);
  }, []);

  const close = useCallback(() => setOpen(null), []);

  const step = useCallback(
    (delta: number) =>
      setOpen((current) =>
        current === null
          ? current
          : (current + delta + SCREENS.length) % SCREENS.length,
      ),
    [],
  );

  // Keyboard: escape closes, arrows move. The listener lives only while the
  // lightbox is open, so the page keeps its own arrow-key scrolling.
  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    // Move focus into the dialog so the next Tab lands on the close button.
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      // Focus goes back where it came from, so keyboard users are not dropped
      // at the top of the document.
      openerRef.current?.focus?.();
    };
  }, [open, close, step]);

  return (
    <div className="jiko-gallery">
      <div className="jiko-plate-strip">
        {SCREENS.map((screen, i) => (
          <button
            key={screen.src}
            type="button"
            className="jiko-plate-thumb"
            onClick={() => show(i)}
            aria-label={`放大查看：${screen.label}`}
          >
            <span className="jiko-plate-thumb-frame">
              <Image
                src={screen.src}
                alt=""
                fill
                sizes="(max-width: 900px) 42vw, 22vw"
              />
            </span>
            <span className="jiko-plate-thumb-label meta-key">{screen.label}</span>
            <span className="jiko-plate-meta">{screen.meta}</span>
          </button>
        ))}
      </div>

      <Lightbox
        index={open}
        onClose={close}
        onStep={step}
        closeRef={closeRef}
        calm={Boolean(calm)}
      />
    </div>
  );
}

function Lightbox({
  index,
  onClose,
  onStep,
  closeRef,
  calm,
}: {
  index: number | null;
  onClose: () => void;
  onStep: (delta: number) => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  calm: boolean;
}) {
  const screen = index === null ? null : SCREENS[index];
  return (
    <AnimatePresence>
      {screen && (
        <motion.div
          className="jiko-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${screen.label} 界面大图`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: calm ? 0 : m.ui, ease: ease.out }}
          onClick={onClose}
        >
          <div
            className="jiko-lightbox-inner"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="jiko-lightbox-close"
              onClick={onClose}
              ref={closeRef}
              aria-label="关闭大图"
            >
              <X size={20} />
            </button>
            <button
              type="button"
              className="jiko-lightbox-nav is-prev"
              onClick={() => onStep(-1)}
              aria-label="上一张"
            >
              <ChevronLeft size={22} />
            </button>
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={screen.src}
                className="jiko-lightbox-figure"
                initial={calm ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: calm ? 0 : m.ui,
                  ease: ease.out,
                }}
              >
                <div className="jiko-lightbox-image">
                  <Image
                    src={screen.src}
                    alt={screen.alt}
                    fill
                    sizes="(max-width: 900px) 86vw, 420px"
                    priority
                  />
                </div>
                <figcaption>
                  <span>{screen.label}</span>
                  <span className="jiko-plate-meta">{screen.meta}</span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
            <button
              type="button"
              className="jiko-lightbox-nav is-next"
              onClick={() => onStep(1)}
              aria-label="下一张"
            >
              <ChevronRight size={22} />
            </button>
            <span className="jiko-lightbox-count meta-key">
              {String((index ?? 0) + 1).padStart(2, "0")} /{" "}
              {String(SCREENS.length).padStart(2, "0")}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}