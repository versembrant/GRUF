from server import app, socketio, get_stored_sessions

if __name__ == '__main__':
    # Clean existing users connected in stored sessions
    for session in get_stored_sessions():
        session.clear_connected_users(update_clients=False)
    
    # Start server
    socketio.run(app, port=5555, allow_unsafe_werkzeug=True) # logger=True, engineio_logger=True
