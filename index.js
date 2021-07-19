var app = require('express')();
var http = require('http').Server(app);
var http2 = require('http').Server(app);
var sio = require('socket.io');
var io = sio(http);
var adio = sio(http2);
var EventEmitter = require('events');
var events = new EventEmitter();
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const body_parser = require('body-parser');
const cors = require('cors');
const db = require("./db");
let results = [];

const PORT = 3000;
// const arduino_port = "/dev/cu.usbmodem141101";
//
// var sp = new SerialPort(arduino_port, {
//     baudRate: 9600
// });
//
const parser = new Readline();
// sp.pipe(parser);

var ip = require("ip");
var address = ip.address();
console.log(address);

require('keyscan').make_scanner( (ch) => console.log('Caught ' + ch.parsed) );

app.use(body_parser.urlencoded({extended: true}));
app.use(body_parser.json());
app.use(cors());

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/rfid', async (req, res, next) => {
    let char = '';
    // ioHook.on("keydown", event => {
    //     console.log(event);
    //     let key = event.keycode;
    //     //
    //     char = String.fromCharCode((96 <= key && key <= 105) ? key-48 : key)
    //     console.log(char);
    //     console.log("0xF1" + char.charCodeAt(0).toString(16));
    // });


    res.status(200).json(char);
    // results = await (await db.query("SELECT * FROM rfid")).rows;
    // res.status(200).json(results);
});

app.get('/clear', async (req, res, next) => {
    const clear = await db.query("DELETE FROM rfid RETURNING *");
    res.status(200).json(clear);
});

io.on('connection', function (socket) {
    console.log('Arduino is connected');

    events.on('data', function (data) {
        console.log("--------");
        console.log("RFID: " + data[data.length - 1].code);
        socket.emit('data', data);
    });

    socket.on('disconnect', function () {
        console.log('Arduino disconnected');
        db.query("DELETE FROM rfid");
    });
});

parser.on('data', async function (line) {
    db.query(
        "INSERT INTO rfid (code, date) VALUES ($1,$2) RETURNING *",
        [line.trim(), new Date().toLocaleString()]
    );

    // results = await (await db.query("SELECT * FROM rfid")).rows;

    events.emit('data', results);
});

app.use(function (req, res, next) {
    let err = new Error("Route not Found");
    err.status = 404;
    next(err);
});

if (app.get("env") === "development") {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err.status
        });
    });
}

http.listen(PORT, function () {
    console.log('listening on *:3000');
});

http2.listen(3030, function () {
    console.log('listening for Arduino server on *:3030');
});

app.listen(PORT, address);