var app           = require('express')();
var http          = require('http').Server(app);
var http2         = require('http').Server(app);
var sio           = require('socket.io');
var io            = sio(http);
var adio          = sio(http2);
var EventEmitter  = require('events');
var events        = new EventEmitter();
const SerialPort  = require('serialport')
const Readline    = require('@serialport/parser-readline')
const body_parser = require('body-parser');

const port         = 3000;
const arduino_port = "/dev/cu.usbmodem141101";

var sp = new SerialPort(arduino_port, {
	baudRate: 9600
});

const parser = new Readline();
sp.pipe(parser);

var ip = require("ip");
var a = ip.address();
console.log(a);

app.use(body_parser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	console.log('Arduino is connected');

	events.on('data', function(data) {
        console.log("--------");
        console.log("RFID: " + data.rfid);
		socket.emit('data', data);
    });

	socket.on('disconnect', function() {
		console.log('arduino disconnected');
	});
});

parser.on('data', function(line) {
	events.emit('data', {'label': 'RFID', 'rfid': line.trim()})
});

http.listen(port, function() {
	console.log('listening on *:3000');
});

http2.listen(3030, function() {
	console.log('listening for Arduino server on *:3030');
});

app.listen(port, a);