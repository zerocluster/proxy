const ProxyServer = require( "@softvisio/core/proxy/server" );

module.exports = class {
    #options;

    constructor ( options ) {
        this.#options = options;
    }

    run () {
        for ( const server of this.#options.server ) {
            const listen = new URL( "tcp://" + server.listen );

            new ProxyServer( { "proxy": server.proxy, "whiteList": this.#options.whitelist } ).ref().listen( listen.port, listen.hostname );

            console.log( `LISTEN: ${server.listen} ---> ${server.proxy || "direct connection"}` );
        }
    }
};
