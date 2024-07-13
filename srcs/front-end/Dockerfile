# Utiliser l'image de base Debian Buster
FROM debian:buster

# Mise à jour des paquets et installation des dépendances
RUN apt-get update && apt-get install -y \
    curl \
    git

# Installation de la dernière version de Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Copie des fichiers du projet
COPY ./webmethodsmigrator /webmethodsmigrator/

# Copie du script d'initialisation
COPY ./init.sh /

# Installation des dépendances Node.js
RUN npm install -g \
    @apollo/client \
    axios

# Définition du répertoire de travail
WORKDIR /webmethodsmigrator/


# Définition du point d'entrée
ENTRYPOINT ["bash", "../init.sh"]
