FROM softvisio/core

HEALTHCHECK NONE

RUN \
    # setup node build environment
    curl -fsSL https://bitbucket.org/softvisio/scripts/raw/master/env-build-node.sh | /bin/bash -s -- setup \
    \
    # install deps
    && npm i --no-fund --omit=dev \
    \
    # cleanup node build environment
    && curl -fsSL https://bitbucket.org/softvisio/scripts/raw/master/env-build-node.sh | /bin/bash -s -- cleanup \
    \
    # clean npm cache
    && rm -rf ~/.npm-cache
