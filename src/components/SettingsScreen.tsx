"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Unit } from "@/lib/types";
import { useStore } from "@/lib/store";
import { INCREMENT } from "@/lib/units";
import { Button, Card, Eyebrow, PageHeader, Skeleton } from "./ui";

export function SettingsScreen() {
  const hydrated = useStore((s) => s._hydrated);
  const settings = useStore((s) => s.settings);
  const sessions = useStore((s) => s.sessions);
  const setUnit = useStore((s) => s.setUnit);
  const updateSettings = useStore((s) => s.updateSettings);
  const exportJson = useStore((s) => s.exportJson);
  const importJson = useStore((s) => s.importJson);
  const clearAll = useStore((s) => s.clearAll);

  const [message, setMessage] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function changeUnit(unit: Unit) {
    if (unit === settings.unit) return;
    const ok =
      sessions.length === 0 ||
      window.confirm(`Convert every stored load to ${unit}? Loads round to the nearest ${INCREMENT[unit]} ${unit}.`);
    if (ok) setUnit(unit);
  }

  function download() {
    const text = exportJson();
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pandr5-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Exported.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportJson());
      setMessage("Copied JSON to clipboard.");
    } catch {
      setMessage("Clipboard blocked. Use download instead.");
    }
  }

  function doImport(text: string) {
    if (!text.trim()) return setMessage("Nothing to import.");
    if (sessions.length > 0 && !window.confirm("Importing replaces everything stored here. Continue?")) return;
    const err = importJson(text);
    setMessage(err ?? "Imported.");
    if (!err) setPasted("");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    doImport(await f.text());
    if (fileRef.current) fileRef.current.value = "";
  }

  function clear() {
    if (window.confirm("Delete every session and reset settings? Export first if you want a copy.")) {
      clearAll();
      setMessage("Cleared.");
    }
  }

  if (!hydrated) {
    return (
      <>
        <PageHeader title="Settings" />
        <Skeleton className="h-64" />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Stored in this browser only" title="Settings" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="reveal p-5">
          <Eyebrow>Units</Eyebrow>
          <div className="mt-2 flex rounded-md border border-line-2 p-0.5" role="radiogroup" aria-label="Unit">
            {(["lb", "kg"] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={settings.unit === u}
                onClick={() => changeUnit(u)}
                className={[
                  "display h-11 flex-1 rounded text-base font-bold uppercase tracking-[0.14em] transition-colors",
                  settings.unit === u ? "bg-oxide text-bone" : "text-bone-2 hover:text-bone",
                ].join(" ")}
              >
                {u}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-bone-3">
            Loads round to {INCREMENT[settings.unit]} {settings.unit}. Switching converts every stored load.
          </p>
        </Card>

        <Card className="reveal p-5" style={{ animationDelay: "60ms" }}>
          <Eyebrow>Progression</Eyebrow>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Percent
              label="Increase"
              hint="Post: 2–5%"
              value={settings.increasePercent}
              onChange={(v) => updateSettings({ increasePercent: v })}
            />
            <Percent
              label="Decrease"
              hint="Post: 2–3%"
              value={settings.decreasePercent}
              onChange={(v) => updateSettings({ decreasePercent: v })}
            />
          </div>
          <p className="mt-2 text-xs text-bone-3">
            Always at least one plate increment, so light loads still move.
          </p>
        </Card>

        <Card className="reveal p-5" style={{ animationDelay: "120ms" }}>
          <Eyebrow>Backup</Eyebrow>
          <p className="num mt-1 text-sm text-bone-2">{sessions.length} sessions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={download}>Download JSON</Button>
            <Button tone="ghost" onClick={copy}>
              Copy JSON
            </Button>
          </div>
        </Card>

        <Card className="reveal p-5" style={{ animationDelay: "180ms" }}>
          <Eyebrow>Restore</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button tone="ghost" onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
          </div>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Or paste exported JSON here"
            rows={3}
            className="num mt-3 w-full rounded-md border border-line-2 bg-ink p-2 text-xs text-bone placeholder:text-bone-3"
          />
          <Button tone="ghost" className="mt-2" onClick={() => doImport(pasted)} disabled={!pasted.trim()}>
            Import pasted
          </Button>
        </Card>

        <Card className="reveal border-oxide/40 p-5 lg:col-span-2" style={{ animationDelay: "240ms" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Eyebrow>Danger</Eyebrow>
              <p className="mt-1 text-sm text-bone-2">Wipe all sessions and settings from this browser.</p>
            </div>
            <Button tone="danger" onClick={clear}>
              Clear everything
            </Button>
          </div>
        </Card>
      </div>

      {message && (
        <p role="status" className="mt-4 rounded-md border border-line bg-ink-2 px-4 py-2 text-sm text-bone-2">
          {message}
        </p>
      )}

      <p className="mt-8 text-sm text-bone-3">
        <Link href="/about/" className="text-steel hover:underline">
          About the model
        </Link>
        {" · "}
        <Link href="/research/" className="text-steel hover:underline">
          Research sources
        </Link>
      </p>
    </>
  );
}

function Percent({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-bone-2">
        {label} <span className="text-bone-3">({hint})</span>
      </span>
      <span className="relative">
        <input
          type="number"
          inputMode="decimal"
          min={0.5}
          max={10}
          step={0.5}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0.5 && n <= 10) onChange(n);
          }}
          className="num h-11 w-full rounded-md border border-line-2 bg-ink px-3 pr-8 text-lg font-semibold text-bone"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-bone-3">%</span>
      </span>
    </label>
  );
}
