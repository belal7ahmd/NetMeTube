import { BACKEND_HOST, BACKEND_PORT } from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load( { params } ) {
    
    let response = await fetch(`${BACKEND_HOST}:${BACKEND_PORT}/video/${params.id}`, {
        method:"GET"
    })

    let json = await response.json()

    if (json.status == "err") {
        return {title:"error", description:"error"}
    }

    let { title, description, resolutions} = json

    console.log(title, description, resolutions)

    return {title:title, description:description, resolutions:resolutions};
};