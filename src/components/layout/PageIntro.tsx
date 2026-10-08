import { MaskReveal } from "@/components/motion/MaskReveal";

// Shared masthead for the index-level pages. Same three registers as the
// homepage: mono metadata, oversized display, editorial lead — so /work, /lab
// and /about read as the same publication rather than three separate sites.
export function PageIntro({
  kickerLeft,
  kickerRight,
  lines,
  lead,
  note,
}: {
  kickerLeft: string;
  kickerRight?: string;
  lines: string[];
  lead?: string;
  note?: string;
}) {
  return (
    <section className="page-intro section-shell">
      <div className="page-intro-bar">
        <span className="meta-key">{kickerLeft}</span>
        {kickerRight && <span className="meta-key">{kickerRight}</span>}
      </div>
      <MaskReveal
        as="h1"
        className="page-intro-title"
        lineClassName="page-intro-line"
        lines={lines}
        stagger={0.08}
      />
      {(lead || note) && (
        <div className="page-intro-foot">
          {lead && <p className="page-intro-lead">{lead}</p>}
          {note && <p className="page-intro-note">{note}</p>}
        </div>
      )}
    </section>
  );
}
