FROM ghcr.io/zerocluster/node/app

RUN \
    --mount=type=secret,id=GITHUB_TOKEN,env=GITHUB_TOKEN \
    \
    # install dependencies
    NODE_ENV=production npm install-clean \
    \
    # cleanup
    && script=$(curl -fsSL "https://raw.githubusercontent.com/softvisio/scripts/main/env-build-node.sh") \
    && bash <(echo "$script") cleanup
