import os
import sys
import json
import random
import hashlib
from collections import defaultdict

from flask import Flask, render_template, request, redirect, url_for
from werkzeug.utils import safe_join
from flask_socketio import SocketIO, emit, join_room, leave_room
import redis

from gevent import monkey
monkey.patch_all()

r = redis.Redis(host='redis', port=16379, db=0)
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET') or 'secret!'
socketio = SocketIO(app, message_queue="redis://redis:16379/1", ping_timeout=5, ping_interval=5)
available_sessions_room_name = 'available_sessions'
usernames_connected_per_session = defaultdict(list)
update_count_per_session = defaultdict(int)


def log(message):
    print(message)
    sys.stdout.flush()


class InvalidSessionDataException(Exception):
    pass


class Session(object):
    data = {}

    def __init__(self, data):
        self.data = self.validate_data(data)
        self.save_to_redis()

    def validate_data(self, data):
        # Check some properties that sould be there and raise exception if not
        if 'id' not in data:
            raise InvalidSessionDataException
        if 'name' not in data:
            raise InvalidSessionDataException
        if 'estacions' not in data:
            raise InvalidSessionDataException
        if 'live' not in data:
             raise InvalidSessionDataException
        
        # Set default values for some properties
        if 'connected_users' not in data:
            data['connected_users'] = []
        if 'bpm' not in data:
            data['bpm'] = 120
        if 'arranjament' not in data:
            data['arranjament'] = {'clips': []}

        # Return updated data if all ok
        return data
        
    @property
    def id(self):
        return self.data['id']
    
    @property
    def name(self):
        return self.data['name']
    
    @property
    def connected_users(self):
        return self.data['connected_users']

    @property
    def cache_key(self):
        return 'session:' + self.id
    
    @property
    def estacions(self):
        return self.data['estacions']
    
    @property
    def num_estacions(self):
        return len(self.estacions)
    
    @property
    def room_name(self):
        return self.id

    def save_to_redis(self):
        r.set(self.cache_key, json.dumps(self.get_full_data()))

    def delete_from_redis(self):
        r.delete(self.cache_key)

    def get_full_data(self):
        return self.data
    
    def add_user(self, username):
        usernames_connected_per_session[self.id].append(username)
        updated_users = self.connected_users.copy()
        updated_users.append(username)
        self.update_parametre_sessio('connected_users', updated_users)

    def remove_user(self, username):
        usernames_connected_per_session[self.id].remove(username)
        updated_users = self.connected_users.copy()
        updated_users.remove(username)
        self.update_parametre_sessio('connected_users', updated_users)

    def clear_connected_users(self, update_clients=True):
        self.data['connected_users'] = []
        self.save_to_redis()
        if self.id in usernames_connected_per_session:
            del usernames_connected_per_session[self.id]
        if update_clients:
            self.update_parametre_sessio('connected_users', [])
            notifica_available_sessions()

    def update_parametre_sessio(self, nom_parametre, valor, emit_msg_name='update_parametre_sessio'):
        # NOTE: en aquest cas tenim un 'emit_msg_name' parametre perquè els paràmetres relacionat amb àudio han de fer
        # servir un nom de missatge diferent perquè el client els pugui diferenciar i tractar-los de forma diferent (encara
        # que siguin paràmetres de la sessió).
        # Envia el nou paràmetre als clients connectats
        update_count_per_session[self.id] += 1
        emit(emit_msg_name, {'update_count': update_count_per_session[self.id] ,'nom_parametre': nom_parametre, 'valor': valor}, to=self.room_name)
        
        # Guarda el canvi a la sessió al servidor
        self.data[nom_parametre] = valor  
        self.save_to_redis()

    def update_arranjament_sessio(self, update_data):
        update_count_per_session[self.id] += 1
        emit('update_arranjament_sessio', {'update_count': update_count_per_session[self.id], 'update_data': update_data}, to=self.room_name)

        # Guarda el canvi a la sessió al servidor
        if update_data['accio'] == 'add_clips':
            new_clip_ids = [c['id'] for c in update_data['clips_data']]
            self.data['arranjament']['clips'] = [c for c in self.data['arranjament']['clips'] if c['id'] not in new_clip_ids] + update_data['clips_data']
        elif update_data['accio'] == 'remove_clips':
            self.data['arranjament']['clips'] = [c for c in self.data['arranjament']['clips'] if c['id'] not in update_data['clip_ids']]
        self.data['arranjament']['clips'] = sorted(self.data['arranjament']['clips'], key=lambda c: c['beatInici'])
        self.save_to_redis()

    def update_live_sessio(self, update_data):
        update_count_per_session[self.id] += 1
        emit('update_live_sessio', {'update_count': update_count_per_session[self.id], 'update_data': update_data}, to=self.room_name)

        # Guarda el canvi a la sessió al servidor
        if update_data['accio'] == 'set_gains':
            for nom_estacio, valor in update_data['gains_estacions'].items():
                self.data['live']['gainsEstacions'][nom_estacio] = valor
        elif update_data['accio'] == 'set_presets':
            for nom_estacio, valor in update_data['presets_estacions'].items():
                self.data['live']['presetsEstacions'][nom_estacio] = valor
        self.save_to_redis()
        
    def update_parametre_estacio(self, nom_estacio, nom_parametre, valor, preset):
        # Envia el nou paràmetre als clients connectats
        update_count_per_session[self.id] += 1
        emit('update_parametre_estacio', {'update_count': update_count_per_session[self.id], 'nom_estacio': nom_estacio, 'nom_parametre': nom_parametre, 'valor': valor, 'preset': preset}, to=self.room_name)

        # Guarda el canvi a la sessió al servidor
        try:
            self.data['estacions'][nom_estacio]['parametres'][nom_parametre][preset] = valor
            self.save_to_redis()
        except KeyError:
            pass


