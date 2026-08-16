"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import type { Theme } from "./useTheme";

type Rgb = [number, number, number];

type PhotonColor = {
  hue: number;
  tail: Rgb;
  body: Rgb;
};

type Photon = {
  active: boolean;
  nextSpawn: number;
  lane: number;
  direction: 1 | -1;
  progress: number;
  speed: number;
  length: number;
  width: number;
  alpha: number;
  phase: number;
  color: PhotonColor;
};

type MouseParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
};

type Palette = {
  dot: Rgb;
  sheetTop: Rgb;
  sheetMid: Rgb;
  sheetLow: Rgb;
  sheetShadow: Rgb;
  ribbonEdge: Rgb;
  ribbonMid: Rgb;
  ribbonEnd: Rgb;
  ribbonShadow: Rgb;
  mouse: Rgb;
  dotBase: number;
  dotPulse: number;
  sheetTopAlpha: number;
  sheetMidAlpha: number;
  sheetLowAlpha: number;
  sheetShadowAlpha: number;
  ribbonEdgeAlpha: number;
  ribbonMidAlpha: number;
  ribbonEndAlpha: number;
  ribbonShadowAlpha: number;
};

const ribbonCount = 6;
const dprLimit = 1.5;

function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green, blue] = [chroma, secondary, 0];
  else if (segment < 2) [red, green, blue] = [secondary, chroma, 0];
  else if (segment < 3) [red, green, blue] = [0, chroma, secondary];
  else if (segment < 4) [red, green, blue] = [0, secondary, chroma];
  else if (segment < 5) [red, green, blue] = [secondary, 0, chroma];
  else [red, green, blue] = [chroma, 0, secondary];

  return [
    Math.round((red + match) * 255),
    Math.round((green + match) * 255),
    Math.round((blue + match) * 255),
  ];
}

function hueDistance(firstHue: number, secondHue: number) {
  const distance = Math.abs(firstHue - secondHue) % 360;
  return Math.min(distance, 360 - distance);
}

function createPhotonColor(forbiddenHues: number[] = []): PhotonColor {
  let hue = Math.random() * 360;
  for (let attempt = 0; attempt < 14; attempt += 1) {
    hue = Math.random() * 360;
    if (forbiddenHues.every((forbiddenHue) => hueDistance(hue, forbiddenHue) > 48)) break;
  }

  const saturation = 0.76 + Math.random() * 0.18;
  const bodyLightness = 0.54 + Math.random() * 0.08;
  const tailLightness = 0.68 + Math.random() * 0.08;
  return {
    hue,
    tail: hslToRgb((hue + 5) % 360, saturation * 0.92, tailLightness),
    body: hslToRgb(hue, saturation, bodyLightness),
  };
}

const palettes: Record<Theme, Palette> = {
  light: {
    dot: [88, 92, 102],
    sheetTop: [126, 134, 151],
    sheetMid: [255, 255, 255],
    sheetLow: [196, 201, 210],
    sheetShadow: [112, 126, 153],
    ribbonEdge: [107, 114, 131],
    ribbonMid: [255, 255, 255],
    ribbonEnd: [118, 124, 140],
    ribbonShadow: [110, 124, 150],
    mouse: [22, 104, 220],
    dotBase: 0.035,
    dotPulse: 0.05,
    sheetTopAlpha: 0.04,
    sheetMidAlpha: 0.32,
    sheetLowAlpha: 0.11,
    sheetShadowAlpha: 0.16,
    ribbonEdgeAlpha: 0.045,
    ribbonMidAlpha: 0.3,
    ribbonEndAlpha: 0.035,
    ribbonShadowAlpha: 0.14,
  },
  dark: {
    dot: [190, 198, 214],
    sheetTop: [255, 255, 255],
    sheetMid: [255, 255, 255],
    sheetLow: [226, 228, 234],
    sheetShadow: [255, 255, 255],
    ribbonEdge: [118, 142, 188],
    ribbonMid: [222, 231, 250],
    ribbonEnd: [96, 122, 174],
    ribbonShadow: [72, 112, 190],
    mouse: [165, 148, 252],
    dotBase: 0.025,
    dotPulse: 0.035,
    sheetTopAlpha: 0.024,
    sheetMidAlpha: 0.088,
    sheetLowAlpha: 0.038,
    sheetShadowAlpha: 0.026,
    ribbonEdgeAlpha: 0.055,
    ribbonMidAlpha: 0.16,
    ribbonEndAlpha: 0.045,
    ribbonShadowAlpha: 0.08,
  },
};

