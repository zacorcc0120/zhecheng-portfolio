"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";
import { ease, heroBeats, motion as m } from "@/lib/motion-tokens";

/**
 * JIKO hero.
 *
 * The old first screen put JIKO and a paragraph on the left and left the whole
 * right column empty, pushing the actual product renders a full screen down.
 * Title and product were never seen together. Here the two delivered renders
 * are the hero's right column, layered asymmetrically, so the first thing a
 * reader sees is the product the case study is about.
 *
 * The entrance is a five-beat sequence that runs once on load and is never
 * replayed on scroll or on navigation back:
 *   1  JIKO rises through a mask
 *   2  迹刻 arrives under it
 *   3  the two phones settle out of a small offset
 *   4  the description and metadata arrive
 *   5  the scroll indicator appears last
 *
 * Beats are sequenced by delay rather than overlapped: five things moving at
 * once is noise, five things moving in order is a sentence.
 */
export function JikoHero({
  index,
  total,
  meta,
}: {
  index: string;
  total: number;
  meta: { label: string; value: string }[];
}) {
  const calm = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);

  // Pointer parallax. Two depth planes, both well under the 2-6px the brief
  // asks for, and the back plane moves against the front one so the pair has
  // depth instead of sliding as a single sticker. Both springs return to
  // centre when the pointer leaves, which is why this is a spring and not a
  // linear follow.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const spring = { stiffness: 90, damping: 20, mass: 0.6 };
  const backX = useSpring(pointerX, spring);
  const backY = useSpring(pointerY, spring);
  const frontX = useSpring(pointerX, { stiffness: 110, damping: 22, mass: 0.5 });
  const frontY = useSpring(pointerY, { stiffness: 110, damping: 22, mass: 0.5 });

  useEffect(() => {
    if (calm) return;
    // Coarse pointers have no hover, so the parallax would only ever be a
    // thing that costs frames and battery on a phone.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const host = stage.current;
    if (!host) return;
    const onMove = (event: PointerEvent) => {
      const box = host.getBoundingClientRect();
      pointerX.set(((event.clientX - box.left) / box.width - 0.5) * 2);
      pointerY.set(((event.clientY - box.top) / box.height - 0.5) * 2);
    };
    const onLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [calm, pointerX, pointerY]);

  const settle = (delay: number, distance: number) => ({
    initial: calm
      ? { opacity: 0 }
      : { opacity: 0, y: distance, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: {
      duration: calm ? 0 : m.hero,
      delay: calm ? 0 : delay,
      ease: ease.out,
    },
  });

  return (
    <section className="jiko-hero section-shell">
      <div className="case-breadcrumb">
        <Link href="/work">
          <ArrowLeft size={15} /> ALL WORK
        </Link>
        <span>
          PROJECT {index} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="jiko-hero-grid">
        <div className="jiko-hero-copy">
          {/* Beat 1 and 2. Two masks, one headline: the English mark lands first
              and the Chinese name arrives underneath it rather than beside it,
              because 迹刻 is the product's identity and JIKO is its handle. */}
          <h1 className="jiko-hero-display">
            <span className="jiko-hero-line">
              <motion.span
                className="jiko-hero-line-inner"
                {...settle(heroBeats.display, 108)}
              >
                JIKO
              </motion.span>
            </span>
            <span className="jiko-hero-line jiko-hero-line-cn">
              <motion.span
                className="jiko-hero-line-inner"
                {...settle(heroBeats.chinese, 64)}
              >
                迹刻
              </motion.span>
            </span>
          </h1>

          <motion.p
            className="jiko-hero-claim"
            {...settle(heroBeats.chinese + 0.24, 16)}
          >
            Record the moment.
            <br />
            Revisit the everyday.
          </motion.p>

          <motion.p
            className="jiko-hero-desc"
            {...settle(heroBeats.chinese + 0.34, 12)}
          >
            一款围绕时间记录、日常回顾与事项提醒设计的微信小程序。
            计时留下轨迹，回顾读懂轨迹，提醒把轨迹接向下一段时间。
          </motion.p>
        </div>

        {/* Beat 3. The two delivered renders arrive already composed rather than
            flying in from off-screen: they start a few pixels out of place and
            at 96% scale, which reads as them settling into the layout. */}
        <motion.div
          className="jiko-hero-stage"
          ref={stage}
          initial={calm ? { opacity: 0 } : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: calm ? 0 : m.hero,
            delay: calm ? 0 : heroBeats.phones,
            ease: ease.out,
          }}
        >
          <div className="jiko-hero-devices">
            <motion.figure
              className="jiko-hero-device is-back"
              style={
                calm ? undefined : { x: backX, y: backY, rotate: -2.4 }
              }
            >
              <div className="jiko-hero-device-frame">
                <Image
                  src="/images/projects/jiko/weekly-review.webp"
                  alt="JIKO 每周回顾界面：日历条、本周时间分布圆环与活动时长列表"
                  fill
                  priority
                  sizes="(max-width: 900px) 62vw, 26vw"
                />
              </div>
            </motion.figure>

            <motion.figure
              className="jiko-hero-device is-front"
              style={
                calm ? undefined : { x: frontX, y: frontY, rotate: 1.8 }
              }
            >
              <div className="jiko-hero-device-frame">
                <Image
                  src="/images/projects/jiko/ai-assistant.webp"
                  alt="JIKO 计时首页与小迹助手：圆环计时器、当天记录与自然语言输入"
                  fill
                  priority
                  sizes="(max-width: 900px) 78vw, 30vw"
                />
              </div>
            </motion.figure>
          </div>
          {/* One caption for the pair, not one under each. These are two views
              of the same product, and two labels floating under two separate
              pictures read as two separate things. */}
          <motion.p
            className="jiko-hero-stage-note meta-key"
            {...settle(heroBeats.meta + 0.16, 8)}
          >
            小程序真实界面 · 每周回顾 / 计时与助手
          </motion.p>
        </motion.div>
      </div>

      {/* Beat 4. Metadata reads as system fields on the same key/value register
          as the rest of the portfolio, not as a caption. */}
      <motion.dl
        className="case-meta jiko-hero-meta"
        {...settle(heroBeats.meta, 14)}
      >
        {meta.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </motion.dl>

      {/* Beat 5, last and quietest: a single hairline that drifts downward. */}
      <motion.div
        className="jiko-hero-scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: calm ? 0 : m.content,
          delay: calm ? 0 : heroBeats.indicator,
          ease: ease.out,
        }}
        aria-hidden="true"
      >
        <span className="jiko-hero-scroll-label meta-key">SCROLL</span>
        <span className="jiko-hero-scroll-track">
          <motion.span
            className="jiko-hero-scroll-bead"
            animate={calm ? undefined : { y: [0, 22, 0] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: ease.inOut,
              delay: 1.9,
            }}
          />
        </span>
      </motion.div>
    </section>
  );
}