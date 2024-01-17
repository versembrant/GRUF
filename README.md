# versembrant-bruixit

## Installation instructions

You need [Docker](https://www.docker.com/products/docker-desktop/) to be insalled in your machine. Assuming it is installed, follow these instructions:

1) Clone and `cd` to repo
```
git clone git@github.com:ffont/versembrant-bruixit.git
cd versembrant-bruixit/
```

2) Build Docker images:
```
docker compose build
```

3) Install static dependencies and build static:
```
docker compose run --rm server yarn install
docker compose run --rm server yarn build
```

4) Run server (this also inclues a static build watcher so that static files will be automatically rebuilt when modifying files):
```
docker compose up
```

5) Open running application by poiting the browser at `http://localhost:5555/`


## Diagrames

### Diagrama de blocs general

![alt text](_docs/Diagrama_de_blocs_general.png)


### Diagrama de blocs del model de dades

![alt text](_docs/Diagrama_de_blocs_model.png)


### Diagrama de l'aplicació

![alt text](_docs/Diagrama_aplicacio.png)
