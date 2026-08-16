"use client";

import { useEffect, useRef, useState } from "react";
import { chapters, type ChapterKey } from "@/data/content";
import DetailDrawer from "./DetailDrawer";
import { useHeroCanvas } from "@/hooks/useHeroCanvas";
import { useTheme } from "@/hooks/useTheme";

type LoadingPhase = "loading" | "opening" | "done";

const photographyPreviewImages = [
  "photo-1510001618818-4b4e3d86bf0f", "photo-1507513319174-e556268bb244",
  "photo-1474181487882-5abf3f0ba6c2", "photo-1492778297155-7be4c83960c7",
  "photo-1508062878650-88b52897f298", "photo-1506158278516-d720e72406fc",
  "photo-1552203274-e3c7bd771d26", "photo-1528163186890-de9b86b54b51",
  "photo-1727423304224-6d2fd99b864c", "photo-1675090391405-432434e23595",
  "photo-1554196967-97a8602084d9", "photo-1491961865842-98f7befd1a60",
  "photo-1721728613411-d56d2ddda959", "photo-1731901245099-20ac7f85dbaa",
  "photo-1617694455303-59af55af7e58", "photo-1709198165282-1dab551df890",
];

const chapterIllustrations: Record<ChapterKey, string> = {
  research: "/chapter-art/research.webp",
  skills: "/chapter-art/skills.webp",
  photography: "/chapter-art/photography.webp",
  articles: "/chapter-art/about.webp",
};

