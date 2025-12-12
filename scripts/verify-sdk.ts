/**
 * Cloudflare SDK v5.x Type Verification Script
 *
 * This script verifies the SDK type structure for Phase 0 validation.
 * Run with: npx tsx scripts/verify-sdk.ts
 */

import Cloudflare from "cloudflare";

// --- SDK Client Initialization ---
const cf = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN || "dummy-token-for-type-check",
});

// --- DNS API Pattern Verification ---
async function verifyDnsApi(zoneId: string) {
  // List DNS records
  const records = await cf.dns.records.list({ zone_id: zoneId });
  console.log("DNS records type:", typeof records);

  // Create DNS record
  const created = await cf.dns.records.create({
    zone_id: zoneId,
    name: "test.example.com",
    type: "A",
    content: "192.0.2.1",
    ttl: 3600,
    proxied: false,
  });
  console.log("Created record ID:", created.id);

  // Update DNS record (partial update)
  await cf.dns.records.edit("record-id", {
    zone_id: zoneId,
    name: "test.example.com",
    type: "A",
    ttl: 7200,
  });

  // Delete DNS record
  await cf.dns.records.delete("record-id", { zone_id: zoneId });
}

// --- Tunnel API Pattern Verification ---
async function verifyTunnelApi(accountId: string) {
  // List all tunnels
  const tunnels = await cf.zeroTrust.tunnels.list({ account_id: accountId });
  console.log("Tunnels type:", typeof tunnels);

  // List Cloudflare Tunnels specifically
  const cloudflaredTunnels = await cf.zeroTrust.tunnels.cloudflared.list({
    account_id: accountId,
  });
  console.log("Cloudflared tunnels type:", typeof cloudflaredTunnels);

  // Create Cloudflare Tunnel (tunnel_secret is optional in SDK!)
  const tunnel = await cf.zeroTrust.tunnels.cloudflared.create({
    account_id: accountId,
    name: "my-tunnel",
    tunnel_secret: "base64-encoded-32-byte-secret", // Optional in v5.x
  });
  console.log("Created tunnel ID:", tunnel);

  // Get tunnel token (SDK supports this!)
  const token = await cf.zeroTrust.tunnels.cloudflared.token.get("tunnel-id", {
    account_id: accountId,
  });
  console.log("Token type:", typeof token); // string

  // Get tunnel configuration
  const config = await cf.zeroTrust.tunnels.cloudflared.configurations.get(
    "tunnel-id",
    { account_id: accountId }
  );
  console.log("Config type:", typeof config);

  // Update tunnel configuration (ingress rules)
  await cf.zeroTrust.tunnels.cloudflared.configurations.update("tunnel-id", {
    account_id: accountId,
    config: {
      ingress: [
        {
          hostname: "app.example.com",
          service: "http://localhost:8080",
        },
        {
          hostname: "api.example.com",
          service: "http://127.0.0.1:9000",
          path: "/api/*",
        },
        {
          hostname: "", // catch-all
          service: "http_status:404",
        },
      ],
    },
  });

  // Delete tunnel
  await cf.zeroTrust.tunnels.cloudflared.delete("tunnel-id", {
    account_id: accountId,
  });
}

