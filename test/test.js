"use strict";

const tf = require("serverless-tinyfaas");

if (require.main === module) {
    console.log(tf.helloworld);
}