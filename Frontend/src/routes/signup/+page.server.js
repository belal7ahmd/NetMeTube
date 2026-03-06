/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    
    const username = formData.get("username")
    const email = formData.get("email");
    const password = formData.get("password")

    if (!(username && email && password)) {
        return {
            status: 'Error',
            message: 'Fields not Filled'
        };
    }
    let status
    let message

    // Replace localhost with the address of the backend
    fetch("localhost:4012/signup", {
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
    .then((res) => {
        res.json()
        .then((res) => {
            status = res.status
            message = res.message
        })
    })

    return {
        status:status,
        message:message
    }
  }
};