lint:
	npm run lint

docker:
	docker build -t deetoreu/scarlet-usage:latest .

docker-arm:
	docker buildx build --platform=linux/arm/v7 -t deetoreu/scarlet-usage:latest .
