export interface ProjectVideoAsset {
  src: string;
  poster?: string;
  captions?: string;
  caption: string;
}

export function ProjectVideo({
  src,
  poster,
  captions,
  caption,
}: ProjectVideoAsset) {
  return (
    <figure className="project-video">
      <video
        controls
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={caption}
      >
        <source src={src} type="video/mp4" />
        <track
          kind="captions"
          src={captions}
          srcLang="zh"
          label="中文字幕"
          default={Boolean(captions)}
        />
        你的浏览器暂不支持此视频。
      </video>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
