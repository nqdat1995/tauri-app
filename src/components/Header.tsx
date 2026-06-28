type HeaderProps = {
  onExport?: () => void;
  disabled?: boolean;
};

export function Header({ onExport, disabled }: HeaderProps) {
  return (
    <header className="page-header">
      <div className="page-title">
        <p className="eyebrow">Ứng dụng dịch video</p>
        <h1>Chuyển đổi video nhanh chóng và trực quan</h1>
      </div>
      <button className={"primary" + (disabled ? " disabled" : "")} onClick={() => onExport && onExport()} disabled={disabled}>
        Dịch & xuất <span className="badge">Mới</span>
      </button>
    </header>
  );
}
