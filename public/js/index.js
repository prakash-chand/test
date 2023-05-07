let emailInputBox = document.getElementById("email-input-box");
let emailBox = document.getElementById("email-box");
emailBox.addEventListener("click", removeSingleEmailBox);
emailBox.addEventListener("paste", pasteEmailBox);
emailBox.addEventListener("keypress", createEmailBox);

let clearAllBtn =  document.getElementById("clear-all");
clearAllBtn.addEventListener("click", removeAllEmailBox);

let uploadFileBtn = document.getElementById("upload-file");
uploadFileBtn.addEventListener("click", selectFileOpen);

let showReportBtn = document.getElementById("show-report");
showReportBtn.addEventListener("click", showReport);

let closeReportBtn = document.getElementById("reportModal").querySelector(".close");
closeReportBtn.addEventListener("click", () => {
    timeout(100).then(() => {
        let list = document.getElementById("reportModal").classList;
        list.toggle("show");
        list.toggle("display");

        return;
    })
})


let closeEmailSendingStatus = document.getElementById("emailSendingStatus").querySelector(".close");
closeEmailSendingStatus.addEventListener("click", () => {
    timeout(100).then(() => {
        let list = document.getElementById("emailSendingStatus").classList;
        list.toggle("show");
        list.toggle("display");

        return;
    })
})


// let filterEmailBtn = document.getElementById("filter-email");
// filterEmailBtn.addEventListener("click", checkEmailValidate);

let sendEmailBtn = document.getElementById("send-email");
sendEmailBtn.addEventListener("click", prepareEmail);

let delayBox = document.getElementsByClassName("delayInputBox").item(0);
let batchingBox = document.getElementById("batching");


let dropdownToggle = document.querySelector("body")
dropdownToggle.addEventListener("click", (event) => {
    if(event.target.classList.contains("dropdown-toggle")){
        showAccountDropdown(event);
        return;
    }else{
        let dropdownElement = event.target.parentElement.querySelector("ul");
        dropdownElement?.classList?.remove("display");
    }
    
    if(event.target.getAttribute("data-id") || event.target.value == "all"){
        countSelectedAccount(event)
    }    
});


const processChange = debounce(() => storeEmailData());
let emailSubject = document.getElementById("email-subject");
emailSubject.addEventListener("input", processChange);
globalThis.load = true;

let emailBody = document.querySelector("#content").parentElement;
let targetNode = emailBody;
if(targetNode){
    let mutation = new MutationObserver((event) => {
        processChange();
    });

    let options = {subtree: true, childList: true, characterData: true};
    mutation.observe(targetNode, options);
}

let addAccountBtn = document.getElementById("addAccountBtn");
addAccountBtn.addEventListener("click", showHideAccountModal);

let addAccountModalCloseBtn = document.getElementById("addAccountModal").querySelector(".close");
addAccountModalCloseBtn.addEventListener("click", showHideAccountModal);

let addAccountModalCloseBtnInForm = document.getElementById("addAccountModal").querySelector(".modal-close");
addAccountModalCloseBtnInForm.addEventListener("click", showHideAccountModal);

let updateAccountBtn = document.getElementById("update-accounts");
updateAccountBtn.addEventListener("click", updateOrAddAccount);

let loginBtn = document.getElementById("loginModal")?.querySelector(".btn");
loginBtn.addEventListener("click", verifyKey);

let url = "http://localhost:3000";

function showLoginError(msg, color="#c71610"){    
    document.getElementsByClassName("error").item(0)?.remove();

    let element = document.createElement("div");
    element.setAttribute("class", "error");
    element.style.color = color;    
    element.style.marginTop = "-15px";
    element.style.marginBottom = "5px";
    element.style.textAlign = "center";
    element.innerText = msg;
    

    document.querySelector("#loginModal").querySelector(".modal-body").childNodes[1].prepend(element);
    return;
}

function getMachineId(){
    return new Promise((resolve) => {
        fetch(`${url}/api/machineId`, {
            method: "GET"
        }).then(response => {
            return response.text()
        }).then(output => {
            resolve(output);
            return;
        });
    })
}

function getUUID(){
    return new Promise((resolve) => {
        fetch(`${url}/api/uuid`, {
            method: "GET"
        }).then(response => {
            return response.text()
        }).then(output => {
            resolve(output);
            return;
        });
    })
}


