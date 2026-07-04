/**
 * Editor Page — Main layout orchestrator
 * FR-ED-01: Load Project into Editor
 * FR-ED-11: Navigate from History to Editor
 */

import { useEffect, useState, useRef } from "react";
import { useEditorStore } from "./store";
import { EditorToolbar } from "./EditorToolbar";
import { VideoPlayer } from "./VideoPlayer";
import { SubtitleTable } from "./SubtitleTable";
import { StylePanel } from "./StylePanel";
import { OverlayPanel } from "./OverlayPanel";
import { OverlayViewport } from "./OverlayViewport";
import "./editor.css";

interface EditorProps {
  /** Project ID passed from App-level (e.g., from History navigation) */
  projectId?: string | null;
  /** Called when editor needs to redirect away (e.g., video missing) */
  onNavigateToHistory?: () => void;
}

export function Editor({ projectId, onNavigateToHistory }: EditorProps) {
  const project = useEditorStore((s) => s.project);
  const isLoading = useEditorStore((s) => s.isLoading);
  const error = useEditorStore((s) => s.error);
  const loadProject = useEditorStore((s) => s.loadProject);
  const loadRecentProject = useEditorStore((s) => s.loadRecentProject);
  const clearError = useEditorStore((s) => s.clearError);

  const [rightPanelTab, setRightPanelTab] = useState<"style" | "overlay">("style");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Load project on mount or when projectId changes
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    } else if (!project && !isLoading) {
      loadRecentProject();
    }
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle VIDEO_MISSING error
  useEffect(() => {
    if (error === "VIDEO_MISSING") {
      setShowErrorDialog(true);
    }
  }, [error]);

  // Track viewport size for overlay coordinate scaling
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleErrorDialogClose = () => {
    setShowErrorDialog(false);
    clearError();
    onNavigateToHistory?.();
  };

  // Loading state
  if (isLoading && !project) {
    return (
      <div className="editor-page editor-page--loading" data-testid="editor-loading">
        <div className="editor-loading">
          <div className="editor-loading__spinner" />
          <p>Đang tải dự án...</p>
        </div>
      </div>
    );
  }

  // No project state
  if (!project && error === "NO_PROJECTS") {
    return (
      <div className="editor-page editor-page--empty" data-testid="editor-empty">
        <div className="editor-empty">
          <h2>Chưa có dự án nào</h2>
          <p>Vui lòng xử lý video tại tab "Trang chủ" trước khi sử dụng trình chỉnh sửa.</p>
        </div>
      </div>
    );
  }

  // Error state (non-video-missing)
  if (!project && error && error !== "VIDEO_MISSING") {
    return (
      <div className="editor-page editor-page--error" data-testid="editor-error">
        <div className="editor-empty">
          <h2>Lỗi tải dự án</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page" data-testid="editor-page">
      {/* Error dialog for missing video */}
      {showErrorDialog && (
        <div className="editor-dialog-overlay" data-testid="editor-error-dialog">
          <div className="editor-dialog">
            <h3>Video không tồn tại</h3>
            <p>File video gốc đã bị xóa hoặc di chuyển. Không thể mở trình chỉnh sửa.</p>
            <button className="btn-primary-export" type="button" onClick={handleErrorDialogClose} data-testid="editor-error-dialog-ok">
              OK
            </button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="editor-main">
        <EditorToolbar />

        <div className="editor-video-area" ref={viewportRef}>
          <VideoPlayer />
          <OverlayViewport
            containerWidth={viewportSize.width}
            containerHeight={viewportSize.height}
          />
        </div>

        <SubtitleTable />
      </div>

      {/* Right panel */}
      <div className="editor-right-panel">
        <StylePanel activeTab={rightPanelTab} onTabChange={setRightPanelTab} />
        {rightPanelTab === "overlay" && <OverlayPanel />}
      </div>
    </div>
  );
}
