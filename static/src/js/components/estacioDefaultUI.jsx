import { createElement } from "react";
import { subscribeToStoreChanges } from "../utils";
import { getCurrentSession } from "../sessionManager";
import { getAudioGraphInstance } from '../audioEngine';
import { indexOfArrayMatchingObject, real2Norm, norm2Real } from "../utils";

const FloatParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue >= 5 ? parameterValue.toFixed(0) : parameterValue}</p>
            <input
                type="range"
                min={0.0}
                max={1.0}
                step={0.01}
                value= {real2Norm(parameterValue, parameterDescription)} 
                onInput={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, norm2Real(evt.target.value, parameterDescription))}/> 
                </div>
    )
};

const TextParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <input
                type="text"
                style={{width: "100%"}}
                value={parameterValue}
                onInput={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, evt.target.value)} />
        </div>
    )
};

const EnumParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    return (
        <div>
            <p>{parameterDescription.label}: {parameterValue}</p>
            <select
                value={parameterValue}
                onChange={(evt) => getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, evt.target.value)}>
                {parameterDescription.options.map((option, i) => <option key={option} value={option}>{option}</option>)}
            </select>
        </div>
    )
};

const GridParameterDefaultWidget = ({parameterDescription, parameterValue, nomEstacio}) => {
    const estacio = getCurrentSession().getEstacio(nomEstacio);
    const numRows = parameterDescription.numRows;
    const numSteps = parameterDescription.numCols;
    const currentStep = getAudioGraphInstance().getMainSequencerCurrentStep() % numSteps;
    const stepsElementsPerRow = []
    for (let i = 0; i < numRows; i++) {
        const stepsElements = []
        for (let j = 0; j < numSteps; j++) {
            const filledClass = indexOfArrayMatchingObject(parameterValue, {'i': i, 'j': j}) > -1 ? 'filled' : '';
            const activeStep = (currentStep == j && (getAudioGraphInstance().isPlayingLive() || (getAudioGraphInstance().isPlayingArranjement() && estacio.getCurrentLivePreset() === estacio.arranjementPreset ))) ? 'active' : '';
            stepsElements.push(
            <div 
                key={i + "_" + j} // To avoid React warning
                className={'step ' + filledClass + ' ' + activeStep}
                onMouseDown={(evt) => {
                    let updatedParameterValue = [...parameterValue]
                    const index = indexOfArrayMatchingObject(parameterValue, {'i': i, 'j': j});
                    if (index > -1){
                        updatedParameterValue.splice(index, 1);
                    } else {
                        updatedParameterValue.push({'i': i, 'j': j})
                    }
                    getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, updatedParameterValue)
                }}>
            </div>
            )
        }
        stepsElementsPerRow.push(stepsElements)
    }
    
    return (
        <div>
            <p>{parameterDescription.label}: {JSON.stringify(parameterValue)}</p>
            <div className="grid-default">
                {stepsElementsPerRow.map(function(stepsElements, i){
                    return <div className="grid-row-default" key={'row_' + i}>{stepsElements}</div>;
                })}
            </div>
            <div>
            <button onMouseDown={(evt)=>
                getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [])
            }>Clear</button>
            </div>
            <div>
                Patró:
                <select>
                    <option key={"patro0"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [])
                    }>Cap</option>
                    <option key={"patro1"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":3,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":0,"j":14},{"i":3,"j":15}])
                    }>Hip Hop Classic 1</option>
                    <option key={"patro2"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":3,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":3,"j":9},{"i":1,"j":14},{"i":2,"j":15}])
                    }>Hip Hop Classic 2</option>
                    <option key={"patro3"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":12},{"i":1,"j":14},{"i":2,"j":15},{"i":2,"j":2},{"i":3,"j":4},{"i":0,"j":11},{"i":3,"j":11},{"i":1,"j":13},{"i":3,"j":13}])
                    }>Reggae Roots</option>   
                    <option key={"patro4"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":4},{"i":1,"j":6},{"i":1,"j":10},{"i":1,"j":12},{"i":1,"j":14},{"i":3,"j":4},{"i":1,"j":2},{"i":3,"j":2},{"i":2,"j":4},{"i":3,"j":6},{"i":0,"j":8},{"i":3,"j":8},{"i":3,"j":10},{"i":2,"j":12},{"i":3,"j":12},{"i":3,"j":14}])
                    }>Dub Reggae</option>
                    <option key={"patro5"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":12},{"i":1,"j":14},{"i":2,"j":4},{"i":3,"j":8},{"i":2,"j":12}])
                    }>Soul Pop (Billie Jean)</option>
                    <option key={"patro6"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":3,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":3,"j":2},{"i":3,"j":8},{"i":1,"j":14},{"i":2,"j":15}])
                    }>Funky Soul</option>
                    <option key={"patro7"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":4},{"i":2,"j":4},{"i":1,"j":6},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":12},{"i":2,"j":12},{"i":3,"j":8},{"i":0,"j":0},{"i":3,"j":4},{"i":3,"j":12},{"i":0,"j":14}])
                    }>Acid House</option>
                    <option key={"patro8"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":1},{"i":1,"j":5},{"i":1,"j":7},{"i":2,"j":8},{"i":1,"j":11},{"i":1,"j":13},{"i":1,"j":14},{"i":1,"j":15}])
                    }>Trap 1</option>
                    <option key={"patro9"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":8},{"i":1,"j":10},{"i":1,"j":1},{"i":1,"j":5},{"i":2,"j":8},{"i":1,"j":11},{"i":1,"j":13},{"i":1,"j":15},{"i":1,"j":4},{"i":3,"j":4},{"i":1,"j":9},{"i":3,"j":15}])
                    }>Trap 2</option>
                    <option key={"patro10"} onMouseDown={(evt)=>
                        getCurrentSession().getEstacio(nomEstacio).updateParametreEstacio(parameterDescription.nom, [{"i":3,"j":0},{"i":1,"j":0},{"i":1,"j":2},{"i":1,"j":10},{"i":1,"j":4},{"i":3,"j":4},{"i":2,"j":3},{"i":1,"j":6},{"i":2,"j":6},{"i":1,"j":8},{"i":3,"j":8},{"i":2,"j":11},{"i":1,"j":12},{"i":3,"j":12},{"i":2,"j":14},{"i":0,"j":14}])
                    }>Urban Reggaeton</option>
                </select>
            </div>

        </div>
    )
};

