# Launching Your SaaS to Production 🚀

You are ready to deploy your enterprise-grade CRM to the world. Follow these exact steps to take the platform live.

## Step 1: Provision a Production Database
Your local Docker database won't work in production. You need a Managed Postgres instance.
1. Go to **[Supabase](https://supabase.com)** or **[Neon](https://neon.tech)** and create a new project.
2. Copy the production `DATABASE_URL`.
   * *Important:* Ensure connection pooling is enabled! For Supabase, your URL should look like:
     `postgres://[user]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`

## Step 2: Deploy to Vercel
Vercel is the optimal hosting environment for Next.js applications, offering edge networks and serverless functions out of the box.

Run the following command in your terminal:
```bash
npx vercel
```
1. Follow the interactive prompts to link your local directory to a Vercel project.
2. When asked, **Do not override the build command**.
3. During setup, you will be prompted to add **Environment Variables**. Provide the following:
   * `DATABASE_URL`: Your Supabase/Neon connection string.
   * `JWT_SECRET`: A long, secure random string (e.g., `openssl rand -base64 32`).
   * *(Optional)* `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: For API rate limiting.
   * *(Optional)* `NEXT_PUBLIC_SENTRY_DSN`: For Sentry error tracking.

## Step 3: Run Production Database Migrations
Once deployed, Vercel needs the database schema pushed to your production database. 

Run this command locally:
```bash
npx prisma migrate deploy
```
*(Make sure your local `.env` briefly has the production `DATABASE_URL` during this command, or specify it inline).*

## Step 4: Configure Your Domain
1. In your Vercel Dashboard, go to your project's **Settings > Domains**.
2. Add your custom SaaS domain (e.g., `crm.yourcompany.com`).
3. Follow the DNS instructions provided by Vercel to update your domain registrar (Namecheap, GoDaddy, Route53) with the required A or CNAME records.

## Post-Launch Verifications
- [ ] **Create the First Super Admin:** Register your first account on the live site. Connect directly to your production database and manually set your `isSuperAdmin` flag to `true` to gain platform-wide controls.
- [ ] **Test Routing:** Ensure logging in redirects you properly to the App Shell.
- [ ] **Test Rate Limiter:** Spam refresh the page. You should hit a `429 Too Many Requests` block after 50 hits in 10 seconds.
