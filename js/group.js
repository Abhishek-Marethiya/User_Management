const loggedInuser = JSON.parse(localStorage.getItem('user'));   // logged in user detail..
if (!loggedInuser) {
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
usernameSpan.textContent = loggedInuser.name;
const groupNameEl = document.getElementById("group-name");
const groupTotalEl = document.getElementById("group-total");
const expenseList = document.getElementById("expensesList");
const expensesHeader=document.getElementById("expensesheader");
const showAllExpensesDetail=document.getElementById("showAllExpensesDetail");
const showAllMembersModal=document.querySelector(".showAllMembersModal");
const closeModal=document.getElementById("closeModal");
const membersList=document.querySelector('.membersList')
let groupData = null;
let nameClass=null;

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



function handleAddMember(){
  window.location.href = `add-member.html?groupId=${selectedGroupId}`;
  console.log("ok");
  
}

async function handleDeleteExpense(expenseId) {
  try {
    // 1. Fetch the expense first
    const expenseRes = await fetch(`${API_EXPENSES}/${expenseId}`);
    if (!expenseRes.ok) throw new Error("Expense not found");
    const expense = await expenseRes.json();

    // 2. Adjust debts for all involved participants
    for (const participant of expense.splitBetween) {
      if (participant.memberName !== expense.paidBy) {
        // Subtract their share from owes & owedBy
        await adjustUserOwes(
          participant.memberName,
          expense.paidBy,
          -participant.share,
          expense.groupId
        );
        await adjustUserOwedBy(
          expense.paidBy,
          participant.memberName,
          -participant.share,
          expense.groupId
        );
      }
    }

    // 3. Delete the expense from DB
    const deleteRes = await fetch(`${API_EXPENSES}/${expenseId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    if (!deleteRes.ok) {
      showToast("Failed to delete expense", "error");
      return;
    }

    // 4. Refresh UIs (after debts are updated in DB)
    fetchGroupExpenses();       // Refresh group expense list
    loadGroupOwesSummary();     // Refresh group debt summary
    loadOverallDebtSummary();   // 🔹 Refresh overall debt summary

    // 5. Show success toast
    showToast(`Expense "${expense.description}" deleted successfully.`);
  } catch (err) {
    console.error("Error deleting expense:", err);
    showToast("An error occurred while deleting.", "error");
  }
}


async function handleAddMemberToModal(){
  const res=await fetch(`${API_GROUPS}/${selectedGroupId}`);
  const group=await res.json();

  let members=group.participants;
   members.forEach((member)=>{
       const div=document.createElement('div');
       div.className="flex justify-between border border-gray-300 px-4 py-1 rounded-md mb-1 "
      div.innerHTML=`
          <p>${member}</p>
          <button class="text-red-500" onclick="handleDeleteMember('${member}')">delete</button>`
      showAllMembersModal.appendChild(div)
   })


}

function showAllMemebers(){
  event.stopPropagation();
  showAllMembersModal.style.left = "20px";
}

function handleCloseModal(){
  
  console.log("ok");
  
  showAllMembersModal.style.left = "-500px";
}

async function handleDeleteExpense(expenseId) {
  try {
   
    const expenseRes = await fetch(`${API_EXPENSES}/${expenseId}`);
    if (!expenseRes.ok) throw new Error("Expense not found");
    const expense = await expenseRes.json();
    const groupId = expense.groupId;

    const deleteRes = await fetch(`${API_EXPENSES}/${expenseId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    if (!deleteRes.ok) throw new Error("Failed to delete expense");
    const usersRes = await fetch(`${API_USERS}`);
    const users = await usersRes.json();

    for (const user of users) {
      const newOwes = (user.owes || []).filter(o => o.groupId !== groupId);
      const newOwedBy = (user.owedBy || []).filter(o => o.groupId !== groupId);

      await fetch(`${API_USERS}/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owes: newOwes, owedBy: newOwedBy })
      });
    }

    const remainingRes = await fetch(`${API_EXPENSES}?groupId=${groupId}`);
    const remainingExpenses = await remainingRes.json();

    for (const exp of remainingExpenses) {
      for (const participant of exp.splitBetween) {
        if (participant.memberName !== exp.paidBy) {
          await adjustUserOwes(participant.memberName, exp.paidBy, participant.share, exp.groupId);
          await adjustUserOwedBy(exp.paidBy, participant.memberName, participant.share, exp.groupId);
        }
      }
    }

    showToast(`Expense "${expense.description}" deleted successfully.`);
    fetchGroupExpenses();
    loadGroupOwesSummary();

  } catch (err) {
    console.error("Error deleting expense:", err);
    showToast("An error occurred.");
  }
}

async function adjustUserOwes(userName, toUserName, amountDelta, groupId) {
  const userRes = await fetch(`${API_USERS}?name=${encodeURIComponent(userName)}`);
  const user = (await userRes.json())[0];
  if (!user) return;

  if (!Array.isArray(user.owes)) user.owes = [];

  const owesIndex = user.owes.findIndex(o => o.to === toUserName && o.groupId === groupId);
  
  if (owesIndex !== -1) {
    user.owes[owesIndex].amount += amountDelta;
    if (user.owes[owesIndex].amount <= 0) {
      // Remove the entry completely
      user.owes.splice(owesIndex, 1);
    }
  } else if (amountDelta > 0) {
    user.owes.push({ to: toUserName, amount: amountDelta, groupId });
  }

  await fetch(`${API_USERS}/${user.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owes: user.owes })
  });
}

async function adjustUserOwedBy(userName, fromUserName, amountDelta, groupId) {
  const userRes = await fetch(`${API_USERS}?name=${encodeURIComponent(userName)}`);
  const user = (await userRes.json())[0];
  if (!user) return;

  if (!Array.isArray(user.owedBy)) user.owedBy = [];

  const owedByIndex = user.owedBy.findIndex(o => o.from === fromUserName && o.groupId === groupId);
  
  if (owedByIndex !== -1) {
    user.owedBy[owedByIndex].amount += amountDelta;
    if (user.owedBy[owedByIndex].amount <= 0) {
      // Remove the entry completely
      user.owedBy.splice(owedByIndex, 1);
    }
  } else if (amountDelta > 0) {
    user.owedBy.push({ from: fromUserName, amount: amountDelta, groupId });
  }

  await fetch(`${API_USERS}/${user.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owedBy: user.owedBy })
  });
}


function handleEditExpense(expenseId) {
  console.log("ok");
  
  localStorage.setItem("editExpenseId", expenseId);
  console.log(typeof(selectedGroupId));
  
  window.location.href = `edit-expenses.html?groupId=${selectedGroupId}`; // navigate to Edit page
  
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
  <div class="w-[110px]"></div>
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
  <div>
   <button onclick="event.stopPropagation(); handleEditExpense('${expense.id}')" class="btn btn-sm btn-gradient bg-yellow-500  btn-delete w-[50px]">
    Edit
  </button>
  <button onclick="event.stopPropagation(); handleDeleteExpense('${expense.id}')" class="btn btn-sm btn-gradient btn-delete w-[60px] mt-2 mb-2">
    Delete
  </button>
  </div>
`; 



      div.addEventListener('click',()=>{
        window.location.href=`expenseDetail.html?expenseId=${expense.id}`
      })
       expenseList.appendChild(div);
      })

  groupTotalEl.textContent = `₹${total}`;

}


//all expenses details
const API_USERS = 'http://localhost:3000/users';

const params = new URLSearchParams(window.location.search);
const groupId = params.get('groupId');
async function loadGroupOwesSummary() {
  try {
    const res = await fetch(API_USERS);
    const users = await res.json();

    const owesMap = {};

    users.forEach(user => {
      if (Array.isArray(user.owes)) {
        user.owes
          .filter(o => o.groupId === groupId && o.amount > 0)
          .forEach(o => {
            const key = `${user.name}->${o.to}`;
            owesMap[key] = (owesMap[key] || 0) + Number(o.amount);
          });
      }
    });

    if (Object.keys(owesMap).length === 0) {
      showAllExpensesDetail.innerHTML += `<p class="text-gray-500">No debts found for this group.</p>`;
      return;
    }

    let html = '<ul class="list-disc pl-5 space-y-1">';
    for (const [key, amount] of Object.entries(owesMap)) {
      const [owesName, owedToName] = key.split('->');

      // Default colors
      let owesClass = "";
      let owedToClass = "";

      // Agar logged in user paisa de raha hai
      if (owesName === loggedInuser.name) {
        owesClass = "text-red-600 font-semibold";
      }

      // Agar logged in user paisa le raha hai
      if (owedToName === loggedInuser.name) {
        owedToClass = "text-green-600 font-semibold";
      }

      html += `
        <li>
          <span >${owesName}</span> owes 
          <span >${owedToName}</span> 
          <span class="${owesClass} ${owedToClass}">₹${amount.toFixed(2)}</span>
        </li>`;
    }
    html += '</ul>';

    showAllExpensesDetail.innerHTML += html;

  } catch (err) {
    console.error('Error loading group owes summary:', err);
    showAllExpensesDetail.innerHTML += `<p class="text-red-500">Error loading data.</p>`;
  }
}







const logoutBtn = document.getElementById('logout-btn');
//Logout logic
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

const handleAddExpenses=document.getElementById("addExpenses");

handleAddExpenses.addEventListener('click',()=>{
  window.location.href=`add-expenses.html?groupId=${selectedGroupId}`
})


document.addEventListener("DOMContentLoaded",()=>{
  fetchGroupExpenses();
  loadGroupOwesSummary();
  handleAddMemberToModal();
});

window.addEventListener("click",()=>{
  handleCloseModal();
})

showAllMembersModal.addEventListener("click",()=>{
  showAllMemebers();
})