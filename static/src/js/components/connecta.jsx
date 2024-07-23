
import { Navbar, Footer } from "./frontpage";

export const Connecta = ({infoSessions}) => {

    setTimeout(() => {
        let grufIdInput = document.getElementById("grufIdInput");
        grufIdInput.focus();

        grufIdInput.addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                goToGruf();
            }
        });
    }, 10);

    const goToGruf = () => {
        const grufId = document.getElementById("grufIdInput").value;
        if (grufId !== "") {
            const sessionUrl = appPrefix + "/gruf/" + grufId;
            window.location.replace(sessionUrl);
        }
    }

    return (
        <div>
            <Navbar/>
            <div className="connectat">
                <div>
                    <h1>ID del GRUF: <input id="grufIdInput" type="text"></input></h1>
                    <div>
                        <a id="connectaButton" className="btn-black"
                            onClick={goToGruf}
                        >Connecta't al GRUF</a>
                    </div>
                </div>
            </div>
            <div className="ultimsGrufs">
                <div>
                    <h3>Últims GRUFs:</h3>
                    <ul>
                        {infoSessions.slice(0, 10).map((item, index) => <li key={item.id}>{ item.id } "{ item.name }" ({ item.num_estacions } estacions, { item.connected_users.length } usuaris)&nbsp;
                            <a className="btn-petit-gris" href={appPrefix + "/gruf/" + item.id}>Connecta't</a>&nbsp;
                            <a className="btn-petit-gris" href={appPrefix + "/gruf/" + item.id + "/?local=1"}>Connecta't (mode local)</a>&nbsp;
                            <a className="btn-petit-vermell"  href={appPrefix + "/delete_session/" + item.id}>Elimina</a></li>)}
                    </ul>
                </div>
            </div>
            <div className="enrere">
                <a href={appPrefix + "/"} className="btn">Torna enrere</a>
            </div>
        </div>
    )
};
