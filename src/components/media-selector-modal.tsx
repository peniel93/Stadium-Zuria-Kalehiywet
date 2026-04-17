"use client";

import { useEffect } from "react";
import { MediaPicker } from "@/components/media-picker";

type MediaSelectorModalProps = {
  isOpen: boolean;
  departmentIdentifier?: string;
  mediaType?: "image" | "audio" | "video" | "document";
  selectedMediaId?: string;
  onSelect: (mediaId: string) => void;
  onClose: () => void;
  title?: string;
};

export function MediaSelectorModal({
  isOpen,
  departmentIdentifier,
  mediaType,
  selectedMediaId,
  onSelect,
  onClose,
  title = "Pick from media",
}: MediaSelectorModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7, 18, 28, 0.72)",
        backdropFilter: "blur(8px)",
        display: "grid",
        placeItems: "center",
        zIndex: 60,
        padding: 16,
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(1100px, 100%)",
          maxHeight: "min(90vh, 920px)",
          overflow: "auto",
          background: "var(--panel)",
          borderRadius: 24,
          border: "1px solid rgba(120, 187, 234, 0.28)",
          boxShadow: "0 30px 90px rgba(0, 0, 0, 0.45)",
          padding: 20,
          display: "grid",
          gap: 16,
        }}
      >
        <div className="section-head">
          <div>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>Choose an image and it will be applied immediately.</p>
          </div>
          <button className="control-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <MediaPicker
          departmentIdentifier={departmentIdentifier}
          mediaType={mediaType}
          selectedMediaId={selectedMediaId}
          onSelect={(mediaId) => {
            onSelect(mediaId);
            onClose();
          }}
        />
      </section>
    </div>
  );
}
