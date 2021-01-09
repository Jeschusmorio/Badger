const ownUserID = 1;
var currentContactID;
//$ -> JQuery; $function -> die Funktion wird ausgeführt sobald alle Elemente geladen sind
//JQuery-Syntax: $(Selector).function()
$(function () {
    var socket = io();
    //hier wird die Seite geladen =>
    //eigenes Profil vom Server anfragen und darstellen (oben links)
    socket.emit("requestOwnProfile", ownUserID);
    socket.on("loadOwnProfile", (ownUser) => {
        let htmlString = "<div class=\"profile\">" +
            "<img src=\"img/user.png\" height=\"35px\" width=\"35px\">" + ownUser[0].username +
            "#" + ownUserID +
            "</div>";
        $("#ownUser").append(htmlString);
    });
    //Kontakte vom Server anfragen und darstellen
    socket.emit("requestContacts", ownUserID);
    socket.on("loadContacts", (contactUsers) => {
        contactUsers.forEach(contactUser => {
            let htmlString = "<div class=\"profile contact\" id=\"" + contactUser[0].userID + "\">" +
                "<img src=\"img/user.png\" height=\"35px\" width=\"35px\">" + contactUser[0].username +
                "#" + contactUser[0].userID +
                "</div>";
            //console.log(contactUser[0].username);
            $("#contactBox").append(htmlString);
        });
        //der erste Kontakt soll beim Laden der Seite angezeigt werden
        socket.emit("showChatHistory", ownUserID, contactUsers[0][0].userID, currentContactID);
    });
    //alle Abfragen vom Server =>
    socket.on("getSocketID", () => {
        socket.emit("saveSocketID", ownUserID, socket.id); //Server speichert socket.id mit userID
    });
    //EventHandler, wenn der Text der Form submitted wird
    $(document).on("submit", function (eventHandler) {
        eventHandler.preventDefault(); //Reload der Seite wird verhindert
        let message = $("#message").val();
        if (message != "") {
            //ruft das Event 'chat-message' beim Server auf und sendet als Parameter die Nachricht
            socket.emit("chatMessage", message, currentContactID);
            $("#message").val(''); //das Textfeld wird entleert
        }
    });
    socket.on("chatMessage", (message) => {
        $("#chat-messages").append("<li>" + message + "</li>");
        //JQuery.scrollTop(pxl) -> ändert Position der Scrollbar um die angegebene Pixelzahl nach unten
        //[0] -> wählt das DOM-Element aus (Document Object Model)
        //JS.scrollHeight -> liefert die tatsächliche Höhe der Elemente in der Scrollbar (auch unsichtbaren Content)
        $("#message-box").scrollTop($("#message-box")[0].scrollHeight); //falls neue Nachrichten kommen, ist die Scrollbar ganz unten
    });
    $(document).on("click", ".contact", function (eventHandler) {
        eventHandler.preventDefault();
        $("#chat-messages").empty(); //löscht alle Nachrichten, die momentan im Chatbereich sind
        let contactUserID = Number($(this).attr("id"));
        socket.emit("showChatHistory", ownUserID, contactUserID, currentContactID);
    });
    socket.on("showChatHistory", (messages, contactID) => {
        //Beim Nutzer wird der Kontakt, den er gerade geöffnet hat, gespeichert
        currentContactID = contactID;
        console.log(currentContactID);
        //Dann werden alle Nachrichten laut Datenbank angezeigt
        for (let i in messages) {
            $("#chat-messages").append("<li>" + messages[i].message + "</li>");
        }
    });
});
//# sourceMappingURL=index.js.map