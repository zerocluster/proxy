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

        // prepare whitelist
        if ( this.#options.whitelist ) {
            for ( const subnet of this.#options.whitelist ) {
                subnets.add( "whitelist", subnet );
            }
        }

        // prepare zones
        for ( const name in this.#options.zones ) {
            const zone = this.#options.zones[name];

            zone.name = name;

            if ( zone.proxy ) zone.proxy = Proxy.new( zone.proxy );

            console.log( `${name}: ${zone.proxy || "direct connection"}` );
        }

        // check default zone
        if ( this.#options.default_zone && !this.#options.zones[this.#options.default_zone] ) throw `Default zone is invalid`;

        // configure users
        for ( const username in this.#options.users ) {
            this.#users[username] = this.#options.users[username];

            // prepare user whitelist
            if ( this.#users[username].whitelist ) {

                // inherit whitelist
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

            // prepare user zones
            if ( this.#users[username].zones ) {
                this.#users[username].zones = this.#users[username].zones.reduce( ( zones, zone ) => {
                    if ( !this.#options.zones[zone] ) throw `Zone name is invalid`;

                    zones.add( zone );

                    return zones;
                }, new Set() );
            }

            // inherit default zone
            if ( this.#users[username].default_zone === true ) this.#users[username].default_zone = this.#options.default_zone;

            // check user default zone
            else if ( this.#users[username].default_zone && !this.#options.zones[this.#users[username].default_zone] ) throw `User default zone is invalid`;
        }

        // start servers
        var [minPort, maxPort] = ( this.#options.port + "" ).split( /\s*-\s*/ );
        if ( !maxPort ) maxPort = minPort;

        for ( let port = minPort; port <= maxPort; port++ ) {
            const proxyServer = new Proxy.server( {
                "auth": this.#auth.bind( this ),
                "proxy": this.#getProxy.bind( this ),
            } );

            await proxyServer.ref().listen( port, this.#options.listen );

            console.log( `Listen: ${this.#options.listen}:${port}` );
        }

        process.on( "SIGTERM", this.terminate.bind( this ) );
    }

    async #auth ( connection, password ) {
        const user = this.#users[connection.options.username];

        // unknown user
        if ( !user ) return false;

        // user is disabled
        if ( !user.enabled ) return false;

        // password is invalid
        if ( user.password && password !== user.password ) return false;

        // zone is not specified, use user default zone
        if ( !connection.options.zone ) connection.options.zone = user.default_zone;

        // no zone
        if ( !connection.options.zone ) return false;

        // zone name is invalid
        if ( !this.#options.zones[connection.options.zone] ) return false;

        // zone is disallowed for this user
        if ( user.zones && !user.zones[connection.options.zone] ) return false;

        // check user whitelist
        if ( user.whitelist && !connection.remoteAddr.findSubnet( user.whitelist ) && !connection.remoteAddr.findSubnet( "loopback" ) && !connection.remoteAddr.findSubnet( "private" ) ) return false;

        // authorized
        return {
            "username": connection.options.username,
            "zone": connection.options.zone,
        };
    }

    async #getProxy ( connection ) {
        if ( connection.options.session ) {
            return this.#getSessionProxy( connection );
        }
        else {
            return this.#options.zones[connection.options.zone].proxy;
        }
    }

    // XXX under cluster store sessions in redis or database
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
