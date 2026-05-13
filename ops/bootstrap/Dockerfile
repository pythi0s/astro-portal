FROM alpine:3.20

# Tiny READY-banner sidecar. All we need is a POSIX shell, wget (for the deep
# health probe against the backend), and LF-safe line endings on ready.sh.
RUN apk add --no-cache wget

COPY ready.sh /usr/local/bin/ready.sh
RUN chmod +x /usr/local/bin/ready.sh

# No long-running process: the script prints the banner and exits 0.
ENTRYPOINT ["/usr/local/bin/ready.sh"]
