# azure-devops-npm-auth

Uses the OAuth2 device code flow to authenticate against the Azure DevOps artifact private registry.

## Why? 🤔

Microsoft provides the [vsts-npm-auth](https://www.npmjs.com/package/vsts-npm-auth) package for this task but sadly, it's not cross-platform and doesn't automatically handle token refresh.

There's also [better-vsts-npm-auth](https://www.npmjs.com/package/better-vsts-npm-auth) which solves these issues but requires manual setups (not ideal for a dev team) and authentication through a web app, which in my opinion isn't the best flow to use in the command line.

The **azure-devops-npm-auth** solves all these problems mainly by using the [OAuth 2 device code flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-device-code).  Once authenticated, access and refresh tokens are then stored in the user's personal .npmrc file, keeping them secure and out of any code repository.

## Installation 💪

Simply run `npm i azure-devops-npm-auth --save-dev`.  Then add a pre-installation script to your `package.json` file like so:
```javascript
  "scripts": {
    "preinstall": "node -e \"require('azure-devops-npm-auth').run()\""
    ...
  },
```

## Usage 🤷‍♂️

Setup the project repository in the `.npmrc` file as documented in the Azure DevOps npm feed connection page:

![az devops npm feed connection](https://i.imgur.com/M04u3i5.png)

When installing packages using `npm i`, the preinstallation script will be executed and ask you to login using a device code:

![az devops device code flow](https://i.imgur.com/aVYXRoO.png)

Follow the instructions to login and authenticate npm to the Azure DevOps private feed.  The following installation should be able to use the **refresh token** and automate the task of authenticating:

![az devops device code refresh](https://i.imgur.com/oC3YGHm.png)


## Special Thanks 👏

I have to give thanks to the author(s) of [better-vsts-npm-auth](https://www.npmjs.com/package/better-vsts-npm-auth) which was a big inspiration of mine for this project.  Also, thanks to [openid-client](https://www.npmjs.com/package/openid-client) for simplifying the process of integrating the OAuth device code flow to the code.

## License 👩‍⚖️

Copyright © 2019, GSoft inc. This code is licensed under the Apache License, Version 2.0. You may obtain a copy of this license at https://github.com/gsoft-inc/gsoft-license/blob/master/LICENSE.