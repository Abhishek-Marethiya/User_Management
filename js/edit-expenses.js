const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
  alert("You're not logged in!");
  window.location.href = 'index.html';
}

const API_GROUPS = "http://localhost:3000/groups";
const API_USERS = "http://localhost:3000/users";
const API_EXPENSES = "http://localhost:3000/expenses";

const urlParams = new URLSearchParams(window.location.search);
const defaultGroupId = urlParams.get("groupId");
console.log(defaultGroupId);

const usernameSpan = document.getElementById('username');
usernameSpan.textContent = user.name;

const editExpenseId = localStorage.getItem("editExpenseId");
if (!editExpenseId) {
  alert("No expense selected for editing");
  window.location.href = `group.html?groupId=${defaultGroupId}`;
}

let requiredGroup;
let checkedValue = [];
let oldExpenseData = null;

async function loadUsers() {
  const res = await fetch(`${API_GROUPS}/${defaultGroupId}`);
  const group = await res.json();
  requiredGroup = group;
  document.getElementById("group").value = group.name;

  group.participants.forEach(userName => {
    const checkboxDiv = document.createElement("div");
    checkboxDiv.className = "flex items-center";
    checkboxDiv.innerHTML = `
      <input type="checkbox" name="participants" value="${userName}"
        class="mr-2" onchange="handleChange(this)">
      <label>${userName}</label>
    `;
    document.getElementById("participants-list").appendChild(checkboxDiv);
  });
}

async function loadExpenseData() {
  const res = await fetch(`${API_EXPENSES}/${editExpenseId}`);
  const expense = await res.json();
  oldExpenseData = expense;

  document.getElementById("title").value = expense.description;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("paidBy").value = expense.paidBy;
  document.getElementById("splitType").value = expense.splitType;

  expense.splitBetween.forEach(p => {
    const checkbox = document.querySelector(`input[name="participants"][value="${p.memberName}"]`);
    if (checkbox) {
      checkbox.checked = true;
      if (!checkedValue.includes(p.memberName)) {
        checkedValue.push(p.memberName);
      }
    }
  });

  updatePaidByOptions();
}

function handleChange(checkbox) {
  const value = checkbox.value;
  if (checkbox.checked) {
    if (!checkedValue.includes(value)) checkedValue.push(value);
  } else {
    checkedValue = checkedValue.filter(v => v !== value);
  }
  updatePaidByOptions();
}

function updatePaidByOptions() {
  const paidBySelect = document.getElementById("paidBy");
  paidBySelect.innerHTML = "";
  checkedValue.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    paidBySelect.appendChild(option);
  });
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
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// Remove old expense effect
async function removeOldExpenseEffect() {
  const participants = oldExpenseData.splitBetween;
  const payer = oldExpenseData.paidBy;

  for (let participant of participants) {
    if (participant.memberName === payer) continue;

    await updateUserBalance(payer, participant.memberName, -participant.share);
    await updateUserBalance(participant.memberName, payer, participant.share);
  }
}

// Apply new expense effect
async function applyNewExpenseEffect(newExpense) {
  const participants = newExpense.splitBetween;
  const payer = newExpense.paidBy;

  for (let participant of participants) {
    if (participant.memberName === payer) continue;

    await updateUserBalance(payer, participant.memberName, participant.share);
    await updateUserBalance(participant.memberName, payer, -participant.share);
  }
}

// Update balances in user object
async function updateUserBalance(userName, targetName, amount) {
  const res = await fetch(`${API_USERS}?name=${encodeURIComponent(userName)}`);
  const users = await res.json();
  const userObj = users[0];
  if (!userObj) return;

  if (!userObj.owes) userObj.owes = {};
  if (!userObj.owedBy) userObj.owedBy = {};

  if (amount > 0) {
    userObj.owedBy[targetName] = (userObj.owedBy[targetName] || 0) + amount;
    if (userObj.owes[targetName]) {
      const net = userObj.owedBy[targetName] - userObj.owes[targetName];
      if (net > 0) {
        userObj.owedBy[targetName] = net;
        delete userObj.owes[targetName];
      } else if (net < 0) {
        userObj.owes[targetName] = -net;
        delete userObj.owedBy[targetName];
      } else {
        delete userObj.owes[targetName];
        delete userObj.owedBy[targetName];
      }
    }
  } else if (amount < 0) {
    const absAmount = Math.abs(amount);
    userObj.owes[targetName] = (userObj.owes[targetName] || 0) + absAmount;
    if (userObj.owedBy[targetName]) {
      const net = userObj.owedBy[targetName] - userObj.owes[targetName];
      if (net > 0) {
        userObj.owedBy[targetName] = net;
        delete userObj.owes[targetName];
      } else if (net < 0) {
        userObj.owes[targetName] = -net;
        delete userObj.owedBy[targetName];
      } else {
        delete userObj.owes[targetName];
        delete userObj.owedBy[targetName];
      }
    }
  }

  await fetch(`${API_USERS}/${userObj.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userObj)
  });
}

// Handle form submit
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("amount").value);
  const paidBy = document.getElementById("paidBy").value;
  const splitType = document.getElementById("splitType").value;

  const splitBetween = checkedValue.map(name => ({
    memberName: name,
    share: parseFloat((amount / checkedValue.length).toFixed(2))
  }));

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
    await removeOldExpenseEffect();
    await applyNewExpenseEffect(updatedExpense);

    const res = await fetch(`${API_EXPENSES}/${editExpenseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedExpense)
    });

    if (res.ok) {
      localStorage.removeItem("editExpenseId");
      showToast("Expense updated!");
      setTimeout(() => {
        window.location.href = `group.html?groupId=${defaultGroupId}`;
      }, 1000);
    } else {
      showToast("Failed to update expense", "error");
    }
  } catch (err) {
    console.error("Error updating expense:", err);
    showToast("Something went wrong", "error");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadUsers();
  await loadExpenseData();
});
