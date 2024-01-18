import datetime
import os

from fabric import task, Connection

"""
The remote server needs to have docker and nginx installed

Example usages:

docker-compose run --rm server fab deploy
docker-compose run --rm server fab deploy-nginx-conf
"""

code_dir = "/home/versembrant/versembrant-bruixit/"
host = "versembrant@cl2024011711001.dnssw.net"
host_root = "root@cl2024011711001.dnssw.net"
pem_file = "/ssh/id_rsa"


def print_banner(messages):
    print("...........................................")
    if type(messages) == list:
        for message in messages:
            print(message)
    else:
        print(messages)
    print("...........................................")
    print("")


@task
def deploy(ctx):
    messages = ["Deploying...", "Host: %s" % host, "Using pem: %s" % pem_file]
    print_banner(messages)

    with Connection(host=host, connect_kwargs={"key_filename": pem_file}) as c:
        with c.cd(code_dir):
            # Checkout code
            c.run("git pull")  # farà pull al branch que hi hagi actiu

            # Build docker image
            c.run("TMPDIR=$HOME/tmp docker compose -f docker-compose.prod.yml build")

            # Install and build static files
            c.run("TMPDIR=$HOME/tmp docker compose -f docker-compose.prod.yml run --rm server yarn install")
            c.run("TMPDIR=$HOME/tmp docker compose -f docker-compose.prod.yml run --rm server yarn build")

            # Restart
            c.run("TMPDIR=$HOME/tmp docker compose -f docker-compose.prod.yml stop")
            c.run("TMPDIR=$HOME/tmp docker compose -f docker-compose.prod.yml up -d --remove-orphans")


@task
def stop(ctx):
    messages = ["Stopping...", "Host: %s" % host, "Using pem: %s" % pem_file]
    print_banner(messages)

    with Connection(host=host, connect_kwargs={"key_filename": pem_file}) as c:
        with c.cd(code_dir):
            # Stop
            c.run("TMPDIR=$HOME/tmp docker compose -f docker-compose.prod.yml stop")


@task
def restart(ctx):
    messages = ["Stopping...", "Host: %s" % host, "Using pem: %s" % pem_file]
    print_banner(messages)

    with Connection(host=host, connect_kwargs={"key_filename": pem_file}) as c:
        with c.cd(code_dir):
            # Restart
            c.run("TMPDIR=$HOME/tmp docker compose -f docker-compose.prod.yml stop")
            c.run("TMPDIR=$HOME/tmp docker compose -f docker-compose.prod.yml up -d --remove-orphans")


@task
def deploy_nginx_conf(ctx):  # nginx config done with root user
    messages = ["Deploying nginx conf...", "Host: %s" % host_root, "Using pem: %s" % pem_file]
    print_banner(messages)
    with Connection(host=host_root, connect_kwargs={"key_filename": pem_file}) as c:

        # Copy nginx config files and restart
        c.put(
            "deploy/nginx/nginx.conf",
            os.path.join("/etc/nginx/nginx.conf"),
        )
        c.put(
            "deploy/nginx/sites-enabled/default",
            os.path.join("/etc/nginx/sites-enabled/default"),
        )
        c.run("certbot renew --quiet")
        c.run("service nginx reload && service nginx restart")
