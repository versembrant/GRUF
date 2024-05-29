// Javascript main files
import './serverComs'
import './audioEngine'
import './sessionManager'
import './midi'
import './3rd_party/webaudio-pianoroll'

// CSS
import '../styles/index.scss'

// Estacions (per afegir noves estacions, s'ha d'importar la classe aquí i registrar-la amb "registerEstacioDisponible")
import {registerEstacioDisponible} from './sessionManager'

import {PolySynth} from './estacions/polySynth'
registerEstacioDisponible(PolySynth);

import {EstacioGrooveBox} from './estacions/estacioGrooveBox'
registerEstacioDisponible(EstacioGrooveBox);

import {EstacioPiano} from './estacions/estacioPiano'
registerEstacioDisponible(EstacioPiano);