async function verifyKey(){
    let serverUrl = 'https://www.goyral.com/bulkemail/index.php';
    let uuid = document.getElementById("loginModal").getElementsByTagName("input").item(0).value;
    if(!uuid){
        showLoginError("plz enter key");
        return;
    }
    if(uuid.length < 10){
        showLoginError("Enter valid key");
        return;
    }
    

    let data = new FormData;
    data.append("type", "login");
    data.append("uuid", uuid);
    data.append("machine_id", await getMachineId());
    
    fetch(serverUrl, {
        method: "POST",
        body : data
    }).then(response => {
        return response.json()
    }).then(output => {
        let color = "green";

        if(output.type!="success"){
            color = "#c71610";
        }
        showLoginError(output.msg, color);

        if(output.type=="success"){
            activateSoftware();
            storeUserInfo(output);
        }
    });

    return;
}


function storeUserInfo(data){
    let validity = data.validityDate;
    let username = data.username;
    let registrationdate = data.registrationdate;

    let datas = new FormData;
    datas.append("validityDate", validity);
    datas.append("username", username);
    datas.append("registrationdate", registrationdate);


    fetch(`${url}/api/user_info`, {
        method: "POST",
        body: datas
    }).then(response => {
        // console.log(response);
    })
}


function showHideAccountModal(){
    timeout(100).then(() => {
        let list = document.getElementById("addAccountModal").classList;
        list.toggle("show");
        list.toggle("display");
    });    
}


function debounce(func, timeout = 1000){
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}


function storeEmailData(){
    if(globalThis.load){
        globalThis.load = false;
        return;
    }

    let subject = emailSubject.value;
    let body = emailBody.querySelectorAll(".redactor_form-control").item(0).innerHTML;    
    let templateId = document.getElementById("template-id").value;
    

    let data = new FormData();
    data.append("subject", subject);
    data.append("body", body);
    data.append("templateId", templateId);

    fetch(templateId?`${url}/api/update/template`:`${url}/api/store/template`, {
        method: templateId?"PUT":"POST",
        body : data
    }).then(response => {
        return response.json()
    }).then(output => {
        document.getElementById("template-id").value = output._id;
    });

    return;
}



function createEmailBox(event){
    if(event.target.id!=="email-input-box"){
        return;
    }    
    

    if(event.charCode == 32){ 
        // alert('cannot add space');        
        event.preventDefault();        
        return;
    }
    
    
    if(event.charCode!=13 && event.charCode!=44){
        return;
    }

    if((event.charCode==13 || event.charCode==44) && !emailInputBox.value){        
        event.preventDefault();
        return;
    }

    let nodeValue = emailInputBox.value.trim();    
    nodeValue = nodeValue.replaceAll(",","");    
    box(nodeValue);

    return;
}


function pasteEmailBox(event){    
    event.preventDefault();

    let data = event.clipboardData.getData("Text");
    let email = data.split(",")
    for(let i=0; i<email.length; i++){
        box(email[i]);
    }
}


function box(nodeValue){    
    if(nodeValue.search(",")){
        nodeValue = filterEmail(nodeValue)[0];
    }    
    
    let data = new FormData(); 
    data.append("emailList", nodeValue);    

    fetch(`${url}/api/software_configuration`, {
        method: "POST",
        body : data
    }).then(response => {
        return response.text()
    }).then(output => {        
        appendEmailBox(nodeValue, output);
    });
    
    return;
}


function appendEmailBox(nodeValue, id=""){    
    let element = document.createElement('span');
    element.setAttribute("class", "badge text-bg-danger");
    element.setAttribute("contenteditable", "false");

    element.innerHTML = `${nodeValue} <button type="button" data-id="${id}" class="btn-close close-email-box"></button>`;
    emailInputBox.before(element);

    emailInputBox.value = ``;
    return;
}


function removeSingleEmailBox(event){    
    if(event.target.id == "email-box"){        
        document.getElementById("email-input-box").focus();
    }    

    let classList = event.target.classList;
    if(!classList.contains("close-email-box")){
        return;
    }
    
    let data = new FormData();
    data.append('id', event.target.dataset.id)
    fetch(`${url}/api/software_configuration/single`, {
        method: "DELETE",
        body : data
    }).then(response => {
        return (response.text());
    }).then(output => {
        event.target.parentElement.remove();
    })
    

    return;
}


