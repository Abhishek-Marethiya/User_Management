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
const API_GROUPS = "http://localhost:3000/groups";
const API_USERS = "http://localhost:3000/users";

const groupName = document.getElementById("group");
const paidBySelect = document.getElementById("paidBy");
const form = document.getElementById("expense-form");

// Extract groupId from URL
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams);

const defaultGroupId = urlParams.get("groupId");
console.log(defaultGroupId);

async function loadGroup() {
    console.log(defaultGroupId);
    
  const res = await fetch(API_GROUPS);
  const groups = await res.json();
 
  const requiredGroup=groups.filter((group)=> group.id==defaultGroupId);  
  groupName.value=requiredGroup[0].name
 
}

async function loadParticipants() {
  const res = await fetch(`${API_GROUPS}/${defaultGroupId}`);
  const group = await res.json();
  console.log("group",group);
  

  for (const userId of group.participants) {
    
     let id=userId.toString();
         
    const userRes = await fetch(`${API_USERS}/${id}`);
    const user = await userRes.json();
    console.log("user from users",user );

    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.name;
    paidBySelect.appendChild(option);
  }
}

// Handle form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    title: form.title.value,
    amount: parseFloat(form.amount.value),
    paidBy: form.paidBy.value,
    splitType: form.splitType.value,
    groupId: defaultGroupId,
    date: new Date().toISOString()
  };

  const groupRes = await fetch(`${API_GROUPS}/${data.groupId}`);
  const group = await groupRes.json();
 console.log(group);
 
  group.expenses = group.expenses || [];
  group.expenses.push(data);
  console.log(group.expenses);
  
  // group ko update , expenses add krke
  await fetch(`${API_GROUPS}/${data.groupId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(group)
  });

  showToast("Expense added!");
//   window.location.href = `group.html?id=${data.groupId}`;
});

document.addEventListener("DOMContentLoaded",()=>{
    loadGroup();
    loadParticipants();
} );


