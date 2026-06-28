interface UploadCardProps {
  onChooseFiles: () => void;
  selectedCount: number;
}

export function UploadCard({ onChooseFiles, selectedCount }: UploadCardProps) {
  return (
    <section className="upload-card">
      <div className="dropzone">
        <div className="icon">📁</div>
        <h3>Thả video vào đây</h3>
        <p>Hoặc nhấp để chọn tệp từ máy tính và bắt đầu dịch</p>
        <div className="button-row">
          <button className="secondary" type="button" onClick={onChooseFiles}>
            Chọn tệp
          </button>
        </div>
        {selectedCount > 0 && <p className="selection-info">Đã chọn {selectedCount} video</p>}
      </div>
    </section>
  );
}
