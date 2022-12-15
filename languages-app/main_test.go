package main

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.opentelemetry.io/otel"
)

func TestMain(m *testing.M) {
	traceProvider := InitTracing()
	otel.SetTracerProvider(traceProvider)
	os.Exit(m.Run())
}

func TestReadJsonAsSlices(t *testing.T) {
	traceProvider := InitTracing()
	otel.SetTracerProvider(traceProvider)
	t.Run("+ read json valid file", func(t *testing.T) {
		ctx := context.Background()
		workdir, _ := os.Getwd()
		filePath := fmt.Sprintf("%s/languages.json", workdir)
		_, err := GetLanguageList(ctx, filePath, false)
		assert.Nil(t, err)
	})
}
