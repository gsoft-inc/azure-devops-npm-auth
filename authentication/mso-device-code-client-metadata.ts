import { ClientMetadata, ClientAuthMethod, ResponseType } from "openid-client";

class MsoDeviceCodeClientMedata implements ClientMetadata {
    // Defaulted values for device flow
    token_endpoint_auth_method?: ClientAuthMethod = "none";
    response_types?: ResponseType[] = ["code"];

    [key: string]: unknown;
    client_id: string;
    id_token_signed_response_alg?: string;
    client_secret?: string;
    redirect_uris?: string[];
    post_logout_redirect_uris?: string[];
    default_max_age?: number;
    require_auth_time?: boolean;
    tls_client_certificate_bound_access_tokens?: boolean;
    request_object_signing_alg?: string;
    id_token_encrypted_response_alg?: string;
    id_token_encrypted_response_enc?: string;
    introspection_endpoint_auth_method?: ClientAuthMethod
    introspection_endpoint_auth_signing_alg?: string;
    request_object_encryption_alg?: string;
    request_object_encryption_enc?: string;
    revocation_endpoint_auth_method?: ClientAuthMethod
    revocation_endpoint_auth_signing_alg?: string;
    token_endpoint_auth_signing_alg?: string;
    userinfo_encrypted_response_alg?: string;
    userinfo_encrypted_response_enc?: string;
    userinfo_signed_response_alg?: string;

    constructor(clientId: string) {
        this.client_id = clientId;
    }
}

export default MsoDeviceCodeClientMedata;