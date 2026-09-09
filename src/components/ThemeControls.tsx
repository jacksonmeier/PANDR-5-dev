"use client";

import { useEffect, useState } from "react";
import type { Theme, ThemeMode } from "@/lib/theme";
import {
  DEFAULT_THEME,
  PRESETS,
  accentSwatch,
  lineSwatch,
  resolveMode,
  surfaceSwatch,
  textSwatch,
} from "@/lib/theme";
import { useStore } from "@/lib/store";
import { Button, Card, Eyebrow } from "./ui";

const MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeControls() {
  const theme = useStore((s) => s.settings.theme) ?? DEFAULT_THEME;
  const updateSettings = useStore((s) => s.updateSettings);
  const [prefersLight, setPrefersLight] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => setPrefersLight(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const resolved = resolveMode(theme.mode, prefersLight);
  const set = (patch: Partial<Theme>) =>
    updateSettings({ theme: { ...theme, ...patch } });

  const isPreset = (accent: string, tint: string) =>
    theme.accent.toLowerCase() === accent.toLowerCase() &&
    theme.tint.toLowerCase() === tint.toLowerCase();

  return (
    <Card className="reveal p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow>Appearance</Eyebrow>
          <p className="mt-1 text-sm text-bone-2">
            Two colours drive everything: an accent, and a hue that tints the surfaces.
          </p>
        </div>
        <Preview theme={theme} mode={resolved} />
      </div>

      <div className="mt-5 grid gap-5">
        <div>
          <span className="eyebrow">Mode</span>
          <div className="mt-2 flex rounded-md border border-line-2 p-0.5" role="radiogroup" aria-label="Colour mode">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={theme.mode === m.value}
                onClick={() => set({ mode: m.value })}
                className={[
                  "display h-11 flex-1 rounded text-base font-bold uppercase tracking-[0.14em] transition-colors",
                  theme.mode === m.value
                    ? "bg-oxide text-on-accent"
                    : "text-bone-2 hover:text-bone",
                ].join(" ")}
              >
                {m.label}
              </button>
            ))}
          </div>
          {theme.mode === "system" && (
            <p className="mt-1.5 text-xs text-bone-3">
              Following your device, which is currently {resolved}.
            </p>
          )}
        </div>

        <div>
          <span className="eyebrow">Presets</span>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PRESETS.map((p) => {
              const active = isPreset(p.accent, p.tint);
              const swatch = { accent: p.accent, tint: p.tint, mode: theme.mode };
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set({ accent: p.accent, tint: p.tint })}
                  aria-pressed={active}
                  className={[
                    "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-md border p-2 transition-colors",
                    active ? "border-oxide bg-ink-3" : "border-line hover:border-line-2",
                  ].join(" ")}
                >
                  <span className="flex overflow-hidden rounded-full border border-line-2">
                    <span
                      className="h-5 w-5"
                      style={{ background: accentSwatch(swatch, resolved) }}
                    />
                    <span className="h-5 w-4" style={{ background: lineSwatch(swatch, resolved) }} />
                    <span
                      className="h-5 w-5"
                      style={{ background: surfaceSwatch(swatch, resolved) }}
                    />
                  </span>
                  <span className="display text-[11px] font-bold uppercase tracking-wider text-bone-2">
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Accent"
            hint="Buttons, the active tab, the anchor bar"
            value={theme.accent}
            onChange={(accent) => set({ accent })}
          />
          <ColorField
            label="Background tint"
            hint="Only the hue and saturation are used"
            value={theme.tint}
            onChange={(tint) => set({ tint })}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-bone-3">
            The home screen icon keeps its own colours; it is baked at install time.
          </p>
          <Button
            tone="ghost"
            onClick={() => set({ accent: DEFAULT_THEME.accent, tint: DEFAULT_THEME.tint })}
          >
            Reset colours
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = (v: string) => {
    setDraft(v);
    if (/^#[0-9a-f]{6}$/i.test(v.trim())) onChange(v.trim().toLowerCase());
  };

  return (
    <label className="grid gap-1.5">
      <span className="text-sm text-bone">
        {label} <span className="text-bone-3">· {hint}</span>
      </span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} colour`}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-line-2 bg-ink p-1"
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setDraft(value)}
          spellCheck={false}
          aria-label={`${label} hex value`}
          className="num h-11 w-full min-w-0 rounded-md border border-line-2 bg-ink px-3 text-base uppercase text-bone"
        />
      </span>
    </label>
  );
}

/** Miniature of the app's own surfaces, so a pick can be judged before committing. */
function Preview({ theme, mode }: { theme: Theme; mode: "light" | "dark" }) {
  const accent = accentSwatch(theme, mode);
  const surface = surfaceSwatch(theme, mode);
  const text = textSwatch(theme, mode);
  return (
    <div
      aria-hidden
      className="flex w-36 flex-col gap-1.5 rounded-md border border-line-2 p-2.5"
      style={{ background: surface }}
    >
      <span className="h-2 w-12 rounded-full" style={{ background: accent }} />
      <span className="h-1.5 w-full rounded-full opacity-75" style={{ background: text }} />
      <span className="h-1.5 w-2/3 rounded-full opacity-45" style={{ background: text }} />
      <span className="mt-1 h-5 w-16 rounded" style={{ background: accent }} />
    </div>
  );
}
