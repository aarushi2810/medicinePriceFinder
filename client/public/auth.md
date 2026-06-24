# auth.md

Welcome to MedPrice agent registration and authorization.

## Discovery Metadata
To integrate with the MedPrice APIs, please discover the authorization endpoints using these metadata resources:
- OAuth Protected Resource Metadata: [/.well-known/oauth-protected-resource](file:///.well-known/oauth-protected-resource)
- OAuth Authorization Server Metadata: [/.well-known/oauth-authorization-server](file:///.well-known/oauth-authorization-server)
- OpenID Connect Metadata: [/.well-known/openid-configuration](file:///.well-known/openid-configuration)

## Programmatic Registration
To obtain credentials, AI agents can register programmatically by sending a `POST` request to the registration URI:
- Registration URI: `https://medicine-price-finder.vercel.app/api/agent/register`

## Identity Assertion
This service supports the standard `urn:ietf:params:oauth:token-type:id-jag` identity assertion. Once registered, agents can request bearer tokens by asserting their cryptographic agent identity.
