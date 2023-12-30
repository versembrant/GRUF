const { createElement: e } = React; // Util used in other react components: e = React.createElement

document.addEventListener("newSessionDataLoaded", (evt) => {
    console.log('Set currentSession', currentSession);
    const id = 'root';
    const domRoot = document.getElementById(id);
    const reactRoot = ReactDOM.createRoot(domRoot);
    
    // Crea un react element per a cada estació
    // TODO: en un futur, només crea l'element per a l'estació sel·leccionada'
    const estacionsReactElements = [];
    for (var estacio in currentSession.estacions) {
        if (Object.prototype.hasOwnProperty.call(currentSession.estacions, estacio)) {
            const estacioObj = currentSession.estacions[estacio];
            estacionsReactElements.push(e(window[estacioObj.uiWidget], {'nomEstacio': estacio}));
        }   
        reactRoot.render(e(React.StrictMode, null, ...estacionsReactElements));
    }
},
false,
);
