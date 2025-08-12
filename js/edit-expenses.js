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
const description=document.getElementById("title")
const amount=document.getElementById("amount");
const form = document.getElementById("expense-form");
const splitBetween = document.getElementById("participants-list");
const checked = document.querySelectorAll("#participants-list input:checked");
let requiredGroup;
let defaultGroupId;
// Extract groupId from URL
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams);

const expenseId = urlParams.get("expenseId");
console.log(expenseId);
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

async function loadUsers(defaultGroupId) {
  defaultGroupId=defaultGroupId;
  try {
    const res = await fetch(`${API_GROUPS}/${defaultGroupId}`);
    const group = await res.json();
    console.log(group);
    
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

async function loadFuntion(){
   const res=await fetch(`${API_EXPENSES}/${expenseId}`) ;
   const expense=await res.json();
   
   const groupId=expense.groupId;
   const group=await fetch(`${API_GROUPS}/${groupId}`);
   const data=await group.json();
  console.log("data",data);
   console.log("expense",expense);
   groupName.value=data.name;
   description.value=expense.description;
   amount.value=expense.amount;
   await loadUsers(data.id);
  
}




form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = parseFloat(form.amount.value);
  console.log(amount);
  
  const paidBy = form.paidBy.value;
  console.log(paidBy);
  
  const splitType=form.splitType.value;

  // console.log(requiredGroup);
  
  const splitBetween = checkedValue.map(name => ({
    memberName: name,
    share: parseFloat((amount / checkedValue.length).toFixed(2)) // equal split
  }));
     
  console.log(splitBetween);
  

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
    const res=await fetch(API_EXPENSES,{
      method:"PUT",
      headers: { "Content-Type": "application/json" },
      body:JSON.stringify(expense)
    });
   if (res.ok) {
   showToast("Expense added!");

  // Update settlements and user data
  for (const entry of splitBetween) {
    if (entry.memberName === paidBy) continue;

    // Create settlement
    const settlement = {
      groupId: defaultGroupId,
      from: entry.memberName,
      to: paidBy,
      amount: entry.share,
      expenseId: expense.id,
      date: expense.date,
    };

    await fetch("http://localhost:3000/settlements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settlement)
    });

    //Update owes for the member who owes
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
      await fetch(`${API_USERS}/${owesUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owes: updatedOwes })
      });
    }
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

      await fetch(`${API_USERS}/${payerUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owedBy: updatedOwedBy })
      });
    }
  }
      //navigate to group page
      console.log("ok");
      
      window.location.href = `group.html?groupId=${defaultGroupId}`;
    } else {
      showToast("Failed to add expense", "error");
    }
  } catch (err) {
    console.error("Error posting expense", err);
    showToast("Something went wrong", "error");
  }
});

document.addEventListener("DOMContentLoaded",()=>{
loadFuntion();
} );

