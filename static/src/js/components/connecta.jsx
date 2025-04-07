import logo_gruf from "../../img/logo_gruf.svg"

export const SessionLikeFrame = ({content}) => {
    return (
        <div className="sessio-wrapper">
            <div>
                <div className="sessio">
                    <div className="header flex justify-between items-center">
                        <div className="titol ellipsis"><img src={logo_gruf} className="logo_gruf"/></div>
                    </div>
                    { content }
                    <div className="footer flex justify-between items-center">
                        <div></div>
                        <div>
                            <a className="btn-petit no-border" href={appPrefix + "/"}>Torna a l'inici</a>
                        </div>
                    </div>
                </div>
                <div className="sessio-logos">
                    <img src="/static/dist/landing/images/logo_versembrant_blanc.svg" alt="logo versembrant"/>
                    <img src="/static/dist/landing/images/logo_gene_blanc.svg" alt="logo generalitat"/>
                </div>
            </div>
        </div>
    )
}

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

    const connectError = document.getElementById('root').dataset.connectError === "True";
    return <SessionLikeFrame content={
        <div className="connectat">
            {connectError && <p className="connect-error">Oh no! Aquest Gruf no existeix! :(</p>}
            <div>
                <h1>ID del GRUF: <input id="grufIdInput" type="text"></input></h1>
                <ul>
                    <li><a href={appPrefix + "/nova_sessio"} className="btn btn-black">Crea un nou GRUF</a></li>
                    <li><button id="connectaButton" className="btn btn-black--primary"
                        onClick={goToGruf}
                    >Connecta't al GRUF</button></li>
                </ul>
            </div>
        </div>
    }/>
};
