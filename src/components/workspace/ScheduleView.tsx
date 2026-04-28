import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles, Loader2, Clock, Calendar as CalendarIcon, Brain, X, RotateCw, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ScheduleEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string;
  is_focus_block: boolean;
  ai_suggested: boolean;
  attendees: string[];
};

const eventColors: Record<string, string> = {
  meeting: "hsl(190 100% 50%)",
  focus: "hsl(150 70% 50%)",
  task: "hsl(35 95% 55%)",
  break: "hsl(280 70% 60%)",
  scheduled_post: "hsl(320 90% 60%)",
};

type ScheduledPostEvent = {
  id: string;
  title: string;
  start_time: string;
  channel: string;
  status: string;
  publisher: string;
  isPost: true;
};



const ScheduleView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPostEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", event_type: "meeting", duration: "60" });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ title: string; start: string; end: string; event_type: string } | null>(null);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, selectedDate]);

  const fetchEvents = async () => {
    const dayStart = `${selectedDate}T00:00:00Z`;
    const dayEnd = `${selectedDate}T23:59:59Z`;
    const [evRes, postRes] = await Promise.all([
      supabase.from("schedule_events").select("*").gte("start_time", dayStart).lte("start_time", dayEnd).order("start_time", { ascending: true }),
      supabase.from("scheduled_posts").select("id, channel, caption, scheduled_at, status, publisher").gte("scheduled_at", dayStart).lte("scheduled_at", dayEnd).order("scheduled_at", { ascending: true }),
    ]);
    if (!evRes.error) setEvents(evRes.data || []);
    if (!postRes.error) {
      setScheduledPosts((postRes.data || []).map((p: any) => ({
        id: p.id,
        title: (p.caption || "").split("\n")[0]?.slice(0, 60) || `${p.channel} post`,
        start_time: p.scheduled_at,
        channel: p.channel,
        status: p.status,
        publisher: p.publisher,
        isPost: true as const,
      })));
    }
    setLoading(false);
  };

  const addEvent = async () => {
    if (!newEvent.title.trim() || !user) return;
    const startHour = 9 + events.length * 2;
    const start = new Date(`${selectedDate}T${String(startHour).padStart(2, "0")}:00:00Z`);
    const end = new Date(start.getTime() + parseInt(newEvent.duration) * 60000);

    const { data, error } = await supabase
      .from("schedule_events")
      .insert({
        title: newEvent.title,
        event_type: newEvent.event_type,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        user_id: user.id,
        is_focus_block: newEvent.event_type === "focus",
      })
      .select()
      .single();

    if (!error && data) {
      setEvents((prev) => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setNewEvent({ title: "", event_type: "meeting", duration: "60" });
      setShowAdd(false);
    }
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("schedule_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const startEditing = (event: ScheduleEvent) => {
    setEditingId(event.id);
    setEditData({
      title: event.title,
      start: new Date(event.start_time).toTimeString().slice(0, 5),
      end: new Date(event.end_time).toTimeString().slice(0, 5),
      event_type: event.event_type,
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editData) return;
    const start_time = new Date(`${selectedDate}T${editData.start}:00`).toISOString();
    const end_time = new Date(`${selectedDate}T${editData.end}:00`).toISOString();
    const { error } = await supabase
      .from("schedule_events")
      .update({ title: editData.title, start_time, end_time, event_type: editData.event_type, is_focus_block: editData.event_type === "focus" })
      .eq("id", editingId);
    if (!error) {
      setEvents((prev) =>
        prev.map((e) => e.id === editingId ? { ...e, title: editData.title, start_time, end_time, event_type: editData.event_type, is_focus_block: editData.event_type === "focus" } : e)
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
      );
    }
    setEditingId(null);
    setEditData(null);
  };

  const retryPost = async (id: string) => {
    const { error } = await supabase
      .from("scheduled_posts")
      .update({ status: "pending", scheduled_at: new Date().toISOString(), error: null })
      .eq("id", id);
    if (error) {
      toast({ title: "Retry failed", description: error.message, variant: "destructive" });
      return;
    }
    setScheduledPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: "pending" } : p));
    toast({ title: "Retry queued", description: "Post will be published within a minute." });
    supabase.functions.invoke("publish-scheduled-posts", { body: {} }).catch(() => {});
  };

  const cancelPost = async (id: string) => {
    const { error } = await supabase.from("scheduled_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Cancel failed", description: error.message, variant: "destructive" });
      return;
    }
    setScheduledPosts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Post cancelled" });
  };

  const aiOptimizeSchedule = async () => {
    if (!user || aiOptimizing) return;
    setAiOptimizing(true);
    try {
      const existingEvents = events.map((e) => ({
        title: e.title,
        type: e.event_type,
        start: new Date(e.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        end: new Date(e.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));

      const { data: fnData, error: fnError } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{
            role: "user",
            content: `Here's my schedule for today: ${JSON.stringify(existingEvents)}. Suggest 2-3 optimizations.`,
          }],
          mode: "schedule",
        },
      });

      if (fnError) throw new Error(fnError.message || "AI request failed");

      const resultStr = fnData?.result || "{}";
      const parsed = typeof resultStr === "string" ? JSON.parse(resultStr) : resultStr;
      const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];

      if (!suggestions.length) throw new Error("AI returned no suggestions. Try again.");

      for (const s of suggestions) {
        const start = new Date(`${selectedDate}T${String(s.start_hour).padStart(2, "0")}:00:00Z`);
        const end = new Date(start.getTime() + (s.duration_minutes || 60) * 60000);

        const { data } = await supabase
          .from("schedule_events")
          .insert({
            title: s.title,
            event_type: s.event_type,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            user_id: user.id,
            is_focus_block: s.event_type === "focus",
            ai_suggested: true,
            description: s.reason,
          })
          .select()
          .single();
        if (data) setEvents((prev) => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      }

      toast({ title: "Schedule Optimized", description: `AI added ${suggestions.length} suggestions` });
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    } finally {
      setAiOptimizing(false);
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      {/* Date picker + controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal gap-2", !selectedDate && "text-muted-foreground")}>
              <CalendarIcon className="w-4 h-4" />
              {selectedDate ? format(parseISO(selectedDate), "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? parseISO(selectedDate) : undefined}
              onSelect={(date) => date && setSelectedDate(format(date, "yyyy-MM-dd"))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" variant="outline" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Event
        </Button>
        <Button onClick={aiOptimizeSchedule} size="sm" variant="outline" className="gap-1.5" disabled={aiOptimizing}>
          {aiOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
          AI Optimize
        </Button>
      </div>

      {/* Add event form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass rounded-xl p-4 space-y-3">
          <Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Event title..." className="bg-background/50" />
          <div className="flex gap-2">
            <select
              value={newEvent.event_type}
              onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
              className="text-sm bg-muted/50 rounded-md px-3 py-2 border border-border text-foreground"
            >
              <option value="meeting">Meeting</option>
              <option value="focus">Focus Block</option>
              <option value="task">Task</option>
              <option value="break">Break</option>
            </select>
            <select
              value={newEvent.duration}
              onChange={(e) => setNewEvent({ ...newEvent, duration: e.target.value })}
              className="text-sm bg-muted/50 rounded-md px-3 py-2 border border-border text-foreground"
            >
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
            <Button onClick={addEvent} size="sm" disabled={!newEvent.title.trim()}>Add</Button>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : events.length === 0 && scheduledPosts.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No events scheduled. Add one or let AI optimize your day.</p>
          </div>
        ) : (
          <>
          {scheduledPosts.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">Scheduled Posts</p>
              {scheduledPosts.map((p) => (
                <div key={p.id} className="glass rounded-lg p-2.5 flex items-center gap-2 border-l-[3px]" style={{ borderLeftColor: eventColors.scheduled_post }}>
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium flex-1 truncate">{p.title}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(p.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40">{p.channel}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40">{p.publisher}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${p.status === "published" ? "bg-green-500/20 text-green-400" : p.status === "failed" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>{p.status}</span>
                  {p.status === "failed" && (
                    <button onClick={() => retryPost(p.id)} title="Retry" className="text-muted-foreground hover:text-primary transition-colors">
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(p.status === "pending" || p.status === "failed") && (
                    <button onClick={() => cancelPost(p.id)} title="Cancel" className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-stretch gap-3 group"
            >
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: eventColors[event.event_type] || eventColors.meeting }} />
                {i < events.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="glass rounded-lg p-3 flex-1 mb-2 cursor-pointer" style={{ borderLeftWidth: 3, borderLeftColor: eventColors[event.event_type] || eventColors.meeting }} onClick={() => editingId !== event.id && startEditing(event)}>
                {editingId === event.id && editData ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="h-7 text-sm bg-background/50" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <input type="time" value={editData.start} onChange={(e) => setEditData({ ...editData, start: e.target.value })} className="text-xs bg-muted/50 rounded px-2 py-1 border border-border text-foreground" />
                      <span className="text-xs text-muted-foreground">—</span>
                      <input type="time" value={editData.end} onChange={(e) => setEditData({ ...editData, end: e.target.value })} className="text-xs bg-muted/50 rounded px-2 py-1 border border-border text-foreground" />
                      <select value={editData.event_type} onChange={(e) => setEditData({ ...editData, event_type: e.target.value })} className="text-xs bg-muted/50 rounded px-2 py-1 border border-border text-foreground">
                        <option value="meeting">Meeting</option>
                        <option value="focus">Focus</option>
                        <option value="task">Task</option>
                        <option value="break">Break</option>
                      </select>
                      <Button size="sm" className="h-6 text-xs px-2" onClick={saveEdit}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setEditingId(null); setEditData(null); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {event.title}
                        {event.ai_suggested && <Sparkles className="w-3 h-3 text-primary" />}
                        {event.is_focus_block && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">Focus</span>}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.start_time)} — {formatTime(event.end_time)}
                      </p>
                      {event.description && <p className="text-xs text-muted-foreground mt-1 italic">{event.description}</p>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleView;
