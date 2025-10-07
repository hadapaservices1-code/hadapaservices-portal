# Supabase Email Confirmation Settings

## To disable email confirmation for development:

1. Go to your Supabase dashboard
2. Navigate to Authentication → Settings
3. Under "User Signups", find "Enable email confirmations"
4. **Turn OFF** "Enable email confirmations"
5. Save the changes

## Alternative: Keep email confirmation enabled

If you want to keep email confirmation enabled (recommended for production):

1. The signup form will now show a message asking users to check their email
2. Users will need to click the confirmation link in their email
3. After confirmation, they can log in normally

## Current Behavior:

- **With email confirmation OFF**: Users are immediately logged in after signup
- **With email confirmation ON**: Users must confirm their email before logging in

## Recommendation:

For development and testing, disable email confirmation. For production, keep it enabled for security.
