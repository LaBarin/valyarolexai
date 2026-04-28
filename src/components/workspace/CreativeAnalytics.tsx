// Creative Analytics — real metrics aggregated client-side from the user's own
// video_projects and marketing_campaigns rows. RLS already restricts queries
// to the signed-in user, so no extra filtering is needed.
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Video, Megaphone, Download, Clock, Sparkles, Loader2,
  TrendingUp, Hash, Layers, Film, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

type VideoRow = {
  id: string;
  title: string;
  status: string;
  platform: string;
  format: string;
  duration_type: string;
  template_style: string | null;
  ad_preset: string | null;
  exported_video_url: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  script: any;
};

type CampaignRow = {
  id: string;
  status: string;
  campaign_type: string;
  ai_generated: boolean;
  created_at: string;
};

type Stats = {
  videosTotal: number;
  videosRendered: number;
  videosThisWeek: number;
  exportsTotal: number;
  campaignsTotal: number;
  campaignsActive: number;
  avgRenderSeconds: number | null;
  topTemplates: { name: string; count: number }[];
  topPlatforms: { name: string; count: number }[];
  topCTAs: { name: string; count: number }[];
  formatMix: { name: string; value: number }[];
  weekly: { day: string; videos: number; campaigns: number }[];
};

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(190 90% 55%)",
  "hsl(280 80% 60%)",
  "hsl(40 95% 60%)",
  "hsl(340 85% 60%)",
];

