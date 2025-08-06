const user = JSON.parse(localStorage.getItem('user'));   // logged in user detail..
if (!user) {
  alert("You're not logged in!");
  window.location.href = 'index.html';
}

const API_USERS = "http://localhost:3000/users";
const form = document.getElementById("add-member-form");


function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `px-4 py-2 rounded shadow text-white animate-slide-in 
    ${type === "success" ? "bg-green-500" : "bg-red-500"}`;

  toast.innerText = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => toast.remove(), 500); // Remove after fade
  }, 3000);
}


form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    const existingUsers = await fetch(API_USERS).then(res => res.json());
    const userExists = existingUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
     console.log(existingUsers);
     
    if (userExists) {
        showToast("A user with this email already exists!","error");
        return;
    }

    const newUser = {
        id:Date.now().toString(),
        name,
        email
    };

    const res = await fetch(API_USERS, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newUser)
    });

    if (res.ok) {
        form.reset();
       showToast("Member added successfully!","success");
        window.location.href = 'create-group.html'; 
    } else {
        showToast("Something went wrong. Try again.","error");
    }
});