function removeAllEmailBox(event){
    fetch(`${url}/api/software_configuration`, {
        method: "DELETE"        
    }).then(output => {        
        let element = emailBox.querySelector("input");
        emailBox.innerHTML = ``;
        emailBox.append(element);
    })
    return;
}


function selectFileOpen(){
    let element = document.createElement("input");
    element.setAttribute("type", "file");
    element.id = "select-email-file";
    element.setAttribute("accept", ".csv");
    element.style.display = "none";

    element.addEventListener("change", loadFile);
    element.click();

    
    async function loadFile() {
        try {            
            let data = await readFile();               
            let emailList = await filterEmail(data);
            
            if (emailList.length == 0) {
                return;
            }            
         
            for(index in emailList){
                if(!emailList[index]){
                    continue;
                }

                box(emailList[index]);
            }            
            
        } catch (error) {
            console.log(error);
        }
    }

    function readFile() {
        return new Promise((resolve, reject) => {
            try {
                let reader = new FileReader();
    
                reader.onload = function () {
                    resolve(reader.result);
                };
    
                // start reading the file. When it is done, calls the onload event defined above.
                reader.readAsBinaryString(element.files[0]);
            } catch (error) {
                console.log(error);
            }
        });
    }

    return;
}


function filterEmail(data){    
    let emailList = data.split("\n");
    // let emailList = data.split(",");
    return emailList;
}


function showReport(){
    timeout(100).then(() => {
        let list = document.getElementById("reportModal").classList;
        list.toggle("show");
        list.toggle("display");

        return;
    }).then( () => {        
        getAllEmailId().then((id) => {
            return id;
        }).then((id) => {
            showIdList(id);

            getReportFromId(id[0]).then((data) => {
                showReportData(data);
            })
        });
    });
}


function showIdList(id){
    document.getElementById("reportModal").querySelector(".modal-body").querySelector("select")?.remove();

    let element = document.createElement("select");
    element.style.width = "100px";
    element.style.borderRadius = "3px";
    element.style.boxShadow = "0px 0px 2px #898989"
    element.style.paddingTop = "3px";
    element.style.paddingBottom = "3px";
    element.style.paddingLeft = "5px";
    element.style.fontSize = "17px";
    element.style.fontWeight = "500";
    element.style.border = "2px solid #f7f7f7";
    
    for(let i=0; i<id.length; i++){
        element.innerHTML += `<option value="${id[i]}">List ${i+1}</option>`;
    }

    document.getElementById("reportModal").querySelector(".modal-body").append(element);

    element.addEventListener("change", (event) => {
        let id = event.target.selectedOptions.item(0).value;

        getReportFromId(id).then((data) => {
            document.getElementById("example_wrapper").remove();
            showReportData(data);
        })
    })
    return;
}


function getAllEmailId(){
    return new Promise ( (resolve, reject) => {
        fetch(`${url}/api/get_allEmailId`, {
            method: "GET"
        }).then(output => {
            return output.json();                
        }).then(response => {
            resolve(response);
        });
    })
}


function getReportFromId(id){
    return new Promise ( (resolve, reject) => {        
        fetch(`${url}/api/report?repoId=${id}`, {
            method: "GET"
        }).then(output => {
            return output.json();
        }).then(response => {
            resolve(response);
        });
    })
}


function showReportData(data){
    let value = "";    
    document.getElementById("example_wrapper")?.remove();
    
    for(let i=0; i<data.value.length; i++){
        value += `<tr>
                    <td>${data.value[i].sender}</td>
                    <td>${data.value[i].receiver}</td>                    
                    <td>${data.value[i].sendingTime}</td>
                    <!-- <td class="showEmailStyle">Show</td> -->
                </tr>`;
    }
    

    let parentElement = document.getElementById("reportModal").querySelector(".modal-body");

    let element = document.createElement("table");
    element.setAttribute("class", "table table-striped table-bordered");
    element.style.width = "100%";
    element.setAttribute("id", "example");
    element.innerHTML = `<table id="example" class="table table-striped table-bordered" style="width:100%">
                            <thead>
                                <tr>
                                    <th>Sender</th>
                                    <th>Receiver</th>
                                    <th>Sending Time</th>
                                    <!-- <th>Email</th> -->
                                </tr>
                            </thead>
                            <tbody>
                                ${value}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th>Sender</th>
                                    <th>Receiver</th>
                                    <th>Sending Time</th>
                                    <!-- <th>Email</th> -->
                                </tr>
                            </tfoot>
                        </table>`;
    
    
    
    parentElement.append(element);
    $('#example').DataTable();
    return;
}


