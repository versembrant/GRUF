import os
import sys
import json
import random
import smtplib
import subprocess
import hashlib
from collections import defaultdict
from email.message import EmailMessage

from flask import Flask, render_template, request, redirect, url_for, Blueprint
from werkzeug.utils import safe_join, secure_filename
from flask_socketio import SocketIO, emit, join_room, leave_room
import redis

from gevent import monkey
monkey.patch_all()

from app_version import VERSIO_GRUF

app_prefix = os.getenv('APP_PREFIX', '')
port = int(os.getenv('PORT', 5555))
test = int(os.getenv('TEST', 0)) == 1

r = redis.Redis(host='redis' if not test else 'redis-test', port=16379, db=0)
app = Flask(__name__, static_url_path='/static' if not app_prefix else f'/{app_prefix}/static', static_folder='static')
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET') or 'secret!'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
socketio = SocketIO(app, message_queue="redis://redis:16379/1", ping_timeout=5, ping_interval=5, path='socket.io' if not app_prefix else f'{app_prefix}/socket.io')
available_sessions_room_name = 'available_sessions'
usernames_connected_per_session = defaultdict(list)
update_count_per_session = defaultdict(int)
bp = Blueprint('app', __name__, template_folder='templates')


def log(message):
    print(message)
    sys.stdout.flush()


def send_email(email_to, subject, body):
    log(f"Sending email \"{subject}\" to {email_to}")
    email_from = os.getenv('MAIL_USERNAME', 'your_email@address.com')
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = email_from
    msg['To'] = email_to
    msg.set_content(body)
    try:
        password = os.getenv('MAIL_PASSWORD', 'your_password')
        smtpObj = smtplib.SMTP(os.getenv('MAIL_SERVER', 'live.smtp.example.io'), 587)
        smtpObj.starttls()
        smtpObj.login(email_from, password)
        smtpObj.send_message(msg)
        smtpObj.quit()    
    except Exception as e:
        log(f'Error enviant email: {e}')


def notify_new_gruf_created(session, email_to):
    if app_prefix != "" and not app_prefix.startswith('/'):
        app_prefix_with_slash = '/' + app_prefix
    else:
        app_prefix_with_slash = app_prefix
    gruf_url_app_prefix = os.getenv('APP_BASE_URL', f'http://localhost:{port}') + app_prefix_with_slash  + '/g/'
    send_email(email_to, 
               f"S'ha creat un nou GRUF: #{session.id} {session.name}", 
               f"""Hola!

Aquest correu és per informar-te de que s'ha creat un nou GRUF amb el nom \"{session.name}\".
L'identificador (ID) d'aquest GRUF és: {session.id}

Pots accedir al GRUF utilizant aquestes URLs:

* {gruf_url_app_prefix}{session.id}/
* {gruf_url_app_prefix}{session.id}/master/  (per connectar-te com a "màster")
* {gruf_url_app_prefix}{session.id}/local/ (per connectar-te en mode local)

Per administrar el GRUF (per exemple, per canviar el títol o per eliminar-lo), pots accedir a la següent URL:

* {gruf_url_app_prefix}{session.id}/?token={session.token}

Gràcies per utilitzar el GRUF!

- Versembrant

""")
    

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


@bp.context_processor
def inject_app_prefix():
    # App prefix will be '' if not set, otherwise it will be '/app_prefix' (starting with slash, no trailing slash)
    if app_prefix != '':
        return dict(app_prefix='/' + app_prefix)
    else:
        return dict(app_prefix='')


