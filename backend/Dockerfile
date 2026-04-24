FROM python:3.11-slim

WORKDIR /workspace

# dos2unix is a lightweight safety net for the rare case a CRLF entrypoint
# sneaks past .gitattributes (e.g. downloaded as a zip rather than cloned).
# It runs once at build time, so there is no runtime cost.
RUN apt-get update \
    && apt-get install -y --no-install-recommends dos2unix \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./

RUN pip install uv && uv sync --frozen

COPY . .

# Normalize line endings and make the entrypoints executable. These scripts
# run the Alembic migration and seed dance before uvicorn/celery bind.
RUN dos2unix /workspace/docker-entrypoint.sh /workspace/docker-entrypoint-worker.sh \
    && chmod +x /workspace/docker-entrypoint.sh /workspace/docker-entrypoint-worker.sh

EXPOSE 8000

ENTRYPOINT ["/workspace/docker-entrypoint.sh"]
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