function checkEmailValidate(){
    let totalEmail = countTotalEmail();
    if(totalEmail == 0){
        let error = "Plz enter atleast one email";
        document.getElementsByClassName('error').item(0).innerHTML = ` <div class="alert alert-danger">${error}</div>`;
        return;
    }


    // console.log(`filter email ${totalEmail}`);
    return;
}


function showEmailBox(){
    return new Promise( (resolve, reject) => {
        timeout(100).then(() => {
            let list = document.getElementById("emailSendingStatus").classList;
            list.toggle("show");
            list.toggle("display");
    
            resolve();
        })
    })    
}


function errorUnset(){
    document.getElementsByClassName("error").item(0).innerHTML = '';
}


async function prepareEmail(){
    errorUnset();
    let totalEmail = countTotalEmail();
    if(totalEmail == 0){        
        let error = "Plz enter atleast one email";
        document.getElementsByClassName('error').item(0).innerHTML = ` <div class="alert alert-danger">${error}</div>`;
        return;
    }
    
    let emailSubject = getEmailSub();
    if(!emailSubject){        
        let error = "Plz enter subject";
        document.getElementsByClassName('error').item(0).innerHTML = ` <div class="alert alert-danger">${error}</div>`;
        return;
    }

    let email = getAllEmail();
    if(!email){        
        let error = "Plz enter atleast one email";
        document.getElementsByClassName('error').item(0).innerHTML = ` <div class="alert alert-danger">${error}</div>`;
        return;
    }
    
    let htmlEmail = getEmailHTML();
    if(!htmlEmail.length){        
        let error = "Plz enter mail";
        document.getElementsByClassName('error').item(0).innerHTML = ` <div class="alert alert-danger">${error}</div>`;
        return;
    }
    

    let delay;
    let batch = emailBatch();
    let i = 0;
    globalThis.pause = false; 
    let selectedAccount = document.getElementsByClassName("send-to-group-option").item(0).querySelectorAll("li");
    let toEmailId = new Array();
    let j=0;
    
    
    for(let i=1; i<selectedAccount.length; i++){
        if(!selectedAccount.item(i).querySelector("input").checked){
            continue;
        }
        let id = selectedAccount.item(i).querySelector("input").dataset.id;
        toEmailId.push(id);
    }
    
    if(!toEmailId[0]){        
        let error = "Atleast select one account";
        document.getElementsByClassName('error').item(0).innerHTML = ` <div class="alert alert-danger">${error}</div>`;
        return;
    }
    

    await showEmailBox();
    useforPauseAndPlay();
    

    async function useforPauseAndPlay(){        
        while(i < totalEmail){
            let sendMail = "";            

            if(globalThis.pause){
                break;
            }

            if(j>=toEmailId.length){
                j=0;
            }

            sendMail = toEmailId[j];
            j++;
            
            delay = delayValue();            
            let userEmail = email[i];

            await sendEmail(emailSubject, htmlEmail, userEmail, sendMail);            
            await timeout(delay * 1000);
            i++;            
        }   
    } 

    return;
}


function sendEmail(emailSubject, htmlEmail, email, toEmailId){
    return new Promise( (resolve, reject) => {
        try {
            let data = new FormData;
            data.append("subject", emailSubject);
            data.append("htmlEmail", htmlEmail);
            data.append("userEmail", email);
            data.append("toEmailId", toEmailId);
            data.append("reportId", globalThis.reportId);

            fetch(`${url}/api/send_email`, {
                method: "POST",
                body : data
            }).then(output => {
                return output.json();                
            }).then(response => {
                globalThis.reportId = response.reportId;

                appendEmailStatus(email, toEmailId);
                resolve();
                return;
            });
        } catch (error) {
            console.log(error.message);
        }
    })    
}


