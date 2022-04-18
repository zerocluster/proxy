FROM ghcr.io/zerocluster/node

LABEL org.opencontainers.image.source="https://github.com/zerocluster/proxy"

RUN \
    # install deps
    npm i --omit=dev \
    \
    # cleanup
    && curl -fsSL https://raw.githubusercontent.com/softvisio/scripts/main/env-build-node.sh | /bin/bash -s -- cleanup
