/**
 * Access policy decision types
 */
export type PolicyDecision = 'allow' | 'deny' | 'bypass';

/**
 * Access rule types for policy conditions
 */
export interface AccessRuleEmailDomain {
  email_domain: { domain: string };
}

export interface AccessRuleEmail {
  email: { email: string };
}

export interface AccessRuleGroup {
  group: { id: string };
}

export interface AccessRuleGeo {
  geo: { country_code: string };
}

export interface AccessRuleDevicePosture {
  device_posture: { integration_uid: string };
}

export interface AccessRuleEveryone {
  everyone: Record<string, never>;
}

export interface AccessRuleIPRange {
  ip: { ip: string };
}

export interface AccessRuleServiceToken {
  service_token: Record<string, never>;
}

export interface AccessRuleAnyAccessToken {
  any_valid_service_token: Record<string, never>;
}

/**
 * Union type for all access rule types
 */
export type AccessRule =
  | AccessRuleEmailDomain
  | AccessRuleEmail
  | AccessRuleGroup
  | AccessRuleGeo
  | AccessRuleDevicePosture
  | AccessRuleEveryone
  | AccessRuleIPRange
  | AccessRuleServiceToken
  | AccessRuleAnyAccessToken;

/**
 * Reusable Access Policy (account-level)
 */
export interface AccessPolicy {
  id: string;
  name: string;
  precedence: number;
  decision: PolicyDecision;
  include: AccessRule[];
  exclude?: AccessRule[];
  require?: AccessRule[];
  session_duration?: string;
  approval_required?: boolean;
  created_at?: string;
  updated_at?: string;
  // Number of apps using this policy (returned by API)
  app_count?: number;
}

/**
 * Policy reference for app associations
 */
export interface PolicyReference {
  id: string;
  name?: string;
  precedence?: number;
}

/**
 * Access Application types
 */
export type AccessAppType =
  | 'self_hosted'
  | 'saas'
  | 'ssh'
  | 'vnc'
  | 'bookmark'
  | 'app_launcher'
  | 'warp'
  | 'biso'
  | 'infrastructure';

/**
 * Access Application
 */
export interface AccessApplication {
  id: string;
  name: string;
  domain: string;
  type: AccessAppType;
  session_duration?: string;
  app_launcher_visible?: boolean;
  allowed_idps?: string[];
  auto_redirect_to_identity?: boolean;
  custom_deny_message?: string;
  custom_deny_url?: string;
  custom_non_identity_deny_url?: string;
  enable_binding_cookie?: boolean;
  http_only_cookie_attribute?: boolean;
  logo_url?: string;
  same_site_cookie_attribute?: string;
  service_auth_401_redirect?: boolean;
  skip_interstitial?: boolean;
  tags?: string[];
  aud?: string;
  created_at?: string;
  updated_at?: string;
  // Associated policies
  policies?: PolicyReference[];
}

/**
 * Input type for creating an Access Application
 */
export interface AccessAppCreateInput {
  name: string;
  domain: string;
  type: AccessAppType;
  session_duration?: string;
  app_launcher_visible?: boolean;
  allowed_idps?: string[];
  policies?: PolicyReference[];
}

/**
 * Input type for updating an Access Application
 */
export type AccessAppUpdateInput = AccessAppCreateInput;

/**
 * Input type for creating a reusable policy
 */
export interface PolicyCreateInput {
  name: string;
  precedence: number;
  decision: PolicyDecision;
  include: AccessRule[];
  exclude?: AccessRule[];
  require?: AccessRule[];
  session_duration?: string;
  approval_required?: boolean;
}

/**
 * Input type for updating a reusable policy
 */
export type PolicyUpdateInput = PolicyCreateInput;

/**
 * API response for applications list
 */
export interface AccessAppsResponse {
  apps: AccessApplication[];
}

/**
 * API response for single application
 */
export interface AccessAppResponse {
  app: AccessApplication;
}

/**
 * API response for policies list
 */
export interface AccessPoliciesResponse {
  policies: AccessPolicy[];
}

/**
 * API response for single policy
 */
export interface AccessPolicyResponse {
  policy: AccessPolicy;
}

/**
 * Simplified rule input for UI forms
 */
export interface RuleInput {
  type:
    | 'email_domain'
    | 'email'
    | 'group'
    | 'geo'
    | 'device_posture'
    | 'everyone'
    | 'ip'
    | 'service_token'
    | 'any_valid_service_token';
  value?: string;
}

/**
 * Convert UI rule input to API format
 */
export function ruleInputToAccessRule(input: RuleInput): AccessRule {
  switch (input.type) {
    case 'email_domain':
      return { email_domain: { domain: input.value || '' } };
    case 'email':
      return { email: { email: input.value || '' } };
    case 'group':
      return { group: { id: input.value || '' } };
    case 'geo':
      return { geo: { country_code: input.value || '' } };
    case 'device_posture':
      return { device_posture: { integration_uid: input.value || '' } };
    case 'everyone':
      return { everyone: {} };
    case 'ip':
      return { ip: { ip: input.value || '' } };
    case 'service_token':
      return { service_token: {} };
    case 'any_valid_service_token':
      return { any_valid_service_token: {} };
    default:
      throw new Error(`Unknown rule type: ${input.type}`);
  }
}

/**
 * Convert API rule to UI rule input format
 */
export function accessRuleToInput(rule: AccessRule): RuleInput {
  if ('email_domain' in rule) {
    return { type: 'email_domain', value: rule.email_domain.domain };
  }
  if ('email' in rule) {
    return { type: 'email', value: rule.email.email };
  }
  if ('group' in rule) {
    return { type: 'group', value: rule.group.id };
  }
  if ('geo' in rule) {
    return { type: 'geo', value: rule.geo.country_code };
  }
  if ('device_posture' in rule) {
    return { type: 'device_posture', value: rule.device_posture.integration_uid };
  }
  if ('everyone' in rule) {
    return { type: 'everyone' };
  }
  if ('ip' in rule) {
    return { type: 'ip', value: rule.ip.ip };
  }
  if ('service_token' in rule) {
    return { type: 'service_token' };
  }
  if ('any_valid_service_token' in rule) {
    return { type: 'any_valid_service_token' };
  }
  throw new Error('Unknown rule type');
}
