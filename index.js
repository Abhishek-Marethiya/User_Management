let participants = [];
let currentSplitType = "equal";
let currentAmount="";
let currentGroup = sessionStorage.getItem('currentGroup') || null;
const form=document.getElementById('form')


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




loadCurrentState();
async function loadCurrentState() {
  try {
   
    if(!currentGroup) return;

    const res = await fetch("http://localhost:3000/groups");
    const groups = await res.json();
    
    const requiredGroup = groups.find(group => group.name === currentGroup);
    console.log(requiredGroup);
    
    if (requiredGroup) {
      participants = requiredGroup.participants || [];
      currentSplitType = requiredGroup.splitType || "equal";
      currentAmount=requiredGroup.totalAmount;
      payer=requiredGroup.payer
      updateParticipantsList();
      updatePayerSelect();
      updateCustomAmounts();
    }
    
    console.log("currentAmount",currentAmount);
    const total_Amount=document.getElementById("total-amount");
    if(total_Amount){
        total_Amount.value=currentAmount
    }
    const payer_selected=document.getElementById("payer-select");
    if(payer_selected)  payer_selected.value=payer;
   
    console.log(participants);
    
  } catch (error) {
    console.error("Error loading current state:", error);
  }
}

async function saveCurrentState(currentAmount,payer="") {
  try {
    if (!currentGroup) return;
    
    const res = await fetch("http://localhost:3000/groups");
    const groups = await res.json();
    
    const requiredGroup = groups.find(group => group.name === currentGroup);
    if (requiredGroup) {
      await fetch(`http://localhost:3000/groups/${requiredGroup.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participants: participants,
          splitType: currentSplitType,
          totalAmount:currentAmount,
          payer:payer,
          lastModified: new Date().toISOString()
        }),
      });
    }
  } catch (error) {
    console.error("Error saving current state:", error);
  }
}


function handleSubmit(e){
   e.preventDefault();
  console.log("inside handle form:",e);
  
 
}

if(form){
form.addEventListener('click',(e)=>{
  handleSubmit(e);
})
}



function updateParticipantsList() {
  const container = document.getElementById("participants-list");
  
  if (participants.length === 0) {
    container.innerHTML =
      '<p class="text-gray-500 text-center">No participants added yet</p>';
    return;
  }
 if(container){
    container.innerHTML = participants
    .map(
      (name) => `
                <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3 animate-slideIn">
                    <span class="font-medium text-gray-800">${name}</span>
                    <button onclick="removeParticipant('${name}')" 
                            class="text-red-500 hover:text-red-700 font-bold text-lg">×</button>
                </div>
            `
    )
    .join("");
 }

}

function updatePayerSelect() {
  const select = document.getElementById("payer-select");


  if(select){
     const currentValue = select.value;
  

  select.innerHTML =
    '<option value="">Select who paid</option>' +
    participants
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");

  if (participants.includes(currentValue)) {
    select.value = currentValue;
  }
  }
 
}

async function addParticipant() {
      
  
  const nameInput = document.getElementById("participant-name");
  const name = nameInput.value.trim();

  if (!name) {
    showToast("Please enter a participant name", "error");
    return;
  }

  if (!currentGroup) {
    showToast("Please select a group name", "error");
    return;
  }

  if (participants.includes(name)) {
    showToast("Participant already exists", "error");
    
    return;
  }
  
  currentAmount=document.getElementById("total-amount").value;
  
  console.log(currentAmount);
  
  participants.push(name);
  await saveCurrentState(currentAmount);
  nameInput.value = "";
    showToast("Participant added","success")
  
  console.log("okay till here..");
  
}



async function removeParticipant(name) {

  
    const index = participants.indexOf(name);
    if (index > -1) {
      participants.splice(index, 1);
    }

  
    const res = await fetch("http://localhost:3000/groups");
    const groups = await res.json();
    const requiredGroup = groups.filter((group) => group.name === currentGroup);
 
    const id = requiredGroup[0].id;
    const currentParticipants = requiredGroup[0].participants;
    const updatedParticipants = currentParticipants.filter(participant => participant !== name);

    await fetch(`http://localhost:3000/groups/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        participants: updatedParticipants
      }),
    });

    showToast("Participant removed","success")

    updateParticipantsList();
    updatePayerSelect();
    updateCustomAmounts();

   
}

