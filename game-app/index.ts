import * as express from "express";
import { Express, Request, Response } from "express";
import axios from "axios";
import * as bodyParser from "body-parser";
import { get, includes, map, toLower } from "lodash";
import * as opentelemetry from "@opentelemetry/api";
import * as prombundle from "express-prom-bundle";
import initTracing from "./tracer";

const INTERNAL_SERVER_ERROR = "Internal Server Error";
const APP_NAME = "game-language-app";
const DEFAULT_APP_PORT = 5000;
const tracer = initTracing(APP_NAME);
const LOG_ERROR_LEVEL = "error";
const LOG_DEBUG_LEVEL = "debug";

const logger = (level: string, traceid: string, message: string) => {
  console.log(`level=${level} traceid=${traceid} message=${message}`);
};

const main = () => {
  const app: Express = express();
  app.use(express.static("public"));
  app.use(bodyParser.json());

  const metricsMiddleware = prombundle({
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

  app.get("/health", (_: Request, res: Response) => {
    res.status(200).send(process.env.APP_VERSION);
  });

  app.get("/search", (req: Request, res: Response) => {
    const spn: opentelemetry.Span = tracer.startSpan(
      `${req.method} ${req.path} accept request search for ${req.query.name}`
    );
    const spanCtx = opentelemetry.trace.setSpan(
      opentelemetry.context.active(),
      spn
    );
    spn.setAttribute("method", req.method);
    spn.setAttribute("path", req.path);

    logger(LOG_DEBUG_LEVEL, spn.spanContext().traceId, `searching language `);

    checkLanguageExistence(
      req.query.name as string,
      Boolean(req.query.fake_error),
      spanCtx
    )
      .then((result) => {
        res
          .status(result.valueOf() ? 200 : 404)
          .send(result.valueOf() ? "Language Exist" : "Language doesn't exist");
      })
      .catch((e) => {
        spn.recordException(e);
        spn.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: String(e),
        });
        logger(LOG_ERROR_LEVEL, spn.spanContext().traceId, String(e));
        res.status(500).send(INTERNAL_SERVER_ERROR);
      })
      .finally(() => spn.end());
  });

  app.listen(DEFAULT_APP_PORT, () => {
    console.log(`${APP_NAME} app listening on port ${DEFAULT_APP_PORT}`);
  });
};

const checkLanguageExistence = async (
  language: string,
  fakeError: boolean,
  spanCtx: opentelemetry.Context
): Promise<boolean> => {
  console.log("fake error", fakeError);
  const spn: opentelemetry.Span = tracer.startSpan(
    "index.checkLanguageExistence",
    undefined,
    spanCtx
  );

  const contextCarier = {};
  spanCtx = opentelemetry.trace.setSpan(opentelemetry.context.active(), spn);
  opentelemetry.propagation.inject(spanCtx, contextCarier);

  try {
    const getLanguage = await axios.get(
      `${process.env.LANGUAGE_APP_HOST}/v1/languages?error=${fakeError}`,
      {
        headers: contextCarier,
      }
    );

    let languageList = getLanguage.data;
    languageList = map(languageList, toLower);

    spn.end();

    return includes(languageList, language.toLowerCase());
  } catch (err: any) {
    spn.recordException(err);
    spn.end();
    logger(LOG_ERROR_LEVEL, spn.spanContext().traceId, String(err));

    return false;
  }
};

main();
