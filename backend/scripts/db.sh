#!/usr/bin/env bash
set -e

CMD=$1
MSG=$2

case "$CMD" in

  up)
    docker compose up -d db
    ;;

  revision)
    if [ -z "$MSG" ]; then
      echo "Provide message"
      exit 1
    fi
    docker compose run --rm backend \
      uv run alembic revision --autogenerate -m "$MSG"
    ;;

  migrate)
    docker compose run --rm backend \
      uv run alembic upgrade head
    ;;

  reset)
    docker compose down -v
    docker compose up -d db
    ;;

  init)
    echo "First-time setup..."

    docker compose up -d db
    sleep 5

    docker compose run --no-deps --rm backend \
      uv run alembic revision --autogenerate -m "init"

    docker compose run --no-deps --rm backend \
      uv run alembic upgrade head
    ;;

  *)
    echo "Usage:"
    echo "./scripts/db.sh init"
    echo "./scripts/db.sh revision \"msg\""
    echo "./scripts/db.sh migrate"
    ;;
esac