function appendEmailStatus(toEmailId, fromEmailId){
    let parentElement = document.getElementById("emailSendingStatusTable");
    let sendingTime = new Date;
    
    let day = sendingTime.getDate() + "";
    let month = (sendingTime.getMonth() + 1) + "";
    let year = sendingTime.getFullYear() + "";
    let hour = sendingTime.getHours() + "";
    let minutes = sendingTime.getMinutes() + "";
    let seconds = sendingTime.getSeconds() + "";

 

    if(!parentElement){
        return;
    }
    let element = document.createElement("tr");
    element.innerHTML = `<td>${fromEmailId}</td>
                        <td>${toEmailId}</td>                    
                        <td>${day}/${month}/${year}  ${hour}:${minutes}:${seconds}</td>`;
    

    parentElement.querySelector("tbody").append(element);

    $('#emailSendingStatusTable').DataTable();
    return;
}


function timeout(ms){
	return new Promise((resolve, reject) => {
		try {
			setTimeout(function () {
				resolve();
			}, ms);
		} catch (error) {
			console.log(error);
		}
	});
}


function emailBatch(){
    if(!batchingBox.checked){
        return false;
    }

    let totalBatchMsg = document.getElementById("total-batch-msg").value;
    let batchDelay = document.getElementById("batch-wait").value;

    let batch = new Object;
    batch.totalBatchMsg = totalBatchMsg;
    batch.delay = batchDelay;

    return batch;
}


function delayValue(){
    let delayMode = document.querySelector('input[name="timegap"]:checked').value;
    if(delayMode=="random"){
        return randomDelay();
    }

    return parseInt(delayBox.value) >= 3 ? parseInt(delayBox.value) : 3;    
}


function getAllEmail(){
    let length = countTotalEmail();
    let email = new Array;    

    for(let i=0; i<length; i++){
        email.push(emailBox.querySelectorAll("span").item(i).innerText.trim());
    }
    
    return email;
}


function countTotalEmail(){
    return emailBox.querySelectorAll("span").length;
}


function getEmailSub(){
    return document.getElementById("email-subject").value;
}


function getEmailHTML(){
    let htmlEmail = new Array;
    if(!document.getElementsByClassName("redactor_form-control").item(0)?.querySelector("p")?.innerText.trim()){
        return htmlEmail;
    }
    
    return htmlEmail = document.getElementsByClassName("redactor_form-control").item(0).innerHTML;
}


function randomDelay(){
	try {
		let delay = Math.floor((Math.random() * 10) + 1);
		if(delay > 8 || delay < 2){
			return 3;
		}else{
			return delay;
		}
	} catch (error) {
		console.log(error);
	}
}


function showAccountDropdown(event){    
    let dropdownElement = event.target.parentElement.querySelector("ul");
    dropdownElement.classList.toggle("display");
    return;
}


function countSelectedAccount(event){
    if(event.target.tagName !== "INPUT"){
        return;
    }
    
    let listAllAccountDropdown = document.getElementById("list-account-dropdown");
    
    if(event.target.value == "all" && event.target.checked){
        let totalAccount = listAllAccountDropdown.parentElement.querySelector("ul").childElementCount;
        document.getElementsByClassName("selected-account-count").item(0).innerText = totalAccount-1;

        
        for(let i=0; i<totalAccount; i++){            
            listAllAccountDropdown.parentElement.querySelector("ul").children[i].querySelector('input').checked = true;
        }

        return;
    }else if(event.target.value == "all"){
        let totalAccount = listAllAccountDropdown.parentElement.querySelector("ul").childElementCount;

        for(let i=0; i<totalAccount; i++){
            listAllAccountDropdown.parentElement.querySelector("ul").children[i].querySelector('input').checked = false;
        }   

        document.getElementsByClassName("selected-account-count").item(0).innerText = 0;
        return;
    }

    if(event.target.checked){
        let totalSelectedAccount = parseInt(document.getElementsByClassName("selected-account-count").item(0).innerText);        
        document.getElementsByClassName("selected-account-count").item(0).innerText = ++totalSelectedAccount;
    }else{
        let totalSelectedAccount = parseInt(document.getElementsByClassName("selected-account-count").item(0).innerText);        
        document.getElementsByClassName("selected-account-count").item(0).innerText = --totalSelectedAccount;
    }
    
}


function showTemplateDropdown(){
    let dropdownElement = listAllTemplateDropdown.parentElement.querySelector("ul");
    dropdownElement.classList.toggle("display");
}


