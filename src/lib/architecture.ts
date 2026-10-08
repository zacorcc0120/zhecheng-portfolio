export interface ArchitectureParameters {
  bay: number;
  depth: number;
  courtyard: boolean;
  screenWall: boolean;
  roofHeight: number;
  courtyardSize: number;
}
export interface ArchitectureResult {
  parameters: ArchitectureParameters;
  notes: string[];
  source: "demo" | "api";
}
export type GenerationPhase =
  "parsing" | "parameters" | "verifying" | "complete";
export interface ArchitectureProvider {
  generate(
    prompt: string,
    options?: {
      signal?: AbortSignal;
      onPhase?: (phase: GenerationPhase) => void;
    },
  ): Promise<ArchitectureResult>;
}
export const defaultArchitecture: ArchitectureParameters = {
  bay: 3,
  depth: 2,
  courtyard: true,
  screenWall: true,
  roofHeight: 4.8,
  courtyardSize: 3,
};
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const numbers: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
};
const readNumber = (raw: string) => numbers[raw.toLowerCase()] ?? Number(raw);

// Deterministic local parser. This is intentionally not an LLM or a verified
// vernacular knowledge base. Replace the provider at the boundary below.
export function parseArchitecturePrompt(prompt: string): ArchitectureResult {
  if (!prompt.trim()) throw new Error("请先描述你想生成的院落。");
  if (prompt.length > 600) throw new Error("请将描述控制在 600 个字符以内。");
  const p = { ...defaultArchitecture };
  const notes: string[] = [];
  const bayMatch =
    prompt.match(/([一二两三四五六七八九十\d]+)\s*(?:开间|間)/i) ||
    prompt.match(/(\d+|one|two|three|four|five|six)\s*bays?\b/i);
  const depthMatch =
    prompt.match(/([一二两三四五六七八九十\d]+)\s*进/i) ||
    prompt.match(
      /(\d+|one|two|three|four|five|six)\s*(?:depth|courtyards?|rows?)\b/i,
    );
  if (bayMatch) {
    const raw = readNumber(bayMatch[1]);
    if (Number.isFinite(raw)) {
      p.bay = clamp(Math.round(raw), 1, 5);
      if (p.bay !== raw) notes.push("开间数已限制在演示范围 1–5。");
    }
  } else notes.push("未指定开间数，使用演示默认值 3。");
  if (depthMatch) {
    const raw = readNumber(depthMatch[1]);
    if (Number.isFinite(raw)) {
      p.depth = clamp(Math.round(raw), 1, 3);
      if (p.depth !== raw) notes.push("进数已限制在演示范围 1–3。");
    }
  } else notes.push("未指定进数，使用演示默认值 2。");
  p.courtyard =
    !/(?:无|没有|不带|不要|不需要)\s*(?:天井|院落)|(?:no|without)\s+(?:a\s+)?(?:courtyard|patio)/i.test(
      prompt,
    );
  p.screenWall =
    !/(?:无|没有|不带|不要|不需要)\s*照壁|(?:no|without)\s+(?:a\s+)?screen\s*wall/i.test(
      prompt,
    );
  const roofMatch = prompt.match(
    /(?:屋顶高(?:度)?|屋脊高(?:度)?|roof\s*height)\s*[:：=]?\s*(\d+(?:\.\d+)?)/i,
  );
  if (roofMatch) {
    const raw = Number(roofMatch[1]);
    p.roofHeight = clamp(raw, 3, 7);
    if (p.roofHeight !== raw) notes.push("屋顶高度已限制在演示范围 3–7 m。");
  }
  notes.push("仅检查演示参数范围；尚未连接地方建筑知识库或真实 AI。");
  return { parameters: p, notes, source: "demo" };
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export const architectureProvider: ArchitectureProvider = {
  async generate(prompt, { signal, onPhase } = {}) {
    const result = parseArchitecturePrompt(prompt);
    for (const phase of ["parsing", "parameters", "verifying"] as const) {
      onPhase?.(phase);
      await delay(600, signal);
    }
    onPhase?.("complete");
    return result;
  },
};
// Future integration: implement ArchitectureProvider using fetch('/api/generate',
// { method: 'POST', body: JSON.stringify({prompt}), signal }). Keep provider API
// keys in server-only environment variables; validate the returned parameters.
