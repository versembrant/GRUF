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

CMD [ "python", "./server.py" ]
