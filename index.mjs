/**
 * Standalone Magpie GUI and token-pool providers (筱玖生图).
 * GUI entry runs in the plugin-host and serves its own sandboxed page.
 * Primary import & management live in the left-sidebar page (筱玖生图).
 */
import { CODEX_BASE, discoverPoolModels, poolFetch } from "./lib/codex-pool.mjs";
import { GUI_PORT, startGuiServer } from "./lib/gui-service.mjs";
import { createPoolConnector, POOL_MARKER, POOL_PROVIDER } from "./lib/pool-connection.mjs";
import { nativeImportMethod, webOAuthMethod } from "./lib/provider-native-signin.mjs";

let sharedClient = null;
let sharedConnector = null;
let sharedActiveKey = null;

function ensurePoolConnector(ctx) {
  if (typeof ctx?.magpie?.account === "function") {
    sharedActiveKey = () => String(ctx.magpie.account(POOL_PROVIDER) || "");
  }
  if (typeof ctx?.client?.auth?.set === "function" &&
      typeof ctx?.client?.auth?.remove === "function") {
    if (!sharedConnector || sharedClient !== ctx.client) {
      sharedClient = ctx.client;
      sharedConnector = createPoolConnector(ctx.client, {
        getActiveKey: () => (sharedActiveKey ? sharedActiveKey() : ""),
      });
    }
  }
  return sharedConnector;
}

function slotFromAuth(auth) {
  const slot = auth?.metadata?.poolSlot;
  return typeof slot === "string" && /^s[0-9a-f]{6,16}$/i.test(slot) ? slot : "";
}

export const XiaojiuImageGuiPlugin = async (ctx, options) => {
  const raw = options?.port ?? GUI_PORT;
  const port = Number(raw);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
    throw new Error("筱玖生图 GUI: invalid service port");
  const connection = ensurePoolConnector(ctx) || createPoolConnector(ctx.client);
  // The GUI port is normally held by the previous host, which is still
  // shutting down: a host restart overlaps the two for a moment.
  // startGuiServer waits for the port, so the plugin load does not: the
  // pool's provider side needs no GUI service and its models hook must
  // register at once ("筱玖生图 has no endpoint configured" otherwise).
  startGuiServer({ port, onPoolChange: () => connection.sync() }).catch(async (error) => {
    const message = "筱玖生图 GUI service could not start (" +
      String(error?.message || error) + "); the pool provider stays available, " +
      "the sidebar page is unavailable until the plugin host restarts";
    try {
      await ctx?.client?.app?.log?.({
        body: { service: "xiaojiu", level: "warn", message },
      });
    } catch {
      // A log that cannot be written must not stop the plugin from loading.
    }
  });
  // Restore Magpie's per-account local-pool slots automatically after
  // restarting. A corrupt vault must not make the GUI inaccessible.
  try {
    await connection.sync();
  } catch {
    await ctx.client.app.log({
      body: { service: "xiaojiu", level: "warn",
        message: "Could not restore local account-pool state; inspect GUI pool storage" },
    }).catch(() => {});
  }
  return {};
};

/**
 * Separate, multi-account access-token pool mode.
 * Every admitted vault account is synchronized to its own Magpie Providers
 * account row, allowing individual selection, preferred routing, and failover.
 */
export const XiaojiuPoolPlugin = async (ctx = {}) => {
  const connector = ensurePoolConnector(ctx);
  return {
    config: async (cfg) => {
      cfg.provider ??= {};
      cfg.provider[POOL_PROVIDER] ??= {
        name: "筱玖生图",
        npm: "@ai-sdk/openai",
        api: CODEX_BASE,
        models: {},
      };
    },
    auth: {
      provider: POOL_PROVIDER,
      maxConcurrency: 2,
      // Multi-account management stays enabled so every pooled account gets its
      // own toggleable row in Magpie Providers. Supports both browser OAuth
      // sign-in (open or copy link) and native TXT batch file import.
      methods: [
        webOAuthMethod({
          syncPool: () => sharedConnector?.sync(),
          claimSlotKey: (slot, key) => sharedConnector?.claimKey(slot, key),
          activeKey: () => (sharedActiveKey ? sharedActiveKey() : ""),
        }),
        nativeImportMethod({
          ...(connector ? { server: () => startGuiServer({ port: GUI_PORT, onPoolChange: () => sharedConnector?.sync() }) } : {}),
          syncPool: () => sharedConnector?.sync(),
          claimSlotKey: (slot, key) => sharedConnector?.claimKey(slot, key),
          activeKey: () => (sharedActiveKey ? sharedActiveKey() : ""),
        }),
      ],
      async loader(getAuth) {
        const auth = await getAuth();
        if (auth?.type !== "api") return {};
        const preferredSlot = slotFromAuth(auth);
        return {
          baseURL: CODEX_BASE,
          apiKey: POOL_MARKER,
          fetch: (input, init) => poolFetch(input, init, { preferredSlot }),
        };
      },
    },
    provider: {
      id: POOL_PROVIDER,
      async models(_provider, { auth } = {}) {
        if (auth?.type !== "api") return {};
        return discoverPoolModels({ preferredSlot: slotFromAuth(auth) });
      },
    },
  };
};
