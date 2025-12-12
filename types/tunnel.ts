/**
 * Tunnel status types from Cloudflare API
 */
export type TunnelStatus = 'inactive' | 'degraded' | 'healthy' | 'down';

/**
 * Tunnel connection information
 */
export interface TunnelConnection {
  id: string;
  client_id: string;
  client_version: string;
  colo_name: string;
  is_pending_reconnect: boolean;
  opened_at: string;
  origin_ip: string;
  uuid: string;
}

/**
 * Tunnel type for the application
 */
export interface Tunnel {
  id: string;
  name: string;
  status: TunnelStatus;
  created_at?: string;
  deleted_at?: string | null;
  connections?: TunnelConnection[];
  conns_active_at?: string | null;
  conns_inactive_at?: string | null;
  tun_type?: string;
  remote_config?: boolean;
}

/**
 * Ingress rule for Cloudflare API format
 */
export interface IngressRule {
  hostname?: string;
  service: string;
  path?: string;
}

/**
 * Tunnel configuration
 */
export interface TunnelConfig {
  ingress: IngressRule[];
  warp_routing?: {
    enabled: boolean;
  };
}

/**
 * Input type for creating a tunnel (name only, secret auto-generated)
 */
export interface TunnelCreateInput {
  name: string;
}

/**
 * UI form input for ingress rules (Zone selection + subdomain format)
 */
export interface IngressRuleInput {
  zoneId: string; // Selected Zone ID
  subdomain: string; // Subdomain part only (e.g., "app")
  service: string; // Destination service URL
  path?: string; // Path pattern (optional)
}

/**
 * Input type for updating ingress configuration
 */
export interface IngressUpdateInput {
  rules: IngressRuleInput[];
}

/**
 * Parsed ingress rule with zone information (for UI display)
 */
export interface ParsedIngressRule {
  zoneId: string;
  zoneName: string;
  subdomain: string;
  service: string;
  path?: string;
  hostname: string; // Full hostname for display
}

/**
 * API response for tunnels list
 */
export interface TunnelsResponse {
  tunnels: Tunnel[];
}

/**
 * API response for single tunnel
 */
export interface TunnelResponse {
  tunnel: Tunnel;
}

/**
 * API response for tunnel token
 */
export interface TunnelTokenResponse {
  token: string;
}

/**
 * API response for tunnel configuration
 */
export interface TunnelConfigResponse {
  config: TunnelConfig;
  parsedRules?: ParsedIngressRule[];
}
