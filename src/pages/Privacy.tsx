import { Link } from "react-router-dom";

const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground py-16 px-6">
    <div className="max-w-3xl mx-auto prose prose-invert">
      <Link to="/" className="text-primary text-sm">← Back to home</Link>
      <h1 className="text-4xl font-bold mt-6 mb-2">Privacy Notice</h1>
      <p className="text-muted-foreground text-sm">Last updated: April 2026</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Who we are</h2>
      <p>Valyarolex.AI is operated by XYZ Diverse Services, 12436 F.M. 1960 Rd W., Ste. 1669, Houston, TX 77065,
        USA. Contact: XyzDiverseServices@Gmail.Com.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">What we collect</h2>
      <ul>
        <li><b>Account data</b>: email, display name, password hash.</li>
        <li><b>Content</b>: tasks, calendar events, messages, campaigns, decks, videos, and other data you create.</li>
        <li><b>Connected integrations</b>: OAuth tokens you authorize for third-party services.</li>
        <li><b>Usage</b>: IP address, browser, pages visited, feature usage (for security and product improvement).</li>
        <li><b>Payment data</b>: handled directly by Paddle.com Market Ltd, our Merchant of Record. We never see
          full card numbers — we only receive transaction IDs and subscription status.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">How we use it</h2>
      <p>To provide and improve the service, process payments, send transactional email, prevent abuse, and
        comply with legal obligations.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Subprocessors</h2>
      <ul>
        <li>Supabase — database, authentication, storage.</li>
        <li>Paddle — payment processing, tax & invoicing.</li>
        <li>Lovable AI Gateway — AI model inference.</li>
        <li>Resend / similar — transactional email delivery.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">Your rights</h2>
      <p>You can access, correct, export or delete your data at any time. Email
        XyzDiverseServices@Gmail.Com and we'll respond within 30 days. Residents of the EEA, UK, California,
        and other regions with similar laws have additional rights including the right to object to processing
        and to lodge a complaint with a supervisory authority.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Data retention</h2>
      <p>We keep account data for as long as your account is active. After deletion, content is permanently
        removed within 30 days. Backups are purged within 90 days. Payment records are retained per legal
        requirements (typically 7 years).</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Cookies</h2>
      <p>We use essential cookies for authentication and session management. We do not use third-party advertising
        cookies.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Children</h2>
      <p>The service is not intended for children under 18.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>XyzDiverseServices@Gmail.Com · +1 (888) 839-3469</p>
    </div>
  </div>
);
export default Privacy;
