import { type CSSProperties, type ComponentType, type PointerEvent, useRef } from "react";
import type { LucideProps } from "lucide-react";
import { Search } from "lucide-react";

type LucideIcon = ComponentType<LucideProps>;

type StatusTone = "online" | "warning" | "offline" | "starting";

const toneMap: Record<StatusTone, { label: string; hex: string }> = {
  online: { label: "Online", hex: "#74f7b0" },
  warning: { label: "Warning", hex: "#fbbf24" },
  offline: { label: "Offline", hex: "#fb7185" },
  starting: { label: "Starting", hex: "#22d3ee" },
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
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#090c10]/88 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/72"
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
  disabled = false,
  onClick,
}: {
  label: string;
  hex: string;
  icon?: LucideIcon;
  subtle?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);

  const updateGlow = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

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
      type="button"
      onClick={onClick}
      disabled={disabled}
      onPointerMove={updateGlow}
      className={`group relative overflow-hidden rounded-[22px] border px-4 py-3 text-left transition duration-300 ${
        disabled ? "cursor-not-allowed opacity-55" : "hover:-translate-y-0.5"
      } ${
        subtle
          ? "border-white/10 bg-[#0e1218]/92"
          : "border-white/12 bg-[#11161d]/94"
      } ${className}`}
      style={
        {
          boxShadow: subtle
            ? `0 18px 50px -36px ${disabled ? `${hex}30` : `${hex}88`}`
            : `0 22px 70px -34px ${disabled ? `${hex}30` : `${hex}92`}`,
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
              ? "linear-gradient(180deg, rgba(17, 22, 29, 0.94), rgba(12, 16, 22, 0.88))"
              : "linear-gradient(180deg, rgba(19, 24, 32, 0.96), rgba(12, 16, 22, 0.92))",
          } satisfies CSSProperties
        }
      />
      <span className="relative flex items-center gap-3">
        {Icon ? (
          <span
            className="grid size-10 place-items-center rounded-2xl border border-white/8 bg-black/18 text-white/70 transition duration-300 group-hover:text-white"
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
  detail?: string;
  status?: StatusTone;
}) {
  return (
    <article
      className="group relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0f141b]/94 p-5 backdrop-blur-2xl transition duration-300 hover:-translate-y-1"
      style={
        {
          boxShadow: `0 26px 84px -48px ${hex}88`,
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
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            {title}
          </p>
          <div className="space-y-1">
            <p className="text-3xl font-semibold text-white">{value}</p>
            {detail ? <p className="text-sm text-white/52">{detail}</p> : null}
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
      <span className="relative flex items-center gap-3 rounded-[22px] border border-white/10 bg-[#0f141b]/94 px-4 py-3 backdrop-blur-xl">
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
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  hex: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-[#0f141b]/94 px-4 py-4 ${
        disabled ? "opacity-55" : ""
      }`}
    >
      <p className="text-sm font-medium text-white/90">{label}</p>
      <span className={`relative inline-flex items-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
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
  valueLabel,
  detail,
  inactive = false,
}: {
  label: string;
  value: number;
  hex: string;
  valueLabel?: string;
  detail?: string;
  inactive?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-[22px] border border-white/8 bg-[#0f141b]/94 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-white/85">{label}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: hex }}>
          {valueLabel ?? `${value}%`}
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-white/8 bg-black/40">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={
            {
              width: `${value}%`,
              background: inactive
                ? "linear-gradient(90deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06))"
                : `linear-gradient(90deg, ${hex}, color-mix(in srgb, ${hex} 35%, white))`,
              boxShadow: inactive ? "none" : `0 0 28px ${hex}88`,
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
              animation: inactive ? "none" : "hologram-stripe 1.5s linear infinite",
            } satisfies CSSProperties
          }
        />
      </div>
      {detail ? <p className="text-xs leading-5 text-white/44">{detail}</p> : null}
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
          className={`w-3 rounded-full ${barClassName}`}
          style={
            {
              height: `${value}%`,
              animation: "bar-drift 3.4s ease-in-out infinite",
              animationDelay: `${index * 0.18}s`,
              background:
                "linear-gradient(180deg, rgba(34,211,238,0.96) 0%, rgba(116,247,176,0.92) 28%, rgba(251,191,36,0.86) 56%, rgba(236,72,153,0.82) 82%, rgba(139,92,246,0.74) 100%)",
              boxShadow: "0 0 28px rgba(148, 163, 184, 0.2)",
            } satisfies CSSProperties
          }
        />
      ))}
    </div>
  );
}

function buildTrendPath(values: number[], width: number, height: number): string {
  if (values.length === 0) {
    return "";
  }

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - (Math.max(0, Math.min(100, value)) / 100) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildTrendArea(path: string, width: number, height: number): string {
  if (!path) {
    return "";
  }

  return `${path} L ${width} ${height} L 0 ${height} Z`;
}

export function PulseLineChart({
  label,
  valueLabel,
  detail,
  values,
  hex,
  inactive = false,
  compact = false,
}: {
  label: string;
  valueLabel: string;
  detail?: string;
  values: number[];
  hex: string;
  inactive?: boolean;
  compact?: boolean;
}) {
  const width = 300;
  const height = compact ? 72 : 132;
  const paddedValues = values.length > 1 ? values : [...values, ...values];
  const path = buildTrendPath(paddedValues, width, height);
  const areaPath = buildTrendArea(path, width, height);
  const latestValue = paddedValues[paddedValues.length - 1] ?? 0;

  return (
    <article className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${hex}, transparent)` }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">{label}</p>
          <p className="mt-2 text-xl font-semibold text-white">{valueLabel}</p>
        </div>
        <div
          className="rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em]"
          style={{
            color: inactive ? "rgba(255,255,255,0.42)" : hex,
            borderColor: inactive ? "rgba(255,255,255,0.08)" : `${hex}30`,
            backgroundColor: inactive ? "rgba(0,0,0,0.18)" : `${hex}12`,
          }}
        >
          {Math.round(latestValue)}%
        </div>
      </div>

      <div className={`relative mt-4 overflow-hidden rounded-[20px] border border-white/8 bg-black/24 ${compact ? "h-24" : "h-40"}`}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_24%),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100%_100%,14.285%_100%,100%_25%] opacity-45" />
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          {areaPath ? (
            <path
              d={areaPath}
              fill={inactive ? "rgba(255,255,255,0.08)" : `${hex}22`}
              style={{
                filter: inactive ? undefined : `drop-shadow(0 0 18px ${hex}44)`,
              }}
            />
          ) : null}
          {path ? (
            <path
              d={path}
              fill="none"
              stroke={inactive ? "rgba(255,255,255,0.24)" : hex}
              strokeWidth={compact ? 2.5 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </svg>
      </div>

      {detail ? <p className="relative mt-3 text-xs leading-5 text-white/44">{detail}</p> : null}
    </article>
  );
}
