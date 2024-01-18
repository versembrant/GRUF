export const LlistaSessions = ({infoSessions}) => {
    return (
        <div>
            <h1>Sessions</h1>
            <div>
                Sessions existents:
                <ul>
                    {infoSessions.map((item, index) => <li key={item.id}><a href={"/session/" + item.id}>{ item.id } "{ item.name }" ({ item.num_estacions } estacions, { item.connected_users.length } usuaris)</a> - <a href={"/delete_session/" + item.id}><button>eliminar</button></a></li>)}
                </ul>
            </div>
            <a href="/new_session/">Crear nova sessió</a>
        </div>
    )
};
