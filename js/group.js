const user = JSON.parse(localStorage.getItem('user'));   // logged in user detail..
// if (!user) {
//   alert("You're not logged in!");
//   window.location.href = 'index.html';
// }
const API_GROUPS = "http://localhost:3000/groups";
const API_EXPENSES="http://localhost:3000/expenses";
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams);

const selectedGroupId = urlParams.get("groupId");


console.log("groupId from parameter....",groupId);


const usernameSpan = document.getElementById('username');
usernameSpan.textContent = user.name;
const groupNameEl = document.getElementById("group-name");
const groupTotalEl = document.getElementById("group-total");
const expenseList = document.getElementById("expensesList");

let groupData = null;

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


async function handleDeleteExpense(expenseName){

  try {
    
   const res=await fetch(`${API_GROUPS}/${groupData.id}`);
   const group=await res.json();

    const updatedExpenses = group.expenses.filter(exp => exp.description !== expenseName);

    // Update the group with new expense list
    group.expenses = updatedExpenses;

    // PUT the updated group back
    const updateRes = await fetch(`${API_GROUPS}/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(group)
    });

    if (updateRes.ok) {
      showToast(`Expense "${expenseName}" deleted successfully.`);
    } else {
      showToast("Failed to update group.");
    }
  } catch (err) {
    console.error("Error deleting expense:", err);
    showToast("An error occurred.");
  }
}



// Fetch saare expenses of a group 
async function fetchGroupDetails() {
  if (!selectedGroupId) {
    showToast("No group selected.");
    window.location.href = "home.html";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/groups/${selectedGroupId}`);
    groupData = await res.json();
    console.log("clicked groupData",groupData);
    
    await displayGroupDetails(groupData);

  } catch (err) {
    console.error(err);
    showToast("Error fetching group.");
  }
}


async function displayGroupDetails(group) {
  groupNameEl.textContent = group.name; // name of selected group


  // Total expenses
  let total = 0;
        const res=await fetch(API_EXPENSES);
        const allExpenses=await res.json();

        const requiredExpenses=allExpenses.filter((expense)=>expense.groupId===selectedGroupId);

  // expenses
      requiredExpenses.forEach((expense)=>{
      total+=expense.amount;
      const div=document.createElement('div');
      div.classList="expense border-[1px] rounded-md border-[#06b6d4] p-2 w-full flex justify-between items-center my-4 cursor-pointer hover-card";

      div.innerHTML=`
         <p class="description">
                ${expense.description}
         </p>
         <div class="text-green-600 font-bold">₹${expense.amount}</div>  
        <button onclick="event.stopPropagation(); handleDeleteExpense('${expense.description}')" class="btn btn-sm btn-gradient btn-delete tracking-widest ">Delete</button> 
      `
      div.addEventListener('click',()=>{
        window.location.href=`expenseDetail.html?expenseId=${expense.id}`
      })
       expenseList.appendChild(div);
      })

  groupTotalEl.textContent = `₹${total}`;

}

const logoutBtn = document.getElementById('logout-btn');
// Logout logic
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

fetchGroupDetails();
