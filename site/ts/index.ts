var ownUserID;
var currentContactID;
var currentChatPartner;

function printChatMessage(message, userID) {
    //wenn man selbst die Nachricht gesendet hat, wird sie normal angezeigt
    if(userID === ownUserID) {
        $("#chat-messages").append("<li>" + message + "</li>");
    }
    //wenn nicht, ist sie laut der Klasse chatPartnerMessage formattiert
    else {
        $("#chat-messages").append("<li class=\"chatPartnerMessage\">" + message + "</li>");
    }
}

function getUserHTMLString(user) {
    return  "<div class=\"profile\">" + 
                "<img src=\"img/user.png\" height=\"35px\" width=\"35px\">" + user[0].username + "#" + user[0].userID +
            "</div>";
}

function getRandomUserID(max) {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
}

//$ -> JQuery; $function -> die Funktion wird ausgeführt sobald alle Elemente geladen sind
//JQuery-Syntax: $(Selector).function()
$(function () {
    var socket = io();
    
    //hier wird die Seite geladen =>
    //Nutzer bekommt ein zufälliges Account beim Laden (zum Testen)
    //ownUserID = getRandomUserID(4);
    ownUserID = 1;
    //eigenes Profil vom Server anfragen und darstellen (oben links)
    socket.emit("requestOwnProfile", ownUserID);
    socket.on("loadOwnProfile", (ownUser) => {
        let htmlString = getUserHTMLString(ownUser);
        $("#ownUser").append(htmlString);
    });

    //Kontakte vom Server anfragen und darstellen
    socket.emit("requestContacts", ownUserID);
    socket.on("loadContacts", (contactUsers) => {
        contactUsers.forEach(contactUser => {
            let htmlString =    "<div class=\"profile contact\" id=\"" + contactUser[0].userID + "\">" + 
                                    "<img src=\"img/user.png\" height=\"35px\" width=\"35px\">" + contactUser[0].username + 
                                        "#" + contactUser[0].userID + 
                                "</div>";
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
    $(document).on("submit", function(eventHandler) {
        eventHandler.preventDefault(); //Reload der Seite wird verhindert
        let message = $("#message").val();
        if (message != "") {
            //ruft das Event 'chat-message' beim Server auf und sendet als Parameter die Nachricht
            socket.emit("chatMessage", message, currentContactID, ownUserID); 
            $("#message").val(''); //das Textfeld wird entleert
        }
    });
    socket.on("chatMessage", (message, userID) => {
        printChatMessage(message, userID);
        //JQuery.scrollTop(pxl) -> ändert Position der Scrollbar um die angegebene Pixelzahl nach unten
        //[0] -> wählt das DOM-Element aus (Document Object Model)
        //JS.scrollHeight -> liefert die tatsächliche Höhe der Elemente in der Scrollbar (auch unsichtbaren Content)
        $("#message-box").scrollTop($("#message-box")[0].scrollHeight); //falls neue Nachrichten kommen, ist die Scrollbar ganz unten
    });
    $(document).on("click", ".contact", function(eventHandler) {
        eventHandler.preventDefault();
        $("#chat-messages").empty(); //löscht alle Nachrichten, die momentan im Chatbereich sind
        let contactUserID = Number($(this).attr("id"));
        socket.emit("showChatHistory", ownUserID, contactUserID, currentContactID);
    });
    socket.on("showChatHistory", (messages, contactID, chatPartner) => {
        //Beim Nutzer wird der Kontakt, den er gerade geöffnet hat, gespeichert
        currentContactID = contactID;
        //und der ChatParnter
        currentChatPartner = chatPartner[0];

        //Chatpartner oben darstellen
        let htmlString = getUserHTMLString(chatPartner);
        //vorherigen Nutzer entfernen und neuen hinzufügen
        $("#currentChatPartner").empty();
        $("#currentChatPartner").append(htmlString);

        //Dann werden alle Nachrichten laut Datenbank angezeigt
        for (let i in messages) {
            printChatMessage(messages[i].message, messages[i].userID);
        }
    });
    $(document).on("click", ".addFriend", function(eventHandler) {
        
    });
    $(document).on("click", ".removeFriend", function(eventHandler) {
        eventHandler.preventDefault();
        if (confirm("Do you really want to remove " + currentChatPartner.username + " from your Friend-List?")) {
            socket.emit("removeFriend", currentContactID);
        }
    });
    socket.on("reloadPage", () => {
        location.reload();
    });
});