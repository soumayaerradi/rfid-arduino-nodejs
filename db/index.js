const { Client } = require("pg");
const client = new Client({
    connectionString: "postgresql://localhost/rfid-arduino"
});

client.connect();

module.exports = client;