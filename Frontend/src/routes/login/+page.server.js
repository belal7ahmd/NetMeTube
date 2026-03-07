import { BACKEND_HOST, BACKEND_PORT } from "$env/static/private"
import { redirect, fail } from "@sveltejs/kit";
import { NODE_ENV } from "$env/static/private";

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    
    const email = formData.get("email");
    const password = formData.get("password")

    if (!(email && password)) {
        return {
            status: 'err',
            message: 'Fields not Filled'
        };
    }

    console.log(BACKEND_HOST, BACKEND_PORT)
    try {
        let response = await fetch(`${BACKEND_HOST}:${BACKEND_PORT}/login`, {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                email:email,
                password:password
            })
        })

        let json = await response.json()

        if (json.status === "success") {
            console.log(json.token)
            cookies.set(
                "token",
                json.token,
                {   
                    path:"/",
                    httpOnly:true,
                    secure: process.env.NODE_ENV === 'production'
                }
            )
            throw redirect(303, '/'); 
        }

        console.log(response, json)

        return fail(401, {status:"err", message: json.message || "Login failed" });

    } catch (e) {

        /** @type {any} */
        const err = e
        // Re-throw if it's a SvelteKit redirect/error, otherwise it's a fetch error
        if (err?.status == 303) throw err; 
            
        console.error("Backend Fetch Error:", err);
        return fail(500, { status:"err", message: "Could not connect to the server" });
    }
  }
};