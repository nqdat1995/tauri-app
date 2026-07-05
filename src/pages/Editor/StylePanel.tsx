/**
 * StylePanel — Subtitle style presets + font settings
 * FR-ED-08: Subtitle Style Configuration
 */

import { useEditorStore } from "./store";
import { PRESET_STYLES, FONT_OPTIONS } from "./constants";
import type { BgShape, SubtitlePosition } from "./types";

const POSITION_OPTIONS: { value: SubtitlePosition; label: string }[] = [
  { value: "top-left", label: "Trên trái" },
  { value: "top-center", label: "Trên giữa" },
  { value: "top-right", label: "Trên phải" },
  { value: "middle-left", label: "Giữa trái" },
  { value: "center", label: "Giữa" },
  { value: "middle-right", label: "Giữa phải" },
  { value: "bottom-left", label: "Dưới trái" },
  { value: "bottom-center", label: "Dưới giữa" },
  { value: "bottom-right", label: "Dưới phải" },
];

type PanelTab = "style" | "overlay";

interface StylePanelProps {
  onTabChange: (tab: PanelTab) => void;
  activeTab: PanelTab;
  children?: React.ReactNode;
}

export function StylePanel({ onTabChange, activeTab, children }: StylePanelProps) {
  const activeStyle = useEditorStore((s) => s.activeStyle);
  const updateStyle = useEditorStore((s) => s.updateStyle);
  const selectPreset = useEditorStore((s) => s.selectPreset);

  return (
    <aside className="style-panel" data-testid="style-panel">
      {/* Tabs */}
      <div className="style-panel__tabs">
        <button
          className={`style-panel__tab ${activeTab === "style" ? "style-panel__tab--active" : ""}`}
          type="button"
          onClick={() => onTabChange("style")}
          data-testid="style-panel-tab-style"
        >
          ☰ Style
        </button>
        <button
          className={`style-panel__tab ${activeTab === "overlay" ? "style-panel__tab--active" : ""}`}
          type="button"
          onClick={() => onTabChange("overlay")}
          data-testid="style-panel-tab-overlay"
        >
          ⚙ Overlay
        </button>
      </div>

      {activeTab === "style" && (
        <div className="style-panel__content">
          {/* Preset grid */}
          <div className="style-panel__section">
            <h3 className="style-panel__section-title">☰ Style phụ đề</h3>
            <p className="style-panel__section-desc">
              Chọn preset rồi tinh chỉnh chữ, nền và hiệu ứng. Nhìn hiện chữ được tự chia theo câu.
            </p>
            <div className="style-panel__presets" data-testid="style-panel-presets">
              {PRESET_STYLES.map((preset) => (
                <div
                  key={preset.id}
                  className={`style-panel__preset-card ${activeStyle.id === preset.id ? "style-panel__preset-card--active" : ""}`}
                  onClick={() => selectPreset(preset.id)}
                  data-testid={`style-preset-${preset.id}`}
                >
                  <div
                    className="style-panel__preset-preview"
                    style={{
                      color: preset.textColor,
                      backgroundColor: preset.bgShape !== "none"
                        ? `${preset.bgColor}${Math.round((preset.bgOpacity / 100) * 255).toString(16).padStart(2, "0")}`
                        : "#f3f4f6",
                      borderRadius: preset.bgShape === "rounded" ? "4px" : "2px",
                      border: preset.bgShape === "none" ? "1px dashed #d1d5db" : "none",
                      textShadow: preset.bgShape === "none" && preset.textColor === "#ffffff" ? "0 0 2px rgba(0,0,0,0.5)" : "none",
                    }}
                  >
                    {preset.id === "no-subtitle" ? "Không phụ đề" : "Xin chào"}
                  </div>
                  {activeStyle.id === preset.id && <span className="style-panel__preset-check">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Font settings */}
          <div className="style-panel__section">
            <h3 className="style-panel__section-title">T CHỮ</h3>

            <div className="style-panel__field">
              <label className="style-panel__label">FONT CHỮ</label>
              <select
                className="style-panel__select"
                value={activeStyle.fontFamily}
                onChange={(e) => updateStyle({ fontFamily: e.target.value })}
                data-testid="style-panel-font-family"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="style-panel__field">
              <label className="style-panel__label">
                KÍCH THƯỚC <span className="style-panel__value">{activeStyle.fontSize}px</span>
              </label>
              <input
                type="range" className="style-panel__slider" min="12" max="48"
                value={activeStyle.fontSize}
                onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value, 10) })}
                data-testid="style-panel-font-size"
              />
            </div>

            <div className="style-panel__field-row">
              <div className="style-panel__field style-panel__field--half">
                <label className="style-panel__label">MÀU CHỮ</label>
                <input
                  type="color" className="style-panel__color-input"
                  value={activeStyle.textColor}
                  onChange={(e) => updateStyle({ textColor: e.target.value })}
                  data-testid="style-panel-text-color"
                />
              </div>
              <div className="style-panel__field style-panel__field--half">
                <label className="style-panel__label">MÀU NỀN</label>
                <input
                  type="color" className="style-panel__color-input"
                  value={activeStyle.bgColor === "transparent" ? "#000000" : activeStyle.bgColor}
                  onChange={(e) => updateStyle({ bgColor: e.target.value })}
                  data-testid="style-panel-bg-color"
                />
              </div>
            </div>

            <div className="style-panel__field-row">
              <div className="style-panel__field style-panel__field--half">
                <label className="style-panel__label">NỀN</label>
                <select
                  className="style-panel__select"
                  value={activeStyle.bgShape}
                  onChange={(e) => updateStyle({ bgShape: e.target.value as BgShape })}
                  data-testid="style-panel-bg-shape"
                >
                  <option value="rounded">Hộp bo</option>
                  <option value="box">Hộp vuông</option>
                  <option value="none">Không</option>
                </select>
              </div>
              <div className="style-panel__field style-panel__field--half">
                <label className="style-panel__label">VỊ TRÍ</label>
                <select
                  className="style-panel__select"
                  value={activeStyle.position}
                  onChange={(e) => updateStyle({ position: e.target.value as SubtitlePosition })}
                  data-testid="style-panel-position"
                >
                  {POSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="style-panel__field">
              <label className="style-panel__label">
                ĐỘ MỜ NỀN <span className="style-panel__value">{activeStyle.bgOpacity}%</span>
              </label>
              <input
                type="range" className="style-panel__slider" min="0" max="100"
                value={activeStyle.bgOpacity}
                onChange={(e) => updateStyle({ bgOpacity: parseInt(e.target.value, 10) })}
                data-testid="style-panel-bg-opacity"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "overlay" && children && (
        <div className="style-panel__content">
          {children}
        </div>
      )}
    </aside>
  );
}
