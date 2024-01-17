FROM python:3.12

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		nodejs \
        npm \
	&& rm -rf /var/lib/apt/lists/*

RUN npm install --global yarn

WORKDIR /code
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Add ssh files with correct permissions (needed for deploying)
RUN mkdir /ssh && cp /code/deploy/ssh/* /ssh && chmod -R 600 /ssh

CMD [ "python", "./server.py" ]
