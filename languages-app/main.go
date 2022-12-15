package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"strconv"

	"github.com/ansrivas/fiberprometheus/v2"
	"github.com/gofiber/fiber/v2"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
)

const (
	ERROR            = "error"
	DEBUG            = "debug"
	APP_NAME         = "majelisit-languages-app"
	APP_DEFAULT_PORT = ":3000"
)

var APP_VERSION = os.Getenv("APP_VERSION")

func GetAvailableLanguages(c *fiber.Ctx) error {

	traceIdParent := c.GetReqHeaders()["Traceparent"]
	propagationHeader := propagation.MapCarrier{}
	propagationHeader.Set("traceparent", traceIdParent)
	propagator := propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{})

	ctx := propagator.Extract(c.UserContext(), propagationHeader)

	ctx, span := otel.Tracer("languages").Start(ctx, "accept request get languages list")

	ctx = context.WithValue(ctx, "traceid", span.SpanContext().TraceID().String())
	defer span.End()

	errorInstrumentationFlag, err := strconv.ParseBool(c.Query("error", "false"))

	if err != nil {
		Logger(ctx, ERROR, err.Error())
		return c.Status(500).SendString("Internal Server Error")
	}

	languages, err := GetLanguageList(ctx, "languages.json", errorInstrumentationFlag)

	if err != nil {
		Logger(ctx, ERROR, err.Error())
		return c.Status(500).SendString("Internal Server Error")
	}
	Logger(ctx, DEBUG, span.IsRecording())

	return c.Status(200).JSON(languages)
}

func GetLanguageList(ctx context.Context, path string, errorInstrumentation bool) (languages []string, err error) {
	ctx, span := otel.Tracer("languages").Start(ctx, "query to database")
	defer span.End()

	langSourceFile, err := os.ReadFile(path)

	if err != nil {
		span.RecordError(err)
		return
	}

	if errorInstrumentation {
		err = errors.New("Database Error: connection timeout")
		TraceError(span, err)
		Logger(ctx, ERROR, err.Error())
		return
	}

	err = json.Unmarshal(langSourceFile, &languages)

	Logger(ctx, DEBUG, span.IsRecording())

	return
}

func main() {
	traceProvider := InitTracing()
	otel.SetTracerProvider(traceProvider)

	app := fiber.New()

	prometheus := fiberprometheus.New("languages-service")
	prometheus.RegisterAt(app, "/metrics")

	app.Get("/v1/languages", prometheus.Middleware, GetAvailableLanguages)

	log.Fatal(app.Listen(APP_DEFAULT_PORT))

}
