AFRAME.registerComponent("r-overpass-layer", {
    schema: {
        lat: { type: "number", default: 50.99048 },
        lon: { type: "number", default: 11.06208 },
        radius: { type: "number", default: 0.005 },
        factor: { type: "number", default: 20000 }
    },
    createLines: function(points, color) {
        if (points.length < 2) return;
        var lat = this.data.lat;
        var lon = this.data.lon;
        var factor = this.data.factor;
        var mappedPoints = points.map(p => { return { lat: (p.latitude - lat) * factor, lon: (p.longitude - lon) * factor } });
        var scale = factor / 10000;
        var street = {};
        for (var i = 0; i < mappedPoints.length - 1; i++) {
            var beginPoint = mappedPoints[i];
            var endPoint = mappedPoints[i + 1];
            var streetEl = document.createElement("a-entity");
            streetEl.setAttribute("r-street", {
                from: { x: beginPoint.lat, y: 0.01, z: beginPoint.lon },
                to: { x: endPoint.lat, y: 0.01, z: endPoint.lon},
                scale: scale,
                line: true,
                plane: true
            });
            this.el.appendChild(streetEl);
            streetEl.addEventListener("mouseenter", function(evt) {
                log(street.street.tags);
            });
        }
        return street;
    },
    createPolygon: function(points) {
        if (points.length < 3) return;
        var lat = this.data.lat;
        var lon = this.data.lon;
        var factor = this.data.factor;
        var mappedPoints = points.map(p => new THREE.Vector2((p.lat - lat) * factor, (p.lon - lon) * factor) );
        var polygon = new THREE.Shape(mappedPoints);
        var scale = factor / 10000;
        var extrudedGeometry = new THREE.ExtrudeGeometry(polygon, {depth: scale, bevelEnabled: false});
        var extrudedMesh = new THREE.Mesh(extrudedGeometry, new THREE.MeshPhongMaterial({color: 0xff0000}));
        extrudedMesh.position.y = scale;
        extrudedMesh.rotation.x = THREE.Math.degToRad(90);
        var polygonEl = document.createElement("a-entity");
        polygonEl.object3D.add(extrudedMesh);
        extrudedMesh.el = polygonEl; // For events
        this.el.appendChild(polygonEl);
        polygonEl.addEventListener("mouseenter", function(evt) {
            log(polygonEl.building.tags);
        });
        return polygonEl;
    },
    init: function() {
        var self = this;
        self._overpassstreetlayer = new OverpassStreetLayer();
        document.querySelector("a-scene").addEventListener("geolocationupdated", function(evt) {
            var isinitialposition = evt.detail.isinitialposition;
            var coords = evt.detail.position.coords;
            if (isinitialposition) {
                self.data.lat = coords.latitude;
                self.data.lon = coords.longitude;
                self.update();
            } else {
                // Only update player position
                var cameraMesh = document.querySelector("a-entity[camera]").object3D;
                cameraMesh.position.x = (coords.latitude - self.data.lat) * self.data.factor;
                cameraMesh.position.z = (coords.longitude - self.data.lon) * self.data.factor;
            }
        });
    },
    update: function() {
        this.el.innerHTML = "";
        this._overpassstreetlayer.update(this, { latitude: this.data.lat, longitude: this.data.lon }, this.data.radius );
    }
});