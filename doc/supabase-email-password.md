Setting up Server-Side Auth for Next.js

Next.js comes in two flavors: the App Router and the Pages Router. You can set up Server-Side Auth with either strategy. You can even use both in the same application.
1
Install Supabase packages

Install the @supabase/supabase-js package and the helper @supabase/ssr package.
npm install @supabase/supabase-js @supabase/ssr
2
Set up environment variables

Create a .env.local file in your project root directory.

Fill in your NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_ANON_KEY:
Project URL

To get your Project URL, log in.
Anon key

To get your Anon key, log in.
.env.local
NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL=<your_supabase_project_url>
NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_NEXT_PUBLIC_SUPABASE_ANON_KEY>
3
Write utility functions to create Supabase clients

To access Supabase from your Next.js app, you need 2 types of Supabase clients:

    Client Component client - To access Supabase from Client Components, which run in the browser.
    Server Component client - To access Supabase from Server Components, Server Actions, and Route Handlers, which run only on the server.

Create a utils/supabase folder with a file for each type of client. Then copy the utility functions for each client type.
utils/supabase/client.ts
utils/supabase/server.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
4
Hook up middleware

Create a middleware.ts file at the root of your project.

Since Server Components can't write cookies, you need middleware to refresh expired Auth tokens and store them.

The middleware is responsible for:

    Refreshing the Auth token (by calling supabase.auth.getUser).
    Passing the refreshed Auth token to Server Components, so they don't attempt to refresh the same token themselves. This is accomplished with request.cookies.set.
    Passing the refreshed Auth token to the browser, so it replaces the old token. This is accomplished with response.cookies.set.

Copy the middleware code for your app.

Add a matcher so the middleware doesn't run on routes that don't access Supabase.

Be careful when protecting pages. The server gets the user session from the cookies, which can be spoofed by anyone.

Always use supabase.auth.getUser() to protect pages and user data.

Never trust supabase.auth.getSession() inside server code such as middleware. It isn't guaranteed to revalidate the Auth token.

It's safe to trust getUser() because it sends a request to the Supabase Auth server every time to revalidate the Auth token.
middleware.ts
utils/supabase/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
5
Create a login page

Create a login page for your app. Use a Server Action to call the Supabase signup function.

Since Supabase is being called from an Action, use the client defined in @/utils/supabase/server.ts.

Note that cookies is called before any calls to Supabase, which opts fetch calls out of Next.js's caching. This is important for authenticated data fetches, to ensure that users get access only to their own data.

See the Next.js docs to learn more about opting out of data caching.
app/login/page.tsx
app/login/actions.ts
app/error/page.tsx
import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  )
}
6
Change the Auth confirmation path

If you have email confirmation turned on (the default), a new user will receive an email confirmation after signing up.

Change the email template to support a server-side authentication flow.

Go to the Auth templates page in your dashboard. In the Confirm signup template, change {{ .ConfirmationURL }} to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email.
7
Create a route handler for Auth confirmation

Create a Route Handler for auth/confirm. When a user clicks their confirmation email link, exchange their secure code for an Auth token.

Since this is a Router Handler, use the Supabase client from @/utils/supabase/server.ts.
app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next)
    }
  }

  // redirect the user to an error page with some instructions
  redirect('/error')
}
8
Access user info from Server Component

Server Components can read cookies, so you can get the Auth status and user info.

Since you're calling Supabase from a Server Component, use the client created in @/utils/supabase/server.ts.

Create a private page that users can only access if they're logged in. The page displays their email.

Be careful when protecting pages. The server gets the user session from the cookies, which can be spoofed by anyone.

Always use supabase.auth.getUser() to protect pages and user data.

Never trust supabase.auth.getSession() inside Server Components. It isn't guaranteed to revalidate the Auth token.

It's safe to trust getUser() because it sends a request to the Supabase Auth server every time to revalidate the Auth token.
app/private/page.tsx
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return <p>Hello {data.user.email}</p>
}
Congratulations#

You're done! To recap, you've successfully:

    Called Supabase from a Server Action.
    Called Supabase from a Server Component.
    Set up a Supabase client utility to call Supabase from a Client Component. You can use this if you need to call Supabase from a Client Component, for example to set up a realtime subscription.
    Set up middleware to automatically refresh the Supabase Auth session.

You can now use any Supabase features from your client or server code!
Edit this page on GitHub

Need some help?
Contact support

Latest product updates?
See Changelog

Something's not right?
Check system status

Auth
Flows (How-tos)

    Password-based

Password-based Auth

Allow users to sign in with a password connected to their email or phone number.

Users often expect to sign in to your site with a password. Supabase Auth helps you implement password-based auth safely, using secure configuration options and best practices for storing and verifying passwords.

