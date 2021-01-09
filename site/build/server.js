const express = require("express"); //NodeJS-Methode -> ladet express-Modul in die Datei
const app = express(); //erstellt eine express-Application (Objekt)
const http = require("http").createServer(app);
const port = 80; //Standard HTTP Port
const path = require("path"); //leichtes Joinen von Dateipfaden
const socketio = require("socket.io"); //NodeJS HTTP Server Socket.io
const io = socketio(http);
const mysql = require("mysql");
const userIDtoSocketID = new Map();
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
        return this.dbcon.query(stm, function (err, result) {
            if (err) {
                console.log("Error in SQL-Syntax: " + stm);
                return;
            }
            else {
                callback(result);
            }
        });
    }
    insertQuery(stm) {
        this.dbcon.query(stm, function (err) {
            if (err) {
                console.log("Error in SQL-Syntax: " + stm);
            }
        });
    }
    insertMessage(message) {
        let query = "";
        this.insertQuery(query);
    }
    showTables(callback) {
        let query = "show tables;";
        this.selectQuery(query, (err, result) => {
            if (err) {
                console.log("Keine Tabellen in der Datenbank vorhanden!");
            }
            else {
                callback(result);
            }
        });
    }
    selectMessages(contactID, callback) {
        let query = "select message from message where contactID = " + contactID + " order by messageDateTime asc;";
        this.selectQuery(query, (result) => {
            callback(result);
        });
    }
    //Rekursive Funktion da die Datenbank pro Contact zwei Nutzer speichert (zwei UserIDs)
    //Wenn ein Fehler beim Aufruf mit userID1 = x und userID2 = y auftritt, werden diese beiden
    //Positionen vertauscht und die Funktion ein zweites Mal aufgerufen
    getCertainContactID(userID1, userID2, recursionCounter, callback) {
        recursionCounter -= 1;
        //erstmal überprüfen, ob zwei verschiedene userIDs eingegeben wurden
        if (userID1 == userID2) {
            console.log("Zwei verschiedene User angeben!");
            return;
        }
        let query = "select contactID from contact where userID1 = " + userID1 + " and userID2 = " + userID2 + ";";
        //Query ausführen -> contactID abfragen
        this.selectQuery(query, (result) => {
            //wenn das Result leer ist (keine contactID gefunden) gibt es 2 Möglichkeiten:
            if (typeof (result[0]) === "undefined") {
                //Wenn dies erst der erste Methodenaufruf ist, wird die Funktion noch ein zweites
                //Mal ausgeführt und die userIDs vertauscht. Dies ist wegen der Datenbankstruktur
                //notwendig, da bei der contact-Tabelle, die jeweiligen userIDs in keiner bestimmten
                //Reihenfolge abgespeichert werden => nochmal schauen, ob der Kontakt bei vertauschten
                //userIDs vorhanden ist
                if (recursionCounter > 0) {
                    this.getCertainContactID(userID2, userID1, recursionCounter, (result) => {
                        callback(result);
                    });
                    return;
                }
                //falls die contactID nicht gefunden wurde und die Methode auch schon mit vertauschten
                //userIDs aufgerufen wurde, liegt tatsächlich kein Kontakt zwischen den beiden Usern vor
                else {
                    console.log("Kein Kontakt zwischen den 2 Nutzern!");
                    return;
                }
            }
            //wenn die contactID gefunden wurde, wird diese auch returned
            else {
                callback(result[0].contactID);
            }
        });
    }
    getContactUserIDs(userID, callback) {
        let query = "select userID1, userID2 from contact where userID1 = " + userID + " or userID2 = " + userID + ";";
        this.selectQuery(query, (result) => {
            //durch das select erhält man zwei Tabellen (userID1 und userID2) für jeden Kontakt indem die gegebene
            //userID vorhanden ist (ob diese nun zu userID1 oder userID2 gehört ist unbekannt)
            //es wird ein Array erstellt in dem alle userIDs, welche nicht die gegebene ist gespeichert werden
            let contactUserIDs = [];
            //alle Kontakte von userID werden mit einer Schleife durchgangen. Danach wird überprüft zu welcher Spalte
            //userID gehört und jeweils der Datenwert der anderen Spalte in den Array gespeichert
            for (let i in result) {
                if (result[i].userID1 === userID)
                    contactUserIDs.push(result[i].userID2);
                else
                    contactUserIDs.push(result[i].userID1);
            }
            //anschließend erhält man ein Array mit allen userIDs mit den die gegebene userID in Kontakt steht
            callback(contactUserIDs);
        });
    }
    getUserByID(userID, callback) {
        let query = "select userID, username, profilePicture from user where userID = " + userID + ";";
        this.selectQuery(query, (result) => {
            callback(result);
        });
    }
}
function getUserIDBySocketID(socketID, callback) {
    for (let [key, value] of userIDtoSocketID) {
        if (value === socketID) {
            callback(key);
        }
    }
}
var db = new Database("badger", "root");
//on() -> EventHandler; connect -> Event; Callback-Methode
//wird ausgeführt, wenn eine Socket.io-Connection aufgebaut wird (socket -> repräsentiert die aktuelle Socket Verbindung zum Client)
io.on("connect", (socket) => {
    //Server speichert userID und SocketID in einer Map
    socket.emit("getSocketID");
    socket.on("saveSocketID", (userID, socketID) => {
        userIDtoSocketID.set(userID, socketID);
        console.log("User #" + userID + " connected!");
    });
    //wird ausgeführt, wenn ein user auf Client-Seite (socket) disconnected
    socket.on("disconnect", () => {
        //Wennn der User disconnected, wird sein Eintrag in der SocketID-Map gelöscht
        getUserIDBySocketID(socket.id, (userID) => {
            console.log("User #" + userID + " disconnected!");
            userIDtoSocketID.delete(userID);
        });
    });
    //wird ausgeführt, wenn ein user eine Nachricht sendet
    //io.emit() leitet die Nachricht an alle verbundenen Sockets weiter (auch an den der sie sendet)
    //socket.emit leitet die Nachricht nur an den Socket weiter, welcher gerade mit dem Server kommuniziert
    //socket.to([roomID]).emit() leitet die Nachricht an den angegebenen Room weiter
    socket.on("chatMessage", (message, contactID) => {
        //db.insertMessage(message);
        //leitet Nachricht an alle Chatpartner weiterleiten, welche sich momentan in dem Raum befinden
        //außer sich selbst
        socket.to(contactID).emit("chatMessage", message);
        //deshalb nochmal die Nachricht an den User weiterleiten, welcher sie gesendet hat
        socket.emit("chatMessage", message);
    });
    socket.on("showChatHistory", (userID1, userID2, currentContactID) => {
        //letzten Chatroom verlassen
        socket.leave(currentContactID);
        db.getCertainContactID(userID1, userID2, 2, (contactID) => {
            //neuen Chatroom betreten
            socket.join(contactID);
            db.selectMessages(contactID, (messages) => {
                //der Chatverlauf wird für den Nutzer der den Kontakt auswählt angezeigt
                socket.emit("showChatHistory", messages, contactID);
            });
        });
    });
    socket.on("requestOwnProfile", (userID) => {
        db.getUserByID(userID, (ownUser) => {
            socket.emit("loadOwnProfile", ownUser);
        });
    });
    socket.on("requestContacts", (userID) => {
        db.getContactUserIDs(userID, (contactUserIDs) => {
            let contactUsers = [];
            //nachdem man die UserIDs der Kontakte hat, werden die User-Objekte der Datenbank mit der UserID abgefragt
            //und in den Array contactUsers abgespeichert
            contactUserIDs.forEach(contactUserID => {
                db.getUserByID(contactUserID, (user) => {
                    contactUsers.push(user);
                    //ursprüngliches Problem: contactUsers bleibt leer, wenn dieser Array nach der for-Schleife an den
                    //Client gesendet wird, da die for-Schleife nicht auf den SQL-Call wartet und einfach den nächsten
                    //Durchlauf startet
                    //nicht die schönste Lösung, aber es funktioniert:
                    //sobald die Arrays gleich lang sind (der letzte Durchlauf) wird contactUSers in der Schlelife
                    //an den Client weiter gesendet
                    if (contactUsers.length === contactUserIDs.length) {
                        socket.emit("loadContacts", contactUsers);
                    }
                });
            });
        });
    });
});
app.use(express.urlencoded({
    extended: true //damit können Daten mit POST weitergesendet werden
}));
app.use(express.static(path.join(__dirname, "..\\"))); //ermöglicht das Verwenden von Dateien aus dem Überverzeichnis (site) -> so ziemlich alle Dateien
//HTTP-Get Methode fordert Daten vom Server an (Parameter: Dateipfad und Callback-Methode)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "..\\index.html")); //res.send -> sendet HTTP-Response (z.B.: HTML mit sendFile)
});
//startet Server-listening für connections auf dem Port und führt Methode aus
http.listen(port, () => {
    console.log("Badger listening at http://localhost:" + port);
});
//# sourceMappingURL=server.js.map