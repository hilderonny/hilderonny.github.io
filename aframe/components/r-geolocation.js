AFRAME.registerComponent("r-geolocation", {
    init: function() {
        var self = this;
        var isinitialposition = true;
        if (navigator.geolocation) navigator.geolocation.watchPosition(
            function(position) {
                self.el.emit("geolocationupdated", { position: position, isinitialposition : isinitialposition }, true);
                isinitialposition = false;
            },
            function(error) {
                console.log(error);
            }, 
            { enableHighAccuracy: true }
        );
    }
});