def get_stored_sessions():
    sessions = []
    for key in r.scan_iter("session:*"):
        try:
            s = Session(json.loads(r.get(key)))
        except InvalidSessionDataException:
            log(f'Error loading session form redis with key {key}, invalid session data. Will remove it from redis.')
            r.delete(key)
            continue
        sessions.append(s)
    return sessions


def get_session_by_id(id):
    session_redis = r.get('session:' + id)
    if session_redis is not None:
        session_raw_data = json.loads(session_redis)
        return Session(session_raw_data)
    return None


def delete_session_by_id(id):
    s_to_delete = get_session_by_id(id)
    if s_to_delete is not None:
        s_to_delete.delete_from_redis()
        

def notifica_available_sessions():
    data = []
    for s in get_stored_sessions():
        data.append({
            'id': s.id,
            'name': s.name,
            'connected_users': s.connected_users,
            'num_estacions': s.num_estacions,
        })
    socketio.emit('set_available_sessions', data, to=available_sessions_room_name)


hash_cache = {}
get_hash = lambda content, length: hashlib.md5(content).hexdigest()[:length]

@app.url_defaults
def add_hash_for_static_files(endpoint, values):
    '''Add content hash argument for url to make url unique.
    It's have sense for updates to avoid caches.
    '''
    if endpoint != 'static':
        return
    filename = values['filename']
    if filename in hash_cache:
        values['hash'] = hash_cache[filename]
        return
    filepath = safe_join(app.static_folder, filename)
    if os.path.isfile(filepath):
        with open(filepath, 'rb') as static_file:
            filehash = get_hash(static_file.read(), 8)
            values['hash'] = hash_cache[filename] = filehash


@app.route('/')
def llista_sessions():
    log('Loading existing sessions from redis')
    return render_template('llista_sessions.html')


@app.route('/new_session/', methods=['GET', 'POST'])
def new():
    if request.method == 'POST':
        name = request.form['name']
        data = json.loads(request.form['data'])
        data['name'] = name
        data['id'] = str(random.randint(100000, 999999))
        s = Session(data)
        log(f'New session created: {s.name} ({s.id})\n{json.dumps(s.get_full_data(), indent=4)}')
        notifica_available_sessions()
        return redirect(url_for('session', session_id=s.id))
    return render_template('nova_sessio.html')


@app.route('/session/<session_id>/')
def session(session_id):
    s = get_session_by_id(session_id)
    if s is None:
        raise Exception('Session not found')
    return render_template('sessio.html', session=s, local_mode=request.args.get('local') == '1')


@app.route('/delete_session/<session_id>/')
def delete_session(session_id):
    delete_session_by_id(session_id)
    return redirect(url_for('llista_sessions'))


@socketio.on('disconnect')
def on_disconnect():
    username = request.sid
    print(f'User {username} disconnected, removing it from all sessions')
    for session_id, usernames in usernames_connected_per_session.items():
        if username in usernames:
            s = get_session_by_id(session_id)
            if s is not None:
                s.remove_user(username)
                notifica_available_sessions()
                log(f'{username} left session {s.room_name} (users in room: {s.connected_users})')


@socketio.on('join_session')
def on_join_session(data):  # session_id, username
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    username = request.sid
    s.add_user(username)
    join_room(s.room_name)
    notifica_available_sessions()
    log(f'{username} joined session {s.room_name} (users in room: {s.connected_users})')
    emit('set_session_data', s.get_full_data())


@socketio.on('request_session_data')
def on_request_session_data(data):  # session_id   
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    emit('set_session_data', s.get_full_data())


@socketio.on('leave_session')
def on_leave_session(data):  # session_id, username
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    username = request.sid
    s.remove_user(username)
    leave_room(s.room_name)
    notifica_available_sessions()
    log(f'{username} left session {s.room_name} (users in room: {s.connected_users})')


@socketio.on('subscribe_to_available_sessions')
def on_subscribe_to_available_sessions(data):  # no data
    join_room(available_sessions_room_name)
    notifica_available_sessions()


@socketio.on('update_parametre_estacio')
def on_update_parametre_estacio(data):  # session_id, nom_estacio, nom_parametre, valor
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    s.update_parametre_estacio(data['nom_estacio'], data['nom_parametre'], data['valor'], data['preset'])
    

@socketio.on('update_parametre_audio_graph')
def on_update_parametre_audio_graph(data):  # session_id, nom_estacio, nom_parametre, valor
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    s.update_parametre_sessio(data['nom_parametre'], data['valor'], emit_msg_name='update_parametre_audio_graph')


@socketio.on('update_parametre_sessio')
def on_update_parametre_sessio(data):  # session_id, nom_estacio, nom_parametre, valor
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    s.update_parametre_sessio(data['nom_parametre'], data['valor'])


@socketio.on('update_arranjament_sessio')
def on_update_arranjament_sessio(data):  # session_id, update_data
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    s.update_arranjament_sessio(data['update_data'])


@socketio.on('update_live_sessio')
def on_update_live_sessio(data):  # session_id, update_data
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    s.update_live_sessio(data['update_data'])


@socketio.on('update_master_sequencer_current_step')
def on_update_master_sequencer_current_step(data):  # session_id, current_step
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    emit('update_master_sequencer_current_step', data, to=s.room_name)


if __name__ == '__main__':
    # Clean existing users connected in stored sessions
    for session in get_stored_sessions():
        session.clear_connected_users(update_clients=False)
    
    # Start server
    log('Starting server')
    debug_mode = os.getenv('DEPLOY') == None
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=5555, allow_unsafe_werkzeug=True) # logger=True, engineio_logger=True
