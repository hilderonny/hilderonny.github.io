// Put your location here
var lat = 11.0624398;
var lon = 50.9899699;
var zoomlevel = 15;
var tileinfo = {};

// From https://wiki.openstreetmap.org/wiki/Zoom_levels
var meterperpixels = {
    0: 156412,
    1: 78206,
    2: 39103,
    3: 19551,
    4: 9776,
    5: 4888,
    6: 2444,
    7: 1222,
    8: 610.984,
    9: 305.492,
    10: 152.746,
    11: 76.373,
    12: 38.187,
    13: 19.093,
    14: 9.547,
    15: 4.773,
    16: 2.387,
    17: 1.193,
    18: 0.596,
    19: 0.298
};

var sm = new SphericalMercator();

var loadpbf = function(callback) {

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = function () {

        if (this.readyState !== 4 || this.status !== 200) return;

        var buffer = new Uint8Array(xhr.response);

        // See https://github.com/mapbox/pbf
        var pbf = new Pbf(buffer);

        var vectortile = new VectorTile(pbf);

        callback(vectortile);

    }

    var xyz = sm.xyz([lat, lon], zoomlevel);
    // Point of lat/lon scaled to 0..1 relative to xyz starting point
    var px = sm.px([lat, lon], zoomlevel);
    px = [px[0] / sm.size - xyz.minX, px[1] / sm.size - xyz.maxY];

    tileinfo.x = xyz.minX;
    tileinfo.y = xyz.maxY;
    tileinfo.mpp = meterperpixels[zoomlevel];

    xhr.open("GET", "https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/" + zoomlevel + "/" + tileinfo.x + "/" + tileinfo.y + ".vector.pbf?access_token=pk.eyJ1IjoiaGlsZGVyb25ueSIsImEiOiJjamg0cDVsczUweDFxMzNsbnl5M2Jtdjd0In0.quEIdB6c02FYsvPhR8hfdw", true);
    xhr.send();

}

var createScene = function (canvas, engine) {

	var scene = new BABYLON.Scene(engine);

	var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, 3 * Math.PI / 8, 30, BABYLON.Vector3.Zero(), scene);

	camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    
    scene.createDefaultEnvironment({
        groundColor: new BABYLON.Color3(0, 1, 0),
        groundSize: 100,
        skyboxColor: new BABYLON.Color3(0.5, 0.5, 1),
        skyboxSize: new BABYLON.Vector3(100, 100, 100),
        sizeAuto: false
    });

	return scene;
};

function drawLine(points, scene) {
    var babPoints = points.map(function(p) {
        return new BABYLON.Vector3(p.x / 100 - 20, 0, -p.y / 100 + 20);
    });
    var lines = BABYLON.MeshBuilder.CreateLines("lines", {points: babPoints}, scene);
    lines.color = new BABYLON.Color3(1, 1, 0);
}

function drawPolygon(points, scene, extrusion) {
    var babPoints = points.map(function(p) {
        return new BABYLON.Vector3(p.x / 100 - 20, 0, -p.y / 100 + 20);
    });
    var polygon = BABYLON.MeshBuilder.ExtrudePolygon("polygon", {shape: babPoints, sideOrientation: BABYLON.Mesh.DOUBLESIDE, depth: extrusion/10}, scene);
    polygon.position.y += extrusion / 10;
    var material = new BABYLON.StandardMaterial("polygonmaterial", scene);
    material.diffuseColor = new BABYLON.Color3(1, 0, 0); 
    polygon.material = material;
    initInteractions(scene, polygon);
    return polygon;
}

function drawRoads(layer, scene) {
    for (var i = 0; i < layer.features.length; i++) {
        var feature = layer.feature(i);
        var geometry = feature.getGeometry();
        geometry.lines.forEach(function (line) {
            drawLine(line, scene);
        });
    }
}

function drawBuildings(layer, scene) {
    for (var i = 0; i < layer.features.length; i++) {
        var feature = layer.feature(i);
        var geometry = feature.getGeometry();
        console.log(geometry);
        geometry.lines.forEach(function (line) {
            drawPolygon(line, scene, feature.properties.extrude === "true" ? feature.properties.height : 0).feature = feature;
        });
    }
}

function initInteractions(scene, mesh) {
    mesh.actionManager = new BABYLON.ActionManager(scene);
    mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOutTrigger, mesh.material, "diffuseColor", mesh.material.diffuseColor, 150));
    mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh.material, "diffuseColor", new BABYLON.Color3(1, 0.5, 0.5), 150));
    mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, (function(mesh) { console.log(mesh.feature); }).bind(this, mesh)));
    // mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOutTrigger, mesh, "scaling", new BABYLON.Vector3(1, 1, 1), 150));
    // mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh, "scaling", new BABYLON.Vector3(1.1, 1.1, 1.1), 150));
}


window.addEventListener("load", function () { // Watch for browser/canvas resize events

    var canvas = document.getElementById("renderCanvas"); // Get the canvas element 
    var engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

    var scene = createScene(canvas, engine); //Call the createScene function

    window.addEventListener("resize", function () { // Watch for browser/canvas resize events
        engine.resize();
    });

    engine.runRenderLoop(function () { // Register a render loop to repeatedly render the scene
        scene.render();
    });

    loadpbf(function(vectortile) {
        console.log(vectortile);

        if (vectortile.layers.road) drawRoads(vectortile.layers.road, scene);
        if (vectortile.layers.building) drawBuildings(vectortile.layers.building, scene);

    });
});
