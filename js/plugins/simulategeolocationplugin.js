class SimulateGeolocationPlugin {

    constructor() {
        this._lat = 50.98588;
        this._lon = 11.05539;
        this._step = 0.00001;
        this._interval = 20;
    }

    init(app) {
        this._app = app;
        setInterval(() => {
            this._update();
        }, this._interval);
    }

    async _update() {
        this._lat += this._step;
        await this._app.setPlayerPosition(this._lat, this._lon);
    }

}