// Javascript main files
import './serverComs'
import './audioEngine'
import './sessionManager'
import './midi'
import './3rd_party/gruf-pianoroll'

// CSS
import '../styles/index.scss'

// favicon
import '../img/favicon.svg'


// Estacions (per afegir noves estacions, s'ha d'importar la classe aquí i registrar-la amb "registerEstacioDisponible")
import {registerEstacioDisponible} from './sessionManager'

import {Synth} from './estacions/synth'
registerEstacioDisponible(Synth);

import {EstacioGrooveBox} from './estacions/estacioGrooveBox'
registerEstacioDisponible(EstacioGrooveBox);

import {EstacioPiano} from './estacions/estacioPiano'
registerEstacioDisponible(EstacioPiano);

//import {MonoSynth} from './estacions/monoSynth'
//registerEstacioDisponible(MonoSynth);

import {EstacioBaix} from './estacions/estacioBaix'
registerEstacioDisponible(EstacioBaix);

import {EstacioSampler} from './estacions/estacioSampler'
registerEstacioDisponible(EstacioSampler);