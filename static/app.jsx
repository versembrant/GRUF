const { createElement: e } = React;

function EstacioOsciladorUI({ nomEstacio }) {

  const estacio = currentSession.data.estacions[nomEstacio];
  const store = estacio.store;
  const [state, setState] = React.useState(store.getState());

  React.useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });
    return () => unsubscribe();
  }, [setState]);

  return e(
    'main',
    null,
    e('h1', null, nomEstacio),
    e('p', null, 'Tipus:', estacio.tipus),
    e('p', null, 'Osc freq: ', state.freq),
    e(
      'input',
      {'type': 'range', 'min': '100', 'max': '4000', 'value': state.freq, onInput: (evt) => currentSession.updateParameterInServer(nomEstacio, 'freq', evt.target.value)},
      null
    ),
  );
}

document.addEventListener("newSessionDataLoaded",
  (evt) => {
      console.log('Set currentSession', currentSession);
      const id = 'root';
      const domRoot = document.getElementById(id);
      const reactRoot = ReactDOM.createRoot(domRoot);

      const estacionsReactElements = [];
      for (var estacio in currentSession.data.estacions) {
        if (Object.prototype.hasOwnProperty.call(currentSession.data.estacions, estacio)) {
          const estacioObj = currentSession.data.estacions[estacio];
          switch (estacioObj.tipus) {
            case 'oscilador':
              estacionsReactElements.push(e(EstacioOsciladorUI, {'nomEstacio': estacio}));
        }
      }

      reactRoot.render(e(React.StrictMode, null, ...estacionsReactElements));
    }
  },
  false,
);
