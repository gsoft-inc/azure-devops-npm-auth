import { Issuer, Client } from "openid-client";

class MsoIssuer<TClient extends Client> extends Issuer<TClient> {

    // See documentation: 
    // https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc#fetch-the-openid-connect-metadata-document
    static async discover(tenant = "common"): Promise<Issuer<Client>> {
        const issuer = await Issuer.discover(`https://login.microsoftonline.com/${tenant}/v2.0/.well-known/openid-configuration`);
        
        // Add the missing device code endpoint
        Object.assign(issuer, {
            device_authorization_endpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/devicecode`
        })

        return issuer;
    }
  }

export default MsoIssuer;