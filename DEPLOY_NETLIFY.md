# Deploy to Netlify

This guide will help you deploy your New Homes Lead Finder app to Netlify.

## Prerequisites

1. A Netlify account (sign up at https://netlify.com)
2. Your Supabase database already set up
3. GitHub repository with your code

## Step 1: Install Dependencies

```bash
npm install
```

This will install `@fastify/aws-lambda` which allows the backend to run as a Netlify Function.

## Step 2: Configure Environment Variables in Netlify

After connecting your repository to Netlify, go to **Site settings → Environment variables** and add:

### Required Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
ADMIN_TOKEN_NEW=your-secure-admin-token-here
```

### For Crawling (Optional)

```
FIRECRAWL_API_KEY=fc_live_...
NOMINATIM_UA=CustomPoolPros/1.0 (contact@custompoolpros.com)
```

## Step 3: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Easiest)

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Netlify will auto-detect the settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `web/dist`
   - **Functions directory**: `netlify/functions`
5. Click **"Deploy site"**

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

## Step 4: Get Your Production URL

After deployment completes, Netlify will give you a URL like:
- `https://your-app-name.netlify.app`

Or you can use a custom domain.

## Step 5: Update GitHub Actions

Now that you have your production URL, update your GitHub Actions secrets:

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Add/update this secret:
   - `APP_BASE_URL` = `https://your-app-name.netlify.app`

## How It Works

- **Frontend**: React app served from `web/dist`
- **Backend**: Fastify API runs as a Netlify Function at `/.netlify/functions/api`
- **API Routes**: All `/api/*` requests are redirected to the serverless function
- **Database**: Connects to your Supabase PostgreSQL database

## Test Your Deployment

After deployment, test these endpoints:

1. **Frontend**: https://your-app-name.netlify.app
2. **Health Check**: https://your-app-name.netlify.app/api/health
3. **Leads API**: https://your-app-name.netlify.app/api/leads

## Troubleshooting

### Build Fails

Check the Netlify deploy logs. Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues

### API Not Working

- Verify environment variables are set in Netlify
- Check Function logs in Netlify dashboard
- Verify DATABASE_URL is correct (use connection pooler URL for serverless)

### CORS Issues

The app is configured with `origin: true` to accept all origins. If you need to restrict:

Edit `server/src/index.ts` and change the CORS config.

## Database Connection for Serverless

IMPORTANT: Use Supabase's connection pooler URL for serverless functions:

```
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

NOT the direct connection (port 5432).

## Next Steps

1. Set up a custom domain (optional)
2. Configure GitHub Actions with your production URL
3. Test the crawl workflow
4. Monitor function logs in Netlify dashboard

## Support

- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: [your-repo]/issues
