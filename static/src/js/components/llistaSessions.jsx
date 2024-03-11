export const LlistaSessions = ({infoSessions}) => {
    return (
        <div>
            <h1>Sessions</h1>
            <div>
                Sessions existents:
                <ul>
                    {infoSessions.map((item, index) => <li key={item.id}><a href={appPrefix + "/session/" + item.id}>{ item.id } "{ item.name }" ({ item.num_estacions } estacions, { item.connected_users.length } usuaris)</a> - <a href={appPrefix + "/delete_session/" + item.id}><button>eliminar</button></a> - <a href={appPrefix + "/session/" + item.id + "/?local=1"}><button>obrir en mode local</button></a></li>)}
                </ul>
            </div>
            <a href={appPrefix + "/new_session/"}>Crear nova sessió</a>
        </div>
    )
};
