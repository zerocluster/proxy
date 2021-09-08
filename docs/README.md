# Introduction

Proxy service for docker swarm.

## Install

Use `docker-stack.yaml` and `.config.yaml` files, provided in this repository.

```shell
# mark node for deployment
docker node update --label-add proxy=true <NODE-NAME>

# deploy
docker stack deploy --with-registry-auth -c docker-stack.yaml proxy
```

## Usage

Proxy connect url: `http://username:password@hostname:port/`, where:

-   `username` <string\>
-   `password` <string\> Your passwod.
-   `hostname` <string\> Hostname.
-   `port` <integer\> Port.

`Username` parameter can contain additional options, which can be added using comma separator:

-   `zone` <string\> Zone name.
-   `country` <string\> Country ISO2 code.
-   `state` <string> US state code.
-   `city` <string\> City name.
-   `resolve-local` <boolean\> If present, target hosts will be resolved on the proxy server.
-   `session` <string\> Session id.
-   `rotateRequests` <integer\> Rotate proxy after specified number of the requests.
-   `rotateTimeout` <integer\> Rotate proxy after specified timeout in milliseconds.
-   `rotateRandom` <boolean\> Rotate proxies in the random ordere.

Examples:

```text
http://username,zone_test,country_us,session_1234567890,rotateRequests_10,rotateTimeout_10000,rotateRandom_true:password@test.com:54930/

```
