import fetch, { Response } from 'node-fetch';
import * as _ from 'lodash';
import { APIGatewayProxyHandler } from 'aws-lambda';

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
        const timeout = +process.env.TIMEOUT ||
            // Reserve 100ms to handle error.
            context.getRemainingTimeInMillis() - 100;
        res = await fetch(params.url, {
            method: event.httpMethod,
            // Mimics nginx proxy behavior https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/#headers.
            headers: {
                ..._.omit(event.headers, 'Host'),
                Connection: 'close'
            },
            // TODO: looks like it's base64 encoded body
            body: event.body,
            timeout,
            compress: false
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
        credentials: process.env.CORS_CREDENTIALS ? 'true' : undefined
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
