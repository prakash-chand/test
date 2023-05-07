const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const mailer = require('nodemailer');
const Datastore = require("nedb-promises");
const { response } = require("express");
const upload = multer();
const machineId = require('machine-uuid');
const { log } = require("console");
const PORT = 3000;
const pkg = require('./package.json');



let softwareConfiguration = Datastore.create(path.join(__dirname, '/file/software_configuration.db'));
let softwareInfo = Datastore.create(path.join(__dirname, '/file/software_info.db'));
let accounts = Datastore.create(path.join(__dirname, '/file/accounts.db'));
let templateEmail = Datastore.create(path.join(__dirname, '/file/email_template.db'));
let reports = Datastore.create(path.join(__dirname, '/file/reports.db'));
let userInfo = Datastore.create(path.join(__dirname, '/file/user_info.db'));


function getMachineId() {
    return new Promise((resolve) => {
        machineId().then(id => {
            resolve(id);
            return;
        })
    })    
}

function getUUID() {
    return new Promise((resolve) => {
        userInfo.find().then((output) => {
            if(!output[0]){
                resolve("");
                return;
            }

            resolve(output[0].uuid);
            return;
        });
    })    
}


app.listen(PORT, (error) => {
    if(error){
        console.log(error); 
        return;
    }
    
    console.log("Server is listening on port", PORT);
})

app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.use(express.static(__dirname + '/public'));

// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
//form-urlencoded

// for parsing multipart/form-data
app.use(upload.array());



function loadSoftwareDetails(){
    return new Promise((resolve, reject) => {        
        softwareInfo.find().then((softwareInfo) => {
            globalThis.softwareDetails = new Object;
            globalThis.softwareDetails.softwareName = softwareInfo[0].software_name;
            resolve();
        });
    });
}

(async () => {
    await loadSoftwareDetails();
    await loadSoftwareVersion();
})();



app.get('/', (req, res)=>{
    userData().then(data => {
        res.status(200);

        let expiry = "demo";
        
        if(data?.validity){
            let validity = new Date(data.validity);
            let day = validity.getDate();
            let month = (validity.getMonth() + 1);
            let year = validity.getFullYear();
            expiry = day + "/" + month + "/" + year
        }
        
        console.log(data);
        let username = "";
        if(data?.username){
            username = data.username;
        }

        res.render("index.ejs", {softwareDetails: globalThis.softwareDetails, validity: expiry, version: globalThis.version, username: username})
    })    
});


function userData(){
    return new Promise((resolve, reject) => {        
        userInfo.find().then((output) => {            
            resolve(output[0]);
        });
    });
}


app.post('/api/send_email', async (req, res) => {
    if(!req.body){
        res.status(200);
        res.send("Plz send data");
        return;
    }    
    
    let htmlEmail = req.body.htmlEmail;
    let subject = req.body.subject;
    let userEmail = req.body.userEmail;
    let toEmailId = req.body.toEmailId;
    let repoId = req.body.reportId;
    
    let reportId = await sendEmail(userEmail, subject, htmlEmail, toEmailId, repoId);

    let output = new Object;
    output.msg = "message send successfully";
    output.reportId = reportId;    

    res.status(200);    
    res.send(output);
});


app.get("/api/getEmailMsg", async (req, res) => {
    let id = req.query.repoId;
    await getEmailMsg(id).then(data => {
        res.status(200);  
        res.send(data);
        return;
    })    
})


function getEmailMsg(id){
    return new Promise( (resolve, reject) => {
        reports.find({_id: id}).then(response => {
            return response;
        }).then(data => {
            resolve(data[0].msg.email);
        });
    })
}


app.get("/api/report", async (req, res) => {
    let id = req.query.repoId;
    await getEmailReport(id).then(data => {
        res.status(200);  
        res.send(data);
        return;
    })    
})


function getEmailReport(id){
    return new Promise( (resolve, reject) => {
        reports.find({_id: id}).then(response => {
            return response;
        }).then(data => {
            resolve(data[0]);
        });
    })
}


app.get("/api/get_allEmailId", async (req, res) => {
    await getAllEmailId().then(data => {
        res.status(200);  
        res.send(data);
        return;
    })    
})


