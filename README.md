# CollabGear upgrades for Sharetribe Web Template

This repository is the fork from the official Sharetribe Web Template created by CollabGear 
development agency is dedicated to introduce the commonly requested features according to our 
many years of experience working on marketplace implementations using Sharetribe API and Web Template.

**Features added on top of the standard Sharetribe Web Template**

- Password Confirmation Field added to the singup page
- Wishlist

You can try out a live demo with the above features at the test site: http://sharetribe-flex-extras.collabgear.work:3210/ .

**Roadmap**

- LinkedIn social signin and signup
- Apple social signin and signup
- Google Pay integration
- Apple Pay integration
- Calendar view page for aggregated bookings grid view ( similar to Google Calendar )
- Bookings export to Google Calendar
- Admin interface as part of the web template
- Referral system with referrals/referees listed on user profile, referral code generation, referral link and referral QR code sharing
- Bulk upload of new listings/products by the user
- System wide bulk upload of new listings/products by the administrator
- List view for the search results page
- SEO friendly URL scheme for the search results page
- Separate category pages
- Anonimous checkout
- Shopping cart
- Abandoned cart

**Note**: Below are the setup and configuration instructions from the original Sharetribe
Web Template repository.

# Sharetribe Web Template

[![CircleCI](https://circleci.com/gh/sharetribe/web-template.svg?style=svg)](https://circleci.com/gh/sharetribe/web-template)

This is a template web application for Sharetribe marketplaces. You could create your own unique
marketplace web app by cloning this repository and then extending and customizing it to your needs.
This template is bootstrapped with
[create-react-app](https://github.com/facebookincubator/create-react-app) with some additions,
namely server side rendering, code-splitting, and a custom CSS setup.

> **Note**: You should start your customization project on top of this one instead of the old
> templates:
>
> - [FTW-daily](https://github.com/sharetribe/ftw-daily)
> - [FTW-hourly](https://github.com/sharetribe/ftw-hourly)
> - [FTW-product](https://github.com/sharetribe/ftw-hourly)
>
> Read more from
> [Sharetribe Developer Docs](https://www.sharetribe.com/docs/template/sharetribe-web-template/)

## Quick start

### Setup localhost

If you just want to get the app running quickly to test it out, first install
[Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/), and follow along:

```sh
git clone git@github.com:sharetribe/web-template.git  # clone this repository
cd web-template/                                      # change to the cloned directory
yarn install                                          # install dependencies
yarn run config                                       # add the mandatory env vars to your local config
yarn run dev                                          # start the dev server, this will open a browser in localhost:3000
```

You can also follow along the
[Getting started with Sharetribe Web Template](https://www.sharetribe.com/docs/introduction/getting-started-with-web-template/)
tutorial in the [Sharetribe Developer Docs](https://www.sharetribe.com/docs/).

For more information of the configuration, see the
[Environment configuration variables](https://www.sharetribe.com/docs/template/template-env/)
reference in Sharetribe Developer Docs.

### For Windows users

We strongly recommend installing
[Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/about), if you are
developing on Windows. These templates are made for Unix-like web services which is the most common
environment type on host-services for web apps. Also, the Developer Docs use Unix-like commands in
articles instead of DOS commands.

## Getting started with your own customization

If you want to build your own Sharetribe marketplace by customizing the template application, see
the
[How to Customize the Template](https://www.sharetribe.com/docs/template/how-to-customize-template/)
guide in Developer Docs.

## Deploying to Heroku

**Note:** Remember to fork the repository before deploying the application. Connecting your own
Github repository to Heroku will make manual deploys easier.

See the
[How to deploy this template to production](https://www.sharetribe.com/docs/template/how-to-deploy-template-to-production/)
guide in Developer Docs for more information.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Documentation

See the Sharetribe Developer Docs: [sharetribe.com/docs/](https://www.sharetribe.com/docs/)

## Get help – join Sharetribe Developer Slack channel

If you have any questions about development, the best place to ask them is the Developer Slack
channel at https://www.sharetribe.com/dev-slack

If you need help with development, you can hire a verified software developer with Sharetribe
experience from the [Expert Network](https://www.sharetribe.com/experts/).

## License

This project is licensed under the terms of the Apache-2.0 license.

See [LICENSE](LICENSE)
