import sys
import uuid
import json

import redis
from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO, emit, send, join_room, leave_room

r = redis.Redis(host='redis', port=16379, db=0)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

def log(message):
    print(message)
    sys.stdout.flush()


class Session(object):
    data = {}

    def __init__(self, data):
        self.data = data
        self.data['connected_users'] = []
        self.save_to_redis()
        
    @property
    def uuid(self):
        return self.data['uuid']
    
    @property
    def name(self):
        return self.data['name']
    
    @property
    def connected_users(self):
        return self.data['connected_users']

    @property
    def cache_key(self):
        return 'session:' + self.uuid
    
    @property
    def num_estacions(self):
        return len(self.data['estacions'])
    
    @property
    def room_name(self):
        return self.uuid

    def save_to_redis(self):
        r.set(self.cache_key, json.dumps(self.get_full_data()))

    def delete_from_redis(self):
        r.delete(self.cache_key)

    def get_full_data(self):
        return self.data
    
    def add_user(self, username):
        self.connected_users.append(username)

    def remove_user(self, username):
        self.connected_users.remove(username)

    def update_parameter(self, nom_estacio, nom_parametre, valor):
        try:
            self.data['estacions'][nom_estacio]['parametres'][nom_parametre] = valor
            self.save_to_redis()
        except KeyError:
            pass


def get_session_by_uuid(uuid):
    session_redis = r.get('session:' + uuid)
    if session_redis is not None:
        session_raw_data = json.loads(session_redis)
        return Session(session_raw_data)
    return None


def delete_session_by_uuid(uuid):
    s_to_delete = get_session_by_uuid(uuid)
    if s_to_delete is not None:
        s_to_delete.delete_from_redis()
        

@app.route('/')
def index():
    log('Loading existing sessions from redis')
    sessions = []
    for key in r.scan_iter("session:*"):
        s = Session(json.loads(r.get(key)))
        sessions.append(s)
    return render_template('index.html', sessions=sessions)


@app.route('/new_session/', methods=['GET', 'POST'])
def new():
    if request.method == 'POST':
        name = request.form['name']
        data = json.loads(request.form['data'])
        data['name'] = name
        data['uuid'] = str(uuid.uuid4())
        s = Session(data)
        log(f'New session created: {s.name} ({s.uuid})\n{json.dumps(s.get_full_data(), indent=4)}')
        return redirect(url_for('session', session_uuid=s.uuid))
    return render_template('new_session.html')


@app.route('/session/<session_uuid>/')
def session(session_uuid):
    s = get_session_by_uuid(session_uuid)
    if s is None:
        raise Exception('Session not found')
    return render_template('session.html', session=s)


@app.route('/delete_session/<session_uuid>/')
def delete_session(session_uuid):
    delete_session_by_uuid(session_uuid)
    return redirect(url_for('index'))


def _add_user_to_session(s, username):
    s.add_user(username)
    join_room(s.room_name)
    log(f'{username} joined session {s.room_name}')
    send(username + ' has entered the room.', to=s.room_name)
    emit('set_session_data', s.get_full_data())


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
    emit('update_session_parameter', data, to=s.room_name)


if __name__ == '__main__':

    # Start server
    log('Starting server')
    socketio.run(app, debug=True, host='0.0.0.0', port=5555, allow_unsafe_werkzeug=True) # logger=True, engineio_logger=True
