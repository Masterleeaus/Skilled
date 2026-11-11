import { describe, expect, it } from "vitest";
import { validateLocalDemoSeedTarget } from "../../prisma/local-demo-seed-guard";

const local = "postgresql://demo:secret@127.0.0.1:5544/skilled_demo";
const env = (DATABASE_URL = local, NODE_ENV = "development"): NodeJS.ProcessEnv => ({ DATABASE_URL, NODE_ENV });
const check = (environment = env(), args = ["--confirm-wipe"]) =>
  validateLocalDemoSeedTarget(environment, args);

describe("destructive local demo seed guard", () => {
  it("accepts an explicitly confirmed development-only loopback throwaway database", () => {
    expect(check()).toEqual({ host: "127.0.0.1:5544", name: "skilled_demo" });
    expect(check(env("postgres://demo:secret@localhost/skilled_sandbox", "test"))).toEqual({
      host: "localhost", name: "skilled_sandbox",
    });
    expect(check({ ...env(), SEED_CONFIRM_WIPE: "1" }, [])).toEqual({
      host: "127.0.0.1:5544", name: "skilled_demo",
    });
  });

  it.each(["production", "staging", "", "Development-staging"])(
    "refuses %j environments even with destructive confirmation", NODE_ENV => {
      expect(() => check(env(local, NODE_ENV))).toThrow(/NODE_ENV/);
    });

  it("refuses unconfirmed destructive operation", () => {
    expect(() => check(env(), [])).toThrow(/confirm-wipe/);
    expect(() => check(env(), ["--confirm-wipe", "--skip-validation"])).toThrow(/Unknown seed arguments/);
  });

  it.each([
    "postgresql://demo:secret@db.internal/skilled_demo",
    "postgresql://demo:secret@192.168.1.5/skilled_demo",
    "postgresql://demo:secret@prod.example/skilled_demo",
  ])("refuses remote database target %s", url => {
    expect(() => check(env(url))).toThrow(/loopback/);
  });

  it.each([
    "postgresql://demo:secret@localhost/titan_academy",
    "postgresql://demo:secret@localhost/TITAN_ACADEMY",
    "postgresql://demo:secret@localhost/postgres",
    "postgresql://demo:secret@localhost/template1",
    "postgresql://demo:secret@localhost/",
  ])("refuses protected, system or unnamed local target %s", url => {
    expect(() => check(env(url))).toThrow(/throwaway database/);
  });

  it("refuses absent URLs, invalid schemes and missing credentials", () => {
    expect(() => check(env(""))).toThrow(/DATABASE_URL/);
    expect(() => check(env("not-a-url"))).toThrow(/valid connection URL/);
    expect(() => check(env("mysql://demo:secret@localhost/skilled_demo"))).toThrow(/PostgreSQL/);
    expect(() => check(env("postgresql://localhost/skilled_demo"))).toThrow(/credentials/);
  });

  it("does not print the password or include it in the returned target", () => {
    const target = check();
    expect(JSON.stringify(target)).not.toContain("secret");
    expect(JSON.stringify(target)).not.toContain("demo:secret");
  });
});
