/**
 * Shared filter toolbar primitives: FilterDropdown, SortDropdown, FilterChip.
 * Used across Schools, Courses, Companies list views.
 */
import { useState, useRef, useEffect, useCallback } from "react";

// ─── Shared popover hook ──────────────────────────────────────────────────────

function usePopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onMouse(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return { open, setOpen, rootRef, close };
}

// ─── Shared panel ─────────────────────────────────────────────────────────────

function Panel({ align, children }: { align: "left" | "right"; children: React.ReactNode }) {
  return (
    <div
      className={[
        "absolute top-full z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-lg border border-border bg-popover shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-100",
        align === "right" ? "right-0" : "left-0",
      ].join(" ")}
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

// ─── Shared trigger button ────────────────────────────────────────────────────

function TriggerButton({
  open,
  active,
  badge,
  onClick,
  children,
}: {
  open: boolean;
  active: boolean;
  badge?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={[
        "inline-flex h-9 items-center justify-start gap-1.5 rounded-md border px-3 text-left text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        active
          ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
          : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
      ].join(" ")}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
          {badge}
        </span>
      )}
      <svg
        className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

// ─── FilterDropdown (multi-select, stays open) ────────────────────────────────

export interface FilterOption {
  id: string;
  name: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  align?: "left" | "right";
}

export function FilterDropdown({
  label, options, selected, onToggle, align = "left",
}: FilterDropdownProps) {
  const { open, setOpen, rootRef } = usePopover();

  return (
    <div ref={rootRef} className="relative">
      <TriggerButton
        open={open}
        active={selected.size > 0}
        badge={selected.size}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </TriggerButton>

      {open && (
        <Panel align={align}>
          {options.map((opt) => {
            const checked = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                onClick={() => onToggle(opt.id)}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span
                  className={[
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background",
                  ].join(" ")}
                >
                  {checked && (
                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-left">{opt.name}</span>
              </button>
            );
          })}
        </Panel>
      )}
    </div>
  );
}

// ─── SortDropdown (single-select, closes on selection) ────────────────────────

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  align?: "left" | "right";
  /** Override active (highlighted) styling — defaults to false */
  isActive?: boolean;
  /** Label prefix shown before the current value, e.g. "Sort" → "Sort: Name A–Z" */
  label?: string;
}

export function SortDropdown({ options, value, onChange, align = "left", isActive = false, label }: SortDropdownProps) {
  const { open, setOpen, rootRef, close } = usePopover();
  const current = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      <TriggerButton
        open={open}
        active={isActive}
        onClick={() => setOpen((v) => !v)}
      >
        {label && <span className={isActive ? undefined : "text-muted-foreground"}>{label}:</span>}
        <span>{current?.label ?? value}</span>
      </TriggerButton>

      {open && (
        <Panel align={align}>
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => { onChange(opt.value); close(); }}
                className={[
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  selected ? "text-primary font-medium" : "text-popover-foreground",
                ].join(" ")}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {selected && (
                    <svg className="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-left">{opt.label}</span>
              </button>
            );
          })}
        </Panel>
      )}
    </div>
  );
}

// ─── FilterToggle (boolean on/off button) ─────────────────────────────────────

interface FilterToggleProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function FilterToggle({ label, active, onToggle }: FilterToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        active
          ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
          : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
      ].join(" ")}
    >
      {active && (
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {label}
    </button>
  );
}

// ─── FilterChip (active filter pill with × remove) ───────────────────────────

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 pl-2.5 pr-1.5 py-0.5 text-xs font-medium text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
      >
        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// ─── ResultCount ──────────────────────────────────────────────────────────────

/** Plural form for count !== 1; default is noun + "s" (works for game, job, result, …). */
function pluralNoun(noun: string, count: number): string {
  if (count === 1) return noun;
  if (noun === "company") return "companies";
  return `${noun}s`;
}

interface ResultCountProps {
  count: number;
  total: number;
  noun?: string;
}

export function ResultCount({ count, total, noun = "result" }: ResultCountProps) {
  const line = (n: number) => `${n} ${pluralNoun(noun, n)}`;
  return (
    <p className="text-right text-xs text-muted-foreground">
      {count === total ? line(total) : `Filtering ${count} of ${total} ${pluralNoun(noun, total)}`}
    </p>
  );
}
