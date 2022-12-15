#!/bin/bash

curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok

wget -O hey https://hey-release.s3.us-east-2.amazonaws.com/hey_linux_amd64 && chmod +x hey

cp hey /usr/local/bin/hey