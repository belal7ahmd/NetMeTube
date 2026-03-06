<script lang="js">
  import { enhance } from '$app/forms';

  /** @param {string} email */
  function validate_email(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  export let form;

  /** @type {import('@sveltejs/kit').SubmitFunction} */
  const handleSignup = ({ formData, cancel }) => {
    const password = formData.get("password");
    const email = formData.get("email")
    const confirm = formData.get("confirmPassword");
    if (!(email == null)){
      if (!validate_email(email.toString())) {
        alert("Email Not Valid")
        cancel();
      }
    } else {
      alert("Fill email field")
      cancel();
    }


    if (password !== confirm) {
        alert("Passwords do not match!");
        cancel();
    }

    return async ({ result, update}) => {

      update()
    };
  };
</script>

<form 
  action="/signup" 
  method="POST" 
  class="flex flex-col  gap-4 p-10 rounded-3xl bg-white m-auto size-auto shadow-xl/30 w-[30%]" 
  use:enhance={handleSignup}>
    {#if form?.status}
      <p class="text-red-500 text-xl" >{form?.message}</p>
    {/if}

    <label for="username">Username</label>
    <input type="text" name="username" class="rounded-full" required/>

    <label for="email">Email:</label>
    <input type="text" name="email" class="rounded-full" required/>

    <label for="password">Password:</label>
    <input type="password" name="password" class="rounded-full" />

    <label for="confirmPassword">Confirm Password:</label>
    <input type="password" name="confirmPassword" class="rounded-full"  />
    
    <button type="submit" class="rounded-full bg-cyan-300 hover:bg-cyan-400 p-1">Sign Up</button>
</form>


