///<reference path="../../js/app.js" />
///<reference path="../../js/layers/overpassstreetlayer.js" />
///<reference path="../../js/plugins/simulategeolocationplugin.js" />
///<reference path="../../js/plugins/watchgeolocationplugin.js" />

function log(str) {
    if (typeof(str) !== "string") str = JSON.stringify(str);
    document.getElementById("debuglayer").innerText = str;
}

var app = new App("appcanvas");
app.addLayer(new OverpassStreetLayer());
// app.addPlugin(new WatchGeolocationPlugin());
app.addPlugin(new SimulateGeolocationPlugin());

// // Put your location here
// var bbox = { lat1: 50.98588, lon1: 11.05539, lat2: 50.99191, lon2: 11.07223 };

// var factor = 2000;

// /*
// Traffic signs can be obtained from here:
// https://wiki.openstreetmap.org/wiki/DE:Verkehrszeichen_in_Deutschland
// https://wiki.openstreetmap.org/wiki/Key:traffic_sign
// */

// var createScene = function (canvas, engine) {

//     var scene = new BABYLON.Scene(engine);

//     var center = { lat: (bbox.lon1 + bbox.lon2) / 2, lon: (bbox.lon1 + bbox.lon2) / 2 }

//     var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, 3 * Math.PI / 8, 30, new BABYLON.Vector3(center.lon, 0, center.lat), scene);
//     camera.lowerRadiusLimit = 2;
//     camera.upperBetaLimit = 1.57;
//     camera.attachControl(canvas, true);

//     var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);

//     return scene;
// };

// function drawLine(points, scene) {
//     var lines = BABYLON.MeshBuilder.CreateLines("lines", {points: points}, scene);
//     lines.color = new BABYLON.Color3(1, 1, 0);
//     initInteractions(scene, lines);
//     return lines;
// }

// function drawPolygon(points, scene, extrusion, color) {
//     var polygon = BABYLON.MeshBuilder.ExtrudePolygon("polygon", { shape: points, sideOrientation: BABYLON.Mesh.DOUBLESIDE, depth: extrusion }, scene);
//     polygon.position.y += extrusion;
//     var material = new BABYLON.StandardMaterial("polygonmaterial", scene);
//     material.diffuseColor = color;
//     polygon.material = material;
//     initInteractions(scene, polygon, true);
//     return polygon;
// }

// function drawRoads(roads, scene) {
//     Object.keys(roads).forEach(roadId => {
//         var road = roads[roadId];
//         var points = Object.values(road.nodeinstances).filter(node => node.lon > bbox.lon1 && node.lon < bbox.lon2 && node.lat > bbox.lat1 && node.lat < bbox.lat2).map(node => {
//             return new BABYLON.Vector3((node.lon - bbox.lon1) * factor, 0, (node.lat - bbox.lat1) * factor);
//         });
//         drawLine(points, scene).element = road;
//     });
// }

// function drawBuildings(buildings, scene, extrusion, color) {
//     Object.keys(buildings).forEach(buildingId => {
//         var building = buildings[buildingId];
//         var points = Object.values(building.nodeinstances).map(node => {
//             return new BABYLON.Vector3((node.lon - bbox.lon1) * factor, 0, (node.lat - bbox.lat1) * factor);
//         });
//         drawPolygon(points, scene, extrusion, color).element = building;
//     });
// }

// function initInteractions(scene, mesh, withover) {
//     mesh.actionManager = new BABYLON.ActionManager(scene);
//     if (withover) mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOutTrigger, mesh.material, "diffuseColor", mesh.material.diffuseColor, 150));
//     if (withover) mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh.material, "diffuseColor", new BABYLON.Color3(1, 0.5, 0.5), 150));
//     mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, (function(mesh) { console.log(mesh.element.tags); }).bind(this, mesh)));
// }


// window.addEventListener("load", async () => { // Watch for browser/canvas resize events

//     var canvas = document.getElementById("renderCanvas"); // Get the canvas element 
//     var engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

//     var scene = createScene(canvas, engine); //Call the createScene function

//     window.addEventListener("resize", () => { // Watch for browser/canvas resize events
//         engine.resize();
//     });

//     engine.runRenderLoop(() => { // Register a render loop to repeatedly render the scene
//         scene.render();
//     });

//     var overpassParser = new OverpassParser();
//     var overpassresult = await overpassParser.fetchBbox(bbox, ["relation", "way", "node"]);
//     // var overpassresult = await overpassParser.fetchQuery("data=[bbox:50.98790,11.05866,50.98835,11.05926][out:json][timeout:25];(relation;way;node;);out body;>;out body qt;");
//     var features = await overpassParser.extractFeatures(overpassresult);
//     console.log(features);
//     var highways = await overpassParser.filterFeatures(features, "highway");
//     var buildings = await overpassParser.extractBuildings(features);
//     var amenities = await overpassParser.filterFeatures(features, "amenity");

//     drawRoads(highways, scene);
//     drawBuildings(buildings, scene, .2, new BABYLON.Color3(1, 0, 0));
//     drawBuildings(amenities, scene, 0, new BABYLON.Color3(1, 0, 1));

// });
