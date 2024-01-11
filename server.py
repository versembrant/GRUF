import sys
import uuid
import json

import redis
from collections import defaultdict
from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room

r = redis.Redis(host='redis', port=16379, db=0)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

def log(message):
    print(message)
    sys.stdout.flush()


usernames_connected_per_session = defaultdict(list)


class InvalidSessionDataException(Exception):
    pass


class Session(object):
    data = {}

    def __init__(self, data):
        if not self.data_is_valid(data):
            raise InvalidSessionDataException

        self.data = data
        if 'connected_users' not in self.data:
            self.data['connected_users'] = []
        self.save_to_redis()

    def data_is_valid(self, data):
        # TODO: implement several checks to make sure data is valid for a session
        if 'estacions' not in data:
            return False
        return True
        
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
    def estacions(self):
        return self.data['estacions']
    
    @property
    def num_estacions(self):
        return len(self.estacions)
    
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
        usernames_connected_per_session[self.uuid].append(username)
        self.connected_users.append(username)
        self.save_to_redis()

    def remove_user(self, username):
        usernames_connected_per_session[self.uuid].remove(username)
        self.connected_users.remove(username)
        self.save_to_redis()

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
        try:
            s = Session(json.loads(r.get(key)))
        except InvalidSessionDataException:
            log(f'Error loading session form redis with key {key}, invalid session data. Will remove it from redis.')
            r.delete(key)
            continue
        sessions.append(s)
    return render_template('index.html', sessions=sessions)


@app.route('/new_session/', methods=['GET', 'POST'])
def new():
    if request.method == 'POST':
        name = request.form['name']
        data = json.loads(request.form['data'])
        data['name'] = name
        data['uuid'] = str(uuid.uuid4())[0:6]
        s = Session(data)
        log(f'New session created: {s.name} ({s.uuid})\n{json.dumps(s.get_full_data(), indent=4)}')
        return redirect(url_for('session', session_uuid=s.uuid))
    return render_template('nova_sessio.html')


@app.route('/session/<session_uuid>/')
def session(session_uuid):
    s = get_session_by_uuid(session_uuid)
    if s is None:
        raise Exception('Session not found')
    return render_template('sessio.html', session=s, local_mode=request.args.get('local') == '1')


@app.route('/delete_session/<session_uuid>/')
def delete_session(session_uuid):
    delete_session_by_uuid(session_uuid)
    return redirect(url_for('index'))


@socketio.on('disconnect')
def test_disconnect():
    username = request.sid
    print(f'User {username} disconnected, removing it from all sessions')
    for session_uuid, usernames in usernames_connected_per_session.items():
        if username in usernames:
            s = get_session_by_uuid(session_uuid)
            if s is not None:
                s.remove_user(username)
                log(f'{username} left session {s.room_name} (users in room: {s.connected_users})')


@socketio.on('join_session')
def on_join_session(data):  # session_uuid, username
    s = get_session_by_uuid(data['session_uuid'])
    if s is None:
        raise Exception('Session not found')
    username = request.sid
    s.add_user(username)
    join_room(s.room_name)
    log(f'{username} joined session {s.room_name} (users in room: {s.connected_users})')
    emit('set_session_data', s.get_full_data())
    

@socketio.on('leave_session')
def on_leave_session(data):  # session_uuid, username
    s = get_session_by_uuid(data['session_uuid'])
    if s is None:
        raise Exception('Session not found')
    username = request.sid
    s.remove_user(username)
    leave_room(s.room_name)
    log(f'{username} left session {s.room_name} (users in room: {s.connected_users})')


@socketio.on('update_session_parameter')
def on_update_session_parameter(data):  # session_uuid, nom_estacio, nom_parametre, valor
    s = get_session_by_uuid(data['session_uuid'])
    if s is None:
        raise Exception('Session not found')
    s.update_parameter(data['nom_estacio'], data['nom_parametre'], data['valor'])
    emit('update_session_parameter', data, to=s.room_name)


@socketio.on('update_master_sequencer_current_step')
def on_update_master_sequencer_current_step(data):  # session_uuid, current_step
    s = get_session_by_uuid(data['session_uuid'])
    if s is None:
        raise Exception('Session not found')
    emit('update_master_sequencer_current_step', data, to=s.room_name)


if __name__ == '__main__':
    # Start server
    log('Starting server')
    socketio.run(app, debug=True, host='0.0.0.0', port=5555, allow_unsafe_werkzeug=True) # logger=True, engineio_logger=True
