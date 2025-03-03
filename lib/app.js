import NginxApi from "#core/api/nginx";
import App from "#core/app";

export default class extends App {
    #nginxApi;

    // propeties
    get location () {
        return import.meta.url;
    }

    // protected
    async _start () {
        var res;

        if ( this.config.nginx.proxyId ) {
            this.#nginxApi = new NginxApi( {
                "apiUrl": this.config.nginx.apiUrl,
                "proxyId": this.config.nginx.proxyId,
                "proxyOptions": {
                    "upstreamPort": this.proxyServer.config.port,
                    "upstreamProxyProtocol": true,
                    "serverNames": this.config.nginx.serverNames,
                    "servers": [
                        {
                            "port": 8085,
                            "type": "tcp",
                        },
                        {
                            "port": 8085,
                            "type": "tcp",
                            "ssl": true,
                        },
                    ],
                },
            } );

            res = await this.#nginxApi.start();

            if ( !res.ok ) return res;
        }

        return result( 200 );
    }
}
