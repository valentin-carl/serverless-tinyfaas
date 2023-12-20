"use strict";

class TinyFaaSPlugin {
    constructor() {
        console.log("hello from the tinyFaaS serverless plugin :-)");
        this.serverless = serverless;
        this.hooks = {
            "initialize": () => this.initialize(),
            "before:deploy:deploy": () => this.beforeDeploy(),
            "after:deploy:deploy": () => this.afterDeploy()
        };
    }

    // load the tinyfaas configuration from serverless.yml
    initialize() {
        console.log("initializing tinyFaaS plugin");
        // TODO check if it exists first
        this.tfconfig = this.serverless.configurationInput.custom.tinyfaas;
    }

    // deploy functions to tinyfaas nodes
    // zip and encode the to-be-deployed functions 
    // POST them to the tinyfaas nodes
    beforeDeploy() {
        console.log("trying to deploy functions to tinyFaaS nodes.");

        //
        // TODO this will not (yet) work!! has to be adapted to consider values in this.tfconfig
        //

        // input parameters for the rest of the program
        let tinyFaaSURL = "http://localhost:8080/upload";
        let functionName = "echo";
        let env = "nodejs";
        let threads = 1;

        // the tmp dir is used to dump data that isn't supposed to end up in git
        // constents from that directory can be safely deleted
        ensureTmpDirExists();

        // compress the function code into a zip
        createZip("./data", "out.zip", () => {

            // encode the zip in base64
            let functionBase64 = encode(tmpDir + "/out.zip");

            // send upload request
            let req = new XMLHttpRequest();
            req.open("POST", tinyFaaSURL);
            req.onreadystatechange = () => {
                console.log("ready state changed to " + req.readyState);
                if (req.readyState === XMLHttpRequest.DONE && req.status === 200) {
                    console.log("request sucessfull");
                }
            }
            let payload = JSON.stringify({
                "name": functionName,
                "env": env,
                "threads": threads,
                "zip": functionBase64
            });
            console.log(payload);
            req.send(payload);

            // remove the tmp directory after request has been sent
            clearTmp(true, true);
        });
    }

    // verify that all functions have been deployed to the correct nodes
    // curl /list for all nodes and compare to this.tfconfig
    afterDeploy() {
        // TODO
        // TODO check if function zip exists in tmp dir in case it's to be deployed to multiple tinyfaas instances
        // TODO rename out.zip for each function to [functionname].zip (and assume they're unique)
    }
}

module.exports = TinyFaaSPlugin;