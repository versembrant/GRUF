import sys
import uuid
import json

import redis
from flask import Flask, render_template
from flask_socketio import SocketIO, emit, send, join_room, leave_room

r = redis.Redis(host='redis', port=16379, db=0)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

def log(message):
    print(message)
    sys.stdout.flush()


sessions = []


class Session(object):
    name = None
    uuid = None
    data = {}
    connected_users = []

    def __init__(self, name, session_uuid=None, session_data={}):
        self.name = name
        self.uuid = session_uuid if session_uuid is not None else str(uuid.uuid4())
        self.data = session_data if session_data is not None else {}

    @property
    def cache_key(self):
        return 'session:' + self.uuid
    
    @property
    def room_name(self):
        return self.uuid

    def save_to_redis(self):
        r.set(self.cache_key, json.dumps(self.get_full_data()))

    def delete_from_redis(self):
        r.delete(self.cache_key)

    def get_full_data(self):
        return {
            'name': self.name,
            'uuid': self.uuid,
            'data': self.data,
        }
    
    def add_user(self, username):
        self.connected_users.append(username)

    def remove_user(self, username):
        self.connected_users.remove(username)

    def update_parameter(self, nom_estacio, nom_parametre, valor):
        try:
            self.data['estacions'][nom_estacio]['parametres'][nom_parametre] = valor
            # TODO: potser no guardar a cada parametre?, només de tant en tant?
            #self.save_to_redis()
        except KeyError:
            pass


def get_session_by_uuid(uuid):
    for s in sessions:
        if s.uuid == uuid:
            return s
    return None


@app.route('/')
def index():
    return render_template('index.html')


def _add_user_to_session(s, username):
    s.add_user(username)
    join_room(s.room_name)
    log(f'{username} joined session {s.room_name}')
    send(username + ' has entered the room.', to=s.room_name)
    emit('set_session_data', s.get_full_data())


@socketio.on('new_session')
def on_new_session(data):  # name, username
    s = Session(data['name'], session_data=data['session_data'])
    s.save_to_redis()
    sessions.append(s)
    _add_user_to_session(s, data['username'])
    log(f'New session created: {s.name} ({s.uuid})\n{json.dumps(s.get_full_data(), indent=4)}')
    

@socketio.on('join_session')
def on_join_session(data):  # session_uuid, username
    s = get_session_by_uuid(data['session_uuid'])
    if s is None:
        raise Exception('Session not found')
    _add_user_to_session(s, data['username'])
    

def _remove_user_from_session(s, username):
    s.remove_user(username)
    leave_room(s.room_name)
    log(f'{username} left session {s.room_name}')
    send(username + ' has left the room.', to=s.room_name)


@socketio.on('leave_session')
def on_leave_session(data):  # session_uuid, username
    s = get_session_by_uuid(data['session_uuid'])
    if s is None:
        raise Exception('Session not found')
    _remove_user_from_session(s, data['username'])


@socketio.on('update_session_parameter')
def on_update_session_parameter(data):  # session_uuid, nom_estacio, nom_parametre, valor
    s = get_session_by_uuid(data['session_uuid'])
    if s is None:
        raise Exception('Session not found')
    s.update_parameter(data['nom_estacio'], data['nom_parametre'], data['valor'])
    log(f'Updated session parameter: {data["nom_estacio"]}.{data["nom_parametre"]} = {data["valor"]}')
    emit('update_session_parameter', {'nom_estacio': data['nom_estacio'], 'nom_parametre': data['nom_parametre'], 'valor': data['valor']}, to=s.room_name)


if __name__ == '__main__':

    # Load existing sessions from redis
    log('Loading existing sessions from redis')
    for key in r.scan_iter("session:*"):
        session_uuid = str(key).split(':')[1]
        session_raw_data = json.loads(r.get(key))
        s = Session(session_raw_data['name'], session_uuid=session_uuid, session_data=session_raw_data['data'])
        sessions.append(s)
        print(f'Session availble: {s.name} ({s.uuid})')

    # Start server
    log('Starting server')
    socketio.run(app, debug=True, host='0.0.0.0', port=5555, allow_unsafe_werkzeug=True) # logger=True, engineio_logger=True
