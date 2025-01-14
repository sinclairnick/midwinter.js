import { describe, expect, expectTypeOf, test } from "vitest";
import { z, ZodError } from "zod";
import { init } from ".";
import { InferCtx, InferMeta } from "@/midwinter/infer";
import { ParseInputsFn } from "./types";
import { Midwinter } from "../../midwinter/midwinter";

describe("valid", () => {
  const mid = new Midwinter();

  const { valid, output } = init();

  describe("Types", () => {
    test("Initially has no type info", () => {
      const middleware = mid.use(valid({}));

      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toEqualTypeOf<{}>();
    });

    test("Initially uses default schema info", () => {
      const middleware = mid.use(valid({}));

      type Ctx = InferCtx<typeof middleware>;

      expectTypeOf<Ctx>().toMatchTypeOf<{
        params: Record<string, string | undefined>;
        query: Record<string, string | undefined>;
        body: unknown;
        headers: Record<string, string | undefined>;
      }>();
    });

    test("Adds query to meta and ctx", () => {
      const Query = z.object({ foo: z.boolean() });
      const middleware = mid.use(valid({ Query }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Query: typeof Query;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        query: { foo: boolean };
      }>();
    });

    test("Adds params to meta and ctx", () => {
      const Params = z.object({ foo: z.boolean() });
      const middleware = mid.use(valid({ Params }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Params: typeof Params;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        params: { foo: boolean };
      }>();
    });

    test("Adds body to meta and ctx", () => {
      const Body = z.object({ foo: z.boolean() });
      const middleware = mid.use(valid({ Body }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Body: typeof Body;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        body: { foo: boolean };
      }>();
    });

    test("Adds headers to meta and ctx", () => {
      const Headers = z.object({ foo: z.boolean() });
      const middleware = mid.use(valid({ Headers }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Headers: typeof Headers;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        headers: { foo: boolean };
      }>();
    });
  });

  // TODO: Runtime parsing

  describe("Runtime", () => {
    const WithId = z.object({ id: z.string() });
    const url = "https://test.com";

    test("Query: throws on invalid", async () => {
      const fetch = mid.use(valid({ Query: WithId })).end((req, { query }) => {
        return Response.json({});
      });

      await expect(() => fetch(new Request(url))).rejects.toThrowError(
        ZodError
      );
    });

    test("Query: OK on valid", async () => {
      const fetch = mid.use(valid({ Query: WithId })).end((req, { query }) => {
        return Response.json({});
      });

      await expect(fetch(new Request(url + "?id=123"))).resolves.toBeInstanceOf(
        Response
      );
    });

    test("Output: throws on invalid", async () => {
      const fetch = mid.use(valid({ Output: WithId })).end(
        output((req, ctx, meta) => {
          return { id: 23 };
        })
      );

      await expect(() => fetch(new Request(url))).rejects.toThrowError(
        ZodError
      );
    });

    test("Output: throws on invalid", async () => {
      const fetch = mid
        .use(
          valid({
            Output: z.object({
              id: z.number().transform(String),
            }),
          })
        )
        .end(
          output((req, ctx, meta) => {
            return { id: 23 };
          })
        );

      const res = await fetch(new Request(url));
      const body = await res.json();

      expect(body.id).toBe("23");
    });
  });

  // TODO: Output
});

describe("validLazy", () => {
  const mid = new Midwinter();

  const { validLazy } = init();

  describe("Types", () => {
    test("Initially has no type info", () => {
      const middleware = mid.use(validLazy({}));

      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toEqualTypeOf<{}>();
    });

    test("Initially uses default schema info", () => {
      const middleware = mid.use(validLazy({}));

      type Ctx = InferCtx<typeof middleware>;

      expectTypeOf<Ctx>().toMatchTypeOf<{
        parse: ParseInputsFn;
      }>();
    });

    test("Adds query to meta and ctx", () => {
      const Query = z.object({ foo: z.boolean() });
      const middleware = mid.use(validLazy({ Query }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Query: typeof Query;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        parse: ParseInputsFn<any, { foo: boolean }>;
      }>();
    });

    test("Adds params to meta and ctx", () => {
      const Params = z.object({ foo: z.boolean() });
      const middleware = mid.use(validLazy({ Params }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Params: typeof Params;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        parse: ParseInputsFn<{ foo: boolean }>;
      }>();
    });

    test("Adds body to meta and ctx", () => {
      const Body = z.object({ foo: z.boolean() });
      const middleware = mid.use(validLazy({ Body }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Body: typeof Body;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        parse: ParseInputsFn<any, any, { foo: boolean }>;
      }>();
    });

    test("Adds headers to meta and ctx", () => {
      const Headers = z.object({ foo: z.boolean() });
      const middleware = mid.use(validLazy({ Headers }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Headers: typeof Headers;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        parse: ParseInputsFn<any, any, any, { foo: boolean }>;
      }>();
    });
  });

  // TODO: Runtime parsing

  // TODO: Output
});