@bp.context_processor
def inject_app_version():
    return dict(app_version=VERSIO_GRUF)

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
        if 'recorded_files' not in data:
            data['recorded_files'] = []
        if 'arranjament' not in data:
            data['arranjament'] = {'numSteps': 32, 'beatsPerStep': 32, 'clips': []}
        else:
            data['arranjament']['beatsPerStep'] = 32  # Some old sessions had 16 here, force it to be 32 form now on

        # Transform old grid saved data to new object-based format
        for estacio_nom, estacio in data['estacions'].items():
            if estacio['tipus'] == 'drum machine' or estacio['tipus'] == 'synth':
                for nom, valors_presets in estacio['parametres'].items():
                    if nom == 'pattern' or nom == 'notes':
                        nous_valors_presets = []
                        changed = False
                        for valor in valors_presets:
                            if valor != []:
                                if type(valor[0]) != dict:
                                    nou_valor = [{'i': e[0], 'j': e[1]} for e in valor]
                                    nous_valors_presets.append(nou_valor)
                                    changed = True
                            else:
                                nous_valors_presets.append([])
                        if changed:
                            data['estacions'][estacio_nom]['parametres'][nom] = nous_valors_presets
                
        # Return updated data if all ok
        return data
        
    @property
    def id(self):
        return self.data['id']
    
    @property
    def token(self):
        return self.data.get('token', '')
    
    @property
    def name(self):
        return self.data['name']
    
    @property
    def sort_timestamp(self):
        return int(self.data.get('creation_timestamp', 0))
    
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
    
    @property
    def audio_files_path(self):
        return os.path.join(app.config['UPLOAD_FOLDER'], self.id)
    
    @property
    def audio_files_url(self):
        return f'/{app_prefix}/static/uploads/{self.id}/'
    
    def get_recorded_files_from_disk(self):
        recorded_files = []
        for f in os.listdir(self.audio_files_path):
            recorded_files.append(f)
        return recorded_files

    def save_to_redis(self):
        r.set(self.cache_key, json.dumps(self.get_full_data()))

    def delete_from_redis(self):
        r.delete(self.cache_key)

    def delete_audio_files(self):
        os.system(f'rm -rf {self.audio_files_path}')

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
        if username in updated_users:
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

    def update_parametre_sessio(self, nom_parametre, valor, origin_socket_id=None, emit_msg_name='update_parametre_sessio', no_context=False):
        # NOTE: en aquest cas tenim un 'emit_msg_name' parametre perquè els paràmetres relacionat amb àudio han de fer
        # servir un nom de missatge diferent perquè el client els pugui diferenciar i tractar-los de forma diferent (encara
        # que siguin paràmetres de la sessió).
        # Envia el nou paràmetre als clients connectats
        update_count_per_session[self.id] += 1
        if no_context:
            socketio.emit(emit_msg_name, {'update_count': update_count_per_session[self.id] ,'nom_parametre': nom_parametre, 'valor': valor, 'origin_socket_id': origin_socket_id}, to=self.room_name)
        else:
            emit(emit_msg_name, {'update_count': update_count_per_session[self.id] ,'nom_parametre': nom_parametre, 'valor': valor, 'origin_socket_id': origin_socket_id}, to=self.room_name)
        
        # Guarda el canvi a la sessió al servidor
        self.data[nom_parametre] = valor  
        self.save_to_redis()

    def update_arranjament_sessio(self, update_data, origin_socket_id=None):
        update_count_per_session[self.id] += 1
        emit('update_arranjament_sessio', {'update_count': update_count_per_session[self.id], 'update_data': update_data, 'origin_socket_id': origin_socket_id}, to=self.room_name)

        # Guarda el canvi a la sessió al servidor
        if update_data['accio'] == 'add_clips':
            new_clip_ids = [c['id'] for c in update_data['clips_data']]
            self.data['arranjament']['clips'] = [c for c in self.data['arranjament']['clips'] if c['id'] not in new_clip_ids] + update_data['clips_data']
        elif update_data['accio'] == 'remove_clips':
            self.data['arranjament']['clips'] = [c for c in self.data['arranjament']['clips'] if c['id'] not in update_data['clip_ids']]
        self.data['arranjament']['clips'] = sorted(self.data['arranjament']['clips'], key=lambda c: c['beatInici'])
        self.save_to_redis()

    def update_live_sessio(self, update_data, origin_socket_id=None):
        update_count_per_session[self.id] += 1
        emit('update_live_sessio', {'update_count': update_count_per_session[self.id], 'update_data': update_data, 'origin_socket_id': origin_socket_id}, to=self.room_name)

        # Guarda el canvi a la sessió al servidor
        if update_data['accio'] == 'set_gains':
            for nom_estacio, valor in update_data['gains_estacions'].items():
                self.data['live']['gainsEstacions'][nom_estacio] = valor
        elif update_data['accio'] == 'set_pans':
            for nom_estacio, valor in update_data['pans_estacions'].items():
                if 'pansEstacions' not in self.data['live']:
                    self.data['live']['pansEstacions'] = {}  # Per compatibilitat amb sessions antigues que no tenien pans
                self.data['live']['pansEstacions'][nom_estacio] = valor
        elif update_data['accio'] == 'set_mutes':
            for nom_estacio, valor in update_data['mutes_estacions'].items():
                self.data['live']['mutesEstacions'][nom_estacio] = valor
        elif update_data['accio'] == 'set_solos':
            for nom_estacio, valor in update_data['solos_estacions'].items():
                self.data['live']['solosEstacions'][nom_estacio] = valor
        elif update_data['accio'] == 'set_presets':
            for nom_estacio, valor in update_data['presets_estacions'].items():
                self.data['live']['presetsEstacions'][nom_estacio] = valor
        self.save_to_redis()
        
    def update_parametre_estacio(self, nom_estacio, nom_parametre, valor, preset, origin_socket_id=None):
        # Envia el nou paràmetre als clients connectats
        update_count_per_session[self.id] += 1
        emit('update_parametre_estacio', {'update_count': update_count_per_session[self.id], 'nom_estacio': nom_estacio, 'nom_parametre': nom_parametre, 'valor': valor, 'preset': preset, 'origin_socket_id': origin_socket_id}, to=self.room_name)
        
        # Guarda el canvi a la sessió al servidor
        try:
            self.data['estacions'][nom_estacio]['parametres'][nom_parametre][preset] = valor
            self.save_to_redis()
        except KeyError:
            log(f'Error updating parameter {nom_parametre} for station {nom_estacio} with preset {preset} in session {self.id}, station or parameter not found')


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

    sessions = sorted(sessions, key=lambda s: s.sort_timestamp, reverse=True)
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
        s_to_delete.delete_audio_files()
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


