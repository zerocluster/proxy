const Proxy = require( "@softvisio/core/proxy" );
const subnets = require( "@softvisio/core/db/subnets" );
const LruCache = require( "lru-cache" );

module.exports = class {
    #options;
    #users = {};
    #sessions = new LruCache( {
        "max": 10000,
    } );

    constructor ( options ) {
        this.#options = options;
    }

    async run () {

        // configure whitelist
        if ( this.#options.whitelist ) {
            for ( const subnet of this.#options.whitelist ) {
                subnets.add( "whitelist", subnet );
            }
        }

        // configure users
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

        // configure zones
        for ( const name in this.#options.zones ) {
            const zone = this.#options.zones[name];

            zone.name = name;

            if ( zone.proxy ) zone.proxy = Proxy.new( zone.proxy );

            console.log( `${name}: ${zone.proxy || "direct connection"}` );
        }

        // start servers
        var [minPort, maxPort] = ( this.#options.port + "" ).split( /\s*-\s*/ );
        if ( !maxPort ) maxPort = minPort;

        for ( let port = minPort; port <= maxPort; port++ ) {
            const proxyServer = new Proxy.server( {
                "auth": this._auth.bind( this ),
                "proxy": this.#getProxy.bind( this ),
            } );

            await proxyServer.ref().listen( port, this.#options.listen );

            console.log( `Listen: ${this.#options.listen}:${port}` );
        }

        process.on( "SIGTERM", this.terminate.bind( this ) );
    }

    async _auth ( connection, password ) {

        // zone is not specified
        if ( !connection.options.zone ) return false;

        // zone name is invalid
        if ( !this.#options.zones[connection.options.zone] ) return false;

        const user = this.#users[connection.options.username];

        // unknown user
        if ( !user ) return false;

        // user is disabled
        if ( !user.enabled ) return false;

        // password is invalid
        if ( password !== user.password ) return false;

        if ( user.zones && !user.zones[connection.options.zone] ) return false;

        // check user whitelist
        if ( user.whitelist && !connection.remoteAddr.findSubnet( user.whitelist ) && !connection.remoteAddr.findSubnet( "loopback" ) && !connection.remoteAddr.findSubnet( "private" ) ) return false;

        // authorized
        return { "user": connection.options.username };
    }

    async #getProxy ( connection ) {
        if ( connection.options.session ) {
            return this.#getSessionProxy( connection );
        }
        else {
            return this.#options.zones[connection.options.zone].proxy;
        }
    }

    // XXX un cluster store sessions in redis or database
    async #getSessionProxy ( connection ) {
        const session = connection.options.username + "/" + connection.options.zone + "/" + connection.options.session;

        var proxy = this.#sessions.get( session );

        console.log( proxy + "" );

        if ( proxy ) return proxy;

        proxy = await this.#options.zones[connection.options.zone].proxy.rotateRandomProxy( connection.options );

        this.#sessions.set( session, proxy );

        return proxy;
    }

    terminate () {
        console.log( "TERM signal received..." );

        process.exit();
    }
};
