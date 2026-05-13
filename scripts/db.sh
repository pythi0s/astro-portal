#!/usr/bin/env bash
set -e

CMD=$1
MSG=$2

COMPOSE="docker compose"
DB_SERVICE="db"
BACKEND_SERVICE="backend"
DB_USER="crm_user"
DB_NAME="crm_database"
BACKUP_DIR="./backups"

case "$CMD" in

  up)
    $COMPOSE up -d $DB_SERVICE
    ;;

  revision)
    if [ -z "$MSG" ]; then
      echo "Usage: ./scripts/db.sh revision \"description\""
      exit 1
    fi
    $COMPOSE run --rm $BACKEND_SERVICE \
      uv run alembic revision --autogenerate -m "$MSG"
    ;;

  migrate)
    $COMPOSE run --rm $BACKEND_SERVICE \
      uv run alembic upgrade head
    ;;

  auto-migrate)
    echo "Auto-detecting model changes and creating migration..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    $COMPOSE run --rm $BACKEND_SERVICE \
      uv run alembic revision --autogenerate -m "auto_${TIMESTAMP}"
    echo "Applying migration..."
    $COMPOSE run --rm $BACKEND_SERVICE \
      uv run alembic upgrade head
    echo "Done. Migration auto_${TIMESTAMP} applied."
    ;;

  downgrade)
    STEPS=${MSG:-1}
    $COMPOSE run --rm $BACKEND_SERVICE \
      uv run alembic downgrade "-${STEPS}"
    echo "Downgraded ${STEPS} step(s)."
    ;;

  history)
    $COMPOSE run --rm $BACKEND_SERVICE \
      uv run alembic history --verbose
    ;;

  current)
    $COMPOSE run --rm $BACKEND_SERVICE \
      uv run alembic current
    ;;

  backup)
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"
    echo "Backing up database to ${BACKUP_FILE}..."
    $COMPOSE exec -T $DB_SERVICE \
      pg_dump -U $DB_USER -d $DB_NAME --clean --if-exists | gzip > "$BACKUP_FILE"
    echo "Backup saved: ${BACKUP_FILE}"
    ls -lh "$BACKUP_FILE"
    ;;

  restore)
    if [ -z "$MSG" ]; then
      echo "Usage: ./scripts/db.sh restore <backup_file>"
      echo "Available backups:"
      ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  No backups found in $BACKUP_DIR/"
      exit 1
    fi
    if [ ! -f "$MSG" ]; then
      echo "File not found: $MSG"
      exit 1
    fi
    echo "WARNING: This will overwrite the current database!"
    read -p "Continue? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "Cancelled."
      exit 0
    fi
    echo "Restoring from ${MSG}..."
    gunzip -c "$MSG" | $COMPOSE exec -T $DB_SERVICE \
      psql -U $DB_USER -d $DB_NAME
    echo "Database restored from ${MSG}"
    ;;

  reset)
    echo "WARNING: This will destroy all data!"
    read -p "Continue? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "Cancelled."
      exit 0
    fi
    $COMPOSE down -v
    $COMPOSE up -d $DB_SERVICE
    sleep 5
    $COMPOSE run --rm $BACKEND_SERVICE \
      uv run alembic upgrade head
    echo "Database reset and migrated."
    ;;

  init)
    echo "First-time setup..."
    $COMPOSE up -d $DB_SERVICE
    sleep 5
    $COMPOSE run --no-deps --rm $BACKEND_SERVICE \
      uv run alembic revision --autogenerate -m "init"
    $COMPOSE run --no-deps --rm $BACKEND_SERVICE \
      uv run alembic upgrade head
    echo "Done. Database initialized."
    ;;

  shell)
    echo "Connecting to database shell..."
    $COMPOSE exec $DB_SERVICE \
      psql -U $DB_USER -d $DB_NAME
    ;;

  tables)
    $COMPOSE exec $DB_SERVICE \
      psql -U $DB_USER -d $DB_NAME -c "\dt+"
    ;;

  count)
    $COMPOSE exec $DB_SERVICE \
      psql -U $DB_USER -d $DB_NAME -c "
        SELECT schemaname, relname AS table_name, n_live_tup AS row_count
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC;
      "
    ;;

  size)
    $COMPOSE exec $DB_SERVICE \
      psql -U $DB_USER -d $DB_NAME -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME')) AS database_size;
      "
    ;;

  describe)
    if [ -z "$MSG" ]; then
      echo "Usage: ./scripts/db.sh describe <table_name>"
      exit 1
    fi
    $COMPOSE exec $DB_SERVICE \
      psql -U $DB_USER -d $DB_NAME -c "\d+ $MSG"
    ;;

  query)
    if [ -z "$MSG" ]; then
      echo "Usage: ./scripts/db.sh query \"SELECT ...\""
      exit 1
    fi
    $COMPOSE exec $DB_SERVICE \
      psql -U $DB_USER -d $DB_NAME -c "$MSG"
    ;;

  auto-backup)
    # Designed to be called from a cron job or systemd timer.
    # Backs up the database, then prunes files older than RETENTION_DAYS.
    # Example crontab (daily at 02:00 UTC):
    #   0 2 * * * /home/ubuntu/astro-portal/scripts/db.sh auto-backup >> /var/log/astro-backup.log 2>&1
    RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting automated backup -> ${BACKUP_FILE}"
    $COMPOSE exec -T $DB_SERVICE       pg_dump -U $DB_USER -d $DB_NAME --clean --if-exists | gzip > "$BACKUP_FILE"
    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup complete: ${BACKUP_FILE} (${SIZE})"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Pruning backups older than ${RETENTION_DAYS} days ..."
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    REMAINING=$(ls "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Retained ${REMAINING} backup file(s)."
    ;;

  verify-backup)
    # Restore the latest backup to a temp database and run a sanity query.
    LATEST=$(ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$LATEST" ]; then
      echo "No backups found in $BACKUP_DIR"
      exit 1
    fi
    echo "Verifying backup: $LATEST"
    TEMP_DB="${DB_NAME}_verify_$$"
    $COMPOSE exec -T $DB_SERVICE psql -U $DB_USER -c "CREATE DATABASE ${TEMP_DB};" postgres
    zcat "$LATEST" | $COMPOSE exec -T $DB_SERVICE psql -U $DB_USER -d $TEMP_DB -q
    ROWS=$($COMPOSE exec -T $DB_SERVICE psql -U $DB_USER -d $TEMP_DB -t -c "SELECT COUNT(*) FROM "user";" | tr -d " 
")
    $COMPOSE exec -T $DB_SERVICE psql -U $DB_USER -c "DROP DATABASE ${TEMP_DB};" postgres
    echo "Restore verification passed. Users in backup: ${ROWS}"
    ;;

  *)
    echo "Astro Portal Database Management"
    echo ""
    echo "NOTE: First-run setup is now automatic. 'docker compose up --build' runs"
    echo "      migrations and seeds the admin inside the backend entrypoint. This"
    echo "      script is for power-user operations on an already-running stack:"
    echo "      adding new migrations, backups/restores, ad-hoc SQL, and inspection."
    echo ""
    echo "Migrations (run against a running stack):"
    echo "  ./scripts/db.sh revision \"msg\"          Create new migration"
    echo "  ./scripts/db.sh auto-migrate            Auto-detect & apply changes"
    echo "  ./scripts/db.sh migrate                 Apply pending migrations"
    echo "  ./scripts/db.sh downgrade [n]           Downgrade n steps (default: 1)"
    echo "  ./scripts/db.sh history                 Show migration history"
    echo "  ./scripts/db.sh current                 Show current revision"
    echo "  ./scripts/db.sh init                    Legacy first-time setup (no longer required)"
    echo ""
    echo "Backup & Restore:"
    echo "  ./scripts/db.sh backup                  Backup database (gzipped)"
  echo "  ./scripts/db.sh auto-backup             Backup + prune old backups (cron-safe)"
  echo "  ./scripts/db.sh verify-backup           Restore latest backup to temp DB and verify"
    echo "  ./scripts/db.sh restore <file>          Restore from backup"
    echo "  ./scripts/db.sh reset                   Drop & recreate database (destructive!)"
    echo ""
    echo "Debug & Inspect:"
    echo "  ./scripts/db.sh shell                   Open psql shell"
    echo "  ./scripts/db.sh tables                  List all tables with sizes"
    echo "  ./scripts/db.sh count                   Row counts per table"
    echo "  ./scripts/db.sh size                    Database size"
    echo "  ./scripts/db.sh describe <table>        Describe table structure"
    echo "  ./scripts/db.sh query \"SQL\"             Run arbitrary SQL"
    ;;
esac
