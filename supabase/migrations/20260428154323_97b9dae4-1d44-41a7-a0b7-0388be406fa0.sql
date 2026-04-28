-- Harden Realtime channel authorization: restrict subscriptions/broadcasts so users
-- can only join channels whose topic matches their own auth.uid().
-- This closes the gap where any authenticated user could subscribe to other users' topics.

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior version of this policy to keep migration idempotent
DROP POLICY IF EXISTS "Users can only access their own realtime topic" ON realtime.messages;

-- Allow authenticated users to receive/send realtime messages only on a topic
-- equal to their own user id (e.g. channel name = auth.uid()::text)
CREATE POLICY "Users can only access their own realtime topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = (select auth.uid())::text
);

CREATE POLICY "Users can only broadcast to their own realtime topic"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = (select auth.uid())::text
);
