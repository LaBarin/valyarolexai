-- Explicit service-role policies for email_send_log (RLS was enabled with no policies)
CREATE POLICY "Service role can read email send log"
ON public.email_send_log FOR SELECT TO public
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert email send log"
ON public.email_send_log FOR INSERT TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update email send log"
ON public.email_send_log FOR UPDATE TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete email send log"
ON public.email_send_log FOR DELETE TO public
USING (auth.role() = 'service_role');

-- Add missing DELETE policy on suppressed_emails so the suppression list can be managed
CREATE POLICY "Service role can delete suppressed emails"
ON public.suppressed_emails FOR DELETE TO public
USING (auth.role() = 'service_role');
