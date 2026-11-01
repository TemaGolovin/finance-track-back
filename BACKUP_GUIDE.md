# Резервное копирование PostgreSQL (Docker)

Скрипты в каталоге `scripts/` делают дамп из контейнера через `pg_dump` и восстановление через `psql`. Дампы сохраняются в `backups/*.sql.gz` (каталог в `.gitignore`).

## Переменные в `.env`

Должны совпадать с `docker-compose.yml` и учётными данными БД в контейнере:

| Переменная | Описание |
|------------|----------|
| `POSTGRES_USER` | Пользователь PostgreSQL |
| `POSTGRES_PASSWORD` | Пароль |
| `POSTGRES_DB` | Имя базы |
| `POSTGRES_CONTAINER_NAME` | Имя Docker-контейнера с PostgreSQL (в compose по умолчанию `finance-track-postgres`). Если не задана, скрипты подставляют это значение. |

Рекомендуется на сервере ограничить доступ к `.env`: `chmod 600 .env`.

## Ручной запуск

Из корня репозитория `finance-track-back`:

```bash
./scripts/backup-db.sh
./scripts/restore-db.sh backups/backup_2026-04-01_120000.sql.gz
```

Контейнер PostgreSQL должен быть запущен. Скрипты бэкапа автоматически удаляют файлы в `backups/` старше **7 дней**.

После `backup-db.sh` файл проверяется (`gzip -t`, минимальный размер). Неудачный дамп удаляется, скрипт завершается с ненулевым кодом.

## Проверка restore (локально или на стенде)

Не перезаписывает рабочую БД: создаётся временная база, в неё восстанавливается дамп, проверяется `_prisma_migrations`, затем база удаляется.

```bash
./scripts/verify-backup-restore.sh
# или для конкретного файла:
./scripts/verify-backup-restore.sh backups/backup_2026-04-01_120000.sql.gz
```

Перед первым продом имеет смысл один раз прогнать эту команду на копии данных.

## Контроль «свежести» дампа

Для cron или отдельного systemd timer (после nightly backup):

```bash
./scripts/check-backup-freshness.sh
```

По умолчанию ошибка, если последний `.sql.gz` старше **26** часов (`BACKUP_MAX_AGE_HOURS`). Пример цепочки в crontab:

```cron
0 3 * * * cd /ABS/PATH/TO/finance-track-back && ./scripts/backup-db.sh >> /var/log/finance-track-backup.log 2>&1
15 3 * * * cd /ABS/PATH/TO/finance-track-back && ./scripts/check-backup-freshness.sh >> /var/log/finance-track-backup.log 2>&1
```

Подставьте абсолютный путь к каталогу репозитория. К моменту backup контейнер с БД должен быть поднят (`restart: unless-stopped` в compose).

## Восстановление в непустую базу

Дамп — обычный SQL (`pg_dump` без custom format). Восстановление в **уже заполненную** БД часто даёт ошибки дублирования объектов. Варианты:

- восстановить в **новую** пустую базу или на чистый volume;
- либо осознанно очистить данные (например, пересоздать volume / базу) перед `restore-db.sh`.

Скрипт восстановления не выполняет разрушительных команд (`DROP DATABASE` и т.п.).

## Требования

- установлены `docker` (CLI), `gzip`/`gunzip`, `bash`;
- образ PostgreSQL в контейнере совместим с клиентскими утилитами версии сервера (в проекте используется PostgreSQL 17).
