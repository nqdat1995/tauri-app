/**
 * SubtitleTable — Editable subtitle cue list
 * FR-ED-04, FR-ED-05, FR-ED-06
 */

import { useEditorStore } from "./store";

function formatTimecode(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
}

function parseTimecode(value: string): number | null {
  // Accept format MM:SS.ss or SS.ss
  const parts = value.split(":");
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (!isNaN(mins) && !isNaN(secs)) return mins * 60 + secs;
  } else if (parts.length === 1) {
    const secs = parseFloat(parts[0]);
    if (!isNaN(secs)) return secs;
  }
  return null;
}

export function SubtitleTable() {
  const subtitles = useEditorStore((s) => s.subtitles);
  const currentTime = useEditorStore((s) => s.currentTime);
  const updateSubtitle = useEditorStore((s) => s.updateSubtitle);
  const addSubtitle = useEditorStore((s) => s.addSubtitle);
  const deleteSubtitle = useEditorStore((s) => s.deleteSubtitle);
  const seekTo = useEditorStore((s) => s.seekTo);

  const handleTimeBlur = (id: string, field: "startTime" | "endTime", value: string) => {
    const parsed = parseTimecode(value);
    if (parsed !== null) {
      updateSubtitle(id, field, parsed);
    }
  };

  return (
    <div className="subtitle-table" data-testid="subtitle-table">
      {/* Tab bar */}
      <div className="subtitle-table__tabs">
        <div className="subtitle-table__tab-group">
          <div className="subtitle-table__tab subtitle-table__tab--active" data-testid="subtitle-table-tab-subtitle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/></svg>
            Phụ đề
          </div>
        </div>
        <div className="subtitle-table__actions-row">
          <button
            className="subtitle-table__add-btn"
            type="button"
            onClick={() => addSubtitle()}
            data-testid="subtitle-table-add"
          >
            + Thêm phụ đề
          </button>
          <span className="subtitle-table__status" data-testid="subtitle-table-status">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#059669"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            Sẵn sàng xuất file
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
                {/* Time column: start and end */}
                <div className="subtitle-table__col subtitle-table__col--time">
                  <div className="subtitle-table__time-group">
                    <input
                      className="subtitle-table__time-input"
                      type="text"
                      defaultValue={formatTimecode(cue.startTime)}
                      onBlur={(e) => handleTimeBlur(cue.id, "startTime", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`subtitle-start-${cue.id}`}
                    />
                    <input
                      className="subtitle-table__time-input"
                      type="text"
                      defaultValue={formatTimecode(cue.endTime)}
                      onBlur={(e) => handleTimeBlur(cue.id, "endTime", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`subtitle-end-${cue.id}`}
                    />
                  </div>
                </div>
                {/* Original text */}
                <div className="subtitle-table__col subtitle-table__col--original">
                  <textarea
                    className="subtitle-table__textarea"
                    defaultValue={cue.originalText}
                    onBlur={(e) => updateSubtitle(cue.id, "originalText", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    rows={2}
                    data-testid={`subtitle-original-${cue.id}`}
                  />
                </div>
                {/* Translated text */}
                <div className="subtitle-table__col subtitle-table__col--translated">
                  <textarea
                    className="subtitle-table__textarea"
                    defaultValue={cue.translatedText}
                    onBlur={(e) => updateSubtitle(cue.id, "translatedText", e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    rows={2}
                    data-testid={`subtitle-translated-${cue.id}`}
                  />
                </div>
                {/* Delete */}
                <div className="subtitle-table__col subtitle-table__col--actions">
                  <button
                    className="subtitle-table__delete-btn"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteSubtitle(cue.id); }}
                    data-testid={`subtitle-delete-${cue.id}`}
                    title="Xóa"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
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
