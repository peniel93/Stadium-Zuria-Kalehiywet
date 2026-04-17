"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { usePortalLocale } from "@/lib/portal-locale";

type MediaItem = {
  id: string;
  owner_department_id: string | null;
  bucket_name: string;
  storage_path: string;
  media_type: "image" | "audio" | "video" | "document";
  title: string | null;
  description: string | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  preview_url?: string | null;
};

type MediaManagerProps = {
  departmentIdentifier?: string;
  title?: string;
};

export function MediaManager({ departmentIdentifier, title }: MediaManagerProps) {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingAsset, setIsUpdatingAsset] = useState(false);
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);
  const [isRestoringAsset, setIsRestoringAsset] = useState(false);
  const [showDeletedAssets, setShowDeletedAssets] = useState(false);
  const [mediaType, setMediaType] = useState<MediaItem["media_type"]>("image");
  const [assetTitle, setAssetTitle] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [assetDraftById, setAssetDraftById] = useState<
    Record<string, { title: string; description: string }>
  >({});

  const selectedAsset = items.find((item) => item.id === selectedAssetId) ?? items[0] ?? null;

  const loadMedia = useCallback(async () => {
    setIsLoading(true);

    const query = new URLSearchParams();

    if (departmentIdentifier) {
      query.set("departmentIdentifier", departmentIdentifier);
    }

    if (showDeletedAssets) {
      query.set("includeDeleted", "true");
    }

    const response = await fetch(`/api/v1/media?${query.toString()}`);
    const result = (await response.json()) as {
      success: boolean;
      data: MediaItem[];
      error: { message?: string } | null;
    };

    if (result.success) {
      setItems(result.data);
      setSelectedAssetId((currentId) => {
        if (!result.data.length) {
          return null;
        }

        if (currentId && result.data.some((item) => item.id === currentId)) {
          return currentId;
        }

        return result.data[0].id;
      });
      setMessage(null);
    } else {
      setMessage(result.error?.message ?? (locale === "am" ? "የሚዲያ ፋይሎች መጫን አልተሳካም።" : "Failed to load media assets."));
    }

    setIsLoading(false);
  }, [departmentIdentifier, showDeletedAssets, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMedia();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMedia]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setMessage(null);

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
      data: { bucketName: string; storagePath: string; signedUrl: string };
      error: { message?: string } | null;
    };

    if (!uploadUrlResult.success) {
      setMessage(uploadUrlResult.error?.message ?? t("Failed to create upload URL.", "የመጫኛ URL መፍጠር አልተሳካም።"));
      setIsUploading(false);
      return;
    }

    const putResponse = await fetch(uploadUrlResult.data.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!putResponse.ok) {
      setMessage(t("Upload failed while sending the file to storage.", "ፋይሉን ወደ ማከማቻ ሲልኩ መጫን አልተሳካም።"));
      setIsUploading(false);
      return;
    }

    const registerResponse = await fetch("/api/v1/media/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        departmentIdentifier,
        bucketName: uploadUrlResult.data.bucketName,
        storagePath: uploadUrlResult.data.storagePath,
        mediaType,
        title: assetTitle || undefined,
        description: assetDescription || undefined,
      }),
    });

    const registerResult = (await registerResponse.json()) as {
      success: boolean;
      error: { message?: string } | null;
    };

    if (!registerResult.success) {
      setMessage(registerResult.error?.message ?? t("Failed to register media.", "ሚዲያ መመዝገብ አልተሳካም።"));
      setIsUploading(false);
      return;
    }

    setMessage(t("Media uploaded and registered.", "ሚዲያው ተጭኖ ተመዝግቧል።"));
    setAssetTitle("");
    setAssetDescription("");
    event.target.value = "";
    await loadMedia();
    setIsUploading(false);
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage(t("Copied to clipboard.", "ወደ ክሊፕቦርድ ተቀድቷል።"));
  }

  async function handleUpdateSelectedAsset() {
    if (!selectedAsset) {
      return;
    }

    setIsUpdatingAsset(true);
    setMessage(null);

    const response = await fetch(`/api/v1/media/${selectedAsset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: (assetDraftById[selectedAsset.id]?.title ?? selectedAsset.title ?? "") || null,
        description:
          (assetDraftById[selectedAsset.id]?.description ?? selectedAsset.description ?? "") || null,
      }),
    });

    const result = (await response.json()) as {
      success: boolean;
      error: { message?: string } | null;
    };

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to update media asset.", "የሚዲያ ንብረት ማሻሻል አልተሳካም።"));
      setIsUpdatingAsset(false);
      return;
    }

    setMessage(t("Media asset updated.", "የሚዲያ ንብረት ተሻሽሏል።"));
    setAssetDraftById((current) => {
      const next = { ...current };
      delete next[selectedAsset.id];
      return next;
    });
    await loadMedia();
    setIsUpdatingAsset(false);
  }

  async function handleDeleteSelectedAsset() {
    if (!selectedAsset) {
      return;
    }

    const shouldDelete = window.confirm(
      t("Archive this media asset? You can restore it later.", "ይህን የሚዲያ ንብረት ማህደር ውስጥ ላክ? በኋላ መመለስ ይቻላል።"),
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingAsset(true);
    setMessage(null);

    const response = await fetch(`/api/v1/media/${selectedAsset.id}`, {
      method: "DELETE",
    });

    const result = (await response.json()) as {
      success: boolean;
      error: { message?: string } | null;
    };

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to delete media asset.", "የሚዲያ ንብረት መሰረዝ አልተሳካም።"));
      setIsDeletingAsset(false);
      return;
    }

    setMessage(t("Media asset deleted.", "የሚዲያ ንብረቱ ተሰርዟል።"));
    setAssetDraftById((current) => {
      const next = { ...current };
      delete next[selectedAsset.id];
      return next;
    });
    await loadMedia();
    setIsDeletingAsset(false);
  }

  async function handleRestoreSelectedAsset() {
    if (!selectedAsset) {
      return;
    }

    setIsRestoringAsset(true);
    setMessage(null);

    const response = await fetch(`/api/v1/media/${selectedAsset.id}`, {
      method: "POST",
    });

    const result = (await response.json()) as {
      success: boolean;
      error: { message?: string } | null;
    };

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to restore media asset.", "የሚዲያ ንብረት መመለስ አልተሳካም።"));
      setIsRestoringAsset(false);
      return;
    }

    setMessage(t("Media asset restored.", "የሚዲያ ንብረቱ ተመልሷል።"));
    await loadMedia();
    setIsRestoringAsset(false);
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{title ?? t("Media Library", "የሚዲያ ማዕከል")}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="control-btn" type="button" onClick={() => setShowDeletedAssets((value) => !value)}>
            {showDeletedAssets ? t("Hide archived", "የተማህደሩትን ደብቅ") : t("Show archived", "የተማህደሩትን አሳይ")}
          </button>
          <button className="control-btn" type="button" onClick={() => void loadMedia()}>
            {t("Refresh", "አድስ")}
          </button>
        </div>
      </div>

      <div className="admin-grid">
        <select
          className="portal-input"
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value as MediaItem["media_type"])}
        >
          <option value="image">Image</option>
          <option value="audio">{t("Audio", "ድምጽ")}</option>
          <option value="video">{t("Video", "ቪዲዮ")}</option>
          <option value="document">{t("Document", "ሰነድ")}</option>
        </select>
        <input
          className="portal-input"
          placeholder={t("Media title", "የሚዲያ ርዕስ")}
          value={assetTitle}
          onChange={(event) => setAssetTitle(event.target.value)}
        />
      </div>

      <input
        className="portal-input"
        placeholder={t("Description", "መግለጫ")}
        value={assetDescription}
        onChange={(event) => setAssetDescription(event.target.value)}
      />

      <label className="toggle-box" style={{ justifyContent: "space-between" }}>
        <span>{isUploading ? t("Uploading...", "በመጫን ላይ...") : t("Select file to upload", "ለመጫን ፋይል ምረጥ")}</span>
        <input type="file" onChange={(event) => void handleUpload(event)} disabled={isUploading} />
      </label>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      {selectedAsset ? (
        <section className="content-card" style={{ display: "grid", gap: 12 }}>
          <div className="tag-row">
            <span className="tag">Selected</span>
            <span>{selectedAsset.media_type}</span>
            {selectedAsset.deleted_at ? <span className="tag">{t("archived", "ተማህዷል")}</span> : null}
          </div>
          <h3 style={{ marginBottom: 0 }}>{selectedAsset.title ?? t("Untitled", "ርዕስ የለም")}</h3>
          {selectedAsset.preview_url ? (
            <div style={{ position: "relative", width: "100%", height: 260, borderRadius: 18, overflow: "hidden" }}>
              <Image
                src={selectedAsset.preview_url}
                alt={selectedAsset.title ?? "Media preview"}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>
          ) : null}
          <div style={{ display: "grid", gap: 10 }}>
            <input
              className="portal-input"
              placeholder="Asset title"
              value={assetDraftById[selectedAsset.id]?.title ?? selectedAsset.title ?? ""}
              onChange={(event) =>
                setAssetDraftById((current) => ({
                  ...current,
                  [selectedAsset.id]: {
                    title: event.target.value,
                    description:
                      current[selectedAsset.id]?.description ?? selectedAsset.description ?? "",
                  },
                }))
              }
            />
            <input
              className="portal-input"
              placeholder={t("Asset description", "የንብረት መግለጫ")}
              value={assetDraftById[selectedAsset.id]?.description ?? selectedAsset.description ?? ""}
              onChange={(event) =>
                setAssetDraftById((current) => ({
                  ...current,
                  [selectedAsset.id]: {
                    title: current[selectedAsset.id]?.title ?? selectedAsset.title ?? "",
                    description: event.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="admin-grid">
            <button className="control-btn" type="button" onClick={() => void copyText(selectedAsset.id)}>
              Copy asset ID
            </button>
            <button
              className="control-btn"
              type="button"
              onClick={() => void copyText(selectedAsset.storage_path)}
            >
              {t("Copy storage path", "የማከማቻ መንገድ ቅዳ")}
            </button>
          </div>
          <div className="admin-grid">
            <button
              className="control-btn"
              type="button"
              disabled={isUpdatingAsset}
              onClick={() => void handleUpdateSelectedAsset()}
            >
              {isUpdatingAsset ? t("Saving...", "በማስቀመጥ ላይ...") : t("Save metadata", "የመረጃ ሜታ አስቀምጥ")}
            </button>
            <button
              className="control-btn"
              type="button"
              disabled={isDeletingAsset}
              onClick={() => void handleDeleteSelectedAsset()}
            >
              {isDeletingAsset ? t("Archiving...", "በማህደር ላይ...") : t("Archive asset", "ንብረት ማህደር አስገባ")}
            </button>
          </div>
          {selectedAsset.deleted_at ? (
            <button
              className="control-btn"
              type="button"
              disabled={isRestoringAsset}
              onClick={() => void handleRestoreSelectedAsset()}
            >
              {isRestoringAsset ? t("Restoring...", "በመመለስ ላይ...") : t("Restore asset", "ንብረት መልስ")}
            </button>
          ) : null}
          <div style={{ display: "grid", gap: 6, color: "var(--muted)" }}>
            <span>{t("Asset ID", "የንብረት ID")}: {selectedAsset.id}</span>
            <span>{t("Bucket", "ባኬት")}: {selectedAsset.bucket_name}</span>
            <span>{t("Path", "መንገድ")}: {selectedAsset.storage_path}</span>
            <span>{t("Created", "የተፈጠረበት")}: {new Date(selectedAsset.created_at).toLocaleString()}</span>
            {selectedAsset.updated_at ? <span>{t("Updated", "የተሻሻለበት")}: {new Date(selectedAsset.updated_at).toLocaleString()}</span> : null}
            {selectedAsset.deleted_at ? <span>{t("Archived", "የተማህደረ")}: {new Date(selectedAsset.deleted_at).toLocaleString()}</span> : null}
          </div>
        </section>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading media assets...", "የሚዲያ ንብረቶች በመጫን ላይ...")}</p> : null}
        {items.map((item) => (
          <article
            key={item.id}
            className="content-card"
            role="button"
            tabIndex={0}
            onClick={() => setSelectedAssetId(item.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedAssetId(item.id);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {item.preview_url ? (
              <div style={{ position: "relative", width: "100%", height: 170, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
                <Image
                  src={item.preview_url}
                  alt={item.title ?? "Media preview"}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            ) : null}
            <div className="tag-row">
              <span className="tag">{item.media_type}</span>
              <span>{new Date(item.created_at).toLocaleString()}</span>
              {item.deleted_at ? <span className="tag">{t("archived", "ተማህዷል")}</span> : null}
            </div>
            <h3>{item.title ?? t("Untitled", "ርዕስ የለም")}</h3>
            <p>{item.description ?? t("No description", "መግለጫ የለም")}</p>
            <p>{t("Asset ID", "የንብረት ID")}: {item.id}</p>
            <p>{t("Path", "መንገድ")}: {item.storage_path}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
