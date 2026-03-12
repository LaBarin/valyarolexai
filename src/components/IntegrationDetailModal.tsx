import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, Zap, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Map integration names to connector IDs where available
const CONNECTOR_MAP: Record<string, string> = {
  Slack: "slack",
  Linear: "linear",
  Twilio: "twilio",
  Telegram: "telegram",
};

// Integration descriptions and features
const INTEGRATION_INFO: Record<string, { description: string; features: string[]; docsUrl?: string }> = {
  Gmail: {
    description: "Connect your Gmail account to manage emails directly from your workspace.",
    features: ["Send & receive emails", "Smart email drafting", "Auto-categorization", "Thread management"],
    docsUrl: "https://mail.google.com",
  },
  "Google Calendar": {
    description: "Sync your calendar to schedule meetings and manage events seamlessly.",
    features: ["Two-way calendar sync", "Smart scheduling", "Meeting prep briefs", "Conflict detection"],
    docsUrl: "https://calendar.google.com",
  },
  Outlook: {
    description: "Integrate Microsoft Outlook for email and calendar management.",
    features: ["Email sync", "Calendar integration", "Contact management", "Task sync"],
    docsUrl: "https://outlook.com",
  },
  "Office 365": {
    description: "Connect your Microsoft 365 suite for full productivity integration.",
    features: ["Document collaboration", "Email & calendar", "Teams integration", "SharePoint access"],
    docsUrl: "https://www.office.com",
  },
  Slack: {
    description: "Send messages, manage channels, and automate Slack workflows.",
    features: ["Send & receive messages", "Channel management", "Workflow automation", "File sharing"],
    docsUrl: "https://slack.com",
  },
  "Microsoft Teams": {
    description: "Integrate with Teams for messaging and video collaboration.",
    features: ["Chat messaging", "Meeting scheduling", "File sharing", "Channel notifications"],
    docsUrl: "https://teams.microsoft.com",
  },
  Zoom: {
    description: "Schedule and manage Zoom meetings directly from your workspace.",
    features: ["Meeting scheduling", "Auto-join links", "Recording management", "Participant tracking"],
    docsUrl: "https://zoom.us",
  },
  "Google Meet": {
    description: "Create and manage Google Meet video calls.",
    features: ["Instant meetings", "Calendar integration", "Recording access", "Participant management"],
    docsUrl: "https://meet.google.com",
  },
  Salesforce: {
    description: "Sync CRM data and manage sales pipelines.",
    features: ["Contact sync", "Pipeline management", "Deal tracking", "Activity logging"],
    docsUrl: "https://www.salesforce.com",
  },
  HubSpot: {
    description: "Connect HubSpot for CRM, marketing, and sales automation.",
    features: ["Contact management", "Deal pipeline", "Email tracking", "Marketing automation"],
    docsUrl: "https://www.hubspot.com",
  },
  Notion: {
    description: "Sync Notion pages and databases with your workspace.",
    features: ["Page sync", "Database queries", "Content creation", "Template automation"],
    docsUrl: "https://www.notion.so",
  },
  Asana: {
    description: "Manage Asana tasks and projects from your workspace.",
    features: ["Task management", "Project tracking", "Due date sync", "Team assignments"],
    docsUrl: "https://asana.com",
  },
  "Monday.com": {
    description: "Connect Monday.com boards for project management.",
    features: ["Board sync", "Item management", "Status updates", "Automation triggers"],
    docsUrl: "https://monday.com",
  },
  Jira: {
    description: "Integrate Jira for issue tracking and sprint management.",
    features: ["Issue creation", "Sprint tracking", "Status sync", "Backlog management"],
    docsUrl: "https://www.atlassian.com/software/jira",
  },
  GitHub: {
    description: "Connect GitHub for repository management and code collaboration.",
    features: ["PR notifications", "Issue tracking", "Code review", "CI/CD status"],
    docsUrl: "https://github.com",
  },
  GitLab: {
    description: "Integrate GitLab for DevOps and code management.",
    features: ["Merge requests", "Pipeline status", "Issue tracking", "Repository sync"],
    docsUrl: "https://gitlab.com",
  },
  Linear: {
    description: "Sync Linear issues and projects for streamlined development workflows.",
    features: ["Issue management", "Cycle tracking", "Priority sync", "Team workflows"],
    docsUrl: "https://linear.app",
  },
  Trello: {
    description: "Connect Trello boards for visual project management.",
    features: ["Card management", "Board sync", "Label organization", "Due date tracking"],
    docsUrl: "https://trello.com",
  },
  ClickUp: {
    description: "Integrate ClickUp for comprehensive task management.",
    features: ["Task management", "Time tracking", "Goal tracking", "Custom fields"],
    docsUrl: "https://clickup.com",
  },
  Twilio: {
    description: "Send SMS, make calls, and manage communications via Twilio.",
    features: ["SMS messaging", "Voice calls", "WhatsApp integration", "Communication logs"],
    docsUrl: "https://www.twilio.com",
  },
  Telegram: {
    description: "Connect Telegram bots for messaging automation.",
    features: ["Bot messaging", "Group notifications", "Media sharing", "Command handling"],
    docsUrl: "https://telegram.org",
  },
  Dropbox: {
    description: "Sync files and folders with Dropbox storage.",
    features: ["File sync", "Folder management", "Sharing controls", "Version history"],
    docsUrl: "https://www.dropbox.com",
  },
  "Google Drive": {
    description: "Connect Google Drive for file storage and collaboration.",
    features: ["File sync", "Document creation", "Sharing management", "Search integration"],
    docsUrl: "https://drive.google.com",
  },
  OneDrive: {
    description: "Integrate Microsoft OneDrive for cloud file storage.",
    features: ["File sync", "Document editing", "Sharing controls", "Storage management"],
    docsUrl: "https://onedrive.live.com",
  },
  Stripe: {
    description: "Connect Stripe for payment processing and billing management.",
    features: ["Payment tracking", "Invoice management", "Subscription monitoring", "Revenue analytics"],
    docsUrl: "https://stripe.com",
  },
  Zapier: {
    description: "Connect thousands of apps through Zapier automation.",
    features: ["Multi-app workflows", "Trigger automation", "Data mapping", "Error handling"],
    docsUrl: "https://zapier.com",
  },
};

