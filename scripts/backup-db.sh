#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
BACKUPS_DIR="${REPO_ROOT}/backups"

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

mkdir -p "$BACKUPS_DIR"

stamp="$(date +%Y-%m-%d_%H%M%S)"
outfile="${BACKUPS_DIR}/backup_${stamp}.sql.gz"

echo "Backing up ${POSTGRES_DB} from container ${POSTGRES_CONTAINER_NAME} -> ${outfile}"

docker exec "$POSTGRES_CONTAINER_NAME" \
  env PGPASSWORD="$POSTGRES_PASSWORD" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner |
  gzip >"$outfile"

find "$BACKUPS_DIR" -type f -name '*.sql.gz' -mtime +7 -delete

echo "Done. Files older than 7 days under backups/ removed."
