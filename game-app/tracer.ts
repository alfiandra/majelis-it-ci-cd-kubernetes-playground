import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";

const initTracing = function (serviceName: string) {
  const traceExporter = new JaegerExporter({
    endpoint: `${process.env.JAEGER_COLLECTOR_HOST}/api/traces`,
  });
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
  provider.register();
  const tracer = provider.getTracer(serviceName);
  return tracer;
};

export default initTracing;
