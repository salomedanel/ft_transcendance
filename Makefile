all: up

up:
	docker-compose up --build -d

watch:
	docker logs -f backend_container

watch-frontend:
	docker logs -f frontend_container

watch-db:
	docker logs -f postgres

clean:
	docker-compose down

studio:
	docker exec -it backend_container npx prisma studio

rebuild:
	docker-compose down
	docker-compose up --build -d

.PHONY: all up clean