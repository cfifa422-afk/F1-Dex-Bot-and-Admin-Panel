import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity as ActivityIcon, AlertTriangle, ArrowDownRight, ArrowUpRight, Bot, Boxes,
  Check, ChevronDown, CircleDot, Clock3, Command, Database, Gauge, LayoutDashboard,
  Image as ImageIcon, Menu, Pencil, Plus, Radio, RefreshCw, Search, Server, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Trash2, Trophy, Users, X, Zap,
} from 'lucide-react';
import {
  ActivityType, BotActionInputAction, DriverInputRarity, DriverUpdateRarity,
  getGetActivityQueryKey, getGetBotStatusQueryKey, getGetDashboardQueryKey,
  getGetDriversQueryKey, getGetPlayersQueryKey, getHealthCheckQueryKey,
  useCreateDriver, useDeleteDriver, useGetActivity, useGetBotStatus,
  useGetDashboard, useGetDrivers, useGetPlayers, useHealthCheck,
  useRunBotAction, useUpdateDriver,
  type Activity, type BotStatus, type Driver, type DriverInput, type Player,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Link, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

const navItems = [
  { href: '/', label: 'Control room', icon: LayoutDashboard },
  { href: '/spawns', label: 'Card spawns', icon: Sparkles },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/activity', label: 'Activity log', icon: ActivityIcon },
  { href: '/bot', label: 'Bot operations', icon: Bot },
];

function cn(...values: Array<string | false | undefined>) { return values.filter(Boolean).join(' '); }
function timeAgo(value?: string) {
  if (!value) return '—';
  const delta = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (delta < 60) return `${delta}m ago`;
  if (delta < 1440) return `${Math.floor(delta / 60)}h ago`;
  return `${Math.floor(delta / 1440)}d ago`;
}
function formatNumber(value?: number) { return typeof value === 'number' ? value.toLocaleString('en-US') : '—'; }
function currency(value?: number) { return typeof value === 'number' ? `${value.toLocaleString('en-US')} cr` : '—'; }

function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.13em]',
    tone === 'good' && 'border-emerald-300 bg-emerald-50 text-emerald-700',
    tone === 'warn' && 'border-amber-300 bg-amber-50 text-amber-700',
    tone === 'bad' && 'border-red-300 bg-red-50 text-red-700',
    tone === 'neutral' && 'border-border bg-muted text-muted-foreground')}>
    <span className={cn('h-1.5 w-1.5 rounded-full', tone === 'good' ? 'bg-emerald-500' : tone === 'warn' ? 'bg-amber-500' : tone === 'bad' ? 'bg-red-500' : 'bg-slate-400')} />
    {children}
  </span>;
}

function Skeleton({ className = '' }: { className?: string }) { return <div className={cn('skel rounded-lg', className)} />; }
function LoadingPanel({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>;
}
function ErrorPanel({ message = 'Signal lost from the API.', retry }: { message?: string; retry?: () => void }) {
  return <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
    <AlertTriangle className="h-5 w-5 text-red-600" />
    <p className="text-sm font-semibold text-red-800">{message}</p>
    {retry && <button data-testid="button-retry" onClick={retry} className="rounded-md bg-red-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-800">Retry connection</button>}
  </div>;
}
function EmptyPanel({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 p-8 text-center">
    <Boxes className="mb-3 h-7 w-7 text-muted-foreground/60" />
    <p className="font-bold text-foreground">{title}</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">{detail}</p>{action && <div className="mt-4">{action}</div>}
  </div>;
}

function Sidebar() {
  const [location] = useLocation();
  const { data: bot, isLoading } = useGetBotStatus({ query: { queryKey: getGetBotStatusQueryKey(), staleTime: 30000 } });
  return <aside className="hidden w-[245px] shrink-0 flex-col border-r border-[#2e3440] bg-[#20242d] text-[#f3f0ea] lg:flex">
    <div className="border-b border-white/10 px-6 py-6">
      <Link href="/" data-testid="link-brand" className="group block">
        <div className="flex items-center gap-3"><div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#d61f45] text-white shadow-[3px_3px_0_#f0b835]"><span className="display-font text-2xl font-black italic">FD</span><span className="absolute bottom-1 left-1 right-1 h-px bg-white/50" /></div><div><div className="display-font text-xl font-extrabold uppercase tracking-tight">F1 Dex</div><div className="mono-font text-[9px] uppercase tracking-[.2em] text-white/45">race control</div></div></div>
      </Link>
    </div>
    <div className="px-3 py-5">
      <div className="mono-font mb-3 px-3 text-[9px] uppercase tracking-[.22em] text-white/35">Operations</div>
      <nav className="space-y-1">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={cn('group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition', location === href ? 'bg-[#d61f45] text-white shadow-[inset_3px_0_0_#f0b835]' : 'text-white/60 hover:bg-white/5 hover:text-white')}><Icon className="h-4 w-4" /><span>{label}</span>{href === '/activity' && <span className="mono-font ml-auto text-[9px] text-white/35">LIVE</span>}</Link>)}</nav>
    </div>
    <div className="mt-auto p-4">
      <div className="track-stripe rounded-xl border border-white/10 bg-white/[.045] p-4">
        <div className="mb-3 flex items-center justify-between"><span className="mono-font text-[9px] uppercase tracking-[.18em] text-white/45">Bot link</span><CircleDot className={cn('h-3.5 w-3.5', bot?.connected ? 'text-emerald-400' : 'text-red-400')} /></div>
        {isLoading ? <Skeleton className="h-5 w-24 bg-white/10" /> : <div className="display-font text-lg font-bold uppercase">{bot?.connected ? 'Connected' : 'Offline'}</div>}
        <div className="mt-1 mono-font text-[10px] text-white/40">{bot ? `${bot.latencyMs}ms latency · ${bot.guildCount} guilds` : 'Checking heartbeat…'}</div>
      </div>
      <Link href="/bot" data-testid="link-settings" className="mt-3 flex items-center gap-2 px-2 py-2 text-xs font-semibold text-white/45 transition hover:text-white"><Settings2 className="h-3.5 w-3.5" /> System settings</Link>
    </div>
  </aside>;
}

