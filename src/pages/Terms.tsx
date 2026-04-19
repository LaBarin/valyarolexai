import { Link } from "react-router-dom";

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground py-16 px-6">
    <div className="max-w-3xl mx-auto prose prose-invert">
      <Link to="/" className="text-primary text-sm">← Back to home</Link>
      <h1 className="text-4xl font-bold mt-6 mb-2">Terms of Service</h1>
      <p className="text-muted-foreground text-sm">Last updated: April 2026</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. About</h2>
      <p>Valyarolex.AI ("we", "our", "us") is operated by XYZ Diverse Services, located at
        12436 F.M. 1960 Rd W., Ste. 1669, Houston, TX 77065, United States. Contact: XyzDiverseServices@Gmail.Com,
        +1 (888) 839-3469.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">2. The service</h2>
      <p>Valyarolex.AI provides an AI-powered productivity workspace including unified inbox, scheduling,
        task automation, AI agents, pitch deck builder, video studio and campaign manager. Service availability
        and individual features may change without notice.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">3. Accounts</h2>
      <p>You are responsible for safeguarding your account credentials and for all activity that occurs under
        your account. You must be at least 18 years old to use the service.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">4. Subscriptions, credits & billing</h2>
      <p>Paid plans are billed in advance on a recurring basis (monthly) by our payment processor, Paddle.com Market Ltd
        (the "Merchant of Record"). Credit packs are one-time purchases. All prices are listed in USD and exclude
        applicable taxes, which are calculated and collected by Paddle. By purchasing, you authorize Paddle to charge
        your payment method on the schedule shown at checkout.</p>
      <p>You can cancel a subscription at any time from the billing portal. Cancellation takes effect immediately and
        ends access to paid features. Purchased credits do not expire.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">5. Acceptable use</h2>
      <p>You may not use the service to generate or distribute illegal content, infringe intellectual property rights,
        send spam, attempt to reverse engineer the platform, or interfere with other users.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">6. Content ownership</h2>
      <p>You retain ownership of content you create with the service. We retain ownership of the platform,
        AI models, and underlying technology. You grant us a limited license to process your content solely
        to provide the service.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">7. Disclaimer & liability</h2>
      <p>The service is provided "as is" without warranties of any kind. To the maximum extent permitted by law,
        our liability is limited to the amount you paid us in the 12 months preceding the claim.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">8. Termination</h2>
      <p>We may suspend or terminate accounts that violate these terms. You may delete your account at any time
        by contacting us.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">9. Changes</h2>
      <p>We may update these terms; material changes will be communicated by email or in-app notice.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">10. Governing law</h2>
      <p>These terms are governed by the laws of the State of Texas, USA.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">11. Contact</h2>
      <p>Questions: XyzDiverseServices@Gmail.Com</p>
    </div>
  </div>
);
export default Terms;
