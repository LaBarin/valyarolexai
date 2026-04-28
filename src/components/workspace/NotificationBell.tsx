import { Bell, Check, X, CheckCheck } from "lucide-react";
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

const NotificationBell = ({ onNavigate }: Props) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, remove } = useNotifications();

  const handleClick = (n: { id: string; link: string | null; read_at: string | null }) => {
    if (!n.read_at) markAsRead(n.id);
    if (n.link && onNavigate) {
      // Link format: "tab:videos" or just "videos"
      const tab = n.link.startsWith("tab:") ? n.link.slice(4) : n.link;
      onNavigate(tab);
    }
  };

  return (
    <Popover>
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
      <PopoverContent align="end" className="w-80 p-0 glass border-border/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
              <CheckCheck className="w-3 h-3" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              You're all caught up
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group px-4 py-3 border-b border-border/20 hover:bg-muted/20 cursor-pointer transition-colors",
                  !n.read_at && "bg-primary/5"
                )}
                onClick={() => handleClick(n)}
              >
                <div className="flex items-start gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", !n.read_at ? "bg-primary" : "bg-transparent")} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium truncate", typeColor(n.type))}>{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
