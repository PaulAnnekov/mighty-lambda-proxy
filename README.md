# Lambda CORS proxy

Flexible AWS Lambda proxy server which enables CORS for endpoints which don't allow cross-origin requests.

## How to use

```
git clone https://github.com/PaulAnnekov/lambda-cors-proxy.git
cd cors-proxy
npm install
npx serverless deploy -v # or node_modules/.bin/serverless deploy -v
```

In the output you will see your endpoint url. To make it proxy your request,
just add `?url=[target]` in the end, e.g.:

`https://abcdefghij.execute-api.eu-central-1.amazonaws.com/dev?url=https://example.com`

## Proxy timeout

By default function asks Lambda service for timeout value 
([getRemainingTimeInMillis()](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html)). But you can
specify your own timeout value by following "Set usagePlan, CORS settings, proxy timeout" guide below.

## Configure

### Set stage during deploy

`npx serverless deploy --stage prod`

### Set region during deploy

`npx serverless deploy --region eu-central-1`

### Set [UsagePlan](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigateway-usageplan.html), [CORS settings](https://serverless.com/blog/cors-api-gateway-survival-guide/), proxy timeout

1. Copy `serverless.vars.sample.yml` and rename to `serverless.vars.yml`
2. In `serverless.vars.yml` modify and leave options you need 
