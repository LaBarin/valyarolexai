import { Bell, X, CheckCheck, Video, Megaphone, Inbox, Calendar, Presentation, FolderOpen, Palette, Sparkles, ListTodo, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface Props {
  onNavigate?: (tab: string) => void;
}

const typeColor = (type: string) => {
  switch (type) {
    case "success": return "text-emerald-400";
    case "error": return "text-red-400";
    case "warning": return "text-amber-400";
    default: return "text-primary";
  }
};

/** Parse a notification link into a workspace tab id. Supports "tab:videos" or bare "videos". */
const parseTab = (link: string | null): string | null => {
  if (!link) return null;
  return link.startsWith("tab:") ? link.slice(4) : link;
};

/** Map a tab id → action button label + icon for the inline CTA. */
const ACTION_META: Record<string, { label: string; icon: typeof Video }> = {
  videos: { label: "Open render", icon: Video },
  creative: { label: "Open render", icon: Video },
  campaigns: { label: "Open campaign", icon: Megaphone },
  inbox: { label: "Open inbox", icon: Inbox },
  schedule: { label: "Open calendar", icon: Calendar },
  tasks: { label: "Open task", icon: ListTodo },
  pitchdeck: { label: "Open deck", icon: Presentation },
  media: { label: "Open library", icon: FolderOpen },
  brandkit: { label: "Open Brand Kit", icon: Palette },
  agents: { label: "Open agent", icon: Sparkles },
};

const NotificationBell = ({ onNavigate }: Props) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // Auto-mark all as read when the dropdown is opened.
    if (next && unreadCount > 0) {
      // Tiny delay so the user sees the unread state for a beat before it clears.
      setTimeout(() => { void markAllAsRead(); }, 600);
    }
  };

  const handleAction = (n: { id: string; link: string | null; read_at: string | null }) => {
    if (!n.read_at) void markAsRead(n.id);
    const tab = parseTab(n.link);
    if (tab && onNavigate) onNavigate(tab);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 glass border-border/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => void markAllAsRead()}>
              <CheckCheck className="w-3 h-3" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[28rem] overflow-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              You're all caught up
            </div>
          ) : (
            notifications.map((n) => {
              const tab = parseTab(n.link);
              const meta = tab ? ACTION_META[tab] : undefined;
              const ActionIcon = meta?.icon ?? ArrowUpRight;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "group px-4 py-3 border-b border-border/20 hover:bg-muted/20 transition-colors",
                    !n.read_at && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", !n.read_at ? "bg-primary" : "bg-transparent")} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium truncate", typeColor(n.type))}>{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <p className="text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                        {tab && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 px-2 text-[10px] gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-0"
                            onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                          >
                            <ActionIcon className="w-3 h-3" />
                            {meta?.label ?? "Open"}
                          </Button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); void remove(n.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
