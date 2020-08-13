const ProxyServer = require( "@softvisio/core/proxy/server" );

module.exports = class {
    #options;

    constructor ( options ) {
        this.#options = options;
    }

    run () {
        for ( const zone of this.#options.zone ) {
            const listen = new URL( "tcp://" + zone.listen );

            new ProxyServer( { "proxy": zone.proxy, "whiteList": this.#options.whitelist } ).ref().listen( listen.port, listen.hostname );

            console.log( `LISTEN: ${zone.listen} ---> ${zone.proxy || "direct connection"}` );
        }
    }
};
