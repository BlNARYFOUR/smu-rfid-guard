"use strict";

//const SERVER_URL = "backend.smu-rfid.local";
const SERVER_URL = "192.168.0.109";

let vehicleId = null;
let vehicleTag = null;
let vehicleTimeout = null;
let doubleClickBegin = null;

let ws = null;

document.addEventListener("DOMContentLoaded", init);

function init(e) {
    ws = new WebSocket("ws://" + SERVER_URL + ":4321");

    ws.addEventListener("open", onWSOpen);
    ws.addEventListener("close", onWSClose);
    ws.addEventListener("error", onWSError);
    ws.addEventListener("message", onWSMessage);

    nextVehicle();

    document.addEventListener("click", onClick);
}

function onWSOpen(e) {
    console.log("Connection opened!");

    if(ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
            address: "smugps.actions.connect",
            data: {
                name: "Guard"
            }
        }));
    }
}

function onWSClose(e) {
    console.log("Connection closed!");
}

function onWSError(e) {
    console.log("Error occurred!");
}

function onWSMessage(e) {
    const data = JSON.parse(e.data);

    console.log("Message received:", data);

    if(data.address === "smugps.actions.tag") {
        onTagMessage(data.data.tag);
    } else if(data.address === "smugps.actions.detail") {
        onDetailMessage(data.data.vehicle);
    }
}

function onTagMessage(tag) {
    console.log("NEXT TAG ACCEPTED");

    vehicleId = null;
    vehicleTag = tag;

    ws.send(JSON.stringify({
        address: "smugps.actions.detail",
        data: {
            tag: tag
        }
    }));
}

function onDetailMessage(vehicle) {
    if(vehicle !== null) {
        document.querySelector('#owner_pic').src = "http://" + SERVER_URL + "/api/vehicles/owners/" + vehicle.vehicle_owner.id + "/picture";

        vehicleId = vehicle.id;

        document.querySelector('#detail').innerHTML = "<h4 class=\"pb-2 text-light font-weight-bold\">Owner</h4>\n" +
            "<div class=\"row pb-1\">\n" +
            "   <span class=\"text-primary font-weight-bold col-2\">Name:</span><span class=\"col-10\">" + vehicle.vehicle_owner.first_name + " " + (vehicle.vehicle_owner.middle_name ? vehicle.vehicle_owner.middle_name + " " : "") + vehicle.vehicle_owner.last_name + "</span>\n" +
            "</div>\n" +
            "<div class=\"row pb-1\">\n" +
            "   <span class=\"text-primary font-weight-bold col-2\">Type:</span><span class=\"col-4\">" + vehicle.vehicle_owner.owner_type + "</span>\n" +
            "   <span class=\"text-primary font-weight-bold col-2\">ID:</span><span class=\"col-4\">" + (vehicle.vehicle_owner.id_number ? vehicle.vehicle_owner.id_number : "/") + "</span>\n" +
            "</div>\n" +
            "<h4 class=\"mt-5 pb-2 text-light font-weight-bold\" title=\"" + (vehicle.pass_valid ? "Vehicle Pass Active" : "Vehicle Pass Invalid") + "\"><span class=\"mr-2 pt-1 pb-1 font-weight-light\">" + (vehicle.pass_valid ? "&#10004;" : "&#10060;") + "</span>Vehicle</h4>\n" +
            "<div class=\"row pb-1\">\n" +
            "   <span class=\"text-primary font-weight-bold col-2\">Type:</span><span class=\"col-4\">" + vehicle.vehicle_type + "</span>\n" +
            "   <span class=\"text-primary font-weight-bold col-2\">Model:</span><span class=\"col-4\">" + vehicle.model + "</span>\n" +
            "</div>\n" +
            "<div class=\"row pb-1\">\n" +
            "   <span class=\"text-primary font-weight-bold col-2\">Plate:</span><span class=\"col-4\">" + vehicle.plate_number + "</span>\n" +
            "   <span class=\"text-primary font-weight-bold col-2\">Licence:</span><span class=\"col-4\">" + vehicle.licence_number + "</span>\n" +
            "</div>";

        if(vehicle.vehicle_owner.is_vip) {
            document.querySelector('#vip').classList.add('active');
        } else {
            document.querySelector('#vip').classList.remove('active');
        }
    } else {
        document.querySelector('#vip').classList.remove('active');
        document.querySelector('#owner_pic').src = "assets/images/unknown-vehicle.jpg";
        document.querySelector('#detail').innerHTML = "<h4 class=\"pb-2 font-weight-bold\">Vehicle is not registered.</h4>";
    }

    acceptVehicle();
    vehicleTimeout = setTimeout(nextVehicle, 255000);
}

function acceptVehicle() {
    if(ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
            address: "smugps.actions.accept",
            data: {
                vehicle_id: vehicleId,
                rfid_tag: vehicleTag
            }
        }));
    } else {
        alert("Could not log the vehicle. Try reloading the page.");
    }
}

function nextVehicle() {
    clearTimeout(vehicleTimeout);
    document.querySelector('#vip').classList.remove('active');
    document.querySelector('#owner_pic').src = "assets/images/rfid-waiting.gif";
    document.querySelector('#detail').innerHTML = "<h4 class=\"pb-2 text-muted font-weight-bold\">Waiting for a vehicle...</h4>";
}

function onClick(e) {
    if(doubleClickBegin === null) {
        doubleClickBegin = new Date().getTime();
        //console.log(doubleClickBegin);
    } else {
        let now = new Date().getTime();
        let timeDiff = now - doubleClickBegin;
        console.log(timeDiff);
        doubleClickBegin = now;

        if(timeDiff < 250) {
            nextVehicle();
        }
    }
}
