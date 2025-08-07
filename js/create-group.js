const user = JSON.parse(localStorage.getItem('user'));   // logged in user detail..
if (!user) {
  alert("You're not logged in!");
  window.location.href = 'index.html';
}

const API_USERS = "http://localhost:3000/users";
const API_GROUPS = "http://localhost:3000/groups";

const form = document.getElementById("create-group-form");
const participantsContainer = document.getElementById("participants-list");
const loggedInuser = JSON.parse(localStorage.getItem('user')); 

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
// Fetch users to show as participants
async function loadUsers() {
    try {
        const res = await fetch(API_USERS);
        const users = await res.json();

        users.forEach(user => {
            const checkbox = document.createElement("div");
            checkbox.className = "flex items-center";
            const nameClass = user.id === loggedInuser.id ? "text-green-600 font-semibold" : "";            checkbox.innerHTML = `
              <input type="checkbox" id="user-${user.id}" value="${user.id}" class="mr-2">
              <label for="user-${user.id}" class="${nameClass}">${user.name}</label>
            `;

            participantsContainer.appendChild(checkbox);
        });

    } catch (err) {
        console.error("Error loading users", err);
    }
}

// Handle form submission
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const groupName = document.getElementById("group-name").value;
    const checked = document.querySelectorAll("#participants-list input:checked");
    
          const res = await fetch(API_GROUPS);
          const groups=await res.json();
         const alreadyExistgroup= groups.filter((group)=>group.name===groupName)
         console.log(alreadyExistgroup);
         
         if(alreadyExistgroup.length>0){
              showToast("Group with this name is already exist!","error");
            return;
         }
   //saare user nikal lunga phir unki id se unka name store krwa dunga
    const allUsersRes = await fetch(API_USERS);
    const allUsers = await allUsersRes.json();

    const participantNames = Array.from(checked).map(input => {
        const userId=parseInt(input.value);
        const user=allUsers.find(u=>u.id===userId);
        return user?.name || "";
    });
    console.log(participantNames);
  
    if (participantNames.length < 2) {
        showToast("Please select at least 2 participants.","error");
        return;
    }

    const newGroup = {
        id:Date.now().toString(),
        name: groupName,
        participants: participantNames,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(), 
    };

    try {
        const res = await fetch(API_GROUPS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newGroup),
        });

        if (res.ok) {
            showToast("Group created successfully!","success");
            window.location.href = "home.html";
        } else {
            showToast("Failed to create group.","error");
        }
    } catch (err) {
        console.error("Group creation error", err);
        showToast("Error while creating group.","error");
    }
});

loadUsers();


const logoutBtn = document.getElementById('logout-btn');
// Logout logic
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});
