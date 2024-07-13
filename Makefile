up:
	docker compose up --build --force-recreate #-d

down:
	docker compose down

ps:		
	docker compose ps -a
	docker ps -a

clean:	down
	docker system prune
	docker volume prune

re : 	clean up

back-end: 
	docker exec -it back-end bash

front-end: 
	docker exec -it front-end bash


up-front-end:
	docker build -t front-end srcs/front-end/Dockerfile
	docker run --name front-end  front-end

up-back-end:
	docker build -t back-end  srcs/back-end/Dockerfile
	docker run --name back-end -d back-end

down-front-end:
	docker stop front-end
	docker rm front-end

down-back-end:
	docker stop back-end
	docker rm back-end

.PHONY: up down re ps clean front-end back-end db up-front-end up-back-end down-front-end down-back-end