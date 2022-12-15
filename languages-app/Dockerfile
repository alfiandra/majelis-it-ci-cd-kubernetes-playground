FROM golang:1.19-alpine as bebuilder
WORKDIR /app

COPY . .

RUN go mod tidy

RUN go build -o app .


FROM alpine:latest

WORKDIR /app

COPY --from=bebuilder /app/languages.json .
COPY --from=bebuilder /app/app .

EXPOSE 3000

ENV APP_VERSION=v1.0.0

ENTRYPOINT ["/app/app"]

ENV APP_VERSION=v2.0.0
