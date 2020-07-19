import os
import time

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app, async_mode = None)


users = []
channels = []
messages = {}

channels.append("General")
channels.append("Piso Liso")
channels.append("Preguntas Frecuentes")
messages["General"] = []
messages["Piso Liso"] = []
messages["Preguntas Frecuentes"] = []


@app.route("/")
def channel():
    return render_template("channel.html", users=users, channels=channels, async_mode = socketio.async_mode)




@socketio.on("register")
def register(username):

    # Asegúrese de que el nombre de usuario no se repita
    if username in users:
        emit("alert", "Este nombre ya esta en uso")

    else:
        users.append(username)
        emit("register", username)

        # Únete al canal General despues de registrarte
        join_room("General")
        join_message = username + " ha emtrado en la sala"
        emit("room_change", join_message, room="General")
        data = {"channel": "General", "messages": messages["General"]}
        emit("join_channel", data)



@socketio.on("create channel")
def create_channel(channel, current_channel, username):

    # Asegúrese de que el nombre del canal no se repita
    if channel in channels:
        emit("alert", "este canal ya existe")

    else:
        channels.append(channel)
        # Inicializar lista de mensajes vacía para este canal
        messages[channel] = []
        
        if current_channel != "":
            # Eliminar usuario del canal anterior
            leave_room(current_channel)
            leave_message = username + " ha dejado la sala"
            emit("room_change", leave_message, room=current_channel)

        # Agregue al usuario al nuevo canal
        join_room(channel)
        emit("announce channel", channel, broadcast=True)
        emit("alert", "Channel created!")
        data = {"channel": channel, "messages": messages[channel]}
        emit("join_channel", data)
        

@socketio.on("change channel")
def change_channel(previous_channel, new_channel, user):

	# Eliminar usuario del canal anterior
    leave_room(previous_channel)
    if previous_channel != new_channel:
        leave_message = user + "  ha dejado la sala"
        emit("room_change", leave_message, room=previous_channel)
    
	# Agregar al usuario al nuevo canal
    join_room(new_channel)
    if previous_channel != new_channel:
        join_message = user + "  ha emtrado en la sala"
        emit("room_change", join_message, room=new_channel)
    data = {"channel": new_channel, "messages": messages[new_channel]}
    emit("join_channel", data)



@socketio.on("send_message")
def send_message(data):
    """ Sends a message in a channel """

	# variable que guarda el tiempo del post
    msg_time = time.ctime(time.time())

	# Data con nombre de usuario, mensaje, hora de mensaje
    my_data = {"user": data["user"], "msg" : data["msg"], "msg_time": msg_time}

	# Agregar datos a los mensajes del canal actual
    messages[data["channel"]].append(my_data)
	# se almacenenan 100 mensajes por canal en el lado del servidor 
    if len(messages[data["channel"]]) > 100:
        messages[data["channel"]].pop(0)
        data1 = {"channel": data["channel"], "messages": messages[data["channel"]]}
        emit("join_channel", data1)

	# Emitir recibir mensaje en el lado del cliente
    emit("receive_message", my_data, room=data["channel"])







if __name__ == "__main__":
	socketio.run(app, debug = True)