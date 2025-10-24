let CLAW_ClientAPI = {
    init: async function() {
        await this.auth.init(true);
    },
    checkServiceAvailability: function(servicesToCheck, setElementActive) {
        servicesToCheck.forEach((service) => {
            let httpAPIRequest = new XMLHttpRequest();
            httpAPIRequest.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (httpAPIRequest.responseText == "true") {
                        document.getElementById(service).setAttribute("available_service", "true");
                        console.log(`CLAW_ClientAPI: service "${service}" is marked as available.`);
                    } else {
                        if (setElementActive) {
                            document.getElementById(service).setAttribute("available_service", "false");
                        }
                    }
                }
            };
            httpAPIRequest.open("GET", `api/service/${service}/availability`, true);
            httpAPIRequest.send();
        });
    },
    service: {
        account: {
            init: async function() {
                let auth = await CLAW_ClientAPI.auth.init(true);
                if (CLAW_ClientAPI.auth.loggedIn) {
                    document.getElementById("accountInfoLoggedInStatusText").innerHTML = `${CLAW_ClientAPI.auth.user.email} (${CLAW_ClientAPI.auth.user.name})`;
                    document.getElementById("clawAccountLoggedOutChunk").style.display = `none`;
                    if (CLAW_ClientAPI.auth.user.additionalInfo.canvasAPIAvailable) {
                        document.getElementById("accountInfoCanvasAPIConnectionStatus").innerHTML = `Yes.`;
                        document.getElementById("canvasAPIStatusText").innerHTML = `READY FOR REQUESTS`;
                    } else {
                        document.getElementById("accountInfoCanvasAPIConnectionStatus").innerHTML = `No. Add an API key using the Canvas API login option.`;
                        document.getElementById("canvasAPIStatusText").innerHTML = `NO API KEY AVAILABLE`;
                    }
                } else {
                    document.getElementById("accountInfoLoggedInStatusText").innerHTML = `LOGGED OUT`;
                    document.getElementById("canvasAPIKeyInput").style.display = `none`;
                    document.getElementById("canvasAPISubmitButton").style.display = `none`;
                    document.getElementById("canvasAPIKeyInputHeader").style.display = `none`;
                    document.getElementById("accountInfoCanvasAPIConnectionStatus").innerHTML = `A CLAW account is required for Canvas integration.`;
                    document.getElementById("canvasAPIStatusText").innerHTML = `A CLAW account is required for Canvas integration.`;
                    document.getElementById("clawAccountSignedInChunk").style.display = `none`;
                }
            },
            tabController: {
                selectedTab: "account_info",
                selectTab: function(newSelectedTabID) {
                    document.getElementById(this.selectedTab).setAttribute("selected", "false");
                    document.getElementById(`${this.selectedTab}_view`).style.display = "none";
                    this.selectedTab = newSelectedTabID;
                    document.getElementById(newSelectedTabID).setAttribute("selected", "true");
                    document.getElementById(`${newSelectedTabID}_view`).style.display = "block";
                }
            }
        },
        checklist: {
            init: async function () {
                await CLAW_ClientAPI.auth.init(true);
                await this.pullDBData(this.updateChecklistsList);
            },
            pullDBData: function(callback) {
                return new Promise((resolve, reject) => {
                    let httpAPIRequest = new XMLHttpRequest();
                    httpAPIRequest.responseType = 'json';
                    httpAPIRequest.open('GET', `/api/service/checklist/pull_data/${CLAW_ClientAPI.auth.user.email}/${encodeURIComponent(CLAW_ClientAPI.auth.user.password)}`);
                    httpAPIRequest.onload = function (e) {
                        if (this.status == 200) {
                            if (this.response["resType"] == "error") {
                                alert(`ERROR: ${this.response["error"]}`);
                                window.open('/', '_self');
                            } else {
                                CLAW_ClientAPI.service.checklist.data = JSON.parse(this.response["data"]);
                                if (callback != null) {
                                    callback();
                                }
                                resolve(true);
                            }
                        }
                    };
                    httpAPIRequest.send();
                });
            },
            pushDBData: function(callback) {
                return new Promise((resolve, reject) => {
                    let httpAPIRequest = new XMLHttpRequest();
                    httpAPIRequest.responseType = 'json';
                    httpAPIRequest.open('GET', `/api/service/checklist/push_data/${CLAW_ClientAPI.auth.user.email}/${encodeURIComponent(CLAW_ClientAPI.auth.user.password)}/${encodeURIComponent(JSON.stringify(this.data))}`);
                    httpAPIRequest.onload = function (e) {
                        if (this.status == 200) {
                            if (this.response["resType"] == "error") {
                                alert(`ERROR: ${this.response["error"]}`);
                                window.open('/', '_self');
                            } else {
                                console.log("data pushed.");
                                resolve(true);
                                if (callback != null) {
                                    callback();
                                }
                            }
                        }
                    };
                    httpAPIRequest.send();
                });
            },
            updateChecklistsList: async function() {
                console.log(CLAW_ClientAPI.service.checklist.data);
                document.getElementById("menuOptionsContainer").innerHTML = "";
                for (let i = 0; i < Object.keys(CLAW_ClientAPI.service.checklist.data).length; i++) {
                    console.log(`Checklist found: "${CLAW_ClientAPI.service.checklist.data[i].title}"`);
                    document.getElementById("menuOptionsContainer").innerHTML += `<p class="checklistMenuOption" id="checklistOption_${i}" onclick="CLAW_ClientAPI.service.checklist.switchChecklists(${i})" selected="false">${CLAW_ClientAPI.service.checklist.data[i].title}</p>`;
                }
                document.getElementById("menuOptionsContainer").innerHTML += `<p class="checklistMenuOption" onclick="CLAW_ClientAPI.service.checklist.createNewChecklist()"><i>Add new checklist...</i></p>`;
                document.getElementById("menuOptionsContainer").innerHTML += `<p class="checklistMenuOption" onclick="window.open('/', '_self')"><i>Return to Dashboard</i></p>`;
            },
            createNewChecklist: async function() {
                CLAW_ClientAPI.service.checklist.data[Object.keys(CLAW_ClientAPI.service.checklist.data).length] = {title: "New checklist", content: {0: {content: "Add items now...", completed: "false"}}};
                let pushSuccess = await this.pushDBData();
                this.updateChecklistsList();
                this.switchChecklists(Object.keys(CLAW_ClientAPI.service.checklist.data).length - 1);
            },
            updateChecklistItems: function(checklistIndex) {
                console.log("updateChecklistItems called.");
                return new Promise((resolve, reject) => {
                    document.getElementById("editChecklistButton").innerHTML = "Edit Checklist";
                    document.getElementById("editChecklistButton").onclick = CLAW_ClientAPI.service.checklist.updateChecklistItemsEditMode;
                    document.getElementById("checklistViewerContainer").innerHTML = "";
                    for (let i = 0; i < Object.keys(CLAW_ClientAPI.service.checklist.data[checklistIndex].content).length; i++) {
                        console.log(`Checklist item found: "${CLAW_ClientAPI.service.checklist.data[checklistIndex].content[i].content}"`);
                        document.getElementById("checklistViewerContainer").innerHTML += `<span class="checklistItemContainer"><p class="checkListItemText" id="checkboxContainer_${i}" checked="${CLAW_ClientAPI.service.checklist.data[checklistIndex].content[i].completed}"><img id="checkboxButton_${i}" onclick="CLAW_ClientAPI.service.checklist.checkboxToggleFrom(${CLAW_ClientAPI.service.checklist.data[checklistIndex].content[i].completed}, ${i})" checked="${CLAW_ClientAPI.service.checklist.data[checklistIndex].content[i].completed}" class="checkButton" src="/static/graphics/check_icon.png"><span class="checklistItemTextContainer" id="checkboxText_${i}" checked="${CLAW_ClientAPI.service.checklist.data[checklistIndex].content[i].completed}">${CLAW_ClientAPI.service.checklist.data[checklistIndex].content[i].content}</span></p></span>`;
                    }
                    resolve(true);
                });
            },
            addChecklistItem: async function() {
                document.getElementById("addNewItemButton").disabled = true;
                for (let i = 0; i < Object.keys(CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content).length; i++) {
                    CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content[i].content = `${document.getElementById(`checklistItemEditBox_${i}`).value}`;
                }
                CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].title = `${document.getElementById("checklistTitleEditBox").value}`;
                CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content[Object.keys(CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content).length] = {content: "New item", completed: "false"};
                let pushSuccess = await this.pushDBData();
                await CLAW_ClientAPI.service.checklist.updateChecklistItemsEditMode();
            },
            deleteChecklistItem: async function(deleteIndex) {
                let checklistItemArray = [];
                for (let i = 0; i < Object.keys(CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content).length; i++) {
                    checklistItemArray.push(CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content[i]);
                }
                console.log(checklistItemArray);
                checklistItemArray.splice(deleteIndex, 1);
                console.log(checklistItemArray);
                this.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content = {};
                for (let i = 0; i < checklistItemArray.length; i++) {
                    this.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content[i] = checklistItemArray[i];
                }
                console.log(this.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content);
                let pushSuccess = await this.pushDBData();
                await CLAW_ClientAPI.service.checklist.updateChecklistItemsEditMode();
            },
            deleteChecklist: async function() {
                if (confirm(`Are you sure you want to delete the checklist "${CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].title}"? This is an irreversible action.`)) {
                    if (CLAW_ClientAPI.service.checklist.currentChecklistIndex == null) return;
                    let createNewChecklistAtZero;
                    if (Object.keys(CLAW_ClientAPI.service.checklist.data).length == 1) createNewChecklistAtZero = true;
                    let checklistArray = [];
                    for (let i = 0; i < Object.keys(CLAW_ClientAPI.service.checklist.data).length; i++) {
                        checklistArray.push(CLAW_ClientAPI.service.checklist.data[i]);
                    }
                    checklistArray.splice(CLAW_ClientAPI.service.checklist.currentChecklistIndex, 1);
                    this.data = {};
                    for (let i = 0; i < checklistArray.length; i++) {
                        this.data[i] = checklistArray[i];
                    }
                    if (createNewChecklistAtZero) {
                        CLAW_ClientAPI.service.checklist.data[Object.keys(CLAW_ClientAPI.service.checklist.data).length] = {title: "New checklist", content: {0: {content: "Add items now...", completed: "false"}}}
                    }
                    let pushSuccess = await this.pushDBData();
                    await this.updateChecklistsList();
                    if (CLAW_ClientAPI.service.checklist.currentChecklistIndex + 1 > Object.keys(CLAW_ClientAPI.service.checklist.data).length) {
                        CLAW_ClientAPI.service.checklist.currentChecklistIndex = Object.keys(CLAW_ClientAPI.service.checklist.data).length - 1;
                    }
                    await CLAW_ClientAPI.service.checklist.switchChecklists(CLAW_ClientAPI.service.checklist.currentChecklistIndex);
                } else {
                    await CLAW_ClientAPI.service.checklist.switchChecklists(CLAW_ClientAPI.service.checklist.currentChecklistIndex);
                }
            },
            updateChecklistItemsEditMode: async function() {
                document.getElementById("editChecklistButton").innerHTML = "Save Checklist";
                document.getElementById("editChecklistButton").onclick = CLAW_ClientAPI.service.checklist.saveFromEditMode;
                document.getElementById("checklistViewerContainer").innerHTML = "";
                document.getElementById("checklistTitleText").innerHTML = `<input type="text" id="checklistTitleEditBox" value='${CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].title.replaceAll('"', '\\"')}'><button class="checklistItemEditButton" onclick="CLAW_ClientAPI.service.checklist.addChecklistItem()" id="addNewItemButton">+</button>`;
                for (let i = 0; i < Object.keys(CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content).length; i++) {
                    console.log(`Checklist item found: "${CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content[i].content}"`);
                    document.getElementById("checklistViewerContainer").innerHTML += `<span><input type="text" id="checklistItemEditBox_${i}" value='${CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content[i].content}'><button class="checklistItemEditButton">&uarr;</button><button class="checklistItemEditButton">&darr;</button><button class="checklistItemEditButton" onclick="CLAW_ClientAPI.service.checklist.deleteChecklistItem(${i})">x</button></span>`;
                }
            },
            saveFromEditMode: async function() {
                for (let i = 0; i < Object.keys(CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content).length; i++) {
                    CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].content[i].content = `${document.getElementById(`checklistItemEditBox_${i}`).value}`;
                }
                CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].title = `${document.getElementById("checklistTitleEditBox").value}`;
                document.getElementById("checklistTitleText").innerHTML = CLAW_ClientAPI.service.checklist.data[CLAW_ClientAPI.service.checklist.currentChecklistIndex].title;
                let pushSuccess = await CLAW_ClientAPI.service.checklist.pushDBData();
                CLAW_ClientAPI.service.checklist.updateChecklistsList();
                CLAW_ClientAPI.service.checklist.switchChecklists(CLAW_ClientAPI.service.checklist.currentChecklistIndex);
            },
            switchChecklists: async function(newIndex) {
                if (CLAW_ClientAPI.service.checklist.currentChecklistIndex == null) CLAW_ClientAPI.service.checklist.currentChecklistIndex = Object.keys(CLAW_ClientAPI.service.checklist.data).length - 1;
                document.getElementById(`checklistOption_${this.currentChecklistIndex}`).setAttribute('selected', 'false');
                document.getElementById(`checklistOption_${newIndex}`).setAttribute('selected', 'true');
                document.getElementById("checklistTitleText").innerHTML = CLAW_ClientAPI.service.checklist.data[newIndex].title;
                this.currentChecklistIndex = newIndex;
                await CLAW_ClientAPI.service.checklist.pullDBData();
                await CLAW_ClientAPI.service.checklist.updateChecklistItems(newIndex);
            },
            checkboxToggleFrom: async function(currentState, checkboxID) {
                if (currentState == true || currentState == "true") {
                    document.getElementById(`checkboxContainer_${checkboxID}`).setAttribute('checked', 'false');
                    document.getElementById(`checkboxButton_${checkboxID}`).setAttribute('checked', 'false');
                    document.getElementById(`checkboxText_${checkboxID}`).setAttribute('checked', 'false');
                    CLAW_ClientAPI.service.checklist.data[this.currentChecklistIndex].content[checkboxID].completed = false;
                }
                if (currentState == false || currentState == "false") {
                    document.getElementById(`checkboxContainer_${checkboxID}`).setAttribute('checked', 'true');
                    document.getElementById(`checkboxButton_${checkboxID}`).setAttribute('checked', 'true');
                    document.getElementById(`checkboxText_${checkboxID}`).setAttribute('checked', 'true');
                    CLAW_ClientAPI.service.checklist.data[this.currentChecklistIndex].content[checkboxID].completed = true;
                }
                await this.updateChecklistItems(this.currentChecklistIndex);
                let pushSuccess = await this.pushDBData();
            },
            currentChecklistIndex: null,
            data: null
        }
    },
    auth: {
        init: async function (changeLoggedInText) {
            let savedAuthInfo;
            try {
                savedAuthInfo = JSON.parse(localStorage.getItem("auth_data"));
                console.log(savedAuthInfo);
            } catch (e) {
                console.log(e);
                this.loggedIn = false;
                if (changeLoggedInText) {
                    document.getElementById("loginStatusText").innerHTML = `<i>You are logged out</i>`;
                }
                return;
            }

            if (savedAuthInfo != null) {
                if (savedAuthInfo.email != null && savedAuthInfo.passwordHashed != null && savedAuthInfo.name != null) {
                    console.log(await CLAW_ClientAPI.auth.authorizeCredentials(savedAuthInfo.email, savedAuthInfo.passwordHashed));
                    if (!await CLAW_ClientAPI.auth.authorizeCredentials(savedAuthInfo.email, savedAuthInfo.passwordHashed)) {
                        this.loggedIn = false;
                        if (changeLoggedInText) {
                            document.getElementById("loginStatusText").innerHTML = `<i>You are logged out</i>`;
                        }
                        alert(`WARNING: You have credentials saved locally that do not match an account in the database. Try logging in again and if the problem persists, contact support.`);
                        return false;
                    }
                    this.user.email = savedAuthInfo.email;
                    this.user.password = savedAuthInfo.passwordHashed;
                    this.user.name = savedAuthInfo.name;
                    this.user.additionalInfo.canvasAPIAvailable = (savedAuthInfo.additionalInfo.canvasAPIAvailable == 'true');
                    this.loggedIn = true;
                    if (changeLoggedInText) {
                        document.getElementById("loginStatusText").innerHTML = `<i>${this.user.name}</i>`;
                    }
                } else {
                    this.loggedIn = false;
                    if (changeLoggedInText) {
                        document.getElementById("loginStatusText").innerHTML = `<i>You are logged out</i>`;
                    }
                }
            } else {
                this.loggedIn = false;
                if (changeLoggedInText) {
                    document.getElementById("loginStatusText").innerHTML = `<i>You are logged out</i>`;
                }
            }
        },
        loggedIn: false,
        user: {
            name: null,
            email: null,
            password: null,
            additionalInfo: {
                canvasAPIAvailable: false
            }
        },
        signUp: function(email, password, name) {
            if (this.loggedIn == true) {
                console.log(`You have tried to make another account while already logged in! Directly sending requests to the CLAW API is prohibited usage.`);
                return;
            }
            let httpAPIRequest = new XMLHttpRequest();
            httpAPIRequest.responseType = 'json';
            httpAPIRequest.open('GET', `/api/auth/signup/${email}/${password}/${name}`);
            httpAPIRequest.onload = function(e) {
                if (this.status == 200) {
                    if (this.response["resType"] == "error") {
                        alert(`ERROR: ${this.response["error"]}`);
                        location.reload();
                    } else {
                        localStorage.setItem("auth_data", JSON.stringify({
                            email: email,
                            passwordHashed: this.response["encryptedPassword"],
                            name: name,
                            additionalInfo: {
                                canvasAPIAvailable: false
                            }
                        }));

                        location.reload();
                    }
                }
            };
            httpAPIRequest.send();
        },
        signIn: function(email, password) {
            if (this.loggedIn == true) {
                console.log(`You have tried to sign in while already logged in to an account! Directly sending requests to the CLAW API is prohibited usage.`);
                return;
            }
            let httpAPIRequest = new XMLHttpRequest();
            httpAPIRequest.responseType = 'json';
            httpAPIRequest.open('GET', `/api/auth/signin/${email}/${password}`);
            httpAPIRequest.onload = function(e) {
                if (this.status == 200) {
                    if (this.response["resType"] == "error") {
                        alert(`ERROR: ${this.response["error"]}`);
                        location.reload();
                    } else {
                        localStorage.setItem("auth_data", JSON.stringify({
                            email: this.response["email"],
                            passwordHashed: this.response["encryptedPassword"],
                            name: this.response["name"],
                            additionalInfo: {
                                canvasAPIAvailable: (JSON.parse(this.response["info"]).canvasAPIKey !== "null")
                            }
                        }));

                        location.reload();
                    }
                }
            };
            httpAPIRequest.send();
        },
        authorizeCredentials: function(email, encryptedPassword) {
            return new Promise((resolve, reject) => {
                let httpAPIRequest = new XMLHttpRequest();
                httpAPIRequest.responseType = 'json';
                httpAPIRequest.open('GET', `/api/auth/authorize_creds/${email}/${encodeURIComponent(encryptedPassword)}`);
                httpAPIRequest.onload = function(e) {
                    if (this.status == 200) {
                        if (this.response["result"] == "false") {
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    }
                };
                httpAPIRequest.send();
            });
        },
        logOut: function () {
            if (confirm(`Are you sure you want to log out?`)) {
                localStorage.removeItem("auth_data")
                location.reload();
            }
        }
    }
}