FROM python:3.12

# node, npm and yarn
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		nodejs \
        npm \
	&& rm -rf /var/lib/apt/lists/*
RUN npm install --global yarn

# ffmpeg
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		ffmpeg \
	&& rm -rf /var/lib/apt/lists/*

# python
WORKDIR /code
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy code
COPY . .

# Add ssh files with correct permissions (needed for deploying)
RUN mkdir /ssh && cp /code/deploy/ssh/* /ssh && chmod -R 600 /ssh

CMD [ "python", "./server.py" ]
