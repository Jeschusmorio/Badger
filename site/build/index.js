const ownUserID = 1;
//$ -> JQuery; $function -> die Funktion wird ausgeführt sobald alle Elemente geladen sind
//JQuery-Syntax: $(Selector).function()
$(function () {
    var socket = io();
    //EventHandler, wenn der Text der Form submitted wird
    $('form').submit(function (eventHandler) {
        eventHandler.preventDefault(); //Reload der Seite wird verhindert
        let message = $('#message').val();
        if (message != '') {
            //ruft das Event 'chat-message' beim Server auf und sendet als Parameter die Nachricht
            socket.emit('chat-message', message);
            $('#message').val(''); //das Textfeld wird entleert
        }
    });
    socket.on('chat-message', (message) => {
        $('#chat-messages').append('<li>' + message + '</li>');
        //JQuery.scrollTop(pxl) -> ändert Position der Scrollbar um die angegebene Pixelzahl nach unten
        //[0] -> wählt das DOM-Element aus (Document Object Model)
        //JS.scrollHeight -> liefert die tatsächliche Höhe der Elemente in der Scrollbar (auch unsichtbaren Content)
        $('#message-box').scrollTop($('#message-box')[0].scrollHeight); //falls neue Nachrichten kommen, ist die Scrollbar ganz unten
    });
});
function selectContact(contactUserID) {
    var xhttp = new XMLHttpRequest(); //zum senden von HTTP-Requests an den Express-Server
    //wenn der Server antwortet => Antwort soll in der Messagebox angezeigt werden
    xhttp.onreadystatechange = function () {
        //readyState (Status der XMLHttpRequest) == 4: request finished and response is ready
        //readyState == 0: request not initialized
        //status (Status-Nummer einer Request -> sobald Request fertig ist) == 200: "OK"
        //status == 404: "Not Found"
        if (this.readyState == 4 && this.status == 200) {
            var chatHistory = this.responseText;
            for (var i = 0; i < chatHistory.length; i++) {
                $('#chat-messages').append('<li>' + chatHistory[i] + '</li>');
            }
        }
    };
    //methode: POST
    //an: shwoChatHistory
    //arbeitet asynchron: true
    xhttp.open("POST", "showChatHistory", true);
    //setRequestHeader macht in dieser Form das POST der Daten in HTML-Form möglich (ansonsten Werte undefined)
    //header = "Content-type" -> hier z.B. "name"
    //value = "application/x-www-form-urlencoded" -> hier jeweiliger contactName
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("ownUserID=" + ownUserID + "&contactUserID=" + contactUserID);
}
//# sourceMappingURL=index.js.map