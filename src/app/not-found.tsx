import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="error-page section-shell">
      <p className="eyebrow">404 / OUTSIDE THE SYSTEM</p>
      <h1>
        This path is
        <br />
        still unwritten.
      </h1>
      <p>没有找到这个页面。你可以返回作品目录继续浏览。</p>
      <Link className="button button-dark" href="/work">
        EXPLORE SELECTED WORKS ↗
      </Link>
    </main>
  );
}