async function deleteCurrentGroup(id) {
  await fetch(`http://localhost:3000/groups/${id}`, {
    method: "DELETE",
  });

    showToast("Group Deleted Successfully!","success")
}


 function NavigateTosingleGroupDetails(id) {
  console.log(id);
  window.location.href = `showGroupDetails.html?id=${id}`;
}
  

  async function handleAddExpenses(id){
   
   
   const res = await fetch("http://localhost:3000/groups");
    const groups = await res.json();
    const requiredGroup = groups.filter((group) => group.id == id);
    
    currentGroup=requiredGroup[0].name; 
     sessionStorage.setItem('currentGroup', currentGroup);
    
   window.location.href='addexpenses.html';
 
}

async function fetchAllGroups() {
  const container = document.getElementById("groups-container");

  if (!container) return;

  try {
    const res = await fetch("http://localhost:3000/groups");
    const groups = await res.json();

    container.innerHTML = groups
      .map(
        (group) => `
        <div class="border  p-4 rounded shadow" onclick="event.stopPropagation(); NavigateTosingleGroupDetails(${group.id})">
            <h2 class="text-xl font-bold">${
              group.name
            }</h2>
            <p class="text-sm text-gray-500 mt-2">Last updated: ${new Date(
              group.lastModified
            ).toLocaleString()}</p>
                
                          <button type="button" class="btn  bg-[#1cc29f] btn-sm  text-[11px] mt-7" onclick="handleAddExpenses(${group.id})">
                            Add Expense
                        </button>

            <button onclick="deleteCurrentGroup(${
              group.id
            })" class="btn btn-delete btn-sm text-[11px] mt-7 ">Delete Group</button>
        </div>
    `
      )
      .join("");
  } catch (err) {
    console.error("Error fetching groups:", err);
  }
}

async function createGroupFn() {
  
  const nameInput = document.getElementById("new-group-name");
  const name = nameInput.value;

  if (!name) {
    showToast("Please enter a group name", "error");
    return;
  }
  const res = await fetch("http://localhost:3000/groups");
  const groups = await res.json();

  const alreadyExist = groups.filter((group) => group.name === name);

  if (alreadyExist.length > 0) {
    showToast("Group with this is already exist","error");
    return;
  }

  const newGroup = {
    id: Date.now().toString(),
    name: name,
    participants: [],
    totalAmount: "",
    payer: "",
    splitType: "equal",
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };

  await fetch("http://localhost:3000/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newGroup),
  });
  showToast("Group created Successfully!","success")
  fetchAllGroups();
}

document.addEventListener("DOMContentLoaded", () => {
  const createGroup = document.querySelector("#createGroup");
  if (createGroup) {
    createGroup.addEventListener("click", createGroupFn);
  }
  fetchAllGroups();

});


//smjna h ...

function updateCustomAmounts() {
  const container = document.getElementById("custom-amounts");

  if (currentSplitType !== "unequal" || participants.length === 0) {
    if(container) container.innerHTML = "";
    return;
  }
  
  container.innerHTML = participants
    .map(
      (name) => `
                <div class="flex items-center justify-between">
                    <label class="font-medium text-gray-700">${name}</label>
                    <div class="relative w-32">
                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input type="number" 
                               id="custom-${name}" 
                               class="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                               placeholder="0.00"
                               step="0.01">
                    </div>
                </div>
            `
    )
    .join("");
}

function calculateSplit() {
  const totalAmount = parseFloat(document.getElementById("total-amount").value);
  const payer = document.getElementById("payer-select").value;


  if (!totalAmount || totalAmount <= 0) {
    showToast("Please enter a valid total amount", "error");
    return;
  }

  if (participants.length === 0) {
    showToast("Please add at least one participant", "error");
    return;
  }

  if (!payer) {
    showToast("Please select who paid the bill", "error");
    return;
  }
  if (!currentGroup) {
    showToast("Please select the group", "error");
    return;
  }

  let shares = {};

  if (currentSplitType === "equal") {
    const shareAmount = totalAmount / participants.length;
    participants.forEach((name) => {
      shares[name] = shareAmount;
    });
  } else {
    let totalCustom = 0;
    participants.forEach((name) => {
      const customAmount =
        parseFloat(document.getElementById(`custom-${name}`).value) || 0;
      shares[name] = customAmount;
      totalCustom += customAmount;
    });

    if (Math.abs(totalCustom - totalAmount) > 0.01) {
      show(
        `Custom amounts (${totalCustom.toFixed(
          2
        )}) don't match total (${totalAmount.toFixed(2)})`,
        "error"
      );
      return;
    }
  }
  console.log(currentAmount);
  
  displayResults(shares, totalAmount, payer);
  
}

