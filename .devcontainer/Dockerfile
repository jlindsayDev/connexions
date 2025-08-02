FROM oven/bun:canary-debian
# https://hub.docker.com/r/oven/bun
# latest, canary, canary-debian, canary-alpine, canary-slim

# Config Bun
ENV PATH="~/.bun/bin:${PATH}"
RUN ln -s /usr/local/bin/bun /usr/local/bin/node

RUN apt update
RUN apt install -y git wget curl

RUN bun add -D @biomejs/biome
