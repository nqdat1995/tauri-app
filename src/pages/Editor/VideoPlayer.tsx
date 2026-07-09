/**
 * VideoPlayer — Video playback with draggable subtitle + overlay items
 * Bounds are enforced to the actual video area (not letterbox).
 *
 * Subtitle uses percentage-based positioning (immune to viewport size changes).
 * Overlays use design-coordinate conversion via viewport utilities.
 */
import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { Rnd } from "react-rnd";
import { useEditorStore, useActiveCue } from "./store";
import { OVERLAY_TYPES } from "./constants";
import { updateViewport } from "./viewport/viewport";
import { projectToScreen, screenToProject, scaleFontSize } from "./viewport/convert";
import type { Viewport } from "./viewport/types";

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(ms).padStart(2,"0")}`;
}

const SNAP_PX = 12;
function snap(x: number, y: number, iw: number, ih: number, bw: number, bh: number) {
  const cx = (bw - iw) / 2, cy = (bh - ih) / 2;
  return { x: Math.abs(x - cx) < SNAP_PX ? cx : x, y: Math.abs(y - cy) < SNAP_PX ? cy : y };
}

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boundsRef = useRef<HTMLDivElement>(null);
  const mirrorCanvasRefs = useRef<Map<string, { canvas: HTMLCanvasElement; item: { x: number; y: number; w: number; h: number; rotate180: boolean } }>>(new Map());
  const mirrorAnimRef = useRef<number>(0);
  const [muted, setMuted] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ containerWidth: 0, containerHeight: 0, displayWidth: 0, displayHeight: 0, offsetX: 0, offsetY: 0, scaleX: 0, scaleY: 0 });
  const [guides, setGuides] = useState(false);
  // Subtitle position as PERCENTAGE (0–100) of bounds. Immune to viewport changes.
  const [subPct, setSubPct] = useState({ xPct: 10, yPct: 80 });

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

  // Derive bounds from viewport
  const bounds = useMemo(() => ({ w: viewport.displayWidth, h: viewport.displayHeight }), [viewport]);

  // Calculate viewport using the viewport utility
  const recalcViewport = useCallback(() => {
    const v = videoRef.current;
    const container = boundsRef.current?.parentElement;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const videoAspect = (v && v.videoWidth) ? (v.videoWidth / v.videoHeight) : (16 / 9);
    const vp = updateViewport(cw, ch, videoAspect);
    setViewport(vp);
    const b = boundsRef.current;
    if (b) {
      b.style.width = `${vp.displayWidth}px`;
      b.style.height = `${vp.displayHeight}px`;
      b.style.left = `${vp.offsetX}px`;
      b.style.top = `${vp.offsetY}px`;
    }
  }, []);

  useEffect(() => { const v = videoRef.current; if (!v) return; v.addEventListener("loadedmetadata", recalcViewport); window.addEventListener("resize", recalcViewport); return () => { v.removeEventListener("loadedmetadata", recalcViewport); window.removeEventListener("resize", recalcViewport); }; }, [recalcViewport]);
  useEffect(() => { recalcViewport(); }, [recalcViewport]);
  useEffect(() => { const handler = () => { recalcViewport(); setTimeout(recalcViewport, 100); setTimeout(recalcViewport, 300); }; document.addEventListener("fullscreenchange", handler); return () => document.removeEventListener("fullscreenchange", handler); }, [recalcViewport]);
  useEffect(() => { const container = boundsRef.current?.parentElement; if (!container) return; const ro = new ResizeObserver(() => { recalcViewport(); }); ro.observe(container); return () => ro.disconnect(); }, [recalcViewport]);

  // Mirror effect
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let running = true;
    const drawMirrors = () => {
      if (!running) return;
      mirrorCanvasRefs.current.forEach(({ canvas, item: pos }) => {
        if (!canvas || !v.videoWidth) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const cw = canvas.width, ch = canvas.height;
        const srcX = (pos.x / 1920) * v.videoWidth;
        const srcY = Math.max(0, (pos.y / 1080) * v.videoHeight - (pos.h / 1080) * v.videoHeight);
        const srcW = (pos.w / 1920) * v.videoWidth;
        const srcH = (pos.h / 1080) * v.videoHeight;
        ctx.save();
        if (pos.rotate180) { ctx.translate(cw, ch); ctx.scale(-1, -1); }
        ctx.drawImage(v, srcX, srcY, srcW, srcH, 0, 0, cw, ch);
        ctx.restore();
      });
      mirrorAnimRef.current = requestAnimationFrame(drawMirrors);
    };
    drawMirrors();
    return () => { running = false; cancelAnimationFrame(mirrorAnimRef.current); };
  }, []);

  useEffect(() => { const v = videoRef.current; if (!v) return; const t = () => setCurrentTime(v.currentTime); const e = () => setPlaying(false); v.addEventListener("timeupdate", t); v.addEventListener("ended", e); return () => { v.removeEventListener("timeupdate", t); v.removeEventListener("ended", e); }; }, [setCurrentTime, setPlaying]);

  const playPause = useCallback(() => { const v = videoRef.current; if (v) { if (isPlaying) v.pause(); else v.play().catch(()=>{}); } setPlaying(!isPlaying); }, [isPlaying, setPlaying]);
  const skipPrev = useCallback(() => { const t = Math.max(0, currentTime-3); seekTo(t); if(videoRef.current) videoRef.current.currentTime=t; }, [currentTime, seekTo]);
  const skipNext = useCallback(() => { const t = Math.min(duration, currentTime+3); seekTo(t); if(videoRef.current) videoRef.current.currentTime=t; }, [currentTime, duration, seekTo]);
  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); const t = Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*duration; seekTo(t); if(videoRef.current) videoRef.current.currentTime=t; }, [duration, seekTo]);
  const toggleFS = useCallback(() => { const el = boundsRef.current?.closest(".video-player"); if (!el) return; if (document.fullscreenElement) document.exitFullscreen(); else (el as HTMLElement).requestFullscreen().catch(()=>{}); }, []);

  const visibleOverlays = overlayItems.filter((i) => {
    if (!i.enabled) return false;
    if (i.type === "text") {
      const cfg = i.config as Record<string, unknown>;
      const startTime = (cfg.startTime as number) ?? 0;
      const endTime = (cfg.endTime as number) ?? Infinity;
      if (currentTime < startTime || currentTime >= endTime) return false;
    }
    return true;
  });

  // Subtitle font size: proportional to viewport height. Range 5–72 design, * 2 for visual compat.
  const clampedFontSize = Math.max(5, Math.min(72, activeStyle.fontSize));
  const scaledSubFontSize = Math.max(4, Math.round(bounds.h * (clampedFontSize / 1080) * 2));

  const subStyle: React.CSSProperties = activeCue ? {
    fontFamily: activeStyle.fontFamily, fontSize: `${scaledSubFontSize}px`, color: activeStyle.textColor,
    backgroundColor: activeStyle.bgShape!=="none" ? `${activeStyle.bgColor}${Math.round((activeStyle.bgOpacity/100)*255).toString(16).padStart(2,"0")}` : "transparent",
    borderRadius: activeStyle.bgShape==="rounded"?"6px":activeStyle.bgShape==="box"?"3px":"0",
    padding: activeStyle.bgShape!=="none"?"6px 18px":"4px",
    textShadow: activeStyle.bgShape==="none"?"0 1px 3px rgba(0,0,0,0.8)":"none",
    maxWidth:"100%", overflow:"hidden",
    whiteSpace:"pre-wrap", wordBreak:"break-word",
    fontWeight:600, pointerEvents:"none", userSelect:"none",
    lineHeight: "1.4", textAlign: "center",
  } : {};

  // Subtitle drag handler (converts pixels to percentage on drop)
  const handleSubDragStart = useCallback(() => setGuides(true), []);
  const handleSubDragStop = useCallback((_e: unknown, d: { x: number; y: number }) => {
    if (bounds.w <= 0 || bounds.h <= 0) return;
    const subW = bounds.w * 0.8;
    const subH = Math.max(scaledSubFontSize * 2, 30);
    const snapped = snap(d.x, d.y, subW, subH, bounds.w, bounds.h);
    setSubPct({ xPct: (snapped.x / bounds.w) * 100, yPct: (snapped.y / bounds.h) * 100 });
    setGuides(false);
  }, [bounds, scaledSubFontSize]);

  return (
    <div className="video-player">
      <div className="video-player__viewport">
        {project?.videoPath ? <video ref={videoRef} src={project.videoPath} className="video-player__video" crossOrigin="anonymous" onClick={playPause} /> : <div className="video-player__placeholder" onClick={playPause}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><polygon points="5 3 19 12 5 21" fill="rgba(255,255,255,0.3)"/></svg></div>}

        {/* Bounds div — positioned exactly over video display area */}
        <div ref={boundsRef} className="video-player__bounds">
          {guides && <div className="video-player__guides"><div className="video-player__guide-h"/><div className="video-player__guide-v"/></div>}

          {/* Overlays */}
          {bounds.w > 0 && visibleOverlays.map((item) => {
            const ti = OVERLAY_TYPES.find(t=>t.type===item.type);
            const cfg = item.config as Record<string,unknown>;
            const screenPos = projectToScreen({ x: item.position.x, y: item.position.y }, viewport);
            const x = screenPos.x, y = screenPos.y;
            const screenSize = projectToScreen({ x: item.size.width, y: item.size.height }, viewport);
            const w = Math.max(30, screenSize.x), h = Math.max(30, screenSize.y);
            if(isNaN(x)||isNaN(y)) return null;
            const isText=item.type==="text";
            const resizeCfg = isText ? false : { top:false,right:false,bottom:false,left:false,topRight:false,bottomRight:true,bottomLeft:false,topLeft:false };
            const rndW = isText ? "auto" : w;
            const rndH = isText ? "auto" : h;

            let visual: React.ReactNode;
            if(item.type==="background_overlay") visual=<div className="ob-fill" style={{backgroundColor:`${cfg.color??"#000"}${Math.round(((cfg.opacity as number??50)/100)*255).toString(16).padStart(2,"0")}`}}/>;
            else if(item.type==="blur") visual=<div className="ob-fill" style={{backdropFilter:`blur(${(cfg.opacity as number??30)/10}px)`,WebkitBackdropFilter:`blur(${(cfg.opacity as number??30)/10}px)`,backgroundColor:`${cfg.color??"#000"}22`}}/>;
            else if(item.type==="mirror") visual=<div className="ob-fill ob-mirror" style={{overflow:"hidden"}}><canvas ref={(el)=>{if(el){el.width=Math.round(w);el.height=Math.round(h);mirrorCanvasRefs.current.set(item.id,{canvas:el,item:{x:item.position.x,y:item.position.y,w:item.size.width,h:item.size.height,rotate180:!!(cfg.rotate180)}});}else{mirrorCanvasRefs.current.delete(item.id);}}} style={{width:"100%",height:"100%",display:"block"}} /></div>;
            else if(isText) {
              const bgShape = (cfg.bgShape as string) ?? "rounded";
              const bgColor = (cfg.bgColor as string) ?? "#000000";
              const bgOpacity = (cfg.bgOpacity as number) ?? 70;
              const bgStyle: React.CSSProperties = bgShape !== "none" ? {
                backgroundColor: `${bgColor}${Math.round((bgOpacity/100)*255).toString(16).padStart(2,"0")}`,
                borderRadius: bgShape === "rounded" ? "6px" : "3px",
              } : {};
              const textFontSize = scaleFontSize((cfg.fontSize as number) ?? 18, viewport, 12);
              visual=<div className="ob-text" style={{fontSize:`${textFontSize}px`,color:(cfg.color as string)??"#fff",padding:"4px 10px",...bgStyle}}>{(cfg.text as string)||"Văn bản"}</div>;
            }
            else { const p=cfg.path as string; const opacity=(cfg.opacity as number ?? 100)/100; visual=p?<img src={p} className="ob-img" style={{opacity}} alt=""/>:<div className="ob-placeholder">{ti?.icon} {ti?.label}</div>; }

            return (
              <Rnd key={`${item.id}-${Math.round(bounds.w)}`} position={{x,y}} size={{width:rndW,height:rndH}} bounds="parent" enableResizing={resizeCfg} lockAspectRatio={item.type==="logo"||item.type==="watermark"}
                onDragStart={()=>setGuides(true)}
                onDragStop={(_e,d)=>{
                  const s=snap(d.x,d.y,typeof rndW==="number"?rndW:w,typeof rndH==="number"?rndH:h,bounds.w,bounds.h);
                  const designPos = screenToProject({ x: s.x, y: s.y }, viewport);
                  updateOverlay(item.id,{position:{x:designPos.x,y:designPos.y}});
                  setGuides(false);
                }}
                onResizeStop={(_e,_d,ref,_dl,pos)=>{
                  const designPos = screenToProject({ x: pos.x, y: pos.y }, viewport);
                  const designSize = screenToProject({ x: parseInt(ref.style.width), y: parseInt(ref.style.height) }, viewport);
                  updateOverlay(item.id,{size:{width:designSize.x,height:designSize.y},position:{x:designPos.x,y:designPos.y}});
                  setGuides(false);
                }}
                className={`ov-item ${isText?"ov-item--text":""} ${(item.type==="logo"||item.type==="watermark")?"ov-item--media":""}`}>
                {visual}
                {!isText && <div className="ov-resize-handle"/>}
              </Rnd>
            );
          })}

          {/* Subtitle — percentage-based position, no react-rnd caching issues */}
          {activeCue && bounds.w > 0 && (() => {
            // Convert percentage to pixels for current bounds
            const subX = (subPct.xPct / 100) * bounds.w;
            const subY = (subPct.yPct / 100) * bounds.h;
            const subW = bounds.w * 0.8;
            const subH = Math.max(scaledSubFontSize * 2, 30);
            return (
              <Rnd
                key={`sub-${Math.round(bounds.w)}-${Math.round(bounds.h)}`}
                position={{ x: subX, y: subY }}
                size={{ width: subW, height: subH }}
                bounds="parent"
                enableResizing={false}
                onDragStart={handleSubDragStart}
                onDragStop={handleSubDragStop}
                className="vp-sub-rnd"
              >
                <div style={subStyle} className="vp-sub-text">{activeCue.translatedText}</div>
              </Rnd>
            );
          })()}
        </div>
      </div>

      <div className="video-player__seekbar" onClick={seek}><div className="video-player__seekbar-track"><div className="video-player__seekbar-fill" style={{width:`${progress}%`}}/><div className="video-player__seekbar-handle" style={{left:`${progress}%`}}/></div></div>
      <div className="video-player__controls">
        <div className="video-player__controls-left">
          <button className="vp-btn" type="button" onClick={skipPrev}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
          <button className="vp-btn vp-btn--play" type="button" onClick={playPause}>{isPlaying?<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}</button>
          <button className="vp-btn" type="button" onClick={skipNext}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
          <span className="video-player__time">{fmt(currentTime)} / {fmt(duration)}</span>
        </div>
        <div className="video-player__controls-right">
          <button className="vp-btn" type="button" onClick={()=>setMuted(m=>{if(videoRef.current)videoRef.current.muted=!m;return !m;})}>{muted?<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>}</button>
          <button className="vp-btn" type="button" onClick={toggleFS}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
        </div>
      </div>
    </div>
  );
}
