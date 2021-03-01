/*
This is a simple implementation of the vector tiles algorithms from https://github.com/mapbox/vector-tile-js
 */

function VectorTileFeature(pbf, end, extent, keys, values) {

    this.properties = {};
    this.keys = keys;
    this.values = values;
    this.pbf = pbf;

    pbf.readFields(this.readFeature, this, end);

}

VectorTileFeature.prototype.readFeature = function (tag, feature, pbf) {
    if (tag == 1) feature.id = pbf.readVarint();
    else if (tag == 2) feature.readTag(pbf, feature);
    else if (tag == 3) feature.type = pbf.readVarint();
    else if (tag == 4) feature.geometry = pbf.pos;
};

VectorTileFeature.prototype.readTag = function (pbf, feature) {
    var end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
        var key = feature.keys[pbf.readVarint()],
            value = feature.values[pbf.readVarint()];
        feature.properties[key] = value;
    }
};

VectorTileFeature.prototype.getGeometry = function () {
    var pbf = this.pbf;
    pbf.pos = this.geometry;
    var geometry = { minX: 999999999, maxX: 0, minY: 999999999, maxY: 0, cx: 0, cy: 0, lines: [] };

    var end = pbf.readVarint() + pbf.pos;
    var cmd = 1;
    var length = 0;
    var x = 0;
    var y = 0;
    var line;

    while (pbf.pos < end) {
        if (length <= 0) {
            var cmdLen = pbf.readVarint();
            cmd = cmdLen & 0x7;
            length = cmdLen >> 3;
        }

        length--;

        if (cmd === 1 || cmd === 2) {
            x += pbf.readSVarint();
            y += pbf.readSVarint();

            if (cmd === 1) { // moveTo starts another line
                if (line) geometry.lines.push(line);
                line = [];
            }

            line.push({ x: x, y: y });
        }
    }

    if (line) geometry.lines.push(line);

    var minX = 999999999, maxX = 0, minY = 999999999, maxY = 0;
    geometry.lines.forEach(function(line) {
        line.forEach(function(point) {
            if (point.x < geometry.minX) geometry.minX = point.x;
            if (point.y < geometry.minY) geometry.minY = point.y;
            if (point.x > geometry.maxX) geometry.maxX = point.x;
            if (point.y > geometry.maxY) geometry.maxY = point.y;
        });
    });
    geometry.cx = (geometry.minX + geometry.maxX) / 2;
    geometry.cy = (geometry.minY + geometry.maxY) / 2;

    return geometry;
};


function VectorTileLayer(pbf, end) {

    this.keys = [];
    this.features = [];
    this.values = [];
    this.pbf = pbf;

    pbf.readFields(this.readLayer, this, end);

}

VectorTileLayer.prototype.readLayer = function (tag, layer, pbf) {
    switch (tag) {
        case 15: layer.version = pbf.readVarint(); break;
        case 1: layer.name = pbf.readString(); break;
        case 5: layer.extent = pbf.readVarint(); break;
        case 2: layer.features.push(pbf.pos); break;
        case 3: layer.keys.push(pbf.readString()); break;
        case 4: layer.values.push(layer.readValueMessage(pbf)); break;
        default: throw new Error("Unknown layer tag: " + tag);
    }
};

VectorTileLayer.prototype.readValueMessage = function (pbf) {
    var value = null;
    var end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
        var tag = pbf.readVarint() >> 3;
        switch (tag) {
            case 1: value = pbf.readString(); break;
            case 2: value = pbf.readFloat(); break;
            case 3: value = pbf.readDouble(); break;
            case 4: value = pbf.readVarint64(); break;
            case 5: value = pbf.readVarint(); break;
            case 6: value = pbf.readSVarint(); break;
            case 7: value = pbf.readBoolean(); break;
            default: throw new Error("Unknown value message tag: " + tag);
        }
    }
    return value;
};

VectorTileLayer.prototype.feature = function (i) {

    if (i < 0 || i >= this.features.length) throw new Error('feature index out of bounds');
    this.pbf.pos = this.features[i];
    var end = this.pbf.readVarint() + this.pbf.pos;

    return new VectorTileFeature(this.pbf, end, this.extent, this.keys, this.values);

};

function VectorTile(vectorTilePbf) {

    this.layers = vectorTilePbf.readFields(this.readTile, {});
}

VectorTile.prototype.readTile = function (tag, layers, pbf) {
    if (tag === 3) {
        var layer = new VectorTileLayer(pbf, pbf.readVarint() + pbf.pos);
        if (layer.features.length) layers[layer.name] = layer;
    }
};

