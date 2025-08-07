const user = JSON.parse(localStorage.getItem('user'));   // logged in user detail..
// if (!user) {
//   alert("You're not logged in!");
//   window.location.href = 'index.html';
// }
// const API_GROUPS = "http://localhost:3000/groups";
const API_EXPENSES = "http://localhost:3000/expenses";
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams);
const expenseId = urlParams.get("expenseId");

console.log(expenseId);

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
  try {
    const res = await fetch(`${API_EXPENSES}?id=${expenseId}`);
    const expenses = await res.json();
   console.log(expense);
   
    // const expense = expenses[0]; // Because it returns an array

    // if (!expense) {
    //   alert("Expense not found");
    //   return;
    // }

    // // Populate data
    // document.getElementById("expense-title").textContent = expense.description;
    // document.getElementById("expense-date").textContent = `Date: ${expense.date}`;
    // document.getElementById("expense-amount").textContent = `₹${expense.amount}`;

    // const paidBy = expense.paidBy;
    // document.getElementById("paid-by").textContent = paidBy;

    // const splitNames = expense.splitBetween
    //   .map((entry) => `${entry.memberName || entry.memberId} (₹${entry.share})`)
    //   .join(", ");
    // document.getElementById("split-between").textContent = splitNames;

    // // Breakdown
    // const breakdownList = document.getElementById("breakdown-list");
    // breakdownList.innerHTML = "";

    // expense.splitBetween.forEach((entry) => {
    //   if (entry.memberName !== paidBy) {
    //     const li = document.createElement("li");
    //     li.textContent = `${entry.memberName} owes ${paidBy} ₹${entry.share}`;
    //     breakdownList.appendChild(li);
    //   }
    // });

    // displayResults(expense);
  } catch (err) {
    console.error("Error loading expense:", err);
    alert("Failed to load expense details");
  }
}

function displayResults(expense) {
  const totalAmount = expense.amount;
  const payer = expense.paidBy;
  const participants = expense.splitBetween.map((e) => e.memberName);

  const resultsContainer = document.getElementById("results-container");
  const resultsContent = document.getElementById("results-content");
  const summary = document.getElementById("split-summary");
  const individualShares = document.getElementById("individual-shares");
  const settlements = document.getElementById("settlements");

  if (resultsContainer) resultsContainer.classList.add("hidden");
  if (resultsContent) resultsContent.classList.remove("hidden");

  summary.innerHTML = `
    <div class="text-center">
      <div class="text-2xl font-bold text-gray-800">Rs. ${totalAmount.toFixed(2)}</div>
      <div class="text-gray-600">split among ${participants.length} people</div>
      <div class="text-sm text-gray-500 mt-1">Paid by ${payer}</div>
    </div>
  `;

  individualShares.innerHTML = expense.splitBetween
    .map((entry) => {
      return `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span class="font-medium text-gray-800">${entry.memberName}</span>
          <span class="text-lg font-semibold text-gray-900">Rs. ${entry.share.toFixed(2)}</span>
        </div>
      `;
    })
    .join("");

  settlements.innerHTML = expense.splitBetween
    .filter((e) => e.memberName !== payer)
    .map((entry) => {
      return `
        <div class="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span class="text-gray-800">${entry.memberName} pays ${payer} Rs.${entry.share.toFixed(2)}</span>
        </div>
      `;
    })
    .join("");
}

loadExpense();

// Logout
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});