function Header({ title, eyebrow, action }: { title: string; eyebrow: string; action?: ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 30000 } });
  return <header className="border-b border-border bg-[#eeeae2]/90 px-4 py-4 backdrop-blur sm:px-7 lg:px-10">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0"><div className="mono-font mb-1 flex items-center gap-2 text-[9px] uppercase tracking-[.2em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-[#d61f45]" />{eyebrow}</div><h1 className="display-font truncate text-3xl font-extrabold uppercase tracking-tight text-[#20242d] sm:text-4xl">{title}</h1></div>
      <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><div className="mono-font text-[9px] uppercase tracking-[.16em] text-muted-foreground">API status</div><div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-bold text-[#20242d]"><span className={cn('h-1.5 w-1.5 rounded-full', health?.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-400')} />{health?.status === 'ok' ? 'Nominal' : health?.status ?? 'Checking'}</div></div>{action}</div>
    </div>
    <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">{navItems.map(({ href, label }) => <Link key={href} href={href} data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`} className={cn('whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider', location === href ? 'border-[#d61f45] bg-[#d61f45] text-white' : 'border-border bg-card text-muted-foreground')}>{label}</Link>)}</div>
  </header>;
}

function Shell({ children, title, eyebrow, action }: { children: ReactNode; title: string; eyebrow: string; action?: ReactNode }) {
  return <div className="noise-overlay app-shell flex min-h-[100dvh]"><Sidebar /><main className="min-w-0 flex-1"><Header title={title} eyebrow={eyebrow} action={action} /><div className="mx-auto max-w-[1440px] p-4 sm:p-7 lg:p-10">{children}</div></main></div>;
}

function MetricCard({ label, value, note, icon: Icon, accent = 'red', trend }: { label: string; value: string; note: string; icon: typeof Gauge; accent?: 'red' | 'yellow' | 'dark'; trend?: 'up' | 'down' }) {
  return <div className={cn('animate-enter relative overflow-hidden rounded-xl border p-5 shadow-[0_2px_0_rgba(32,36,45,.04)] transition hover:-translate-y-0.5', accent === 'red' ? 'border-[#d61f45]/20 bg-[#d61f45] text-white' : accent === 'yellow' ? 'border-[#f0b835]/40 bg-[#f0b835] text-[#20242d]' : 'border-border bg-card text-foreground')}>
    <div className="flex items-start justify-between"><span className={cn('mono-font text-[10px] uppercase tracking-[.16em]', accent === 'dark' ? 'text-muted-foreground' : 'opacity-70')}>{label}</span><Icon className="h-4 w-4 opacity-70" /></div>
    <div className="display-font mt-4 text-4xl font-extrabold tracking-tight">{value}</div>
    <div className={cn('mt-2 flex items-center gap-1.5 text-xs font-semibold', accent === 'dark' ? 'text-muted-foreground' : 'opacity-80')}>{trend && (trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />)}{note}</div>
    {accent === 'red' && <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border-[16px] border-white/10" />}
  </div>;
}

function ActivityRow({ item, compact = false }: { item: Activity; compact?: boolean }) {
  const tone = item.accent || '#d61f45';
  return <div data-testid={`activity-${item.id}`} className={cn('group flex gap-3 border-b border-border/70 py-4 last:border-0', compact && 'py-3')}>
    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted" style={{ color: tone }}><ActivityIcon className="h-4 w-4" /></div>
    <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-4"><p className="truncate text-sm font-bold text-foreground">{item.title}</p><span className="mono-font shrink-0 text-[10px] text-muted-foreground">{timeAgo(item.timestamp)}</span></div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p></div>
  </div>;
}

function Dashboard() {
  const dashboard = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey(), staleTime: 15000 } });
  const bot = useGetBotStatus({ query: { queryKey: getGetBotStatusQueryKey(), staleTime: 15000 } });
  const activity = useGetActivity({ query: { queryKey: getGetActivityQueryKey(), staleTime: 15000 } });
  if (dashboard.isLoading) return <Shell title="Control room" eyebrow="Live overview"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-36" />)}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div></Shell>;
  if (dashboard.isError) return <Shell title="Control room" eyebrow="Live overview"><ErrorPanel retry={() => dashboard.refetch()} /></Shell>;
  const data = dashboard.data;
  return <Shell title="Control room" eyebrow="Race weekend / live overview" action={<Link href="/bot" data-testid="link-open-bot" className="hidden items-center gap-2 rounded-lg bg-[#20242d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#d61f45] sm:flex"><Radio className="h-3.5 w-3.5" /> Open bot ops</Link>}>
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="max-w-xl text-sm leading-relaxed text-muted-foreground">Keep the collection sharp, the drops moving, and the community in the slipstream.</p></div><div className="mono-font flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> live telemetry</div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Total players" value={formatNumber(data?.totalPlayers)} note={`${formatNumber(data?.activeGuilds)} active guilds`} icon={Users} accent="red" />
      <MetricCard label="Cards collected" value={formatNumber(data?.cardsCollected)} note={`${data?.collectionCompletion ?? 0}% collection completion`} icon={Boxes} accent="dark" />
      <MetricCard label="Trades today" value={formatNumber(data?.tradesToday)} note="Across all communities" icon={ArrowUpRight} accent="yellow" trend="up" />
      <MetricCard label="Weekly claims" value={formatNumber(data?.weeklyClaims)} note={`${data?.weeklyClaimsChange ?? 0}% vs last week`} icon={Zap} accent="dark" trend={(data?.weeklyClaimsChange ?? 0) >= 0 ? 'up' : 'down'} />
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><div className="mono-font text-[10px] uppercase tracking-[.18em] text-muted-foreground">Live feed</div><h2 className="display-font mt-1 text-2xl font-bold uppercase">Community activity</h2></div><Link href="/activity" data-testid="link-view-activity" className="text-xs font-bold text-[#d61f45] hover:underline">View full log <span aria-hidden>→</span></Link></div>{activity.isLoading ? <LoadingPanel /> : activity.isError ? <ErrorPanel retry={() => activity.refetch()} /> : activity.data?.length ? activity.data.slice(0, 5).map(item => <ActivityRow key={item.id} item={item} compact />) : <EmptyPanel title="No activity yet" detail="New drops, trades, and player events will appear here." />}</section>
      <section className="rounded-xl border border-[#2e3440] bg-[#20242d] p-5 text-white sm:p-6"><div className="mb-6 flex items-center justify-between"><div><div className="mono-font text-[10px] uppercase tracking-[.18em] text-white/40">Signal monitor</div><h2 className="display-font mt-1 text-2xl font-bold uppercase">Bot heartbeat</h2></div><span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider', bot.data?.connected ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300')}>{bot.data?.connected ? 'Online' : 'Offline'}</span></div>
        {bot.isLoading ? <div className="space-y-3"><Skeleton className="h-16 bg-white/10" /><Skeleton className="h-16 bg-white/10" /></div> : bot.isError ? <div className="text-sm text-red-300">Could not reach bot status.</div> : bot.data && <BotTelemetry bot={bot.data} />}
        <Link href="/bot" data-testid="link-bot-detail" className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-bold text-white/60 transition hover:text-white"><span>Manage connection</span><span>→</span></Link>
      </section>
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-[#d61f45]/10 p-2.5 text-[#d61f45]"><Trophy className="h-5 w-5" /></div><div><div className="mono-font text-[10px] uppercase tracking-[.18em] text-muted-foreground">Most claimed card</div><h2 data-testid="text-top-driver" className="display-font text-2xl font-bold uppercase">{data?.topDriver || 'No leader yet'}</h2></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#d61f45]" style={{ width: `${Math.min(100, data?.collectionCompletion ?? 0)}%` }} /></div><div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span>Collection health</span><span>{data?.collectionCompletion ?? 0}%</span></div></section><section className="rounded-xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="mono-font text-[10px] uppercase tracking-[.18em] text-muted-foreground">Weekend readiness</div><h2 className="display-font text-2xl font-bold uppercase">Race control checklist</h2></div><ShieldCheck className="h-5 w-5 text-emerald-600" /></div><div className="mt-5 grid grid-cols-3 gap-2">{['Bot link', 'Card pool', 'Drop queue'].map((label) => <div key={label} className="rounded-lg bg-emerald-50 p-3 text-center"><Check className="mx-auto h-4 w-4 text-emerald-600" /><div className="mt-2 text-[10px] font-bold uppercase tracking-wide text-emerald-800">{label}</div></div>)}</div></section></div>
  </Shell>;
}

