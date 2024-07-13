FROM debian:buster

# Installation des dépendances
RUN apt-get update && apt-get install -y \
    curl \
    git

# Installation de la dernière version de Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Installation de global packages npm
RUN npm install -g \
    @nestjs/cli \
    n

# Copie des fichiers du projet
COPY ./webmethodsmigrator /webmethodsmigrator/

# Copie du script d'initialisation
COPY init.sh ./


# Définition du répertoire de travail
WORKDIR /webmethodsmigrator/

# Installation des packages npm supplémentaires
RUN npm install @nestjs/graphql \
    @nestjs/mapped-types \
    class-validator \
    class-transformer \
	graphql-subscriptions



# Définition du point d'entrée
ENTRYPOINT ["bash", "../init.sh"]
