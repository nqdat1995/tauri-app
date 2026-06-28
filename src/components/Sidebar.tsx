export type TabKey = "home" | "history" | "editor" | "srt" | "settings";

interface SidebarProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "home", label: "Trang chủ" },
  { key: "history", label: "Lịch sử" },
  { key: "editor", label: "Trình chỉnh sửa" },
  { key: "srt", label: "SRT sang Audio" },
  { key: "settings", label: "Cài đặt" },
];

export function Sidebar({ activeTab, onChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <h2>dichvideo.com</h2>
        <span>Giao diện dịch video</span>
      </div>
      <nav>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`menu ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">Phiên bản 1.0 • Thiết kế mới</div>
    </aside>
  );
}
