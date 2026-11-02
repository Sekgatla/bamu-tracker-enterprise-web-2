-- Bamu Tracker relational schema (PostgreSQL). Passwords are stored as argon2/bcrypt hashes.
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  role VARCHAR(10) NOT NULL CHECK (role IN ('client','admin')),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  plan VARCHAR(30),
  status VARCHAR(12) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  card_last4 CHAR(4),
  notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  notify_sms BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE devices (
  id BIGSERIAL PRIMARY KEY,
  imei CHAR(15) NOT NULL UNIQUE,
  model VARCHAR(40) NOT NULL,
  sim_iccid VARCHAR(22),
  firmware VARCHAR(12) NOT NULL DEFAULT '2.1.4',
  owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  plate VARCHAR(16),
  vehicle VARCHAR(80),
  status VARCHAR(12) NOT NULL DEFAULT 'inventory' CHECK (status IN ('inventory','idle','moving','offline')),
  immobilised BOOLEAN NOT NULL DEFAULT FALSE,
  battery_pct SMALLINT,
  last_seen TIMESTAMPTZ
);
CREATE TABLE telemetry (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  lat NUMERIC(9,6) NOT NULL, lng NUMERIC(9,6) NOT NULL,
  speed_kmh SMALLINT NOT NULL, heading SMALLINT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE commands (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL CHECK (type IN ('ping','immobilise','restore','reboot')),
  issued_by VARCHAR(120) NOT NULL,
  issuer_role VARCHAR(10) NOT NULL,
  status VARCHAR(14) NOT NULL DEFAULT 'acknowledged' CHECK (status IN ('queued','acknowledged','failed')),
  prev_hash CHAR(8) NOT NULL, hash CHAR(8) NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  owner_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(12) NOT NULL CHECK (type IN ('speed','geofence','tamper','battery','panic')),
  severity VARCHAR(10) NOT NULL, message VARCHAR(255) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE trips (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL, ended_at TIMESTAMPTZ NOT NULL,
  origin VARCHAR(60), destination VARCHAR(60),
  distance_km NUMERIC(7,1) NOT NULL, max_speed SMALLINT, avg_speed SMALLINT
);
CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_no VARCHAR(24) NOT NULL UNIQUE,
  issued_on DATE NOT NULL, amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(8) NOT NULL DEFAULT 'due' CHECK (status IN ('due','paid')),
  paid_on DATE
);
CREATE TABLE tickets (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  device_id BIGINT REFERENCES devices(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('support','recovery','lead')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium',
  status VARCHAR(12) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in-progress','resolved')),
  contact_name VARCHAR(120), contact_email VARCHAR(160),
  subject VARCHAR(160) NOT NULL, body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE ticket_replies (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author VARCHAR(120) NOT NULL, body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_devices_owner ON devices(owner_id);
CREATE INDEX idx_telemetry_dev_time ON telemetry(device_id, recorded_at DESC);
CREATE INDEX idx_alerts_owner_read ON alerts(owner_id, is_read);
CREATE INDEX idx_commands_dev ON commands(device_id, issued_at DESC);
CREATE INDEX idx_trips_dev ON trips(device_id, started_at DESC);
