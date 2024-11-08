import { useEffect } from "react";
import logo_gruf from "../../img/logo_gruf_gris.svg"

export const Navbar = () => {
    return  <div className="navbar">
                <ul>
                    <li><a href={appPrefix + "/"}><img height='40px' src={logo_gruf}></img></a></li>
                    <li><a href={appPrefix + "/"}>Versembrant</a></li>
                    <li><a href={appPrefix + "/"}>Tutorials</a></li>
                </ul>
            </div>}


export const Footer = () => {
    return  <div className="footer">
    <ul>
        <li>Un projecte de <a href="https://versembrant.cat/"><img height="25px" src="https://versembrant.cat/wp-content/uploads/2019/09/cropped-LOGO-COMPLET-Versembrant-Color-RGB-e1604594991611.png"/></a></li>
        <li>Amb el support de <a href="https://empresa.gencat.cat/ca/inici/index.html"><img height="25px" src={appPrefix + "/static/src/img/logo_gene.svg"}/></a></li>
        <li><a href={appPrefix + "/"}>Avís legal</a></li>
    </ul>
</div>}

const LandingContent = () => {
    return (
        <div id="landingContent">
            <section id="descripcio-curta">
                <h2>Què és el GRUF?</h2>
                <p>
                    <b>El GRUF és un programari lliure de producció musical</b>, en versió web i aplicació, dissenyat especialment per a l’aprenentatge de competències musicals i artístiques, i que integra els principals instruments que s’utilitzen en l’àmbit de la producció musical actual (sàmpler, seqüenciador, sintetitzador, mesclador…). Amb el GRUF podràs aprendre a produir els teus pròpis beats o crear en comunitat de forma col·laborativa.
                </p>
                <div style={{display: "flex", justifyContent:"center", marginTop: "30px", marginBottom: "30px"}}>
                    <div style={{border:"1px solid white", width:"800px", height:"500px"}}>
                        VIDEO INCRUSTAT
                    </div>
                </div>
            </section>

            <section id="projecte-versembrant">
                <h2>Un projecte de Versembrant</h2>
                <p>
                    Versembrant SCCL és una escola itinerant constituïda en cooperativa de treball associat que ha viscut un creixement i consolidació notable els 4 darrers anys.
                </p>
                <p>
                    Som un projecte socioeducatiu de formació i acompanyament per a la creació artística,  nascut amb l’objectiu d’impulsar el treball en valors com la igualtat, l’esperit crític, la cooperació, la no discriminació i l’educació emocional entre infants i joves. Ho fem mitjançant activitats educatives emmarcades dins de la cultura urbana -i el Hip Hop en particular- en centres educatius.
                </p>
            </section>

            <section id="marc-pedagogic">
                <h2>Marc pedagògic</h2>
                <p>
                    El GRUF està dissenyat per ser molt més que un programari lliure de creació de beats. També ofereix la possibilitat de ser integrat dins l’àmbit de l’aprenentatge musical i artístic a l’aula, tant a Primària com a Secundària, com altres centres d'ensenyament musical reglat i no reglat.
                </p>
                <p>
                    Oferim una guia per al professorat amb materials formatius amb l’objectiu no només de capacitar-los en la utilització del programari, sinó que també oferim una sèrie d’unitats didàctiques dins les competències bàsiques dins els currículums.
                </p>
                <p style={{textAlign: "center", marginTop: "30px", marginBottom: "30px"}}>
                    <a href="#">Descarrega el manual</a>
                </p>
                <p>
                    Vols el material formatiu i la proposta d'unitats didàctiques? <a href="#" className="no-button" >Contacta'ns</a>
                </p>
            </section>

            <section id="programari-lliure">
                <h2>Programari lliure</h2>
                <p>
                    EL GRUF és un programari lliure sota una llicència <a href="https://www.gnu.org/licenses/quick-guide-gplv3.ca.html" className="no-button" target="_blank">GPLv3</a>, això vol dir que el codi font del GRUF és obert i lliure, i que qualsevol persona pot accedir-hi, modificar-lo, compartir-lo i contribuïr en el seu desenvolupament.
                </p>
                <p style={{textAlign:"center", marginTop:"30px", marginBottom: "50px"}}>
                    <a href="https://github.com/versembrant/GRUF">Repositori de codi</a>
                </p>
            </section>

            <section id="opinions">
                <h2>Opinions</h2>
                <p>
                    “El GRUF és una eina molt potent per a l’aprenentatge musical i artístic” - Nom Cognom o Entitat o whatever
                </p>
                <p>
                    “El GRUF és una eina molt potent per a l’aprenentatge musical i artístic” - Nom Cognom o Entitat o whatever
                </p>
            </section>
    </div>
    )
}

export const Frontpage = () => {
    return(
        <div>
            <Navbar/>
            <div className="heroWrapper">
                <div className="hero">
                    <h1>Fot-li al GRUF!</h1>
                    <h2>Crea la teva música sol o en comunitat amb programari lliure i gratuït</h2>
                    <ul className="buttons">
                        <li><a className="btn-black" href={appPrefix + "/connecta"}>Connecta't a un GRUF</a></li>
                        <li><a className="btn-black" href={appPrefix + "/nova_sessio"}>Crea un nou GRUF</a></li>
                    </ul>
                </div>
            </div>
            <LandingContent />
            <Footer/>
        </div>
    )
};