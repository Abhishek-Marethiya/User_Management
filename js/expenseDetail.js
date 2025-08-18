

const API_EXPENSES = "http://localhost:3000/expenses";
const usernameSpan = document.getElementById('username');
const user = JSON.parse(localStorage.getItem('user'));   // logged in user detail..
if (!user) {
  alert("You're not logged in!");
  window.location.href = 'index.html';
}
usernameSpan.textContent = user.name;
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams);
const expenseId = urlParams.get("expenseId");

console.log("expenseId",expenseId);

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


    
async function loadExpense() {
 
      const res = await fetch(`${API_EXPENSES}/${expenseId}`);
      const expense = await res.json();
      if (!expense) return showToast("Expense not found", "error");

      document.getElementById("expense-date").textContent = `Date: ${new Date(expense.date).toLocaleDateString()}`;
      document.getElementById("expense-amount").textContent = `₹${expense.amount}`;
      document.getElementById("paid-by").textContent = expense.paidBy;

      const members = expense.splitBetween.map((e) => `${e.memberName} (₹${e.share})`).join(", ");
      document.getElementById("split-between").textContent = members;

      const individualShares = expense.splitBetween.map(e => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span class="font-medium text-gray-800">${e.memberName}</span>
          <span class="text-lg font-semibold text-gray-900">₹${e.share.toFixed(2)}</span>
        </div>
      `).join("");

      document.getElementById("individual-shares").innerHTML = individualShares;

      const settlements = expense.splitBetween
        .filter(e => e.memberName !== expense.paidBy)
        .map(entry => {
          return `
            <div class="flex items-center p-3 mb-1 border border-red-200 rounded-lg">
              <span class="text-red-600">${entry.memberName} owes ${expense.paidBy} ₹${entry.share.toFixed(2)}</span>
            </div>
          `;
        }).join("");

      document.getElementById("settlements").innerHTML = settlements;

      document.getElementById("split-summary").innerHTML = `
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-800">₹${expense.amount.toFixed(2)}</div>
          <div class="text-gray-600">split among ${expense.splitBetween.length} people</div>
          <div class="text-sm text-gray-500 mt-1">Paid by ${expense.paidBy}</div>
        </div>
      `;
    }

const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});


 loadExpense();