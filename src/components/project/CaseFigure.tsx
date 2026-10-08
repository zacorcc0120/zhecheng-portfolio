import Image from "next/image";
import type { Project } from "@/data/projects";

type Asset = Project["assets"][number];

/**
 * A full-width plate.
 *
 * The exported figures carry their own baked-in caption, which turns to noise
 * once the image is scaled into the page. Those images are therefore delivered
 * cropped, and the title and technical footer come back here as live type —
 * selectable, translatable, and set in the same register as everything else on
 * the page.
 */
/** Ratio tokens, named after the delivered crop they must match exactly. */
type Ratio = "wide" | "cinema" | "half" | "tall" | "grid" | "square";

export function CaseFigure({
  asset,
  ratio = "wide",
}: {
  asset: Asset | undefined;
  ratio?: Ratio;
}) {
  if (!asset?.src) return null;
  return (
    <figure className={`case-figure case-figure-${ratio}`}>
      <div className="case-figure-image">
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          quality={90}
          sizes="(max-width: 900px) 100vw, 1460px"
        />
      </div>
      <figcaption>
        <span>{asset.label}</span>
        {asset.meta && <span className="case-figure-meta">{asset.meta}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * Two plates side by side, for figures that only work when compared.
 *
 * `ratio` has to be stated rather than inferred: the two pairs on this page are
 * cropped differently (1800×1013 vs 1800×1260), and a mismatched box would
 * stretch one of the two and break the baseline the pair depends on.
 */
export function CaseFigurePair({
  assets,
  ratio = "half",
}: {
  assets: (Asset | undefined)[];
  ratio?: Ratio;
}) {
  const present = assets.filter((a): a is Asset => Boolean(a?.src));
  if (!present.length) return null;
  return (
    <div className="case-figure-pair">
      {present.map((asset) => (
        <figure className={`case-figure case-figure-${ratio}`} key={asset.path}>
          <div className="case-figure-image">
            <Image
              src={asset.src as string}
              alt={asset.alt}
              fill
              quality={90}
              sizes="(max-width: 900px) 100vw, 720px"
            />
          </div>
          <figcaption>
            <span>{asset.label}</span>
            {asset.meta && (
              <span className="case-figure-meta">{asset.meta}</span>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}