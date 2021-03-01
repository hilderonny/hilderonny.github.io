class OverpassParser {

    constructor() { }

    async fetchQuery(query) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4 || xhr.status !== 200)
                    return;
                var result = JSON.parse(xhr.response);
                resolve(result);
            };
            xhr.open("POST", "https://overpass-api.de/api/interpreter", true);
            xhr.send(encodeURI(query));
        });
    }

    async fetchBbox(bbox, elements) {
        var query = "data=[bbox:" + bbox.lat1 + "," + bbox.lon1 + "," + bbox.lat2 + "," + bbox.lon2 + "][out:json][timeout:25];(" + elements.map(e => e + ";").join("") + ");out body;>;out body qt;";
        return this.fetchQuery(query);
    }

    async extractFeatures(overpassresult) {
        var features = {};
        overpassresult.elements.forEach(element => {
            if (!features[element.type]) features[element.type] = {};
            features[element.type][element.id] = element;
            delete element.id;
            delete element.type;
        });
        return features;
    }

    async extractBuildings(features) {
        var matching = {};
        // First look into ways
        if (features.way) Object.keys(features.way).forEach(wayKey => {
            var way = features.way[wayKey];
            if (!way || !way.tags || !way.tags.building) return;
            matching[wayKey] = way;
            // Can be already processed by another filter
            if (!way.nodeinstances) way.nodeinstances = way.nodes.map(node => features.node[node]);
        });
        // Now process relations
        if (features.relation) Object.keys(features.relation).forEach(relationKey => {
            var relation = features.relation[relationKey];
            if (!relation || !relation.tags || !relation.tags.building || !relation.members) return;
            relation.members.forEach(member => {
                if (!member.type === "way") return;
                var way = features.way[member.ref];
                matching[member.ref] = way;
                way.tags = relation.tags;
                // Can be already processed by another filter
                if (!way.nodeinstances) way.nodeinstances = way.nodes.map(node => features.node[node]);
            });
        });
        return matching;
    }

    async filterFeatures(features, key) {
        var matching = {};
        if (features && features.way) Object.keys(features.way).forEach(wayKey => {
            var way = features.way[wayKey];
            if (!way || !way.tags || !way.tags[key]) return;
            matching[wayKey] = way;
            // Can be already processed by another filter
            if (!way.nodeinstances) way.nodeinstances = way.nodes.map(node => features.node[node]);
        });
        return matching;
    }

}
