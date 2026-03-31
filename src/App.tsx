import { type CSSProperties, useDeferredValue, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BellRing,
  Bot,
  CloudUpload,
  Cpu,
  Database,
  GitBranchPlus,
  HardDriveDownload,
  LayoutDashboard,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import {
  CandyInput,
  HologramProgress,
  ShinyButton,
  SignalBars,
  StatusPill,
  SugarCard,
  SweetToggle,
} from "./components/ui";

type ServerState = "online" | "warning" | "offline";

type ServerRecord = {
  id: number;
  name: string;
  region: string;
  branch: string;
  players: number;
  cpu: string;
  patch: string;
  state: ServerState;
};

const accent = {
  rose: "#ec4899",
  purple: "#8b5cf6",
  cyan: "#22d3ee",
  green: "#74f7b0",
  amber: "#fbbf24",
} as const;

const servers: ServerRecord[] = [
  {
    id: 1,
    name: "Whisker Edge",
    region: "Virginia",
    branch: "stable",
    players: 842,
    cpu: "42%",
    patch: "v0.9.8",
    state: "online",
  },
  {
    id: 2,
    name: "Velvet Relay",
    region: "Frankfurt",
    branch: "preview",
    players: 315,
    cpu: "71%",
    patch: "v0.9.9-rc1",
    state: "warning",
  },
  {
    id: 3,
    name: "Purr Harbor",
    region: "Singapore",
    branch: "stable",
    players: 667,
    cpu: "38%",
    patch: "v0.9.8",
    state: "online",
  },
  {
    id: 4,
    name: "Moon Socket",
    region: "Oregon",
    branch: "sandbox",
    players: 0,
    cpu: "12%",
    patch: "maintenance",
    state: "offline",
  },
];

const activityFeed = [
  { title: "Canary deploy", stamp: "2m" },
  { title: "Shield policy", stamp: "11m" },
  { title: "Snapshot archived", stamp: "27m" },
];

const navItems = [
  { label: "Fleet", icon: LayoutDashboard, active: true, hex: accent.rose },
  { label: "Nodes", icon: Server, hex: accent.cyan },
  { label: "Pipelines", icon: GitBranchPlus, hex: accent.purple },
  { label: "Backups", icon: HardDriveDownload, hex: accent.amber },
  { label: "Automation", icon: Bot, hex: accent.green },
];

const stateClasses: Record<ServerState, string> = {
  online: "text-emerald-200",
  warning: "text-amber-200",
  offline: "text-rose-200",
};

const surfaceCardClass =
  "relative overflow-hidden rounded-[30px] border border-white/8 bg-[#0f141b]/94 p-5 sm:p-6";

function App() {
  const [query, setQuery] = useState("");
  const [autoscale, setAutoscale] = useState(true);
  const [guardianMode, setGuardianMode] = useState(true);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const value = deferredQuery.trim().toLowerCase();
  const filteredServers = value
    ? servers.filter((server) =>
        [server.name, server.region, server.branch, server.patch]
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
    : servers;

  return (
    <div className="min-h-screen px-4 py-4 text-white sm:px-5 lg:px-6">
      <div className="mewl-shell mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1680px] gap-4 xl:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="glass-panel relative flex overflow-hidden rounded-[34px] p-5 xl:flex-col">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/35 to-transparent" />
          <div className="flex items-center gap-4">
            <img
              src="/icon.png"
              alt="Mewl icon"
              className="size-20 rounded-[18px] border border-white/10 object-cover shadow-[0_0_32px_rgba(148,163,184,0.18)]"
            />
            <p className="text-[1.0rem] font-semibold uppercase tracking-[0.32em] text-white/50">
              Mewl
            </p>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map(({ label, icon: Icon, active, hex }) => (
              <button
                key={label}
                className={`flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition duration-300 ${
                  active
                    ? "border-white/12 bg-[#11161d]/94 text-white"
                    : "border-transparent bg-[#0e1319]/78 text-white/62 hover:border-white/10 hover:bg-[#11161d]/90 hover:text-white"
                }`}
                style={
                  active
                    ? ({
                        boxShadow: `0 20px 56px -36px ${hex}`,
                      } satisfies CSSProperties)
                    : undefined
                }
              >
                <span className="flex items-center gap-3">
                  <span
                    className="grid size-10 place-items-center rounded-2xl border border-white/8 bg-black/18"
                    style={
                      active
                        ? ({
                            color: hex,
                            boxShadow: `0 0 24px ${hex}24`,
                          } satisfies CSSProperties)
                        : undefined
                    }
                  >
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </span>
                {active ? <ArrowUpRight size={16} /> : null}
              </button>
            ))}
          </nav>

          <div
            className="mt-10 rounded-[28px] border border-white/8 bg-[#0f141b]/94 p-4"
            style={{ boxShadow: "0 24px 80px -48px rgba(34, 211, 238, 0.4)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                  Flow Health
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">97.4%</p>
              </div>
              <StatusPill tone="online" label="Stable" />
            </div>
            <div className="mt-5 rounded-[24px] border border-white/8 bg-black/18 px-3 py-4">
              <SignalBars
                values={[34, 58, 72, 66, 88, 76, 92, 82]}
                className="w-full justify-between gap-1.5"
                barClassName="min-w-0 flex-1"
              />
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col gap-4">
          <section className="glass-panel rounded-[34px] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">
                Active Workspace
              </p>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAlertsOpen((open) => !open)}
                  className="relative grid size-12 place-items-center rounded-[20px] border border-white/10 bg-[#0f141b]/94 transition duration-300 hover:border-white/18"
                  style={{
                    boxShadow: alertsOpen
                      ? `0 18px 50px -30px ${accent.amber}`
                      : "0 18px 50px -42px rgba(0, 0, 0, 0.95)",
                  }}
                >
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
                  <BellRing
                    size={18}
                    style={{ color: alertsOpen ? accent.amber : "rgba(255,255,255,0.72)" }}
                  />
                </button>

                {alertsOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.85rem)] z-30 w-[320px] rounded-[26px] border border-white/8 bg-[#0c1015]/96 p-3 shadow-[0_34px_90px_-42px_rgba(0,0,0,0.96)] backdrop-blur-2xl">
                    <div className="space-y-2">
                      {activityFeed.map((item, index) => (
                        <article
                          key={item.title}
                          className="flex items-center justify-between rounded-[20px] border border-white/8 bg-[#10151c]/92 px-4 py-3"
                          style={{
                            boxShadow:
                              index === 0
                                ? `0 18px 42px -34px ${accent.amber}`
                                : "none",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="size-2 rounded-full"
                              style={{
                                backgroundColor:
                                  index === 0
                                    ? accent.amber
                                    : index === 1
                                      ? accent.cyan
                                      : accent.purple,
                              }}
                            />
                            <p className="text-sm font-medium text-white/88">
                              {item.title}
                            </p>
                          </div>
                          <p className="text-xs uppercase tracking-[0.22em] text-white/34">
                            {item.stamp}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] xl:items-start">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                <ShinyButton
                  label="Ship Patch"
                  hex={accent.rose}
                  icon={Rocket}
                  className="w-full"
                />
                <ShinyButton
                  label="Sync Backups"
                  hex={accent.purple}
                  icon={CloudUpload}
                  className="w-full"
                />
                <ShinyButton
                  label="Review Alerts"
                  hex={accent.amber}
                  icon={BellRing}
                  className="w-full"
                />
                <ShinyButton
                  label="Inspect Metrics"
                  hex={accent.cyan}
                  icon={Activity}
                  subtle
                  className="w-full"
                />
              </div>

              <div className="w-full xl:justify-self-end">
                <CandyInput
                  value={query}
                  onChange={setQuery}
                  hex={accent.green}
                  placeholder="Search clusters, regions, branches..."
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
              <div
                className={surfaceCardClass}
                style={{
                  boxShadow: `0 26px 84px -50px ${accent.rose}`,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                      Workspace
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">
                      Mewl
                    </h3>
                  </div>
                  <StatusPill tone="online" label="Protected" />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Regions", "04"],
                    ["Preview", "01"],
                    ["Storage", "13.2 TB"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[22px] border border-white/8 bg-black/18 px-4 py-4"
                    >
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/38">
                        {label}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={surfaceCardClass}
                style={{
                  boxShadow: `0 26px 84px -50px ${accent.cyan}`,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                      Live Pulse
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      24 ms
                    </p>
                  </div>
                  <div className="grid size-12 place-items-center rounded-[20px] border border-white/10 bg-black/18">
                    <Waypoints size={22} className="text-cyan-300" />
                  </div>
                </div>
                <div className="mt-5 rounded-[22px] border border-white/8 bg-black/18 p-4">
                  <SignalBars values={[22, 40, 56, 80, 61, 74, 68, 90]} />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <SugarCard
              title="Fleet"
              value="14 / 15"
              hex={accent.green}
              icon={Server}
              status="online"
            />
            <SugarCard
              title="Mean CPU"
              value="41.8%"
              hex={accent.amber}
              icon={Cpu}
              status="warning"
            />
            <SugarCard
              title="Snapshots"
              value="32"
              hex={accent.purple}
              icon={Database}
              status="online"
            />
            <SugarCard
              title="Alerts"
              value="06"
              hex={accent.rose}
              icon={BellRing}
              status="warning"
            />
          </section>

          <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
            <div
              className="glass-panel min-w-0 rounded-[34px] p-5 sm:p-6"
              style={{
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 100px -54px ${accent.green}`,
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                    Fleet
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Managed Nodes
                  </h3>
                </div>
                <ShinyButton
                  label="New Cluster"
                  hex={accent.green}
                  icon={Sparkles}
                  subtle
                />
              </div>

              <div className="mt-6 overflow-x-auto rounded-[28px] border border-white/8 bg-black/18">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.9fr] gap-4 border-b border-white/8 px-5 py-4 text-xs uppercase tracking-[0.24em] text-white/38">
                    <span>Server</span>
                    <span>Region</span>
                    <span>Branch</span>
                    <span>CPU</span>
                    <span>Status</span>
                  </div>

                  <div className="divide-y divide-white/6">
                    {filteredServers.map((server) => (
                      <div
                        key={server.id}
                        className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.9fr] gap-4 px-5 py-4 transition duration-300 hover:bg-white/[0.03]"
                      >
                        <p className="truncate text-sm font-medium text-white">
                          {server.name}
                        </p>
                        <p className="text-sm text-white/64">{server.region}</p>
                        <p className="text-sm text-white/64">{server.branch}</p>
                        <p className="text-sm text-white/78">{server.cpu}</p>
                        <p
                          className={`text-sm font-medium capitalize ${stateClasses[server.state]}`}
                        >
                          {server.state}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="glass-panel rounded-[34px] p-5 sm:p-6"
              style={{
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 100px -54px ${accent.purple}`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                    Guardrails
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Automation
                  </h3>
                </div>
                <div className="grid size-11 place-items-center rounded-[20px] border border-white/10 bg-black/18">
                  <ShieldCheck size={20} className="text-violet-300" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <SweetToggle
                  label="Autoscale"
                  checked={autoscale}
                  onChange={setAutoscale}
                  hex={accent.rose}
                />
                <SweetToggle
                  label="Guardian Lock"
                  checked={guardianMode}
                  onChange={setGuardianMode}
                  hex={accent.purple}
                />
              </div>

              <div className="mt-5 space-y-3">
                <HologramProgress
                  label="Deploy Queue"
                  value={68}
                  hex={accent.amber}
                />
                <HologramProgress
                  label="Backup Coverage"
                  value={92}
                  hex={accent.green}
                />
                <HologramProgress
                  label="Alert Noise"
                  value={23}
                  hex={accent.cyan}
                />
                <HologramProgress
                  label="Node Headroom"
                  value={61}
                  hex={accent.rose}
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
