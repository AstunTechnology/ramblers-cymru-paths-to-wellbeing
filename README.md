# Paths to Wellbeing

Monorepo for Ramblers Cymru Paths to Wellbeing website.

* `map` contains the source for the OpenLayers map
* `website` contains the Eleventy website

Both projects need to be built in order to end up with a website containing a map.

## Setup

Install dependencies at the root and within each sub-project:

```shell
npm i
(cd map && npm i)
(cd website && npm i)
```

## Development

The root project provides a `start` npm script which should spawn the `watch` npm script for the map and the `start` npm script for the website. This should be enough to facilitate editing either project and seeing the results in your browser.

```shell
npm start
```

Each project also defines its own scripts which can be called independently as needed.

## Deployment

This repo is integrated with [AWS Amplify](). Amplify monitors specified branches, builds from them when changes are committed, and deploys them to AWS.

|Branch|Address|
|------|-------|
|main  |https://main.d2ymvhh1lvqxri.amplifyapp.com/en/routes/|
