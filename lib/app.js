import App from "#core/app";
import ProxyService from "#lib/proxy";

export default class extends App {
    #proxy;

    // propeties
    get location () {
        return import.meta.url;
    }

    // protected
    async _init () {
        return result( 200 );
    }

    async _run () {
        this.#proxy = new ProxyService();

        await this.#proxy.run( this.config );

        return result( 200 );
    }
}
