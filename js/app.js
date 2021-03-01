
class App {

    constructor(canvasElementName) {
        this._canvasElementName = canvasElementName;
        this._layers = [];
        this._plugins = [];
        this._scaleFactor = 2000;
        this._player = {
            position: { latitude: 0, longitude: 0 },
            // position: { latitude: 50.98588, longitude: 11.05539 },
            viewRadius: 0.005
        };

        this._setZero();

        window.addEventListener('DOMContentLoaded', () => {
            this._init();
        });
        window.addEventListener('resize', () => {
            if (this._babylonEngine) this._babylonEngine.resize();
        });
    }

    async addLayer(layer) {
        this._layers.push(layer);
        // await this._updateLayer(layer);
    }

    async addPlugin(plugin) {
        this._plugins.push(plugin);
        plugin.init(this);
    }

    createLines(points, rgba) {
        var coordinates = points.map(p => new BABYLON.Vector3((p.longitude - this._player.position.longitude) * this._scaleFactor, 0, (p.latitude - this._player.position.latitude) * this._scaleFactor));
        var lines = BABYLON.MeshBuilder.CreateLines("", { points: coordinates }, this._babylonScene);
        lines.color = new BABYLON.Color3(rgba[0], rgba[1], rgba[2]);
        lines.parent = this._world;
        return lines;
    }

    async setPlayerPosition(latitude, longitude) {
        this._player.position.latitude = latitude;
        this._player.position.longitude = longitude;
        var diff = {
            latitude: Math.abs(this._nullpoint.latitude - this._player.position.latitude),
            longitude: Math.abs(this._nullpoint.longitude - this._player.position.longitude)
        }
        log(diff);
        // 0.001 sind etwa 100m
        var schwelle = 0.003;
        this._updatePlayerSpherePosition();
        if (!this.issettingzero && (diff.latitude >= schwelle || diff.longitude >= schwelle)) {
            this.issettingzero = true;
            this._updateLayers().then(() => {
                this._setZero();
            });
        }
    }

    _createBabylonScene(engine) {
        this._canvasElement = document.getElementById(this._canvasElementName);
        this._babylonEngine = new BABYLON.Engine(this._canvasElement, true);
        var scene = new BABYLON.Scene(this._engine);
        var camera = new BABYLON.DeviceOrientationCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
        camera.inputs.remove(camera.inputs.attached.mouse);
        camera.inputs.remove(camera.inputs.attached.keyboard);
        // Ansatz für Kameradrehung: https://www.babylonjs-playground.com/#12WBC#196

        // Anstelle des Spielers wird die Welt bewegt. Alle Objekte außer dem Spieler sind Kinder der Welt und bewegen sich so mit.
        this._world = new BABYLON.TransformNode("world"); 

        this._playerSphere = BABYLON.MeshBuilder.CreateSphere('sphere', { segments: 16, diameter: .2 }, scene);

        // Zum resetten der Kamera auf eine neue Richtung kann dieser Ansatz hier verwendet werden:
        // https://www.babylonjs-playground.com/#2FOPX7#3
        // http://www.html5gamedevs.com/topic/24014-device-orientation-camera-needs-to-face-a-starting-position-whenever-you-start-the-game/?do=findComment&comment=138324
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(this._canvasElement, false);
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
        return scene;
    }

    _init() {
        this._babylonScene = this._createBabylonScene();
        this._babylonEngine.runRenderLoop(() => {
            this._babylonScene.render();
        });
    }

    _setZero() {
        this._nullpoint = {
            latitude: this._player.position.latitude,
            longitude: this._player.position.longitude
        };
        this._updatePlayerSpherePosition();
        this.issettingzero = false;        
    }

    async _updateLayer(layer) {
        if (layer.isupdating) return;
        layer.isupdating = true;
        await layer.update(this, this._player.position, this._player.viewRadius);
        layer.isupdating = false;
    }

    async _updateLayers() {
        for (var i = 0; i < this._layers.length; i++) {
            await this._updateLayer(this._layers[i]);
        }
    }

    _updatePlayerSpherePosition() {
        var dlat = (this._nullpoint.latitude - this._player.position.latitude) * this._scaleFactor;
        var dlon = (this._nullpoint.longitude - this._player.position.longitude) * this._scaleFactor;
        if (!this._playerSphere) return;
        this._world.position.x = dlon;
        this._world.position.z = dlat;
    }

}