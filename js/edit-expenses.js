const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
  alert("You're not logged in!");
  window.location.href = 'index.html';
}

const API_GROUPS   = "http://localhost:3000/groups";
const API_USERS    = "http://localhost:3000/users";
const API_EXPENSES = "http://localhost:3000/expenses";

const urlParams = new URLSearchParams(window.location.search);
const defaultGroupId = urlParams.get("groupId");

document.getElementById('username').textContent = user.name;

const editExpenseId = localStorage.getItem("editExpenseId");

let requiredGroup;
let checkedValue = [];    
let oldExpenseData = null; // only used to prefill


function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `px-4 py-2 rounded shadow text-white animate-slide-in 
    ${type === "success" ? "bg-green-500" : "bg-red-500"}`;
  toast.innerText = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function handleChange(checkbox) {
  const value = checkbox.value;
  if (checkbox.checked) {
    if (!checkedValue.includes(value)) checkedValue.push(value);
  } else {
    checkedValue = checkedValue.filter(v => v !== value);
  }
}

async function loadUsers() {
  const res = await fetch(`${API_GROUPS}/${defaultGroupId}`);
  const group = await res.json();
  requiredGroup = group;

  document.getElementById("group").value = group.name;

  const paidBySelect = document.getElementById("paidBy");
  const participantsList = document.getElementById("participants-list");

  group.participants.forEach(userName => {
    const option = document.createElement("option");
    option.value = userName;
    option.textContent = userName;
    paidBySelect.appendChild(option);

    const checkboxDiv = document.createElement("div");
    checkboxDiv.className = "flex items-center";
    checkboxDiv.innerHTML = `
      <input type="checkbox" name="participants" value="${userName}"
        class="mr-2" onchange="handleChange(this)">
      <label>${userName}</label>
    `;
    participantsList.appendChild(checkboxDiv);
  });
}

async function loadExpenseData() {
  const res = await fetch(`${API_EXPENSES}/${editExpenseId}`);
  const expense = await res.json();
  oldExpenseData = expense;

  document.getElementById("title").value  = expense.description;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("paidBy").value = expense.paidBy;
  
  const splitTypeEl = "equal";

  expense.splitBetween.forEach(p => {
    const checkbox = document.querySelector(
      `input[name="participants"][value="${p.memberName}"]`
    );
    if (checkbox) {
      checkbox.checked = true;
      if (!checkedValue.includes(p.memberName)) checkedValue.push(p.memberName);
    }
  });
}


async function recomputeGroupBalances(groupId) {
  const expensesRes = await fetch(`${API_EXPENSES}?groupId=${groupId}`);
  const expenses = await expensesRes.json();

  const owed = {}; // { [u]: { [v]: number } }

  const addOwed = (from, to, amt) => {
    if (!owed[from]) owed[from] = {};
    owed[from][to] = (owed[from][to] || 0) + amt;
  };

  for (const exp of expenses) {
    const payer = exp.paidBy;
    for (const p of exp.splitBetween || []) {
      if (p.memberName === payer) continue;
      addOwed(p.memberName, payer, Number(p.share) || 0);
    }
  }

  const usersSet = new Set();
  Object.keys(owed).forEach(u => {
    usersSet.add(u);
    Object.keys(owed[u]).forEach(v => usersSet.add(v));
  });

  for (const u of usersSet) {
    for (const v of usersSet) {
      if (u === v) continue;
      const uv = (owed[u]?.[v]) || 0;
      const vu = (owed[v]?.[u]) || 0;
      if (uv === 0 && vu === 0) continue;

      if (uv >= vu) {
        if (!owed[u]) owed[u] = {};
        owed[u][v] = uv - vu;
        if (owed[v]) owed[v][u] = 0;
      } else {
        if (!owed[v]) owed[v] = {};
        owed[v][u] = vu - uv;
        if (owed[u]) owed[u][v] = 0;
      }
    }
  }

  // for each user, replace group entries with freshly computed ones
  const usersRes = await fetch(API_USERS);
  const allUsers = await usersRes.json();

  // Prepare quick lookups for new owes/owedBy
  const newOwesByUser = {};  
  const newOwedByUser = {};   

  for (const u of usersSet) {
    const pairs = owed[u] || {};
    for (const v of Object.keys(pairs)) {
      const amt = pairs[v] || 0;
      if (amt > 0) {
        if (!newOwesByUser[u]) newOwesByUser[u] = [];
        newOwesByUser[u].push({ to: v, amount: amt, groupId });
        if (!newOwedByUser[v]) newOwedByUser[v] = [];
        newOwedByUser[v].push({ from: u, amount: amt, groupId });
      }
    }
  }

  for (const u of allUsers) {
    const keepOwes   = (u.owes   || []).filter(x => x.groupId !== groupId);
    const keepOwedBy = (u.owedBy || []).filter(x => x.groupId !== groupId);

    const addOwes   = newOwesByUser[u.name]   || [];
    const addOwedBy = newOwedByUser[u.name]   || [];

    const nextOwes   = [...keepOwes,   ...addOwes];
    const nextOwedBy = [...keepOwedBy, ...addOwedBy];

    await fetch(`${API_USERS}/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owes: nextOwes, owedBy: nextOwedBy })
    });
  }
}

document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = Number(document.getElementById("amount").value);
  const paidBy = document.getElementById("paidBy").value;
  const splitType = "equal"; 

  if (!amount || amount <= 0) {
    showToast("Amount must be greater than 0.", "error");
    return;
  }

  if (checkedValue.length < 1) {
    showToast("Please select at least 1 participant.", "error");
    return;
  }

  const share = Number((amount / checkedValue.length).toFixed(2));
  const splitBetween = checkedValue.map(name => ({ memberName: name, share }));

  const updatedExpense = {
    ...oldExpenseData,
    description: document.getElementById("title").value,
    amount,
    paidBy,
    splitType,
    splitBetween,
    date: new Date().toISOString()
  };

  try {
  
    const res = await fetch(`${API_EXPENSES}/${editExpenseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedExpense)
    });
    if (!res.ok) throw new Error("Failed to update expense");

    await recomputeGroupBalances(defaultGroupId);

    localStorage.removeItem("editExpenseId");
    showToast("Expense updated!");
      window.location.href = `group.html?groupId=${defaultGroupId}`;


  } catch (err) {
    console.error("Error updating expense:", err);
    showToast("Something went wrong", "error");
  }
});


const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});


document.addEventListener("DOMContentLoaded", async () => {
  await loadUsers();
  await loadExpenseData();
});
