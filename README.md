# DT-version-1

run this in backend folder for seeding hydroponic

npx ts-node src/seed-hydroponic.ts

npx ts-node src/seed-hydroponic-history.ts


# Grafana Setup

## Prerequisites

- PostgreSQL installed and running
- Docker Desktop installed and running
- Database restored (DT-MAIN)
- Backend, frontend, and Python simulator available

---

## Start Grafana

From the project root, run:

```bash
docker compose -f docker-compose.grafana.yml up -d
```

Grafana will be available at:

http://localhost:3005

Default credentials:

Username: admin

Password: admin

---

## Automatic Provisioning

On startup, Grafana automatically:

- Creates the PostgreSQL datasource
- Imports all dashboards from `grafana/dashboards`

No manual dashboard import is required.

---

## PostgreSQL Configuration

If PostgreSQL credentials are different on your system, update:

```

grafana/provisioning/datasources/postgres.yaml

```

Example:

```yaml
user: postgres

secureJsonData:
password: YOUR_POSTGRES_PASSWORD

database: DT-MAIN
```

---

## Start the Complete Project

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Python Sensor Simulator

```bash
cd python-generator
python main.py
```

---

## Common Issues

### Grafana dashboard shows "No Data"

- Verify PostgreSQL is running.
- Verify the Python simulator is running.
- Verify the database contains sensor readings.

---

### Datasource connection failed

Check:

- PostgreSQL username
- PostgreSQL password
- Database name
- Port (default: 5432)

Update:

```

grafana/provisioning/datasources/postgres.yaml

```

if necessary.

---

### Restart Grafana

```bash
docker compose -f docker-compose.grafana.yml restart
```

---

### View Grafana Logs

```bash
docker compose -f docker-compose.grafana.yml logs -f grafana
```

---

### Stop Grafana

```bash
docker compose -f docker-compose.grafana.yml down

