/**
 * EditorToolbar — Project info, status, and action buttons
 * FR-ED-10: Editor Toolbar
 */

import { useEditorStore } from "./store";

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "has_subtitle": return "Đã có phụ đề/giọng";
    case "processing": return "Đang xử lý";
    case "ready": return "Sẵn sàng";
    default: return "";
  }
}

export function EditorToolbar() {
  const project = useEditorStore((s) => s.project);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isLoading = useEditorStore((s) => s.isLoading);
  const saveProject = useEditorStore((s) => s.saveProject);

  if (!project) return null;

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar">
      <div className="editor-toolbar__info">
        <div className="editor-toolbar__status">
          <span className={`status-badge status-badge--${project.status}`} data-testid="editor-toolbar-status">
            {getStatusLabel(project.status)}
          </span>
        </div>
        <h2 className="editor-toolbar__filename" data-testid="editor-toolbar-filename">
          {project.filename}
        </h2>
        <p className="editor-toolbar__meta">
          {Math.round(project.duration)}s · {formatFileSize(project.fileSize)} · {project.width}x{project.height} · Xử lý: {project.processingTime} giây
        </p>
      </div>
      <div className="editor-toolbar__actions">
        <button
          className="btn-outline"
          type="button"
          disabled
          title="Sẽ có trong phiên bản tiếp"
          data-testid="editor-toolbar-recreate-audio"
        >
          🔄 Tạo lại âm thanh
        </button>
        <button
          className={`btn-save ${isDirty ? "btn-save--dirty" : ""}`}
          type="button"
          onClick={saveProject}
          disabled={!isDirty || isLoading}
          data-testid="editor-toolbar-save"
        >
          💾 Lưu
        </button>
        <button
          className="btn-primary-export"
          type="button"
          disabled
          title="Sẽ có trong phiên bản tiếp"
          data-testid="editor-toolbar-export"
        >
          🎬 Xuất Video
        </button>
      </div>
    </div>
  );
}
