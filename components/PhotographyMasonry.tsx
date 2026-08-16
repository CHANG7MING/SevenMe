"use client";

import { Masonry } from "antd";
import { createPortal } from "react-dom";
import {
  CompressOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";

type Photo = {
  key: number;
  src: string;
  ratio: number;
  alt: string;
  description: string;
  date: string;
  location: string;
  focus: string;
};

const basePhotos: Array<[string, number, string]> = [
  ["photo-1510001618818-4b4e3d86bf0f", 0.82, "旅途中的光影"],
  ["photo-1507513319174-e556268bb244", 1.36, "城市与自然"],
  ["photo-1474181487882-5abf3f0ba6c2", 0.72, "安静的街道"],
  ["photo-1492778297155-7be4c83960c7", 1.18, "建筑细节"],
  ["photo-1508062878650-88b52897f298", 0.78, "路上的片段"],
  ["photo-1506158278516-d720e72406fc", 1.42, "未命名的远方"],
  ["photo-1552203274-e3c7bd771d26", 0.68, "自然的纹理"],
  ["photo-1528163186890-de9b86b54b51", 1.24, "光落下的地方"],
  ["photo-1727423304224-6d2fd99b864c", 0.8, "城市切面"],
  ["photo-1675090391405-432434e23595", 1.33, "短暂的秩序"],
  ["photo-1554196967-97a8602084d9", 0.75, "旅行观察"],
  ["photo-1491961865842-98f7befd1a60", 1.2, "风经过之后"],
  ["photo-1721728613411-d56d2ddda959", 0.7, "城市边缘"],
  ["photo-1731901245099-20ac7f85dbaa", 1.4, "途中所见"],
  ["photo-1617694455303-59af55af7e58", 0.84, "天气留下的痕迹"],
  ["photo-1709198165282-1dab551df890", 1.26, "静默结构"],
  ["photo-1441974231531-c6227db76b6e", 0.76, "林间光线"],
  ["photo-1464822759023-fed622ff2c3b", 1.38, "山的轮廓"],
  ["photo-1472214103451-9374bd1c798e", 0.73, "草地与风"],
  ["photo-1511818966892-d7d671e672a2", 1.3, "混凝土几何"],
  ["photo-1519501025264-65ba15a82390", 0.8, "城市俯瞰"],
  ["photo-1500530855697-b586d89ba3ee", 1.34, "远处的光"],
  ["photo-1480714378408-67cf0d13bc1b", 0.72, "建筑之间"],
  ["photo-1477959858617-67f85cf4f1df", 1.22, "城市密度"],
];

const cropFocus = ["center", "top", "bottom"];
const photoDescriptions = [
  "光线穿过日常表面，在短暂的一刻重新组织了空间。",
  "没有被计划的停留，往往比目的地更接近旅行本身。",
  "记录建筑、天气与人群之间悄然形成的秩序。",
  "远离技术与屏幕之后，重新练习观察真实世界。",
  "风、阴影与时间共同留下的一段无声叙事。",
  "在熟悉的城市里，寻找尚未被命名的视角。",
];
const photoLocations = ["上海", "杭州", "东京", "在路上", "未命名地点", "城市边缘"];
const photoDates = ["2026.08", "2026.05", "2025.12", "2025.09", "2025.04", "2024.11"];
const photos: Photo[] = cropFocus.flatMap((focus, seriesIndex) =>
  basePhotos.map(([id, ratio, alt], photoIndex) => ({
    key: seriesIndex * basePhotos.length + photoIndex,
    src: `https://images.unsplash.com/${id}`,
    ratio: seriesIndex === 1 ? ratio * 1.08 : seriesIndex === 2 ? ratio * 0.94 : ratio,
    alt,
    description:
      (photoIndex + seriesIndex) % 7 === 0
        ? ""
        : photoDescriptions[(photoIndex + seriesIndex * 2) % photoDescriptions.length],
    date: photoDates[(photoIndex + seriesIndex) % photoDates.length],
    location: photoLocations[(photoIndex + seriesIndex * 2) % photoLocations.length],
    focus,
  })),
);

const initialCount = 16;
const batchSize = 12;

function PhotoLightbox({ index, onClose, onChange }: { index: number; onClose: () => void; onChange: (index: number) => void }) {
  const photo = photos[index];
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotate, setRotate] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const dragRef = useRef({ active: false, x: 0, y: 0, originX: 0, originY: 0, maxX: 0, maxY: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);

  useEffect(() => {
    setZoom(1); setPan({ x: 0, y: 0 }); setRotate(0); setFlipX(false); setFlipY(false);
  }, [index]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onChange((index - 1 + photos.length) % photos.length);
      if (event.key === "ArrowRight") onChange((index + 1) % photos.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, onChange, onClose]);

  const changeZoom = (next: number) => { setZoom(Math.max(1, Math.min(4, next))); setPan({ x: 0, y: 0 }); };
  const resetTransform = () => { setZoom(1); setPan({ x: 0, y: 0 }); setRotate(0); setFlipX(false); setFlipY(false); };
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      pinchRef.current = { distance: Math.hypot(second.x - first.x, second.y - first.y), zoom };
      dragRef.current.active = false;
      return;
    }
    if (zoom <= 1 || event.button !== 0 || !imageRef.current || !stageRef.current) return;
    event.preventDefault();
    const stage = stageRef.current.getBoundingClientRect();
    const image = imageRef.current.getBoundingClientRect();
    dragRef.current = {
      active: true, x: event.clientX, y: event.clientY, originX: pan.x, originY: pan.y,
      maxX: Math.max(0, (image.width - stage.width) / 2),
      maxY: Math.max(0, (image.height - stage.height) / 2),
    };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (pointersRef.current.size === 2 && pinchRef.current) {
      event.preventDefault();
      const [first, second] = Array.from(pointersRef.current.values());
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const nextZoom = Math.max(1, Math.min(4, pinchRef.current.zoom * distance / Math.max(1, pinchRef.current.distance)));
      setZoom(nextZoom);
      if (nextZoom <= 1) setPan({ x: 0, y: 0 });
      return;
    }
    const drag = dragRef.current;
    if (!drag.active) return;
    const clamp = (value: number, max: number) => Math.max(-max, Math.min(max, value));
    setPan({ x: clamp(drag.originX + event.clientX - drag.x, drag.maxX), y: clamp(drag.originY + event.clientY - drag.y, drag.maxY) });
  };
  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const intensity = event.ctrlKey ? 0.012 : 0.0028;
    const delta = Math.max(-0.45, Math.min(0.45, -event.deltaY * intensity));
    setZoom((current) => {
      const next = Math.max(1, Math.min(4, current + delta));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  return createPortal(
    <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={photo.alt}>
      <div className="photo-lightbox-mask" />
      <button className="photo-lightbox-close" type="button" onClick={onClose} aria-label="关闭预览">×</button>
      <div className="photo-lightbox-layout">
        <div ref={stageRef} className={`photo-lightbox-stage ${zoom > 1 ? "can-drag" : ""}`}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stopDrag} onPointerCancel={stopDrag}
          onWheel={onWheel}>
          <img ref={imageRef} src={`${photo.src}?w=2400&auto=format&fit=max&q=90`} alt={photo.alt}
            draggable={false} style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotate(${rotate}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})` }} />
        </div>
        <aside className="photo-lightbox-info">
          <h3>{photo.alt}</h3><p>{photo.description || "暂无"}</p>
          <div><span>{photo.date}</span><span>{photo.location}</span></div>
        </aside>
      </div>
      <div className="photo-lightbox-toolbar">
        <button type="button" onClick={() => onChange((index - 1 + photos.length) % photos.length)} aria-label="上一张" title="上一张"><LeftOutlined /></button>
        <span />
        <button type="button" onClick={() => setFlipY((value) => !value)} aria-label="垂直翻转" title="垂直翻转"><SwapOutlined rotate={90} /></button>
        <button type="button" onClick={() => setFlipX((value) => !value)} aria-label="水平翻转" title="水平翻转"><SwapOutlined /></button>
        <button type="button" onClick={() => setRotate((value) => value - 90)} aria-label="向左旋转" title="向左旋转"><RotateLeftOutlined /></button>
        <button type="button" onClick={() => setRotate((value) => value + 90)} aria-label="向右旋转" title="向右旋转"><RotateRightOutlined /></button>
        <button type="button" onClick={() => changeZoom(zoom - .5)} disabled={zoom <= 1} aria-label="缩小" title="缩小"><ZoomOutOutlined /></button>
        <button type="button" onClick={() => changeZoom(zoom + .5)} disabled={zoom >= 4} aria-label="放大" title="放大"><ZoomInOutlined /></button>
        <button type="button" onClick={resetTransform} aria-label="适应容器" title="适应容器"><CompressOutlined /></button>
        <span />
        <button type="button" onClick={() => onChange((index + 1) % photos.length)} aria-label="下一张" title="下一张"><RightOutlined /></button>
      </div>
    </div>,
    document.body,
  );
}

export default function PhotographyMasonry() {
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || visibleCount >= photos.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisibleCount((current) => Math.min(photos.length, current + batchSize));
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [visibleCount]);

  const markLoaded = (key: number) => {
    setLoaded((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  };

  const markFailed = (key: number) => {
    setFailed((current) => new Set(current).add(key));
    markLoaded(key);
  };

  return (
    <div className="photography-gallery">
      <Masonry<Photo>
          className="photography-masonry"
          columns={{ xs: 1, sm: 2, lg: 3, xl: 4 }}
          gutter={[14, 14]}
          items={photos.slice(0, visibleCount).map((photo) => ({
            key: `photo-${photo.key}`,
            data: photo,
          }))}
          itemRender={({ data, index }) => {
            const isLoaded = loaded.has(data.key);
            const isFailed = failed.has(data.key);
            return (
              <figure
                className={`masonry-photo ${isLoaded ? "is-loaded" : ""} ${isFailed ? "is-failed" : ""}`}
                style={{ "--reveal-order": index % batchSize } as CSSProperties}
              >
                <div
                  className="masonry-photo-frame"
                  style={isLoaded ? undefined : { aspectRatio: data.ratio }}
                  role="button"
                  tabIndex={0}
                  onClick={() => setPreviewIndex(data.key)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setPreviewIndex(data.key); }}
                >
                  {!isLoaded && (
                    <div className="masonry-photo-placeholder" aria-hidden="true">
                      <img src="/character-head-transparent.png" alt="" />
                    </div>
                  )}
                  <img
                    className="masonry-gallery-image"
                    src={`${data.src}?w=720&auto=format&fit=max&q=76`}
                    alt={data.alt}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => markLoaded(data.key)}
                    onError={(event) => {
                      const image = event.currentTarget;
                      if (!image.src.endsWith("/character-head-transparent.png")) {
                        image.src = "/character-head-transparent.png";
                      }
                      markFailed(data.key);
                    }}
                  />
                <div className="masonry-photo-info">
                  <p>{data.description || "暂无"}</p>
                  <div>
                    <span>{data.date}</span>
                    <span>{data.location}</span>
                  </div>
                </div>
              </div>
            </figure>
            );
          }}
      />
      <div className="gallery-load-more" ref={loadMoreRef} aria-live="polite">
        {visibleCount < photos.length ? <><i /><span>继续向下浏览</span></> : <span>72 / 72</span>}
      </div>
      {previewIndex !== null && (
        <PhotoLightbox index={previewIndex} onClose={() => setPreviewIndex(null)} onChange={setPreviewIndex} />
      )}
    </div>
  );
}
