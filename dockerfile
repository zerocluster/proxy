FROM ghcr.io/zerocluster/node/app

RUN --mount=type=secret,id=GITHUB_TOKEN,env=GITHUB_TOKEN \
    <<EOF
#!/usr/bin/env bash

set -Eeuo pipefail
trap 'echo "⚠  Error ($0:$LINENO): $BASH_COMMAND" && return 3 2> /dev/null || exit 3' ERR

# install dependencies
NODE_ENV=production npm install-clean

# cleanup
script=$(curl -fsSL "https://raw.githubusercontent.com/softvisio/scripts/main/env-build-node.sh")
bash <(echo "$script") cleanup
EOF
