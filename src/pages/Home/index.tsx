import { useEffect, useMemo, useRef, useState } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { Header } from "../../components/Header.tsx";
import { UploadCard } from "../../components/UploadCard.tsx";
import { enqueueJob, cancelPendingJobs, chooseVideoFiles, isTauriAvailable, getFileMetadata, toAssetUrl } from "../../lib/tauri";
import type { JobEvent, QueueJobRequest } from "../../lib/types";
import { OptionPanel, OutputOption, LanguageOption } from "../../components/OptionPanel.tsx";

interface SelectedVideo {
  id: string;
  name: string;
  size: number;
  type: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
  previewUrl: string;
  sourcePath: string;
}

interface RejectedFile {
  id: string;
  name: string;
  reason: string;
}

function getSourcePath(file: File) {
  const fileWithPath = file as File & {
    path?: string;
    webkitPath?: string;
    nativePath?: string;
    filePath?: string;
  };

  return (
    fileWithPath.path ??
    fileWithPath.webkitPath ??
    fileWithPath.nativePath ??
    fileWithPath.filePath ??
    file.name
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return "00:00";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function Home() {
  const [selectedVideos, setSelectedVideos] = useState<SelectedVideo[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);
  const [jobs, setJobs] = useState<JobEvent[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [language, setLanguage] = useState<LanguageOption>("chinese");
  const [output, setOutput] = useState<OutputOption>("subtitle");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedCount = selectedVideos.length;
  const totalDuration = useMemo(
    () => selectedVideos.reduce((sum, video) => sum + (video.duration ?? 0), 0),
    [selectedVideos]
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const validFiles: SelectedVideo[] = [];
    const invalidFiles: RejectedFile[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("video/")) {
        invalidFiles.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          reason: "Unsupported file type",
        });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const { duration, thumbnail, width, height, invalidReason } = await new Promise<{
        duration?: number;
        thumbnail?: string;
        width?: number;
        height?: number;
        invalidReason?: string;
      }>((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = previewUrl;

        const cleanup = () => {
          video.pause();
          video.removeAttribute("src");
          video.load();
          video.remove();
        };

        const timeoutId = window.setTimeout(() => {
          cleanup();
          resolve({ invalidReason: "Unable to read video metadata" });
        }, 7000);

        video.onloadedmetadata = () => {
          const dur = video.duration;
          const width = video.videoWidth || undefined;
          const height = video.videoHeight || undefined;
          const seekTo = Math.min(1, dur / 2 || 0);
          const capture = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = Math.min(320, video.videoWidth || 320);
              canvas.height = Math.round((canvas.width / (video.videoWidth || 320)) * (video.videoHeight || 180));
              const ctx = canvas.getContext("2d");
              if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL("image/png");
              window.clearTimeout(timeoutId);
              cleanup();
              resolve({ duration: dur, thumbnail: dataUrl, width, height });
            } catch (e) {
              window.clearTimeout(timeoutId);
              cleanup();
              resolve({ duration: dur, width, height });
            }
          };

          const onseek = () => {
            capture();
            video.removeEventListener("seeked", onseek);
          };

          try {
            video.currentTime = seekTo;
            video.addEventListener("seeked", onseek);
            setTimeout(() => {
              if (!video.readyState || video.readyState < 2) return;
              capture();
            }, 700);
          } catch (e) {
            window.clearTimeout(timeoutId);
            cleanup();
            resolve({ duration: dur });
          }
        };

        video.onerror = () => {
          window.clearTimeout(timeoutId);
          cleanup();
          resolve({ invalidReason: "Unsupported or corrupted video file" });
        };
      });

      if (invalidReason) {
        URL.revokeObjectURL(previewUrl);
        invalidFiles.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          reason: invalidReason,
        });
        continue;
      }

      validFiles.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        type: file.type,
        duration,
        width,
        height,
        thumbnail,
        previewUrl,
        sourcePath: getSourcePath(file),
      });
    }

    setSelectedVideos((prev) => [...prev, ...validFiles]);
    setRejectedFiles((prev) => [...prev, ...invalidFiles]);
  };

  const handleChooseFiles = async () => {
    if (isTauriAvailable()) {
      try {
        const selected = await chooseVideoFiles();
        if (selected.length === 0) {
          return;
        }

        const validFiles: SelectedVideo[] = [];
        const invalidFiles: RejectedFile[] = [];

        for (const filePath of selected) {
          const name = filePath.split(/[/\\]/).pop() ?? filePath;

          // Fetch file size from Rust
          let size = 0;
          try {
            const meta = await getFileMetadata(filePath);
            size = meta.size;
          } catch {
            // non-fatal — size stays 0
          }

          // Build an asset:// URL so the browser can load the local file
          let assetUrl = "";
          try {
            assetUrl = await toAssetUrl(filePath);
          } catch {
            // non-fatal — thumbnail/duration will be skipped
          }

          // Extract duration + thumbnail the same way handleFiles does
          const { duration, thumbnail, width, height, invalidReason } = await new Promise<{
            duration?: number;
            thumbnail?: string;
            width?: number;
            height?: number;
            invalidReason?: string;
          }>((resolve) => {
            if (!assetUrl) {
              resolve({});
              return;
            }

            const video = document.createElement("video");
            video.preload = "metadata";
            video.crossOrigin = "anonymous";
            video.src = assetUrl;

            const cleanup = () => {
              video.pause();
              video.removeAttribute("src");
              video.load();
              video.remove();
            };

            const timeoutId = window.setTimeout(() => {
              cleanup();
              resolve({ invalidReason: "Unable to read video metadata" });
            }, 10000);

            video.onloadedmetadata = () => {
              const dur = video.duration;
              const w = video.videoWidth || undefined;
              const h = video.videoHeight || undefined;
              const seekTo = Math.min(1, dur / 2 || 0);

              const capture = () => {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = Math.min(320, video.videoWidth || 320);
                  canvas.height = Math.round((canvas.width / (video.videoWidth || 320)) * (video.videoHeight || 180));
                  const ctx = canvas.getContext("2d");
                  if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL("image/png");
                  window.clearTimeout(timeoutId);
                  cleanup();
                  resolve({ duration: dur, thumbnail: dataUrl, width: w, height: h });
                } catch {
                  window.clearTimeout(timeoutId);
                  cleanup();
                  resolve({ duration: dur, width: w, height: h });
                }
              };

              const onseek = () => {
                capture();
                video.removeEventListener("seeked", onseek);
              };

              try {
                video.currentTime = seekTo;
                video.addEventListener("seeked", onseek);
                setTimeout(() => {
                  if (!video.readyState || video.readyState < 2) return;
                  capture();
                }, 700);
              } catch {
                window.clearTimeout(timeoutId);
                cleanup();
                resolve({ duration: dur });
              }
            };

            video.onerror = () => {
              window.clearTimeout(timeoutId);
              cleanup();
              // Don't reject the file — just skip thumbnail/duration
              resolve({});
            };
          });

          if (invalidReason) {
            invalidFiles.push({ id: `${filePath}-${Date.now()}`, name, reason: invalidReason });
            continue;
          }

          validFiles.push({
            id: `${filePath}-${Date.now()}`,
            name,
            size,
            type: "video/*",
            duration,
            width,
            height,
            thumbnail,
            previewUrl: assetUrl,
            sourcePath: filePath,
          });
        }

        setSelectedVideos((prev) => [...prev, ...validFiles]);
        setRejectedFiles((prev) => [...prev, ...invalidFiles]);
      } catch (error) {
        setQueueError(error instanceof Error ? error.message : String(error));
      }
      return;
    }

    inputRef.current?.click();
  };

  const handleRemoveVideo = (id: string) => {
    setSelectedVideos((prev) => {
      const toRemove = prev.find((video) => video.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.previewUrl);
      }
      return prev.filter((video) => video.id !== id);
    });
  };

  const handleExport = async () => {
    if (selectedVideos.length === 0) return;
    setQueueError(null);

    const jobsToQueue: QueueJobRequest[] = selectedVideos.map((video) => ({
      job_id: (crypto as any)?.randomUUID?.() ?? `${video.id}-${Date.now()}`,
      video_path: video.sourcePath,
      video_name: video.name,
      language,
      size: video.size,
      duration: video.duration ?? null,
      width: video.width ?? null,
      height: video.height ?? null,
    }));

    try {
      for (const jobRequest of jobsToQueue) {
        await enqueueJob(jobRequest);
      }
      setSelectedVideos([]);
      setRejectedFiles([]);
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCancelQueue = async () => {
    setIsCancelling(true);
    setQueueError(null);
    setJobs([]);

    try {
      await cancelPendingJobs();
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;

    if (!isTauriAvailable()) return;

    (async () => {
      unlisten = await listen<JobEvent>("upload_progress", (event) => {
        const payload = event.payload;

        if (payload.status === "cancelled") {
          setJobs((prev) => prev.filter((job) => job.job_id !== payload.job_id));
          return;
        }

        setJobs((prev) => {
          const index = prev.findIndex((job) => job.job_id === payload.job_id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = payload;
            return updated;
          }
          return [...prev, payload];
        });
      });
    })();

    return () => {
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      selectedVideos.forEach((video) => URL.revokeObjectURL(video.previewUrl));
    };
  }, [selectedVideos]);

  return (
    <>
      <Header onExport={handleExport} disabled={selectedCount === 0} />
      <div className="content">
        <UploadCard
          onChooseFiles={handleChooseFiles}
          selectedCount={selectedCount}
        />

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden-file-input"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />

        {selectedVideos.length > 0 && (
          <section className="selected-videos">
            <div className="section-header">
              <h3>Video đã chọn</h3>
              <p>
                Tổng {selectedVideos.length} video, tổng dung lượng {formatBytes(
                  selectedVideos.reduce((sum, video) => sum + video.size, 0)
                )}
                {totalDuration > 0 && ` · Tổng thời lượng ${Math.round(totalDuration)} giây`}
              </p>
            </div>

            <div className="video-list">
              {selectedVideos.map((video) => (
                <article key={video.id} className="video-card">
                  <div className="thumb">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={`thumb-${video.name}`} />
                    ) : (
                      <div className="thumb-fallback">🎬</div>
                    )}
                  </div>

                  <div className="video-info">
                    <strong>{video.name}</strong>
                    <p>{video.type}</p>
                  </div>

                  <div className="video-meta">
                    <span>{formatBytes(video.size)}</span>
                    {video.duration ? <span>{formatDuration(video.duration)}</span> : <span>—</span>}
                    <button className="link-button" onClick={() => handleRemoveVideo(video.id)}>
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {rejectedFiles.length > 0 && (
          <section className="rejected-files">
            <div className="section-header">
              <h3>Tệp không hợp lệ</h3>
              <p>Các tệp sau đã bị bỏ qua vì không phải video hoặc không thể đọc metadata.</p>
            </div>
            <div className="error-list">
              {rejectedFiles.map((file) => (
                <div key={file.id} className="error-item">
                  <strong>{file.name}</strong>
                  <span>{file.reason}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {jobs.length > 0 && (
          <section className="job-queue">
            <div className="section-header queue-header">
              <h3>Hàng đợi xử lý</h3>
              <button
                className="secondary"
                type="button"
                onClick={handleCancelQueue}
                disabled={isCancelling}
              >
                Hủy hàng đợi
              </button>
            </div>

            <div className="queue-list">
              {jobs.map((job) => (
                <article key={job.job_id} className="queue-item">
                  <div>
                    <strong>{job.job_id}</strong>
                    <p>{job.message ?? job.status}</p>
                  </div>
                  <div className="queue-meta">
                    <span className={`status-pill status-${job.status}`}>{job.status.replace(/_/g, " ")}</span>
                    {job.progress !== undefined && <span>{job.progress}%</span>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {queueError && (
          <section className="queue-error">
            <p>{queueError}</p>
          </section>
        )}

        <OptionPanel
          language={language}
          output={output}
          onLanguageChange={setLanguage}
          onOutputChange={setOutput}
        />
      </div>
    </>
  );
}
