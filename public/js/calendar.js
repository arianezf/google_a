var string_eventos = [];
var socket = io();

$(function () {

    var decoded = decodeURIComponent(window.location.search);
    decoded = decoded.substring(1);
    var queries = decoded.split("&");
    queries[0] = queries[0].substring(6);

    var user_sin = quitarelpunto(queries[0]);
    console.log(user_sin);

    document.getElementById("mostrar_usuario").innerHTML = queries[0];

    var json_get_events = {
        uid: user_sin
    };

    socket.emit('onopen', json_get_events);

    socket.on('onopen', function (evento_send) {
        console.log(evento_send);
        string_eventos.push(evento_send);
        console.log("recibido");
    });

    $('#calendar').fullCalendar({
        editable: true,
        eventLimit: true,
        eventLimitText: "m�s",
        selectable: true,

        dayClick: function (date, jsEvent, view) {
            var prueba = prompt('Introduza el evento');
            if(prueba != '' && prueba != null)
            {
              var insert = {
                  user: user_sin,
                  id: prueba,
                  title: prueba,
                  start: date,
                  allDay: true
              }
              socket.emit('save_event', insert);
              if (prueba != null)
                  $('#calendar').fullCalendar('renderEvent', insert, true);

              $(this).css('background-color', 'light blue');
            }
            else
            {
              alert('Introduzca un título para el evento.');
            }
        },

        eventClick: function(event) {
            var sel;
            if (confirm("Desea borrar este evento del calendario?\nEvento: " + event.title)) {
                $('#calendar').fullCalendar('removeEvents', event.title);
                console.log("user_sin: " + user_sin);
                var del = {
                    uid: user_sin,
                    title: event.title,
                    id: event.id
                }

                socket.emit('erase_event', del);
            }
        },

        events: string_eventos,

        defaultView: 'month',

        loading: function (isLoading,view) {
            if(isLoading)
            for (var i = 0; i < string_evento.length; i++)
                    $('#calendar').fullCalendar('renderEvent', string_eventos[i], true);
            else {
                console.log("Error al cargar los eventos");
            }
        },
    });
});

function quitarelpunto(cadena) {
    return cadena.replace(/\./g, '');
}

function cargar_eventos(){
  console.log('Cargando eventos...');
  for (var i = 0; i < string_eventos.length;i++)
  {
      $('#calendar').fullCalendar('renderEvent', string_eventos[i], true);
      console.log(string_eventos[i]);
  }
}

function log_out(){
  firebase.auth().signOut().then(function() {
      alert('Te has desonectado correctamente');
      window.location.replace('logreg.html');
  })
  .catch(function(error) {
      alert('Something went wrong');
      console.log(error);
  });
}
