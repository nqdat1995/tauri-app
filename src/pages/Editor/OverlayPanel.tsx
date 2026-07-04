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
        <h3 className="overlay-panel__section-title">Thêm hiệu ứng</h3>
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
                title={disabled ? `Tối đa ${MAX_OVERLAY_INSTANCES} phần tử` : `Thêm ${ot.label}`}
                data-testid={`overlay-add-${ot.type}`}
              >
                <span className="overlay-panel__type-icon">{ot.icon}</span>
                <span className="overlay-panel__type-label">{ot.label}</span>
                {count > 0 && <span className="overlay-panel__type-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active effects list */}
      {overlays.items.length > 0 && (
        <div className="overlay-panel__section">
          <h3 className="overlay-panel__section-title">Danh sách hiệu ứng</h3>
          <div className="overlay-panel__list" data-testid="overlay-panel-list">
            {overlays.items.map((item) => {
              const typeInfo = OVERLAY_TYPES.find((t) => t.type === item.type);
              return (
                <div
                  key={item.id}
                  className={`overlay-panel__item ${selectedId === item.id ? "overlay-panel__item--selected" : ""}`}
                  onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                  data-testid={`overlay-item-${item.id}`}
                >
                  <span className="overlay-panel__item-icon">{typeInfo?.icon}</span>
                  <span className="overlay-panel__item-name">{typeInfo?.label}</span>
                  <button
                    className={`overlay-panel__eye-btn ${!item.enabled ? "overlay-panel__eye-btn--hidden" : ""}`}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleOverlay(item.id); }}
                    title={item.enabled ? "Ẩn" : "Hiện"}
                    data-testid={`overlay-toggle-${item.id}`}
                  >
                    {item.enabled ? "👁" : "👁‍🗨"}
                  </button>
                  <button
                    className="overlay-panel__delete-btn"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeOverlay(item.id); }}
                    title="Xóa"
                    data-testid={`overlay-delete-${item.id}`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Config panel for selected item */}
      {selectedItem && (
        <div className="overlay-panel__config" data-testid="overlay-panel-config">
          <h4 className="overlay-panel__config-title">Cấu hình</h4>
          <OverlayConfigFields item={selectedItem} onUpdate={updateOverlay} />
        </div>
      )}
    </div>
  );
}

// ─── Config Fields per Type ──────────────────────────────────────

function OverlayConfigFields({ item, onUpdate }: { item: OverlayItem; onUpdate: (id: string, u: Partial<OverlayItem>) => void }) {
  const config = item.config as Record<string, unknown>;

  switch (item.type) {
    case "background_overlay":
    case "blur":
      return (
        <div className="overlay-panel__config-fields">
          <div className="style-panel__field">
            <label className="style-panel__label">Màu</label>
            <input
              type="color" className="style-panel__color-input"
              value={(config.color as string) ?? "#000000"}
              onChange={(e) => onUpdate(item.id, { config: { ...config, color: e.target.value } })}
            />
          </div>
          <div className="style-panel__field">
            <label className="style-panel__label">Độ rõ <span className="style-panel__value">{config.opacity as number ?? 50}%</span></label>
            <input
              type="range" className="style-panel__slider" min="0" max="100"
              value={(config.opacity as number) ?? 50}
              onChange={(e) => onUpdate(item.id, { config: { ...config, opacity: parseInt(e.target.value, 10) } })}
            />
          </div>
        </div>
      );
    case "mirror":
      return <p className="overlay-panel__config-note">Hiệu ứng gương — bật/tắt bằng icon mắt.</p>;
    case "text":
      return (
        <div className="overlay-panel__config-fields">
          <div className="style-panel__field">
            <label className="style-panel__label">Văn bản</label>
            <input
              type="text" className="style-panel__select"
              value={(config.text as string) ?? ""}
              onChange={(e) => onUpdate(item.id, { config: { ...config, text: e.target.value } })}
            />
          </div>
          <div className="style-panel__field">
            <label className="style-panel__label">Cỡ chữ <span className="style-panel__value">{config.fontSize as number ?? 18}px</span></label>
            <input
              type="range" className="style-panel__slider" min="10" max="72"
              value={(config.fontSize as number) ?? 18}
              onChange={(e) => onUpdate(item.id, { config: { ...config, fontSize: parseInt(e.target.value, 10) } })}
            />
          </div>
          <div className="style-panel__field">
            <label className="style-panel__label">Màu chữ</label>
            <input
              type="color" className="style-panel__color-input"
              value={(config.color as string) ?? "#ffffff"}
              onChange={(e) => onUpdate(item.id, { config: { ...config, color: e.target.value } })}
            />
          </div>
        </div>
      );
    case "logo":
    case "watermark":
      return (
        <div className="overlay-panel__config-fields">
          <div className="style-panel__field">
            <label className="style-panel__label">Đường dẫn</label>
            <input
              type="text" className="style-panel__select" placeholder="Chọn file..."
              value={(config.path as string) ?? ""}
              onChange={(e) => onUpdate(item.id, { config: { ...config, path: e.target.value } })}
            />
          </div>
          <div className="style-panel__field">
            <label className="style-panel__label">Độ rõ <span className="style-panel__value">{config.opacity as number ?? 100}%</span></label>
            <input
              type="range" className="style-panel__slider" min="0" max="100"
              value={(config.opacity as number) ?? 100}
              onChange={(e) => onUpdate(item.id, { config: { ...config, opacity: parseInt(e.target.value, 10) } })}
            />
          </div>
        </div>
      );
    default:
      return null;
  }
}
