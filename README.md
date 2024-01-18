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


## Instruccions de desplegament en el servidor (swhosting)

Hi ha un script de python/fabric que s'encarrega d'agafar la última versio de codi de la branca `main`, actualizar el codi del servidor, fer un build dels arxius static, i fer un restart del `docker compose`. Només s'ha de córrer aquesta comanda:

```
# NOTA: això afectarà al servidor remot, no ho feu si no ho hem acordat abans :)
docker compose run --rm server fab deploy
```

OJU!: aquest repositori ja inclou les claus ssh necessàries per poder accedir al servidor remot, no el compartiu!

Podeu accedir a l'aplicació corrent al servidor remot aquí: http://cl2024011711001.dnssw.net

### SSL

Per fer funcionar HTTPS fem servir certificats de letsencrypt. Aquí hi ha instruccions: https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/
Bàsicament `certboot` de letsencrypt modifica la configuració de Nginx, així que si actualitzem la configuació hauriem d'actualitzar també amb `certbot`. La primera instal·lació de certificats es fa amb aquesta comanda:

```
sudo certbot --nginx -d
```

Després es pot renovar amb un `cronjob` automaticament (veure instruccions del link) o amb la comanda:

```
certbot renew --quiet
```