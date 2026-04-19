import { Link } from "react-router-dom";

const Refund = () => (
  <div className="min-h-screen bg-background text-foreground py-16 px-6">
    <div className="max-w-3xl mx-auto prose prose-invert">
      <Link to="/" className="text-primary text-sm">← Back to home</Link>
      <h1 className="text-4xl font-bold mt-6 mb-2">Refund Policy</h1>
      <p className="text-muted-foreground text-sm">Last updated: April 2026</p>

      <p>Payments for Valyarolex.AI are processed by Paddle.com Market Ltd, our Merchant of Record.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Subscriptions</h2>
      <p>You can cancel your subscription at any time from the in-app billing portal. Cancellation takes effect
        immediately and access to paid features ends right away. We do not provide pro-rated refunds for partial
        billing periods.</p>
      <p>If you were charged unexpectedly (e.g. you forgot to cancel a trial), email us at
        XyzDiverseServices@Gmail.Com within 14 days of the charge and we will review your request in good faith.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Credit packs</h2>
      <p>Credit packs are one-time purchases of digital goods that are delivered immediately. They are
        generally non-refundable once credits have been used. If you have not used any of the credits from a
        recent purchase, contact us within 14 days and we will refund the unused balance.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">How to request a refund</h2>
      <p>Email <a href="mailto:XyzDiverseServices@Gmail.Com" className="underline">XyzDiverseServices@Gmail.Com</a>{" "}
        with your account email and the transaction ID. Refunds are returned to the original payment method
        within 5–10 business days of approval.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Chargebacks</h2>
      <p>Please contact us before filing a chargeback — we'll always try to resolve issues directly first.</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>XYZ Diverse Services · 12436 F.M. 1960 Rd W., Ste. 1669, Houston, TX 77065 · +1 (888) 839-3469</p>
    </div>
  </div>
);
export default Refund;
