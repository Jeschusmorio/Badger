function selectContact(contactName) {
    var xhttp = new XMLHttpRequest(); //zum senden von HTTP-Requests an den Express-Server
    //wenn der Server antwortet => Antwort soll in der Messagebox angezeigt werden
    xhttp.onreadystatechange = function () {
        //readyState (Status der XMLHttpRequest) == 4: request finished and response is ready
        //readyState == 0: request not initialized
        //status (Status-Nummer einer Request -> sobald Request fertig ist) == 200: "OK"
        //status == 404: "Not Found"
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("message-box").innerHTML = this.responseText;
        }
    };
    xhttp.open("POST", "showChatHistory");
    //setRequestHeader macht in dieser Form das POST der Daten in HTML-Form möglich (ansonsten Werte undefined)
    //header = "Content-type" -> hier z.B. "name"
    //value = "application/x-www-form-urlencoded" -> hier jeweiliger contactName
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("name=" + contactName);
}
//# sourceMappingURL=index.js.map