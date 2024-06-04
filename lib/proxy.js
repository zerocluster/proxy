import ProxyClient from "#core/proxy";
import ProxyServer from "#core/proxy/server";
import subnets from "#core/ip/subnets";
import IpAddress from "#core/ip/address";

export default class {
    #config;
    #users = {};
    #forbiddenSubnets;

    constructor ( config ) {
        this.#config = config;
    }

    // public
    async configure () {
        const config = this.#config;

        // prepare whitelist
        if ( config.whitelist ) {
            const subnet = subnets.add( "whitelist" );

            for ( const range of config.whitelist ) {
                subnet.add( range );
            }
        }

        // prepare zones
        for ( const name in config.zones ) {
            const zone = config.zones[ name ];

            zone.name = name;

            if ( zone.proxy ) zone.proxy = Array.isArray( zone.proxy ) ? ProxyClient.new( ...zone.proxy ) : ProxyClient.new( zone.proxy );

            console.log( `${ name }: ${ zone.proxy || "direct connection" }` );
        }

        // check default zone
        if ( config.default_zone && !config.zones[ config.default_zone ] ) throw `Default zone is invalid`;

        // configure users
        for ( const username in config.users ) {
            this.#users[ username ] = config.users[ username ];

            // disable whitelist
            if ( this.#users[ username ].whitelist === false ) {
                this.#users[ username ].whitelist = false;
            }

            // inherit whitelist
            else if ( this.#users[ username ].whitelist == null ) {
                this.#users[ username ].whitelist = "whitelist";
            }

            // user custom whitelist
            else {
                const subnet = subnets.add( "user/" + username );

                if ( !Array.isArray( this.#users[ username ].whitelist ) ) this.#users[ username ].whitelist = [ this.#users[ username ].whitelist ];

                for ( const range of this.#users[ username ].whitelist ) {
                    subnet.add( range );
                }

                this.#users[ username ].whitelist = "user/" + username;
            }

            // prepare user zones
            if ( this.#users[ username ].zones ) {
                if ( !Array.isArray( this.#users[ username ].zones ) ) this.#users[ username ].zones = [ this.#users[ username ].zones ];

                this.#users[ username ].zones = this.#users[ username ].zones.reduce( ( zones, zone ) => {
                    if ( !config.zones[ zone ] ) throw `User zone name is invalid`;

                    zones.add( zone );

                    return zones;
                }, new Set() );
            }

            // inherit default zone
            if ( this.#users[ username ].default_zone == null ) this.#users[ username ].default_zone = config.default_zone;

            // check user default zone
            if ( this.#users[ username ].default_zone ) {
                if ( !config.zones[ this.#users[ username ].default_zone ] ) throw `User default zone is invalid`;

                if ( this.#users[ username ].zones && !this.#users[ username ].zones.has( this.#users[ username ].default_zone ) ) throw `User default zone is invalid`;
            }
        }

        if ( !Array.isArray( config.port ) ) config.port = [ config.port ];

        return result( 200 );
    }

    async start () {
        const config = this.#config;

        this.#forbiddenSubnets = new Set( config.forbiddenSubnets );

        // start servers
        for ( const port of config.port ) {
            const proxyServer = new ProxyServer( {
                "trustedSubnets": config.trustedSubnets,
                "authorize": this.#authorize.bind( this ),
                "checkConnection": this.#checkConnection.bind( this ),
                "proxy": this.#getProxy.bind( this ),
            } );

            const res = await proxyServer.ref().start( { "address": config.listen, port } );

            console.log( `Listen: ${ proxyServer.address }:${ proxyServer.port }` );

            if ( !res.ok ) return res;
        }

        return result( 200 );
    }

    // private
    async #authorize ( connection, password ) {
        const config = this.#config;

        const user = this.#users[ connection.options.username ];

        // unknown user
        if ( !user ) return false;

        // user is disabled
        if ( !user.enabled ) return false;

        // password is invalid
        if ( user.password && password !== user.password ) return false;

        // zone is not specified, use user default zone
        if ( !connection.options.zone && user.default_zone ) connection.options.zone = user.default_zone;

        // no zone
        if ( !connection.options.zone ) return false;

        // zone name is invalid
        if ( !config.zones[ connection.options.zone ] ) return false;

        // zone is disallowed for this user
        if ( user.zones && !user.zones.has( connection.options.zone ) ) return false;

        // check user whitelist
        if ( user.whitelist && !subnets.get( user.whitelist ).includes( connection.remoteAddress ) ) return false;

        // authorized
        return {
            "username": connection.options.username,
            "zone": connection.options.zone,
        };
    }

    #checkConnection ( address, port ) {
        if ( this.#forbiddenSubnets.size ) {
            address = IpAddress.new( address );

            for ( const subnet of this.#forbiddenSubnets ) {
                if ( subnets.get( subnet )?.includes( address ) ) return false;
            }
        }

        return true;
    }

    async #getProxy ( connection ) {
        const config = this.#config;

        connection.options.prefix = connection.options.username + "/" + connection.options.zone + "/";

        return config.zones[ connection.options.zone ].proxy;
    }
}
