"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var axios_1 = require("axios");
var bodyParser = require("body-parser");
var lodash_1 = require("lodash");
var opentelemetry = require("@opentelemetry/api");
var prombundle = require("express-prom-bundle");
var tracer_1 = require("./tracer");
var INTERNAL_SERVER_ERROR = "Internal Server Error";
var APP_NAME = "game-language-app";
var DEFAULT_APP_PORT = 5000;
var tracer = (0, tracer_1.default)(APP_NAME);
var LOG_ERROR_LEVEL = "error";
var LOG_DEBUG_LEVEL = "debug";
var logger = function (level, traceid, message) {
    console.log("level=".concat(level, " traceid=").concat(traceid, " message=").concat(message));
};
var main = function () {
    var app = express();
    app.use(express.static("public"));
    app.use(bodyParser.json());
    var metricsMiddleware = prombundle({
        includeMethod: true,
        includePath: true,
        includeStatusCode: true,
        includeUp: true,
        customLabels: {
            project_name: APP_NAME,
        },
        promClient: {
            collectDefaultMetrics: {},
        },
    });
    app.use(metricsMiddleware);
    app.get("/health", function (_, res) {
        res.status(200).send(process.env.APP_VERSION);
    });
    app.get("/search", function (req, res) {
        var spn = tracer.startSpan("".concat(req.method, " ").concat(req.path, " accept request search for ").concat(req.query.name));
        var spanCtx = opentelemetry.trace.setSpan(opentelemetry.context.active(), spn);
        spn.setAttribute("method", req.method);
        spn.setAttribute("path", req.path);
        logger(LOG_DEBUG_LEVEL, spn.spanContext().traceId, "searching language ");
        checkLanguageExistence(req.query.name, Boolean(req.query.fake_error), spanCtx)
            .then(function (result) {
            res
                .status(result.valueOf() ? 200 : 404)
                .send(result.valueOf() ? "Language Exist" : "Language doesn't exist");
        })
            .catch(function (e) {
            spn.recordException(e);
            spn.setStatus({
                code: opentelemetry.SpanStatusCode.ERROR,
                message: String(e),
            });
            logger(LOG_ERROR_LEVEL, spn.spanContext().traceId, String(e));
            res.status(500).send(INTERNAL_SERVER_ERROR);
        })
            .finally(function () { return spn.end(); });
    });
    app.listen(DEFAULT_APP_PORT, function () {
        console.log("".concat(APP_NAME, " app listening on port ").concat(DEFAULT_APP_PORT));
    });
};
var checkLanguageExistence = function (language, fakeError, spanCtx) { return __awaiter(void 0, void 0, void 0, function () {
    var spn, contextCarier, getLanguage, languageList, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("fake error", fakeError);
                spn = tracer.startSpan("index.checkLanguageExistence", undefined, spanCtx);
                contextCarier = {};
                spanCtx = opentelemetry.trace.setSpan(opentelemetry.context.active(), spn);
                opentelemetry.propagation.inject(spanCtx, contextCarier);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, axios_1.default.get("".concat(process.env.LANGUAGE_APP_HOST, "/v1/languages?error=").concat(fakeError), {
                        headers: contextCarier,
                    })];
            case 2:
                getLanguage = _a.sent();
                languageList = getLanguage.data;
                languageList = (0, lodash_1.map)(languageList, lodash_1.toLower);
                spn.end();
                return [2 /*return*/, (0, lodash_1.includes)(languageList, language.toLowerCase())];
            case 3:
                err_1 = _a.sent();
                spn.recordException(err_1);
                spn.end();
                logger(LOG_ERROR_LEVEL, spn.spanContext().traceId, String(err_1));
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
main();