// Util function to create UI widgets for the default UIs
const creaUIWidgetPerParametre = (estacio, nomParametre) => {
    const parameterDescription = estacio.getParameterDescription(nomParametre);
    const parametreValorState = estacio.getParameterValue(nomParametre, estacio.getCurrentLivePreset());
    const widgetUIClassParameterType = {
        float: FloatParameterDefaultWidget,
        enum: EnumParameterDefaultWidget,
        text: TextParameterDefaultWidget,
        grid: GridParameterDefaultWidget
    }
    const widgetUIClass = widgetUIClassParameterType[parameterDescription.type]
    if (widgetUIClass === undefined) {
        return (<div key={estacio.nom + '_' + nomParametre}>
            <p>No UI widget for parameter type: {parameterDescription.type}</p>
        </div>);
    } else {
        return (
            createElement(
                widgetUIClass,
                {key:estacio.nom + '_' + nomParametre, parameterDescription:parameterDescription, parameterValue:parametreValorState, nomEstacio:estacio.nom},
                null
            )
        );
    }
}

export const EstacioDefaultUI = ({estacio}) => {
    subscribeToStoreChanges(estacio);  // Subscriu als canvis de paràmetres de la pròpia estació
    subscribeToStoreChanges(getAudioGraphInstance());  // Subscriu als canvis de l'audio graph per actualizar current step del sequencer principal
    
    const parametresElements = [];
    estacio.getParameterNames().forEach(nomParametre => {
        parametresElements.push(creaUIWidgetPerParametre(estacio, nomParametre));
    });

    return (<div key={estacio.nom}>
        <div>
            <div className="preset-buttons grid-default">
                <div className="grid-row-default">
                    {[...Array(estacio.numPresets).keys()].map(i => 
                    <div key={"preset_" + i}
                        className={"step" + (getCurrentSession().getLivePresetsEstacions()[estacio.nom] == i ? " filled": "")}
                        onClick={(evt) => {getCurrentSession().liveSetPresetForEstacio(estacio.nom, i)}}>
                            {i}
                    </div>
                    )}
                </div>
            </div>
            <h2>{ estacio.nom }</h2>
            <p>Tipus: { estacio.tipus }</p>
        </div>
        <div>
            {parametresElements}
        </div>
    </div>)
};