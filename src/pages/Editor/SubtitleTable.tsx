/**
 * SubtitleTable — Editable subtitle cue list
 * FR-ED-04: Subtitle Table (Read/Edit)
 * FR-ED-05: Add New Subtitle
 * FR-ED-06: Delete Subtitle
 */

import { useEditorStore } from "./store";

function formatTimecode(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
}

export function SubtitleTable() {
  const subtitles = useEditorStore((s) => s.subtitles);
  const currentTime = useEditorStore((s) => s.currentTime);
  const updateSubtitle = useEditorStore((s) => s.updateSubtitle);
  const addSubtitle = useEditorStore((s) => s.addSubtitle);
  const deleteSubtitle = useEditorStore((s) => s.deleteSubtitle);
  const seekTo = useEditorStore((s) => s.seekTo);

  return (
    <div className="subtitle-table" data-testid="subtitle-table">
      {/* Tab bar */}
      <div className="subtitle-table__tabs">
        <div className="subtitle-table__tab-group">
          <div className="subtitle-table__tab subtitle-table__tab--active" data-testid="subtitle-table-tab-subtitle">
            ☰ Phụ đề
          </div>
        </div>
        <div className="subtitle-table__actions-row">
          <button
            className="subtitle-table__add-btn"
            type="button"
            onClick={() => addSubtitle()}
            data-testid="subtitle-table-add"
          >
            ＋ Thêm phụ đề
          </button>
          <span className="subtitle-table__status" data-testid="subtitle-table-status">
            ✓ Sẵn sàng xuất file
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="subtitle-table__container">
        <div className="subtitle-table__header">
          <div className="subtitle-table__col subtitle-table__col--time">TIME</div>
          <div className="subtitle-table__col subtitle-table__col--original">VĂN BẢN GỐC</div>
          <div className="subtitle-table__col subtitle-table__col--translated">VĂN BẢN DỊCH</div>
          <div className="subtitle-table__col subtitle-table__col--actions"></div>
        </div>

        <div className="subtitle-table__body">
          {subtitles.map((cue) => {
            const isActive = currentTime >= cue.startTime && currentTime < cue.endTime;
            return (
              <div
                key={cue.id}
                className={`subtitle-table__row ${isActive ? "subtitle-table__row--active" : ""}`}
                onClick={() => seekTo(cue.startTime)}
                data-testid={`subtitle-row-${cue.id}`}
              >
                <div className="subtitle-table__col subtitle-table__col--time">
                  <span className="subtitle-table__timecode">{formatTimecode(cue.startTime)}</span>
                </div>
                <div className="subtitle-table__col subtitle-table__col--original">
                  <span
                    className="subtitle-table__text"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSubtitle(cue.id, "originalText", e.currentTarget.textContent ?? "")}
                    data-testid={`subtitle-original-${cue.id}`}
                  >
                    {cue.originalText}
                  </span>
                </div>
                <div className="subtitle-table__col subtitle-table__col--translated">
                  <span
                    className="subtitle-table__text"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSubtitle(cue.id, "translatedText", e.currentTarget.textContent ?? "")}
                    data-testid={`subtitle-translated-${cue.id}`}
                  >
                    {cue.translatedText}
                  </span>
                </div>
                <div className="subtitle-table__col subtitle-table__col--actions">
                  <button
                    className="subtitle-table__delete-btn"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteSubtitle(cue.id); }}
                    data-testid={`subtitle-delete-${cue.id}`}
                    title="Xóa"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
