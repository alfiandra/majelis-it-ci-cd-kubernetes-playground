package main

import (
	"fmt"
	"log"
	"os"

	"context"

	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/sdk/resource"
	trace2 "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"
)

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

func Logger(ctx context.Context, level, message any) {
	var traceId string
	if ctx.Value("traceid") == nil {
		traceId = "00000000000000000000"
	} else {
		traceId = ctx.Value("traceid").(string)
	}

	log.Printf("level=%s traceid=%v message=%v", level, traceId, message)
}
