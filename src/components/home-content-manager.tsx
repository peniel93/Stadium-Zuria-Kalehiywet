"use client";

import { useCallback, useEffect, useState } from "react";
import { AnnouncementManager } from "@/components/announcement-manager";
import {
  DEFAULT_HOME_CATEGORY_ORDER,
  getCategoryMeta,
  normalizeCategoryOrder,
} from "@/lib/content/category-meta";

type HomeSlide = {
  headingEn: string;
  headingAm: string;
  textEn: string;
  textAm: string;
};

type PublicPagesSettings = {
  homeSlides: HomeSlide[];
  homeCategoryOrder?: string[];
  homeCategoryLimits?: Record<string, number>;
};

const MAX_SLIDES = 6;
const MAX_HEADING_LENGTH = 120;
const MAX_TEXT_LENGTH = 280;

const emptySlide: HomeSlide = {
  headingEn: "",
  headingAm: "",
  textEn: "",
  textAm: "",
};

export function HomeContentManager() {
  const [publicPages, setPublicPages] = useState<PublicPagesSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [categoryOrder, setCategoryOrder] = useState<string[]>(DEFAULT_HOME_CATEGORY_ORDER);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setMessage(null);
    const response = await fetch("/api/v1/site/settings");
    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to load home content settings.");
      return;
    }

    setPublicPages(result.data.publicPages);
    setCategoryOrder(normalizeCategoryOrder(result.data.publicPages?.homeCategoryOrder));
    setCategoryLimits(result.data.publicPages?.homeCategoryLimits ?? {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function saveSlides() {
    if (!publicPages) {
      return;
    }

    const sanitizedSlides = publicPages.homeSlides.map((slide) => ({
      headingEn: slide.headingEn.trim(),
      headingAm: slide.headingAm.trim(),
      textEn: slide.textEn.trim(),
      textAm: slide.textAm.trim(),
    }));

    if (sanitizedSlides.length === 0) {
      setMessage("At least one home slide is required.");
      return;
    }

    const invalidSlideIndex = sanitizedSlides.findIndex(
      (slide) => !slide.headingEn || !slide.textEn,
    );

    if (invalidSlideIndex >= 0) {
      setMessage(`Slide ${invalidSlideIndex + 1} needs English heading and text.`);
      return;
    }

    const longSlideIndex = sanitizedSlides.findIndex(
      (slide) =>
        slide.headingEn.length > MAX_HEADING_LENGTH ||
        slide.headingAm.length > MAX_HEADING_LENGTH ||
        slide.textEn.length > MAX_TEXT_LENGTH ||
        slide.textAm.length > MAX_TEXT_LENGTH,
    );

    if (longSlideIndex >= 0) {
      setMessage(
        `Slide ${longSlideIndex + 1} is too long. Heading max ${MAX_HEADING_LENGTH}, text max ${MAX_TEXT_LENGTH} characters.`,
      );
      return;
    }

    const response = await fetch("/api/v1/site/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert-public-pages",
        ...publicPages,
        homeSlides: sanitizedSlides,
        homeCategoryOrder: normalizeCategoryOrder(categoryOrder),
        homeCategoryLimits: categoryLimits,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to save slides.");
      return;
    }

    setPublicPages(result.data.publicPages);
    setCategoryOrder(normalizeCategoryOrder(result.data.publicPages?.homeCategoryOrder));
    setCategoryLimits(result.data.publicPages?.homeCategoryLimits ?? {});
    setMessage("Homepage slides updated.");
  }

  function moveCategory(code: string, direction: -1 | 1) {
    setCategoryOrder((prev) => {
      const index = prev.findIndex((item) => item === code);

      if (index < 0) {
        return prev;
      }

      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }

      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  }

  function addSlide() {
    setPublicPages((prev) => {
      if (!prev || prev.homeSlides.length >= MAX_SLIDES) {
        return prev;
      }

      return {
        ...prev,
        homeSlides: [...prev.homeSlides, { ...emptySlide }],
      };
    });
  }

  function removeSlide(index: number) {
    setPublicPages((prev) => {
      if (!prev || prev.homeSlides.length <= 1) {
        return prev;
      }

      return {
        ...prev,
        homeSlides: prev.homeSlides.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>Home Content Dashboard</h2>
        <button className="control-btn" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      {publicPages ? (
        <section style={{ display: "grid", gap: 12 }}>
          <div className="section-head">
            <h3 style={{ margin: 0 }}>Homepage Slider</h3>
            <button
              className="control-btn"
              type="button"
              onClick={addSlide}
              disabled={publicPages.homeSlides.length >= MAX_SLIDES}
            >
              Add Slide
            </button>
          </div>
          {publicPages.homeSlides.map((slide, index) => (
            <article key={`home-slide-${index}`} className="content-card" style={{ display: "grid", gap: 8 }}>
              <div className="section-head">
                <strong>Slide {index + 1}</strong>
                <button
                  className="control-btn"
                  type="button"
                  onClick={() => removeSlide(index)}
                  disabled={publicPages.homeSlides.length <= 1}
                >
                  Remove
                </button>
              </div>
              <div className="admin-grid">
                <input
                  className="portal-input"
                  placeholder="Heading (EN)"
                  value={slide.headingEn}
                  onChange={(event) =>
                    setPublicPages((prev) =>
                      prev
                        ? {
                            ...prev,
                            homeSlides: prev.homeSlides.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, headingEn: event.target.value } : item,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <input
                  className="portal-input"
                  placeholder="Heading (AM)"
                  value={slide.headingAm}
                  onChange={(event) =>
                    setPublicPages((prev) =>
                      prev
                        ? {
                            ...prev,
                            homeSlides: prev.homeSlides.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, headingAm: event.target.value } : item,
                            ),
                          }
                        : prev,
                    )
                  }
                />
              </div>

              <div className="admin-grid">
                <input
                  className="portal-input"
                  placeholder="Slide text (EN)"
                  value={slide.textEn}
                  onChange={(event) =>
                    setPublicPages((prev) =>
                      prev
                        ? {
                            ...prev,
                            homeSlides: prev.homeSlides.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, textEn: event.target.value } : item,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <input
                  className="portal-input"
                  placeholder="Slide text (AM)"
                  value={slide.textAm}
                  onChange={(event) =>
                    setPublicPages((prev) =>
                      prev
                        ? {
                            ...prev,
                            homeSlides: prev.homeSlides.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, textAm: event.target.value } : item,
                            ),
                          }
                        : prev,
                    )
                  }
                />
              </div>
            </article>
          ))}

          <p style={{ margin: 0, color: "var(--muted)" }}>
            Keep English heading/text filled for each slide. Limit: {MAX_SLIDES} slides.
          </p>

          <button className="control-btn" type="button" onClick={() => void saveSlides()}>
            Save Home Slides
          </button>
        </section>
      ) : null}

      <section style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0 }}>Homepage Posts and Notices</h3>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Use categories such as announcement, program, conference, vacancy, training, and event.
        </p>
        <article className="content-card" style={{ display: "grid", gap: 10 }}>
          <div className="section-head">
            <h4 style={{ margin: 0 }}>Homepage Category Priority</h4>
            <button
              className="control-btn"
              type="button"
              onClick={() => setCategoryOrder(DEFAULT_HOME_CATEGORY_ORDER)}
            >
              Reset Default
            </button>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Move categories up or down to change homepage ordering.
          </p>
          {categoryOrder.map((code, index) => {
            const meta = getCategoryMeta(code);

            return (
              <div key={code} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <strong style={{ minWidth: 32 }}>{index + 1}.</strong>
                <span style={{ flex: 1 }}>
                  {meta.labelEn} / {meta.labelAm}
                </span>
                <input
                  className="portal-input"
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  style={{ maxWidth: 110 }}
                  value={categoryLimits[code] ?? ""}
                  placeholder="No cap"
                  onChange={(event) => {
                    const numeric = Number(event.target.value);
                    setCategoryLimits((prev) => {
                      if (!event.target.value || Number.isNaN(numeric) || numeric <= 0) {
                        const next = { ...prev };
                        delete next[code];
                        return next;
                      }

                      return {
                        ...prev,
                        [code]: Math.min(20, Math.floor(numeric)),
                      };
                    });
                  }}
                />
                <button className="control-btn" type="button" onClick={() => moveCategory(code, -1)}>
                  Up
                </button>
                <button className="control-btn" type="button" onClick={() => moveCategory(code, 1)}>
                  Down
                </button>
              </div>
            );
          })}
        </article>
        <AnnouncementManager allowDepartmentSelection />
      </section>
    </section>
  );
}
