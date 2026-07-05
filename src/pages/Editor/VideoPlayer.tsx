/**
 * VideoPlayer — Video playback with draggable subtitle + overlay items
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

const SNAP_THRESHOLD = 8; // px distance to snap to center

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [vpSize, setVpSize] = useState({ w: 0, h: 0 });
  const [subPos, setSubPos] = useState({ x: 0, y: 0 });
  const [subInitialized, setSubInitialized] = useState(false);
  const [showGuides, setShowGuides] = useState(false);

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

  // Viewport size tracking
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setVpSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Init subtitle position at bottom-center
  useEffect(() => {
    if (vpSize.w > 0 && !subInitialized) {
      setSubPos({ x: vpSize.w * 0.1, y: vpSize.h * 0.82 });
      setSubInitialized(true);
    }
  }, [vpSize, subInitialized]);

  // Video events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onEnd = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    return () => { v.removeEventListener("timeupdate", onTime); v.removeEventListener("ended", onEnd); };
  }, [setCurrentTime, setPlaying]);

  const handlePlayPause = useCallback(() => {
    const v = videoRef.current;
    if (v) { if (isPlaying) v.pause(); else v.play().catch(() => {}); }
    setPlaying(!isPlaying);
  }, [isPlaying, setPlaying]);

  const handleSkipPrev = useCallback(() => { const t = Math.max(0, currentTime - 3); seekTo(t); if (videoRef.current) videoRef.current.currentTime = t; }, [currentTime, seekTo]);
  const handleSkipNext = useCallback(() => { const t = Math.min(duration, currentTime + 3); seekTo(t); if (videoRef.current) videoRef.current.currentTime = t; }, [currentTime, duration, seekTo]);

  const handleSeekbar = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
    seekTo(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [duration, seekTo]);

  // Subtitle style
  const subStyle: React.CSSProperties = activeCue ? {
    fontFamily: activeStyle.fontFamily,
    fontSize: `${activeStyle.fontSize}px`,
    color: activeStyle.textColor,
    backgroundColor: activeStyle.bgShape !== "none"
      ? `${activeStyle.bgColor}${Math.round((activeStyle.bgOpacity / 100) * 255).toString(16).padStart(2, "0")}`
      : "transparent",
    borderRadius: activeStyle.bgShape === "rounded" ? "6px" : activeStyle.bgShape === "box" ? "3px" : "0",
    padding: activeStyle.bgShape !== "none" ? "4px 14px" : "4px",
    textShadow: activeStyle.bgShape === "none" ? "0 1px 3px rgba(0,0,0,0.8)" : "none",
    maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    fontWeight: 600, pointerEvents: "none", userSelect: "none",
  } : {};

  // Snap-to-center logic for subtitle drag
  const handleSubDrag = (_e: any, d: { x: number; y: number }) => {
    const subW = vpSize.w * 0.8;
    const centerX = (vpSize.w - subW) / 2;
    const centerY = (vpSize.h - 50) / 2;
    let x = d.x, y = d.y;
    if (Math.abs(x - centerX) < SNAP_THRESHOLD) x = centerX;
    if (Math.abs(y - centerY) < SNAP_THRESHOLD) y = centerY;
    setSubPos({ x, y });
    setShowGuides(false);
  };

  const visibleOverlays = overlayItems.filter((i) => i.enabled);

  return (
    <div className="video-player">
      {/* Viewport */}
      <div className="video-player__viewport" ref={viewportRef}>
        {project?.videoPath ? (
          <video ref={videoRef} src={project.videoPath} className="video-player__video" crossOrigin="anonymous" onClick={handlePlayPause} />
        ) : (
          <div className="video-player__placeholder" onClick={handlePlayPause}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" fill="rgba(255,255,255,0.3)"/></svg>
          </div>
        )}

        {/* Center guides (shown during drag) */}
        {showGuides && (
          <div className="video-player__guides">
            <div className="video-player__guide-h" />
            <div className="video-player__guide-v" />
          </div>
        )}

        {/* Overlay items — all as draggable/resizable boxes */}
        {vpSize.w > 0 && visibleOverlays.map((item) => (
          <OverlayBox key={item.id} item={item} vpW={vpSize.w} vpH={vpSize.h} onUpdate={updateOverlay} />
        ))}

        {/* Draggable subtitle */}
        {activeCue && vpSize.w > 0 && (
          <Rnd
            position={subPos}
            size={{ width: vpSize.w * 0.8, height: 50 }}
            bounds="parent"
            enableResizing={false}
            onDragStart={() => setShowGuides(true)}
            onDragStop={handleSubDrag}
            className="video-player__subtitle-rnd"
          >
            <div style={subStyle} className="video-player__subtitle-text">
              {activeCue.translatedText}
            </div>
          </Rnd>
        )}
      </div>

      {/* Seekbar */}
      <div className="video-player__seekbar" onClick={handleSeekbar}>
        <div className="video-player__seekbar-track">
          <div className="video-player__seekbar-fill" style={{ width: `${progress}%` }} />
          <div className="video-player__seekbar-handle" style={{ left: `${progress}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="video-player__controls">
        <div className="video-player__controls-left">
          <button className="vp-btn" type="button" onClick={handleSkipPrev} title="Lùi 3s"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
          <button className="vp-btn vp-btn--play" type="button" onClick={handlePlayPause}>{isPlaying ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}</button>
          <button className="vp-btn" type="button" onClick={handleSkipNext} title="Tiến 3s"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
          <span className="video-player__time">{formatTimeMs(currentTime)} / {formatTimeMs(duration)}</span>
        </div>
        <div className="video-player__controls-right">
          <button className="vp-btn" type="button" onClick={() => setMuted(m => { if(videoRef.current) videoRef.current.muted=!m; return !m; })}>{muted ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>}</button>
          <button className="vp-btn" type="button" title="Toàn màn hình"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
        </div>
      </div>
    </div>
  );
}

// ─── Overlay Box (all types are draggable/resizable) ─────────────

function OverlayBox({ item, vpW, vpH, onUpdate }: { item: OverlayItem; vpW: number; vpH: number; onUpdate: (id: string, u: Partial<OverlayItem>) => void }) {
  const typeInfo = OVERLAY_TYPES.find((t) => t.type === item.type);
  const scaleX = vpW / 1920;
  const scaleY = vpH / 1080;
  const x = item.position.x * scaleX;
  const y = item.position.y * scaleY;
  const w = Math.max(30, item.size.width * scaleX);
  const h = Math.max(30, item.size.height * scaleY);

  if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) return null;

  // Render visual effect inside the box
  let visual: React.ReactNode = <span className="overlay-viewport__item-label">{typeInfo?.icon} {typeInfo?.label}</span>;
  const cfg = item.config as Record<string, unknown>;

  if (item.type === "background_overlay") {
    visual = <div style={{ width: "100%", height: "100%", backgroundColor: `${cfg.color ?? "#000"}${Math.round(((cfg.opacity as number ?? 50) / 100) * 255).toString(16).padStart(2, "0")}`, borderRadius: 4 }} />;
  } else if (item.type === "blur") {
    visual = <div style={{ width: "100%", height: "100%", backdropFilter: `blur(${(cfg.opacity as number ?? 30) / 10}px)`, WebkitBackdropFilter: `blur(${(cfg.opacity as number ?? 30) / 10}px)`, backgroundColor: `${cfg.color ?? "#000"}22`, borderRadius: 4 }} />;
  } else if (item.type === "mirror") {
    visual = <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(91,68,255,0.15), rgba(59,130,246,0.15))", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>🪞 Gương</div>;
  } else if (item.type === "text") {
    visual = <span style={{ fontSize: `${Math.max(10, (cfg.fontSize as number ?? 18) * scaleX)}px`, color: (cfg.color as string) ?? "#fff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(cfg.text as string) || "Văn bản"}</span>;
  } else if (item.type === "logo" || item.type === "watermark") {
    const path = cfg.path as string;
    visual = path ? <img src={path} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt={item.type} /> : <span className="overlay-viewport__item-label">{typeInfo?.icon} {typeInfo?.label}</span>;
  }

  return (
    <Rnd
      position={{ x, y }}
      size={{ width: w, height: h }}
      bounds="parent"
      onDragStop={(_e, d) => onUpdate(item.id, { position: { x: Math.round(d.x / scaleX), y: Math.round(d.y / scaleY) } })}
      onResizeStop={(_e, _dir, ref, _delta, pos) => onUpdate(item.id, {
        size: { width: Math.round(parseInt(ref.style.width, 10) / scaleX), height: Math.round(parseInt(ref.style.height, 10) / scaleY) },
        position: { x: Math.round(pos.x / scaleX), y: Math.round(pos.y / scaleY) },
      })}
      className="overlay-viewport__item"
    >
      {visual}
    </Rnd>
  );
}
