const user = JSON.parse(localStorage.getItem('user'));   // logged in user detail..
if (!user) {
  alert("You're not logged in!");
  window.location.href = 'index.html';
}
const API_GROUPS = "http://localhost:3000/groups";
const API_EXPENSES="http://localhost:3000/expenses";
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams);

const selectedGroupId = urlParams.get("groupId");


console.log("groupId from parameter....",selectedGroupId);


const usernameSpan = document.getElementById('username');
usernameSpan.textContent = user.name;
const groupNameEl = document.getElementById("group-name");
const groupTotalEl = document.getElementById("group-total");
const expenseList = document.getElementById("expensesList");
const expensesHeader=document.getElementById("expensesheader");

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


async function handleDeleteExpense(expenseId){

  try {
    
    const res = await fetch(`${API_EXPENSES}/${expenseId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
   const expense= await res.json();
    if (res.ok) {
      showToast(`Expense "${expense.name}" deleted successfully.`);
    } else {
      showToast("Failed to update group.");
    }
  } catch (err) {
    console.error("Error deleting expense:", err);
    showToast("An error occurred.");
  }
}



// Fetch saare expenses of a group 
async function fetchGroupExpenses() {
  if (!selectedGroupId) {
    showToast("No group selected.");
    window.location.href = "home.html";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/expenses/?groupId=${selectedGroupId}`);
    allGroupExpenses = await res.json();
    console.log("clicked groupExpenses",allGroupExpenses);
    
    await displayGroupExpenses(allGroupExpenses);

  } catch (err) {
    console.error(err);
    showToast("Error fetching group.");
  }
}


async function displayGroupExpenses(allExpenses) {

   const res =await fetch(`${API_GROUPS}/${selectedGroupId}`);
   const group=await res.json();

  groupNameEl.textContent = group.name; // name of selected group


  // Total expenses
  let total = 0;
  
  const requiredExpenses=allExpenses.filter((expense)=>expense.groupId===selectedGroupId);
  console.log(requiredExpenses.length);
  const header = document.createElement("div");
  header.className = "flex justify-between items-center px-2 py-2 font-semibold text-gray-700";
  if(requiredExpenses.length===0){
    header.innerHTML = `
 <div class="text-red-600 italic w-full text-center py-4">
  No expenses added for this group yet.
</div>
`;
expensesHeader.appendChild(header);
return;
  }
  
  header.innerHTML = `
  <div class="w-[200px]">Expense Name</div>
  <div class="w-[100px]">Amount</div>
  <div class="w-[150px]">Paid By</div>
  <div class="w-[80px]"></div> <!-- for delete button -->
`;

expensesHeader.appendChild(header);

  // expenses
      requiredExpenses.forEach((expense)=>{
      total+=expense.amount;

      const div=document.createElement('div');
    div.classList = "expense border-[1px] rounded-md border-[#06b6d4] p-2 w-full flex justify-between items-center my-4 cursor-pointer hover-card";

div.innerHTML = `
  <div class="w-[200px] font-medium text-gray-800">
    ${expense.description}
  </div>
  <div class="w-[100px] text-green-600 font-bold">
    ₹${expense.amount}
  </div>
  <div class="w-[150px] text-gray-700 ml-2 truncate">
    ${expense.paidBy}
  </div>
  <button onclick="event.stopPropagation(); handleDeleteExpense('${expense.id}')" class="btn btn-sm btn-gradient btn-delete tracking-widest w-[80px]">
    Delete
  </button>
`;

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


const handleAddExpenses=document.getElementById("addExpenses");
handleAddExpenses.addEventListener('click',()=>{
  window.location.href=`add-expenses.html?groupId=${selectedGroupId}`
})

fetchGroupExpenses();
