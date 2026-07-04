import { useEffect, useState, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { applyTheme } from "./config/ui";
import { Sidebar, TabKey } from "./components/Sidebar";
import { Home } from "./pages/Home";
import { History } from "./pages/History";
import { Editor } from "./pages/Editor";
import { SrtToAudio } from "./pages/SrtToAudio";
import { Settings } from "./pages/Settings";
import { useEditorStore } from "./pages/Editor/store";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [activeEditorProjectId, setActiveEditorProjectId] = useState<string | null>(null);
  const isDirty = useEditorStore((s) => s.isDirty);
  const resetDirty = useEditorStore((s) => s.resetDirty);

  useEffect(() => {
    try { applyTheme(); } catch { /* no-op */ }
    const window = getCurrentWindow();
    window.maximize().catch(() => {});
    window.setFullscreen(true).catch(() => {});
  }, []);

  // Navigation with unsaved changes protection
  const handleTabChange = useCallback((newTab: TabKey) => {
    if (activeTab === "editor" && isDirty && newTab !== "editor") {
      const choice = window.confirm(
        "Bạn có thay đổi chưa lưu. Bạn muốn lưu trước khi rời đi không?\n\nOK = Rời mà không lưu\nCancel = Ở lại"
      );
      if (!choice) return; // Stay on editor
      resetDirty(); // Discard changes
    }
    setActiveTab(newTab);
  }, [activeTab, isDirty, resetDirty]);

  // Navigate to editor with a specific project
  const handleOpenInEditor = useCallback((projectId: string) => {
    setActiveEditorProjectId(projectId);
    setActiveTab("editor");
  }, []);

  // Navigate to history from editor (e.g., on video missing error)
  const handleNavigateToHistory = useCallback(() => {
    setActiveTab("history");
  }, []);

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onChange={handleTabChange} isDirty={activeTab === "editor" && isDirty} />
      <main>
        {activeTab === "home" && <Home />}
        {activeTab === "history" && <History onOpenInEditor={handleOpenInEditor} />}
        {activeTab === "editor" && (
          <Editor
            projectId={activeEditorProjectId}
            onNavigateToHistory={handleNavigateToHistory}
          />
        )}
        {activeTab === "srt" && <SrtToAudio />}
        {activeTab === "settings" && <Settings />}
      </main>
    </div>
  );
}
