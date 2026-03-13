


async function loadResults(){

const {data}=await client
.from("tenders")
.select("*")
.not("submission_id","is",null)
.order("id",{ascending:false});

const table=document.getElementById("resultTable");

table.innerHTML="";

data.forEach(row=>{

table.innerHTML+=`

<tr>

<td>${row.tender_id}</td>

<td>

<div class="result-box" id="resultBox_${row.tender_id}">

<div class="result-row">

<span class="rank">L1</span>

<select class="company-select" onchange="handleCompany(this)">
<option value="">Select Company</option>
<option value="other">➕ Add New Company</option>
</select>

<div class="new-company-box" style="display:none">

<input class="custom-company"
placeholder="Enter Company Name">

<button class="save-company-btn"
onclick="saveCompany(this)">+</button>

</div>

<select class="type"
onchange="updatePremium(this); calculateFinal(${row.tender_id}, this)">
<option value="above">Above</option>
<option value="below">Below</option>
</select>

<input class="premium-input" placeholder="Premium">

<button class="add-btn" onclick="addRank(${row.tender_id})">+</button>

</div>

</div>

</td>

<td>${row.time_limit||""}</td>

<td class="estimate" data-estimate="${row.estimate_amount}">
₹ ${formatAmount(row.estimate_amount)}
</td>
<td id="final_${row.tender_id}">
<div class="final-box"></div>
</td>
<td>
<button class="save-btn" onclick="saveResult(${row.tender_id})">Save</button>
</td>

</tr>

`;

loadExistingResult(row.tender_id)
loadCompanies()

})

}

function formatAmount(a){
return a ? new Intl.NumberFormat("en-IN").format(a) : "";
}

async function loadCompanies(){

const {data} = await client
.from("company_list")
.select("*")
.order("company_name");

document.querySelectorAll(".company-select").forEach(select=>{

select.innerHTML = `
<option value="">Select Company</option>
<option value="other">➕ Add New Company</option>
`;

data.forEach(c=>{

const opt = document.createElement("option");
opt.value = c.company_name;
opt.textContent = c.company_name;

select.insertBefore(opt, select.lastElementChild);

});

});

}
function handleCompany(el){

const row = el.closest(".result-row");
const input = row.querySelector(".custom-company");

if(el.value === "other"){
input.style.display = "block";
input.focus();
}else{
input.style.display = "none";
}

}
async function loadExistingResult(tenderId){

const {data}=await client
.from("tender_result")
.select("*")
.eq("tender_id",tenderId)
.order("rank",{ascending:true})
if(!data || data.length===0) return

const box=document.getElementById(`resultBox_${tenderId}`)

box.innerHTML=""

data.forEach((row,index)=>{

const isLast=index===data.length-1

const div=document.createElement("div")

div.className="result-row"

let value=row.bid_price

value=value.toString().replace("%","")

if(!value.includes("-") && row.above_below==="below"){
value="-"+value
}

if(!value.includes("+") && row.above_below==="above"){
value="+"+value
}

value=value+"%"

div.innerHTML=`

<span class="rank">${row.rank}</span>

<input class="company" value="${row.company_name}">

<select class="type"
onchange="updatePremium(this); calculateFinal(${tenderId}, this)">
<option value="above">Above</option>
<option value="below">Below</option>
</select>

<input class="premium-input"
value="${value}"
oninput="calculateFinal(${tenderId}, this)">

${isLast?`<button class="add-btn" onclick="addRank(${tenderId})">+</button>`:""}

`;

box.appendChild(div);
loadCompanies()

div.querySelector(".type").value=row.above_below;

calculateFinal(tenderId, div.querySelector(".premium-input"));

})

}
function updatePremium(el){

const row = el.closest(".result-row")

const input = row.querySelector(".premium-input")

let value = input.value.replace("%","").replace("+","").replace("-","")

if(!value) return

if(el.value==="above"){
input.value="+"+value+"%"
}else{
input.value="-"+value+"%"
}

}

