// home.js

const API_BASE = 'http://localhost:3000';
const usernameSpan = document.getElementById('username');
const groupsContainer = document.getElementById('groups-container');


const user = JSON.parse(localStorage.getItem('user'));   // logged in user detail..
if (!user) {
  alert("You're not logged in!");
  window.location.href = 'index.html';
}

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


usernameSpan.textContent = user.name;


// Fetch and display user's groups
async function fetchGroups() {
  try {
    const res = await fetch(`${API_BASE}/groups?memberIds_like=${user.id}`);
    const groups = await res.json();
    
    
    if (groups.length === 0) {
      groupsContainer.innerHTML = `<p class="text-gray-500 col-span-full">You haven't joined any groups yet.</p>`;
      return;
    }

    groups.forEach(group => {
      const card = document.createElement('div');
      card.className = 'bg-white p-5 shadow rounded cursor-pointer hover:bg-gray-50 flex justify-between items-center relative';
      card.innerHTML = `         
        <div>
       <h3 class="text-lg font-semibold text-green-700">${group.name}</h3>
          <p class="text-sm text-gray-500">Members: ${group.participants?.length || 0}</p>
         <p class="text-[12px] text-gray-500 absolute bottom-0 right-6">${group.created || null}</p>
          
        </div>
        <div>
          <button onclick="event.stopPropagation(); handleDeleteGroup('${group.id}')" class="btn btn-sm btn-gradient btn-delete tracking-widest mr-1">Delete</button>
          
         <a href="add-expenses.html?groupId=${group.id}" class="btn btn-gradient btn-sm tracking-widest">
  Add Expense
</a>

          </div>
  
      `;
      card.addEventListener('click', () => {
        // localStorage.setItem('selectedGroupId', group.id);
         window.location.href = `group.html?groupId=${group.id}`;
      });

      groupsContainer.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to fetch groups:', err);
  }
}

fetchGroups();
const logoutBtn = document.getElementById('logout-btn');
// Logout logic
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});


async function handleDeleteGroup(id) {
try{
 console.log(id);
        const res = await fetch(`${API_BASE}/groups/${id}`,{
              method: "DELETE",
               headers: {
            "Content-Type": "application/json"
        },
        });
   if(res.ok)
    showToast("Group Deleted Successfully!","success")
}
catch (err) {
    console.error('Failed to delete group:', err);
    showToast("Failed to delete group!","error")
  }
}