(() => {
	let targetNode = emailBox;	
	if(targetNode){

		let mutation = new MutationObserver((event) => {
			let totalNumber = emailBox.querySelectorAll("span").length;	
            document.getElementById("total-uploaded-emails").innerText = totalNumber;
		});

		let options = {subtree: true, childList: true};
		mutation.observe(targetNode, options);
	}
})();


function updateUserInfo(data){    
    let uuid = data.data;
    let validity = data.validity;
    let username = data.username;
    let registrationdate = data.registrationdate;

    let datas = new FormData;
    datas.append("uuid", uuid);
    datas.append("validityDate", validity);
    datas.append("username", username);
    datas.append("registrationdate", registrationdate);

    fetch(`${url}/api/user_info`, {
        method: "PUT",
        body: datas
    }).then(response => {
        // console.log(response);
    })
}


(async () => {
    let serverUrl = 'https://www.goyral.com/bulkemail/index.php';
    let machineId = await getMachineId();    

    if(!machineId){
        return;
    }


    let data = new FormData;
    data.append("type", "check_validity");
    data.append("machine_id", machineId);

    fetch(serverUrl, {
        method: "POST",
        body : data
    }).then(response => {
        return response.json()
        
    }).then(output => {
        if(output.type != "success"){
            return;
        }        
        
        let currentDate = new Date;
        let validity = output.validity;

        if(Date.parse(currentDate) < Date.parse(validity)){
            activateSoftware();
        }

        updateUserInfo(output);
        
    });

})();


function activateSoftware(){
    let list = document.getElementById("loginModal").classList;
    list.toggle("show");
    list.toggle("display");
}


function loadPreviousEmailData(){
    fetch(`${url}/api/software_configuration`, {
        method: "GET"
    }).then(response => {
        return response.json();
    }).then(output => {
        for(let i=0; i<output.length; i++){            
            appendEmailBox(output[i].email, output[i]._id)
        }        
    })
}


function appendAccountList(listofAccounts){
    let parent = document.getElementsByClassName("send-to-group-option").item(0);
    let accountUpdateModalList = document.getElementById("addAccountModal").querySelector("ul");

    for(let i=0; i<listofAccounts.length; i++){
        let element = document.createElement("li");
        element.style.color = "black";
        element.style.fontWeight = "600";
        element.innerHTML = `<label><input type="checkbox" data-id='${listofAccounts[i].userId}'> ${listofAccounts[i].userId}</label>`;
        
        parent.append(element);
    }
    
    
    for(let i=0; i<listofAccounts.length; i++){
        let element = document.createElement("li");
        element.style.color = "black";
        element.style.fontWeight = "600";
        element.innerHTML = `<label>${listofAccounts[i].userId}</label>`;
        
        accountUpdateModalList.append(element);        
    }

    if(listofAccounts.length){
        accountUpdateModalList.addEventListener("click", (event) => {
            if(!event.target.tagName == "LI"){
                return;
            }

            let list = accountUpdateModalList.classList;
            list.toggle("display");

            accountUpdateModalList.parentElement.querySelector("button").innerText = event.target.innerText;

            getSelectedAccountValue(event.target.innerText).then(accountValue => {
                if(!accountValue){
                    return;
                }

                showAccountValueAccountUpdateModal(accountValue);
            })
            
        })
    }    

    return;
}


function getSelectedAccountValue(accountId){
    return new Promise ( (resolve, reject) => {
        fetch(`${url}/api/selectedAccounts/?accountId=${accountId}`, {
            method: "GET"
        }).then(response => {
            return response.json();
        }).then(output => {
            resolve(output);
        })
    })
}



function showAccountValueAccountUpdateModal(accountValue){
    if(!accountValue){
        return;
    }    

    document.getElementById("addAccountModal").querySelector("input[name='service-provider']").value = accountValue[0].service;
    document.getElementById("addAccountModal").querySelector("input[name='emailId']").value = accountValue[0].userId;
    document.getElementById("addAccountModal").querySelector("input[name='access-pwd']").value = accountValue[0].password;
    
    if(document.getElementById("addAccountModal").querySelector(".modal-footer").querySelector(".account-delete")){
        return;
    }

    let element = document.createElement("button");
    element.style.color = "var(--gbw-green)";
    element.style.border = "2px solid var(--gbw-green)";
    element.style.fontWeight = 500;
    element.setAttribute("class", "btn account-delete");
    element.innerText = "Delete";


    document.getElementById("addAccountModal").querySelector(".modal-footer").append(element);
    
    element.addEventListener("click", deleteAccount);    
    return;
}


