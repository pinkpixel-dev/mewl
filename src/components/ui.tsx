import { type CSSProperties, type ComponentType, type PointerEvent, useRef } from "react";
import type { LucideProps } from "lucide-react";
import { Search } from "lucide-react";

type LucideIcon = ComponentType<LucideProps>;

type StatusTone = "online" | "warning" | "offline";

const toneMap: Record<StatusTone, { label: string; hex: string }> = {
  online: { label: "Online", hex: "#74f7b0" },
  warning: { label: "Warm", hex: "#fbbf24" },
  offline: { label: "Muted", hex: "#fb7185" },
};

export function StatusPill({
  tone,
  label,
}: {
  tone: StatusTone;
  label?: string;
}) {
  const palette = toneMap[tone];

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/72"
      style={
        {
          boxShadow: `inset 0 0 0 1px ${palette.hex}20`,
        } satisfies CSSProperties
      }
    >
      <span className="relative flex size-2.5">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-80"
          style={{ backgroundColor: `${palette.hex}88` }}
        />
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: palette.hex }}
        />
      </span>
      {label ?? palette.label}
    </span>
  );
}

export function ShinyButton({
  label,
  hex,
  icon: Icon,
  subtle = false,
  className = "",
}: {
  label: string;
  hex: string;
  icon?: LucideIcon;
  subtle?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);

  const updateGlow = (event: PointerEvent<HTMLButtonElement>) => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const bounds = element.getBoundingClientRect();
    const mx = ((event.clientX - bounds.left) / bounds.width) * 100;
    const my = ((event.clientY - bounds.top) / bounds.height) * 100;
    element.style.setProperty("--mx", `${mx}%`);
    element.style.setProperty("--my", `${my}%`);
  };

  return (
    <button
      ref={ref}
      onPointerMove={updateGlow}
      className={`group relative overflow-hidden rounded-[22px] border px-4 py-3 text-left transition duration-300 hover:-translate-y-0.5 ${
        subtle
          ? "border-white/10 bg-white/[0.04]"
          : "border-white/14 bg-white/[0.07]"
      } ${className}`}
      style={
        {
          boxShadow: subtle
            ? `0 18px 50px ${hex}18`
            : `0 24px 80px -30px ${hex}72`,
        } satisfies CSSProperties
      }
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={
          {
            background: `radial-gradient(circle at var(--mx, 50%) var(--my, 50%), ${hex}48 0, transparent 42%)`,
          } satisfies CSSProperties
        }
      />
      <span
        className="pointer-events-none absolute inset-[1px] rounded-[20px]"
        style={
          {
            background: subtle
              ? "linear-gradient(180deg, rgba(8, 10, 18, 0.88), rgba(10, 12, 20, 0.68))"
              : "linear-gradient(180deg, rgba(14, 16, 26, 0.92), rgba(8, 10, 18, 0.75))",
          } satisfies CSSProperties
        }
      />
      <span className="relative flex items-center gap-3">
        {Icon ? (
          <span
            className="grid size-10 place-items-center rounded-2xl border border-white/8 bg-white/[0.05] text-white/70 transition duration-300 group-hover:text-white"
            style={
              {
                boxShadow: `0 0 24px ${hex}22`,
              } satisfies CSSProperties
            }
          >
            <Icon size={18} />
          </span>
        ) : null}
        <span className="text-sm font-semibold tracking-[0.02em] text-white/90">
          {label}
        </span>
      </span>
    </button>
  );
}

export function SugarCard({
  title,
  value,
  hex,
  icon: Icon,
  detail,
  status,
}: {
  title: string;
  value: string;
  hex: string;
  icon: LucideIcon;
  detail: string;
  status?: StatusTone;
}) {
  return (
    <article
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl transition duration-300 hover:-translate-y-1"
      style={
        {
          boxShadow: `0 25px 80px -42px ${hex}88`,
        } satisfies CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${hex}, transparent)`,
        }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            {title}
          </p>
          <div className="space-y-1">
            <p className="text-3xl font-semibold text-white">{value}</p>
            <p className="text-sm text-white/52">{detail}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          {status ? <StatusPill tone={status} /> : null}
          <div
            className="grid size-11 place-items-center rounded-[20px] border border-white/10 bg-black/20 text-white/90"
            style={
              {
                color: hex,
                boxShadow: `0 0 30px ${hex}28`,
              } satisfies CSSProperties
            }
          >
            <Icon size={20} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function CandyInput({
  value,
  onChange,
  hex,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  hex: string;
  placeholder: string;
}) {
  return (
    <label className="group relative block">
      <span
        className="pointer-events-none absolute -inset-0.5 rounded-[22px] opacity-0 blur-xl transition duration-300 group-focus-within:opacity-100"
        style={{ backgroundColor: `${hex}26` }}
      />
      <span className="relative flex items-center gap-3 rounded-[22px] border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
        <Search
          size={18}
          className="transition duration-300 group-focus-within:text-white"
          style={{ color: `${hex}` }}
        />
        <input
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </span>
    </label>
  );
}

export function SweetToggle({
  label,
  checked,
  onChange,
  hex,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  hex: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-black/18 px-4 py-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-white/90">{label}</p>
        <p className="text-xs uppercase tracking-[0.22em] text-white/35">
          {checked ? "Enabled" : "Paused"}
        </p>
      </div>
      <span className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className="h-8 w-14 rounded-full border border-white/12 bg-white/10 transition duration-300 peer-checked:bg-white/15"
          style={
            checked
              ? ({
                  boxShadow: `inset 0 0 0 24px ${hex}`,
                } satisfies CSSProperties)
              : undefined
          }
        />
        <span
          className="absolute left-1 top-1 size-6 rounded-full bg-white shadow-lg transition duration-300 peer-checked:translate-x-6"
          style={
            checked
              ? ({
                  boxShadow: `0 0 18px ${hex}`,
                } satisfies CSSProperties)
              : undefined
          }
        />
      </span>
    </label>
  );
}

export function HologramProgress({
  label,
  value,
  hex,
}: {
  label: string;
  value: number;
  hex: string;
}) {
  return (
    <div className="space-y-3 rounded-[22px] border border-white/8 bg-black/18 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-white/85">{label}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: hex }}>
          {value}%
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-white/8 bg-black/40">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={
            {
              width: `${value}%`,
              background: `linear-gradient(90deg, ${hex}, color-mix(in srgb, ${hex} 35%, white))`,
              boxShadow: `0 0 28px ${hex}88`,
            } satisfies CSSProperties
          }
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-45"
          style={
            {
              width: `${value}%`,
              background:
                "repeating-linear-gradient(-45deg, rgba(255,255,255,0.26) 0 8px, rgba(255,255,255,0.04) 8px 16px)",
              animation: "hologram-stripe 1.5s linear infinite",
            } satisfies CSSProperties
          }
        />
      </div>
    </div>
  );
}

export function SignalBars({
  values,
  className = "",
  barClassName = "",
}: {
  values: number[];
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={`flex h-20 items-end gap-2 ${className}`}>
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={`w-3 rounded-full bg-gradient-to-t from-fuchsia-500/35 via-violet-400/65 to-cyan-300/90 ${barClassName}`}
          style={
            {
              height: `${value}%`,
              animation: "bar-drift 3.4s ease-in-out infinite",
              animationDelay: `${index * 0.18}s`,
              boxShadow: "0 0 28px rgba(125, 211, 252, 0.22)",
            } satisfies CSSProperties
          }
        />
      ))}
    </div>
  );
}
