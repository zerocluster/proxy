FROM ghcr.io/zerocluster/node/app

RUN --mount=type=secret,id=GITHUB_TOKEN,env=GITHUB_TOKEN <<EOF
#!/usr/bin/env bash

set -Eeuo pipefail
trap 'echo -e "⚠  Error ($0:$LINENO): $(sed -n "${LINENO}p" "$0" 2> /dev/null | grep -oE "\S.*\S|\S" || true)" >&2; return 3 2> /dev/null || exit 3' ERR

# install dependencies
NODE_ENV=production npm install-clean

# cleanup
script=$(curl -fsSL "https://raw.githubusercontent.com/softvisio/scripts/main/env-build-node.sh")
bash <(echo "$script") cleanup

EOF
