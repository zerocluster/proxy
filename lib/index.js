const ProxyServer = require( "@softvisio/core/proxy/server" );
const IPAddr = require( "@softvisio/core/ip-addr" );

module.exports = class {
    #options;
    #users = {};

    constructor ( options ) {
        this.#options = options;
    }

    run () {
        if ( this.#options.whitelist ) {
            for ( const subnet of this.#options.whitelist ) {
                IPAddr.addSubnet( "whitelist", subnet );
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
                        IPAddr.addSubnet( "user-" + username, subnet );
                    }

                    this.#users[username].whitelist = "user-" + username;
                }
            }

            if ( this.#users[username].zones ) {
                this.#users[username].zones = Object.fromEntries( this.#users[username].zones.map( zone => [zone, true] ) );
            }
        }

        for ( const zoneName in this.#options.zones ) {
            const listen = new URL( "tcp://" + this.#options.zones[zoneName].listen );

            new ProxyServer( {
                "proxy": this.#options.zones[zoneName].proxy,
                "auth": async ( remoteIP, username, password ) => {
                    return this._auth( remoteIP, username, password, zoneName );
                },
            } )
                .ref()
                .listen( listen.port, listen.hostname );

            console.log( `${zoneName}: ${this.#options.zones[zoneName].listen} ---> ${this.#options.zones[zoneName].proxy || "direct connection"}` );
        }

        process.on( "SIGTERM", this.terminate.bind( this ) );
    }

    async _auth ( remoteIP, username, password, zoneName ) {
        const user = this.#users[username];

        if ( !user ) return false;

        if ( !user.enabled ) return false;

        if ( password !== user.password ) return false;

        if ( user.zones && !user.zones[zoneName] ) return false;

        if ( user.whitelist && !remoteIP.isInNet( user.whitelist ) && !remoteIP.isInNet( "loopback" ) && !remoteIP.isInNet( "private" ) ) return false;

        return true;
    }

    terminate () {
        console.log( "TERM signal received..." );

        process.exit();
    }
};