export function useHeroCanvas(
  heroRef: RefObject<HTMLElement | null>,
  heroCanvasRef: RefObject<HTMLCanvasElement | null>,
  pointerCanvasRef: RefObject<HTMLCanvasElement | null>,
  theme: Theme,
  paused = false,
) {
  const pausedRef = useRef(paused);
  const themeRef = useRef(theme);
  const refreshThemeRef = useRef<(() => void) | null>(null);
  const pauseAnimationRef = useRef<(() => void) | null>(null);
  const resumeAnimationRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) pauseAnimationRef.current?.();
    else resumeAnimationRef.current?.();
  }, [paused]);

  useLayoutEffect(() => {
    themeRef.current = theme;
    refreshThemeRef.current?.();
  }, [theme]);

  useEffect(() => {
    const hero = heroRef.current;
    const heroCanvas = heroCanvasRef.current;
    const pointerCanvas = pointerCanvasRef.current;
    if (!hero || !heroCanvas || !pointerCanvas) return;

    const heroContext = heroCanvas.getContext("2d");
    const pointerContext = pointerCanvas.getContext("2d");
    if (!heroContext || !pointerContext) return;

    const heroDpr = Math.min(window.devicePixelRatio || 1, dprLimit);
    const dotLayerCanvas = document.createElement("canvas");
    const dotLayerContext = dotLayerCanvas.getContext("2d");
    if (!dotLayerContext) return;

    let heroWidth = 0;
    let heroHeight = 0;
    let heroPointerX = 0.5;
    let heroPointerY = 0.5;
    let heroLastTime = 0;
    let heroAnimationFrame = 0;
    let mouseAnimationFrame = 0;
    let mouseLastTime = 0;
    let heroVisible = true;
    let documentVisible = !document.hidden;
    let mouseIdleTimeout = 0;

    const initialPhotonLanes = Array.from({ length: ribbonCount }, (_, lane) => lane)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    const photons: Photon[] = Array.from({ length: 2 }, (_, index) => ({
      active: true,
      nextSpawn: 0,
      lane: initialPhotonLanes[index],
      direction: index === 0 ? 1 : -1,
      progress: index === 0 ? 0.22 : 0.72,
      speed: 0.00024 + index * 0.00003,
      length: 0.065 + index * 0.012,
      width: 1.5,
      alpha: 1,
      phase: Math.random() * Math.PI * 2,
      color: createPhotonColor(),
    }));
    const mouseTrail: MouseParticle[] = [];
    const mouseTrailState = {
      x: 0,
      y: 0,
      lastSpawn: 0,
      hasPosition: false,
      active: false,
    };

    const getPalette = () => palettes[themeRef.current];

    const buildDotLayer = () => {
      dotLayerCanvas.width = Math.floor(heroWidth * heroDpr);
      dotLayerCanvas.height = Math.floor(heroHeight * heroDpr);
      dotLayerContext.setTransform(heroDpr, 0, 0, heroDpr, 0, 0);
      dotLayerContext.clearRect(0, 0, heroWidth, heroHeight);
      const palette = getPalette();
      dotLayerContext.fillStyle = `rgba(${palette.dot.join(", ")}, ${palette.dotBase + palette.dotPulse * 0.48})`;
      dotLayerContext.beginPath();
      for (let y = 26; y < heroHeight; y += 22) {
        for (let x = 18; x < heroWidth; x += 22) {
          dotLayerContext.moveTo(x + 1.05, y);
          dotLayerContext.arc(x, y, 1.05, 0, Math.PI * 2);
        }
      }
      dotLayerContext.fill();
    };

    const resize = () => {
      heroWidth = window.innerWidth;
      heroHeight = window.innerHeight;

      for (const canvas of [heroCanvas, pointerCanvas]) {
        canvas.width = Math.floor(heroWidth * heroDpr);
        canvas.height = Math.floor(heroHeight * heroDpr);
        canvas.style.width = `${heroWidth}px`;
        canvas.style.height = `${heroHeight}px`;
      }
      heroContext.setTransform(heroDpr, 0, 0, heroDpr, 0, 0);
      pointerContext.setTransform(heroDpr, 0, 0, heroDpr, 0, 0);
      buildDotLayer();
    };

    const clearCanvas = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();
      context.setTransform(heroDpr, 0, 0, heroDpr, 0, 0);
    };

    const getRibbonPoint = (
      index: number,
      x: number,
      timeScale: number,
      pointerShiftX: number,
      pointerShiftY: number,
    ) => {
      const centerY = heroHeight * (0.21 + index * 0.085) + pointerShiftY * (index + 1) * 0.35;
      const phase = timeScale * (index % 2 === 0 ? 1.15 : -0.86) + index * 0.8;
      const amplitude = heroHeight * (0.028 + index * 0.004);
      const normalized = x / Math.max(heroWidth, 1);
      const broadWave = Math.sin(normalized * 5.1 + phase) * amplitude;
      const fineWave = Math.sin(normalized * 15.5 - phase * 1.5) * (9 + index * 2);
      return {
        x,
        y: centerY + broadWave + fineWave + pointerShiftX * (normalized - 0.5) * 0.12,
      };
    };

    const choosePhotonLane = (photon: Photon) => {
      const occupiedLanes = photons.filter((item) => item !== photon && item.active).map((item) => item.lane);
      const availableLanes = Array.from({ length: ribbonCount }, (_, lane) => lane).filter(
        (lane) => !occupiedLanes.includes(lane),
      );
      return availableLanes[Math.floor(Math.random() * availableLanes.length)] ?? 0;
    };

    const choosePhotonColor = (photon: Photon) => {
      const forbiddenHues = photons
        .filter((item) => item !== photon && item.active)
        .map((item) => item.color.hue);
      forbiddenHues.push(photon.color.hue);
      return createPhotonColor(forbiddenHues);
    };

    const spawnPhoton = (photon: Photon, time: number) => {
      photon.active = true;
      photon.lane = choosePhotonLane(photon);
      photon.direction = Math.random() < 0.78 ? 1 : -1;
      photon.progress = photon.direction === 1 ? -0.14 : 1.14;
      photon.speed = 0.00023 + Math.random() * 0.0002;
      photon.length = 0.06 + Math.random() * 0.055;
      photon.width = 1.25 + Math.random() * 0.5;
      photon.alpha = 0.96 + Math.random() * 0.04;
      photon.phase = Math.random() * Math.PI * 2;
      photon.color = choosePhotonColor(photon);
      photon.nextSpawn = time + 1400 + Math.random() * 2400;
    };

    const drawPhotons = (
      time: number,
      timeScale: number,
      pointerShiftX: number,
      pointerShiftY: number,
      delta: number,
    ) => {
      heroContext.save();
      heroContext.globalCompositeOperation = "lighter";
      heroContext.lineCap = "round";
      heroContext.shadowBlur = 0;
      heroContext.shadowColor = "transparent";

      photons.forEach((photon) => {
        if (!photon.active) {
          if (time >= photon.nextSpawn) spawnPhoton(photon, time);
          return;
        }

        photon.progress += photon.direction * photon.speed * delta;
        const passedEdge = photon.direction === 1 ? photon.progress > 1.14 : photon.progress < -0.14;
        if (passedEdge) {
          spawnPhoton(photon, time);
          return;
        }

        const headX = photon.progress * heroWidth;
        const tailX = headX - photon.direction * photon.length * heroWidth;
        const head = getRibbonPoint(photon.lane, headX, timeScale, pointerShiftX, pointerShiftY);
        const tail = getRibbonPoint(photon.lane, tailX, timeScale, pointerShiftX, pointerShiftY);
        const pulse = 0.88 + Math.sin(time * 0.006 + photon.phase) * 0.12;
        const trail = heroContext.createLinearGradient(tail.x, tail.y, head.x, head.y);
        const { tail: tailColor, body: bodyColor } = photon.color;

        trail.addColorStop(0, "rgba(255,255,255,0)");
        trail.addColorStop(0.2, `rgba(${tailColor.join(", ")}, ${photon.alpha * 0.58 * pulse})`);
        trail.addColorStop(0.72, `rgba(${bodyColor.join(", ")}, ${photon.alpha * 0.98 * pulse})`);
        trail.addColorStop(1, `rgba(255, 255, 255, ${photon.alpha * pulse})`);

        heroContext.beginPath();
        for (let step = 0; step <= 9; step += 1) {
          const ratio = step / 9;
          const point = getRibbonPoint(
            photon.lane,
            tailX + (headX - tailX) * ratio,
            timeScale,
            pointerShiftX,
            pointerShiftY,
          );
          if (step === 0) heroContext.moveTo(point.x, point.y);
          else heroContext.lineTo(point.x, point.y);
        }
        heroContext.strokeStyle = trail;
        heroContext.lineWidth = photon.width * (1.16 + pulse * 0.24);
        heroContext.stroke();

        heroContext.fillStyle = `rgba(255,255,255,${Math.min(1, photon.alpha * pulse + 0.16)})`;
        heroContext.beginPath();
        heroContext.arc(head.x, head.y, 1.08 + photon.width * 0.32, 0, Math.PI * 2);
        heroContext.fill();
      });

      heroContext.restore();
    };

    const spawnMouseParticle = (
      x: number,
      y: number,
      movementX: number,
      movementY: number,
      ratio: number,
    ) => {
      const distance = Math.hypot(movementX, movementY) || 1;
      const directionX = movementX / distance;
      const directionY = movementY / distance;
      const perpendicularX = -directionY;
      const perpendicularY = directionX;
      const spread = (Math.random() - 0.5) * 3.4;
      const lag = 2 + Math.random() * 7;
      const life = 280 + Math.random() * 240;

      mouseTrail.push({
        x: x - movementX * (1 - ratio) - directionX * lag + perpendicularX * spread,
        y: y - movementY * (1 - ratio) - directionY * lag + perpendicularY * spread,
        vx: -directionX * (0.08 + Math.random() * 0.12) + perpendicularX * spread * 0.025,
        vy: -directionY * (0.08 + Math.random() * 0.12) + perpendicularY * spread * 0.025 - 0.015,
        radius: 1.05 + Math.random() * 1.05,
        life,
        maxLife: life,
      });
      if (mouseTrail.length > 34) mouseTrail.splice(0, mouseTrail.length - 34);
    };

    const scheduleMouseAnimation = () => {
      if (!documentVisible || mouseAnimationFrame || mouseTrail.length === 0) return;
      mouseLastTime = 0;
      mouseAnimationFrame = window.requestAnimationFrame(drawMouseFrame);
    };

    const stopMouseAnimation = () => {
      if (mouseAnimationFrame) window.cancelAnimationFrame(mouseAnimationFrame);
      mouseAnimationFrame = 0;
      mouseLastTime = 0;
      clearCanvas(pointerContext, pointerCanvas);
    };

    const drawMouseTrail = (delta: number) => {
      clearCanvas(pointerContext, pointerCanvas);
      if (mouseTrail.length === 0) {
        stopMouseAnimation();
        return;
      }

      const [mouseRed, mouseGreen, mouseBlue] = getPalette().mouse;
      pointerContext.save();
      pointerContext.globalCompositeOperation = "lighter";
      pointerContext.shadowColor = `rgba(${mouseRed}, ${mouseGreen}, ${mouseBlue}, .38)`;
      pointerContext.shadowBlur = 1.8;

      for (let index = mouseTrail.length - 1; index >= 0; index -= 1) {
        const particle = mouseTrail[index];
        particle.life -= delta;
        if (particle.life <= 0) {
          mouseTrail.splice(index, 1);
          continue;
        }

        const progress = particle.life / particle.maxLife;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vx *= Math.pow(0.94, delta / 16);
        particle.vy *= Math.pow(0.94, delta / 16);
        pointerContext.fillStyle = `rgba(${mouseRed}, ${mouseGreen}, ${mouseBlue}, ${Math.min(1, progress * progress * 1.12)})`;
        pointerContext.beginPath();
        pointerContext.arc(
          particle.x,
          particle.y,
          Math.max(0.52, particle.radius * (0.58 + progress * 0.42)),
          0,
          Math.PI * 2,
        );
        pointerContext.fill();
      }
      pointerContext.restore();
    };

    function drawMouseFrame(time: number) {
      const delta = mouseLastTime ? Math.min(time - mouseLastTime, 40) : 16;
      mouseLastTime = time;
      drawMouseTrail(delta);
      if (mouseTrail.length > 0 && documentVisible) {
        mouseAnimationFrame = window.requestAnimationFrame(drawMouseFrame);
      } else {
        stopMouseAnimation();
      }
    }

    const stopMouseTrail = () => {
      mouseTrailState.active = false;
      mouseTrailState.hasPosition = false;
      window.clearTimeout(mouseIdleTimeout);
      mouseTrail.length = 0;
      stopMouseAnimation();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!mouseTrailState.hasPosition) {
        mouseTrailState.x = event.clientX;
        mouseTrailState.y = event.clientY;
        mouseTrailState.lastSpawn = event.timeStamp;
        mouseTrailState.hasPosition = true;
      }

      const movementX = event.clientX - mouseTrailState.x;
      const movementY = event.clientY - mouseTrailState.y;
      const distance = Math.hypot(movementX, movementY);
      const elapsed = event.timeStamp - mouseTrailState.lastSpawn;
      if (distance >= 2 || elapsed >= 24) {
        const particleCount = Math.min(3, Math.max(1, Math.ceil(distance / 8)));
        for (let index = 0; index < particleCount; index += 1) {
          spawnMouseParticle(event.clientX, event.clientY, movementX, movementY, (index + 1) / particleCount);
        }
        mouseTrailState.x = event.clientX;
        mouseTrailState.y = event.clientY;
        mouseTrailState.lastSpawn = event.timeStamp;
      }
      mouseTrailState.active = true;
      scheduleMouseAnimation();
    };

    const onHeroPointerMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      const nextX = (event.clientX - rect.left) / Math.max(rect.width, 1);
      const nextY = (event.clientY - rect.top) / Math.max(rect.height, 1);
      heroPointerX += (nextX - heroPointerX) * 0.08;
      heroPointerY += (nextY - heroPointerY) * 0.08;
    };

    const drawHero = (time: number) => {
      const palette = getPalette();
      heroContext.clearRect(0, 0, heroWidth, heroHeight);
      heroContext.lineCap = "round";
      heroContext.shadowBlur = 0;
      const timeScale = time * 0.0001;
      const pointerShiftX = (heroPointerX - 0.5) * 34;
      const pointerShiftY = (heroPointerY - 0.5) * 20;
      const delta = heroLastTime ? Math.min(time - heroLastTime, 40) : 16;
      heroLastTime = time;

      heroContext.save();
      heroContext.globalAlpha = 0.82 + Math.sin(timeScale * 2.2) * 0.08;
      heroContext.drawImage(dotLayerCanvas, pointerShiftX * 0.06, pointerShiftY * 0.06, heroWidth, heroHeight);
      heroContext.restore();

      for (let index = 0; index < 3; index += 1) {
        const centerY = heroHeight * (0.29 + index * 0.15) + pointerShiftY * (index + 1) * 0.3;
        const phase = timeScale * (index % 2 === 0 ? 0.82 : -0.62) + index * 1.1;
        const amplitude = heroHeight * (0.075 + index * 0.012);
        const thickness = heroHeight * (0.035 + index * 0.008);
        heroContext.beginPath();

        for (let x = -150; x <= heroWidth + 150; x += 24) {
          const normalized = x / Math.max(heroWidth, 1);
          const y =
            centerY +
            Math.sin(normalized * 4.6 + phase) * amplitude +
            Math.sin(normalized * 12.5 - phase * 1.4) * 9;
          if (x === -150) heroContext.moveTo(x, y);
          else heroContext.lineTo(x, y);
        }
        for (let x = heroWidth + 150; x >= -150; x -= 24) {
          const normalized = x / Math.max(heroWidth, 1);
          const y =
            centerY +
            thickness +
            Math.sin(normalized * 4.6 + phase + 0.36) * amplitude +
            Math.sin(normalized * 12.5 - phase * 1.4 + 0.28) * 9;
          heroContext.lineTo(x, y);
        }
        heroContext.closePath();

        const sheetGradient = heroContext.createLinearGradient(
          0,
          centerY - amplitude,
          0,
          centerY + amplitude + thickness,
        );
        sheetGradient.addColorStop(0, `rgba(${palette.sheetTop.join(", ")}, ${palette.sheetTopAlpha + index * 0.006})`);
        sheetGradient.addColorStop(
          0.42,
          `rgba(${palette.sheetMid.join(", ")}, ${Math.max(0.018, palette.sheetMidAlpha - index * 0.012)})`,
        );
        sheetGradient.addColorStop(0.7, `rgba(${palette.sheetLow.join(", ")}, ${palette.sheetLowAlpha + index * 0.006})`);
        sheetGradient.addColorStop(1, `rgba(${palette.sheetMid.join(", ")}, 0)`);
        heroContext.fillStyle = sheetGradient;
        heroContext.shadowColor = `rgba(${palette.sheetShadow.join(", ")}, ${palette.sheetShadowAlpha})`;
        heroContext.shadowBlur = themeRef.current === "dark" ? 10 : 18;
        heroContext.fill();
      }

      for (let index = 0; index < ribbonCount; index += 1) {
        heroContext.beginPath();
        for (let x = -120; x <= heroWidth + 120; x += 22) {
          const point = getRibbonPoint(index, x, timeScale, pointerShiftX, pointerShiftY);
          if (x === -120) heroContext.moveTo(point.x, point.y);
          else heroContext.lineTo(point.x, point.y);
        }

        const ribbonGradient = heroContext.createLinearGradient(0, 0, heroWidth, 0);
        ribbonGradient.addColorStop(0, `rgba(${palette.ribbonEdge.join(", ")}, ${palette.ribbonEdgeAlpha + index * 0.006})`);
        ribbonGradient.addColorStop(
          0.5,
          `rgba(${palette.ribbonMid.join(", ")}, ${Math.max(0.06, palette.ribbonMidAlpha - index * 0.014)})`,
        );
        ribbonGradient.addColorStop(1, `rgba(${palette.ribbonEnd.join(", ")}, ${palette.ribbonEndAlpha + index * 0.006})`);
        heroContext.strokeStyle = ribbonGradient;
        heroContext.lineWidth = 1.4 + index * 0.5;
        heroContext.shadowColor = `rgba(${palette.ribbonShadow.join(", ")}, ${palette.ribbonShadowAlpha})`;
        heroContext.shadowBlur = themeRef.current === "dark" ? 7 : 12;
        heroContext.stroke();
      }

      drawPhotons(time, timeScale, pointerShiftX, pointerShiftY, delta);
    };

    const canAnimateHero = () => heroVisible && documentVisible && !pausedRef.current;

    const stopHeroAnimation = () => {
      if (heroAnimationFrame) window.cancelAnimationFrame(heroAnimationFrame);
      heroAnimationFrame = 0;
      heroLastTime = 0;
    };

    const scheduleHeroAnimation = () => {
      if (!canAnimateHero() || heroAnimationFrame) return;
      heroAnimationFrame = window.requestAnimationFrame((time) => {
        heroAnimationFrame = 0;
        drawHero(time);
        scheduleHeroAnimation();
      });
    };

    const handleVisibility = () => {
      documentVisible = !document.hidden;
      if (documentVisible) {
        drawHero(performance.now());
        scheduleHeroAnimation();
        scheduleMouseAnimation();
      } else {
        stopHeroAnimation();
        stopMouseAnimation();
      }
    };

    const handleResize = () => {
      resize();
      drawHero(performance.now());
    };

    const observer = new IntersectionObserver(([entry]) => {
      heroVisible = entry?.isIntersecting ?? true;
      if (heroVisible) {
        drawHero(performance.now());
        scheduleHeroAnimation();
      } else {
        stopHeroAnimation();
      }
    }, { threshold: 0.05 });

    resize();
    drawHero(performance.now());
    scheduleHeroAnimation();
    refreshThemeRef.current = () => {
      buildDotLayer();
      drawHero(performance.now());
      scheduleMouseAnimation();
    };
    pauseAnimationRef.current = stopHeroAnimation;
    resumeAnimationRef.current = () => {
      drawHero(performance.now());
      scheduleHeroAnimation();
    };
    observer.observe(hero);
    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    hero.addEventListener("pointermove", onHeroPointerMove, { passive: true });
    window.addEventListener("blur", stopMouseTrail, { passive: true });
    document.addEventListener("mouseleave", stopMouseTrail, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      stopHeroAnimation();
      stopMouseAnimation();
      window.clearTimeout(mouseIdleTimeout);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointermove", onHeroPointerMove);
      window.removeEventListener("blur", stopMouseTrail);
      document.removeEventListener("mouseleave", stopMouseTrail);
      document.removeEventListener("visibilitychange", handleVisibility);
      pauseAnimationRef.current = null;
      resumeAnimationRef.current = null;
      refreshThemeRef.current = null;
      clearCanvas(heroContext, heroCanvas);
      clearCanvas(pointerContext, pointerCanvas);
    };
  }, [heroRef, heroCanvasRef, pointerCanvasRef]);
}
