import App from "#core/app";
import ProxyService from "#lib/proxy";

export default class extends App {
    #proxy;

    // propeties
    get location () {
        return import.meta.url;
    }

    // protected
    async _configure () {
        this.#proxy = new ProxyService( this.config );

        return this.#proxy.configure();
    }

    async _start () {
        await this.#proxy.start();

        return result( 200 );
    }
}
