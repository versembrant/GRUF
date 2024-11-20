
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
    const connectError = document.getElementById('root').dataset.connectError === "True";

    return (
        <div className="connectat-wrapper">
            <Navbar/>
            <div className="connectat">
                {connectError && <p class="connect-error">Oh no! Aquest Gruf no existeix! :(</p>}
                <div>
                    <h1>ID del GRUF: <input id="grufIdInput" type="text"></input></h1>
                    <ul>
                        <li><a href={appPrefix + "/nova_sessio"} class="btn btn-black">Crea un nou GRUF</a></li>
                        <li><button id="connectaButton" className="btn btn-black--primary"
                            onClick={goToGruf}
                        >Connecta't al GRUF</button></li>
                    </ul>
                </div>
            </div>
            { showUtimsGrufs && infoSessions.length !== 0 ? <div className="ultimsGrufs">
                <div>
                    <h3>Últims GRUFs:</h3>
                    <ul>
                        {infoSessions.slice(0, 10).map((item, index) => <li key={item.id}>{ item.id } "{ item.name }" ({ item.num_estacions + 2 } estacions, { item.connected_users.length } usuaris)&nbsp;
                            <a className="btn btn-petit btn-verd" href={appPrefix + "/g/" + item.id}>Connecta't</a>&nbsp;
                            <a className="btn btn-petit btn-gris" href={appPrefix + "/g/" + item.id + "/master/"}>Connecta't (master)</a>&nbsp;
                            <a className="btn btn-petit btn-gris" href={appPrefix + "/g/" + item.id + "/local/"}>Connecta't (local)</a>&nbsp;
                            <a className="btn btn-petit btn-vermell"  href={appPrefix + "/delete_session/" + item.id}>Elimina</a></li>)}
                    </ul>
                </div>
            </div>: ""}
            <Footer/>
        </div>
    )
};
