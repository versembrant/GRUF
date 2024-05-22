// Javascript main files
import './serverComs'
import './audioEngine'
import './sessionManager'
import './midi'

// CSS
import '../styles/index.scss'

// Estacions (per afegir noves estacions, s'ha d'importar la classe aquí i registrar-la amb "registerEstacioDisponible")
import {registerEstacioDisponible} from './sessionManager'

import {EstacioDrumMachine} from './estacions/estacioDrumMachine'
registerEstacioDisponible(EstacioDrumMachine);

import {PolySynth} from './estacions/polySynth'
registerEstacioDisponible(PolySynth);

import {EstacioGrooveBox} from './estacions/estacioGrooveBox'
registerEstacioDisponible(EstacioGrooveBox);