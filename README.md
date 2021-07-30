# azure-devops-npm-auth

Uses the [OAuth 2 device code flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-device-code) to authenticate against the Azure DevOps artifact private registry.

## Why? 🤔

Microsoft provides the [vsts-npm-auth](https://www.npmjs.com/package/vsts-npm-auth) package for this task but sadly, it's not cross-platform and doesn't automatically handle token refresh.

There's also [better-vsts-npm-auth](https://www.npmjs.com/package/better-vsts-npm-auth) which solves these issues but requires manual setup (not ideal for a dev team) and authentication through a web app, which in my opinion isn't the best flow to use in the command line.

The **azure-devops-npm-auth** solves all these problems mainly by using the [OAuth 2 device code flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-device-code).  Once authenticated, access and refresh tokens are then stored in the user's personal .npmrc file, keeping them secure and out of any code repository.

## Installation 💪

Simply run `npm i azure-devops-npm-auth --save-dev`.

## Usage 🤷‍♂️

First, add a pre-installation script to your `package.json` file like so:
```javascript
  "scripts": {
    "preinstall": "npx azure-devops-npm-auth"
    ...
  },
```

Then, setup the project repository in the `.npmrc` file as documented in the Azure DevOps npm feed connection page:

![az devops npm feed connection](https://i.imgur.com/M04u3i5.png)

When installing packages using `npm i`, the preinstallation script will be executed and ask you to login using a device code:

![az devops device code flow](https://i.imgur.com/aVYXRoO.png)

Follow the instructions to login and authenticate npm to the Azure DevOps private feed.  The following installation should be able to use the **refresh token** and automate the task of authenticating:

![az devops device code refresh](https://i.imgur.com/oC3YGHm.png)

## Advanced Usage 🧙‍♂️

If you want to use your own Azure Active Directory application, it's possible to specify the `client_id` and `tenant_id` arguments:

```javascript
  "scripts": {
    "preinstall": "npx azure-devops-npm-auth --client_id='xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' --tenant_id='xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'"
    ...
  },
```

*Note: If your Azure Active Directory application is configured to be multitenant, `tenant_id` can also be `common` (is the default; Work and school accounts or personal Microsoft accounts), `consumers` (personal Microsoft accounts) or `organizations` (work and school accounts)*.

When creating your own Azure Active Direction application, under the authentication section, you need the configure it to be a public application:

![aad public app](https://i.imgur.com/VeL9cGe.png)

You also need to add the required API permissions to have '`Azure DevOps user_impersonation`' and '`Microsoft Graph User.Read`':

![aad api permissions](https://imgur.com/aVd51d0.png)

### Continuous integration

To disable authentication within CI environments add the `--ci` flag which skips authentication when the `TF_BUILD` environment variable is set (which is automatically set in Azure DevOps build pipelines):
```javascript
  "scripts": {
    "preinstall": "npx azure-devops-npm-auth --ci"
    ...
  },
```
It's also possible to specify a custom environment variable:
```javascript
  "scripts": {
    "preinstall": "npx azure-devops-npm-auth --ci=MY_CUSTOM_VARIABLE"
    ...
  },
```

### Project Base Path

You can pass in a path to customize the directory to look in for the project's .npmrc file. The default value is the current working directory:

```javascript
  "scripts": {
    "preinstall": "npx azure-devops-npm-auth --project_base_path=./configs"
    ...
  },
```

*Note: this is the path to the directory that contains the .npmrc file, meaning you do **not** need to specify the .npmrc in the path.*

## Special Thanks 👏

I have to give thanks to the author(s) of [better-vsts-npm-auth](https://www.npmjs.com/package/better-vsts-npm-auth) which was a big inspiration of mine for this project.  Also, thanks to [openid-client](https://www.npmjs.com/package/openid-client) for simplifying the process of integrating the OAuth device code flow to the code.

## License 👩‍⚖️

Copyright © 2021, GSoft inc. This code is licensed under the Apache License, Version 2.0. You may obtain a copy of this license at https://github.com/gsoft-inc/gsoft-license/blob/master/LICENSE.
