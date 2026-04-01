#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <path-to-backup.sql.gz>" >&2
  exit 1
}

[[ ${1:-} ]] || usage

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
BACKUP_FILE="$1"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: .env not found at ${ENV_FILE}" >&2
  exit 1
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

echo "Restoring ${BACKUP_FILE} into ${POSTGRES_DB} (container ${POSTGRES_CONTAINER_NAME})"
gunzip -c "$BACKUP_FILE" |
  docker exec -i "$POSTGRES_CONTAINER_NAME" \
    env PGPASSWORD="$POSTGRES_PASSWORD" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

echo "Restore finished."
