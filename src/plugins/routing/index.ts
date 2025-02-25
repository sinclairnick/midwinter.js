import { AnyMeta, Midwinter } from "midwinter";
import { createRouter as createRadixRouter } from "./routers/radix";
import { RequestHandler } from "@/middleware/types";
import { RouteInput } from "./routers/types";
import { parsePathParams } from "./util";
import {
  InitRoutingReturn,
  RouteHandlerList,
  RouteHandlerMap,
  RouterOpts,
  RoutingOpts,
} from "./types";
import { WILDCARD_METHOD_KEY } from "./routers/util";

export type * from "./types";
export type * from "./util";

export type RoutingInitOpts = {
  router?: typeof createRadixRouter;
};

export const init = (opts: RoutingInitOpts = {}): InitRoutingReturn => {
  const { router = createRadixRouter } = opts;

  const route: InitRoutingReturn["route"] = <const T extends RoutingOpts>(
    config: T
  ): Midwinter<{}, T> => {
    if (config.path == null) {
      return new Midwinter(config);
    }

    return new Midwinter({
      ...config,
      params: parsePathParams(config.path),
    });
  };

  return {
    route,
    prefixed(prefix) {
      return (config) =>
        route({ ...config, path: `${prefix}${config.path ?? ""}` }) as any;
    },
    createRouter(
      routes: RouteHandlerList | RouteHandlerMap,
      opts: RouterOpts = {}
    ) {
      const {
        onNotFound = () => {
          return Response.json({ code: "NOT_FOUND" }, { status: 404 });
        },
        onError = () => {
          return Response.json({ code: "SERVER_EXCEPTION" }, { status: 500 });
        },
        keepTrailingSlashes = false,
      } = opts;

      const _routes: RouteInput<
        RequestHandler<AnyMeta, Response | undefined>
      >[] = (Array.isArray(routes) ? routes : Object.values(routes)).map(
        (route) => {
          const { method, path } = route.meta ?? {};

          // TODO: Add warnings/validation

          const _path = String(path);
          const _method = method == null ? WILDCARD_METHOD_KEY : method;

          return {
            methods: Array.isArray(_method) ? _method : [String(_method)],
            path: keepTrailingSlashes ? _path : _path.replace(/\/+$/, ""),
            payload: route,
          };
        }
      );

      const _router = router(_routes);

      return async (request: Request) => {
        try {
          const handler = _router.match(request);

          if (handler) {
            const response = await handler(request);
            if (response) return response;
          }

          return onNotFound(request);
        } catch (e) {
          return onError(e);
        }
      };
    },
  };
};

// export const LinearRouter = createLinearRouter;
export const RadixRouter = createRadixRouter;
