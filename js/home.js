
const API_BASE = 'http://localhost:3000';
const API_USERS='http://localhost:3000/users'
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
      card.className = 'bg-white p-6 shadow rounded cursor-pointer hover:bg-gray-50 flex justify-between items-center relative';
      card.innerHTML = `         
        <div>
       <h3 class="text-lg font-semibold text-green-700">${group.name}</h3>
          <p class="text-sm text-gray-500">Members: ${group.participants?.length || 0}</p>
         <p class="text-[12px] text-gray-500 absolute bottom-0 right-6">${group.created}</p>
          
        </div>
        <div>           
         <a href="add-expenses.html?groupId=${group.id}" class="btn btn-gradient btn-sm tracking-widest"> Add Expense</a>
        <button onclick="event.stopPropagation(); handleDeleteGroup('${group.id}')" class="btn btn-sm btn-gradient btn-delete tracking-widest ml-1">Delete</button>
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



async function handleDeleteExpense(expenseId) {
  try {
    
    const expenseRes = await fetch(`${API_EXPENSES}/${expenseId}`);
    if (!expenseRes.ok) throw new Error("Expense not found");
    const expense = await expenseRes.json();

    for (const participant of expense.splitBetween) {
      if (participant.memberName !== expense.paidBy) {

        // --- Update the owes array for this participant ---
        await adjustUserOwes(participant.memberName, expense.paidBy, -participant.share, expense.groupId);

        // --- Update the owedBy array for the paidBy user ---
        await adjustUserOwedBy(expense.paidBy, participant.memberName, -participant.share, expense.groupId);
      }
    }

    const deleteRes = await fetch(`${API_EXPENSES}/${expenseId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    if (deleteRes.ok) {
      showToast(`Expense "${expense.description}" deleted successfully.`);
      fetchGroupExpenses(); // Refresh list
      loadGroupOwesSummary(); // Refresh debts
    } else {
      showToast("Failed to delete expense", "error");
    }

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

  const owesEntry = user.owes.find(o => o.to === toUserName && o.groupId === groupId);
  if (owesEntry) {
    owesEntry.amount = Math.max(0, owesEntry.amount + amountDelta);
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

  const owedByEntry = user.owedBy.find(o => o.from === fromUserName && o.groupId === groupId);
  if (owedByEntry) {
    owedByEntry.amount = Math.max(0, owedByEntry.amount + amountDelta);
  } else if (amountDelta > 0) {
    user.owedBy.push({ from: fromUserName, amount: amountDelta, groupId });
  }

  await fetch(`${API_USERS}/${user.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owedBy: user.owedBy })
  });
}


// overall expenses......
async function loadOverallOwesSummary() {
  try {
    const res = await fetch(API_USERS);
    const users = await res.json();

    const currentUser = users.find(u => u.id === user.id);
    if (!currentUser) return;

    const netMap = {};

    currentUser.owes?.forEach(o => {
      const key = o.to;
      netMap[key] = (netMap[key] || 0) - Number(o.amount);
    });

    currentUser.owedBy?.forEach(o => {
      const key = o.from;
      netMap[key] = (netMap[key] || 0) + Number(o.amount);
    });

    let owesHTML = '<h4 class="font-semibold text-red-600 mb-2">You Owe</h4><ul class="list-disc pl-5">';
    let owedByHTML = '<h4 class="font-semibold text-green-600 mb-2">Owed to You</h4><ul class="list-disc pl-5">';
    let owesTotal = 0;
    let owedByTotal = 0;

    Object.entries(netMap).forEach(([name, amount]) => {
      if (amount < 0) {
        owesHTML += `<li>You owe <strong>${name}</strong> ₹${Math.abs(amount).toFixed(2)}</li>`;
        owesTotal += Math.abs(amount);
      } else if (amount > 0) {
        owedByHTML += `<li><strong>${name}</strong> owes you ₹${amount.toFixed(2)}</li>`;
        owedByTotal += amount;
      }
    });

    owesHTML += `</ul><p class="mt-1 text-m text-red-900 font-bold mt-2">Total: ₹${owesTotal.toFixed(2)}</p>`;
    owedByHTML += `</ul><p class="mt-1 text-m font-bold text-green-900 mt-2">Total: ₹${owedByTotal.toFixed(2)}</p>`;

    const container = document.getElementById("showAllExpensesDetail");
    container.innerHTML = `
      <h3 class="text-lg font-bold text-gray-700 mb-2">Overall Balance</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-red-50 p-3 rounded shadow">${owesHTML}</div>
        <div class="bg-green-50 p-3 rounded shadow">${owedByHTML}</div>
      </div>
    `;

  } catch (err) {
    console.error('Error loading overall owes summary:', err);
    document.getElementById("showAllExpensesDetail").innerHTML =
      `<p class="text-red-500">Error loading data.</p>`;
  }
}

loadOverallOwesSummary();
