FROM debian:buster

# Installation des dépendances
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential

# Installation de Node.js (version minimum pour installer `n`)
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Installation de `n` via npm
RUN npm install -g n

# Utilisation de `n` pour installer la dernière version de Node.js
RUN n latest

# Ajouter le répertoire de `n` au PATH
ENV PATH /usr/local/n/versions/node/$(n --version)/bin:$PATH

# Installation de global packages npm
RUN npm install -g @nestjs/cli

# Copie des fichiers du projet
COPY ./webmethodsmigrator /webmethodsmigrator/

# Copie du script d'initialisation
COPY init.sh ./

# Définition du répertoire de travail
WORKDIR /webmethodsmigrator/

# Installation des dépendances du projet
RUN npm install

# Définition du point d'entrée
ENTRYPOINT ["bash", "../init.sh"]
