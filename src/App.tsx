import { useDeferredValue, useState } from "react";
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
  {
    title: "Canary deploy completed",
    detail: "Velvet Relay rolled to v0.9.9-rc1 without packet drift.",
    stamp: "2m ago",
  },
  {
    title: "Shield policy refreshed",
    detail: "Ingress rules synced to all public edge clusters.",
    stamp: "11m ago",
  },
  {
    title: "Snapshot archived",
    detail: "Nightly backup staged to Glacier storage and verified.",
    stamp: "27m ago",
  },
];

const navItems = [
  { label: "Fleet", icon: LayoutDashboard, active: true },
  { label: "Nodes", icon: Server },
  { label: "Pipelines", icon: GitBranchPlus },
  { label: "Backups", icon: HardDriveDownload },
  { label: "Automation", icon: Bot },
];

const stateClasses: Record<ServerState, string> = {
  online: "text-emerald-200",
  warning: "text-amber-200",
  offline: "text-rose-200",
};

function App() {
  const [query, setQuery] = useState("");
  const [autoscale, setAutoscale] = useState(true);
  const [guardianMode, setGuardianMode] = useState(true);
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
      <div className="mewl-shell mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1680px] flex-col gap-4 xl:flex-row">
        <aside className="glass-panel relative flex overflow-hidden rounded-[34px] p-5 xl:w-[292px] xl:flex-col">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent" />
          <div className="flex items-center gap-4">
            <img
              src="/icon.png"
              alt="Mewl icon"
              className="size-16 rounded-[18px] border border-white/10 object-cover shadow-[0_0_35px_rgba(236,72,153,0.28)]"
            />
            <div>
              <p className="text-[0.9rem] font-semibold uppercase tracking-[0.32em] text-white/45">
                Mewl
              </p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                className={`flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition duration-300 ${
                  active
                    ? "border-fuchsia-400/20 bg-fuchsia-400/10 text-white shadow-[0_0_40px_rgba(236,72,153,0.14)]"
                    : "border-transparent bg-white/[0.025] text-white/62 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl border border-white/8 bg-black/20">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </span>
                {active ? <ArrowUpRight size={16} /> : null}
              </button>
            ))}
          </nav>

          <div className="mt-10 rounded-[28px] border border-white/8 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                  Flow Health
                </p>
                <p className="text-3xl font-semibold text-white">97.4%</p>
                <p className="text-sm text-white/48">sync confidence</p>
              </div>
              <StatusPill tone="online" label="Stable" />
            </div>
            <div className="mt-5 rounded-[24px] border border-white/8 bg-black/22 px-3 py-4">
              <SignalBars
                values={[34, 58, 72, 66, 88, 76, 92, 82]}
                className="w-full justify-between gap-1.5"
                barClassName="min-w-0 flex-1"
              />
            </div>
          </div>

          <div className="mt-auto hidden pt-10 text-xs uppercase tracking-[0.24em] text-white/32 xl:block">
            Made with 💖 by Pink Pixel
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="glass-panel rounded-[34px] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/42">
              Active Workspace
            </p>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] xl:items-start">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                <ShinyButton
                  label="Ship Patch"
                  hex="#ec4899"
                  icon={Rocket}
                  className="w-full"
                />
                <ShinyButton
                  label="Sync Backups"
                  hex="#8b5cf6"
                  icon={CloudUpload}
                  className="w-full"
                />
                <ShinyButton
                  label="Review Alerts"
                  hex="#ec4899"
                  icon={BellRing}
                  className="w-full"
                />
                <ShinyButton
                  label="Inspect Metrics"
                  hex="#22d3ee"
                  icon={Activity}
                  subtle
                  className="w-full"
                />
              </div>

              <div className="w-full xl:justify-self-end">
                <CandyInput
                  value={query}
                  onChange={setQuery}
                  hex="#ec4899"
                  placeholder="Search clusters, regions, branches, or patch labels..."
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
              <div className="rounded-[30px] border border-white/8 bg-black/18 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                      Current Deck
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">
                      Mewl Control Deck
                    </h3>
                  </div>
                  <StatusPill tone="online" label="Protected" />
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
                  The scaffold leans into your mockup with a dark dotted
                  atmosphere, a fixed navigation rail, wide command surface, and
                  compact frosted utilities instead of a bright default dashboard.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/58">
                    4 regions online
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/58">
                    1 preview branch
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/58">
                    13.2 TB stored
                  </span>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/8 bg-gradient-to-br from-fuchsia-500/14 via-violet-500/10 to-cyan-400/10 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                      Live Pulse
                    </p>
                    <p className="mt-2 text-2xl font-semibold">24 ms</p>
                  </div>
                  <div className="grid size-12 place-items-center rounded-[20px] border border-white/10 bg-black/20">
                    <Waypoints size={22} className="text-cyan-300" />
                  </div>
                </div>
                <div className="mt-5 rounded-[22px] border border-white/8 bg-black/18 p-4">
                  <p className="text-sm text-white/64">
                    Route balance is holding steady across east-west traffic and
                    matchmaking ingress.
                  </p>
                  <div className="mt-5">
                    <SignalBars values={[22, 40, 56, 80, 61, 74, 68, 90]} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <SugarCard
              title="Fleet Availability"
              value="14 / 15"
              detail="healthy clusters holding under target latency"
              hex="#ec4899"
              icon={Server}
              status="online"
            />
            <SugarCard
              title="Mean CPU"
              value="41.8%"
              detail="preview branch is carrying the hottest load"
              hex="#22d3ee"
              icon={Cpu}
              status="warning"
            />
            <SugarCard
              title="Protected Snapshots"
              value="32"
              detail="retention jobs landed on schedule overnight"
              hex="#8b5cf6"
              icon={Database}
              status="online"
            />
          </section>

          <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
            <div className="glass-panel min-w-0 rounded-[34px] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                    Fleet Surface
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    Managed server nodes
                  </h3>
                </div>
                <ShinyButton
                  label="New Cluster"
                  hex="#74f7b0"
                  icon={Sparkles}
                  subtle
                />
              </div>

              <div className="mt-6 overflow-x-auto rounded-[28px] border border-white/8 bg-black/20">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.9fr] gap-4 border-b border-white/8 px-5 py-4 text-xs uppercase tracking-[0.24em] text-white/38">
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
                        className="grid grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.9fr] gap-4 px-5 py-4 transition duration-300 hover:bg-white/[0.035]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {server.name}
                          </p>
                          <p className="truncate text-xs uppercase tracking-[0.18em] text-white/34">
                            {server.patch} · {server.players} active sessions
                          </p>
                        </div>
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

            <div className="flex flex-col gap-4">
              <div className="glass-panel rounded-[34px] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                      Runtime Guardrails
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      Automation knobs
                    </h3>
                  </div>
                  <div className="grid size-11 place-items-center rounded-[20px] border border-white/10 bg-black/20">
                    <ShieldCheck size={20} className="text-emerald-300" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <SweetToggle
                    label="Autoscale balancing"
                    checked={autoscale}
                    onChange={setAutoscale}
                    hex="#ec4899"
                  />
                  <SweetToggle
                    label="Guardian lock mode"
                    checked={guardianMode}
                    onChange={setGuardianMode}
                    hex="#8b5cf6"
                  />
                </div>
                <div className="mt-5 space-y-3">
                  <HologramProgress
                    label="Deploy queue saturation"
                    value={68}
                    hex="#ec4899"
                  />
                  <HologramProgress
                    label="Backup coverage"
                    value={92}
                    hex="#74f7b0"
                  />
                  <HologramProgress
                    label="Alert noise"
                    value={23}
                    hex="#22d3ee"
                  />
                </div>
              </div>

              <div className="glass-panel rounded-[34px] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                      Activity Thread
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      Most recent changes
                    </h3>
                  </div>
                  <BellRing size={18} className="text-fuchsia-300" />
                </div>
                <div className="mt-5 space-y-4">
                  {activityFeed.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-[22px] border border-white/8 bg-black/18 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium text-white">
                          {item.title}
                        </p>
                        <p className="text-xs uppercase tracking-[0.22em] text-white/34">
                          {item.stamp}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/54">
                        {item.detail}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
