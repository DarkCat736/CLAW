let CLAW_ClientAPI = {
    init: function() {
        //
    },
    checkServiceAvailability: function(servicesToCheck, setElementActive) {
        servicesToCheck.forEach((service) => {
            var httpAPIRequest = new XMLHttpRequest();
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
    }
}