const chartConfig = {
  videos: { label: "Videos", color: "hsl(var(--primary))" },
  campaigns: { label: "Campaigns", color: "hsl(280 80% 60%)" },
  count: { label: "Count", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const isRendered = (v: VideoRow) =>
  !!v.exported_video_url || v.status === "completed" || v.status === "rendered";

const computeStats = (videos: VideoRow[], campaigns: CampaignRow[]): Stats => {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Render-time proxy: when the script captured a `last_render_meta.rendered_at`
  // we use (rendered_at - created_at). This is a generous upper bound but the
  // best signal we have without a dedicated render-events table.
  const renderTimes: number[] = [];
  videos.forEach((v) => {
    const renderedAt = v.script?.last_render_meta?.rendered_at;
    if (renderedAt) {
      const ms = new Date(renderedAt).getTime() - new Date(v.created_at).getTime();
      if (ms > 0 && ms < 1000 * 60 * 60 * 6) renderTimes.push(ms / 1000);
    }
  });
  const avgRenderSeconds = renderTimes.length
    ? Math.round(renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length)
    : null;

  const tally = <T extends string | null | undefined>(items: T[]) => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const key = (item ?? "").toString().trim();
      if (!key) return;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const topTemplates = tally(videos.map((v) => v.template_style || v.ad_preset)).slice(0, 5);
  const topPlatforms = tally(videos.map((v) => v.platform)).slice(0, 5);

  // Pull CTA strings out of the script blob.
  const ctas = videos
    .map((v) => v.script?.cta || v.script?.ad_copy?.cta)
    .filter((s) => typeof s === "string" && s.trim().length)
    .map((s: string) => s.trim().slice(0, 40));
  const topCTAs = tally(ctas).slice(0, 5);

  const formatMix = tally(videos.map((v) => v.format)).map((f) => ({ name: f.name, value: f.count }));

  // 7-day rolling activity.
  const days: { key: string; day: string; videos: number; campaigns: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    days.push({
      key: d.toISOString().slice(0, 10),
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      videos: 0,
      campaigns: 0,
    });
  }
  videos.forEach((v) => {
    const k = v.created_at.slice(0, 10);
    const slot = days.find((d) => d.key === k);
    if (slot) slot.videos += 1;
  });
  campaigns.forEach((c) => {
    const k = c.created_at.slice(0, 10);
    const slot = days.find((d) => d.key === k);
    if (slot) slot.campaigns += 1;
  });

  return {
    videosTotal: videos.length,
    videosRendered: videos.filter(isRendered).length,
    videosThisWeek: videos.filter((v) => new Date(v.created_at).getTime() >= weekAgo).length,
    exportsTotal: videos.filter((v) => !!v.exported_video_url).length,
    campaignsTotal: campaigns.length,
    campaignsActive: campaigns.filter((c) => c.status === "active" || c.status === "live").length,
    avgRenderSeconds,
    topTemplates,
    topPlatforms,
    topCTAs,
    formatMix,
    weekly: days.map(({ day, videos, campaigns }) => ({ day, videos, campaigns })),
  };
};

const StatCard = ({ icon: Icon, label, value, hint }: {
  icon: any; label: string; value: React.ReactNode; hint?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-xl p-4 flex flex-col gap-1"
  >
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5 text-primary" />
      {label}
    </div>
    <div className="text-2xl font-bold tracking-tight">{value}</div>
    {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
  </motion.div>
);

const RankedList = ({ title, icon: Icon, rows, emptyMsg }: {
  title: string; icon: any; rows: { name: string; count: number }[]; emptyMsg: string;
}) => {
  const max = rows[0]?.count ?? 0;
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyMsg}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate pr-2">{row.name}</span>
                <span className="text-muted-foreground tabular-nums">{row.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${max ? (row.count / max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreativeAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const [videosRes, campaignsRes] = await Promise.all([
      supabase
        .from("video_projects")
        .select("id,title,status,platform,format,duration_type,template_style,ad_preset,exported_video_url,ai_generated,created_at,updated_at,script")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("marketing_campaigns")
        .select("id,status,campaign_type,ai_generated,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    if (videosRes.error) setError(videosRes.error.message);
    if (campaignsRes.error) setError((prev) => prev ?? campaignsRes.error!.message);
    setVideos((videosRes.data as VideoRow[]) ?? []);
    setCampaigns((campaignsRes.data as CampaignRow[]) ?? []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => computeStats(videos, campaigns), [videos, campaigns]);
  const renderRate = stats.videosTotal
    ? Math.round((stats.videosRendered / stats.videosTotal) * 100)
    : 0;
  const aiShare = stats.videosTotal
    ? Math.round((videos.filter((v) => v.ai_generated).length / stats.videosTotal) * 100)
    : 0;

  if (loading) {
    return (
      <div className="glass rounded-2xl p-12 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm">Crunching your creative data…</span>
      </div>
    );
  }

  if (stats.videosTotal === 0 && stats.campaignsTotal === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-primary mx-auto" />
        <h2 className="text-lg font-semibold">No data yet</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Create your first video or campaign and your real-time creative analytics will populate here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Creative Analytics
          </h2>
          <p className="text-xs text-muted-foreground">Live numbers from your videos and campaigns. Only you can see this data.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="glass rounded-lg p-3 text-xs text-destructive border border-destructive/30">
          Couldn't load some metrics: {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Video} label="Videos created" value={stats.videosTotal} hint={`${stats.videosThisWeek} this week`} />
        <StatCard icon={Film} label="Rendered" value={stats.videosRendered} hint={`${renderRate}% of total`} />
        <StatCard icon={Download} label="Exports" value={stats.exportsTotal} hint="MP4 / WebM saved" />
        <StatCard icon={Megaphone} label="Campaigns" value={stats.campaignsTotal} hint={`${stats.campaignsActive} active`} />
        <StatCard
          icon={Clock}
          label="Avg render"
          value={stats.avgRenderSeconds == null ? "—" : `${stats.avgRenderSeconds}s`}
          hint={stats.avgRenderSeconds == null ? "Render once to measure" : "Estimated end-to-end"}
        />
        <StatCard icon={Sparkles} label="AI-generated" value={`${aiShare}%`} hint="Of all videos" />
      </div>

      {/* Activity area chart */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Last 7 days</h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Videos</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(280 80% 60%)" }} />Campaigns</span>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart data={stats.weekly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(280 80% 60%)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(280 80% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="videos" stroke="hsl(var(--primary))" fill="url(#gV)" strokeWidth={2} />
            <Area type="monotone" dataKey="campaigns" stroke="hsl(280 80% 60%)" fill="url(#gC)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RankedList title="Top templates" icon={Layers} rows={stats.topTemplates} emptyMsg="No template data yet." />
        <RankedList title="Top platforms" icon={TrendingUp} rows={stats.topPlatforms} emptyMsg="Pick a platform on a video." />
        <RankedList title="Most-used CTAs" icon={Hash} rows={stats.topCTAs} emptyMsg="Add a CTA to your scripts." />
      </div>

      {/* Format mix bar + pie row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" /> Format mix
          </h3>
          {stats.formatMix.length ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={stats.formatMix} dataKey="value" nameKey="name" outerRadius={75} innerRadius={42}>
                  {stats.formatMix.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No video formats yet.</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {stats.formatMix.map((f, i) => (
              <Badge key={f.name} variant="outline" className="text-[10px]">
                <span className="w-2 h-2 rounded-full mr-1.5" style={{ background: PALETTE[i % PALETTE.length] }} />
                {f.name} • {f.value}
              </Badge>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Templates breakdown
          </h3>
          {stats.topTemplates.length ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={stats.topTemplates} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.topTemplates.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-xs text-muted-foreground">No templates picked yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeAnalytics;
