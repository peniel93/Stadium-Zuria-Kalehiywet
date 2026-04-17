"use client";

import { useCallback, useEffect, useState } from "react";

type ContactMessageItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "pending" | "read" | "replied" | "closed";
  adminReply: string | null;
  createdAt: string;
};

export function ContactInboxManager() {
  const [items, setItems] = useState<ContactMessageItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setMessage(null);
    const search = statusFilter === "all" ? "" : `?status=${statusFilter}`;
    const response = await fetch(`/api/v1/contact/messages${search}`);
    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to load contact messages.");
      return;
    }

    setItems(result.data);
  }, [statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMessages();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMessages]);

  async function setStatus(id: string, status: "pending" | "read" | "replied" | "closed") {
    setMessage(null);

    const response = await fetch("/api/v1/contact/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to update message status.");
      return;
    }

    setMessage("Message status updated.");
    await loadMessages();
  }

  async function sendReply(id: string) {
    const adminReply = replyDrafts[id]?.trim();

    if (!adminReply) {
      setMessage("Write a reply before saving.");
      return;
    }

    const response = await fetch("/api/v1/contact/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adminReply }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to save reply.");
      return;
    }

    setMessage("Reply saved and status moved to replied.");
    await loadMessages();
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>Contact Inbox</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="portal-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
          <button className="control-btn" type="button" onClick={() => void loadMessages()}>
            Refresh
          </button>
        </div>
      </div>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <article key={item.id} className="content-card" style={{ display: "grid", gap: 8 }}>
            <div className="tag-row">
              <span className="tag">{item.status}</span>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </div>
            <h3 style={{ margin: 0 }}>{item.subject || "No subject"}</h3>
            <p><strong>{item.fullName}</strong> ({item.email})</p>
            {item.phone ? <p>Phone: {item.phone}</p> : null}
            <p>{item.message}</p>
            {item.adminReply ? <p><strong>Reply:</strong> {item.adminReply}</p> : null}

            <textarea
              className="portal-input"
              rows={2}
              placeholder="Write reply..."
              value={replyDrafts[item.id] ?? ""}
              onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="control-btn" type="button" onClick={() => void setStatus(item.id, "read")}>Mark Read</button>
              <button className="control-btn" type="button" onClick={() => void sendReply(item.id)}>Save Reply</button>
              <button className="control-btn" type="button" onClick={() => void setStatus(item.id, "closed")}>Close</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
