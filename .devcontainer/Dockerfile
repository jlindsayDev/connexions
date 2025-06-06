FROM oven/bun:slim

# Config Bun
ENV PATH="~/.bun/bin:${PATH}"
RUN ln -s /usr/local/bin/bun /usr/local/bin/node

# Update packages
RUN if [ "alpine" == "alpine" ] ; then apk update ; else apt update ; fi

# Install Git
RUN if [ "alpine" == "alpine" ] ; then apk add git ; else apt install -y git ; fi
