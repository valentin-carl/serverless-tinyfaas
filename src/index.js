"use strict";

// imports
const fs = require("fs");
const archiver = require("archiver");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// constants
const tmpDir = process.cwd() + "/tmp";

// check if the tmp directory exists
// if it doesn't, create it
const ensureTmpDirExists = () => {
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
        console.log("created tmp");
    } else {
        console.log("tmp dir already exists");
    }
}

// removes the tmp directory
const clearTmp = (recursive, force) => {
    console.log("removing tmp dir ...")
    fs.rmSync(tmpDir, { recursive: recursive, force: force });
}

// creates a zip file from a given directory
const createZip = (dir, targetName, callback) => {

    // create zip file to compress function into
    // also see: https://www.archiverjs.com/docs/quickstart
    let output = fs.createWriteStream("./tmp/" + targetName);
    let archive = archiver("zip", { zlib: { level: 9 } });

    // listen for all archive data to be written
    output.on("close", function() {
        console.log(archive.pointer() + " total bytes");
        // used to send the code to tinyFaaS once the zip is done
        callback();
    });

    // pipe the archive's stream to the output stream <==> write the zip archive to a file
    archive.pipe(output);

    // add files to the zip
    // FIXME this doesn't support sub-folders (I think)
    //  for now: assume the functions aren't that complex
    let contents = fs.readdirSync(dir, { withFileTypes: true });
    // apple :-)
    contents.filter(f => f.name !== ".DS_Store").forEach(f => {
        console.log(f, f.path + "/" + f.name); 
        if (f.isDirectory()) {
            console.log("ignoring subdirectory for now");
        } else {
            console.log("is file");
            archive.append(fs.createReadStream(f.path + "/" + f.name), { name: f.name });
        }
    });

    // signal that no more data will be written to the file
    // is non-blocking => the file is likely not closed directly after this is executed
    // => tried using the promise returned by archive.finalize() to invoke callback but didn't work
    archive.finalize().then(() => {
        console.log("finalized done")
    }).catch(() => {
        console.log("finalizing archive unsuccessful")
    })
}

// returns a file encoded in base64
const encode = (file) => {
    console.log(`trying to encode ${file}`);
    let data = fs.readFileSync(file);
    return data.toString("base64");
}

class TinyFaaSPlugin {
    constructor(serverless) {
        console.log("hello from the tinyFaaS serverless plugin :-)");
        this.serverless = serverless;
        this.hooks = {
            "initialize": () => this.initialize(),
            "before:deploy:deploy": () => this.beforeDeploy(),
            "after:deploy:deploy": () => this.afterDeploy()
        };
    }

    // load the tinyfaas configuration from serverless.yml
    // TODO it might (definitely is!) be a good idea to check first whether that even exists
    initialize() {
        console.log("initializing tinyFaaS plugin");
        this.tfconfig = this.serverless.configurationInput.custom.tinyfaas;
    }

    // before serverless deploys any functions to lambda etc., we deploy to tinyFaaS
    beforeDeploy() {

        console.log("trying to deploy functions to tinyFaaS nodes.");

        // the tmp directory is used to store the zips of function to be deployed to the tinyFaaS instances
        ensureTmpDirExists();

        // deploy all tinyFaaS function to their specified nodes
        this.tfconfig.functions.forEach(f => {
            console.log(`attempting to deploy ${f.name} to ${f.deployTo}`);
            createZip(f.source, `${f.name}.zip`, () => {
                let encoding = encode(`${tmpDir}/${f.name}.zip`);
                // send upload requests
                f.deployTo.forEach(node => {
                    let req = new XMLHttpRequest();
                    req.open("POST", `${this.getTinyFaaSURL(node.name)}/upload`);
                    req.onreadystatechange = () => {
                        if (req.readyState === XMLHttpRequest.DONE && req.status === 200) {
                            console.log(`successfully deployed ${f.name} to ${node.name}`);
                        } else if (req.onreadystatechange === XMLHttpRequest.DONE && req.status !== 200) {
                            console.log(`error while trying to deploy ${f.name} to ${node.name}`);
                            throw new Error(`could not deploy ${f.name} to ${node.name}, ${req.responseText}`);
                        }
                    };
                    let payload = JSON.stringify({
                        "name": f.name,
                        "env": f.env,
                        "threads": f.threads,
                        "zip": encoding
                    });
                    console.log(`request payload: ${payload}`);
                    req.send(payload);
                });
            });
        });
    }

    // For now, afterDeploy only removes the tmp directory
    // In the future, this would be a great place to verify that all functions have been
    // successfully deployed to their tinyFaaS nodes, for example by sending requests to .../list
    // and checking whether the correct function names show up
    afterDeploy() {
        console.log("afterDeploy() called")
        // once the deployment is done, we don't need this directory anymore
        clearTmp(true, true);
    }

    // Helper function to get the correct URL for a tinyFaaS node
    getTinyFaaSURL(name) {
        let node = this.tfconfig.nodes.filter(n => n.name === name);
        if (node.length === 0) {
            throw new Error(`no such node: "${name}"`);
        } else {
            console.log(`found url ${node[0].url} for node ${name}`);
            return node[0].url;
        }
    }
}

module.exports = TinyFaaSPlugin;