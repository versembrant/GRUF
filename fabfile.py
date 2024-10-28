import datetime
import os

from fabric import task, Connection

"""
The remote server needs to have docker and nginx installed

Example usages:

docker-compose run --rm server fab deploy
docker-compose run --rm server fab deploy-nginx-conf
"""

code_dir = "/home/versembrant/versembrant-gruf/"
code_dir_test = "/home/versembrant/test/versembrant-gruf/"
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
def deploy(ctx, branch="main", test=False):
    messages = ["Deploying...", "Host: %s" % host, "Using pem: %s" % pem_file, "Test: %s" % test, "Branch: %s" % branch]
    print_banner(messages)

    with Connection(host=host, connect_kwargs={"key_filename": pem_file}) as c:
        with c.cd(code_dir if not test else code_dir_test):
            # Checkout code
            c.run(f"git fetch")
            c.run(f"git checkout -f {branch}")
            c.run("git pull")

            if test:
                # Copy the .env file for test deployment
                c.put("deploy/.env_test", code_dir_test + '.env')

            compose_file = "docker-compose.prod.yml" if not test else "docker-compose.test.yml"
            server_service_name = "server" if not test else "server-test"
            tmp_dir = 'tmp' if not test else 'tmp-test'

            # Build docker image
            c.run(f"TMPDIR=$HOME/{tmp_dir} docker compose -f {compose_file} build")

            # Build sample library file
            c.run(f"TMPDIR=$HOME/{tmp_dir} docker compose -f {compose_file} run --rm {server_service_name} python make_sample_library.py")
            
            # Install and build static files
            c.run(f"TMPDIR=$HOME/{tmp_dir} docker compose -f {compose_file} run --rm {server_service_name} yarn install")
            c.run(f"TMPDIR=$HOME/{tmp_dir} docker compose -f {compose_file} run --rm {server_service_name} yarn build")

            # Restart
            c.run(f"TMPDIR=$HOME/{tmp_dir} docker compose -f {compose_file} stop")
            c.run(f"TMPDIR=$HOME/{tmp_dir} docker compose -f {compose_file} up -d")


@task
def stop(ctx, test=False):
    messages = ["Stopping...", "Host: %s" % host, "Using pem: %s" % pem_file, "Test: %s" % test]
    print_banner(messages)

    with Connection(host=host, connect_kwargs={"key_filename": pem_file}) as c:
        with c.cd(code_dir if not test else code_dir_test):
            # Stop
            compose_file = "docker-compose.prod.yml" if not test else "docker-compose.test.yml"
            tmp_dir = 'tmp' if not test else 'tmp-test'
            c.run(f"TMPDIR=$HOME/{tmp_dir} docker compose -f {compose_file} stop")


@task
def restart(ctx, test=False):
    messages = ["Stopping...", "Host: %s" % host, "Using pem: %s" % pem_file, "Test: %s" % test]
    print_banner(messages)

    with Connection(host=host, connect_kwargs={"key_filename": pem_file}) as c:
        with c.cd(code_dir if not test else code_dir_test):
            # Restart
            compose_file = "docker-compose.prod.yml" if not test else "docker-compose.test.yml"
            tmp_dir = 'tmp' if not test else 'tmp-test'
            c.run(f"TMPDIR=$HOME/{tmp_dir} docker compose -f {compose_file} stop")
            c.run(f"TMPDIR=$HOME/{tmp_dir} docker compose -f {compose_file} up -d")


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
