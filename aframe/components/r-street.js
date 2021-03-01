AFRAME.registerComponent("r-street", {
    schema: {
        from: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
        to: { type: "vec3", default: { x: 1, y: 0, z: 0 } },
        scale: { type: "number", default: 1 },
        line: { type: "boolean", default: false },
        plane: { type: "boolean", default: true }
    },
    calclength: function (a, b) {
        return Math.sqrt(a * a + b * b);
    },
    update: function () {
        this.el.innerHTML = "";
        // Line
        if (this.data.line) {
            var lineEl = document.createElement("a-entity");
            lineEl.setAttribute("line", { start: this.data.from, end: this.data.to, color: "#ff0" });
            this.el.appendChild(lineEl);
        }
        // Plane
        if (this.data.plane) {
            var planeEl = document.createElement("a-entity");
            var dx = this.data.to.x - this.data.from.x;
            var dz = this.data.to.z - this.data.from.z;
            var height = this.calclength(dx, dz);
            var rotation = Math.atan2(dx, dz);
            planeEl.setAttribute("geometry", { primitive: "plane", width: this.data.scale, height: height });
            planeEl.setAttribute("material", { 
                color: "#ff0",
                // src: "../../css/RoadTwoLanes_256.png", 
                // repeat: { x: 1, y: height/this.data.scale }
            });
            planeEl.object3D.position.set((this.data.from.x + this.data.to.x) / 2, (this.data.from.y + this.data.to.y) / 2, (this.data.from.z + this.data.to.z) / 2);
            planeEl.object3D.rotation.x = THREE.Math.degToRad(-90);
            planeEl.object3D.rotation.z = rotation;
            this.el.appendChild(planeEl);
        }
    }
});