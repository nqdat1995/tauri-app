export type TabKey = "home" | "history" | "editor" | "srt" | "settings";

interface SidebarProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  isDirty?: boolean;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "home", label: "Trang chủ" },
  { key: "history", label: "Lịch sử" },
  { key: "editor", label: "Trình chỉnh sửa" },
  { key: "srt", label: "SRT sang Audio" },
  { key: "settings", label: "Cài đặt" },
];

export function Sidebar({ activeTab, onChange, isDirty }: SidebarProps) {
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
            data-testid={`sidebar-tab-${tab.key}`}
          >
            {tab.label}
            {tab.key === "editor" && isDirty && (
              <span className="sidebar-dirty-dot" title="Thay đổi chưa lưu" />
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">Phiên bản 1.0 • Thiết kế mới</div>
    </aside>
  );
}
