#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [path-to-backup.sql.gz]" >&2
  echo "  Without args: runs backup-db.sh and verifies the newest dump." >&2
  exit 1
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
BACKUP_FILE="${1:-}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: .env not found at ${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

POSTGRES_CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-finance-track-postgres}"

for var in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB; do
  if [[ -z "${!var:-}" ]]; then
    echo "error: ${var} is not set in .env" >&2
    exit 1
  fi
done

if ! docker inspect "$POSTGRES_CONTAINER_NAME" &>/dev/null; then
  echo "error: Docker container not found: ${POSTGRES_CONTAINER_NAME}" >&2
  exit 1
fi

if [[ -z "$BACKUP_FILE" ]]; then
  "${REPO_ROOT}/scripts/backup-db.sh"
  mapfile -t backups < <(find "${REPO_ROOT}/backups" -type f -name '*.sql.gz' -printf '%T@ %p\n' | sort -n | cut -d' ' -f2-)
  if [[ ${#backups[@]} -eq 0 ]]; then
    echo "error: backup-db.sh did not produce a file under backups/" >&2
    exit 1
  fi
  BACKUP_FILE="${backups[-1]}"
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "error: backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

case "$BACKUP_FILE" in
*.sql.gz) ;;
*)
  echo "error: expected a .sql.gz file, got: ${BACKUP_FILE}" >&2
  exit 1
  ;;
esac

if ! gzip -t "$BACKUP_FILE"; then
  echo "error: backup failed gzip integrity check: ${BACKUP_FILE}" >&2
  exit 1
fi

VERIFY_DB="restore_verify_$(date +%s)"

cleanup() {
  docker exec "$POSTGRES_CONTAINER_NAME" \
    env PGPASSWORD="$POSTGRES_PASSWORD" \
    psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"${VERIFY_DB}\" WITH (FORCE);" \
    >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Creating temporary database ${VERIFY_DB}"
docker exec "$POSTGRES_CONTAINER_NAME" \
  env PGPASSWORD="$POSTGRES_PASSWORD" \
  psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"${VERIFY_DB}\";"

echo "Restoring ${BACKUP_FILE} into ${VERIFY_DB}"
gunzip -c "$BACKUP_FILE" |
  docker exec -i "$POSTGRES_CONTAINER_NAME" \
    env PGPASSWORD="$POSTGRES_PASSWORD" \
    psql -U "$POSTGRES_USER" -d "$VERIFY_DB" -v ON_ERROR_STOP=1

migration_count="$(
  docker exec "$POSTGRES_CONTAINER_NAME" \
    env PGPASSWORD="$POSTGRES_PASSWORD" \
    psql -U "$POSTGRES_USER" -d "$VERIFY_DB" -t -A -v ON_ERROR_STOP=1 \
    -c 'SELECT COUNT(*) FROM "_prisma_migrations";'
)"

if [[ -z "$migration_count" || "$migration_count" -lt 1 ]]; then
  echo "error: _prisma_migrations is empty after restore" >&2
  exit 1
fi

echo "OK: restore verified (${migration_count} migration rows). Source: ${BACKUP_FILE}"
