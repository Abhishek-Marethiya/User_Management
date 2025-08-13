const user = JSON.parse(localStorage.getItem("user")); // logged in user detail..
if (!user) {
  alert("You're not logged in!");
  window.location.href = "index.html";
}
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams);
const groupId = urlParams.get("groupId");
console.log("groupId", groupId);

const API_USERS = "http://localhost:3000/users";
const API_GROUPS = "http://localhost:3000/groups";
const form = document.getElementById("add-member-form");
const logoutBtn = document.getElementById("logout-btn");

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

  const existingUsers = await fetch(API_USERS).then((res) => res.json());
  const userExists = existingUsers.some(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
  const userNameExists = existingUsers.some(
    (user) => user.name.toLowerCase() === name.toLowerCase()
  );
  console.log("existingUsers,", existingUsers);

  if (userExists) {
    showToast("A user with this email already exists!", "error");
    return;
  }
  if (userNameExists) {
    showToast("A user with this name already exists!", "error");
    return;
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password:"Default@123"
  };

  const res = await fetch(API_USERS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newUser),
  });

  if (res.ok) {
    if (groupId !== null) {
      console.log("okkkkkkkkkkk");
      console.log(newUser.name);
      const res = await fetch(`${API_GROUPS}/${groupId}`);
      const group = await res.json();

      console.log(group);

      group.participants.push(newUser.name);
      console.log(group);

      const ress = await fetch(`${API_GROUPS}/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(group),
      });
      if (ress.ok) {
        showToast("Member added successfully!", "success");
        window.location.href = `group.html?groupId=${groupId}`;
      }
    }
    else{
       form.reset();
    showToast("Member added successfully!", "success");
    window.location.href = "create-group.html";
    }
   
  } else {
    showToast("Something went wrong. Try again.", "error");
  }
});

// Logout logic

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});
