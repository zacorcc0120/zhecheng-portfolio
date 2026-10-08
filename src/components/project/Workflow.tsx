"use client";
import { useEffect, useRef } from "react";
import { ArrowDownRight } from "lucide-react";
export function Workflow({ steps }: { steps: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nodes = ref.current?.querySelectorAll(".workflow-node");
    if (!nodes) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.65, rootMargin: "0px 0px -8% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="workflow" ref={ref}>
      {steps.map((step, i) => (
        <div
          className="workflow-node"
          key={step}
          style={{ transitionDelay: `${(i % 4) * 80}ms` }}
        >
          <span>0{i + 1}</span>
          <strong>{step}</strong>
          <ArrowDownRight size={18} />
        </div>
      ))}
    </div>
  );
}
