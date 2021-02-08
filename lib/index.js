const Proxy = require( "@softvisio/core/proxy" );
const subnets = require( "@softvisio/core/db/subnets" );

module.exports = class {
    #options;
    #users = {};

    constructor ( options ) {
        this.#options = options;
    }

    async run () {
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
                const proxyServer = new Proxy.server( {
                    "proxy": this.#options.zones[zoneName].proxy,
                    "auth": async ( connection, password ) => this._auth.bind( this, zoneName ),
                } );

                await proxyServer.ref().listen( port, host );

                console.log( `${zoneName}@${host}:${port} -> ${proxyServer.proxy || "direct connection"}` );
            }
        }

        process.on( "SIGTERM", this.terminate.bind( this ) );
    }

    async _auth ( zoneName, connection, password ) {
        const user = this.#users[connection.username];

        if ( !user ) return false;

        if ( !user.enabled ) return false;

        if ( password !== user.password ) return false;

        if ( user.zones && !user.zones[zoneName] ) return false;

        if ( user.whitelist && !connection.remoteAddr.findSubnet( user.whitelist ) && !connection.remoteAddr.findSubnet( "loopback" ) && !connection.remoteAddr.findSubnet( "private" ) ) return false;

        return { "username": connection.username };
    }

    terminate () {
        console.log( "TERM signal received..." );

        process.exit();
    }
};
