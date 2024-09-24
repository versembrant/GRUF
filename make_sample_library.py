import os
from server import app_prefix
import json

audio_folder = 'static/audio'


def get_tonality_from_filaname(filename):
    try:
        tonality_raw = filename.split(' - ')[1].split('.wav')[0]
        tonality_options = ['cmajor', 'cminor', 'c#major', 'c#minor', 'dmajor', 'dminor', 'ebmajor', 'ebminor', 'emajor', 'eminor', 'fmajor', 'fminor', 'f#major', 'f#minor', 'gmajor', 'gminor', 'abmajor', 'abminor', 'amajor', 'aminor', 'bbmajor', 'bbminor', 'bmajor', 'bminor']
        if tonality_raw in tonality_options:
            return tonality_raw
    except IndexError:
        pass    
    return None

def load_files_for_sampler(library, sampler_folder):
    for filaname in os.listdir(sampler_folder):
        if filaname.endswith('.wav'):
            tonality = get_tonality_from_filaname(filaname)
            if tonality is not None:
                library['sampler'].append({
                    'name': filaname.split(' - ')[0],
                    'url': f'/{app_prefix}/static/audio/sampler/{filaname.replace('#', '%23')}',
                    'tonality': tonality,
                })

def load_files_for_groovebox(library, groovebox_folder):
    for preset_name in os.listdir():
        preset_folder = os.path.join(groovebox_folder, preset_name)
        if not os.path.isdir(preset_folder):
            continue
        for filaname in os.listdir(preset_folder):
            if filaname.endswith('.wav'):
                if 'open hat' in filaname.lower() or 'tambourine' in filaname.lower():
                    name = 'sound1'
                elif 'closed hat' in filaname.lower():
                    name = 'sound2'
                elif 'kick' in filaname.lower():
                    name = 'sound4'
                elif 'snare' in filaname.lower() or 'clap' in filaname.lower():
                    name = 'sound3'
                else:
                    name = 'sound1'
                library['groovebox'].append({
                    'name': preset_name + '-' + name,
                    'url': f'/{app_prefix}/static/audio/groovebox/{preset_name}/{filaname}',
                })

def create_sample_library_from_audio_folder():
    library = {
        'sampler': [],
        'groovebox': [],
    }

    sampler_folder = os.path.join(audio_folder, 'sampler')
    os.makedirs(sampler_folder, exist_ok=True)
    load_files_for_sampler(library, sampler_folder)

    groovebox_folder = os.path.join(audio_folder, 'groovebox')
    os.makedirs(groovebox_folder, exist_ok=True)
    load_files_for_groovebox(library, groovebox_folder)

    return library


if __name__ == '__main__':
    library = create_sample_library_from_audio_folder()
    with open('static/src/js/sampleLibrary.js', 'w') as f:
        f.write(f'export const sampleLibrary = {json.dumps(library, indent=4)}')