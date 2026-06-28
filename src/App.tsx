import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { applyTheme } from "./config/ui";
import { Sidebar, TabKey } from "./components/Sidebar";
import { Home } from "./pages/Home";
import { History } from "./pages/History";
import { Editor } from "./pages/Editor";
import { SrtToAudio } from "./pages/SrtToAudio";
import { Settings } from "./pages/Settings";

const pageMap: Record<TabKey, JSX.Element> = {
  home: <Home />,
  history: <History />,
  editor: <Editor />,
  srt: <SrtToAudio />,
  settings: <Settings />,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  useEffect(() => {
    // apply design tokens (CSS variables) from central config
    try {
      applyTheme();
    } catch (e) {
      /* no-op if run outside browser */
    }

    const window = getCurrentWindow();
    window.maximize().catch(() => {
      // ignore if not running inside Tauri or maximize fails
    });

    window.setFullscreen(true).catch(() => {
      // ignore if not running inside Tauri or full screen fails
    });
  }, []);

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />
      <main>{pageMap[activeTab]}</main>
    </div>
  );
}
