FROM ghcr.io/zerocluster/node/app

RUN \
    # install deps
    NODE_ENV=production npm i \
    \
    # cleanup
    && /bin/bash <(curl -fsSL https://raw.githubusercontent.com/softvisio/scripts/main/env-build-node.sh) cleanup
