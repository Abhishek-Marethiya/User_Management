const user = JSON.parse(localStorage.getItem('user'));   // logged in user detail..
if (!user) {
  alert("You're not logged in!");
  window.location.href = 'index.html';
}
const usernameSpan = document.getElementById('username');
usernameSpan.textContent = user.name;


// console.log(user);

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
const API_EXPENSES="http://localhost:3000/expenses";

const groupName = document.getElementById("group");
const paidBySelect = document.getElementById("paidBy");
const form = document.getElementById("expense-form");
const splitBetween = document.getElementById("participants-list");
const checked = document.querySelectorAll("#participants-list input:checked");
let requiredGroup;

// Extract groupId from URL
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams);

const defaultGroupId = urlParams.get("groupId");
console.log(defaultGroupId);


let checkedValue = [];

function handleChange(checkbox) {
  const value = checkbox.value;
 
  if (checkbox.checked) {
    if (!checkedValue.includes(value)) {
      checkedValue.push(value);
    }
  } else {
    checkedValue = checkedValue.filter(v => v !== value);
  }
   
  console.log("Checked members:", checkedValue);
    paidBySelect.innerHTML = "";
    for (const userName of checkedValue) {
    const option = document.createElement("option");
    option.value = userName;
    option.textContent = userName;
    paidBySelect.appendChild(option);
  }
}

async function loadUsers() {
  
  try {
    const res = await fetch(`${API_GROUPS}/${defaultGroupId}`);
    const group = await res.json();
  requiredGroup=group;
   groupName.value=group.name;
    group.participants.forEach(user => {
      const checkboxDiv = document.createElement("div");
      checkboxDiv.className = "flex items-center";

      checkboxDiv.innerHTML = `
        <input 
          type="checkbox" 
          id="user-${user}" 
          value="${user}" 
          class="mr-2" 
          onchange="handleChange(this)">
        <label for="user-${user}">${user}</label>
      `;

      splitBetween.appendChild(checkboxDiv);
    });

  } catch (err) {
    console.error("Error loading users", err);
  }
}


// Handle form submit


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = parseFloat(form.amount.value);
  const paidBy = form.paidBy.value;
  const splitType = form.splitType.value;

  const splitBetween = checkedValue.map(name => ({
    memberName: name,
    share: parseFloat((amount / checkedValue.length).toFixed(2))
  }));

  const expense = {
    id: Date.now().toString(),
    groupId: defaultGroupId,
    description: form.title.value,
    amount,
    paidBy,
    splitType,
    date: new Date().toISOString(),
    splitBetween
  };

  try {
    const res = await fetch(API_EXPENSES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense)
    });

    if (res.ok) {
      showToast("Expense added!");

      for (const entry of splitBetween) {
        if (entry.memberName === paidBy) continue;

        // --- Create settlement ---
        await fetch("http://localhost:3000/settlements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: defaultGroupId,
            from: entry.memberName,
            to: paidBy,
            amount: entry.share,
            expenseId: expense.id,
            date: expense.date,
          })
        });

        // --- Update owes for the member ---
        const owesRes = await fetch(`${API_USERS}?name=${encodeURIComponent(entry.memberName)}`);
        const [owesUser] = await owesRes.json();
        if (owesUser) {
          const updatedOwes = owesUser.owes || [];
          updatedOwes.push({
            to: paidBy,
            amount: entry.share,
            expenseId: expense.id,
            groupId: defaultGroupId
          });

          // --- Netting: remove mutual debts ---
          for (let i = updatedOwes.length - 1; i >= 0; i--) {
            const owe = updatedOwes[i];
            const reverseDebt = (owesUser.owedBy || []).find(d => d.from === owe.to && d.amount > 0);
            if (reverseDebt) {
              if (owe.amount > reverseDebt.amount) {
                owe.amount -= reverseDebt.amount;
                reverseDebt.amount = 0;
              } else if (owe.amount < reverseDebt.amount) {
                reverseDebt.amount -= owe.amount;
                owe.amount = 0;
              } else {
                owe.amount = 0;
                reverseDebt.amount = 0;
              }
            }
          }

          // Remove zero-amount entries
          owesUser.owes = (updatedOwes).filter(d => d.amount > 0);
          owesUser.owedBy = (owesUser.owedBy || []).filter(d => d.amount > 0);

          await fetch(`${API_USERS}/${owesUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owes: owesUser.owes, owedBy: owesUser.owedBy })
          });
        }

        // --- Update owedBy for the payer ---
        const payerRes = await fetch(`${API_USERS}?name=${encodeURIComponent(paidBy)}`);
        const [payerUser] = await payerRes.json();
        if (payerUser) {
          const updatedOwedBy = payerUser.owedBy || [];
          updatedOwedBy.push({
            from: entry.memberName,
            amount: entry.share,
            expenseId: expense.id,
            groupId: defaultGroupId
          });

          // --- Netting on payer side ---
          for (let i = updatedOwedBy.length - 1; i >= 0; i--) {
            const owedByEntry = updatedOwedBy[i];
            const reverseDebt = (payerUser.owes || []).find(d => d.to === owedByEntry.from && d.amount > 0);
            if (reverseDebt) {
              if (owedByEntry.amount > reverseDebt.amount) {
                owedByEntry.amount -= reverseDebt.amount;
                reverseDebt.amount = 0;
              } else if (owedByEntry.amount < reverseDebt.amount) {
                reverseDebt.amount -= owedByEntry.amount;
                owedByEntry.amount = 0;
              } else {
                owedByEntry.amount = 0;
                reverseDebt.amount = 0;
              }
            }
          }

          payerUser.owedBy = updatedOwedBy.filter(d => d.amount > 0);
          payerUser.owes = (payerUser.owes || []).filter(d => d.amount > 0);

          await fetch(`${API_USERS}/${payerUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owes: payerUser.owes, owedBy: payerUser.owedBy })
          });
        }
      }

      window.location.href = `group.html?groupId=${defaultGroupId}`;
    } else {
      showToast("Failed to add expense", "error");
    }
  } catch (err) {
    console.error("Error posting expense", err);
    showToast("Something went wrong", "error");
  }
});


const logoutBtn = document.getElementById('logout-btn');
// Logout logic
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

document.addEventListener("DOMContentLoaded",()=>{
    // loadParticipants();
    loadUsers();
} );

