# Monitoring (Prometheus + Grafana + Alertmanager)

## Prerequisites

- Docker Desktop
- Backend running on host: `http://localhost:3000` (or adjust scrape target)

## Start

```bash
docker compose -f ops/monitoring/docker-compose.yml up -d
```

## URLs

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001` (default user/pass: `admin` / `admin`)
- Alertmanager: `http://localhost:9093`

## Configure backend scrape target

By default Prometheus scrapes the backend on macOS via `host.docker.internal:3000`.

If your backend runs elsewhere, edit `ops/monitoring/prometheus/prometheus.yml`.
