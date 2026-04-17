"use client";

import { useEffect, useState } from "react";

type LiveDocument = {
  id: string;
  title: string;
  description: string | null;
  download_url: string | null;
  department: { name_en?: string; code?: string } | null;
  media_title: string | null;
  created_at: string;
};

export function LiveDocumentList() {
  const [items, setItems] = useState<LiveDocument[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        const response = await fetch("/api/v1/documents/live");
        const result = await response.json();

        if (result.success) {
          setItems(result.data);
          setMessage(null);
        } else {
          setMessage(result.error?.message ?? "Failed to load resources.");
        }

        setIsLoading(false);
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>Live Documents and Resources</h2>
        <span>Published files available for download</span>
      </div>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}
      {isLoading ? <p>Loading resources...</p> : null}

      <div className="card-grid">
        {items.map((item) => (
          <article key={item.id} className="content-card">
            <div className="tag-row">
              <span className="tag">{item.department?.code ?? "general"}</span>
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description ?? "No description"}</p>
            <p>Department: {item.department?.name_en ?? "General"}</p>
            {item.download_url ? (
              <a className="control-btn" href={item.download_url} target="_blank" rel="noreferrer">
                Download
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
