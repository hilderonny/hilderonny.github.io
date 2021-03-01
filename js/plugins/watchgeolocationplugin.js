class WatchGeolocationPlugin {

    constructor() {
    }

    init(app) {
        this._app = app;
        if (navigator.geolocation) navigator.geolocation.watchPosition(async (position) => {
            await this._updatePosition(position);
        }, () => { }, { enableHighAccuracy: true });
    }

    async _updatePosition(position) {
        await this._app.setPlayerPosition(position.coords.latitude, position.coords.longitude);
    }

}