function calculateFinal(tenderId, el){

const tr = el.closest("tr")

const estimateAmount =
parseFloat(tr.querySelector(".estimate").dataset.estimate) || 0

const resultRows = tr.querySelectorAll(".result-row")

const finalBox = tr.querySelector(".final-box")
if(box.children.length === 0){
box.innerHTML=""
}

resultRows.forEach(r=>{

let premium = r.querySelector(".premium-input").value
.replace(/[%+-]/g,"")

const type = r.querySelector(".type").value

const premiumNum = parseFloat(premium) || 0

let finalAmount = estimateAmount

if(type==="below"){
finalAmount = estimateAmount - (estimateAmount * premiumNum / 100)
}else{
finalAmount = estimateAmount + (estimateAmount * premiumNum / 100)
}

const div=document.createElement("div")
div.innerText="₹ "+formatAmount(Math.round(finalAmount))

finalBox.appendChild(div)

})

}


async function saveResult(tenderId){

const box=document.getElementById(`resultBox_${tenderId}`)
const rows=box.querySelectorAll(".result-row")

await client
.from("tender_result")
.delete()
.eq("tender_id",tenderId)


for(let i=0;i<rows.length;i++){

const company = rows[i].querySelector(".company-select")?.value
const type = rows[i].querySelector(".type")?.value

let premiumInput = rows[i].querySelector(".premium-input")

/* ⭐ premium element check */
if(!premiumInput){
alert("Please add premium for all ranks before saving")
return
}

let premium = premiumInput.value.trim()

/* ⭐ premium empty check */
if(premium === "" || premium === "Premium"){
alert("Pehle premium add karo fir save hoga")
premiumInput.focus()
return
}

/* remove + - % */
premium = premium.replace(/[%+-]/g,"")

/* ⭐ format UI */
if(type === "below"){
premiumInput.value = "-" + premium + "%"
}else{
premiumInput.value = "+" + premium + "%"
}

if(company){

await client
.from("tender_result")
.insert({
tender_id:tenderId,
company_name:company,
rank:`L${i+1}`,
bid_price:premium,
above_below:type
})

}

}
calculateFinal(tenderId, box.querySelector(".premium-input"))
alert("Result Saved")

}
function addRank(id){

const box=document.getElementById(`resultBox_${id}`)

const rows=box.querySelectorAll(".result-row")

const nextRank=rows.length+1

rows.forEach(r=>{
const btn=r.querySelector(".add-btn")
if(btn) btn.remove()
})

const div=document.createElement("div")

div.className="result-row"

div.innerHTML=`

<span class="rank">L${nextRank}</span>

<select class="company-select" onchange="handleCompany(this)">
<option value="">Select Company</option>
<option value="other">➕ Add New Company</option>
</select>

<select class="type"
onchange="updatePremium(this); calculateFinal(${id}, this)">
<option value="above">Above</option>
<option value="below">Below</option>
</select>

<input class="premium-input"
placeholder="Premium"
oninput="calculateFinal(${id}, this)">

<button class="add-btn" onclick="addRank(${id})">+</button>

`

box.appendChild(div)

loadCompanies()

}
function handleCompany(el){

const row = el.closest(".result-row")
const box = row.querySelector(".new-company-box")

if(el.value === "other"){
box.style.display = "flex"
}else{
box.style.display = "none"
}

}
async function saveCompany(btn){

const row = btn.closest(".result-row")

const input = row.querySelector(".custom-company")

const name = input.value.trim()

if(!name){
alert("Company name add karo")
return
}

/* Supabase insert */

await client
.from("company_list")
.insert({company_name:name})

/* dropdown add */

const select = row.querySelector(".company-select")

const option = document.createElement("option")

option.value = name
option.textContent = name

select.insertBefore(option, select.lastElementChild)

/* auto select */

select.value = name

/* hide input */

row.querySelector(".new-company-box").style.display = "none"

input.value=""

}
async function loadCompanies(){

const {data} = await client
.from("company_list")
.select("*")
.order("company_name")

document.querySelectorAll(".company-select").forEach(select=>{

select.innerHTML = `
<option value="">Select Company</option>
<option value="other">➕ Add New Company</option>
`

data.forEach(c=>{

const opt = document.createElement("option")

opt.value = c.company_name
opt.textContent = c.company_name

select.insertBefore(opt, select.lastElementChild)

})

})

}
loadResults()
loadCompanies();