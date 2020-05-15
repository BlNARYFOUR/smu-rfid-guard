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
        vehicleId = vehicle.id;
        document.querySelector('#owner_pic').src = "http://" + SERVER_URL + "/api/vehicles/owners/" + vehicle.vehicle_owner.id + "/picture";
    } else {
        document.querySelector('#btn_next').disabled = true;
        document.querySelector('#btn_accept').disabled = true;
        document.querySelector('#btn_decline').disabled = false;
        document.querySelector('#owner_pic').src = "assets/images/unknown-vehicle.jpg";
    }
}

function onVehicleAccept(e) {
    document.querySelector('#btn_next').disabled = false;
    document.querySelector('#btn_accept').disabled = true;
    document.querySelector('#btn_decline').disabled = true;
    document.querySelector('#owner_pic').src = "assets/images/accepted.jpg";

    //todo
}

function onVehicleDecline(e) {
    document.querySelector('#btn_next').disabled = false;
    document.querySelector('#btn_accept').disabled = true;
    document.querySelector('#btn_decline').disabled = true;
    document.querySelector('#owner_pic').src = "assets/images/declined.jpg";
}

function onVehicleNext(e) {
    document.querySelector('#btn_next').disabled = true;
    document.querySelector('#btn_accept').disabled = true;
    document.querySelector('#btn_decline').disabled = true;
    document.querySelector('#owner_pic').src = "assets/images/rfid-waiting.gif";

    getNextTag = true;
}
