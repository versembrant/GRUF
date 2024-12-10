<p align="center">
  <img src="_docs/logo_readme.png" alt="logo">
</p>

## Instruccions d'instal·lació

Necessites que [Docker](https://www.docker.com/products/docker-desktop/) estigui funcionant al teu ordinador. Suposant que està instal·lat i en execució, segueix aquestes instruccions:

1. Clona i fes `cd` al repositori

```shell
git clone git@github.com:versembrant/GRUF.git
cd versembrant-gruf/
```

2. Construeix les imatges de Docker:

```shell
docker compose build
```

3. Construeix la biblioteca de mostres: els fitxers d'àudio per al sampler i el groovebox s'han de copiar a la carpeta `static/audio`, dins de les subcarpetes corresponents `/sampler` i `/groovebox`, i després s'ha d'executar el següent script de Python per crear el fitxer `sampleLibrary.js (tingues en compte que això s'ha d'executar una vegada, encara que sigui només per crear una biblioteca de sons buida). Els fitxers d'àudio es poden descarregar aquí: https://drive.google.com/file/d/1evpcD3svnlILLIfc8wSDF1PQrzoufyrb/view?usp=share_link

```shell
docker compose run --rm server python make_sample_library.py
```

4. Instal·la les dependències estàtiques i construeix els estàtics:

```shell
docker compose run --rm server yarn install
docker compose run --rm server yarn build
```

5. Executa l'aplicació (això també inclou un observador de compilació estàtica perquè els fitxers estàtics es tornin a construir automàticament quan es modifiqui el codi font):

```shell
docker compose up
```

6. Accedeix a l'aplicació amb el navegador a: `http://localhost:5555/gruf/`


## Diagrames

### Diagrama de blocs general

![diagrama de blocs general](_docs/Diagrama_de_blocs_general.png)

### Diagrama de blocs del model de dades

![diagrama models](_docs/Diagrama_de_blocs_model.png)

### Diagrama de l'aplicació

![diagrama aplicació](_docs/Diagrama_aplicacio.png)
