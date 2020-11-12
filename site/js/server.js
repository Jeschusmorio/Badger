const express = require('express'); //NodeJS-Methode -> ladet express-Modul in die Datei
const app = express(); //erstellt eine express-Application (Objekt)
const http = require('http').createServer(app);
const port = 80; //Standard HTTP Port
const path = require('path'); //leichtes Joinen von Dateipfaden
const socketio = require('socket.io'); //NodeJS HTTP Server Socket.io
const io = socketio(http);
const mysql = require('mysql');
const dbcon = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "badger"
})

dbcon.connect(function(err) {
    if (err) throw err;
    console.log("Connected to Database!");
    var sql = "SHOW TABLES;";
    dbcon.query(sql, function (err, result) {
        if (err) throw err;
        console.log(result);
    })
})

app.use(express.static(path.join(__dirname, '..\\'))); //ermöglicht das Verwenden von Dateien aus dem Überverzeichnis (site) -> so ziemlich alle Dateien

//HTTP-Get Methode fordert Daten vom Server an (Parameter: Dateipfad und Callback-Methode)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..\\index.html')); //res.send -> sendet HTTP-Response (z.B.: HTML mit sendFile)
});

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
    io.emit('chat-message', message);
  });
});

//startet Server-listening für connections auf dem Port und führt Methode aus
http.listen(port, () => {
  console.log('Badger listening at http://localhost:' + port);
});