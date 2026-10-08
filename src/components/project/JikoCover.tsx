import Image from "next/image";

export function JikoCover({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`jiko-cover${compact ? " is-compact" : ""}`}>
      <div className="jiko-cover-copy">
        <span className="eyebrow">WECHAT MINI PROGRAM / 2026</span>
        <strong>迹刻</strong>
        <span>RECORD · REVIEW · REMIND</span>
      </div>
      <div className="jiko-cover-screens" aria-hidden="true">
        <div className="jiko-cover-phone jiko-cover-phone-back">
          <Image
            src="/images/projects/jiko/weekly-review.webp"
            alt=""
            fill
            sizes="(max-width: 768px) 42vw, 30vw"
          />
        </div>
        <div className="jiko-cover-phone jiko-cover-phone-front">
          <Image
            src="/images/projects/jiko/ai-assistant.webp"
            alt=""
            fill
            priority={!compact}
            sizes="(max-width: 768px) 48vw, 34vw"
          />
        </div>
      </div>
    </div>
  );
}
