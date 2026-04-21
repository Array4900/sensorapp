import type { RequestHandler } from './$types';

const API_BASE = process.env.INTERNAL_API_URL || process.env.PUBLIC_API_URL || 'http://localhost:5000/api';

async function proxyRequest({ params, request, url }: Parameters<RequestHandler>[0]): Promise<Response> {
    const path = params.path || '';
    const targetUrl = new URL(`${API_BASE.replace(/\/$/, '')}/${path}`);
    targetUrl.search = url.search;

    const headers = new Headers(request.headers);
    headers.delete('host');

    const init: RequestInit = {
        method: request.method,
        headers,
        redirect: 'manual'
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.arrayBuffer();
    }

    const upstreamResponse = await fetch(targetUrl, init);
    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders
    });
}

export const GET: RequestHandler = proxyRequest;
export const POST: RequestHandler = proxyRequest;
export const PUT: RequestHandler = proxyRequest;
export const DELETE: RequestHandler = proxyRequest;
export const PATCH: RequestHandler = proxyRequest;
export const OPTIONS: RequestHandler = proxyRequest;