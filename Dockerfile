FROM softvisio/core

RUN \
    # install deps
    pushd .. \
    && npm i --unsafe --only=prod \
    && popd \
    \
    # clean npm cache
    && rm -rf ~/.npm-cache