function deleteAccount(){
    let userId = document.getElementById("addAccountModal").querySelector("input[name='emailId']").value;

    let data = new FormData;
    data.append("accountId", userId);

    fetch(`${url}/api/accounts`, {
        method: "DELETE",
        body : data
    }).then(response => {
        return response.text();
    }).then(output => {
        let color = "#c71610";
        let msgSection = document.getElementsByClassName("account-modal-msg").item(0);

        if(output == "delete successfully"){
            msgSection.innerText = "Delete account successfully";
            msgSection.style.color = color;
        }

        setTimeout(() => {
            msgSection.innerText = '';
        }, 5000);

        deleteAccountSuccefully();        
    })

    
    function deleteAccountSuccefully(){
        document.getElementById("addAccountModal").querySelector("input[name='service-provider']").value = "";
        document.getElementById("addAccountModal").querySelector("input[name='emailId']").value = "";
        document.getElementById("addAccountModal").querySelector("input[name='access-pwd']").value = "";

        document.getElementById("addAccountModal").querySelector(".modal-body").querySelector(".dropdown-toggle").innerText = "Select Accounts for Updates";

        let element = document.getElementById("addAccountModal").querySelector(".dropdown-menu");
        let selectAccountList = document.getElementById("list-account-dropdown").parentElement.querySelector(".dropdown-menu");

        for(let i=0; i<element.childElementCount; i++){
            if(userId != element.children[i].innerText){
                continue;
            }

            element.children[i].remove();
            selectAccountList.children[i+1].remove();
            i = element.childElementCount;
        }
    }    
}


function loadAllAccounts(){
    fetch(`${url}/api/accounts`, {
        method: "GET"
    }).then(response => {        
        return response.json();
    }).then(output => {
        appendAccountList(output);
    })
}


function updateOrAddAccount(){    
    let serviceProvider = document.getElementById("addAccountModal").querySelector("input[name='service-provider']");
    let userId = document.getElementById("addAccountModal").querySelector("input[name='emailId']");
    let accessPwd = document.getElementById("addAccountModal").querySelector("input[name='access-pwd']");

    if(!serviceProvider.value || !userId.value || !accessPwd.value){
        return;
    }

    let data = new FormData();
    data.append("service", serviceProvider.value);
    data.append("accountId", userId.value);
    data.append("password", accessPwd.value);

    fetch(`${url}/api/accounts`, {
        method: "PUT",
        body : data
    }).then(response => {
        return response.text();
    }).then(output => {
        let color = "#c71610";
        let msgSection = document.getElementsByClassName("account-modal-msg").item(0);
        
        if(output == "insert successfully"){
            msgSection.innerText = "Account Add Successfully";
            msgSection.style.color = "green";            
            let list = new Array;
            list[0] = new Object;
            list[0].userId = userId.value;
            appendAccountList(list);
        }else if(output == "update successfully"){
            msgSection.innerText = "Update account successfully";
            msgSection.style.color = "green";
        }

        setTimeout(() => {
            msgSection.innerText = '';
        }, 5000);

        document.getElementById("addAccountModal").querySelector(".dropdown-toggle").innerText = "Select Accounts for Update";        

        serviceProvider.value = "";
        userId.value = "";
        accessPwd.value = "";
    })
    
    return;
}


function appendSelectedTemplate(template){    
    document.getElementById("template-id").value = template._id;
    emailBody.querySelectorAll(".redactor_form-control").item(0).innerHTML = template.body;
    emailSubject.value = template.subject;
    return;
}


function loadSelectedTemplate(){
    fetch(`${url}/api/selected/template`, {
        method: "GET"
    }).then(response => {                
        if(!response.headers.get("content-type")){
            return response.text();
        }

        return response.json();
    }).then(output => {
        if(!output){
            return;
        }
        
        appendSelectedTemplate(output);
    })
}


(() => {
    loadPreviousEmailData();
    loadAllAccounts();
    loadSelectedTemplate();
})();