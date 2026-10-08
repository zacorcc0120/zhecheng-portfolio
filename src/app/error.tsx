"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page section-shell">
      <p className="eyebrow">SOMETHING INTERRUPTED THE FLOW</p>
      <h1>Let’s try again.</h1>
      <p>页面暂时未能加载，请重试。</p>
      <button className="button button-dark" onClick={reset}>
        RETRY
      </button>
    </main>
  );
}
