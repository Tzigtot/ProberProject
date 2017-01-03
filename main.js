// >$ npm install request --save 
var request = require("request");
var dal = require('./storage.js');

// http://stackoverflow.com/questions/10888610/ignore-invalid-self-signed-ssl-certificate-in-node-js-with-https-request
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


var BASE_URL = "https://web-ims.thomasmore.be/datadistribution/API/2.0";
var Settings = function (url) {
    this.url = BASE_URL + url;
    this.method = "GET";
    this.qs = {format: 'json'};
    this.headers = {
        authorization: "Basic aW1zOno1MTJtVDRKeVgwUExXZw=="
    };
};

var Drone = function (id, location) {
    this._id = id;
    this.location = location;
    this.brand = "default";
    this.procespower = "default";
    this.storage = "default";
};

var Device = function (id, mac, datetime, rssi, drone) {
    this.id = id;
    this.mac = mac;
    this.datetime = datetime;
    this.rssi = rssi;
    this.drone = drone;
};

var dronesSettings = new Settings("/drones?format=json");

dal.clearDrone();
dal.clearDevice();

request(dronesSettings, function (error, response, dronesString) {
    var drones = JSON.parse(dronesString);
    //console.log(drones);
    //console.log("***************************************************************************");
    drones.forEach(function (drone) {
        var droneSettings = new Settings("/drones/" + drone.id + "?format=json");
        request(droneSettings, function (error, response, droneString) {
            var drone = JSON.parse(droneString);
            dal.insertDrone(new Drone(drone.id, drone.location));
        });
        var filesSettings = new Settings("/files?drone_id.is=" + drone.id + "&format=json&date_loaded.greaterOrEqual=2016-12-10T00:00:00");
        request(filesSettings, function (error, response, filesString) {
            var files = JSON.parse(filesString);
            //console.log(filesString);
            //console.log("=================================================================");
            files.forEach(function (file) {
                var fileSettings = new Settings("/files/" + file.id + "?format=json");
                request(fileSettings, function (error, response, fileString) {
                    var file = JSON.parse(fileString);
                    //console.log(fileString);
                    //console.log("=================================================================");
                });
                var contentsSettings = new Settings("/files/" + file.id + "/contents?format=json");
                request(contentsSettings, function (error, response, contentsString) {
                    var contents = JSON.parse(contentsString);
                    //console.log(contentString);
                    //console.log("=================================================================");
                    contents.forEach(function (content) {
                        var contentSettings = new Settings("/files/" + file.id + "/contents/" + content.id + "?format=json");
                        request(contentSettings, function (error, response, contentString) {
                            var content = JSON.parse(contentString);
                            dal.insertDevice(new Device(content.id, content.mac_address, content.datetime, content.rssi, drone.id));
                            //console.log(contentString);
                            //console.log("=================================================================");
                        });
                    });
                });
            });
        });
    });
});