// From https://github.com/mapbox/mapbox-studio-classic/blob/5ac2ead1e523b24c8b8ad8655babb66389166e87/ext/sphericalmercator.js
// See https://stackoverflow.com/a/29221563
var SphericalMercator = (function () {

    // Closures including constants and other precalculated values.
    var cache = {},
        EPSLN = 1.0e-10,
        D2R = Math.PI / 180,
        R2D = 180 / Math.PI,
        // 900913 properties.
        A = 6378137,
        MAXEXTENT = 20037508.34;


    // SphericalMercator constructor: precaches calculations
    // for fast tile lookups.
    function SphericalMercator(options) {
        options = options || {};
        this.size = options.size || 256;
        if (!cache[this.size]) {
            var size = this.size;
            var c = cache[this.size] = {};
            c.Bc = [];
            c.Cc = [];
            c.zc = [];
            c.Ac = [];
            for (var d = 0; d < 30; d++) {
                c.Bc.push(size / 360);
                c.Cc.push(size / (2 * Math.PI));
                c.zc.push(size / 2);
                c.Ac.push(size);
                size *= 2;
            }
        }
        this.Bc = cache[this.size].Bc;
        this.Cc = cache[this.size].Cc;
        this.zc = cache[this.size].zc;
        this.Ac = cache[this.size].Ac;
    };

    // Convert lon lat to screen pixel value
    //
    // - `ll` {Array} `[lon, lat]` array of geographic coordinates.
    // - `zoom` {Number} zoom level.
    SphericalMercator.prototype.px = function (ll, zoom) {
        var d = this.zc[zoom];
        var f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
        var x = Math.round(d + ll[0] * this.Bc[zoom]);
        var y = Math.round(d + 0.5 * Math.log((1 + f) / (1 - f)) * (-this.Cc[zoom]));
        (x > this.Ac[zoom]) && (x = this.Ac[zoom]);
        (y > this.Ac[zoom]) && (y = this.Ac[zoom]);
        //(x < 0) && (x = 0);
        //(y < 0) && (y = 0);
        return [x, y];
    };

    // Convert screen pixel value to lon lat
    //
    // - `px` {Array} `[x, y]` array of geographic coordinates.
    // - `zoom` {Number} zoom level.
    SphericalMercator.prototype.ll = function (px, zoom) {
        var g = (px[1] - this.zc[zoom]) / (-this.Cc[zoom]);
        var lon = (px[0] - this.zc[zoom]) / this.Bc[zoom];
        var lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
        return [lon, lat];
    };

    // Convert tile xyz value to bbox of the form `[w, s, e, n]`
    //
    // - `x` {Number} x (longitude) number.
    // - `y` {Number} y (latitude) number.
    // - `zoom` {Number} zoom.
    // - `tms_style` {Boolean} whether to compute using tms-style.
    // - `srs` {String} projection for resulting bbox (WGS84|900913).
    // - `return` {Array} bbox array of values in form `[w, s, e, n]`.
    SphericalMercator.prototype.bbox = function (x, y, zoom, tms_style, srs) {
        // Convert xyz into bbox with srs WGS84
        if (tms_style) {
            y = (Math.pow(2, zoom) - 1) - y;
        }
        // Use +y to make sure it's a number to avoid inadvertent concatenation.
        var ll = [x * this.size, (+y + 1) * this.size]; // lower left
        // Use +x to make sure it's a number to avoid inadvertent concatenation.
        var ur = [(+x + 1) * this.size, y * this.size]; // upper right
        var bbox = this.ll(ll, zoom).concat(this.ll(ur, zoom));

        // If web mercator requested reproject to 900913.
        if (srs === '900913') {
            return this.convert(bbox, '900913');
        } else {
            return bbox;
        }
    };

    // Convert bbox to xyx bounds
    //
    // - `bbox` {Number} bbox in the form `[w, s, e, n]`.
    // - `zoom` {Number} zoom.
    // - `tms_style` {Boolean} whether to compute using tms-style.
    // - `srs` {String} projection of input bbox (WGS84|900913).
    // - `@return` {Object} XYZ bounds containing minX, maxX, minY, maxY properties.
    SphericalMercator.prototype.xyz = function (bbox, zoom, tms_style, srs) {
        // If web mercator provided reproject to WGS84.
        if (srs === '900913') {
            bbox = this.convert(bbox, 'WGS84');
        }

        var ll = [bbox[0], bbox[1]]; // lower left
        var ur = [bbox[2], bbox[3]]; // upper right
        var px_ll = this.px(ll, zoom);
        var px_ur = this.px(ur, zoom);
        // Y = 0 for XYZ is the top hence minY uses px_ur[1].
        var bounds = {
            minX: Math.floor(px_ll[0] / this.size),
            minY: Math.floor(px_ur[1] / this.size),
            maxX: Math.floor((px_ur[0] - 1) / this.size),
            maxY: Math.floor((px_ll[1] - 1) / this.size)
        };
        if (tms_style) {
            var tms = {
                minY: (Math.pow(2, zoom) - 1) - bounds.maxY,
                maxY: (Math.pow(2, zoom) - 1) - bounds.minY
            };
            bounds.minY = tms.minY;
            bounds.maxY = tms.maxY;
        }
        return bounds;
    };

    // Convert projection of given bbox.
    //
    // - `bbox` {Number} bbox in the form `[w, s, e, n]`.
    // - `to` {String} projection of output bbox (WGS84|900913). Input bbox
    //   assumed to be the "other" projection.
    // - `@return` {Object} bbox with reprojected coordinates.
    SphericalMercator.prototype.convert = function (bbox, to) {
        if (to === '900913') {
            return this.forward(bbox.slice(0, 2)).concat(this.forward(bbox.slice(2, 4)));
        } else {
            return this.inverse(bbox.slice(0, 2)).concat(this.inverse(bbox.slice(2, 4)));
        }
    };

    // Convert lon/lat values to 900913 x/y.
    SphericalMercator.prototype.forward = function (ll) {
        var xy = [
            A * ll[0] * D2R,
            A * Math.log(Math.tan((Math.PI * 0.25) + (0.5 * ll[1] * D2R)))
        ];
        // if xy value is beyond maxextent (e.g. poles), return maxextent.
        (xy[0] > MAXEXTENT) && (xy[0] = MAXEXTENT);
        (xy[0] < -MAXEXTENT) && (xy[0] = -MAXEXTENT);
        (xy[1] > MAXEXTENT) && (xy[1] = MAXEXTENT);
        (xy[1] < -MAXEXTENT) && (xy[1] = -MAXEXTENT);
        return xy;
    };

    // Convert 900913 x/y values to lon/lat.
    SphericalMercator.prototype.inverse = function (xy) {
        return [
            (xy[0] * R2D / A),
            ((Math.PI * 0.5) - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D
        ];
    };

    return SphericalMercator;

})();

if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
    module.exports = exports = SphericalMercator;
}