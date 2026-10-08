"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * 四层构造 — the signature move of this case study.
 *
 * The model is not one solid building; it is four separately addressable
 * layers, each with its own part count and its own offset above the plinth.
 * This figure lets a reader take them apart one layer at a time, because
 * "可拆开检查" is otherwise just a claim on a page.
 *
 * The four cut-outs share one camera and one frame, so they are already
 * registered to each other — the exploded view is their native alignment and
 * nothing has to be faked to separate them. Only opacity and a small vertical
 * lift are animated, so the whole stack stays on the compositor.
 *
 * Numbers are read from the exported figure, not estimated:
 *   01 Plinth & courtyard    79 source parts / +0 m
 *   02 Walls & openings     292 source parts / +8.5 m
 *   03 Timber assembly      265 source parts / +17 m
 *   04 Roof surfaces         24 source parts / +25.5 m
 */

type Layer = {
  id: string;
  name: string;
  chinese: string;
  parts: number;
  offset: string;
  file: string;
  alt: string;
};

const LAYERS: Layer[] = [
  {
    id: "plinth",
    name: "Plinth & courtyard",
    chinese: "台基与院落",
    parts: 79,
    offset: "+0 m",
    file: "layer-01-plinth.webp",
    alt: "台基与院落层：场地基面、院墙与院落地坪",
  },
  {
    id: "walls",
    name: "Walls & openings",
    chinese: "墙体与洞口",
    parts: 292,
    offset: "+8.5 m",
    file: "layer-02-walls.webp",
    alt: "墙体与洞口层：砖墙分隔、门窗洞口与室内空间",
  },
  {
    id: "timber",
    name: "Timber assembly",
    chinese: "木构架",
    parts: 265,
    offset: "+17 m",
    file: "layer-03-timber.webp",
    alt: "木构架层：柱网、梁枋、檩条与屋架",
  },
  {
    id: "roof",
    name: "Roof surfaces",
    chinese: "屋面",
    parts: 24,
    offset: "+25.5 m",
    file: "layer-04-roof.webp",
    alt: "屋面层：悬山顶面与屋脊",
  },
];

const TOTAL_PARTS = LAYERS.reduce((sum, layer) => sum + layer.parts, 0);

export function ArchitectureAnatomy() {
  const host = useRef<HTMLDivElement>(null);
  const steps = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // The section is tall on purpose: each layer gets one screen of attention,
  // which is what makes "take it apart" a real action rather than a tap.
  useEffect(() => {
    const rail = steps.current;
    const nodes = rail?.querySelectorAll<HTMLElement>("[data-layer]");
    if (!rail || !nodes?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.layer);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="anatomy" ref={host}>
      <div className="anatomy-stage">
        <div className="anatomy-stack" aria-hidden="true">
          {LAYERS.map((layer, i) => {
            const dim = active !== i;
            return (
              <div
                key={layer.id}
                className={`anatomy-layer${dim ? " is-dim" : ""}`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <Image
                  src={`/images/projects/vernacular/${layer.file}`}
                  alt={layer.alt}
                  fill
                  quality={90}
                  sizes="(max-width: 900px) 74vw, 460px"
                  priority={i === 0}
                />
              </div>
            );
          })}
        </div>
        <p className="anatomy-caption meta-key">
          MODEL <span>dv2_c233bda44634eeebf2b6</span>
          <br />
          {TOTAL_PARTS} SOURCE COMPONENTS / ONE CAMERA, FOUR LAYERS
        </p>
      </div>

      <div className="anatomy-steps" ref={steps}>
        {LAYERS.map((layer, i) => (
          <div
            key={layer.id}
            data-layer={i}
            className={`anatomy-step${active === i ? " is-active" : ""}`}
          >
            <span className="anatomy-step-num">{`0${i + 1}`}</span>
            <div className="anatomy-step-body">
              <strong>{layer.name}</strong>
              <span>{layer.chinese}</span>
              <p>
                {layer.parts} source parts · {layer.offset}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}