// --- Access API Pattern Verification ---
async function verifyAccessApi(accountId: string) {
  // === Applications ===
  // List applications
  const apps = await cf.zeroTrust.access.applications.list({
    account_id: accountId,
  });
  console.log("Access apps type:", typeof apps);

  // Create self_hosted application
  const app = await cf.zeroTrust.access.applications.create({
    account_id: accountId,
    name: "Internal Dashboard",
    domain: "dash.example.com",
    type: "self_hosted",
    session_duration: "24h",
    // policies can be attached using policy IDs
  });
  console.log("Created app ID:", app);

  // Update application
  await cf.zeroTrust.access.applications.update("app-id", {
    account_id: accountId,
    name: "Updated Dashboard",
    domain: "dash.example.com",
    type: "self_hosted",
  });

  // Get application
  const appDetails = await cf.zeroTrust.access.applications.get("app-id", {
    account_id: accountId,
  });
  console.log("App details type:", typeof appDetails);

  // Delete application
  await cf.zeroTrust.access.applications.delete("app-id", {
    account_id: accountId,
  });

  // === Reusable Policies (Account Level) ===
  // List reusable policies
  const policies = await cf.zeroTrust.access.policies.list({
    account_id: accountId,
  });
  console.log("Policies type:", typeof policies);

  // Create reusable policy
  const policy = await cf.zeroTrust.access.policies.create({
    account_id: accountId,
    name: "Allow Employees",
    decision: "allow",
    include: [
      {
        email_domain: {
          domain: "example.com",
        },
      },
    ],
    exclude: [],
    require: [],
  });
  console.log("Created policy:", policy);

  // Update policy
  await cf.zeroTrust.access.policies.update("policy-id", {
    account_id: accountId,
    name: "Allow Employees Updated",
    decision: "allow",
    include: [
      {
        email_domain: {
          domain: "example.com",
        },
      },
    ],
  });

  // Get policy
  const policyDetails = await cf.zeroTrust.access.policies.get("policy-id", {
    account_id: accountId,
  });
  console.log("Policy details type:", typeof policyDetails);

  // Delete policy
  await cf.zeroTrust.access.policies.delete("policy-id", {
    account_id: accountId,
  });
}

// --- Type Exports Verification ---
// Check what types are exported from the SDK

// These imports should work based on SDK structure
import type { DNS } from "cloudflare/resources/dns/dns";
import type { ZeroTrust } from "cloudflare/resources/zero-trust/zero-trust";

// Type aliases for our app
type DnsRecord =
  Awaited<ReturnType<typeof cf.dns.records.list>> extends AsyncIterable<
    infer T
  >
    ? T
    : never;

console.log("Type verification complete!");
console.log("");
console.log("=== SDK Structure Summary ===");
console.log("");
console.log("DNS API:");
console.log("  - cf.dns.records.list({ zone_id })");
console.log("  - cf.dns.records.create({ zone_id, name, type, content, ... })");
console.log("  - cf.dns.records.edit(recordId, { zone_id, ... })");
console.log("  - cf.dns.records.delete(recordId, { zone_id })");
console.log("  - cf.dns.records.get(recordId, { zone_id })");
console.log("");
console.log("Tunnel API:");
console.log("  - cf.zeroTrust.tunnels.list({ account_id })");
console.log("  - cf.zeroTrust.tunnels.cloudflared.list({ account_id })");
console.log(
  "  - cf.zeroTrust.tunnels.cloudflared.create({ account_id, name, tunnel_secret? })"
);
console.log(
  "  - cf.zeroTrust.tunnels.cloudflared.delete(tunnelId, { account_id })"
);
console.log(
  "  - cf.zeroTrust.tunnels.cloudflared.token.get(tunnelId, { account_id })"
);
console.log(
  "  - cf.zeroTrust.tunnels.cloudflared.configurations.get(tunnelId, { account_id })"
);
console.log(
  "  - cf.zeroTrust.tunnels.cloudflared.configurations.update(tunnelId, { account_id, config })"
);
console.log("");
console.log("Access API:");
console.log("  - cf.zeroTrust.access.applications.list({ account_id })");
console.log(
  "  - cf.zeroTrust.access.applications.create({ account_id, name, domain, type, ... })"
);
console.log(
  "  - cf.zeroTrust.access.applications.update(appId, { account_id, ... })"
);
console.log("  - cf.zeroTrust.access.applications.delete(appId, { account_id })");
console.log("  - cf.zeroTrust.access.applications.get(appId, { account_id })");
console.log("  - cf.zeroTrust.access.policies.list({ account_id })");
console.log(
  "  - cf.zeroTrust.access.policies.create({ account_id, name, decision, include, ... })"
);
console.log(
  "  - cf.zeroTrust.access.policies.update(policyId, { account_id, ... })"
);
console.log(
  "  - cf.zeroTrust.access.policies.delete(policyId, { account_id })"
);
console.log("  - cf.zeroTrust.access.policies.get(policyId, { account_id })");
