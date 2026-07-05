/**
 * VideoPlayer — Video playback with draggable subtitle overlay + overlay viewport
 * FR-ED-02: Video Playback
 * FR-ED-03: Subtitle Overlay on Video (draggable)
 * FR-ED-09: Overlay items rendered on viewport
 */

import { useRef, useCallback, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { useEditorStore, useActiveCue } from "./store";
import { OVERLAY_TYPES } from "./constants";
import type { OverlayItem } from "./types";

function formatTimeMs(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [subtitlePos, setSubtitlePos] = useState({ x: 0, y: 0 });
  const [subtitlePosInitialized, setSubtitlePosInitialized] = useState(false);

  const project = useEditorStore((s) => s.project);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const activeStyle = useEditorStore((s) => s.activeStyle);
  const overlayItems = useEditorStore((s) => s.overlays.items);
  const updateOverlay = useEditorStore((s) => s.updateOverlay);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const seekTo = useEditorStore((s) => s.seekTo);
  const setPlaying = useEditorStore((s) => s.setPlaying);

  const activeCue = useActiveCue();
  const duration = project?.duration ?? 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Track viewport size
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Initialize subtitle position to bottom-center when viewport size known
  useEffect(() => {
    if (viewportSize.width > 0 && !subtitlePosInitialized) {
      setSubtitlePos({ x: viewportSize.width * 0.1, y: viewportSize.height * 0.8 });
      setSubtitlePosInitialized(true);
    }
  }, [viewportSize, subtitlePosInitialized]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onEnded = () => setPlaying(false);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [setCurrentTime, setPlaying]);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) { video.pause(); } else { video.play().catch(() => {}); }
    }
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  const handleSkipPrev = useCallback(() => {
    const t = Math.max(0, currentTime - 3);
    seekTo(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [currentTime, seekTo]);

  const handleSkipNext = useCallback(() => {
    const t = Math.min(duration, currentTime + 3);
    seekTo(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [currentTime, duration, seekTo]);

  const handleSeekbarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = ratio * duration;
    seekTo(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [duration, seekTo]);

  const handleVolumeToggle = useCallback(() => {
    setMuted((m) => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  }, []);

  // Build subtitle overlay style
  const subtitleStyle: React.CSSProperties = activeCue ? {
    fontFamily: activeStyle.fontFamily,
    fontSize: `${activeStyle.fontSize}px`,
    color: activeStyle.textColor,
    backgroundColor: activeStyle.bgShape !== "none"
      ? `${activeStyle.bgColor}${Math.round((activeStyle.bgOpacity / 100) * 255).toString(16).padStart(2, "0")}`
      : "transparent",
    borderRadius: activeStyle.bgShape === "rounded" ? "6px" : activeStyle.bgShape === "box" ? "3px" : "0",
    padding: activeStyle.bgShape !== "none" ? "4px 14px" : "4px",
    textShadow: activeStyle.bgShape === "none" ? "0 1px 3px rgba(0,0,0,0.8)" : "none",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 600,
    pointerEvents: "none",
    userSelect: "none",
  } : {};

  // Visible overlay items (enabled, not background/mirror which are full-screen effects)
  const visibleOverlays = overlayItems.filter((item) => item.enabled);

  return (
    <div className="video-player" data-testid="video-player">
      {/* Viewport — contains video + draggable subtitle + overlays */}
      <div className="video-player__viewport" ref={viewportRef} data-testid="video-player-viewport">
        {/* Video */}
        {project?.videoPath ? (
          <video
            ref={videoRef}
            src={project.videoPath}
            className="video-player__video"
            crossOrigin="anonymous"
            onClick={handlePlayPause}
          />
        ) : (
          <div className="video-player__placeholder" onClick={handlePlayPause}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" fill="rgba(255,255,255,0.3)"/></svg>
          </div>
        )}

        {/* Overlay items rendered on viewport */}
        {viewportSize.width > 0 && visibleOverlays.map((item) => (
          <OverlayItemView
            key={item.id}
            item={item}
            containerWidth={viewportSize.width}
            containerHeight={viewportSize.height}
            onUpdate={updateOverlay}
          />
        ))}

        {/* Draggable subtitle overlay */}
        {activeCue && viewportSize.width > 0 && (
          <Rnd
            position={subtitlePos}
            size={{ width: viewportSize.width * 0.8, height: 50 }}
            bounds="parent"
            enableResizing={false}
            onDragStop={(_e, d) => setSubtitlePos({ x: d.x, y: d.y })}
            className="video-player__subtitle-rnd"
            data-testid="video-player-subtitle-drag"
          >
            <div style={subtitleStyle} className="video-player__subtitle-text">
              {activeCue.translatedText}
            </div>
          </Rnd>
        )}
      </div>

      {/* Seekbar */}
      <div className="video-player__seekbar" onClick={handleSeekbarClick} data-testid="video-player-seekbar">
        <div className="video-player__seekbar-track">
          <div className="video-player__seekbar-fill" style={{ width: `${progress}%` }} />
          <div className="video-player__seekbar-handle" style={{ left: `${progress}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="video-player__controls">
        <div className="video-player__controls-left">
          <button className="vp-btn" type="button" onClick={handleSkipPrev} title="Lùi 3s">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button className="vp-btn vp-btn--play" type="button" onClick={handlePlayPause} title={isPlaying ? "Tạm dừng" : "Phát"}>
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="vp-btn" type="button" onClick={handleSkipNext} title="Tiến 3s">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
          <span className="video-player__time">
            {formatTimeMs(currentTime)} / {formatTimeMs(duration)}
          </span>
        </div>
        <div className="video-player__controls-right">
          <button className="vp-btn" type="button" onClick={handleVolumeToggle} title="Âm lượng">
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>
          <button className="vp-btn" type="button" title="Phụ đề">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/></svg>
          </button>
          <button className="vp-btn" type="button" title="Toàn màn hình">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Individual Overlay Item View ────────────────────────────────

function OverlayItemView({ item, containerWidth, containerHeight, onUpdate }: {
  item: OverlayItem;
  containerWidth: number;
  containerHeight: number;
  onUpdate: (id: string, updates: Partial<OverlayItem>) => void;
}) {
  if (containerWidth === 0) return null;

  const typeInfo = OVERLAY_TYPES.find((t) => t.type === item.type);
  const scaleX = containerWidth / 1920;
  const scaleY = containerHeight / 1080;

  // Full-screen effects: background overlay, blur, mirror
  if (item.type === "background_overlay") {
    const cfg = item.config as { color?: string; opacity?: number };
    return (
      <div
        className="overlay-viewport__fullscreen"
        style={{
          backgroundColor: `${cfg.color ?? "#000"}${Math.round(((cfg.opacity ?? 50) / 100) * 255).toString(16).padStart(2, "0")}`,
        }}
        data-testid={`overlay-view-${item.id}`}
      />
    );
  }

  if (item.type === "blur") {
    const cfg = item.config as { color?: string; opacity?: number };
    return (
      <div
        className="overlay-viewport__fullscreen"
        style={{
          backdropFilter: `blur(${(cfg.opacity ?? 30) / 10}px)`,
          WebkitBackdropFilter: `blur(${(cfg.opacity ?? 30) / 10}px)`,
          backgroundColor: `${cfg.color ?? "#000"}${Math.round(((cfg.opacity ?? 30) / 100) * 80).toString(16).padStart(2, "0")}`,
        }}
        data-testid={`overlay-view-${item.id}`}
      />
    );
  }

  if (item.type === "mirror") {
    return (
      <div
        className="overlay-viewport__fullscreen"
        style={{ transform: "scaleX(-1)", opacity: 0.3 }}
        data-testid={`overlay-view-${item.id}`}
      />
    );
  }

  // Draggable/resizable items: text, logo, watermark
  const x = item.position.x * scaleX;
  const y = item.position.y * scaleY;
  const w = Math.max(20, item.size.width * scaleX);
  const h = Math.max(20, item.size.height * scaleY);

  if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) return null;

  let content: React.ReactNode = <span>{typeInfo?.icon} {typeInfo?.label}</span>;
  if (item.type === "text") {
    const cfg = item.config as { text?: string; fontSize?: number; color?: string };
    content = (
      <span style={{ fontSize: `${(cfg.fontSize ?? 18) * scaleX}px`, color: cfg.color ?? "#fff" }}>
        {cfg.text || "Văn bản"}
      </span>
    );
  }

  return (
    <Rnd
      position={{ x, y }}
      size={{ width: w, height: h }}
      bounds="parent"
      onDragStop={(_e, d) => {
        onUpdate(item.id, { position: { x: Math.round(d.x / scaleX), y: Math.round(d.y / scaleY) } });
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        onUpdate(item.id, {
          size: { width: Math.round(parseInt(ref.style.width, 10) / scaleX), height: Math.round(parseInt(ref.style.height, 10) / scaleY) },
          position: { x: Math.round(pos.x / scaleX), y: Math.round(pos.y / scaleY) },
        });
      }}
      className="overlay-viewport__item"
      data-testid={`overlay-rnd-${item.id}`}
    >
      <div className="overlay-viewport__item-label">{content}</div>
    </Rnd>
  );
}
