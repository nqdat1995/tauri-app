/**
 * OverlayPanel — Overlay effects management
 * FR-ED-09: Overlay Tab (UI + Persistence)
 */

import { useState } from "react";
import { useEditorStore } from "./store";
import { OVERLAY_TYPES, MAX_OVERLAY_INSTANCES } from "./constants";
import type { OverlayType, OverlayItem } from "./types";

export function OverlayPanel() {
  const overlays = useEditorStore((s) => s.overlays);
  const addOverlay = useEditorStore((s) => s.addOverlay);
  const removeOverlay = useEditorStore((s) => s.removeOverlay);
  const toggleOverlay = useEditorStore((s) => s.toggleOverlay);
  const updateOverlay = useEditorStore((s) => s.updateOverlay);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = overlays.items.find((i) => i.id === selectedId);

  const getTypeCount = (type: OverlayType) =>
    overlays.items.filter((i) => i.type === type).length;

  return (
    <div className="overlay-panel" data-testid="overlay-panel">
      {/* Effect type buttons */}
      <div className="overlay-panel__section">
        <h4 className="overlay-panel__section-title">Thêm hiệu ứng</h4>
        <p className="overlay-panel__section-desc">Nhấp vào hiệu ứng để thêm vào danh sách. Tối đa {MAX_OVERLAY_INSTANCES} phần tử mỗi loại.</p>
        <div className="overlay-panel__buttons" data-testid="overlay-panel-buttons">
          {OVERLAY_TYPES.map((ot) => {
            const count = getTypeCount(ot.type);
            const disabled = count >= MAX_OVERLAY_INSTANCES;
            return (
              <button
                key={ot.type}
                className={`overlay-panel__type-btn ${disabled ? "overlay-panel__type-btn--disabled" : ""}`}
                type="button"
                disabled={disabled}
                onClick={() => addOverlay(ot.type)}
                title={disabled ? `Đã đạt tối đa ${MAX_OVERLAY_INSTANCES}` : `Thêm ${ot.label}`}
                data-testid={`overlay-add-${ot.type}`}
              >
                <span className="overlay-panel__type-icon">{ot.icon}</span>
                <span className="overlay-panel__type-label">{ot.label}</span>
                {count > 0 && <span className="overlay-panel__type-count">{count}/{MAX_OVERLAY_INSTANCES}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active effects list */}
      {overlays.items.length > 0 && (
        <div className="overlay-panel__section">
          <h4 className="overlay-panel__section-title">Danh sách ({overlays.items.length})</h4>
          <div className="overlay-panel__list" data-testid="overlay-panel-list">
            {overlays.items.map((item) => {
              const typeInfo = OVERLAY_TYPES.find((t) => t.type === item.type);
              return (
                <div
                  key={item.id}
                  className={`overlay-panel__item ${selectedId === item.id ? "overlay-panel__item--selected" : ""} ${!item.enabled ? "overlay-panel__item--disabled" : ""}`}
                  onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                  data-testid={`overlay-item-${item.id}`}
                >
                  <span className="overlay-panel__item-icon">{typeInfo?.icon}</span>
                  <span className="overlay-panel__item-name">{typeInfo?.label}</span>
                  <button
                    className="overlay-panel__eye-btn"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleOverlay(item.id); }}
                    title={item.enabled ? "Ẩn" : "Hiện"}
                    data-testid={`overlay-toggle-${item.id}`}
                  >
                    {item.enabled ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.4"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                    )}
                  </button>
                  <button
                    className="overlay-panel__delete-btn"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeOverlay(item.id); setSelectedId(null); }}
                    title="Xóa"
                    data-testid={`overlay-delete-${item.id}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Config panel for selected item */}
      {selectedItem && (
        <div className="overlay-panel__section overlay-panel__config" data-testid="overlay-panel-config">
          <h4 className="overlay-panel__section-title">Cấu hình: {OVERLAY_TYPES.find(t => t.type === selectedItem.type)?.label}</h4>
          <OverlayConfigFields item={selectedItem} onUpdate={updateOverlay} />
          <p className="overlay-panel__config-note">
            Vị trí và kích thước sẽ được chỉnh sửa trực quan trên video khi xuất (Phase 2).
          </p>
        </div>
      )}

      {/* Empty state */}
      {overlays.items.length === 0 && (
        <div className="overlay-panel__section">
          <div className="overlay-panel__empty">
            <p>Chưa có hiệu ứng nào. Nhấp vào các nút phía trên để thêm.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Config Fields per Type ──────────────────────────────────────

function OverlayConfigFields({ item, onUpdate }: { item: OverlayItem; onUpdate: (id: string, u: Partial<OverlayItem>) => void }) {
  const config = item.config as Record<string, unknown>;

  const updateConfig = (updates: Record<string, unknown>) => {
    onUpdate(item.id, { config: { ...config, ...updates } });
  };

  switch (item.type) {
    case "background_overlay":
    case "blur":
      return (
        <div className="overlay-panel__config-fields">
          <div className="overlay-config__field">
            <label>Màu</label>
            <input
              type="color"
              value={(config.color as string) ?? "#000000"}
              onChange={(e) => updateConfig({ color: e.target.value })}
            />
          </div>
          <div className="overlay-config__field">
            <label>Độ rõ: {(config.opacity as number) ?? 50}%</label>
            <input
              type="range" min="0" max="100"
              value={(config.opacity as number) ?? 50}
              onChange={(e) => updateConfig({ opacity: parseInt(e.target.value, 10) })}
            />
          </div>
        </div>
      );
    case "mirror":
      return (
        <div className="overlay-panel__config-fields">
          <p className="overlay-panel__config-info">Hiệu ứng gương — bật/tắt bằng icon mắt bên trái.</p>
        </div>
      );
    case "text":
      return (
        <div className="overlay-panel__config-fields">
          <div className="overlay-config__field">
            <label>Văn bản</label>
            <input
              type="text"
              value={(config.text as string) ?? ""}
              onChange={(e) => updateConfig({ text: e.target.value })}
              placeholder="Nhập văn bản..."
            />
          </div>
          <div className="overlay-config__field">
            <label>Cỡ chữ: {(config.fontSize as number) ?? 18}px</label>
            <input
              type="range" min="10" max="72"
              value={(config.fontSize as number) ?? 18}
              onChange={(e) => updateConfig({ fontSize: parseInt(e.target.value, 10) })}
            />
          </div>
          <div className="overlay-config__field">
            <label>Màu chữ</label>
            <input
              type="color"
              value={(config.color as string) ?? "#ffffff"}
              onChange={(e) => updateConfig({ color: e.target.value })}
            />
          </div>
        </div>
      );
    case "logo":
    case "watermark":
      return (
        <div className="overlay-panel__config-fields">
          <div className="overlay-config__field">
            <label>Đường dẫn file</label>
            <input
              type="text"
              value={(config.path as string) ?? ""}
              onChange={(e) => updateConfig({ path: e.target.value })}
              placeholder="Chọn hoặc nhập đường dẫn..."
            />
          </div>
          <div className="overlay-config__field">
            <label>Độ rõ: {(config.opacity as number) ?? 100}%</label>
            <input
              type="range" min="0" max="100"
              value={(config.opacity as number) ?? 100}
              onChange={(e) => updateConfig({ opacity: parseInt(e.target.value, 10) })}
            />
          </div>
        </div>
      );
    default:
      return null;
  }
}
