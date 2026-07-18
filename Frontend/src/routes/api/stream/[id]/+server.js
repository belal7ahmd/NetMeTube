import { BACKEND_HOST, BACKEND_PORT } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function GET( { request, params, url } ) {

    const range = request.headers.get("range")

    const response = await fetch(`${BACKEND_HOST}:${BACKEND_PORT}/stream/${params.id}?resolution=${url.searchParams.get("resolution")}`, {
        method:"GET",
        headers:{
            ...(range && { range })
        }
    })

    return response;
};