"use strict";

//
// TODO modify so functions can be accessed in index.js
//

// imports
const fs = require("fs");
const archiver = require("archiver");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// constants
const tmpDir = __dirname + "/../tmp";

// check if the tmp directory exists
// if it doesn't, create it
const ensureTmpDirExists = () => {
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
        console.log("created tmp");
    } else {
        console.log("tmp dir already exsits");
    }
}

// removes the tmp directory
const clearTmp = (recursive, force) => {
    fs.rmSync(tmpDir, { recursive: recursive, force: force });
}

// creates a zip file from a given directory
const createZip = (dir, targetName, callback) => {

    // TODO verify that this relative path works, it will probably need to be adapted
    let output = fs.createWriteStream("./tmp/" + targetName);
    let archive = archiver("zip", { zlib: { level: 9 } });

    // also see: https://www.archiverjs.com/docs/quickstart

    // listen for all archive data to be written
    output.on("close", function() {
        console.log(archive.pointer() + " total bytes");
        // this will be used to send the code to tinyFaaS once the zip is done
        callback();
    });

    // pipe the archive's stream to the output stream
    // <==> write the zip archive to a file
    archive.pipe(output);

    // add files to the zip
    // FIXME this doesnt support subfolders!! (I think)
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
    archive.finalize();
}

// returns a file encoded in base64
const encode = (file) => {
    let data = fs.readFileSync(file);
    return data.toString("base64");
}

// TODO input: config for single deployment, then calls like in main of demo version
// todos from indexjs beforeDeploy still apply
const deploy = () => {
    // TODO
}