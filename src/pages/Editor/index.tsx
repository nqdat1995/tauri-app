/**
 * Video Editor — Page (Placeholder for Unit 2)
 * Unit 1: editor-store provides types, store, constants, mock data
 * Unit 2: will build the full UI
 */

import { useEffect } from "react";
import { useEditorStore } from "./store";

export function Editor() {
  const { project, isLoading, error, loadRecentProject } = useEditorStore();

  useEffect(() => {
    if (!project && !isLoading && !error) {
      loadRecentProject();
    }
  }, [project, isLoading, error, loadRecentProject]);

  if (isLoading) {
    return (
      <div className="page-panel">
        <div className="panel-body">
          <p>Đang tải dự án...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-panel">
        <div className="panel-body">
          <p>Lỗi: {error}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-panel">
        <div className="panel-body">
          <p>Không có dự án nào. Vui lòng xử lý video trước.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-panel">
      <header className="page-header">
        <div className="page-title">
          <p className="eyebrow">Trình chỉnh sửa</p>
          <h1>Trình chỉnh sửa video</h1>
        </div>
      </header>
      <div className="panel-body">
        <p>
          Dự án: <strong>{project.filename}</strong> — {project.subtitles.length} phụ đề
        </p>
        <p>
          <em>Giao diện đầy đủ sẽ được xây dựng trong Unit 2 (editor-ui).</em>
        </p>
      </div>
    </div>
  );
}
