export type LanguageOption = "english" | "chinese" | "japanese" | "korean";
export type OutputOption = "subtitle" | "audio" | "video";

interface OptionPanelProps {
  language: LanguageOption;
  output: OutputOption;
  onLanguageChange: (value: LanguageOption) => void;
  onOutputChange: (value: OutputOption) => void;
}

const languageOptions: { key: LanguageOption; label: string }[] = [
  { key: "chinese", label: "Tiếng Trung" },
  { key: "english", label: "Tiếng Anh" },
  { key: "japanese", label: "Tiếng Nhật" },
  { key: "korean", label: "Tiếng Hàn" },
];

const outputOptions: { key: OutputOption; label: string }[] = [
  { key: "subtitle", label: "Phụ đề" },
  { key: "audio", label: "Audio" },
  { key: "video", label: "Video mới" },
];

export function OptionPanel({
  language,
  output,
  onLanguageChange,
  onOutputChange,
}: OptionPanelProps) {
  return (
    <section className="options">
      <div className="section-header">
        <h3>Tùy chọn dịch</h3>
        <p>Chọn ngôn ngữ và dạng đầu ra phù hợp với nhu cầu của bạn.</p>
      </div>
      <div className="row">
        <label>Ngôn ngữ dịch</label>
        <div className="group">
          {languageOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={option.key === language ? "selected" : ""}
              onClick={() => onLanguageChange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="row">
        <label>Đầu ra</label>
        <div className="group">
          {outputOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={option.key === output ? "selected" : ""}
              onClick={() => onOutputChange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
