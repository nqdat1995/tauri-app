/**
 * VideoPlayer — Video playback with draggable subtitle + overlay items
 * Bounds are enforced to the actual video area (not letterbox).
 */
import { useRef, useCallback, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { useEditorStore, useActiveCue } from "./store";
import { OVERLAY_TYPES } from "./constants";

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
  const mirrorRefs = useRef<Set<HTMLVideoElement>>(new Set());
  const [muted, setMuted] = useState(false);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });
  const [subPos, setSubPos] = useState({ x: 0, y: 0 });
  const [subInit, setSubInit] = useState(false);
  const [guides, setGuides] = useState(false);

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

  // Calculate actual video display area (accounting for object-fit: contain letterbox)
  const updateBounds = useCallback(() => {
    const v = videoRef.current;
    const container = boundsRef.current?.parentElement;
    if (!container) return;
    if (!v || !v.videoWidth) { setBounds({ w: container.clientWidth, h: container.clientHeight }); return; }
    const cw = container.clientWidth, ch = container.clientHeight;
    const vRatio = v.videoWidth / v.videoHeight;
    const cRatio = cw / ch;
    let dw: number, dh: number, dx: number, dy: number;
    if (vRatio > cRatio) { dw = cw; dh = cw / vRatio; dx = 0; dy = (ch - dh) / 2; }
    else { dh = ch; dw = ch * vRatio; dy = 0; dx = (cw - dw) / 2; }
    setBounds({ w: dw, h: dh });
    const b = boundsRef.current;
    if (b) { b.style.width = `${dw}px`; b.style.height = `${dh}px`; b.style.left = `${dx}px`; b.style.top = `${dy}px`; }
  }, []);

  useEffect(() => { const v = videoRef.current; if (!v) return; v.addEventListener("loadedmetadata", updateBounds); window.addEventListener("resize", updateBounds); return () => { v.removeEventListener("loadedmetadata", updateBounds); window.removeEventListener("resize", updateBounds); }; }, [updateBounds]);
  useEffect(() => { updateBounds(); }, [updateBounds]);
  // Bug fix: Recalculate bounds on fullscreen change
  useEffect(() => { const handler = () => { setTimeout(updateBounds, 50); }; document.addEventListener("fullscreenchange", handler); return () => document.removeEventListener("fullscreenchange", handler); }, [updateBounds]);
  // Sync mirror videos with main video
  useEffect(() => { const v = videoRef.current; if (!v) return; const sync = () => { mirrorRefs.current.forEach((m) => { if (Math.abs(m.currentTime - v.currentTime) > 0.3) m.currentTime = v.currentTime; }); }; const onPlay = () => mirrorRefs.current.forEach((m) => m.play().catch(()=>{})); const onPause = () => mirrorRefs.current.forEach((m) => m.pause()); const onSeek = () => mirrorRefs.current.forEach((m) => { m.currentTime = v.currentTime; }); v.addEventListener("timeupdate", sync); v.addEventListener("play", onPlay); v.addEventListener("pause", onPause); v.addEventListener("seeked", onSeek); return () => { v.removeEventListener("timeupdate", sync); v.removeEventListener("play", onPlay); v.removeEventListener("pause", onPause); v.removeEventListener("seeked", onSeek); }; }, []);
  useEffect(() => { if (bounds.w > 0 && !subInit) { setSubPos({ x: bounds.w * 0.1, y: bounds.h * 0.82 }); setSubInit(true); } }, [bounds, subInit]);
  useEffect(() => { const v = videoRef.current; if (!v) return; const t = () => setCurrentTime(v.currentTime); const e = () => setPlaying(false); v.addEventListener("timeupdate", t); v.addEventListener("ended", e); return () => { v.removeEventListener("timeupdate", t); v.removeEventListener("ended", e); }; }, [setCurrentTime, setPlaying]);

  const playPause = useCallback(() => { const v = videoRef.current; if (v) { if (isPlaying) v.pause(); else v.play().catch(()=>{}); } setPlaying(!isPlaying); }, [isPlaying, setPlaying]);
  const skipPrev = useCallback(() => { const t = Math.max(0, currentTime-3); seekTo(t); if(videoRef.current) videoRef.current.currentTime=t; }, [currentTime, seekTo]);
  const skipNext = useCallback(() => { const t = Math.min(duration, currentTime+3); seekTo(t); if(videoRef.current) videoRef.current.currentTime=t; }, [currentTime, duration, seekTo]);
  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); const t = Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*duration; seekTo(t); if(videoRef.current) videoRef.current.currentTime=t; }, [duration, seekTo]);
  const toggleFS = useCallback(() => { const el = boundsRef.current?.parentElement; if (!el) return; if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen().catch(()=>{}); }, []);

  const subStyle: React.CSSProperties = activeCue ? {
    fontFamily: activeStyle.fontFamily, fontSize: `${activeStyle.fontSize}px`, color: activeStyle.textColor,
    backgroundColor: activeStyle.bgShape!=="none" ? `${activeStyle.bgColor}${Math.round((activeStyle.bgOpacity/100)*255).toString(16).padStart(2,"0")}` : "transparent",
    borderRadius: activeStyle.bgShape==="rounded"?"6px":activeStyle.bgShape==="box"?"3px":"0",
    padding: activeStyle.bgShape!=="none"?"4px 14px":"4px",
    textShadow: activeStyle.bgShape==="none"?"0 1px 3px rgba(0,0,0,0.8)":"none",
    maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600, pointerEvents:"none", userSelect:"none",
  } : {};

  const visibleOverlays = overlayItems.filter((i) => i.enabled);
  const scaleX = bounds.w / 1920 || 0.001;
  const scaleY = bounds.h / 1080 || 0.001;

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
            const x=item.position.x*scaleX, y=item.position.y*scaleY;
            const w=Math.max(30,item.size.width*scaleX), h=Math.max(30,item.size.height*scaleY);
            if(isNaN(x)||isNaN(y)) return null;
            const isText=item.type==="text";
            const resizeCfg = isText ? false : { top:false,right:false,bottom:false,left:false,topRight:false,bottomRight:true,bottomLeft:false,topLeft:false };

            let visual: React.ReactNode;
            if(item.type==="background_overlay") visual=<div className="ob-fill" style={{backgroundColor:`${cfg.color??"#000"}${Math.round(((cfg.opacity as number??50)/100)*255).toString(16).padStart(2,"0")}`}}/>;
            else if(item.type==="blur") visual=<div className="ob-fill" style={{backdropFilter:`blur(${(cfg.opacity as number??30)/10}px)`,WebkitBackdropFilter:`blur(${(cfg.opacity as number??30)/10}px)`,backgroundColor:`${cfg.color??"#000"}22`}}/>;
            else if(item.type==="mirror") visual=<div className="ob-fill ob-mirror" style={{overflow:"hidden"}}>{project?.videoPath ? <video src={project.videoPath} className="ob-mirror-video" style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleY(-1)",opacity:0.7,pointerEvents:"none"}} muted autoPlay loop playsInline ref={(el)=>{if(el){mirrorRefs.current.add(el); if(videoRef.current){el.currentTime=videoRef.current.currentTime; if(!videoRef.current.paused) el.play().catch(()=>{});}} else {/* null ref = unmount, cleaned via Set iteration */}}} /> : <div style={{width:"100%",height:"100%",background:"rgba(91,68,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",color:"rgba(255,255,255,0.6)"}}>↕ Gương</div>}</div>;
            else if(isText) visual=<div className="ob-text" style={{fontSize:`${Math.max(12,(cfg.fontSize as number??18)*Math.max(scaleX,scaleY)*1.8)}px`,color:(cfg.color as string)??"#fff"}}>{(cfg.text as string)||"Văn bản"}</div>;
            else { const p=cfg.path as string; visual=p?<img src={p} className="ob-img" alt=""/>:<div className="ob-placeholder">{ti?.icon} {ti?.label}</div>; }

            return (
              <Rnd key={item.id} position={{x,y}} size={{width:w,height:h}} bounds="parent" enableResizing={resizeCfg} lockAspectRatio={item.type==="logo"||item.type==="watermark"}
                onDragStart={()=>setGuides(true)}
                onDragStop={(_e,d)=>{ const s=snap(d.x,d.y,w,h,bounds.w,bounds.h); updateOverlay(item.id,{position:{x:Math.round(s.x/scaleX),y:Math.round(s.y/scaleY)}}); setGuides(false); }}
                onResizeStop={(_e,_d,ref,_dl,pos)=>{ updateOverlay(item.id,{size:{width:Math.round(parseInt(ref.style.width)/scaleX),height:Math.round(parseInt(ref.style.height)/scaleY)},position:{x:Math.round(pos.x/scaleX),y:Math.round(pos.y/scaleY)}}); setGuides(false); }}
                className={`ov-item ${isText?"ov-item--text":""}`}>
                {visual}
                {!isText && <div className="ov-resize-handle"/>}
              </Rnd>
            );
          })}

          {/* Subtitle */}
          {activeCue && bounds.w > 0 && (
            <Rnd position={subPos} size={{width:bounds.w*0.8,height:50}} bounds="parent" enableResizing={false}
              onDragStart={()=>setGuides(true)} onDragStop={(_e,d)=>{ setSubPos(snap(d.x,d.y,bounds.w*0.8,50,bounds.w,bounds.h)); setGuides(false); }}
              className="vp-sub-rnd">
              <div style={subStyle} className="vp-sub-text">{activeCue.translatedText}</div>
            </Rnd>
          )}
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
