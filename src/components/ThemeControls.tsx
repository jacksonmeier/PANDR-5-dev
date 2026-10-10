"use client";

import { useEffect, useState } from "react";
import type { Surface, Theme, ThemeMode } from "@/lib/theme";
import {
  DEFAULT_THEME,
  PRESETS,
  accentSwatch,
  lineSwatch,
  resolveMode,
  resolveSurface,
  surfaceSwatch,
  textSwatch,
} from "@/lib/theme";
import { useStore } from "@/lib/store";
import { Button, Card, Eyebrow, Segmented } from "./ui";

const MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const SURFACES: { value: Surface; label: string }[] = [
  { value: "glass", label: "Glass" },
  { value: "classic", label: "Original" },
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
  const surface = resolveSurface(theme);
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
            A surface, a mode, and two colours: an accent, and a hue that tints everything else.
          </p>
        </div>
        <Preview theme={theme} mode={resolved} />
      </div>

      <div className="mt-5 grid gap-5">
        <div>
          <span className="eyebrow">Surface</span>
          <Segmented<Surface>
            label="Surface"
            className="mt-2"
            value={surface}
            onChange={(next) => set({ surface: next })}
            options={SURFACES}
          />
          <p className="mt-1.5 text-xs text-bone-3">
            {surface === "glass"
              ? "Frosted, translucent panels over a wash of your colours."
              : "The original look: flat, bordered panels on a plain page."}
          </p>
        </div>

        <div>
          <span className="eyebrow">Mode</span>
          <Segmented<ThemeMode>
            label="Colour mode"
            className="mt-2"
            value={theme.mode}
            onChange={(mode) => set({ mode })}
            options={MODES}
          />
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
                  className="preset press flex min-h-16 flex-col items-center justify-center gap-1.5 p-2"
                >
                  <span className="flex overflow-hidden rounded-full border border-bone/15 shadow-[0_2px_6px_oklch(0_0_0/0.25)]">
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bone/8 pt-4">
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
          className="field h-11 w-14 shrink-0 cursor-pointer"
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setDraft(value)}
          spellCheck={false}
          aria-label={`${label} hex value`}
          className="field num h-11 w-full min-w-0 px-4 text-base uppercase"
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
      className="relative flex w-36 flex-col gap-1.5 overflow-hidden rounded-well border border-bone/15 p-2.5 shadow-[0_8px_24px_-8px_oklch(0_0_0/0.4)]"
      style={{
        background: `radial-gradient(70% 60% at 85% 0%, ${accent}66, transparent 70%), ${surface}`,
      }}
    >
      <span className="h-2 w-12 rounded-full" style={{ background: accent }} />
      <span className="h-1.5 w-full rounded-full opacity-75" style={{ background: text }} />
      <span className="h-1.5 w-2/3 rounded-full opacity-45" style={{ background: text }} />
      <span className="mt-1 h-5 w-16 rounded-full" style={{ background: accent }} />
    </div>
  );
}
