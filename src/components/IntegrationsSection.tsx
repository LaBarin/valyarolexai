import { motion } from "framer-motion";
import { useState } from "react";
import { Search } from "lucide-react";
import IntegrationDetailModal from "./IntegrationDetailModal";

const categories = ["All", "Communication", "Productivity", "CRM & Sales", "Development", "Storage"] as const;

interface Integration {
  name: string;
  cat: string;
  color: string;
  logo: string; // SVG markup
}

const integrations: Integration[] = [
  {
    name: "Gmail",
    cat: "Communication",
    color: "#EA4335",
    logo: `<svg viewBox="0 0 24 24" fill="none"><path d="M2 6l10 7 10-7v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="#EA4335"/><path d="M22 6l-10 7L2 6V4a2 2 0 012-2h16a2 2 0 012 2v2z" fill="#FBBC05"/><path d="M2 6l10 7" stroke="#34A853" stroke-width="1.5"/><path d="M22 6l-10 7" stroke="#4285F4" stroke-width="1.5"/></svg>`,
  },
  {
    name: "Google Calendar",
    cat: "Productivity",
    color: "#4285F4",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" fill="#fff" stroke="#4285F4" stroke-width="1.5"/><rect x="3" y="4" width="18" height="5" rx="1" fill="#4285F4"/><text x="12" y="17" text-anchor="middle" fill="#4285F4" font-size="7" font-weight="bold">31</text><line x1="8" y1="2" x2="8" y2="5" stroke="#4285F4" stroke-width="1.5" stroke-linecap="round"/><line x1="16" y1="2" x2="16" y2="5" stroke="#4285F4" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    name: "Outlook",
    cat: "Communication",
    color: "#0078D4",
    logo: `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4"/><ellipse cx="9" cy="12" rx="4" ry="4.5" fill="#fff"/><text x="9" y="14.5" text-anchor="middle" fill="#0078D4" font-size="8" font-weight="bold">O</text><path d="M14 7h6v10h-6" fill="#0A5EA8"/></svg>`,
  },
  {
    name: "Office 365",
    cat: "Productivity",
    color: "#D83B01",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#D83B01"/><rect x="6" y="6" width="5" height="5" rx="0.5" fill="#fff"/><rect x="13" y="6" width="5" height="5" rx="0.5" fill="#fff" opacity="0.8"/><rect x="6" y="13" width="5" height="5" rx="0.5" fill="#fff" opacity="0.8"/><rect x="13" y="13" width="5" height="5" rx="0.5" fill="#fff" opacity="0.6"/></svg>`,
  },
  {
    name: "Slack",
    cat: "Communication",
    color: "#4A154B",
    logo: `<svg viewBox="0 0 24 24"><g><rect x="1" y="9" width="4" height="7" rx="2" fill="#E01E5A"/><rect x="9" y="1" width="7" height="4" rx="2" fill="#36C5F0"/><rect x="19" y="9" width="4" height="7" rx="2" fill="#2EB67D"/><rect x="9" y="19" width="7" height="4" rx="2" fill="#ECB22E"/><rect x="5" y="9" width="10" height="3" rx="1.5" fill="#E01E5A"/><rect x="9" y="5" width="3" height="10" rx="1.5" fill="#36C5F0"/><rect x="9" y="12" width="10" height="3" rx="1.5" fill="#2EB67D"/><rect x="12" y="9" width="3" height="10" rx="1.5" fill="#ECB22E"/></g></svg>`,
  },
  {
    name: "Microsoft Teams",
    cat: "Communication",
    color: "#6264A7",
    logo: `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="16" height="16" rx="2" fill="#6264A7"/><text x="10" y="15" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">T</text><circle cx="19" cy="7" r="3" fill="#6264A7"/><path d="M16 11h6v6a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6z" fill="#6264A7" opacity="0.7"/></svg>`,
  },
  {
    name: "Zoom",
    cat: "Communication",
    color: "#2D8CFF",
    logo: `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="4" fill="#2D8CFF"/><path d="M6 9h8v6H6z" fill="#fff" rx="1"/><path d="M15 10l4-2v8l-4-2V10z" fill="#fff"/></svg>`,
  },
  {
    name: "Google Meet",
    cat: "Communication",
    color: "#00897B",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="12" height="12" rx="2" fill="#00897B"/><path d="M15 9l5-3v12l-5-3V9z" fill="#FFC107"/><rect x="3" y="6" width="12" height="12" rx="2" fill="#00897B"/></svg>`,
  },
  {
    name: "Salesforce",
    cat: "CRM & Sales",
    color: "#00A1E0",
    logo: `<svg viewBox="0 0 24 24"><path d="M12 4C6.5 4 2 8.5 2 14s4.5 6 10 6 10-2.7 10-6S17.5 4 12 4z" fill="#00A1E0"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="6" font-weight="bold">SF</text></svg>`,
  },
  {
    name: "HubSpot",
    cat: "CRM & Sales",
    color: "#FF7A59",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FF7A59"/><circle cx="12" cy="10" r="3" fill="#fff"/><path d="M8 17c0-2.2 1.8-4 4-4s4 1.8 4 4" fill="#fff"/><circle cx="18" cy="6" r="2" fill="#FF7A59" stroke="#fff" stroke-width="1"/></svg>`,
  },
  {
    name: "Notion",
    cat: "Productivity",
    color: "#000000",
    logo: `<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" fill="#fff" stroke="#000" stroke-width="1.5"/><path d="M8 7h8M8 11h6M8 15h4" stroke="#000" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  },
  {
    name: "Asana",
    cat: "Productivity",
    color: "#F06A6A",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="16" r="5" fill="#F06A6A"/><circle cx="5" cy="9" r="4" fill="#F06A6A"/><circle cx="19" cy="9" r="4" fill="#F06A6A"/></svg>`,
  },
  {
    name: "Monday.com",
    cat: "Productivity",
    color: "#FF3D57",
    logo: `<svg viewBox="0 0 24 24"><circle cx="6" cy="16" r="3" fill="#FF3D57"/><circle cx="12" cy="12" r="3" fill="#FFCB00"/><circle cx="18" cy="8" r="3" fill="#00CA72"/></svg>`,
  },
  {
    name: "Jira",
    cat: "Development",
    color: "#0052CC",
    logo: `<svg viewBox="0 0 24 24"><path d="M12 2L2 12l10 10 10-10L12 2z" fill="#0052CC"/><path d="M12 7l5 5-5 5-5-5 5-5z" fill="#2684FF"/></svg>`,
  },
  {
    name: "GitHub",
    cat: "Development",
    color: "#ffffff",
    logo: `<svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="#fff"/></svg>`,
  },
  {
    name: "GitLab",
    cat: "Development",
    color: "#FC6D26",
    logo: `<svg viewBox="0 0 24 24"><path d="M12 21.35L3.94 15.1l1.47-4.53L7.18 4.5h2.64L12 10.57l2.18-6.07h2.64l1.77 6.07 1.47 4.53L12 21.35z" fill="#FC6D26"/><path d="M12 21.35l-2.18-6.07H5.41L12 21.35z" fill="#E24329"/><path d="M12 21.35l2.18-6.07h4.41L12 21.35z" fill="#E24329"/></svg>`,
  },
  {
    name: "Linear",
    cat: "Development",
    color: "#5E6AD2",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="#5E6AD2"/><path d="M7 12l3 3 7-7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    name: "Trello",
    cat: "Productivity",
    color: "#0079BF",
    logo: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#0079BF"/><rect x="5" y="5" width="5.5" height="12" rx="1" fill="#fff"/><rect x="13.5" y="5" width="5.5" height="8" rx="1" fill="#fff"/></svg>`,
  },
  {
    name: "ClickUp",
    cat: "Productivity",
    color: "#7B68EE",
    logo: `<svg viewBox="0 0 24 24"><path d="M4 16l8-6 8 6" stroke="#7B68EE" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M4 11l8-6 8 6" stroke="#49CCF9" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
  },
  {
    name: "Pipedrive",
    cat: "CRM & Sales",
    color: "#017737",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#017737"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">P</text></svg>`,
  },
  {
    name: "Zendesk",
    cat: "CRM & Sales",
    color: "#03363D",
    logo: `<svg viewBox="0 0 24 24"><path d="M12 2L2 18h10V2z" fill="#03363D"/><path d="M12 6v16h10L12 6z" fill="#03363D" opacity="0.6"/></svg>`,
  },
  {
    name: "Intercom",
    cat: "Communication",
    color: "#286EFA",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="#286EFA"/><path d="M7 8v5M10 7v7M13 7v7M16 8v5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M7 16c2.5 2 7.5 2 10 0" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
  },
  {
    name: "Discord",
    cat: "Communication",
    color: "#5865F2",
    logo: `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="4" fill="#5865F2"/><circle cx="9" cy="13" r="2" fill="#fff"/><circle cx="15" cy="13" r="2" fill="#fff"/><path d="M8 8s1.5-1 4-1 4 1 4 1" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/></svg>`,
  },
  {
    name: "Figma",
    cat: "Development",
    color: "#F24E1E",
    logo: `<svg viewBox="0 0 24 24"><circle cx="15" cy="12" r="3" fill="#1ABCFE"/><rect x="6" y="3" width="6" height="6" rx="3" fill="#F24E1E"/><rect x="12" y="3" width="6" height="6" rx="3" fill="#FF7262"/><rect x="6" y="9" width="6" height="6" rx="3" fill="#A259FF"/><rect x="6" y="15" width="6" height="6" rx="3" fill="#0ACF83"/></svg>`,
  },
  {
    name: "Dropbox",
    cat: "Storage",
    color: "#0061FF",
    logo: `<svg viewBox="0 0 24 24"><path d="M12 6L7 9.5 12 13 7 16.5 2 13l5-3.5L2 6l5-3.5L12 6z" fill="#0061FF"/><path d="M12 6l5 3.5-5 3.5 5 3.5 5-3.5-5-3.5 5-3.5-5-3.5L12 6z" fill="#0061FF"/><path d="M7 17.5l5-3.5 5 3.5-5 3.5-5-3.5z" fill="#0061FF" opacity="0.7"/></svg>`,
  },
  {
    name: "Google Drive",
    cat: "Storage",
    color: "#0F9D58",
    logo: `<svg viewBox="0 0 24 24"><path d="M8 3h8l8 14H16L8 3z" fill="#FBBC05"/><path d="M1 17l4-7h14l-4 7H1z" fill="#4285F4"/><path d="M8 3L1 17l4-7h7L8 3z" fill="#0F9D58"/></svg>`,
  },
  {
    name: "OneDrive",
    cat: "Storage",
    color: "#0078D4",
    logo: `<svg viewBox="0 0 24 24"><path d="M10 8c2.5-2 6-1.5 7.5 1C20 8 22 10 22 13c0 2.5-2 4.5-4.5 4.5H7C4.2 17.5 2 15.3 2 12.5c0-2 1.2-3.8 3-4.5" fill="#0078D4"/><path d="M7 17.5c-2.8 0-5-2.2-5-5 0-2 1.2-3.8 3-4.5C6.5 5.5 9 4 12 5c1.5-1.5 4-2 6 0" fill="#0091F1" opacity="0.8"/></svg>`,
  },
  {
    name: "Box",
    cat: "Storage",
    color: "#0061D5",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#0061D5"/><path d="M8 9l4 3-4 3M12 12l4-3M12 12l4 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
  },
  {
    name: "Confluence",
    cat: "Productivity",
    color: "#1868DB",
    logo: `<svg viewBox="0 0 24 24"><path d="M4 17s2-3 8-3 8 3 8 3" stroke="#1868DB" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M4 7s2 3 8 3 8-3 8-3" stroke="#1868DB" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.6"/></svg>`,
  },
  {
    name: "Airtable",
    cat: "Productivity",
    color: "#FFBF00",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#FFBF00"/><rect x="3" y="5" width="18" height="5" fill="#FF6F00" rx="1"/><line x1="11" y1="10" x2="11" y2="19" stroke="#fff" stroke-width="0.8"/><line x1="3" y1="14" x2="21" y2="14" stroke="#fff" stroke-width="0.8"/></svg>`,
  },
  {
    name: "Stripe",
    cat: "CRM & Sales",
    color: "#635BFF",
    logo: `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" fill="#635BFF"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">S</text></svg>`,
  },
  {
    name: "QuickBooks",
    cat: "CRM & Sales",
    color: "#2CA01C",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2CA01C"/><path d="M8 8v8l4-4 4 4V8" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  },
  {
    name: "Xero",
    cat: "CRM & Sales",
    color: "#13B5EA",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#13B5EA"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  {
    name: "Calendly",
    cat: "Productivity",
    color: "#006BFF",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#006BFF"/><path d="M12 7v5l3 3" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  },
  {
    name: "Loom",
    cat: "Communication",
    color: "#625DF5",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#625DF5"/><circle cx="12" cy="12" r="4" fill="#fff"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#625DF5" stroke-width="2"/></svg>`,
  },
  {
    name: "Miro",
    cat: "Productivity",
    color: "#FFD02F",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#FFD02F"/><path d="M7 18V6l3.5 6L14 6l3.5 6L14 18" stroke="#050038" stroke-width="1.5" stroke-linejoin="round" fill="none"/></svg>`,
  },
  {
    name: "Webflow",
    cat: "Development",
    color: "#4353FF",
    logo: `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" fill="#4353FF"/><text x="12" y="15" text-anchor="middle" fill="#fff" font-size="8" font-weight="bold">W</text></svg>`,
  },
  {
    name: "Vercel",
    cat: "Development",
    color: "#ffffff",
    logo: `<svg viewBox="0 0 24 24"><path d="M12 4L22 20H2L12 4z" fill="#fff"/></svg>`,
  },
  {
    name: "AWS S3",
    cat: "Storage",
    color: "#FF9900",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#232F3E"/><text x="12" y="14" text-anchor="middle" fill="#FF9900" font-size="6" font-weight="bold">S3</text></svg>`,
  },
  {
    name: "Twilio",
    cat: "Communication",
    color: "#F22F46",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#F22F46"/><circle cx="9" cy="9" r="2" fill="#fff"/><circle cx="15" cy="9" r="2" fill="#fff"/><circle cx="9" cy="15" r="2" fill="#fff"/><circle cx="15" cy="15" r="2" fill="#fff"/></svg>`,
  },
  {
    name: "SendGrid",
    cat: "Communication",
    color: "#1A82E2",
    logo: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="none"/><rect x="2" y="2" width="7" height="7" fill="#1A82E2"/><rect x="9" y="2" width="7" height="7" fill="#1A82E2" opacity="0.5"/><rect x="9" y="9" width="7" height="7" fill="#1A82E2"/><rect x="16" y="9" width="7" height="7" fill="#1A82E2" opacity="0.5"/><rect x="16" y="16" width="7" height="7" fill="#1A82E2"/></svg>`,
  },
  {
    name: "Mailchimp",
    cat: "Communication",
    color: "#FFE01B",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FFE01B"/><text x="12" y="16" text-anchor="middle" fill="#241C15" font-size="10" font-weight="bold">M</text></svg>`,
  },
  {
    name: "Shopify",
    cat: "CRM & Sales",
    color: "#96BF48",
    logo: `<svg viewBox="0 0 24 24"><path d="M15 3l2 1v16l-5 2-8-3V5l5-2 4 1" fill="#96BF48" stroke="#5E8E3E" stroke-width="0.5"/><path d="M12 8v8M10 10l4 2" stroke="#fff" stroke-width="1" stroke-linecap="round"/></svg>`,
  },
  {
    name: "Freshdesk",
    cat: "CRM & Sales",
    color: "#25C16F",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="#25C16F"/><path d="M8 11v3M12 9v5M16 11v3" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  {
    name: "Basecamp",
    cat: "Productivity",
    color: "#1D2D35",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1D2D35"/><path d="M7 14c1-3 3-5 5-5s4 2 5 5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M5 16c2-2 4-3 7-3s5 1 7 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
  },
  {
    name: "Todoist",
    cat: "Productivity",
    color: "#E44332",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#E44332"/><path d="M7 8l10 0M7 12l10 0M7 16l6 0" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><circle cx="5.5" cy="8" r="0.8" fill="#fff"/><circle cx="5.5" cy="12" r="0.8" fill="#fff"/><circle cx="5.5" cy="16" r="0.8" fill="#fff"/></svg>`,
  },
  {
    name: "Evernote",
    cat: "Productivity",
    color: "#00A82D",
    logo: `<svg viewBox="0 0 24 24"><path d="M6 3c0 0 1 1 4 1s5-1 6 0 3 4 3 8-1 9-5 9-4-2-4-4 1-3 3-3" fill="#00A82D" stroke="#00A82D" stroke-width="0.5"/><path d="M10 4v4H6" stroke="#fff" stroke-width="0.8" fill="none"/></svg>`,
  },
  {
    name: "DocuSign",
    cat: "Productivity",
    color: "#FFCD00",
    logo: `<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" fill="#fff" stroke="#FFCD00" stroke-width="2"/><path d="M8 14l2 2 5-5" stroke="#FFCD00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  },
  {
    name: "Typeform",
    cat: "Productivity",
    color: "#262627",
    logo: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#262627"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="12" font-weight="300">T</text></svg>`,
  },
  {
    name: "Zapier",
    cat: "Development",
    color: "#FF4A00",
    logo: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FF4A00"/><path d="M12 6v12M6 12h12M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
];

const IntegrationsSection = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const filtered = integrations.filter((int) => {
    const matchesCat = activeCategory === "All" || int.cat === activeCategory;
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <section id="integrations" className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
      <div className="container max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium tracking-widest uppercase text-primary mb-4 block">
            50+ Integrations
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Connects to <span className="text-gradient">everything</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Deep integrations with the tools your team already uses. Real-time sync, zero configuration.
          </p>
        </motion.div>

        {/* Search and filter */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-4 mb-10"
        >
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-full pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          layout
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
        >
          {filtered.map((int, i) => (
            <motion.div
              key={int.name}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.25, delay: i * 0.02 }}
              className="glass rounded-xl p-4 flex flex-col items-center gap-2.5 hover:shadow-glow transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedIntegration(int)}
              style={{ borderColor: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${int.color}40`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${int.color}15`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div
                className="w-8 h-8 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: int.logo }}
              />
              <span className="text-xs font-medium text-center text-secondary-foreground group-hover:text-foreground transition-colors leading-tight">
                {int.name}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-8">
            No integrations found. Try a different search or category.
          </p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          + dozens more via API and webhook connectors
        </motion.p>
      </div>

      <IntegrationDetailModal
        open={!!selectedIntegration}
        onOpenChange={(open) => !open && setSelectedIntegration(null)}
        integration={selectedIntegration}
      />
    </section>
  );
};

export default IntegrationsSection;
