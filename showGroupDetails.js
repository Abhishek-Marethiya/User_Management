
const group_Name = document.getElementById('group-name');
const participantsContainer = document.querySelector('.participants');
const total_amount=document.getElementById('total-amount');
const payerBox=document.getElementById('payer');


function calculateSplit(participants,payer,totalAmount) {

  let shares = {};
    const shareAmount = totalAmount / participants.length;
    participants.forEach((name) => {
      shares[name] = shareAmount;
    });


  displayResults(shares, totalAmount, payer,participants);
}

function displayResults(shares, totalAmount, payer,participants) {
  const resultsContainer = document.getElementById("results-container");
  const resultsContent = document.getElementById("results-content");
  const summary = document.getElementById("split-summary");
  const individualShares = document.getElementById("individual-shares");
  const settlements = document.getElementById("settlements");

  resultsContainer.classList.add("hidden");
  resultsContent.classList.remove("hidden");

  summary.innerHTML = `
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-800">Rs. ${totalAmount}</div>
                    <div class="text-gray-600">split among ${
                      participants.length
                    } people</div>
                    <div class=" text-green-500 mt-1 font-bold ">Paid by ${payer}</div>
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
      settlementList.push(`${debtor} Owes ${payer} --> Rs.${amount.toFixed(2)}`);
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

async function loadGroupDetails(id) {
  const res = await fetch("http://localhost:3000/groups");
  const groups = await res.json();
  let requiredGroup = groups.filter((group) => group.id === id);

  if (!requiredGroup.length) {
    console.error("Group not found");
    return;
  }
  
  const groupName = requiredGroup[0].name;
   const participants = requiredGroup[0].participants;
  const payer = requiredGroup[0].payer;
  const totalAmount = requiredGroup[0].totalAmount;

  group_Name.textContent = groupName;
  total_amount.textContent=totalAmount;
//   payerBox.textContent=payer

//   participantsContainer.innerHTML = ""; 
//   participants.forEach((participant) => {
//     const li = document.createElement('li');
//     li.innerText = participant;
//     li.classList.add('participant'); 
//     participantsContainer.appendChild(li);
//   });


  calculateSplit(participants,payer,totalAmount);

}



document.addEventListener('DOMContentLoaded',()=>{
    console.log("hiiii");

  const path = window.location.pathname;
  console.log(path);
  
  const page = path.substring(path.lastIndexOf("/") + 1); 
console.log(page);

if (page === "showGroupDetails.html") {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  console.log(id);
  
  if (id) {
    loadGroupDetails(id);
  }
}
})