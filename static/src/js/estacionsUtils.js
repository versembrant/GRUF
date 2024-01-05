class EstacioHelperBase {
    constructor(helperName) {
        this.helperName = helperName
    }
    getInitialParametersState(){
        const initialParametersState = {}
        this.getParameterNames().forEach(parameterName => {
            initialParametersState[parameterName] = this.getParametersData()[parameterName].initial;
        })
        return initialParametersState;
    }
    getParameterNames() {
        return Object.keys(this.getParametersData())
    }    
    getInitialState() {
        return {
            helperName: this.helperName,
            uiWidget: this.defaultUiWidget,
            parametres: this.getInitialParametersState(),
        };
    }
}


const estacionsHelpers = {};


export { EstacioHelperBase, estacionsHelpers }