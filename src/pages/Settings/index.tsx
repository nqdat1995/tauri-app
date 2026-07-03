import { useEffect, useRef, useState } from "react";
import type { AppSettings } from "../../lib/types";
import { isTauriAvailable, loadSettings, saveSettings } from "../../lib/tauri";
import "./settings.css";

// Models available per provider
const MODELS_BY_PROVIDER: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o-mini", label: "gpt-4o-mini (Nhanh, tiết kiệm)" },
    { value: "gpt-4o", label: "gpt-4o (Chất lượng cao)" },
    { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
  ],
  gemini: [
    { value: "gemini-2.0-flash", label: "gemini-2.0-flash (Nhanh nhất)" },
    { value: "gemini-1.5-flash", label: "gemini-1.5-flash" },
    { value: "gemini-1.5-pro", label: "gemini-1.5-pro (Chất lượng cao)" },
  ],
  deepseek: [
    { value: "deepseek-chat", label: "deepseek-chat" },
    { value: "deepseek-reasoner", label: "deepseek-reasoner" },
  ],
};

const PROVIDER_LABELS: Record<string, { icon: string; name: string }> = {
  openai:   { icon: "✦", name: "OpenAI" },
  gemini:   { icon: "◈", name: "Google Gemini" },
  deepseek: { icon: "⬡", name: "DeepSeek" },
};

const TARGET_LANGUAGES = [
  { value: "Vietnamese", label: "🇻🇳 Tiếng Việt" },
  { value: "English",    label: "🇺🇸 English" },
  { value: "Chinese",    label: "🇨🇳 中文" },
  { value: "Japanese",   label: "🇯🇵 日本語" },
  { value: "Korean",     label: "🇰🇷 한국어" },
  { value: "French",     label: "🇫🇷 Français" },
  { value: "Spanish",    label: "🇪🇸 Español" },
  { value: "German",     label: "🇩🇪 Deutsch" },
];

const DEFAULT_SETTINGS: AppSettings = {
  provider: "openai",
  api_key: "",
  model: "gpt-4o-mini",
  target_language: "Vietnamese",
  chunk_size: 30,
};

type SaveState = "idle" | "saving" | "ok" | "error";

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings on mount
  useEffect(() => {
    if (!isTauriAvailable()) {
      setLoading(false);
      return;
    }
    loadSettings()
      .then((s) => setSettings(s))
      .catch(() => { /* use defaults */ })
      .finally(() => setLoading(false));
  }, []);

  // When provider changes, reset model to first option for that provider
  function handleProviderChange(provider: AppSettings["provider"]) {
    const firstModel = MODELS_BY_PROVIDER[provider]?.[0]?.value ?? "";
    setSettings((prev) => ({ ...prev, provider, model: firstModel }));
  }

  function handleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState("saving");
    setErrorMsg("");

    if (!isTauriAvailable()) {
      setSaveState("ok");
      saveTimerRef.current = setTimeout(() => setSaveState("idle"), 2500);
      return;
    }

    saveSettings(settings)
      .then(() => {
        setSaveState("ok");
        saveTimerRef.current = setTimeout(() => setSaveState("idle"), 2500);
      })
      .catch((e) => {
        setErrorMsg(e instanceof Error ? e.message : String(e));
        setSaveState("error");
        saveTimerRef.current = setTimeout(() => setSaveState("idle"), 4000);
      });
  }

  const models = MODELS_BY_PROVIDER[settings.provider] ?? [];

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="settings-spinner" />
        <span>Đang tải cài đặt…</span>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <header className="page-header">
        <div className="page-title">
          <p className="eyebrow">Cài đặt</p>
          <h1>Thiết lập ứng dụng</h1>
        </div>
      </header>

      {/* ── Section 1: AI Provider ── */}
      <div className="settings-card">
        <div className="settings-card-title">🤖 Nhà cung cấp AI</div>
        <div className="settings-card-desc">
          Chọn dịch vụ AI để dịch phụ đề. Mỗi nhà cung cấp yêu cầu API key riêng.
        </div>

        {/* Provider buttons */}
        <div className="settings-field">
          <label>Nhà cung cấp</label>
          <div className="provider-group">
            {Object.entries(PROVIDER_LABELS).map(([key, { icon, name }]) => (
              <button
                key={key}
                type="button"
                className={`provider-btn${settings.provider === key ? " selected" : ""}`}
                onClick={() => handleProviderChange(key as AppSettings["provider"])}
              >
                <span className="provider-icon">{icon}</span>
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Model dropdown */}
        <div className="settings-field">
          <label>
            Model
            <span className="model-tag">{settings.model}</span>
          </label>
          <select
            value={settings.model}
            onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}
          >
            {models.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <span className="field-hint">Chọn model phù hợp với nhu cầu và ngân sách.</span>
        </div>

        {/* API Key */}
        <div className="settings-field">
          <label>API Key</label>
          <div className="input-wrap">
            <input
              type={showKey ? "text" : "password"}
              value={settings.api_key}
              placeholder="Nhập API key của nhà cung cấp đã chọn…"
              onChange={(e) => setSettings((prev) => ({ ...prev, api_key: e.target.value }))}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="toggle-vis"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? "Ẩn API key" : "Hiện API key"}
            >
              {showKey ? "Ẩn" : "Hiện"}
            </button>
          </div>
          <span className="field-hint">
            Key được lưu cục bộ trên máy, không gửi đến server của chúng tôi.
          </span>
        </div>
      </div>

      {/* ── Section 2: Translation options ── */}
      <div className="settings-card">
        <div className="settings-card-title">🌐 Tùy chọn dịch thuật</div>
        <div className="settings-card-desc">Cấu hình ngôn ngữ và thông số dịch mặc định.</div>

        <div className="settings-grid-2">
          <div className="settings-field">
            <label>Ngôn ngữ đích mặc định</label>
            <select
              value={settings.target_language}
              onChange={(e) => setSettings((prev) => ({ ...prev, target_language: e.target.value }))}
            >
              {TARGET_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="settings-field">
            <label>
              Số đoạn / chunk
              <span className="model-tag">chunk_size</span>
            </label>
            <input
              type="number"
              min={5}
              max={200}
              value={settings.chunk_size}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  chunk_size: Math.max(5, Math.min(200, Number(e.target.value))),
                }))
              }
            />
            <span className="field-hint">
              Số đoạn phụ đề mỗi lần gọi API. Nhỏ hơn = ổn định hơn, lớn hơn = nhanh hơn.
            </span>
          </div>
        </div>
      </div>

      {/* ── Save row ── */}
      <div className="save-row">
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={saveState === "saving"}
        >
          {saveState === "saving" ? "Đang lưu…" : "💾 Lưu cài đặt"}
        </button>
        {saveState === "ok" && (
          <span className="save-feedback ok">✓ Đã lưu vào settings.json</span>
        )}
        {saveState === "error" && (
          <span className="save-feedback err">✗ {errorMsg || "Lưu thất bại"}</span>
        )}
      </div>
    </div>
  );
}
