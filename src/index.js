"use strict";

class TinyFaaSPlugin {
    constructor() {
        console.log("hello from the tinyFaaS serverless plugin :-)");
        this.serverless = serverless;
        this.hooks = {
            "initialize": () => this.initialize(),
            "before:deploy:deploy": () => this.beforeDeploy(),
            "after:deploy:deploy": () => this.afterDeploy()
        }
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
        // TODO 
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