# Deploy Estate Market Place on Render

The root `render.yaml` Blueprint creates one Node web service (serving the React app and API on the same domain) and a PostgreSQL database. Database migrations run before the API starts.

## Launch

1. Open the Render project and create a new Blueprint from `KirimiOnesmus/Estate-Market-Place` on the `main` branch.
2. Select the Blueprint file at the repository root, `render.yaml`, then review the resources before applying.
3. After the web service deploys, create the first Super Admin using Render's Shell for `estate-marketplace`:

   ```sh
   cd server
   BOOTSTRAP_ADMIN_NAME="Your Name" BOOTSTRAP_ADMIN_EMAIL="you@example.com" BOOTSTRAP_ADMIN_PHONE="2547XXXXXXXX" BOOTSTRAP_ADMIN_PASSWORD="a-unique-password-of-at-least-14-characters" npm run db:bootstrap-super-admin
   ```

4. Sign in at the service's `onrender.com` URL. Configure Daraja and email/WhatsApp credentials in Render environment variables if those features are required.

## Free-tier notes

The Blueprint uses free web and Postgres plans and creates no paid resources. Render's free web service can spin down when idle. A new free Postgres database expires 30 days after creation and has no backups; upgrade it before storing data you need to keep. See [Render's free instance limits](https://render.com/docs/free).

## Optional M-Pesa configuration

Keep Daraja credentials in Render's service environment only. `MPESA_*` variables are intentionally not included in the Blueprint; checkout stays unavailable until buyer STK and seller B2C settings and publicly reachable HTTPS callbacks are configured.
