# versembrant-bruixit

Build Docker images:

    docker-compose build


Install static dependencies:

    docker-compose run --rm server yarn install


Run server (including static build watcher):

    docker-compose up


Open running application at `http://localhost:5555/`