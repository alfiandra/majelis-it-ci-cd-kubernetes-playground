"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
var sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
var resources_1 = require("@opentelemetry/resources");
var semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
var sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
var initTracing = function (serviceName) {
    var _a;
    var traceExporter = new exporter_jaeger_1.JaegerExporter({
        endpoint: "http://127.0.0.1:14268/api/traces",
    });
    var provider = new sdk_trace_node_1.NodeTracerProvider({
        resource: new resources_1.Resource((_a = {},
            _a[semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME] = serviceName,
            _a)),
    });
    provider.addSpanProcessor(new sdk_trace_base_1.SimpleSpanProcessor(traceExporter));
    provider.register();
    var tracer = provider.getTracer(serviceName);
    return tracer;
};
exports.default = initTracing;
