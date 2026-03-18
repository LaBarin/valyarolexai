

## Plan: Add Email Account Management Tab to Integrations

### What
Add a sub-tab system to the Integrations page with two tabs: "Integrations" (existing grid) and "Email Accounts". The Email Accounts tab will show the currently linked email (from auth) and allow users to update their email address.

### How

**Modify `src/components/workspace/IntegrationHub.tsx`:**

1. Wrap existing content in a `Tabs` component with two tabs: "Integrations" and "Email Accounts"
2. Move current integration grid into the "Integrations" tab
3. Create "Email Accounts" tab content:
   - Display the user's current auth email (`user.email` from `useAuth`)
   - Show a card with the linked email, verified status badge
   - Add a form to update email address using `supabase.auth.updateUser({ email: newEmail })`
   - Show toast confirmation that a verification link was sent to the new email
   - Include a section explaining that the email change requires confirmation via both old and new email addresses

### UI Structure

```text
┌─────────────────────────────────────────┐
│  [Integrations]  [Email Accounts]       │  ← Tabs
├─────────────────────────────────────────┤
│  Current Email                          │
│  ┌─────────────────────────────────┐    │
│  │ 📧 user@example.com   ✓ Linked │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Change Email                           │
│  ┌─────────────────────────────────┐    │
│  │ [New email input]  [Update]     │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Files to modify
- `src/components/workspace/IntegrationHub.tsx` — add Tabs wrapper, email management UI

### No database changes needed
The email is managed through the authentication system (`supabase.auth.updateUser`), so no new tables or migrations are required.