@bp.route('/')
def frontpage():
    return render_template('frontpage.html', noappcss=True, noappjs=True)


@bp.route('/connecta/')
def connecta():
    error = request.args.get('error', False)
    return render_template('connecta.html', error=error, debug_mode=os.getenv('DEPLOY') == None)


@bp.route('/nova_sessio/', methods=['GET', 'POST'])
def new():
    if request.method == 'POST':
        name = request.form['name']
        data = json.loads(request.form['data'])
        data['name'] = name
        data['id'] = str(random.randint(100000, 999999))
        s = Session(data)
        log(f'New session created: {s.name} ({s.id})\n{json.dumps(s.get_full_data(), indent=4)}')
        notifica_available_sessions()
        if 'email' in request.form and request.form['email']:
            notify_new_gruf_created(s, request.form['email'])
        return redirect(url_for('app.session', session_id=s.id))
    return render_template('nova_sessio.html')


@bp.route('/legal/')
def legal():
    return render_template('legal.html')


@bp.route('/gruf/<session_id>/')
@bp.route('/gruf/<session_id>/<path:rest>')
def old_gruf_address_redirect(session_id, rest=""):
    return redirect(url_for('app.session', session_id=session_id) + rest)


@bp.route('/g/<session_id>/master/')
def session_master(session_id):
    s = get_session_by_id(session_id)
    if s is None: return redirect(url_for('app.connecta', error=True))
    return render_template('sessio.html', session=s, local_mode=False, token=request.args.get("token", ""), master_audio_engine=True)


@bp.route('/g/<session_id>/local/')
def session_local(session_id):
    s = get_session_by_id(session_id)
    if s is None: return redirect(url_for('app.connecta', error=True))
    return render_template('sessio.html', session=s, local_mode=True, token=request.args.get("token", ""), master_audio_engine=True)


@bp.route('/g/<session_id>/')
def session(session_id):
    s = get_session_by_id(session_id)
    if s is None: return redirect(url_for('app.connecta', error=True))
    return render_template('sessio.html', session=s, local_mode=False, token=request.args.get("token", ""), master_audio_engine=False)


@bp.route('/delete_session/<session_id>/')
def delete_session(session_id):
    delete_session_by_id(session_id)
    return redirect(url_for('app.connecta'))


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'webm', 'wav', 'mp3', 'mp4', 'ogg'}


