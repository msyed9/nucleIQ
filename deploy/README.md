# deploy/ — VPS deploy helpers

Files:
- `deploy_vps.sh` — Bash deploy script for Ubuntu/Debian. Pulls latest, prepares a virtualenv, installs Python deps, builds frontend (if `npm` available), runs migrations, collects static files, fixes permissions, restarts systemd service and reloads nginx.
- `deploy_vps.ps1` — PowerShell variant (for PowerShell Core on Linux or Windows environments that provide bash/npm).

Quick usage (on VPS as `deploy` user):

```bash
# place your repo at /home/deploy/apps/nucleIQ/repo (or edit APP_DIR at top of script)
cd /home/deploy/apps/nucleIQ
./deploy/deploy_vps.sh
```

Notes:
- The scripts expect a systemd service named `nucleiq-gunicorn` by default — edit `SERVICE_NAME` if different.
- For best results build frontend in CI and use the scripts to only deploy static artifacts.
- Create `/home/deploy/apps/nucleIQ/shared/.env` with production environment variables (DB credentials, SECRET_KEY, ALLOWED_HOSTS, etc.).
- Ensure `deploy` can run `sudo systemctl restart` and `sudo systemctl reload nginx` (consider a sudoers entry for passwordless restart of these commands).

If you want, I can also add example `systemd` and `nginx` unit/site files into this folder and a GitHub Actions workflow that runs these scripts remotely via SSH.
