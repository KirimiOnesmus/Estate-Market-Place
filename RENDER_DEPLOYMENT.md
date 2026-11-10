# Netlify frontend + Render API and Postgres

The frontend is deployed to Netlify. The Express API and PostgreSQL database run on Render. Netlify proxies `/api/*` to the Render API, keeping browser requests on the frontend origin so the app's secure session cookies work without cross-site cookies.

## Deploy the API and database on Render

1. Open the Render project and create a Blueprint from `KirimiOnesmus/Estate-Market-Place` on `main`.
2. Use the repository-root `render.yaml` and review the free `estate-marketplace-api` web service and `estate-marketplace-db` Postgres database before applying.
3. Wait for the API deploy to finish. The expected URL is `https://estate-marketplace-api.onrender.com`. If Render assigns a different hostname, update the `to` URL in `netlify.toml` before deploying the frontend.

## Deploy the frontend on Netlify

1. Create a Netlify site from the same GitHub repository and select `main`.
2. Netlify reads the root `netlify.toml`: base directory `client`, build command `npm run build`, publish directory `dist`, API base `/api/v1`, and SPA fallback.
3. The `/api/*` rewrite proxies API requests to the Render service. If you changed the Render hostname, commit that update before deploying.
4. Copy the resulting Netlify site URL (for example, `https://your-site.netlify.app`). In Render, set the API service environment variable `CLIENT_ORIGIN` to that exact URL, then redeploy the API.

## Create the first Super Admin

After the API is live, use the Render Shell for `estate-marketplace-api`. Set the one-time `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PHONE`, and `BOOTSTRAP_ADMIN_PASSWORD` values in the service environment, then run:

```sh
npm run db:bootstrap-super-admin
```

Remove `BOOTSTRAP_ADMIN_PASSWORD` after setup, then sign in at the Netlify site.

## Free-tier notes

The Blueprint creates free resources. Render's free API can spin down when idle. A new free Postgres database expires 30 days after creation and has no backups; upgrade it before relying on it for persistent data. See [Render free-tier limits](https://render.com/docs/free).

Daraja, email, and WhatsApp credentials are not included in the Blueprint. Add any required credentials to the Render API service environment. Keep secrets out of Netlify because the frontend build exposes its environment values to site visitors.
