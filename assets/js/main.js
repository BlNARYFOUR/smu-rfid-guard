"use strict";

const SERVER_URL = "backend.smu-rfid.local";

let vehicleId = null;

let getNextTag = true;
let ws = new WebSocket("ws://" + SERVER_URL + ":4321");

ws.addEventListener("open", onWSOpen);
ws.addEventListener("close", onWSClose);
ws.addEventListener("error", onWSError);
ws.addEventListener("message", onWSMessage);

document.addEventListener("DOMContentLoaded", init);

function init(e) {
    document.querySelector('#btn_accept').addEventListener("click", onVehicleAccept);
    document.querySelector('#btn_decline').addEventListener("click", onVehicleDecline);
    document.querySelector('#btn_next').addEventListener("click", onVehicleNext);
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
    if(getNextTag) {
        getNextTag = false;
        console.log("NEXT TAG ACCEPTED");

        ws.send(JSON.stringify({
            address: "smugps.actions.detail",
            data: {
                tag: tag
            }
        }));
    } else {
        console.log("NEXT TAG DECLINED");
    }
}

function onDetailMessage(vehicle) {
    if(vehicle !== null) {
        document.querySelector('#btn_next').disabled = true;
        document.querySelector('#btn_accept').disabled = false;
        document.querySelector('#btn_decline').disabled = false;
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
        }
    } else {
        document.querySelector('#btn_next').disabled = true;
        document.querySelector('#btn_accept').disabled = true;
        document.querySelector('#btn_decline').disabled = false;
        document.querySelector('#owner_pic').src = "assets/images/unknown-vehicle.jpg";
    }
}

function onVehicleAccept(e) {
    if(ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
            address: "smugps.actions.accept",
            data: {
                vehicle_id: vehicleId
            }
        }));
    } else {
        alert("Could not log the vehicle. Try reloading the page.");
        onVehicleDecline(null);
        return;
    }

    onVehicleDeclineOrAccept();
    document.querySelector('#owner_pic').src = "assets/images/accepted.jpg";
    document.querySelector('#detail').innerHTML = "<h4 class=\"pb-2 text-success font-weight-bold\">Vehicle has been accepted.</h4>";
}

function onVehicleDecline(e) {
    onVehicleDeclineOrAccept();
    document.querySelector('#owner_pic').src = "assets/images/declined.jpg";
    document.querySelector('#detail').innerHTML = "<h4 class=\"pb-2 text-danger font-weight-bold\">Vehicle has been declined.</h4>";
}

function onVehicleDeclineOrAccept() {
    document.querySelector('#vip').classList.remove('active');
    document.querySelector('#btn_next').disabled = false;
    document.querySelector('#btn_accept').disabled = true;
    document.querySelector('#btn_decline').disabled = true;
}

function onVehicleNext(e) {
    document.querySelector('#btn_next').disabled = true;
    document.querySelector('#btn_accept').disabled = true;
    document.querySelector('#btn_decline').disabled = true;
    document.querySelector('#owner_pic').src = "assets/images/rfid-waiting.gif";
    document.querySelector('#detail').innerHTML = "<h4 class=\"pb-2 text-muted font-weight-bold\">Waiting for a vehicle...</h4>";

    getNextTag = true;
}