interface IntegrationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: {
    name: string;
    cat: string;
    color: string;
    logo: string;
  } | null;
}

const IntegrationDetailModal = ({ open, onOpenChange, integration }: IntegrationDetailModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!integration) return null;

  const connectorId = CONNECTOR_MAP[integration.name];
  const info = INTEGRATION_INFO[integration.name];
  const hasConnector = !!connectorId;

  const description = info?.description || `Connect ${integration.name} to enhance your productivity workflow.`;
  const features = info?.features || ["Sync data", "Automate workflows", "Real-time updates", "Secure connection"];
  const docsUrl = info?.docsUrl || `https://www.google.com/search?q=${encodeURIComponent(integration.name)}`;

  const handleConnect = () => {
    if (!user) {
      toast.info("Please sign in to connect integrations.");
      onOpenChange(false);
      navigate("/login");
      return;
    }

    if (hasConnector) {
      toast.success(`${integration.name} connection initiated! Configure it in your workspace settings.`);
      onOpenChange(false);
      navigate("/workspace");
    } else {
      toast.info(`${integration.name} integration is coming soon! We'll notify you when it's available.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ background: `${integration.color}20` }}
              dangerouslySetInnerHTML={{ __html: integration.logo }}
            />
            <div>
              <DialogTitle className="text-lg">{integration.name}</DialogTitle>
              <Badge variant="secondary" className="text-xs mt-1">
                {integration.cat}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mt-2">{description}</p>

        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Features</h4>
          <ul className="space-y-1.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 mt-6">
          {hasConnector ? (
            <Button onClick={handleConnect} className="flex-1 gap-2">
              <Zap className="w-4 h-4" />
              Connect {integration.name}
            </Button>
          ) : (
            <Button onClick={handleConnect} variant="secondary" className="flex-1 gap-2">
              <ArrowRight className="w-4 h-4" />
              Coming Soon
            </Button>
          )}
          <Button variant="outline" size="icon" asChild>
            <a href={docsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>

        {hasConnector && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Secure OAuth connection · No passwords stored
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IntegrationDetailModal;
