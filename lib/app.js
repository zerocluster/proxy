import App from "@softvisio/app";

export default class extends App {
    // eslint-disable-next-line no-unused-private-class-members
    #proxy;

    // propeties
    get location () {
        return import.meta.url;
    }
}