Users can associate a password with their identity using their email address or a phone number.
With email#
Enabling email and password-based authentication#

Email authentication is enabled by default.

You can configure whether users need to verify their email to sign in. On hosted Supabase projects, this is true by default. On self-hosted projects or in local development, this is false by default.

Change this setting on the Auth Providers page for hosted projects, or in the configuration file for self-hosted projects.
Signing up with an email and password#

There are two possible flows for email signup: implicit flow and PKCE flow. If you're using SSR, you're using the PKCE flow. If you're using client-only code, the default flow depends upon the client library. The implicit flow is the default in JavaScript and Dart, and the PKCE flow is the default in Swift.

The instructions in this section assume that email confirmations are enabled.

The implicit flow only works for client-only apps. Your site directly receives the access token after the user confirms their email.

To sign up the user, call signUp() with their email address and password.

You can optionally specify a URL to redirect to after the user clicks the confirmation link. This URL must be configured as a Redirect URL, which you can do in the dashboard for hosted projects, or in the configuration file for self-hosted projects.

If you don't specify a redirect URL, the user is automatically redirected to your site URL. This defaults to localhost:3000, but you can also configure this.
async function signUpNewUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'valid.email@supabase.io',
    password: 'example-password',
    options: {
      emailRedirectTo: 'https://example.com/welcome',
    },
  })
}
Signing in with an email and password#

When your user signs in, call signInWithPassword() with their email address and password:
async function signInWithEmail() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'valid.email@supabase.io',
    password: 'example-password',
  })
}
Resetting a password#
Step 1: Create a reset password page#

Create a reset password page. This page should be publicly accessible.

Collect the user's email address and request a password reset email. Specify the redirect URL, which should point to the URL of a change password page. This URL needs to be configured in your redirect URLs.
await supabase.auth.resetPasswordForEmail('valid.email@supabase.io', {
  redirectTo: 'http://example.com/account/update-password',
})
Step 2: Create a change password page#

Create a change password page at the URL you specified in the previous step. This page should be accessible only to authenticated users.

Collect the user's new password and call updateUser to update their password.
await supabase.auth.updateUser({ password: new_password })
Email sending#

The signup confirmation and password reset flows require an SMTP server to send emails.

The Supabase platform comes with a default email-sending service for you to try out. The service has a rate limit of 2 emails per hour, and availability is on a best-effort basis. For production use, you should consider configuring a custom SMTP server.

Consider configuring a custom SMTP server for production.

See the Custom SMTP guide for instructions.
Local development with Inbucket#

You can test email flows on your local machine. The Supabase CLI automatically captures emails sent locally by using Inbucket.

In your terminal, run supabase status to get the Inbucket URL. Go to this URL in your browser, and follow the instructions to find your emails.
With phone#

You can use a user's mobile phone number as an identifier, instead of an email address, when they sign up with a password.

This practice is usually discouraged because phone networks recycle mobile phone numbers. Anyone receiving a recycled phone number gets access to the original user's account. To mitigate this risk, implement MFA.

Protect users who use a phone number as a password-based auth identifier by enabling MFA.
Enabling phone and password-based authentication#

Enable phone authentication on the Auth Providers page for hosted Supabase projects.

For self-hosted projects or local development, use the configuration file. See the configuration variables namespaced under auth.sms.

If you want users to confirm their phone number on signup, you need to set up an SMS provider. Each provider has its own configuration. Supported providers include MessageBird, Twilio, Vonage, and TextLocal (community-supported).
Configuring SMS Providers
Signing up with a phone number and password#

To sign up the user, call signUp() with their phone number and password:
const { data, error } = await supabase.auth.signUp({
  phone: '+13334445555',
  password: 'some-password',
})

If you have phone verification turned on, the user receives an SMS with a 6-digit pin that you must verify within 60 seconds:

You should present a form to the user so they can input the 6 digit pin, then send it along with the phone number to verifyOtp:
const {
  data: { session },
  error,
} = await supabase.auth.verifyOtp({
  phone: '+13334445555',
  token: '123456',
  type: 'sms',
})
Signing in a with a phone number and password#

Call the function to sign in with the user's phone number and password:
const { user, error } = await supabase.auth.signInWithPassword({
  phone: '+13334445555',
  password: 'some-password',
})
Edit this page on GitHub
Is this helpful?
On this page
With email
Enabling email and password-based authentication
Signing up with an email and password
Signing in with an email and password
Resetting a password
Email sending
With phone
Enabling phone and password-based authentication
Signing up with a phone number and password
Signing in a with a phone number and password

Need some help?
Contact support

Latest product updates?
See Changelog

Something's not right?
Check system status