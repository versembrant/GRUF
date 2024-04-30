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

import {EstacioSynth} from './estacions/estacioSynth'
registerEstacioDisponible(EstacioSynth);

import {EstacioGrooveBox} from './estacions/estacioGrooveBox'
registerEstacioDisponible(EstacioGrooveBox);

import {EstacioBaix} from './estacions/estacioBaix'
registerEstacioDisponible(EstacioBaix);