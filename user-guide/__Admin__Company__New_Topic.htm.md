SSO settings

Click here to see this page in full context

###  SSO Settings

If your organization uses single sign-on security, FusionLive can be
configured to allow users to log in to FusionLive with their single sign-on
credentials instead of a FusionLive account. In addition, user provisioning
can be enabled to ensure that users added or removed in your single sign-on
provider are also automatically added or locked in FusionLive.Â

These instructions should be performed in conjunction with the set up
instructions in the FusionLive Single Sign-on and User Provisioning Guide for
your provider.

Note  Enabling SSO for workspaces with existing users requires a services
engagement.

####  Single Sign-on

In order to enable single sign-on, FusionLive needs certain information from
the single sign-on provider. You must be a Company Administrator to perform
these actions.

Note  Examples are given for Azure. Your provider may differ.

  1. In the Company Information pane of the Admin page, select SSO Settings. 
  2. In the Client Id box, enter the identifier that represents the FusionLive application within the provider (for example, Application Id in Azure). 
  3. In the Client Secret box, enter the client secret value used to verify the SSO request. Note This should not be displayed and only ever handled securely. 
  4. Enter the following SSO provider URLs. In these examples, TENANT_ID is an identifier for the customer. 

URL  |  Example   
---|---  
Authorization  |  https://login.microsoftonline.com/TENANT_ID/oauth2/v2.0/authorize   
JWK Set  |  https://login.microsoftonline.com/TENANT_ID/discovery/v2.0/keys   
Token  |  https://login.microsoftonline.com/TENANT_ID/oauth2/v2.0/token   
User InfoÂ  |  https://graph.microsoft.com/oidc/userinfo   
  
  

Note  If you are using non-standard URLs (for example, your own domain) this
must be configured by Idox for access from FusionLive.

  1. To enable the SSO set up, check the Enabled box. 
  2. Click on Apply. 
  3. To check the set-up, open a private browser tab and log in to FusionLive with your single sign-on credentials. 

