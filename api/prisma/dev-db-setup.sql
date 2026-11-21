-- Majlis Fund: one-time local database setup (PostgreSQL installed on the machine, no Docker).
--
-- Creates a dedicated login role `majlis` (with CREATEDB, needed for Prisma's shadow database during
-- `prisma migrate dev`) and a database `majlis_fund` owned by it. Safe to run more than once.
--
-- Run as the postgres superuser. The app password is passed on the command line and is never stored
-- in this file:
--
--   psql -U postgres -h localhost -p 5432 -v app_password="<choose-a-password>" -f api/prisma/dev-db-setup.sql
--
-- Then put the same password in api/.env (never commit it):
--   DATABASE_URL="postgresql://majlis:<choose-a-password>@localhost:5432/majlis_fund?schema=public"

\set ON_ERROR_STOP on

\if :{?app_password}
\else
  \echo 'ERROR: pass the password for the majlis role:  -v app_password="..."'
  \quit
\endif

-- Role: create it if missing, then (re)apply login + password so re-runs can reset the password.
SELECT 'CREATE ROLE majlis LOGIN CREATEDB'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'majlis') \gexec

SELECT format('ALTER ROLE majlis WITH LOGIN CREATEDB PASSWORD %L', :'app_password') \gexec

-- Database: UTF-8, owned by the app role.
SELECT 'CREATE DATABASE majlis_fund OWNER majlis ENCODING ''UTF8'' TEMPLATE template0'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'majlis_fund') \gexec

-- The app role owns the public schema so Prisma migrations can create tables.
\connect majlis_fund
ALTER SCHEMA public OWNER TO majlis;

\echo 'Done: role majlis and database majlis_fund are ready.'
