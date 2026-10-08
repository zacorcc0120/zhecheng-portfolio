"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, LoaderCircle } from "lucide-react";
import {
  architectureProvider,
  defaultArchitecture,
  type ArchitectureParameters,
  type ArchitectureResult,
  type GenerationPhase,
} from "@/lib/architecture";
import { ModelViewer } from "@/components/three/ModelViewer";
import { RangeControl } from "@/components/ui/RangeControl";

export default function ArchitectureDemo() {
  const [prompt, setPrompt] = useState(
    "生成一个两进院落、三开间、带天井和照壁的桂北传统民居。",
  );
  const [phase, setPhase] = useState<GenerationPhase | null>(null);
  const [result, setResult] = useState<ArchitectureResult | null>(null);
  const [parameters, setParameters] =
    useState<ArchitectureParameters>(defaultArchitecture);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const controller = useRef<AbortController | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );
  const busy = phase !== null && phase !== "complete";
  async function generate() {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setError("");
    setResult(null);
    try {
      const response = await architectureProvider.generate(prompt, {
        signal: next.signal,
        onPhase: setPhase,
      });
      if (next.signal.aborted) return;
      setResult(response);
      setParameters(response.parameters);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "生成未完成，请重试。");
      setPhase(null);
    }
  }
  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(parameters, null, 2));
      setCopied("COPIED");
    } catch {
      setCopied("请手动选择并复制 JSON");
    }
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(""), 2200);
  }
  const steps = [
    { id: "parsing", label: "Parsing requirements" },
    { id: "parameters", label: "Building JSON" },
    { id: "verifying", label: "Checking demo rules" },
    { id: "complete", label: "Model ready" },
  ];
  const active = steps.findIndex((s) => s.id === phase);
  const update = (key: keyof ArchitectureParameters, value: number) =>
    setParameters((previous) => ({ ...previous, [key]: value }));
  return (
    <>
      <div className="demo-panel">
        <div className="demo-bar">
          <span className="eyebrow">NATURAL LANGUAGE → PARAMETERS</span>
          <span className="mock-badge">LOCAL MOCK / NO AI API</span>
        </div>
        <form
          className="demo-input"
          onSubmit={(event) => {
            event.preventDefault();
            void generate();
          }}
        >
          <label htmlFor="architecture-prompt">
            DESCRIBE YOUR DWELLING / 描述建筑
          </label>
          <textarea
            id="architecture-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={busy}
            maxLength={600}
            aria-describedby="prompt-help"
          />
          <div className="demo-input-footer">
            <p id="prompt-help">
              支持中文或英文的开间数、进数、屋顶高度，以及是否带天井和照壁。未识别参数使用演示默认值。
            </p>
            <button
              className="button button-dark"
              type="submit"
              disabled={busy || !prompt.trim()}
            >
              {busy ? (
                <>
                  <LoaderCircle size={16} />
                  GENERATING
                </>
              ) : (
                <>
                  GENERATE <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="input-error" role="alert">
              {error}
            </p>
          )}
        </form>
        <div
          className="generation-status"
          aria-live="polite"
          aria-atomic="true"
        >
          {phase ? (
            <div className="generation-steps">
              {steps.map((step, i) => (
                <span
                  key={step.id}
                  className={
                    i < active ? "done" : i === active ? "current" : ""
                  }
                >
                  {i < active ? <Check size={13} /> : <span>0{i + 1}</span>}
                  {step.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="caption">READY FOR YOUR INPUT / 等待输入</p>
          )}
        </div>
        {result && (
          <>
            <div className="generation-results">
              <dl className="parsed-parameters">
                <div>
                  <dt>Spatial type</dt>
                  <dd>{parameters.courtyard ? "Courtyard" : "Linear"}</dd>
                </div>
                <div>
                  <dt>Bay</dt>
                  <dd>{parameters.bay}</dd>
                </div>
                <div>
                  <dt>Depth</dt>
                  <dd>{parameters.depth}</dd>
                </div>
                <div>
                  <dt>Patio</dt>
                  <dd>{parameters.courtyard ? "Enabled" : "Disabled"}</dd>
                </div>
                <div>
                  <dt>Screen wall</dt>
                  <dd>{parameters.screenWall ? "Enabled" : "Disabled"}</dd>
                </div>
                <div>
                  <dt>Roof height</dt>
                  <dd>{parameters.roofHeight} m</dd>
                </div>
              </dl>
              <div className="json-output">
                <span className="eyebrow">
                  MODEL PARAMETERS
                  <button
                    type="button"
                    onClick={() => void copyJson()}
                    aria-label="Copy JSON parameters"
                  >
                    <Copy size={15} />
                  </button>
                </span>
                <pre>
                  <code>{JSON.stringify(parameters, null, 2)}</code>
                </pre>
                <span className="caption" role="status">
                  {copied}
                </span>
              </div>
            </div>
            <div className="result-notice">
              <Check size={16} />
              KNOWLEDGE VERIFIED — DEMO RULES ONLY
            </div>
          </>
        )}
      </div>
      {result && <p className="demo-note">{result.notes.join(" ")}</p>}
      <div className="parameter-interface">
        <div className="architecture-result-label">
          <span className="eyebrow">
            {result
              ? "GENERATED MASSING / 生成体块"
              : "PARAMETER INTERFACE / 参数预览"}
          </span>
          <span className="caption">SCHEMATIC ONLY</span>
        </div>
        <ModelViewer scene={{ kind: "architecture", parameters }}>
          <RangeControl
            label="Bay count"
            value={parameters.bay}
            min={1}
            max={5}
            onChange={(value) => update("bay", value)}
          />
          <RangeControl
            label="Depth"
            value={parameters.depth}
            min={1}
            max={3}
            onChange={(value) => update("depth", value)}
          />
          <RangeControl
            label="Roof height"
            value={parameters.roofHeight}
            min={3}
            max={7}
            step={0.1}
            unit="m"
            onChange={(value) => update("roofHeight", value)}
          />
          <RangeControl
            label="Courtyard size"
            value={parameters.courtyardSize}
            min={1}
            max={5}
            step={0.1}
            unit="m"
            onChange={(value) => update("courtyardSize", value)}
          />
        </ModelViewer>
        <p className="demo-note">
          这是用于理解参数关系的抽象体块，不是江头村真实测绘模型。生成后仍可调整参数，JSON
          与体块会同步更新；真实 Grasshopper / Rhino 接口尚未连接。
        </p>
      </div>
    </>
  );
}
