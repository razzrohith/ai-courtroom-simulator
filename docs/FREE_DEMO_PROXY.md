# OpenRouter Free Demo Proxy Setup Guide

This guide describes how to deploy and configure the secure backend proxy gateway for the **JudgeBench OpenRouter Free Demo** mode. 

The proxy acts as a secure intermediary between the client browser and OpenRouter, keeping the shared API key safe from client-side visibility.

---

## 1. Deploying the Cloudflare Worker

The proxy is implemented as a lightweight **Cloudflare Worker** under the [worker/](file:///e:/Learning/courtroom/worker/) directory.

### Option A: Deploy via CLI (Wrangler)
1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
2. Log into your Cloudflare account:
   ```bash
   npx wrangler login
   ```
3. Navigate to the `worker/` directory and deploy:
   ```bash
   npx wrangler deploy
   ```
4. Copy the generated deployment URL (e.g., `https://judgebench-openrouter-proxy.yourname.workers.dev`).

### Option B: Deploy via Cloudflare Dashboard
1. Log into the Cloudflare Dashboard and go to **Workers & Pages**.
2. Click **Create Application** -> **Create Worker**.
3. Name your worker (e.g., `judgebench-openrouter-proxy`) and click **Deploy**.
4. Click **Edit Code**, delete the template, copy the code from [worker/index.js](file:///e:/Learning/courtroom/worker/index.js), paste it in, and click **Save and Deploy**.

---

## 2. Configuring Secrets (API Key)

⚠️ **CRITICAL SECURITY RULE:** Do NOT commit your API key to code, git repository variables, or the `wrangler.toml` file.

Configure your shared OpenRouter key strictly as a Cloudflare Worker secret:

### Via Wrangler CLI:
```bash
npx wrangler secret put OPENROUTER_API_KEY
```
When prompted, paste your real OpenRouter API key.

### Via Cloudflare Dashboard:
1. Navigate to your Worker dashboard.
2. Go to **Settings** -> **Variables**.
3. Under **Environment Variables**, click **Add Variable**.
4. Set the name to `OPENROUTER_API_KEY`, enter the key, select **Encrypt** (Secret), and click **Save**.

---

## 3. Configuring Allowed Origins (CORS)

By default, the proxy restricts incoming requests to allowed origins defined in the `ALLOWED_ORIGINS` array inside [worker/index.js](file:///e:/Learning/courtroom/worker/index.js):
- `http://localhost:5173` (local Vite development)
- `http://localhost:3000` (generic local testing)
- `https://razzrohith.github.io` (production GitHub Pages origin)

If you deploy your production application to a custom domain, add it to `ALLOWED_ORIGINS` in [worker/index.js](file:///e:/Learning/courtroom/worker/index.js) and redeploy.

---

## 4. Frontend Environment Wiring

Once your proxy worker is deployed, make the URL known to the Vite build process.

### Local Development
Create a `.env.local` file in the project root:
```env
VITE_OPENROUTER_FREE_PROXY_URL=https://judgebench-openrouter-proxy.yourname.workers.dev
```

### GitHub Pages / GitHub Actions
If deploying via GitHub Actions workflow, configure `VITE_OPENROUTER_FREE_PROXY_URL` as a Repository Secret:
1. Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Under **Repository secrets**, click **New repository secret**.
3. Set the Name to `VITE_OPENROUTER_FREE_PROXY_URL` and the Value to your deployed Cloudflare Worker URL.
4. If your workflow uses Vite build steps, pass it in your action yaml, e.g.:
   ```yaml
   env:
     VITE_OPENROUTER_FREE_PROXY_URL: ${{ secrets.VITE_OPENROUTER_FREE_PROXY_URL }}
   ```
