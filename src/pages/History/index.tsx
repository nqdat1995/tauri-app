import { useEffect, useMemo, useState } from "react";
import type { ProjectRecord } from "../../lib/types";
import { isTauriAvailable, loadHistory, toAssetUrl } from "../../lib/tauri";
import "./history.css";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDuration(secs: number | null | undefined) {
  if (!secs || secs <= 0) return null;
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatSize(bytes: number | null | undefined) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const STATUS_LABEL: Record<string, string> = {
  completed: "Hoàn thành",
  failed:    "Thất bại",
  running:   "Đang chạy",
  queued:    "Chờ xử lý",
};

type SortKey = "newest" | "oldest" | "name";

// ── Thumbnail component ───────────────────────────────────────────────────────

interface ThumbProps {
  projectId: string;
  thumbnailRelPath: string | undefined;
  duration: number | null | undefined;
}

function ProjectThumb({ projectId, thumbnailRelPath, duration }: ThumbProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!thumbnailRelPath || !isTauriAvailable()) {
      setFailed(true);
      return;
    }
    // Build absolute path: ~/.tauri-translate-app/projects/{id}/{thumbnail_path}
    // then convert to asset:// URL so the browser can load a local file
    const buildSrc = async () => {
      try {
        const { homeDir } = await import("@tauri-apps/api/path");
        const home = await homeDir();
        const sep = home.includes("/") ? "/" : "\\";
        const absPath = [
          home.replace(/[/\\]+$/, ""),
          ".tauri-translate-app",
          "projects",
          projectId,
          ...thumbnailRelPath.replace(/\\/g, "/").split("/"),
        ].join(sep);
        const url = await toAssetUrl(absPath);
        setSrc(url);
      } catch {
        setFailed(true);
      }
    };
    buildSrc();
  }, [projectId, thumbnailRelPath]);

  const durationLabel = formatDuration(duration);

  return (
    <div className="project-thumb">
      {!failed && src ? (
        <img
          src={src}
          alt="thumbnail"
          onError={() => { setSrc(null); setFailed(true); }}
        />
      ) : (
        <span className="thumb-fallback" aria-hidden="true">🎬</span>
      )}
      {!failed && !src && <div className="thumb-shimmer" />}
      {durationLabel && <span className="thumb-duration">{durationLabel}</span>}
    </div>
  );
}

// ── Main History component ────────────────────────────────────────────────────

export function History({ onOpenInEditor }: { onOpenInEditor?: (projectId: string) => void }) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    if (!isTauriAvailable()) {
      setLoading(false);
      return;
    }
    loadHistory()
      .then((records) => setProjects(records))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...projects];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }

    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const ta = new Date(a.updated_at).getTime();
      const tb = new Date(b.updated_at).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });

    return list;
  }, [projects, search, statusFilter, sort]);

  // ── render ──
  if (loading) {
    return (
      <div className="history-loading">
        <div className="history-spinner" />
        <span>Đang tải lịch sử…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <p>⚠️ Không thể tải lịch sử: {error}</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <header className="page-header">
        <div className="page-title">
          <p className="eyebrow">Lịch sử</p>
          <h1>Danh sách phiên đã xử lý</h1>
        </div>
        <div className="history-header-right">
          {projects.length > 0 && (
            <span className="badge-count">{projects.length} project</span>
          )}
        </div>
      </header>

      {/* Toolbar */}
      {projects.length > 0 && (
        <div className="history-toolbar">
          <input
            className="history-search"
            type="text"
            placeholder="🔍 Tìm theo tên file hoặc ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm kiếm project"
          />
          <select
            className="history-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="completed">✅ Hoàn thành</option>
            <option value="failed">❌ Thất bại</option>
            <option value="running">⏳ Đang chạy</option>
            <option value="queued">🕐 Chờ xử lý</option>
          </select>
          <select
            className="history-filter"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sắp xếp"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
            <option value="name">Tên A→Z</option>
          </select>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="history-card">
          <div className="history-empty">
            <div className="history-empty-icon">🎬</div>
            <p>Chưa có project nào trong lịch sử.</p>
            <p className="history-empty-hint">
              Dữ liệu sẽ xuất hiện tại đây sau khi bạn xử lý video.
            </p>
          </div>
        </div>
      )}

      {/* No results after filtering */}
      {projects.length > 0 && filtered.length === 0 && (
        <div className="history-card">
          <div className="history-empty">
            <div className="history-empty-icon">🔍</div>
            <p>Không tìm thấy kết quả phù hợp.</p>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="history-card history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th className="col-thumb">Thumb</th>
                <th>Tên file / ID</th>
                <th>Thông tin media</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id}>
                  <td className="col-thumb">
                    <ProjectThumb
                      projectId={project.id}
                      thumbnailRelPath={project.media?.thumbnail_path}
                      duration={project.media?.duration}
                    />
                  </td>
                  <td>
                    <div className="project-name">{project.name}</div>
                    <div className="project-id">{project.id}</div>
                  </td>
                  <td>
                    {project.media?.width && project.media?.height && (
                      <div>
                        {project.media.width}×{project.media.height}
                        {project.media.fps ? ` · ${project.media.fps}fps` : ""}
                      </div>
                    )}
                    <div className="media-info">
                      {[
                        formatDuration(project.media?.duration) && `⏱ ${formatDuration(project.media?.duration)}`,
                        project.media?.codec,
                        formatSize(project.source?.size),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill status-${project.status}`}>
                      <span className="status-dot" />
                      {STATUS_LABEL[project.status] ?? project.status}
                    </span>
                  </td>
                  <td>
                    <span className="date-cell">{formatDate(project.updated_at)}</span>
                  </td>
                  <td>
                    {project.status === "completed" && onOpenInEditor && (
                      <button
                        className="history-edit-btn"
                        type="button"
                        onClick={() => onOpenInEditor(project.id)}
                        data-testid={`history-edit-${project.id}`}
                      >
                        ✏️ Chỉnh sửa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