@bp.route('/upload_file/<session_id>/', methods=['POST'])
def upload_file(session_id):
    s = get_session_by_id(session_id)
    if s is None:
        raise Exception('Session not found')
    folder_path = s.audio_files_path
    os.makedirs(folder_path, mode=0o777, exist_ok=True)
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            return {'error': True, 'message': 'No file part'}
        file = request.files['file']
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
            return {'error': True, 'message': 'Empty filename'}
        if file and allowed_file(file.filename):
            # Save file
            filename = secure_filename(file.filename)
            file_path = os.path.join(folder_path, filename)
            file.save(file_path)

            # Convert to wav
            print('Converting to wav...')
            # Generate name for the wavfile, find biggest "user recording number"
            recording_number = 0
            for ffilename in os.listdir(folder_path):
                try:
                    num = int(ffilename.split('.wav')[0].split('_num_')[1])
                    if num > recording_number:
                        recording_number = num
                except (IndexError, ValueError) as e:
                    continue
   
            wav_filename = filename.split('.')[0] + f'_num_{recording_number + 1}.wav'
            wav_file_path = os.path.join(folder_path, wav_filename)
            os.system(f'ffmpeg -y -i {file_path} -c:a pcm_s16le -ar 44100 {wav_file_path}')
            os.chmod(wav_file_path, 0o0777)
            os.remove(file_path)

            # Correct loudness
            correct_loudness_method = 'peak' #'dynaudnorm' #'compand' #'dynaudnorm' # 'loudnorm' or None
            if correct_loudness_method is not None:
                print('Correcting loudness...')
                wav_file_path2 = wav_file_path.replace(".wav", "_2.wav")

                if correct_loudness_method == 'loudnorm':
                    target_i = -5
                    target_tp = 0
                    target_lra = 15
                    result = subprocess.run(['ffmpeg', '-y', '-i', wav_file_path, '-af', f'loudnorm=I={target_i}:TP={target_tp}:LRA={target_lra}:print_format=json', '-f', 'null', '-'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    ffmpeg_loudnorm_stats = json.loads(
                        "{" + result.stderr.decode('utf-8').split("{")[1]
                    )
                    if ffmpeg_loudnorm_stats['input_i'] != '-inf':
                        measured_I = float(ffmpeg_loudnorm_stats['input_i'])
                        measured_TP = float(ffmpeg_loudnorm_stats['input_tp'])
                        measured_LRA = float(ffmpeg_loudnorm_stats['input_lra'])
                        measured_thresh = float(ffmpeg_loudnorm_stats['input_thresh'])
                        offset = float(ffmpeg_loudnorm_stats['target_offset'])
                        subprocess.run(['ffmpeg', '-i', wav_file_path, '-c:a', 'pcm_s16le', '-ar', '44100', '-af', f'loudnorm=I={target_i}:TP={target_tp}:LRA={target_lra}:measured_I={measured_I}:measured_TP={measured_TP}:measured_LRA={measured_LRA}:measured_thresh={measured_thresh}:offset={offset}:linear=true', wav_file_path2])
                       
                elif correct_loudness_method == 'dynaudnorm':
                    subprocess.run(['ffmpeg', '-y', '-i', wav_file_path, '-c:a', 'pcm_s16le', '-ar', '44100', '-af', f'dynaudnorm=p=0.9:s=5', wav_file_path2])

                elif correct_loudness_method == 'compand':
                    subprocess.run(['ffmpeg', '-y', '-i', wav_file_path, '-c:a', 'pcm_s16le', '-ar', '44100', '-af', f'compand=attacks=0:points=-80/-900|-45/-15|-27/-9|-5/-5|20/20', wav_file_path2])
                
                elif correct_loudness_method == 'acompressor':
                    subprocess.run(['ffmpeg', '-y', '-i', wav_file_path, '-c:a', 'pcm_s16le', '-ar', '44100', '-af', f'acompressor=threshold=-20dB:ratio=2:attack=200:release=1000:makeup=0', wav_file_path2])

                elif correct_loudness_method == 'peak':
                    result = subprocess.run(['ffmpeg', '-y', '-i', wav_file_path, '-c:a', 'pcm_s16le', '-ar', '44100', '-af', f'volumedetect', '-f', 'null', '-'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    output = result.stderr.decode('utf-8')
                    max_volume = float(output.split('max_volume: ')[1].split(' ')[0])
                    subprocess.run(['ffmpeg', '-y', '-i', wav_file_path, '-c:a', 'pcm_s16le', '-ar', '44100', '-af', f'volume={min(max_volume * -1, 18)}', wav_file_path2])
                    
                if os.path.exists(wav_file_path2):
                    os.chmod(wav_file_path2, 0o0777)
                    os.remove(wav_file_path)
                    os.rename(wav_file_path2, wav_file_path)

            # Update all clients with list of recorded audio files
            recorded_files = s.get_recorded_files_from_disk()
            s.update_parametre_sessio('recorded_files', recorded_files, no_context=True)
            
            # Return URL and list of recorded files (useful in local mode to update the list of recorded files in the client)
            file_url = f'{s.audio_files_url}{wav_filename}'
            return {'error': False, 'url': file_url, 'recorded_files': recorded_files}
        else:
            return {'error': True, 'message': 'File not allowed'}
    return {'error': True, 'message': 'No post request'}


@bp.route('/delete_file/<session_id>/', methods=['POST'])
def delete_file(session_id):
    s = get_session_by_id(session_id)
    if s is None:
        raise Exception('Session not found')
    folder_path = s.audio_files_path
    if request.method == 'POST':
        filename = request.form['filename']
        filepath = os.path.join(folder_path, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            # Update all clients with list of recorded audio files
            recorded_files = s.get_recorded_files_from_disk()
            s.update_parametre_sessio('recorded_files', recorded_files, no_context=True)
            return {'error': False, 'recorded_files': recorded_files}
        return {'error': True, 'message': 'File does not exist'}
    return {'error': True, 'message': 'No post rewuest'}


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


def _save_session_data_helper(data):
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    log(f'Saving session data for session {data['session_id']}')
    Session(data['full_session_data'])  # This will trigger saving the session to redis and overwriting exsiting one


@socketio.on('save_session_data')
def on_save_session_data(data):  # session_id
    _save_session_data_helper(data)


@bp.route('/save_session_data/', methods=['POST'])
def save_session_data():
    # This the HTTP version of the socketio 'save_session_data' event, used in local mode to save session data
    data = request.get_json()
    _save_session_data_helper(data)
    return {'error': False}


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
    s.update_parametre_estacio(data['nom_estacio'], data['nom_parametre'], data['valor'], data['preset'], origin_socket_id=data['origin_socket_id'])


@socketio.on('forward_canvis_estacions')
def on_forward_canvis_estacions(data):  # session_id, action, new_estacio_data?
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    emit('forward_canvis_estacions', data, to=s.room_name)
    

@socketio.on('update_parametre_audio_graph')
def on_update_parametre_audio_graph(data):  # session_id, nom_estacio, nom_parametre, valor
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    s.update_parametre_sessio(data['nom_parametre'], data['valor'], origin_socket_id=data['origin_socket_id'], emit_msg_name='update_parametre_audio_graph')


@socketio.on('update_parametre_sessio')
def on_update_parametre_sessio(data):  # session_id, nom_estacio, nom_parametre, valor
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    s.update_parametre_sessio(data['nom_parametre'], data['valor'], origin_socket_id=data['origin_socket_id'])


@socketio.on('update_arranjament_sessio')
def on_update_arranjament_sessio(data):  # session_id, update_data
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    s.update_arranjament_sessio(data['update_data'], origin_socket_id=data['origin_socket_id'])


@socketio.on('update_live_sessio')
def on_update_live_sessio(data):  # session_id, update_data
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    s.update_live_sessio(data['update_data'], origin_socket_id=data['origin_socket_id'])


@socketio.on('update_master_sequencer_current_step')
def on_update_master_sequencer_current_step(data):  # session_id, current_step
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    emit('update_master_sequencer_current_step', data, to=s.room_name)


@socketio.on('midi_event')
def on_midi_event(data):  # session_id, nom_estacio, midi_event_data
    s = get_session_by_id(data['session_id'])
    if s is None:
        raise Exception('Session not found')
    emit('midi_event', data, to=s.room_name)


app.register_blueprint(bp, url_prefix=f'/{app_prefix}/')

def clean_existing_connected_users():
    # Clean existing users connected in stored sessions
    for session in get_stored_sessions():
        session.clear_connected_users(update_clients=False)

clean_existing_connected_users()


if __name__ == '__main__':
    # Start server
    log('Starting server listening in port ' + str(port))
    debug_mode = os.getenv('DEPLOY') == None
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True) # logger=True, engineio_logger=True
