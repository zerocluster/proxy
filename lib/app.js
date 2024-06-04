import App from "#core/app";

export default class extends App {
    #proxy;

    // propeties
    get location () {
        return import.meta.url;
    }
}
