document.addEventListener('DOMContentLoaded', () => {

    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    var storage = localStorage;

    function leerCookie(nombre) {
        var lista = document.cookie.split(";");
        for (i in lista) {
            var busca = lista[i].search(nombre);
            if (busca > -1) {
                micookie=lista[i]

                var igual = micookie.indexOf("=");
                var valor = micookie.substring(igual+1);

                return valor;
            }
        }
        return false;

    }
    
    if(leerCookie("cookie_username") == false){
        alert("Primero inicia sesion para poder continuar")
        location.href = "http://127.0.0.1:8000/login";
    }
    if(leerCookie("cookie_username") != storage.getItem("storage_username")){
        socket.emit("register", leerCookie("cookie_username"));
    }

    if(leerCookie("cookie_username") == storage.getItem("storage_username")){
        socket.emit("change channel", storage.getItem('channel'), storage.getItem('channel'), storage.getItem("storage_username"));
    }
    


    function cambiar_el_canal()
    {
        // Cada botón que tenga clase btn-link debería emitir un evento "change channel"
        document.querySelectorAll('button.btn-link').forEach(button => {
            button.onclick = () => {
                var channel = button.dataset.channel;
                socket.emit('change channel', storage.getItem('channel'), channel, leerCookie("cookie_username"));
            };
        });

    }

    socket.on('connect', () => {

        // Asegúrese de que se agregue el usuario
        if (!storage.getItem("storage_username"))
        {
            $("#registerModal").modal({backdrop: 'static', keyboard: false});
            document.querySelector("#display").style.display = "none";
        }

        // unirse a un canal si un usuario estaba en ese canal en particular antes de salir
        if (storage.getItem('channel')) {
            socket.emit("change channel", storage.getItem('channel'), storage.getItem('channel'), storage.getItem("storage_username"));
        }
        // De lo contrario, oculta la sección de chat
        else {
            document.querySelector("#chat").style.display = "none";
        }

        // Inicialice el evento onclick de cada botón de canal
        cambiar_el_canal();

    });


    socket.on('register', username => {

        // Guardar nombre de usuario en el almacenamiento local 
        storage.setItem("storage_username", username);

        // Saludar al usuario
        document.querySelector('#display_username').innerHTML = "Welcome, " + storage.getItem('storage_username');

        // Ocultar el registro, una vez registrado mostrar todo lo demás
        document.querySelector("#display").style.display = "block";

        // Centrarse en el campo del nombre del canal
        document.querySelector("#channel").focus();
        
    });

    
    document.querySelector("#create_channel").onsubmit = () => {

        // Obtener el campo del nombre del canal
        const channel = document.querySelector("#channel");
        
        current_channel = "";
        // Obtener el canal actual (si existe) y el nombre de usuario
        current_channel = storage.getItem("channel");
        username =  storage.getItem("storage_username");

        // Emitir crear canal
        socket.emit("create channel", channel.value, current_channel, username);

        // Eliminar el nombre del canal del cuadro de texto
        channel.value = "";
        return false;

    };

    
    socket.on('announce channel', channel => {

        // Crear un botón de canal dentro de un div
        const div = document.createElement('div');
        div.innerHTML = `<button class="btn btn-link" data-channel="${ channel }">${ channel }</button>`;
        document.querySelector('#channels').append(div);

        // Centrarse en el campo de mensaje
        document.querySelector("#message").focus();

        // Inicializar evento onclick de canales
        cambiar_el_canal();
        
    });


    socket.on('alert', message => {
        //Sistema de mensajes
        alert(message);

    });

    
    socket.on('join_channel', data => {

        // Guardar canal en almacenamiento
        storage.setItem('channel', data["channel"]);

        // Borrar área de mensajes
        document.querySelector("#messages").innerHTML = "";

        // Mostrar el nombre del canal en el encabezado
        document.querySelector("#channel_name").innerHTML = data["channel"];

        // Mostrar sección de chat
        document.querySelector("#chat").style.display = "block";

        // Rellene el área de mensajes con los mensajes del canal seleccionado
        var msm;
        for (msm in data["messages"]) {
            const div = document.createElement('div');
            if (data["messages"][msm].user == storage.getItem("username"))
            {
                div.innerHTML = `<div class="jumbotron jumbotron4"><strong style="font-family: sans-serif;">${data["messages"][msm].user}:</strong><div>${data["messages"][msm].msg}</div><small>(${data["messages"][msm].msg_time})</small></div>`;
            }
            else
            {
                div.innerHTML = `<div class="jumbotron jumbotron5"><strong style="font-family: sans-serif;">${data["messages"][msm].user}:</strong><div>${data["messages"][msm].msg}</div><small>(${data["messages"][msm].msg_time})</small></div>`;
            }
            document.querySelector("#messages").append(div);
        }
        
    });


    socket.on('room_change', message => {

        const div = document.createElement('div');
        div.innerHTML = `<div class="jumbotron jumbotron6"><strong>${message}</strong></div>`;
        document.querySelector("#messages").append(div);
        
    });

    
     
    document.querySelector("#send_message_form").onsubmit = () => {

        // Obtener el campo msg
        msg = document.querySelector("#message");

        //Asegúrese de que el mensaje esté escrito 
        if (msg.value.trim().length == 0)
        {
            alert("Perimero, escribe un mensaje");
            msg.focus();
            return false;
        }


        // Obtener nombre de usuario y nombre del canal
        user = storage.getItem('storage_username');
        channel = storage.getItem('channel');

        // data es igual a: mensaje, nombre de usuario y nombre del canal
        data = {'msg': msg.value, 'user': user, 'channel': channel};

        // Emitir enviar mensaje
        socket.emit('send_message', data);

        // Eliminar mensaje del campo de texto
        document.querySelector("#message").value = '';
        document.querySelector("#message").focus();
        return false;
    };


    
    socket.on('receive_message', data => {

        // Mostrar mensaje para todos los usuarios en el canal
        const div = document.createElement('div');
        if (data.user == storage.getItem("username"))
        {
            div.innerHTML = `<div class="jumbotron jumbotron4"><strong style="font-family: sans-serif;">${data.user}:</strong><div>${data.msg}</div><small>(${data.msg_time})</small></div>`;
        }
        else
        {
            div.innerHTML = `<div class="jumbotron jumbotron5"><strong style="font-family: sans-serif;">${data.user}:</strong><div>${data.msg}</div><small>(${data.msg_time})</small></div>`;
        }
        document.querySelector("#messages").append(div);

    });

});