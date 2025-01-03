import os
from server import app_prefix
import json

audio_folder = 'static/audio'


def get_tonality_from_filename(filename):
    try:
        tonality_raw = filename.split(' - ')[1].split('.wav')[0]
        tonality_options = ['cmajor', 'cminor', 'c#major', 'c#minor', 'dmajor', 'dminor', 'ebmajor', 'ebminor', 'emajor', 'eminor', 'fmajor', 'fminor', 'f#major', 'f#minor', 'gmajor', 'gminor', 'abmajor', 'abminor', 'amajor', 'aminor', 'bbmajor', 'bbminor', 'bmajor', 'bminor']
        if tonality_raw in tonality_options:
            return tonality_raw
    except IndexError:
        pass    
    return None

def load_files_for_sampler(library, sampler_folder):
    for filename in os.listdir(sampler_folder):
        if filename.endswith('.wav'):
            tonality = get_tonality_from_filename(filename)
            if tonality is not None:
                library['sampler'].append({
                    'name': filename.split(' - ')[0],
                    'url': f'/{app_prefix}/static/audio/sampler/{filename.replace('#', '%23')}',
                    'tonality': tonality,
                })

def load_files_for_groovebox(library, groovebox_folder):
    for drumkit_name in os.listdir(groovebox_folder):
        drumkit_path = os.path.join(groovebox_folder, drumkit_name)
        if not os.path.isdir(drumkit_path):
            continue
        for filename in os.listdir(drumkit_path):
            if filename.endswith('.wav'):
                if 'open hat' in filename.lower() or 'tambourine' in filename.lower():
                    name = 'open_hat'
                elif 'closed hat' in filename.lower():
                    name = 'closed_hat'
                elif 'kick' in filename.lower():
                    name = 'kick'
                elif 'snare' in filename.lower() or 'clap' in filename.lower():
                    name = 'snare'
                else:
                    name = 'open_hat'
                library['groovebox'].append({
                    'name': drumkit_name + '-' + name,
                    'url': f'/{app_prefix}/{drumkit_path}/{filename}',
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