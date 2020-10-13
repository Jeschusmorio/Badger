const express = require('express'); //NodeJS-Methode -> ladet express-Modul in die Datei
const app = express(); //erstellt eine express-Application (Objekt)
const http = require('http').createServer(app);
const port = 3000;
const path = require('path'); //leichtes Joinen von Dateipfaden
const socketio = require('socket.io'); //NodeJS HTTP Server Socket.io
const io = socketio(http);

app.use(express.static(path.join(__dirname, '..\\'))); //ermöglicht das Verwenden von Dateien aus dem Überverzeichnis (site) -> so ziemlich alle Dateien

//HTTP-Get Methode fordert Daten vom Server an (Parameter: Dateipfad und Callback-Methode)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..\\index.html')); //res.send -> sendet HTTP-Response (z.B.: HTML mit sendFile)
});

//on() -> EventHandler; connect -> Event; Callback-Methode
//wird ausgeführt, wenn eine Socket.io-Connection aufgebaut wird (socket -> Client-Socket)
io.on('connect', (socket) => {
  console.log('New user connected!');

  //wird ausgeführt, wenn ein user auf Client-Seite (socket) disconnected
  socket.on('disconnect', () => {  
    console.log('A user disconnected!');
  });

  //wird ausgeführt, wenn ein user eine Nachricht sendet
  socket.on('chat-message', (message) => {
    console.log('Message: ' + message);
  });
});

//startet Server-listening für connections auf dem Port und führt Methode aus
http.listen(port, () => {
  console.log('Badger listening at http://localhost:' + port);
});