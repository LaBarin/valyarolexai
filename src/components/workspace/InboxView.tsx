import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, Star, Clock, Trash2, Archive, Reply, Bot, Sparkles,
  ChevronRight, Paperclip, AlertCircle, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type InboxItem = {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  time: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  category: "lead" | "internal" | "client" | "notification";
  aiSuggestion?: string;
  aiAction?: string;
};

const mockInbox: InboxItem[] = [
  {
    id: "1", from: "Sarah Chen", fromEmail: "sarah@acmecorp.com",
    subject: "Partnership Discussion Follow-up",
    preview: "Hi, following up on our conversation about the integration partnership. We'd love to schedule a call this week to discuss next steps...",
    time: "10 min ago", isRead: false, isStarred: false, hasAttachment: false, category: "lead",
    aiSuggestion: "High-intent lead (score: 92). Schedule a meeting and prepare briefing?",
    aiAction: "Schedule + Brief",
  },
  {
    id: "2", from: "James Miller", fromEmail: "james@vendorinc.com",
    subject: "Q1 Invoice #2847",
    preview: "Please find attached the invoice for Q1 services. Payment is due within 30 days...",
    time: "1 hr ago", isRead: false, isStarred: false, hasAttachment: true, category: "client",
    aiSuggestion: "Invoice detected. Auto-log to accounting system?",
  },
  {
    id: "3", from: "Marketing Team", fromEmail: "marketing@internal.co",
    subject: "Campaign Performance Update",
    preview: "This week's campaign results: 2,340 impressions, 187 clicks, 23 conversions. CTR is up 12% from last week...",
    time: "2 hrs ago", isRead: true, isStarred: true, hasAttachment: false, category: "internal",
  },
  {
    id: "4", from: "Alex Rivera", fromEmail: "alex@prospect.io",
    subject: "Interested in Enterprise Plan",
    preview: "We're a team of 50 and looking for a solution that can handle our workflow automation needs. Could you provide pricing...",
    time: "3 hrs ago", isRead: false, isStarred: false, hasAttachment: false, category: "lead",
    aiSuggestion: "Enterprise lead detected. Auto-respond with pricing deck?",
    aiAction: "Send Pricing",
  },
  {
    id: "5", from: "Notification", fromEmail: "noreply@calendar.ai",
    subject: "Meeting moved: Team Standup → 11:30 AM",
    preview: "AI detected your deep work window (9-11 AM) and auto-moved the standup to preserve focus time.",
    time: "5 hrs ago", isRead: true, isStarred: false, hasAttachment: false, category: "notification",
  },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  lead: { bg: "bg-accent/15", text: "text-accent" },
  client: { bg: "bg-primary/15", text: "text-primary" },
  internal: { bg: "bg-muted", text: "text-muted-foreground" },
  notification: { bg: "bg-orange-500/15", text: "text-orange-400" },
};

const InboxView = () => {
  const [items, setItems] = useState(mockInbox);
  const [selected, setSelected] = useState<string | null>(null);

  const selectedItem = items.find((i) => i.id === selected);

  const markRead = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isRead: true } : i));
  };

  const toggleStar = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isStarred: !i.isStarred } : i));
  };

  const archiveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected === id) setSelected(null);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 h-[calc(100vh-200px)] min-h-[500px]">
        {/* List */}
        <div className={`${selected ? "col-span-5 border-r border-border/30" : "col-span-12"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Inbox</span>
              <Badge variant="outline" className="text-[10px]">{items.filter(i => !i.isRead).length} new</Badge>
            </div>
          </div>

          <ScrollArea className="h-[calc(100%-52px)]">
            <div className="divide-y divide-border/20">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    selected === item.id ? "bg-primary/5" : "hover:bg-muted/30"
                  } ${!item.isRead ? "bg-primary/[0.02]" : ""}`}
                  onClick={() => { setSelected(item.id); markRead(item.id); }}
                >
                  <div className="flex items-start gap-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }}
                      className="mt-0.5 flex-shrink-0">
                      <Star className={`w-3.5 h-3.5 ${item.isStarred ? "fill-orange-400 text-orange-400" : "text-muted-foreground/40"}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-sm truncate ${!item.isRead ? "font-semibold" : "font-medium"}`}>
                          {item.from}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.time}</span>
                      </div>
                      <p className={`text-xs truncate mb-0.5 ${!item.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                        {item.subject}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.preview}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className={`text-[9px] px-1.5 py-0 ${categoryColors[item.category].bg} ${categoryColors[item.category].text}`}>
                          {item.category}
                        </Badge>
                        {item.hasAttachment && <Paperclip className="w-3 h-3 text-muted-foreground/50" />}
                        {item.aiSuggestion && <Bot className="w-3 h-3 text-primary" />}
                      </div>
                    </div>
                    {!item.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Detail */}
        {selected && selectedItem && (
          <div className="col-span-7">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex gap-1.5">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archiveItem(selectedItem.id)}>
                  <Archive className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Reply className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => archiveItem(selectedItem.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)} className="text-xs">
                Close
              </Button>
            </div>

            <ScrollArea className="h-[calc(100%-52px)]">
              <div className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">{selectedItem.subject}</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedItem.from}</span>
                    <span>&lt;{selectedItem.fromEmail}&gt;</span>
                    <span>· {selectedItem.time}</span>
                  </div>
                </div>

                {/* AI Suggestion */}
                {selectedItem.aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-primary/5 border border-primary/20 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">AI Suggestion</span>
                    </div>
                    <p className="text-sm text-foreground/80 mb-3">{selectedItem.aiSuggestion}</p>
                    <div className="flex gap-2">
                      {selectedItem.aiAction && (
                        <Button size="sm" className="text-xs">
                          <Bot className="w-3 h-3 mr-1" /> {selectedItem.aiAction}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-xs">Dismiss</Button>
                    </div>
                  </motion.div>
                )}

                <div className="text-sm text-foreground/80 leading-relaxed">
                  {selectedItem.preview}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxView;
