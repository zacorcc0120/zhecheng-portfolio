import Image from "next/image";
import { Plus } from "lucide-react";

export function AssetSlot({
  src,
  path,
  label,
  alt,
  orientation = "landscape",
  fit = "cover",
}: {
  src: string | null;
  path: string;
  label: string;
  alt: string;
  orientation?: "landscape" | "portrait";
  fit?: "cover" | "contain";
}) {
  return (
    <figure className="asset-figure">
      {src ? (
        <div className={`asset-image asset-${orientation} asset-fit-${fit}`}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ) : (
        <div className="asset-placeholder">
          <Plus size={25} strokeWidth={1} />
          <span>REPLACE WITH PROJECT IMAGE</span>
          <span className="asset-path">{path}</span>
        </div>
      )}
      <figcaption>
        {label}
        {!src && <span>素材待补充</span>}
      </figcaption>
    </figure>
  );
}
