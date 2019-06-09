// Why node-fetch?
// request - doesn't support promises out of the box
// axios - removes "Content-Encoding" header which leads to wrong proxy response: https://github.com/axios/axios/pull/2211
// got - too high-level, can't find where to get response status code
import fetch, { Response } from 'node-fetch';
import * as _ from 'lodash';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

const httpAgent = new http.Agent({keepAlive: true});
const httpsAgent = new https.Agent({keepAlive: true});

function agent(_parsedURL: URL) {
    return _parsedURL.protocol == 'http:' ? httpAgent : httpsAgent;
}

export const proxy: APIGatewayProxyHandler = async (event, context) => {
    const params = event.queryStringParameters;

    console.log('-->', event.httpMethod, params);

    if (!params || !params.url) {
        console.log('<-- url not set');
        return {
            statusCode: 400,
            body: "No proxy target, 'url' query parameter is not set."
        };
    }
    let res: Response;
    try {
        const timeout = process.env.TIMEOUT ? +process.env.TIMEOUT :
            // Reserve 100ms to handle error.
            context.getRemainingTimeInMillis() - 100;
        // @ts-ignore: Outdated definitions for node-fetch https://github.com/DefinitelyTyped/DefinitelyTyped/pull/36057
        res = await fetch(params.url, {
            method: event.httpMethod,
            headers: _.omit(event.headers, 'Host'),
            body: event.body ? Buffer.from(event.body, 'base64') : '',
            timeout,
            compress: false,
            // @ts-ignore: Outdated definitions for node-fetch https://github.com/DefinitelyTyped/DefinitelyTyped/pull/36057
            agent
        });
    } catch (e) {
        console.log(`<-- proxy error: ${e}`);

        return {
            statusCode: 500,
            body: `Proxy error: ${e}.`
        }
    }

    console.log(`<-- proxy response: ${res.status}`);
    const corsConfig = {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: !!process.env.CORS_CREDENTIALS
    }

    const headers = {};
    res.headers.forEach((value, key) => headers[key] = value);
    const proxyResponse = {
        statusCode: res.status,
        headers: {...headers, ...{
            'Access-Control-Allow-Origin': corsConfig.origin,
            'Access-Control-Allow-Credentials': corsConfig.credentials
        }},
        body: (await res.buffer()).toString('base64'),
        isBase64Encoded: true
    };

    return proxyResponse;
}