function getAllEmailId(){
    return new Promise( (resolve, reject) => {
        reports.find().then(response => {
            return response;
        }).then(output => {
            let data = new Array;
            for(let i=0; i<output.length; i++){
                data.push(output[i]._id);                
            }
            
            resolve(data);
        })
    });    
}


app.post("/api/software_configuration", (req, res) => {
    if(!req.body){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    let emailList = req.body.emailList;

    softwareConfiguration.insert(
        {email: emailList}
    ).then((response) => {        
        res.send(response._id);
    });
});


app.get("/api/software_configuration", (req, res) => {
    softwareConfiguration.find().then((emailList) => {        
        res.send(emailList);
    });
});


app.delete("/api/software_configuration/single", (req, res) => {
    let id = req.body.id;
    softwareConfiguration.findOne({_id: id}).then((response) => {
        if(!response){
            res.send("something went wrong");
            return;
        }

        softwareConfiguration.remove({_id: id}).then(() => {
            res.send('remove successfully');
            return;
        })
    })
});


app.delete("/api/software_configuration", (req, res) => {
    softwareConfiguration.remove({}, { multi: true }).then((response) => {        
        res.send("remove successfully");
    })  
});


app.post("/api/user_info", (req, res) => {
    if(!req.body){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    let validity = req.body.validityDate;
    let username = req.body.username;
    let registrationdate = req.body.registrationdate;
    
    userInfo.remove().then(() => {
        userInfo.insert(
            {validity: validity, username: username, registrationdate: registrationdate}
        ).then(() => {
            res.send("insert successfully")
        });
    })    
});


app.get("/api/user_info", (req, res) => {
    userInfo.find().then((user) => {
        res.send(user);
    });
});


app.put("/api/user_info", (req, res) => {
    if(!req.body){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    if(!req.body.uuid){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    if(!req.body.validityDate){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    
    let validity = req.body.validityDate;
    let username = req.body.username;
    let registrationdate = req.body.registrationdate;

    userInfo.remove().then(() => {        
        userInfo.insert({validity: validity, username: username, registrationdate: registrationdate}).then(() => {
            res.send("update successfully")
        });
    })    
});


app.get("/api/software_info", (req, res) => {
    softwareInfo.find().then((software) => {
        res.send(software);
    });
});


app.post("/api/accounts", (req, res) => {
    if(!req.body){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    let service = req.body.service;
    let userId = req.body.userId;
    let password = req.body.password;

   addAccount(service, userId, password)
});


function addAccount(service, userId, password){
    return new Promise((resolve, reject) => {
        accounts.insert(
            {service: service, userId: userId, password: password}
        ).then(() => {
            resolve("insert successfully")
        });
    });    
}


app.get("/api/accounts", (req, res) => {
    accounts.find().then((accounts) => {
        res.send(accounts);
    });
});


app.put("/api/accounts", (req, res) => {
    if(!req.body){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    let accountId = req.body.accountId;
    let service = req.body.service;
    let password = req.body.password;


    accounts.find({userId: accountId}).then((accounts) => {        
        return accounts[0];
    }).then(accounts => {
        if(!accounts){            
            addAccount(service, accountId, password).then((msg) => {
                res.send(msg);                
            })
            return;
        }
        
        updateAccount(accountId, service, password).then((msg) => {
            res.send(msg);            
        })
        return;        
    });   
});


function updateAccount(accountId, service, password){
    return new Promise((resolve, reject) => {
        accounts.update(
            {userId : accountId}, {$set: {service: service, userId: accountId, password: password}}
        ).then((msg) => {
            resolve("update successfully");
        });  
    });    
}


app.delete("/api/accounts", (req, res) => {
    if(!req.body){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    let accountId = req.body.accountId;

    accounts.find({userId: accountId}).then((accounts) => {        
        return accounts[0];
    }).then(value => {
        if(!value){
            res.send('something gone wrong')
            return;
        }
        
        accounts.remove({userId: accountId}).then( (msg) => {
            res.send('delete successfully');
        });
        
    });
    
});


app.get("/api/selectedAccounts", (req, res) => {
    let accountId = req.query.accountId;
    
    accounts.find({userId: accountId}).then((accounts) => {
        res.send(accounts);
    })    
})


function sendEmail(userEmail, subject, htmlEmail, toEmailId, repoId){
    return new Promise( (resolve, reject) => {
        try {
            accounts.findOne({userId: toEmailId}).then((account) => {
                smtpProtocol = mailer.createTransport({
                    service: account.service,
                    auth: {
                        user: account.userId,
                        pass: account.password
                    }
                });
                
                var mailoption = {
                    from: account.userId,
                    to: userEmail,
                    subject: subject,
                    html: htmlEmail
                }
                
                smtpProtocol.sendMail(mailoption, function(err, response){
                    if(err) {
                        console.log(err);
                    }                    
                    smtpProtocol.close();                   
                    
                    storeReport(subject, htmlEmail, account.userId, userEmail, response.message, repoId).then(reportId => {
                        resolve(reportId);
                    })
                });
            });
            
        } catch (error) {
            console.log(error.message);
        }
    })    
}


function storeReport(subject, msg, sender, receiver, status, repoId){
    return new Promise( (resolve) => {
        
        if(repoId && repoId!=undefined && repoId!=="undefined"){            
            updateReport(repoId).then(reportId => {
                resolve(reportId);
            })
        }else{            
            storeReport().then(reportId => {
                resolve(reportId);
            })
        }

        function storeReport(){
            return new Promise( (resolve) => {
                let sendingTime = new Date;
    
                let day = sendingTime.getDate() + "";
                let month = (sendingTime.getMonth() + 1) + "";
                let year = sendingTime.getFullYear() + "";
                let hour = sendingTime.getHours() + "";
                let minutes = sendingTime.getMinutes() + "";
                let seconds = sendingTime.getSeconds() + "";


                let data = [{
                    value : [{ sender: sender, receiver: receiver, sendingTime: `${day}/${month}/${year}  ${hour}:${minutes}:${seconds}`, status: true}],
                    msg : {subject: subject, email: msg}
                }];
            
                reports.insert(data).then((response) => {
                    resolve(response[0]._id);
                });
            });            
        }
        
        function updateReport(repoId){
            return new Promise( (resolve) => {
                reports.find({_id: repoId}).then(report => {
                    if(!report[0]){
                        return "";
                    }
                    
                    return report;
                }).then(report => { 
                    if(!report){
                        resolve();
                        return;
                    }                    

                    let repoId = report[0]._id;
                    let data = [
                        ...report[0].value, { sender: sender, receiver: receiver, sendingTime: "2021-05-15", status: true}
                    ];                    

                    reports.update(
                        {_id : repoId}, {$set: {value: data}}
                    ).then((output) => {
                        resolve(repoId);
                        return;
                    });
                })
            });           
        }
    });
}


app.post("/api/store/template", (req, res) => {
    if(!req.body){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    let subject = req.body.subject;
    let body = req.body.body;

    templateEmail.insert(
        {body: body, subject: subject, selected: true}
    ).then((response) => {
        res.send(response)
    });
});


app.get("/api/selected/template", (req, res) => {
    templateEmail.findOne(
        {selected: true}
    ).then((response) => {
        res.send(response)
    });
});

app.put("/api/update/template", (req, res) => {
    if(!req.body){
        res.status(200);
        res.send("Plz send data");
        return;
    }

    let subject = req.body.subject;
    let body = req.body.body;
    let templateId = req.body.templateId;
    
    templateEmail.update(
        {_id : templateId}, {$set: {subject: subject, body: body}}
    ).then((output) => {
        res.status(200);
        res.send({_id: templateId});
    });
});


app.get("/api/machineId", (req, res) => {    
    getMachineId().then(id => {
        res.send(id)
    })    
});

app.get("/api/uuid", (req, res) => {    
    getUUID().then(uuid => {
        res.send(uuid)
    })    
});


function loadSoftwareVersion(){
    return new Promise((resolve, reject) => {        
        globalThis.version = pkg.version;    
        resolve();
    });
}


