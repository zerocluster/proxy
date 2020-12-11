FROM softvisio/core

RUN \
    # setup node build environment
    curl -fsSL https://bitbucket.org/softvisio/scripts/raw/master/env-build-node.sh | /bin/bash -s -- setup \
    \
    # install deps
    && pushd .. \
    && npm i --unsafe --only=prod \
    && popd \
    \
    # cleanup node build environment
    && curl -fsSL https://bitbucket.org/softvisio/scripts/raw/master/env-build-node.sh | /bin/bash -s -- cleanup \
    \
    # clean npm cache
    && rm -rf ~/.npm-cache
