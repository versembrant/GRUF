
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
            const sessionUrl = appPrefix + "/g/" + grufId;
            window.location.replace(sessionUrl);
        }
    }

    const showUtimsGrufs = document.getElementById("root").dataset.debugMode === "True";

    return (
        <div>
            <Navbar/>
            <div className="connectat">
                <div>
                    <h1>ID del GRUF: <input id="grufIdInput" type="text"></input></h1>
                    <div>
                        <button id="connectaButton" className="btn-black"
                            onClick={goToGruf}
                        >Connecta't al GRUF</button>
                    </div>
                </div>
            </div>
            { showUtimsGrufs ? <div className="ultimsGrufs">
                <div>
                    <h3>Últims GRUFs:</h3>
                    <ul>
                        {infoSessions.slice(0, 10).map((item, index) => <li key={item.id}>{ item.id } "{ item.name }" ({ item.num_estacions + 2 } estacions, { item.connected_users.length } usuaris)&nbsp;
                            <a className="btn-petit btn-verd" href={appPrefix + "/g/" + item.id}>Connecta't</a>&nbsp;
                            <a className="btn-petit btn-gris" href={appPrefix + "/g/" + item.id + "/master/"}>Connecta't (master)</a>&nbsp;
                            <a className="btn-petit btn-gris" href={appPrefix + "/g/" + item.id + "/local/"}>Connecta't (local)</a>&nbsp;
                            <a className="btn-petit btn-vermell"  href={appPrefix + "/delete_session/" + item.id}>Elimina</a></li>)}
                    </ul>
                </div>
            </div>: ""}
            <div className="enrere">
                <a href={appPrefix + "/"}>Ves a l'inici</a>
            </div>
        </div>
    )
};
