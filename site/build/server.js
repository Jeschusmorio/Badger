const path = require("path"); //leichtes Joinen von Dateipfaden
const express = require("express"); //NodeJS-Methode -> ladet express-Modul in die Datei
const app = express(); //erstellt eine express-Application (Objekt)
const https = require("https");
const fs = require("fs"); //erlaubt Zugriff aufs File System
const privateKey = fs.readFileSync(path.join(__dirname, "..\\sslcert/server.key"), "utf8");
const certificate = fs.readFileSync(path.join(__dirname, "..\\sslcert/server.cert"), "utf8");
const credentials = { key: privateKey, cert: certificate }; //speichert key und certificate
const server = https.createServer(credentials, app);
const port = 80; //Standard HTTP Port
const socketio = require("socket.io"); //NodeJS HTTP Server Socket.io
const io = socketio(server);
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const saltRounds = 10;
//const userIDtoSocketID = new Map();
var clientUserID;
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
    updateQuery(stm) {
        this.dbcon.query(stm, function (err) {
            if (err) {
                console.log("Error in SQL-Syntax: " + stm);
            }
        });
    }
    insertMessage(message, contactID, userID) {
        let query = "insert into message (contactID, userID, message) values " +
            "(" + contactID + ", " + userID + ", '" + message + "');";
        this.updateQuery(query);
    }
    insertContact(userID1, userID2) {
        let query = "insert into contact (userID1, userID2) values " +
            "(" + userID1 + ", " + userID2 + ");";
        this.updateQuery(query);
    }
    insertUser(username, email, password, callback) {
        //hashen des Passworts
        let hash = bcrypt.hashSync(password, saltRounds);
        //speichern in die Datenbank (hash wird für Password verwendet)
        let query = "insert into user (email, username, password) values " +
            "('" + email + "', '" + username + "', '" + hash + "');";
        this.updateQuery(query);
        //userID des neu erstellten Users aus der Datenbank holen und in der
        //callback-Methode returnen
        db.getUserByEmail(email, (result) => {
            callback(result[0].userID);
        });
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
        let query = "select userID, message from message where contactID = " + contactID + " order by messageDateTime asc;";
        this.selectQuery(query, (result) => {
            callback(result);
        });
    }
    deleteContact(contactID, callback) {
        let query = "delete from contact where contactID = " + contactID + ";";
        this.updateQuery(query);
        callback();
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
                    callback(-1); //unlogischer Wert (-1) wird returned, wenn kein Kontakt vorliegt
                }
            }
            //wenn die contactID gefunden wurde, wird diese auch returned
            else {
                callback(result[0].contactID);
            }
        });
    }
    //liefert einen Array mit allen Kontakten, mit denen die mitgegebene UserID in Verbindung steht
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
    getUserByEmail(email, callback) {
        let query = "select * from user where email = '" + email + "';";
        this.selectQuery(query, (result) => {
            callback(result);
        });
    }
    //liefert true, wenn es einen user mit der mitgegebenen userID gibt, ansonsten false
    userIDExists(userID, callback) {
        let query = "select count(*) as numberOfUsers from user where userID = " + userID + ";";
        this.selectQuery(query, (result) => {
            //wenn die Anzahl der user mit der angegebenen UserID 1 beträgt existiert dieser User -> true
            //ansonsten (bei 0) existiert dieser User nicht -> false
            callback(result[0].numberOfUsers == 1);
        });
    }
    //liefert die userID mit zusammengehörigen E-Mail und Passwort zurück
    //falls diese nicht zussammenpassen wird für die userID -1 returned
    loginIsValid(email, password, callback) {
        let query = "select password from user where email = '" + email + "';";
        this.selectQuery(query, (hashPassword) => {
            //wenn ein User mit dieser Email existiert (nicht undefined ist), zuerst das Passwort überprüft werden
            if (hashPassword[0]) {
                //überprüfen ob das Passwort übereinstimmt
                //wenn ja, ist result true
                let result = bcrypt.compareSync(password, hashPassword[0].password);
                //wenn ja, anhand der E-Mail Adresse die userID von der Datenbank holen
                if (result) {
                    db.getUserByEmail(email, (user) => {
                        //danach diese an die callback-Funktion der loginIsValid-Methode übergeben
                        callback(user[0].userID);
                    });
                }
                //ansonsten soll -1 als Fehlerwert returned werden
                else {
                    callback(-1);
                }
            }
            //ansonsten soll -1 als Fehlerwert returned werden
            else {
                callback(-1);
            }
        });
    }
    //liefert true, wenn es einen user mit der mitgegebenen E-Mail gibt, ansonsten false
    emailExists(email, callback) {
        let query = "select count(*) as numberOfUsers from user where email = '" + email + "';";
        this.selectQuery(query, (result) => {
            //wenn die Anzahl der user mit der angegebenen E-Mail 1 beträgt existiert dieser User -> true
            //ansonsten (bei 0) existiert dieser User nicht -> false
            callback(result[0].numberOfUsers == 1);
        });
    }
}
/*
function getUserIDBySocketID(socketID, callback) {
  for (let [key, value] of userIDtoSocketID) {
    if (value === socketID) {
      callback(key);
    }
  }
}
*/
var db = new Database("badger", "root");
//on() -> EventHandler; connect -> Event; Callback-Methode
//wird ausgeführt, wenn eine Socket.io-Connection aufgebaut wird (socket -> repräsentiert die aktuelle Socket Verbindung zum Client)
io.on("connect", (socket) => {
    socket.emit("setOwnUserID", clientUserID);
    console.log("User #" + clientUserID + " connected!");
    /*
    //Server speichert userID und SocketID in einer Map
    socket.emit("getSocketID");
    socket.on("saveSocketID", (userID, socketID) => {
      userIDtoSocketID.set(userID, socketID);
      console.log("User #" + userID + " connected!");
    });
    */
    //wird ausgeführt, wenn ein user auf Client-Seite (socket) disconnected
    socket.on("disconnect", () => {
        /*
        //Wennn der User disconnected, wird sein Eintrag in der SocketID-Map gelöscht
        getUserIDBySocketID(socket.id, (userID) => {
          console.log("User #" + userID + " disconnected!");
          userIDtoSocketID.delete(userID);
        });
        */
        console.log("User #" + clientUserID + " disconnected!");
    });
    //wird ausgeführt, wenn ein user eine Nachricht sendet
    //io.emit() leitet die Nachricht an alle verbundenen Sockets weiter (auch an den der sie sendet)
    //socket.emit leitet die Nachricht nur an den Socket weiter, welcher gerade mit dem Server kommuniziert
    //socket.to([roomID]).emit() leitet die Nachricht an alle Nutzer eines Rooms weiter, bis auf den Nutzer
    //                            der diese Methode aufgerufen hat
    socket.on("chatMessage", (message, contactID, userID) => {
        //Chatnachricht in die Datenbank speichern
        db.insertMessage(message, contactID, userID);
        //leitet Nachricht an alle Chatpartner weiterleiten, welche sich momentan in dem Raum befinden
        //außer sich selbst
        socket.to(contactID).emit("chatMessage", message, userID);
        //deshalb nochmal die Nachricht an den User weiterleiten, welcher sie gesendet hat
        socket.emit("chatMessage", message, userID);
    });
    socket.on("showChatHistory", (ownUserID, chatPartnerUserID, currentContactID) => {
        //letzten Chatroom verlassen
        socket.leave(currentContactID);
        db.getCertainContactID(ownUserID, chatPartnerUserID, 2, (contactID) => {
            if (contactID != -1) {
                //neuen Chatroom betreten
                socket.join(contactID);
                db.selectMessages(contactID, (messages) => {
                    //user-Objekt des Chatpartners abfragen
                    db.getUserByID(chatPartnerUserID, (chatPartner) => {
                        //der Chatverlauf wird für den Nutzer der den Kontakt auswählt angezeigt
                        socket.emit("showChatHistory", messages, contactID, chatPartner);
                    });
                });
            }
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
    socket.on("removeFriend", (contactID) => {
        db.deleteContact(contactID, () => {
            socket.emit("reloadPage");
        });
    });
    socket.on("addFriend", (ownUserID, friendID) => {
        //überprüfen, ob die friendID in der Datenbank existiert
        db.userIDExists(friendID, (userExists) => {
            //falls nicht: fehlermeldung
            if (!userExists) {
                socket.emit("alertErrorMsg", "There is no User with the ID: " + friendID + "!");
            }
            //falls ja, überprüfen ob der User seine eigene UserID eingegeben hat
            else {
                if (ownUserID == friendID) {
                    socket.emit("alertErrorMsg", "You can't befriend yourself! (" + friendID + " is your own UserID)");
                }
                //falls nicht, überprüfen, ob die beiden User schon in Kontakt stehen
                else {
                    db.getCertainContactID(ownUserID, friendID, 2, (contactID) => {
                        //wenn die beiden User schon in Kontakt stehen (also nicht -1 returned wird),
                        //kommt es zu einer Fehlermeldung
                        if (contactID != -1) {
                            socket.emit("alertErrorMsg", "You're already friends with that person!");
                        }
                        //wenn die beiden User noch nicht in Kontakt stehen
                        //wird ein Datenbankeintrag erstellt und die Seite reloaded
                        else {
                            //dieser Fall tritt also nur auf, wenn ein User mit der friendID in der Datenbank existiert,
                            //es sich dabei nicht um die eigene UserID handelt
                            //und die beiden Nutzer noch nicht in Kontakt stehen
                            db.insertContact(ownUserID, friendID);
                            socket.emit("reloadPage");
                        }
                    });
                }
            }
        });
    });
});
app.use(express.urlencoded({
    extended: true //damit können Daten mit POST weitergesendet werden
}));
app.use(express.static(path.join(__dirname, "..\\"))); //ermöglicht das Verwenden von Dateien aus dem Überverzeichnis (site) -> so ziemlich alle Dateien
//HTTP-Get Methode fordert Daten vom Server an (Parameter: Dateipfad und Callback-Methode)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "..\\auth\\login.html")); //res.send -> sendet HTTP-Response (z.B.: HTML mit sendFile)
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, "..\\auth\\register.html"));
});
app.get('/errorRegister', (req, res) => {
    res.sendFile(path.join(__dirname, "..\\auth\\errorRegister.html"));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "..\\auth\\login.html"));
});
app.get('/errorLogin', (req, res) => {
    res.sendFile(path.join(__dirname, "..\\auth\\errorLogin.html"));
});
app.post('/main', (req, res) => {
    res.sendFile(path.join(__dirname, "..\\main.html"));
});
app.post('/loginCheck', (req, res) => {
    let email = req.body.emailInput;
    let password = req.body.passwordInput;
    //überprüfen ob ein User mit der gegebenen email und password existiert
    db.loginIsValid(email, password, (userID) => {
        //wenn ja, wird der user auf die hauptseite geleitet und seine userID gespeichert
        if (userID != -1) {
            clientUserID = userID;
            //der HTTP code 307 wird benötigt, da es sich beim /main-Pfad um einen POST-Request handelt
            //dieser ist kein GET-Request, da man sonst einfach über die URL auf die Seite kommen kann
            //wenn man /main dahinter schreiben würde
            res.redirect(307, '/main');
        }
        //wenn nicht wird er wieder auf die Loginseite geleitet
        else {
            res.redirect('/errorLogin');
        }
    });
});
app.post('/registerCheck', (req, res) => {
    let username = req.body.usernameInput;
    let email = req.body.emailInput;
    let password = req.body.passwordInput;
    let confirmPassword = req.body.confirmPasswordInput;
    //zuerst schauen, ob das Passwort zweimal gleich eingegeben wurde
    //wenn nicht soll der Client wieder auf die RegisterSeite kommen
    if (!(password == confirmPassword)) {
        res.redirect('/errorRegister');
    }
    //ansonsten soll überprüft werden, ob die E-Mail Adresse schon in der Datenbank vorhanden ist
    else {
        db.emailExists(email, (emailExists) => {
            //wenn die E-Mail Adresse schon existiert, wird der User wieder auf die RegisterSeite geleitet
            //und muss eine andere E-Mail Adresser verwenden
            if (emailExists) {
                res.redirect('/errorRegister');
            }
            //ansonsten wird sein Nutzer erstellt und er wird gleich eingeloggt
            else {
                db.insertUser(username, email, password, (userID) => {
                    clientUserID = userID;
                    res.redirect(307, '/main');
                });
            }
        });
    }
});
//startet Server-listening für connections auf dem Port und führt Methode aus
server.listen(port, () => {
    console.log("Badger listening at https://localhost:" + port);
});
//# sourceMappingURL=server.js.map