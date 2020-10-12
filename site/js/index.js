const express = require('express'); //NodeJS-Methode -> ladet express-Modul in die Datei
const app = express(); //erstellt eine express-Application (Objekt)
const http = require('http').createServer(app);
const port = 3000;
const path = require('path'); //leichtes Joinen von Dateipfaden

app.use(express.static(path.join(__dirname, '..\\'))); //ermöglicht das Verwenden von Dateien aus dem Überverzeichnis (site) -> so ziemlich alle Dateien

//HTTP-Get Methode fordert Daten vom Server an (Parameter: Dateipfad und Callback-Methode)
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, '..\\index.html')) //res.send -> sendet HTTP-Response (z.B.: HTML mit sendFile)
 });

 //startet Server-listening für connections auf dem Port und führt Methode aus
 http.listen(port, () => {
   console.log(`Example app listening at http://localhost:${port}`)
 });