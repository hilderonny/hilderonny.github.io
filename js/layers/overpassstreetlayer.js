///<reference path="../overpassparser.js" />
///<reference path="../app.js" />

class OverpassStreetLayer {

    constructor() {
        this._parser = new OverpassParser();
        this._streetMeshes = [];
    }

    async update(app, location, radius) {
        var bbox = {
            lat1: location.latitude - radius,
            lon1: location.longitude - radius,
            lat2: location.latitude + radius,
            lon2: location.longitude + radius
        };
        var overpassresult = await this._parser.fetchBbox(bbox, ["relation", "way", "node"]);
        var features = await this._parser.extractFeatures(overpassresult);
        var highways = await this._parser.filterFeatures(features, "highway");
        var buildings = await this._parser.extractBuildings(features);
        this._clearLines();
        this._drawStreets(app, Object.values(highways));
        this._drawBuildings(app, Object.values(buildings));
    }

    _clearLines() {
        this._streetMeshes.forEach(m => { if (m && m.dispose) m.dispose(); });
        this._streetMeshes.length = 0;
    }

    /** @param {App} app */
    _drawStreets(app, streets) {
        if (!app.createLines) return;
        streets.forEach(s => {
            var points = s.nodeinstances.map(n => { return { longitude: n.lon, latitude: n.lat } });
            var streetMesh = app.createLines(points, [1, 1, 0]);
            streetMesh.street = s;
            this._streetMeshes.push(streetMesh);
        });
    }

    _drawBuildings(app, buildings) {
        if (!app.createPolygon) return;
        buildings.forEach(s => {
            app.createPolygon(s.nodeinstances).building = s;
        });
    }

}