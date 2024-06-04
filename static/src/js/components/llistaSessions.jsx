export const LlistaSessions = ({infoSessions}) => {
    return (
        <div>
            <h1>Connecta't a un GRUF</h1>
            <div>
                GRUFs existents:
                <ul>
                    {infoSessions.map((item, index) => <li key={item.id}>{ item.id } "{ item.name }" ({ item.num_estacions } estacions, { item.connected_users.length } usuaris) - <a href={appPrefix + "/gruf/" + item.id}><button>Connecta't</button></a><a href={appPrefix + "/gruf/" + item.id + "/?local=1"}><button>Connecta't (mode local)</button></a><a href={appPrefix + "/delete_session/" + item.id}><button>Elimina</button></a></li>)}
                </ul>
            </div>
            <div>
                ID del GRUF:
                <input type="text"></input>
                <button
                    onClick={(evt) => {
                        const sessionUrl = appPrefix + "/gruf/" + evt.target.parentNode.getElementsByTagName("input")[0].value;
                        console.log(sessionUrl)
                        
                        window.location.replace(sessionUrl);
                    }}
                >Connecta't al GRUF</button>
            </div>
            <div>
                <br/>
                <a href={appPrefix + "/"}>Torna enrere</a>
            </div>
        </div>
    )
};
