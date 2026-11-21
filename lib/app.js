import App from "@corejslib/app";

export default class extends App {

    // propeties
    get location () {
        return import.meta.url;
    }
}
