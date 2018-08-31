var express = require('express');
var app = express();
var path = require('path');
var port = process.env.PORT || 3000;
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var admin = require("firebase-admin");
var serviceAccount = require('./dsi-pfinal-firebase-adminsdk-nrdcz-c7d80f3fb7.json');
//import firebase from 'firebase'

//Parte de la autenticación del SDK


var defaultApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dsi-pfinal.firebaseio.com"
});

// Initialize the default app
console.log(defaultApp.name);  // '[DEFAULT]'

// Retrieve services via the defaultApp variable...
var defaultAuth = defaultApp.auth();
var defaultDatabase = defaultApp.database();


app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

http.listen(port, () => {
  console.log('Server funcionando y escuchando en el localhost:' + port);
});


io.on('connection', function (socket) {

    socket.on('onopen', function (data) {

        var uid = data.uid;
        console.log("en el onopen " + uid);
        var db = admin.database();
        var ref = db.ref("server/events/" + uid);

        ref.on("child_added", function (snapshot) {
            console.log(snapshot.val().id);
            var id = snapshot.val().id;
            var title = snapshot.val().title;
            var start = snapshot.val().start;
            var allDay = snapshot.val().allDay;
            console.log("id " + id);
            var evento_send = {
                id: id,
                title: title,
                start: start,
                allDay: allDay
            }
            socket.emit('onopen', evento_send);

        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        })
    });

    socket.on('registro', function (data) {

        console.log('Registrando usuario nuevo...');

        var nombre_usuario = data.nombre_u;
        console.log(nombre_usuario);

        var apellidos_usuario = data.apellidos_u;
        console.log(apellidos_usuario);

        var email_usuario = data.email_u;
        console.log(email_usuario);

        var pass_usuario = data.pass_u;
        console.log('Registrando usuario nuevo...');

        defaultAuth.createUser({
            uid: email_usuario,
            email: email_usuario,
            password: pass_usuario
        })
            .then(function (userRecord) {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log("Successfully created new user:", userRecord.uid);

            })
            .catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                if (errorCode == "auth/weak-password")
                    alert("La contraseña es débil.");
                else if (errorCode == "auth/email-already-in-use")
                    alert("El correo ya está en uso.");
                else
                    console.log("Error creating new user:", error);
            });

        var db = admin.database();

        var sin = quitarelpunto(email_usuario);
        console.log(" sin: " + sin);
        db.ref('server/users/' + sin).set({
            Apellidos: apellidos_usuario,
            Correo_electronico: email_usuario,
            Nombre: nombre_usuario,
            Contraseña: pass_usuario
        });

        TokenPersonalizado(email_usuario, socket);
    });

    socket.on('login', function (data) {

        var email_usuario_l = data.email_u;
        var pass_usuario_l = data.pass_u;
        var db = admin.database();
        var ref = db.ref("server/users");

        // Attach an asynchronous callback to read the data at our posts reference
        ref.orderByChild("Correo_electronico").on("child_added", function (snapshot) {

            var correo_electronico = snapshot.val().Correo_electronico;
            var contraseña = snapshot.val().Contraseña;
            console.log(correo_electronico);
            console.log(contraseña);

            if (correo_electronico === email_usuario_l)
                if (contraseña === pass_usuario_l) {

                    TokenPersonalizado(email_usuario_l, socket);

                }
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    });

    socket.on('save_event', function (data) {

        var id = data.id;
        var title = data.title;
        var start = data.start;
        var user = data.user;
        console.log("ID: " + id + " title " + title + " start " + start);

        //Guardando el evento en el servidor

        var db = admin.database();

        db.ref('server/events/' + user).push({
            id: id,
            title: title,
            start: start,
            allDay: true,
        });
    });

    socket.on('erase_event', function (data) {
        var title = data.title;
        var id = data.id;
        var uid = data.uid;
        var db = admin.database();
        var ref = db.ref("server/events/" + uid);
        console.log("evento que se va a borrar: " + title + " " + uid);
        ref.orderByChild("id").on("child_added", function (snapshot) {

            console.log("titulo " + snapshot.val().title);
            if (snapshot.val().title === title) {
                snapshot.ref.remove();
            }
        })
    });
});

function TokenPersonalizado(uid, socket) {

    admin.auth().createCustomToken(uid).then(function (customToken) {
        // Send token back to client

        socket.emit('customToken',customToken);

    })
.catch(function (error) {
    console.log("Error creating custom token:", error);
});
}

function quitarelpunto(cadena) {
    return cadena.replace(/\./g,'');
}
