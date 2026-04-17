"use client";

import { useState } from "react";

type DepartmentItem = {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string;
};

type ContactFormProps = {
  departments: DepartmentItem[];
};

export function ContactForm({ departments }: ContactFormProps) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    departmentId: "",
    message: "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/v1/contact/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json();

    if (!result.success) {
      setStatus(result.error?.message ?? "Failed to send your message.");
      setIsSubmitting(false);
      return;
    }

    setForm({ fullName: "", email: "", phone: "", subject: "", departmentId: "", message: "" });
    setStatus("Your message has been submitted successfully.");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="panel" style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Contact Us</h2>
      <div className="admin-grid">
        <input className="portal-input" placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
        <input className="portal-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
      </div>
      <div className="admin-grid">
        <input className="portal-input" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <input className="portal-input" placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
      </div>
      <select className="portal-input" value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
        <option value="">Select department (optional)</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.nameEn}
          </option>
        ))}
      </select>
      <textarea className="portal-input" rows={5} placeholder="Message / Comment / Idea" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required />
      <button className="control-btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
      {status ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{status}</p> : null}
    </form>
  );
}
