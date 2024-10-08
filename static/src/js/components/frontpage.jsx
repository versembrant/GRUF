import { useState } from "react";

export const Navbar = () => {
    return  <div className="navbar">
                <ul>
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


export const Frontpage = () => {
    
    return(
        <div>
            <Navbar/>
            <div className="heroWrapper">
                <div className="hero">
                    <h1>Grufa sense parar!</h1>
                    <h2>Crea la teva música sol o en comunitat amb programari lliure i gratuït</h2>
                    <ul className="buttons">
                        <li><a className="btn-black" href={appPrefix + "/connecta"}>Connecta't a un GRUF</a></li>
                        <li><a className="btn-black" href={appPrefix + "/nova_sessio"}>Nou GRUF</a></li>
                    </ul>
                </div>
            </div>
            <Footer/>
        </div>
    )
};