# DT-version-1

env file template:
DATABASE_URL="postgresql://postgres:pass@localhost:5432/DB-name?schema=public"
PORT=3001
JWT_SECRET="super-secret-dt-key-2026"
ADMIN_USERNAME="admin@CSRL"
ADMIN_PASSWORD="CSRLdt@0608"

run this in backend folder for seeding hydroponics:

npx ts-node src/hydro-seed.ts

npx ts-node src/hydro-seed-history.ts


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

### Shortcut (Run everything via root package.json)
```bash
# For Water Distribution (Star Topology ID = 1)
npm run dev

# For Hydroponics Topology (Topology ID = 2)
npm run dev:hydro
```

### Manual Individual Commands

#### 1. Backend
```bash
cd backend
npm install
npm run dev
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

#### 3. Python Sensor Simulator (Water Distribution / Star Topology)
```bash
cd python-generator
python main.py
```

#### 4. Python Sensor Simulator (Hydroponics Topology)
```bash
cd hydro-generator
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
```

---

## Nginx Reverse Proxy & CSRL Website Embedding

### 1. Server Nginx Configuration (`/etc/nginx/sites-available/csrl`)

Add the following location blocks to the HTTPS (Port 443) server block:

```nginx
    # Digital Twin Frontend (Port 5173)
    location /digital-twin-app/ {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Digital Twin Backend REST API (Port 3001)
    location /digital-twin-api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Digital Twin Real-Time WebSockets / Socket.IO (Port 3001)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
```

Reload Nginx after editing:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 2. Embed in CSRL Website (`DigitalTwin.js`)

In your main CSRL frontend component (`DigitalTwin.js`), embed the application via an iframe:

```jsx
<iframe 
  src="https://csrl.nitk.ac.in/digital-twin-app/" 
  width="100%" 
  height="900px" 
  style={{ border: 'none', borderRadius: '8px' }} 
  title="Digital Twin Engine"
/>
```

