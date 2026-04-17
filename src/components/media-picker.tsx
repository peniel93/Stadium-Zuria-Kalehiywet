"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

type MediaPickerItem = {
  id: string;
  title: string | null;
  media_type: "image" | "audio" | "video" | "document";
  preview_url?: string | null;
  storage_path: string;
};

type MediaPickerProps = {
  departmentIdentifier?: string;
  mediaType?: MediaPickerItem["media_type"];
  selectedMediaId?: string;
  onSelect: (mediaId: string) => void;
};

const MAX_UPLOAD_BYTES_BY_TYPE: Record<MediaPickerItem["media_type"], number> = {
  image: 10 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  document: 25 * 1024 * 1024,
};

const ACCEPT_BY_TYPE: Record<MediaPickerItem["media_type"], string> = {
  image: "image/*",
  audio: "audio/*",
  video: "video/*",
  document: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/zip,application/x-rar-compressed",
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function inferMediaType(mimeType: string): MediaPickerItem["media_type"] {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "document";
}

export function MediaPicker({ departmentIdentifier, mediaType = "image", selectedMediaId, onSelect }: MediaPickerProps) {
  const [items, setItems] = useState<MediaPickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const query = new URLSearchParams({ mediaType });

    if (departmentIdentifier) {
      query.set("departmentIdentifier", departmentIdentifier);
    }

    try {
      const response = await fetch(`/api/v1/media?${query.toString()}`);
      const result = (await response.json()) as {
        success: boolean;
        data?: MediaPickerItem[];
        error?: { message?: string };
      };

      if (result.success) {
        setItems(result.data ?? []);
        return;
      }

      setItems([]);
      setErrorMessage(result.error?.message ?? "Failed to load media images.");
    } catch {
      setItems([]);
      setErrorMessage("Network error while loading media images.");
    } finally {
      setIsLoading(false);
    }
  }, [departmentIdentifier, mediaType]);

  function validateFile(file: File) {
    const inferredType = inferMediaType(file.type || "application/octet-stream");
    const maxBytes = MAX_UPLOAD_BYTES_BY_TYPE[mediaType];

    if (inferredType !== mediaType) {
      throw new Error(`Invalid file type. Please upload a ${mediaType} file.`);
    }

    if (file.size > maxBytes) {
      throw new Error(`File is too large. Maximum allowed size for ${mediaType} is ${formatBytes(maxBytes)}.`);
    }
  }

  async function uploadFile(file: File) {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      validateFile(file);

      const uploadUrlResponse = await fetch("/api/v1/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          departmentIdentifier,
        }),
      });

      const uploadUrlResult = (await uploadUrlResponse.json()) as {
        success: boolean;
        data?: { bucketName: string; storagePath: string; signedUrl: string };
        error?: { message?: string };
      };

      if (!uploadUrlResult.success || !uploadUrlResult.data) {
        throw new Error(uploadUrlResult.error?.message ?? "Failed to create upload URL.");
      }

      const putResponse = await fetch(uploadUrlResult.data.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!putResponse.ok) {
        throw new Error("Upload failed while sending file to storage.");
      }

      const registerResponse = await fetch("/api/v1/media/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentIdentifier,
          bucketName: uploadUrlResult.data.bucketName,
          storagePath: uploadUrlResult.data.storagePath,
          mediaType: inferMediaType(file.type || "application/octet-stream"),
          title: file.name,
        }),
      });

      const registerResult = (await registerResponse.json()) as {
        success: boolean;
        data?: { id: string };
        error?: { message?: string };
      };

      if (!registerResult.success || !registerResult.data) {
        throw new Error(registerResult.error?.message ?? "Failed to register media.");
      }

      await loadImages();
      onSelect(registerResult.data.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    event.target.value = "";
    await uploadFile(file);
  }

  function handleDragOver(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDropActive(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDropActive(false);
  }

  async function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDropActive(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await uploadFile(file);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadImages();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadImages]);

  const filteredItems = items.filter((item) => {
    const searchValue = searchTerm.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return [item.title, item.id, item.storage_path, item.media_type].some((value) =>
      value?.toLowerCase().includes(searchValue),
    );
  });

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <strong>Select media from library</strong>
        <button className="control-btn" type="button" onClick={() => void loadImages()} disabled={isLoading}>
          Reload images
        </button>
      </div>

      <label
        style={{
          display: "grid",
          gap: 6,
          border: isDropActive ? "1px solid var(--accent-strong)" : "1px dashed rgba(120, 187, 234, 0.5)",
          borderRadius: 12,
          padding: 12,
          background: isDropActive ? "rgba(120, 187, 234, 0.12)" : "transparent",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(event) => void handleDrop(event)}
      >
        <span>Pick from device or drag file here</span>
        <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
          Allowed: {mediaType}. Max size: {formatBytes(MAX_UPLOAD_BYTES_BY_TYPE[mediaType])}.
        </span>
        <input
          className="portal-input"
          type="file"
          accept={ACCEPT_BY_TYPE[mediaType]}
          onChange={(event) => void handleUpload(event)}
          disabled={isUploading}
        />
      </label>

      <input
        className="portal-input"
        placeholder="Search media by title, ID, or path"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      {isLoading ? <p>Loading images...</p> : null}
      {isUploading ? <p>Uploading media from your device...</p> : null}
      {errorMessage ? <p style={{ margin: 0, color: "var(--warn)" }}>{errorMessage}</p> : null}

      <div className="card-grid">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`content-card ${selectedMediaId === item.id ? "selected-card" : ""}`}
            onClick={() => onSelect(item.id)}
            style={{ textAlign: "left" }}
          >
            {item.preview_url ? (
              <div style={{ position: "relative", width: "100%", height: 130, borderRadius: 12, overflow: "hidden" }}>
                <Image
                  src={item.preview_url}
                  alt={item.title ?? "Media preview"}
                  fill
                  sizes="(max-width: 768px) 100vw, 280px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            ) : (
              <div style={{ height: 130, borderRadius: 12, background: "#dbe9f5" }} />
            )}
            <h4 style={{ marginBottom: 4 }}>{item.title ?? "Untitled image"}</h4>
            <p style={{ margin: 0, color: "var(--muted)" }}>{item.id}</p>
          </button>
        ))}
      </div>

      {!isLoading && !errorMessage && filteredItems.length === 0 ? (
        <p>No media files match your search.</p>
      ) : null}
    </div>
  );
}