export default function Portfolio() {
  const heroRef = useRef<HTMLElement>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const pointerCanvasRef = useRef<HTMLCanvasElement>(null);
  const journeyRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [detailKey, setDetailKey] = useState<ChapterKey | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailOrigin, setDetailOrigin] = useState({ x: "50%", y: "50%" });
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("loading");
  const { theme, toggleTheme } = useTheme();

  useHeroCanvas(heroRef, heroCanvasRef, pointerCanvasRef, theme, Boolean(detailKey) || detailVisible);

  useEffect(() => {
    document.body.classList.add("loading-lock");
    const openTimer = window.setTimeout(() => setLoadingPhase("opening"), 1000);
    const finishTimer = window.setTimeout(() => {
      setLoadingPhase("done");
      document.body.classList.remove("loading-lock");
    }, 1900);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(finishTimer);
      document.body.classList.remove("loading-lock");
    };
  }, []);

  useEffect(() => {
    const journey = journeyRef.current;
    const wind = journey?.querySelector<HTMLElement>(".wind");
    const chaptersElements = Array.from(journey?.querySelectorAll<HTMLElement>(".chapter") ?? []);
    const progressText = journey?.querySelector<HTMLElement>(".progress-text");
    const progressFill = journey?.querySelector<HTMLElement>(".progress-fill");
    const hero = heroRef.current;
    const stickyStage = journey?.querySelector<HTMLElement>(".sticky-stage");
    const closing = document.querySelector<HTMLElement>(".closing");
    if (!journey || !wind || chaptersElements.length === 0) return;

    let lastPosition = 0;
    let windTimeout = 0;
    let framePending = false;
    let isWindMoving = false;

    const update = () => {
      const rect = journey.getBoundingClientRect();
      const viewportHeight = Math.max(1, window.innerHeight);
      const smoothstep = (start: number, end: number, value: number) => {
        const normalized = Math.max(0, Math.min(1, (value - start) / Math.max(0.001, end - start)));
        return normalized * normalized * (3 - 2 * normalized);
      };
      const scrollable = journey.offsetHeight - window.innerHeight;
      const isJourneyVisible = rect.top < window.innerHeight * 0.72 && rect.bottom > window.innerHeight * 0.28;
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, scrollable)));

      // The three major sections share one reversible scroll timeline. The
      // incoming section moves over the outgoing one while the latter recedes.
      const heroToJourney = Math.max(0, Math.min(1, 1 - rect.top / viewportHeight));
      const heroExit = smoothstep(0.08, 0.58, heroToJourney);
      const journeyEntry = smoothstep(0.52, 0.96, heroToJourney);
      const closingRect = closing?.getBoundingClientRect();
      const journeyExit = closingRect
        ? smoothstep(0.08, 0.92, 1 - closingRect.top / viewportHeight)
        : 0;
      hero?.style.setProperty("--section-exit", String(heroExit));
      stickyStage?.style.setProperty("--section-entry", String(journeyEntry));
      stickyStage?.style.setProperty("--section-exit", String(journeyExit));
      closing?.style.setProperty("--section-entry", String(journeyExit));

      journey.style.setProperty("--dot-offset-y", `${progress * -220}px`);
      const zonePosition = progress * chapters.length;
      const zoneIndex = Math.min(chapters.length - 1, Math.floor(zonePosition));
      const zoneProgress = zoneIndex === chapters.length - 1 ? 1 : zonePosition - zoneIndex;
      const rawPosition = Math.min(
        chapters.length - 1,
        zonePosition - (zoneIndex === chapters.length - 1 ? 1 : 0),
      );
      const direction = rawPosition >= lastPosition ? 1 : -1;
      const transitionStart = 0.84;
      const transitionProgress =
        zoneIndex >= chapters.length - 1
          ? 1
          : Math.max(0, Math.min(1, (zoneProgress - transitionStart) / (1 - transitionStart)));
      const position =
        zoneIndex >= chapters.length - 1 ? chapters.length - 1 : zoneIndex + transitionProgress;
      const nearest =
        zoneIndex >= chapters.length - 1 ? chapters.length - 1 : transitionProgress >= 0.5 ? zoneIndex + 1 : zoneIndex;
      const viewport = journey.querySelector<HTMLElement>(".chapter-viewport");
      const viewportWidth = viewport?.getBoundingClientRect().width ?? window.innerWidth;

      chaptersElements.forEach((item, index) => {
        const distance = index - position;
        const amount = Math.min(Math.abs(distance), 1.25);
        const x = distance * viewportWidth * 0.96;
        const rotation = distance * 2.4;
        const scale = 1 - Math.min(amount, 1) * 0.045;
        const opacity = Math.max(0, 1 - amount * 1.02);
        item.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, 0) rotateZ(${rotation}deg) scale(${scale})`;
        item.style.opacity = String(opacity);
        item.style.zIndex = String(100 - Math.round(amount * 10));
        item.classList.toggle("is-active", index === nearest);
        item.style.pointerEvents = index === nearest && amount < 0.12 ? "auto" : "none";
      });

      const nextActive = isJourneyVisible ? nearest : null;
      setActiveIndex((current) => (current === nextActive ? current : nextActive));

      const moving = transitionProgress > 0 && transitionProgress < 1;
      wind.style.transform = `translateX(${direction * transitionProgress * -18}px)`;
      if (moving !== isWindMoving) {
        isWindMoving = moving;
        wind.classList.toggle("is-moving", moving);
        window.clearTimeout(windTimeout);
        if (!moving) windTimeout = window.setTimeout(() => wind.classList.remove("is-moving"), 120);
      }

      if (progressText) progressText.textContent = `${String(nearest + 1).padStart(2, "0")} / 04`;
      if (progressFill) progressFill.style.transform = `scaleX(${progress})`;
      lastPosition = rawPosition;
    };

    const schedule = () => {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(() => {
        framePending = false;
        update();
      });
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.clearTimeout(windTimeout);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailKey(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const scrollToChapter = (index: number) => {
    const journey = journeyRef.current;
    if (!journey) return;
    const scrollable = journey.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: journey.offsetTop + scrollable * (index / chapters.length),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const detailChapter = detailKey ? chapters.find((chapter) => chapter.key === detailKey) ?? null : null;
  const visibleChapterIndex = activeIndex ?? 0;

  return (
    <>
      {loadingPhase !== "done" && (
        <div
          className={`loading-screen ${loadingPhase === "opening" ? "is-opening" : ""}`}
          aria-label="页面加载中"
          role="status"
        >
          <div className="loading-panel loading-panel-top" />
          <div className="loading-panel loading-panel-bottom" />
          <div className="loading-orbit" aria-hidden="true">
            {["outer", "middle", "inner"].map((ring) => (
              <span className={`loading-ring loading-ring-${ring}`} key={ring}>
                {Array.from({ length: 8 }, (_, index) => (
                  <i key={index} style={{ "--dot-index": index } as React.CSSProperties} />
                ))}
              </span>
            ))}
            <span className="loading-avatar-wrap">
              <img src="/character-head-transparent.png" alt="" className="loading-avatar" />
            </span>
          </div>
        </div>
      )}
      <nav className="nav glass">
        <a className="brand" href="#top">CHANG7AN</a>
        <div className="nav-links">
          {chapters.map((chapter, index) => (
            <a
              className={index === activeIndex ? "is-active" : ""}
              href={`#${chapter.key}`}
              key={chapter.key}
              aria-current={index === activeIndex ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                scrollToChapter(index);
              }}
            >
              {chapter.label}
            </a>
          ))}
          <button
            className="theme-toggle"
            type="button"
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            onClick={toggleTheme}
          >
            <svg className="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="4.2" fill="currentColor" />
              <path
                d="M12 2.2v2.1M12 19.7v2.1M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.2 12h2.1M19.7 12h2.1M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.7"
              />
            </svg>
            <svg className="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M19.2 15.8A7.8 7.8 0 0 1 8.2 4.8 8.4 8.4 0 1 0 19.2 15.8Z" fill="currentColor" />
              <circle cx="17.2" cy="6.2" r="1" fill="currentColor" opacity=".72" />
            </svg>
          </button>
          <span className="status">Researching</span>
        </div>
      </nav>

      <canvas id="pointerCanvas" className="pointer-canvas" ref={pointerCanvasRef} aria-hidden="true" />
      <main className={`site-main ${loadingPhase === "loading" ? "is-intro-pending" : "is-intro-revealed"}`}>
        <section className="hero" id="top" ref={heroRef}>
          <canvas id="heroCanvas" className="hero-canvas" ref={heroCanvasRef} aria-hidden="true" />
          <div className="hero-inner">
            <p className="kicker">AI 产品与全栈开发者</p>
            <h1>Researching how ideas become tools.</h1>
            <p>我是 CHANG7AN。研究 AI、构建 Skills，也用摄影保存技术之外的世界。</p>
          </div>
          <div className="hero-meta">
            <button className="scroll-cue" type="button" onClick={() => scrollToChapter(0)}>
              <span>向下探索</span>
              <svg className="scroll-mark" viewBox="0 0 28 25" aria-hidden="true" focusable="false">
                <path className="scroll-mark-line" d="M14 3v16" />
                <path className="scroll-mark-arrow" d="m8.5 13 5.5 6 5.5-6" />
              </svg>
            </button>
          </div>
        </section>

        <section className="journey" id="journey" ref={journeyRef}>
          <div className="sticky-stage">
            <div className="veil" />
            <div className="wind" />
            <div className="chapter-viewport">
              {chapters.map((chapter, index) => {
                return (
                  <article
                    className={`chapter ${index === visibleChapterIndex ? "is-active" : ""}`}
                    id={chapter.key}
                    key={chapter.key}
                  >
                    <div className="chapter-inner">
                      <div className="chapter-index"><span>{String(index + 1).padStart(2, "0")}</span><span>{chapter.eyebrow}</span></div>
                      <div className="chapter-content">
                        <h2>{chapter.heading}</h2>
                        <p>{chapter.description}</p>
                        {chapter.key === "photography" ? (
                          <div className="photo-preview-wall" aria-hidden="true">
                            {photographyPreviewImages.map((image) => (
                              <div key={image}>
                                <img
                                  src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=520&q=78`}
                                  alt=""
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <ul className="chapter-list">
                            {chapter.items.map((item, itemIndex) => <li data-index={String(itemIndex + 1).padStart(2, "0")} key={item}>{item}</li>)}
                          </ul>
                        )}
                      </div>
                      <img
                        className="chapter-illustration"
                        src={chapterIllustrations[chapter.key]}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        aria-hidden="true"
                      />
                      <div className="chapter-foot">
                        <span className="chapter-note">{chapter.note}</span>
                        <button
                          className="more"
                          type="button"
                          onClick={(event) => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            setDetailOrigin({ x: `${rect.left + rect.width / 2}px`, y: `${rect.top + rect.height / 2}px` });
                            setDetailKey(chapter.key);
                          }}
                        >
                          查看更多 <span aria-hidden="true">↗</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="progress"><span className="progress-text">01 / 04</span><span className="progress-track"><span className="progress-fill" /></span></div>
          </div>
        </section>

        <section className="closing">
          <div>
            <h2>Ideas, tools,<br />and a point of view.</h2>
            <p>CHANG7AN · Researching and building from Hangzhou.</p>
          </div>
        </section>
      </main>
      <DetailDrawer
        chapter={detailChapter}
        origin={detailOrigin}
        onClose={() => setDetailKey(null)}
        onSelectChapter={setDetailKey}
        theme={theme}
        onToggleTheme={toggleTheme}
        onVisibilityChange={setDetailVisible}
      />
    </>
  );
}
