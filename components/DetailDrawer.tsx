"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { chapters, type Chapter, type ChapterKey } from "@/data/content";
import type { Theme } from "@/hooks/useTheme";
import PhotographyMasonry from "./PhotographyMasonry";
import {
  closedDetailState,
  detailStateAfterChapterChange,
  type DetailState,
} from "@/lib/uiState";

type DetailDrawerProps = {
  chapter: Chapter | null;
  origin: {
    x: string;
    y: string;
  };
  onClose: () => void;
  onSelectChapter: (key: ChapterKey) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onVisibilityChange?: (visible: boolean) => void;
};

export default function DetailDrawer({
  chapter,
  origin,
  onClose,
  onSelectChapter,
  theme,
  onToggleTheme,
  onVisibilityChange,
}: DetailDrawerProps) {
  const [detailState, setDetailState] = useState<DetailState<Chapter>>(() =>
    chapter ? { phase: "open", rendered: chapter } : closedDetailState(),
  );
  const detailRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    setDetailState((current) => detailStateAfterChapterChange(current, chapter));
    if (chapter) {
      detailRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [chapter]);

  useEffect(() => {
    if (detailState.phase !== "closing") return;
    const closeTimer = window.setTimeout(() => setDetailState(closedDetailState()), 520);
    return () => window.clearTimeout(closeTimer);
  }, [detailState.phase]);

  useEffect(() => {
    onVisibilityChange?.(detailState.phase !== "closed");
  }, [detailState.phase, onVisibilityChange]);

  useEffect(() => {
    const shouldLock = detailState.phase !== "closed";
    document.body.classList.toggle("detail-lock", shouldLock);
    return () => document.body.classList.remove("detail-lock");
  }, [detailState.phase]);

  const renderedChapter = detailState.rendered;

  return (
    <section
      ref={detailRef}
      className={`detail ${detailState.phase === "open" ? "is-open" : ""} ${
        detailState.phase === "closing" ? "is-closing" : ""
      }`}
      aria-hidden={detailState.phase !== "open"}
      style={{
        "--origin-x": origin.x,
        "--origin-y": origin.y,
      } as CSSProperties}
    >
      <nav className="detail-nav">
        <span className="detail-title">
          {renderedChapter
            ? `CHANG7AN / ${renderedChapter.key === "articles" ? "WRITING" : renderedChapter.key.toUpperCase()}`
            : "CHANG7AN / RESEARCH"}
        </span>
        <div className="detail-actions">
          <div className="detail-tabs" aria-label="切换详情栏目">
            {chapters.map((item) => (
              <button
                className={renderedChapter?.key === item.key ? "is-active" : ""}
                type="button"
                key={item.key}
                onClick={() => onSelectChapter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            className="theme-toggle detail-theme-toggle"
            type="button"
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            onClick={onToggleTheme}
          >
            <svg className="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" fill="currentColor" />
              <path d="M12 2.2v2.1M12 19.7v2.1M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.2 12h2.1M19.7 12h2.1M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
            </svg>
            <svg className="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19.2 15.8A7.8 7.8 0 0 1 8.2 4.8 8.4 8.4 0 1 0 19.2 15.8Z" fill="currentColor" />
            </svg>
          </button>
          <button className="close-detail" type="button" aria-label="关闭详情" onClick={onClose}>×</button>
        </div>
      </nav>
      {renderedChapter && (
        <div className="detail-shell">
          <div className="detail-hero">
            <div>
              <p className="detail-eyebrow">{renderedChapter.detailEyebrow}</p>
              <h2>{renderedChapter.heading}</h2>
              <p>{renderedChapter.detailIntro}</p>
            </div>
          </div>
          {renderedChapter.key === "photography" ? (
            <PhotographyMasonry />
          ) : (
            <div className="detail-grid">
              {renderedChapter.details.map(([meta, title, description]) => (
                <article className="detail-item" key={meta}>
                  <small>{meta}</small>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