function displayResults(shares, totalAmount, payer) {
  const resultsContainer = document.getElementById("results-container");
  const resultsContent = document.getElementById("results-content");
  const summary = document.getElementById("split-summary");
  const individualShares = document.getElementById("individual-shares");
  const settlements = document.getElementById("settlements");

  resultsContainer.classList.add("hidden");
  resultsContent.classList.remove("hidden");

  summary.innerHTML = `
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-800">Rs. ${totalAmount.toFixed(
                      2
                    )}</div>
                    <div class="text-gray-600">split among ${
                      participants.length
                    } people</div>
                    <div class="text-sm text-gray-500 mt-1">Paid by ${payer}</div>
                </div>
            `;


  individualShares.innerHTML = participants
    .map(
      (name) => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span class="font-medium text-gray-800">${name}</span>
                    <span class="text-lg font-semibold text-gray-900">Rs. ${shares[
                      name
                    ].toFixed(2)}</span>
                </div>
            `
    )
    .join("");

  const debts = {};
  participants.forEach((name) => {
    if (name === payer) {
      debts[name] = totalAmount - shares[name];
    } else {
      debts[name] = -shares[name];
    }
  });

  const settlementList = [];
  Object.keys(debts).forEach((debtor) => {
    if (debts[debtor] < -0.01) {
      const amount = Math.abs(debts[debtor]);
      settlementList.push(`${debtor} pays ${payer} Rs.${amount.toFixed(2)}`);
    }
  });

  if (settlementList.length === 0) {
    settlements.innerHTML =
      '<p class="text-center text-gray-500 py-4">No settlements needed - everyone paid their share!</p>';
  } else {
    settlements.innerHTML = settlementList
      .map(
        (settlement) => `
                    <div class="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <span class="text-gray-800">${settlement}</span>
                    </div>
                `
      )
      .join("");
  }
     
}

function saveData() {
   const payer = document.getElementById("payer-select").value;
  saveCurrentState(currentAmount,payer);

  // participants = [];
  // currentSplitType = "equal";

  // document.getElementById("total-amount").value = "";
  // document.getElementById("participant-name").value = "";
  // document.getElementById("payer-select").innerHTML =
  //   '<option value="">Select who paid</option>';
  // document.querySelector(
  //   'input[name="split-type"][value="equal"]'
  // ).checked = true;
  // document.getElementById("custom-split-section").classList.add("hidden");

  // updateParticipantsList();

  // document.querySelectorAll(".split-option").forEach((div) => {
  //   div.className =
  //     "split-option p-4 border-2 border-gray-300 rounded-lg text-center cursor-pointer transition-all";
  // });
  // document
  //   .querySelector('input[name="split-type"][value="equal"]')
  //   .parentNode.querySelector(".split-option").className =
  //   "split-option p-4 border-2 border-primary bg-primary/10 rounded-lg text-center cursor-pointer transition-all";

  // document.getElementById("results-container").classList.remove("hidden");
  // document.getElementById("results-content").classList.add("hidden");

  showToast("Data Saved Successfully!","success")
window.location.href='addGroup.html';
}


document.addEventListener("DOMContentLoaded", function () {


  const splitOptions = document.querySelectorAll('input[name="split-type"]');
  const customSection = document.getElementById("custom-split-section");
  splitOptions.forEach((option) => {
    option.addEventListener("change", function () {
      currentSplitType = this.value;

      document.querySelectorAll(".split-option").forEach((div) => {
        div.className =
          "split-option p-4 border-2 border-gray-300 rounded-lg text-center cursor-pointer transition-all";
      });

      this.parentNode.querySelector(".split-option").className =
        "split-option p-4 border-2 border-primary bg-primary/10 rounded-lg text-center cursor-pointer transition-all";

      if (this.value === "unequal") {
        customSection.classList.remove("hidden");
        updateCustomAmounts();
      } else {
        customSection.classList.add("hidden");
      }
    });
  });
});


