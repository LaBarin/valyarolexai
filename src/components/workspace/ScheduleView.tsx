import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles, Loader2, Clock, Calendar as CalendarIcon, Brain, X } from "lucide-react";
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
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const ScheduleView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", event_type: "meeting", duration: "60" });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, selectedDate]);

  const fetchEvents = async () => {
    const dayStart = `${selectedDate}T00:00:00Z`;
    const dayEnd = `${selectedDate}T23:59:59Z`;
    const { data, error } = await supabase
      .from("schedule_events")
      .select("*")
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd)
      .order("start_time", { ascending: true });
    if (!error) setEvents(data || []);
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

  const aiOptimizeSchedule = async () => {
    if (!user || aiOptimizing) return;
    setAiOptimizing(true);
    try {
      const session = await supabase.auth.getSession();
      const existingEvents = events.map((e) => ({
        title: e.title,
        type: e.event_type,
        start: new Date(e.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        end: new Date(e.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Here's my schedule for today: ${JSON.stringify(existingEvents)}. 
Suggest 2-3 optimizations (like adding focus blocks, rearranging for energy levels, or adding breaks). 
Return ONLY a JSON array of objects with "title", "event_type" (meeting/focus/task/break), "start_hour" (0-23), "duration_minutes", and "reason" fields. No markdown.`,
          }],
          mode: "chat",
        }),
      });

      if (!resp.ok) throw new Error("Failed");
      
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch {}
          }
        }
      }

      let jsonStr = fullText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      // Extract JSON array if surrounded by other text
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!arrayMatch) throw new Error("AI did not return valid suggestions. Please try again.");
      const suggestions = JSON.parse(arrayMatch[0]);

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
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto bg-background/50"
        />
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
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No events scheduled. Add one or let AI optimize your day.</p>
          </div>
        ) : (
          events.map((event, i) => (
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
              <div className="glass rounded-lg p-3 flex-1 mb-2" style={{ borderLeftWidth: 3, borderLeftColor: eventColors[event.event_type] || eventColors.meeting }}>
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
                  <button onClick={() => deleteEvent(event.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScheduleView;
