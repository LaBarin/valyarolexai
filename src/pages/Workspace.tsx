import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  LayoutDashboard, Inbox, Calendar, ListTodo, Bot, BarChart3,
  Plug, Presentation, Megaphone, MessageSquare, Menu, Video,
  ArrowLeft, LogOut
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/valyarolex-logo.png";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

import CommandCenter from "@/components/workspace/CommandCenter";
import InboxView from "@/components/workspace/InboxView";
import AIChatWidget from "@/components/AIChatWidget";
import TaskManager from "@/components/workspace/TaskManager";
import ScheduleView from "@/components/workspace/ScheduleView";
import AgentManager from "@/components/workspace/AgentManager";
import AIInsights from "@/components/workspace/AIInsights";
import IntegrationHub from "@/components/workspace/IntegrationHub";
import PitchDeckBuilder from "@/components/workspace/PitchDeckBuilder";
import CampaignManager from "@/components/workspace/CampaignManager";
import VideoStudio from "@/components/workspace/VideoStudio";

const navItems = [
  { id: "command", label: "Command Center", icon: LayoutDashboard, group: "core" },
  { id: "inbox", label: "Inbox", icon: Inbox, group: "core", badge: "3" },
  { id: "chat", label: "AI Assistant", icon: MessageSquare, group: "core" },
  { id: "tasks", label: "Tasks", icon: ListTodo, group: "productivity" },
  { id: "schedule", label: "Calendar", icon: Calendar, group: "productivity" },
  { id: "agents", label: "AI Agents", icon: Bot, group: "automation" },
  { id: "analytics", label: "Analytics", icon: BarChart3, group: "automation" },
  { id: "pitchdeck", label: "Pitch Deck", icon: Presentation, group: "tools" },
  { id: "campaigns", label: "Campaigns", icon: Megaphone, group: "tools" },
  { id: "videos", label: "Video Studio", icon: Video, group: "tools" },
  { id: "integrations", label: "Integrations", icon: Plug, group: "settings" },
] as const;

type TabId = typeof navItems[number]["id"];

const groups = [
  { key: "core", label: "Command" },
  { key: "productivity", label: "Productivity" },
  { key: "automation", label: "Automation" },
  { key: "tools", label: "Tools" },
  { key: "settings", label: "Settings" },
];

const WorkspaceSidebar = ({ activeTab, onNavigate }: { activeTab: TabId; onNavigate: (id: TabId) => void }) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30">
      <SidebarContent className="pt-20">
        {groups.map((group) => {
          const items = navItems.filter((i) => i.group === group.key);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.key}>
              {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onNavigate(item.id)}
                        className={`transition-all ${
                          activeTab === item.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && (
                          <span className="flex-1 flex items-center justify-between">
                            <span>{item.label}</span>
                            {"badge" in item && item.badge && (
                              <Badge className="bg-primary/20 text-primary text-[9px] px-1.5 py-0 ml-auto">{item.badge}</Badge>
                            )}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
};

const WorkspaceContent = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>((searchParams.get("tab") as TabId) || "command");

  useEffect(() => {
    const tab = searchParams.get("tab") as TabId;
    if (tab && navItems.some((i) => i.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  const navigate = (id: TabId | string) => {
    const validId = id as TabId;
    setActiveTab(validId);
    setSearchParams({ tab: validId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const titles: Record<string, string> = {
    command: "Command Center",
    inbox: "Inbox",
    chat: "AI Assistant",
    tasks: "Tasks",
    schedule: "Calendar",
    agents: "AI Agents",
    analytics: "Analytics & Insights",
    pitchdeck: "Pitch Deck Studio",
    campaigns: "Campaign Manager",
    videos: "Video Studio",
    integrations: "Integrations",
  };

  return (
    <>
      <WorkspaceSidebar activeTab={activeTab} onNavigate={navigate} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-3 border-b border-border/30 px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </SidebarTrigger>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Valyarolex.AI" className="w-8 h-8 rounded-md object-cover" />
            <span className="text-sm font-bold tracking-tight hidden sm:block">Valyarolex.AI</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-muted-foreground">{titles[activeTab]}</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "command" && <CommandCenter onNavigate={navigate} />}
              {activeTab === "inbox" && <InboxView />}
              {activeTab === "chat" && (
                <div className="max-w-3xl">
                  <AIChatWidget className="h-[calc(100vh-160px)] min-h-[400px]" />
                </div>
              )}
              {activeTab === "tasks" && (
                <div className="max-w-3xl">
                  <TaskManager />
                </div>
              )}
              {activeTab === "schedule" && (
                <div className="max-w-3xl">
                  <ScheduleView />
                </div>
              )}
              {activeTab === "agents" && (
                <div className="max-w-3xl">
                  <AgentManager />
                </div>
              )}
              {activeTab === "analytics" && <AIInsights />}
              {activeTab === "pitchdeck" && <PitchDeckBuilder />}
              {activeTab === "campaigns" && (
                <div className="max-w-4xl">
                  <CampaignManager />
                </div>
              )}
              {activeTab === "integrations" && (
                <div className="max-w-4xl">
                  <IntegrationHub />
                </div>
              )}
              {activeTab === "videos" && (
                <div className="max-w-4xl">
                  <VideoStudio />
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
};

const Workspace = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <WorkspaceContent />
      </div>
    </SidebarProvider>
  );
};

export default Workspace;
