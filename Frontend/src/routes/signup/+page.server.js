import { BACKEND_HOST, BACKEND_PORT } from "$env/static/private"
import { redirect, fail } from "@sveltejs/kit";

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    
    const username = formData.get("username")
    const email = formData.get("email");
    const password = formData.get("password")

    if (!(username && email && password)) {
        return {
            status: 'err',
            message: 'Fields not Filled'
        };
    }

    console.log(BACKEND_HOST, BACKEND_PORT)
    try {
        let response = await fetch(`${BACKEND_HOST}:${BACKEND_PORT}/signup`, {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                username:username,
                email:email,
                password:password
            })
        })

        let json = await response.json()

        if (json.status === "success") {
            throw redirect(303, '/login');
        }

        return fail(500, {status:"err", message: json.message || "Signup failed" });

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