import ProxyServer from "./proxy-server.js";

export default Super =>
    class extends Super {

        // protected
        async _install () {
            return new ProxyServer( this.app, this.config );
        }

        async _configure () {
            this.config.nginx.serverNames ||= [ this.app.env.name ];

            return this.instance.configure();
        }

        async _start () {
            return this.instance.start();
        }
    };
