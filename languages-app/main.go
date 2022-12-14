package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/ansrivas/fiberprometheus/v2"
	"github.com/gofiber/fiber/v2"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/propagation"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"

	"go.opentelemetry.io/otel/sdk/resource"
	trace2 "go.opentelemetry.io/otel/sdk/trace"
)

const (
	ERROR            = "error"
	DEBUG            = "debug"
	APP_NAME         = "majelisit-languages-app"
	APP_DEFAULT_PORT = ":3000"
)

var APP_VERSION = os.Getenv("APP_VERSION")

func Logger(ctx context.Context, level, message any) {
	log.Printf("level=%s traceid=%v message=%v", level, ctx.Value("traceid").(string), message)
}

func InitTracing() *trace2.TracerProvider {

	resource := resource.NewWithAttributes(
		semconv.SchemaURL,
		semconv.ServiceNameKey.String(APP_NAME),
		semconv.ServiceVersionKey.String(APP_VERSION),
	)

	exp, err := jaeger.New(jaeger.WithCollectorEndpoint(jaeger.WithEndpoint(fmt.Sprintf("%s/api/traces", os.Getenv("JAEGER_COLLECTOR_HOST")))))
	if err != nil {
		log.Fatal(err)
	}
	tracingProvider := trace2.NewTracerProvider(
		trace2.WithBatcher(exp),
		trace2.WithResource(resource),
	)

	return tracingProvider
}

func TraceError(span trace.Span, err error) {
	defer span.End()
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())
}

func getAvailableLanguages(c *fiber.Ctx) error {

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

	languages, err := GetLanguageList(ctx, errorInstrumentationFlag)

	if err != nil {
		Logger(ctx, ERROR, err.Error())
		return c.Status(500).SendString("Internal Server Error")
	}
	Logger(ctx, DEBUG, span.IsRecording())

	return c.Status(200).JSON(languages)
}

func GetLanguageList(ctx context.Context, errorInstrumentation bool) (languages []string, err error) {
	langSourceFile, err := os.ReadFile("languages.json")
	ctx, span := otel.Tracer("languages").Start(ctx, "query to database")
	defer span.End()
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

	app.Get("/v1/languages", prometheus.Middleware, getAvailableLanguages)

	log.Fatal(app.Listen(APP_DEFAULT_PORT))

}
