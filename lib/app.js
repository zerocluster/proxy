import App from "#core/app";
import appConfig from "#lib/app.config";
import ProxyService from "#lib/proxy";

export default class extends App {
    #proxy;

    constructor () {
        super( import.meta.url, appConfig );
    }

    // static
    static cli () {
        return {
            "options": {},
            "arguments": {},
        };
    }

    // public
    async run () {
        const res = await super.run();

        if ( !res.ok ) return res;

        this.#proxy = new ProxyService();

        await this.#proxy.run( this.env.config );

        return res;
    }

    // protected
    _initThreads () {

        // return {
        //     "worker": {
        //         "num": 1,
        //         "path": new URL( "./threads/worker.js", import.meta.url ),
        //         "arguments": null,
        //     },
        // };
    }

    _initPrivateHttpServer ( server ) {}

    _initPublicHttpServer ( server ) {
        server.webpack( "/", new URL( "../app/www", import.meta.url ) );
    }
}