function BotTelemetry({ bot }: { bot: BotStatus }) {
  return <div className="grid grid-cols-2 gap-3">{[['Latency', `${bot.latencyMs}ms`], ['Guilds', formatNumber(bot.guildCount)], ['Version', bot.version], ['Branch', bot.branch]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-white/[.04] p-3"><div className="mono-font text-[9px] uppercase tracking-wider text-white/40">{label}</div><div data-testid={`bot-value-${String(label).toLowerCase()}`} className="mt-2 truncate text-sm font-bold text-white">{value}</div></div>)}</div>;
}

type DriverFormState = { name: string; shortName: string; number: string; team: string; nationality: string; rarity: string; rating: string; active: boolean; imageUrl: string; spawnImageUrl: string; spawnWeight: string };
const emptyDriver: DriverFormState = { name: '', shortName: '', number: '', team: '', nationality: '', rarity: 'common', rating: '75', active: true, imageUrl: '', spawnImageUrl: '', spawnWeight: '1' };
function DriverModal({ driver, close, onSaved }: { driver?: Driver; close: () => void; onSaved: (message: string) => void }) {
  const [form, setForm] = useState<DriverFormState>(driver ? { name: driver.name, shortName: driver.shortName, number: String(driver.number), team: driver.team, nationality: driver.nationality, rarity: driver.rarity, rating: String(driver.rating), active: driver.active, imageUrl: driver.imageUrl ?? '', spawnImageUrl: driver.spawnImageUrl ?? '', spawnWeight: String(driver.spawnWeight ?? 1) } : emptyDriver);
  const [spawnPreview, setSpawnPreview] = useState(form.spawnImageUrl);
  const [cardPreview, setCardPreview] = useState(form.imageUrl);
  const create = useCreateDriver(); const update = useUpdateDriver(); const qc = useQueryClient();
  const pending = create.isPending || update.isPending;
  const change = (key: keyof DriverFormState, value: string | boolean) => setForm(old => ({ ...old, [key]: value }));
  const previewFile = (file: File | undefined, setter: (value: string) => void) => { if (!file) return; setter(URL.createObjectURL(file)); };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.name.trim() || !form.shortName.trim() || !form.team.trim() || !form.nationality.trim()) return;
    const payload = { name: form.name.trim(), shortName: form.shortName.trim(), number: Number(form.number) || 0, team: form.team.trim(), nationality: form.nationality.trim(), rarity: form.rarity as DriverInput['rarity'], rating: Math.max(1, Math.min(100, Number(form.rating) || 1)), active: form.active, imageUrl: form.imageUrl.trim() || null, spawnImageUrl: form.spawnImageUrl.trim() || null, spawnWeight: Math.max(0, Number(form.spawnWeight) || 0) };
    const options = { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetDriversQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); onSaved(driver ? 'Driver card updated.' : 'Driver card added.'); close(); } };
    if (driver) update.mutate({ id: driver.id, data: payload }, options); else create.mutate({ data: payload }, options);
  };
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#20242d]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div role="dialog" aria-modal="true" className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl sm:p-7"><div className="mb-6 flex items-start justify-between"><div><div className="mono-font text-[10px] uppercase tracking-[.18em] text-[#d61f45]">{driver ? 'Edit entry' : 'New entry'}</div><h2 className="display-font text-3xl font-extrabold uppercase">{driver ? driver.name : 'Add driver card'}</h2></div><button data-testid="button-close-driver-modal" onClick={close} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button></div>
     <form onSubmit={submit} className="space-y-6">
       <section><div className="mb-3 flex items-center gap-2 border-b border-border pb-2"><span className="display-font text-xl font-bold uppercase">Card identity</span><span className="mono-font text-[9px] uppercase tracking-wider text-muted-foreground">Required for the collection</span></div><div className="grid gap-4 sm:grid-cols-2">{[['name', 'Card name'], ['shortName', 'Short name'], ['number', 'Card number'], ['team', 'Team / group'], ['nationality', 'Country code'], ['rating', 'Rating / 100']].map(([key, label]) => <label key={key}><span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span><input data-testid={`input-driver-${key}`} type={key === 'number' || key === 'rating' ? 'number' : 'text'} value={form[key as keyof DriverFormState] as string} onChange={e => change(key as keyof DriverFormState, e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-[#d61f45] focus:ring-2 focus:ring-[#d61f45]/15" required /></label>)}</div></section>
       <section><div className="mb-3 flex items-center gap-2 border-b border-border pb-2"><span className="display-font text-xl font-bold uppercase">Drop rules</span><span className="mono-font text-[9px] uppercase tracking-wider text-muted-foreground">Controls how often it appears</span></div><div className="grid gap-4 sm:grid-cols-3"><label><span className="mb-1.5 block text-xs font-bold text-foreground">Rarity tier</span><select data-testid="select-driver-rarity" value={form.rarity} onChange={e => change('rarity', e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-[#d61f45]">{Object.values(DriverInputRarity).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-bold text-foreground">Spawn weight</span><input data-testid="input-driver-spawnWeight" type="number" min="0" step="0.1" value={form.spawnWeight} onChange={e => change('spawnWeight', e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-[#d61f45]" /><span className="mt-1 block text-[10px] text-muted-foreground">Higher values appear more often.</span></label><label className="flex items-center gap-3 self-end pb-2"><button type="button" data-testid="button-toggle-driver-active" onClick={() => change('active', !form.active)} className={cn('relative h-6 w-11 rounded-full transition', form.active ? 'bg-emerald-500' : 'bg-muted-foreground/30')}><span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white transition-transform', form.active ? 'translate-x-6' : 'translate-x-1')} /></button><span className="text-xs font-bold">Available in drops</span></label></div></section>
       <section><div className="mb-3 flex items-center gap-2 border-b border-border pb-2"><span className="display-font text-xl font-bold uppercase">Artwork</span><span className="mono-font text-[9px] uppercase tracking-wider text-muted-foreground">Separate wild spawn and collection images</span></div><div className="grid gap-4 md:grid-cols-2"><AssetField label="Spawn image" value={form.spawnImageUrl} preview={spawnPreview} onChange={value => { change('spawnImageUrl', value); setSpawnPreview(value); }} onFile={file => previewFile(file, setSpawnPreview)} testId="spawnImageUrl" /><AssetField label="Card image" value={form.imageUrl} preview={cardPreview} onChange={value => { change('imageUrl', value); setCardPreview(value); }} onFile={file => previewFile(file, setCardPreview)} testId="imageUrl" /></div><p className="mt-2 text-[10px] text-muted-foreground">Use the file picker to preview artwork before saving. Paste a hosted image URL to persist the asset in this admin API.</p></section>
       <div className="mt-2 flex justify-end gap-3 border-t border-border pt-5"><button type="button" data-testid="button-cancel-driver" onClick={close} className="rounded-lg px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted">Cancel</button><button data-testid="button-submit-driver" disabled={pending} className="flex items-center gap-2 rounded-lg bg-[#d61f45] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#b61939] disabled:opacity-60">{pending && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}{driver ? 'Save changes' : 'Add to card pool'}</button></div>
     </form></div></div>;
}

function AssetField({ label, value, preview, onChange, onFile, testId }: { label: string; value: string; preview: string; onChange: (value: string) => void; onFile: (file?: File) => void; testId: string }) {
  return <div className="rounded-xl border border-border bg-muted/30 p-3"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold">{label}</span><span className="mono-font text-[9px] uppercase tracking-wider text-muted-foreground">{label === 'Spawn image' ? 'Wild card' : 'Collection card'}</span></div><div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-background">{preview ? <img src={preview} alt={`${label} preview`} className="h-full w-full object-contain" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <div className="text-center text-muted-foreground"><ImageIcon className="mx-auto h-7 w-7 opacity-40" /><span className="mt-2 block text-[10px]">No artwork selected</span></div>}</div><input data-testid={`input-driver-${testId}`} type="url" value={value} onChange={event => onChange(event.target.value)} placeholder="https://…/image.png" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-[#d61f45]" /><label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[10px] font-bold text-muted-foreground transition hover:border-[#d61f45] hover:text-[#d61f45]"><ImageIcon className="h-3.5 w-3.5" /> Preview local file<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => onFile(event.target.files?.[0])} /></label></div>;
}

function DriversPage() {
  const [search, setSearch] = useState(''); const [modal, setModal] = useState<Driver | 'new' | null>(null); const [notice, setNotice] = useState('');
  const params = useMemo(() => search.trim() ? { search: search.trim() } : undefined, [search]);
  const query = useGetDrivers(params, { query: { queryKey: getGetDriversQueryKey(params), staleTime: 30000 } }); const del = useDeleteDriver(); const qc = useQueryClient();
  const remove = (driver: Driver) => { if (!window.confirm(`Remove ${driver.name} from the card pool?`)) return; del.mutate({ id: driver.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetDriversQueryKey() }); setNotice('Driver card removed.'); } }); };
  const rarityTone = (rarity: string) => rarity === 'legendary' ? 'bg-amber-100 text-amber-800 border-amber-300' : rarity === 'epic' ? 'bg-violet-100 text-violet-800 border-violet-300' : rarity === 'rare' ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-muted text-muted-foreground border-border';
  const activeCount = query.data?.filter(driver => driver.active).length ?? 0;
  const artworkCount = query.data?.filter(driver => driver.imageUrl && driver.spawnImageUrl).length ?? 0;
  const totalWeight = query.data?.reduce((total, driver) => total + (driver.spawnWeight ?? 0), 0) ?? 0;
  return <Shell title="Card spawns" eyebrow="Collection / spawn registry" action={<button data-testid="button-add-driver-header" onClick={() => setModal('new')} className="flex items-center gap-2 rounded-lg bg-[#d61f45] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#b61939]"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add card</span></button>}>
    {notice && <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"><span className="flex items-center gap-2"><Check className="h-4 w-4" />{notice}</span><button data-testid="button-dismiss-notice" onClick={() => setNotice('')}><X className="h-4 w-4" /></button></div>}
     <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">Build the card pool used by BallsDex drops. Each entry can have separate wild-spawn and collection artwork, a rarity tier, and a weighted spawn chance.</p></div><label className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-search-drivers" type="search" placeholder="Search cards, teams, countries" value={search} onChange={e => setSearch(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-[#d61f45]" /></label></div>
     {!query.isLoading && !query.isError && query.data?.length ? <div className="mb-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border bg-card p-4"><div className="mono-font text-[9px] uppercase tracking-[.16em] text-muted-foreground">Registered cards</div><div className="display-font mt-2 text-3xl font-bold">{query.data.length}</div></div><div className="rounded-xl border border-border bg-card p-4"><div className="mono-font text-[9px] uppercase tracking-[.16em] text-muted-foreground">Live in drops</div><div className="display-font mt-2 text-3xl font-bold text-emerald-600">{activeCount}</div></div><div className="rounded-xl border border-border bg-card p-4"><div className="mono-font text-[9px] uppercase tracking-[.16em] text-muted-foreground">Artwork ready</div><div className="display-font mt-2 text-3xl font-bold text-[#d61f45]">{artworkCount}<span className="ml-2 text-sm font-sans font-semibold text-muted-foreground">/ {query.data.length} · {totalWeight.toFixed(1)} total weight</span></div></div></div> : null}
     {query.isLoading ? <LoadingPanel rows={6} /> : query.isError ? <ErrorPanel retry={() => query.refetch()} /> : !query.data?.length ? <EmptyPanel title={search ? 'No matching cards' : 'Card pool is empty'} detail={search ? 'Try another name, team, or nationality.' : 'Add the first card to start building the collection.'} action={!search && <button data-testid="button-add-driver-empty" onClick={() => setModal('new')} className="rounded-lg bg-[#d61f45] px-4 py-2 text-xs font-bold text-white">Add card</button>} /> : <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="hidden grid-cols-[1.7fr_1fr_.8fr_.7fr_.8fr_100px] gap-4 border-b border-border bg-muted/60 px-5 py-3 mono-font text-[9px] uppercase tracking-[.16em] text-muted-foreground md:grid"><span>Card</span><span>Team</span><span>Rarity</span><span>Weight</span><span>Status</span><span /></div>{query.data.map(driver => <div key={driver.id} data-testid={`row-driver-${driver.id}`} className="grid gap-3 border-b border-border p-4 last:border-0 transition hover:bg-muted/30 md:grid-cols-[1.7fr_1fr_.8fr_.7fr_.8fr_100px] md:items-center md:gap-4 md:px-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#20242d] text-white">{driver.imageUrl ? <img src={driver.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="display-font text-xl font-bold">{driver.number}</span>}</div><div className="min-w-0"><div className="truncate text-sm font-bold">{driver.name}</div><div className="mono-font mt-0.5 text-[10px] text-muted-foreground">{driver.shortName} · {driver.nationality}</div><div className="mt-1 flex gap-1 text-[9px] font-bold uppercase tracking-wide"><span className={cn('rounded px-1.5 py-0.5', driver.spawnImageUrl ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground')}>Spawn art</span><span className={cn('rounded px-1.5 py-0.5', driver.imageUrl ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground')}>Card art</span></div></div></div><div className="text-xs font-semibold text-muted-foreground md:text-foreground">{driver.team}</div><div><span className={cn('inline-flex rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-wider', rarityTone(driver.rarity))}>{driver.rarity}</span></div><div className="display-font text-xl font-bold">{(driver.spawnWeight ?? 0).toFixed(1)}</div><div><StatusPill tone={driver.active ? 'good' : 'neutral'}>{driver.active ? 'Active' : 'Paused'}</StatusPill></div><div className="flex items-center gap-1 md:justify-end"><button data-testid={`button-edit-driver-${driver.id}`} onClick={() => setModal(driver)} className="rounded-md p-2 text-muted-foreground transition hover:bg-[#d61f45]/10 hover:text-[#d61f45]" aria-label={`Edit ${driver.name}`}><Pencil className="h-3.5 w-3.5" /></button><button data-testid={`button-delete-driver-${driver.id}`} disabled={del.isPending} onClick={() => remove(driver)} className="rounded-md p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${driver.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div>)}</div>}
     {modal && <DriverModal driver={modal === 'new' ? undefined : modal} close={() => setModal(null)} onSaved={message => { setNotice(message); setModal(null); }} />}
  </Shell>;
}

function PlayersPage() {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState<string>('all');
  const params = useMemo(() => ({ ...(search.trim() ? { search: search.trim() } : {}), ...(status !== 'all' ? { status: status as 'active' | 'flagged' | 'inactive' } : {}) }), [search, status]);
  const query = useGetPlayers(params, { query: { queryKey: getGetPlayersQueryKey(params), staleTime: 30000 } });
  return <Shell title="Players" eyebrow="Community / oversight"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><p className="text-sm text-muted-foreground">Watch the economy and spot unusual activity before it becomes a problem.</p><div className="flex w-full gap-2 sm:w-auto"><label className="relative min-w-0 flex-1 sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-search-players" type="search" placeholder="Search players" value={search} onChange={e => setSearch(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus:border-[#d61f45]" /></label><select data-testid="select-player-status" value={status} onChange={e => setStatus(e.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-xs font-bold outline-none focus:border-[#d61f45]"><option value="all">All status</option><option value="active">Active</option><option value="flagged">Flagged</option><option value="inactive">Inactive</option></select></div></div>
    {query.isLoading ? <LoadingPanel rows={7} /> : query.isError ? <ErrorPanel retry={() => query.refetch()} /> : !query.data?.length ? <EmptyPanel title="No players found" detail="Try changing the search or status filter." /> : <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="hidden grid-cols-[1.5fr_1fr_.8fr_.8fr_.8fr_1fr] gap-4 border-b border-border bg-muted/60 px-5 py-3 mono-font text-[9px] uppercase tracking-[.16em] text-muted-foreground md:grid"><span>Player</span><span>Favorite</span><span>Collection</span><span>Balance</span><span>Status</span><span>Last active</span></div>{query.data.map(player => <PlayerRow key={player.id} player={player} />)}</div>}
  </Shell>;
}
function PlayerRow({ player }: { player: Player }) {
  const initials = player.username.split(/[\s_]+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return <div data-testid={`row-player-${player.id}`} className="grid gap-3 border-b border-border p-4 last:border-0 transition hover:bg-muted/30 md:grid-cols-[1.5fr_1fr_.8fr_.8fr_.8fr_1fr] md:items-center md:gap-4 md:px-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#20242d] text-xs font-bold text-white">{initials}</div><div><div className="text-sm font-bold">{player.username}</div><div className="mono-font text-[10px] text-muted-foreground">{player.discordTag}</div></div></div><div className="text-xs font-semibold text-muted-foreground md:text-foreground">{player.favoriteDriver || '—'}</div><div className="text-sm font-bold">{formatNumber(player.collectionCount)} <span className="font-normal text-muted-foreground">cards</span></div><div className="display-font text-xl font-bold">{currency(player.balance)}</div><div><StatusPill tone={player.status === 'active' ? 'good' : player.status === 'flagged' ? 'warn' : 'neutral'}>{player.status}</StatusPill></div><div className="mono-font text-[10px] text-muted-foreground">{timeAgo(player.lastActiveAt)}</div></div>;
}

function ActivityPage() {
  const query = useGetActivity({ query: { queryKey: getGetActivityQueryKey(), staleTime: 15000 } }); const [filter, setFilter] = useState('all');
  const items = useMemo(() => filter === 'all' ? query.data : query.data?.filter(item => item.type === filter), [filter, query.data]);
  return <Shell title="Activity log" eyebrow="Community / timeline" action={<button data-testid="button-refresh-activity" onClick={() => query.refetch()} className="rounded-lg border border-border bg-card p-2.5 text-muted-foreground transition hover:border-[#d61f45] hover:text-[#d61f45]"><RefreshCw className={cn('h-4 w-4', query.isFetching && 'animate-spin')} /></button>}><div className="mb-6 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">A complete audit trail of the communities on track.</p><div className="flex items-center gap-2 overflow-x-auto"><SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />{['all', ...Object.values(ActivityType)].map(type => <button key={type} data-testid={`button-filter-${type}`} onClick={() => setFilter(type)} className={cn('rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition', filter === type ? 'border-[#d61f45] bg-[#d61f45] text-white' : 'border-border bg-card text-muted-foreground hover:border-[#d61f45]')}>{type}</button>)}</div></div>{query.isLoading ? <LoadingPanel rows={8} /> : query.isError ? <ErrorPanel retry={() => query.refetch()} /> : !items?.length ? <EmptyPanel title="Nothing on the timeline" detail="Activity will populate as the bot and communities get moving." /> : <div className="rounded-xl border border-border bg-card px-5 sm:px-8">{items.map(item => <ActivityRow key={item.id} item={item} />)}</div>}</Shell>;
}

const actions: Array<{ key: 'sync-drivers' | 'publish-drop' | 'refresh-cache' | 'pause-drops'; label: string; detail: string; icon: typeof RefreshCw; tone: string }> = [
  { key: 'sync-drivers', label: 'Sync driver catalog', detail: 'Pull the latest driver pool into the bot cache.', icon: RefreshCw, tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  { key: 'publish-drop', label: 'Publish a drop', detail: 'Release the next scheduled card drop to all guilds.', icon: Zap, tone: 'bg-[#d61f45]/10 text-[#d61f45] border-[#d61f45]/20' },
  { key: 'refresh-cache', label: 'Refresh bot cache', detail: 'Rebuild collection and player lookup indexes.', icon: Database, tone: 'bg-violet-50 text-violet-700 border-violet-200' },
  { key: 'pause-drops', label: 'Pause drops', detail: 'Stop new drops while keeping the bot connected.', icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
];
function BotPage() {
  const query = useGetBotStatus({ query: { queryKey: getGetBotStatusQueryKey(), staleTime: 10000 } }); const action = useRunBotAction(); const qc = useQueryClient(); const [notice, setNotice] = useState<{ good: boolean; text: string } | null>(null);
  const run = (key: keyof typeof BotActionInputAction) => { setNotice(null); action.mutate({ data: { action: key } }, { onSuccess: result => { setNotice({ good: result.success, text: result.message }); qc.invalidateQueries({ queryKey: getGetBotStatusQueryKey() }); qc.invalidateQueries({ queryKey: getGetActivityQueryKey() }); }, onError: () => setNotice({ good: false, text: 'Action could not be completed. Check the bot connection.' }) }); };
  return <Shell title="Bot operations" eyebrow="Systems / connection controls"><div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]"><section className="rounded-xl border border-[#2e3440] bg-[#20242d] p-6 text-white sm:p-8"><div className="flex items-start justify-between"><div><div className="mono-font text-[10px] uppercase tracking-[.2em] text-white/40">Primary connection</div><h2 className="display-font mt-2 text-4xl font-extrabold uppercase">Discord bot</h2></div><div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', query.data?.connected ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300')}><Bot className="h-6 w-6" /></div></div>{query.isLoading ? <div className="mt-8 space-y-3"><Skeleton className="h-20 bg-white/10" /><Skeleton className="h-20 bg-white/10" /></div> : query.isError ? <div className="mt-8 text-sm text-red-300">Status unavailable.</div> : query.data && <><div className="mt-8 flex items-center gap-3"><div className={cn('h-3 w-3 rounded-full', query.data.connected ? 'bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.12)]' : 'bg-red-400')} /><span className="display-font text-2xl font-bold uppercase">{query.data.connected ? 'Connected & listening' : 'Connection offline'}</span></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Latency', `${query.data.latencyMs}ms`], ['Guilds', formatNumber(query.data.guildCount)], ['Version', query.data.version], ['Branch', query.data.branch]].map(([key, value]) => <div key={key} className="border-t border-white/10 pt-3"><div className="mono-font text-[9px] uppercase tracking-wider text-white/40">{key}</div><div className="mt-2 truncate text-sm font-bold">{value}</div></div>)}</div><div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] text-white/45"><Clock3 className="h-3.5 w-3.5" /> Last heartbeat {timeAgo(query.data.lastHeartbeat)}</div></>}</section><section><div className="mb-4 flex items-end justify-between"><div><div className="mono-font text-[10px] uppercase tracking-[.2em] text-muted-foreground">Operator actions</div><h2 className="display-font mt-1 text-3xl font-extrabold uppercase">Pit wall controls</h2></div><span className="mono-font text-[10px] text-muted-foreground">4 available</span></div>{notice && <div className={cn('mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-semibold', notice.good ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800')}>{notice.good ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{notice.text}</div>}<div className="space-y-3">{actions.map(({ key, label, detail, icon: Icon, tone }) => <button key={key} data-testid={`button-bot-${key}`} disabled={action.isPending} onClick={() => run(key)} className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-[#d61f45]/40 hover:shadow-[0_5px_15px_rgba(32,36,45,.06)] disabled:cursor-wait disabled:opacity-60"><div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border', tone)}><Icon className={cn('h-5 w-5', action.isPending && 'animate-spin')} /></div><div className="min-w-0 flex-1"><div className="text-sm font-bold">{label}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></div><ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-[#d61f45]" /></button>)}</div></section></div><div className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-muted p-2.5"><Server className="h-5 w-5 text-muted-foreground" /></div><div><h3 className="text-sm font-bold">Operational notes</h3><p className="mt-1 text-xs text-muted-foreground">Actions are broadcast to the bot immediately. Use pause drops during maintenance windows or content review.</p></div></div></div></Shell>;
}

function Router() {
  return <ErrorBoundary resetKey={useLocation()[0]}><Switch><Route path="/" component={Dashboard} /><Route path="/spawns" component={DriversPage} /><Route path="/drivers" component={DriversPage} /><Route path="/players" component={PlayersPage} /><Route path="/activity" component={ActivityPage} /><Route path="/bot" component={BotPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;