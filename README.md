# versembrant-gruf

## Installation instructions

You need [Docker](https://www.docker.com/products/docker-desktop/) to be running in your machine. Assuming it is both installed and running, follow these instructions:

1. Clone and `cd` to repo

```shell
git clone git@github.com:ffont/versembrant-gruf.git
cd versembrant-gruf/
```

2. Build Docker images:

```shell
docker compose build
```

3. Build sample library: audio files for sampler and groovebox should be copied in `static/audio` folder, inside the corresponding `/sampler` and `/groovebox` subfolders, and the the following python script should be run to create `sampleLibrary.js` file (note that this needs to be run once, even if just to create an empty sound library). Audio files can be downloaded here: https://drive.google.com/file/d/1evpcD3svnlILLIfc8wSDF1PQrzoufyrb/view?usp=share_link

```shell
docker compose run --rm server python make_sample_library.py
```

4. Install static dependencies and build static:

```shell
docker compose run --rm server yarn install
docker compose run --rm server yarn build
```

5. Run server (this also includes a static build watcher so that static files will be automatically rebuilt when modifying files):

```shell
docker compose up
```

6. Open running application by poiting the browser at `http://localhost:5555/gruf/`

## Diagrames

### Diagrama de blocs general

![alt text](_docs/Diagrama_de_blocs_general.png)

### Diagrama de blocs del model de dades

![alt text](_docs/Diagrama_de_blocs_model.png)

### Diagrama de l'aplicació

![alt text](_docs/Diagrama_aplicacio.png)
