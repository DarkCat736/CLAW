let CLAW_ClientAPI = {
    init: function() {
        this.auth.init(true);
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
            init: function() {
                if (CLAW_ClientAPI.auth.loggedIn) {
                    document.getElementById("accountInfoLoggedInStatusText").innerHTML = `${CLAW_ClientAPI.auth.email} (${CLAW_ClientAPI.auth.name})`;
                    document.getElementById("clawAccountLoggedOutChunk").style.display = `none`;
                    if (CLAW_ClientAPI.auth.canvasAPIAvailable) {
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
        }
    },
    auth: {
        init: function(changeLoggedInText) {
            if (localStorage.getItem("email") != null && localStorage.getItem("password") != null && localStorage.getItem("canvasAPIAvailable") != null && localStorage.getItem("name") != null) {
                this.email = localStorage.getItem("email");
                this.password = localStorage.getItem("password");
                this.name = localStorage.getItem("name");
                this.canvasAPIAvailable = (localStorage.getItem("canvasAPIAvailable") === 'true');
                this.loggedIn = true;
                if (changeLoggedInText) {
                    document.getElementById("loginStatusText").innerHTML = `<i>${this.name}</i>`;
                }
            } else {
                this.loggedIn = false;
                if (changeLoggedInText) {
                    document.getElementById("loginStatusText").innerHTML = `<i>You are logged out</i>`;
                }
            }
        },
        loggedIn: false,
        name: null,
        email: null,
        password: null,
        canvasAPIAvailable: false,
        signUp: function(email, password, name) {
            let httpAPIRequest = new XMLHttpRequest();
            httpAPIRequest.responseType = 'json';
            httpAPIRequest.open('GET', `/api/auth/signup/${email}/${password}/${name}`); // Replace with your JSON resource URL
            httpAPIRequest.onload = function(e) {
                if (this.status == 200) {
                    if (this.response["resType"] == "error") {
                        alert(`ERROR: ${this.response["error"]}`);
                        location.reload();
                    } else {
                        localStorage.setItem("email", email);
                        localStorage.setItem("password", this.response["encryptedPassword"]);
                        localStorage.setItem("name", name);
                        localStorage.setItem("canvasAPIAvailable", "false");
                        location.reload();
                    }
                }
            };
            httpAPIRequest.send();
        }
    }
}