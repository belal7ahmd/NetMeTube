import { BACKEND_HOST, BACKEND_PORT } from '$env/static/private'
import { redirect } from '@sveltejs/kit'

/** @type {import('./$types').Actions} */
export const actions = {
    default: async ({ request, cookies }) => {
        if (!cookies.get("token")) {
            throw redirect(303, "/login")
        }

        let formData = await request.formData()

        let videoFile = formData.get("videoFile")
        let thumbFile = formData.get("thumbFile")
        if (!(videoFile instanceof File && thumbFile instanceof File)) {
            return {
                status:"err",
                message:"Thumbnail or Video are not files"
            }
        }

        let videoType = videoFile.type
        let thumbType = thumbFile.type

        if (!((videoType == "video/mp4") && (thumbType == "image/png"))) {
            return {
                status:"err",
                message:"Thumbnail or Video are not the right type"
            }
        }
        try {
            let response = await fetch(`${BACKEND_HOST}:${BACKEND_PORT}/upload`, {
                method:"POST",
                headers:{
                    Authorization: `Bearer ${cookies.get("token")}`
                },
                body:formData
            })

            let json = await response.json()

            if (response.status == 401) {
                throw redirect(303, "/login")
            }

            if (response.status == 403) {
                throw redirect(303, "/")
            }

            if (json.status == "err") {
                return {
                    status:json.status,
                    message:json.message
                }
                
            }
        } catch (err) {
            /** @type {any} */
            const e = err
            // re throw error if its a redirect
            if (e && e.status == 303) {throw e}

            console.log(`Error connecting to backend:${e}`)
            return {
                status:"err",
                message:"Error connecting to Backend"
            }
        }

        return {
            status:202,
            message:"Video uploaded successfully"
        }
    }
}