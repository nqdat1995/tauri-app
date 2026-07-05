/**
 * Editor Page — Main layout orchestrator
 * FR-ED-01: Load Project into Editor
 * FR-ED-11: Navigate from History to Editor
 */

import { useEffect, useState, Component, type ReactNode } from "react";
import { useEditorStore } from "./store";
import { EditorToolbar } from "./EditorToolbar";
import { VideoPlayer } from "./VideoPlayer";
import { SubtitleTable } from "./SubtitleTable";
import { StylePanel } from "./StylePanel";
import { OverlayPanel } from "./OverlayPanel";
import "./editor.css";

// Error boundary to prevent white screen crashes
class EditorErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="editor-page editor-page--error">
          <div className="editor-empty">
            <h2>Lỗi hiển thị</h2>
            <p>{this.state.error}</p>
            <button className="btn-outline" onClick={() => this.setState({ hasError: false, error: "" })}>Thử lại</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface EditorProps {
  projectId?: string | null;
  onNavigateToHistory?: () => void;
}

export function Editor({ projectId, onNavigateToHistory }: EditorProps) {
  return (
    <EditorErrorBoundary>
      <EditorContent projectId={projectId} onNavigateToHistory={onNavigateToHistory} />
    </EditorErrorBoundary>
  );
}

function EditorContent({ projectId, onNavigateToHistory }: EditorProps) {
  const project = useEditorStore((s) => s.project);
  const isLoading = useEditorStore((s) => s.isLoading);
  const error = useEditorStore((s) => s.error);
  const loadProject = useEditorStore((s) => s.loadProject);
  const loadRecentProject = useEditorStore((s) => s.loadRecentProject);
  const clearError = useEditorStore((s) => s.clearError);

  const [rightPanelTab, setRightPanelTab] = useState<"style" | "overlay">("style");
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    const doLoad = async () => {
      try {
        if (projectId) {
          await loadProject(projectId);
        } else if (!project && !isLoading) {
          await loadRecentProject();
        }
      } catch (e) {
        console.error("[Editor] Load failed:", e);
      }
    };
    doLoad();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error === "VIDEO_MISSING") {
      setShowErrorDialog(true);
    }
  }, [error]);

  const handleErrorDialogClose = () => {
    setShowErrorDialog(false);
    clearError();
    onNavigateToHistory?.();
  };

  if (isLoading && !project) {
    return (
      <div className="editor-page editor-page--loading">
        <div className="editor-loading">
          <div className="editor-loading__spinner" />
          <p>Đang tải dự án...</p>
        </div>
      </div>
    );
  }

  if (!project && error === "NO_PROJECTS") {
    return (
      <div className="editor-page editor-page--empty">
        <div className="editor-empty">
          <h2>Chưa có dự án nào</h2>
          <p>Vui lòng xử lý video tại tab "Trang chủ" trước khi sử dụng trình chỉnh sửa.</p>
        </div>
      </div>
    );
  }

  if (!project && error && error !== "VIDEO_MISSING") {
    return (
      <div className="editor-page editor-page--error">
        <div className="editor-empty">
          <h2>Lỗi tải dự án</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page" data-testid="editor-page">
      {showErrorDialog && (
        <div className="editor-dialog-overlay">
          <div className="editor-dialog">
            <h3>Video không tồn tại</h3>
            <p>File video gốc đã bị xóa hoặc di chuyển. Không thể mở trình chỉnh sửa.</p>
            <button className="btn-primary-export" type="button" onClick={handleErrorDialogClose}>OK</button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="editor-main">
        <EditorToolbar />
        <VideoPlayer />
        <SubtitleTable />
      </div>

      {/* Right panel */}
      <div className="editor-right-panel">
        <StylePanel activeTab={rightPanelTab} onTabChange={setRightPanelTab}>
          <OverlayPanel />
        </StylePanel>
      </div>
    </div>
  );
}
