const ProxyServer = require( "@softvisio/core/proxy/server" );
const subnets = require( "@softvisio/core/db/subnets" );

module.exports = class {
    #options;
    #users = {};

    constructor ( options ) {
        this.#options = options;
    }

    run () {
        if ( this.#options.whitelist ) {
            for ( const subnet of this.#options.whitelist ) {
                subnets.add( "whitelist", subnet );
            }
        }

        for ( const username in this.#options.users ) {
            this.#users[username] = this.#options.users[username];

            if ( this.#users[username].whitelist ) {
                if ( this.#users[username].whitelist === true ) {
                    this.#users[username].whitelist = "whitelist";
                }
                else {
                    for ( const subnet of this.#users[username].whitelist ) {
                        subnets.add( "user-" + username, subnet );
                    }

                    this.#users[username].whitelist = "user-" + username;
                }
            }

            if ( this.#users[username].zones ) {
                this.#users[username].zones = Object.fromEntries( this.#users[username].zones.map( zone => [zone, true] ) );
            }
        }

        for ( const zoneName in this.#options.zones ) {
            var [host, port] = this.#options.zones[zoneName].listen.split( ":" );
            var [minPort, maxPort] = port.split( /\s*-\s*/ );
            if ( !maxPort ) maxPort = minPort;

            for ( let port = minPort; port <= maxPort; port++ ) {
                const proxyServer = new ProxyServer( {
                    "proxy": this.#options.zones[zoneName].proxy,
                    "auth": async ( remoteIP, username, password ) => {
                        return this._auth( remoteIP, username, password, zoneName );
                    },
                } );

                proxyServer.ref().listen( port, host );

                // persistent
                if ( this.#options.zones[zoneName].persistent ) {
                    proxyServer.proxy.startSession();

                    // rotate ip on timeout
                    if ( this.#options.zones[zoneName].sessionTimeout ) {
                        setInterval( () => proxyServer.proxy.startSession(), this.#options.zones[zoneName].sessionTimeout );
                    }
                }

                console.log( `${zoneName}@${host}:${port} -> ${this.#options.zones[zoneName].proxy || "direct connection"}` );
            }
        }

        process.on( "SIGTERM", this.terminate.bind( this ) );
    }

    async _auth ( remoteIP, username, password, zoneName ) {
        const user = this.#users[username];

        if ( !user ) return false;

        if ( !user.enabled ) return false;

        if ( password !== user.password ) return false;

        if ( user.zones && !user.zones[zoneName] ) return false;

        if ( user.whitelist && !remoteIP.findSubnet( user.whitelist ) && !remoteIP.findSubnet( "loopback" ) && !remoteIP.findSubnet( "private" ) ) return false;

        return true;
    }

    terminate () {
        console.log( "TERM signal received..." );

        process.exit();
    }
};
