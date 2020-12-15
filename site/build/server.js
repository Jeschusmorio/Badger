const express = require('express'); //NodeJS-Methode -> ladet express-Modul in die Datei
const app = express(); //erstellt eine express-Application (Objekt)
const http = require('http').createServer(app);
const port = 80; //Standard HTTP Port
const path = require('path'); //leichtes Joinen von Dateipfaden
const socketio = require('socket.io'); //NodeJS HTTP Server Socket.io
const io = socketio(http);
const mysql = require('mysql');
class Database {
    constructor(database, password) {
        try {
            this.dbcon = mysql.createConnection({
                host: "localhost",
                user: "root",
                password: password,
                database: database
            });
        }
        catch (e) {
            console.log(e);
        }
    }
    selectQuery(stm, callback) {
        this.dbcon.query(stm, function (err, result) {
            if (err)
                throw err;
            return callback(result);
        });
    }
    insertQuery(stm) {
        this.dbcon.query(stm, function (err) {
            if (err)
                throw err;
        });
    }
    insertMessage(message) {
        var query = "...;";
        this.insertQuery(query);
    }
    showTables(callback) {
        var query = "show tables;";
        this.selectQuery(query, function (result) {
            return (callback(result));
        });
    }
}
/*
var dbcon = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "badger"
})

dbcon.connect(function(err) {
  if (err) throw err;
  console.log("Connected to Database!");
  dbcon.query("SHOW TABLES;", function (err, result) {
      if (err) throw err;
      return result;
  })
})
*/
//on() -> EventHandler; connect -> Event; Callback-Methode
//wird ausgeführt, wenn eine Socket.io-Connection aufgebaut wird (socket -> repräsentiert die aktuelle Socket Verbindung zum Client)
io.on('connect', (socket) => {
    console.log('New user connected!');
    //wird ausgeführt, wenn ein user auf Client-Seite (socket) disconnected
    socket.on('disconnect', () => {
        console.log('A user disconnected!');
    });
    //wird ausgeführt, wenn ein user eine Nachricht sendet
    //leitet die Nachricht an alle verbundenen Sockets weiter (auch an den der sie sendet)
    socket.on('chat-message', (message) => {
        //db.insertMessage(message);
        io.emit('chat-message', message);
    });
});
app.use(express.urlencoded({
    extended: true //damit können Daten mit POST weitergesendet werden
}));
app.use(express.static(path.join(__dirname, '..\\'))); //ermöglicht das Verwenden von Dateien aus dem Überverzeichnis (site) -> so ziemlich alle Dateien
//HTTP-Get Methode fordert Daten vom Server an (Parameter: Dateipfad und Callback-Methode)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..\\index.html')); //res.send -> sendet HTTP-Response (z.B.: HTML mit sendFile)
});
//handlet das Ereignis showChatHistory auf Server-Seite
app.post('/showChatHistory', (req, res) => {
    console.log("Chatpartner: " + req.body.name);
    res.end();
});
//startet Server-listening für connections auf dem Port und führt Methode aus
http.listen(port, () => {
    console.log('Badger listening at http://localhost:' + port);
});
var db = new Database("badger", "root");
/*
var tables = "";
db.showTables(function(result) {
  tables = result;
  console.log("Result: ")
  console.log(tables);
});
*/
//# sourceMappingURL=server.js.map