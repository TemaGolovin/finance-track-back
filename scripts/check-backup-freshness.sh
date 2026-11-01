#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUPS_DIR="${REPO_ROOT}/backups"
MAX_AGE_HOURS="${BACKUP_MAX_AGE_HOURS:-26}"

if [[ ! -d "$BACKUPS_DIR" ]]; then
  echo "error: backups directory not found: ${BACKUPS_DIR}" >&2
  exit 1
fi

mapfile -t backups < <(find "$BACKUPS_DIR" -type f -name '*.sql.gz' -printf '%T@ %p\n' 2>/dev/null | sort -n | cut -d' ' -f2-)

if [[ ${#backups[@]} -eq 0 ]]; then
  echo "error: no backup files in ${BACKUPS_DIR}" >&2
  exit 1
fi

latest="${backups[-1]}"
mtime="$(stat -c %Y "$latest")"
now="$(date +%s)"
age_hours=$(( (now - mtime) / 3600 ))

if (( age_hours > MAX_AGE_HOURS )); then
  echo "error: latest backup is ${age_hours}h old (max ${MAX_AGE_HOURS}h): ${latest}" >&2
  exit 1
fi

if ! gzip -t "$latest"; then
  echo "error: latest backup failed gzip integrity check: ${latest}" >&2
  exit 1
fi

echo "OK: ${latest} (${age_hours}h old)"
