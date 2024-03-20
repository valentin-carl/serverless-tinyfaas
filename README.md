# serverless-tinyfaas

The [serverless](https://serverless.com) project aims to simplify the development (among others) of serverless applications.
[TinyFaaS](https://github.com/OpenFogStack/tinyFaaS) is a serverless platform for edge environments. 
This plugin allows the serverless framework to be able to deploy function on tinyFaaS nodes.

## Deploying functions

Assuming the serverless framework is already installed, you just need to get this plugin via npm to get started.

```shell
npm i serverless-tinyfaas
```
Next, add your tinyFaaS functions and nodes to the `serverless.yml`. 
Here's an example configuration. 
This can be appended to an existing `serverless.yml` to combine the tinyFaaS functions with other providers.
Note that the provider and service fields have no meaning for tinyFaaS; they're just required for the serverless framework to not throw any errors while deploying.

```yaml
custom:
  tinyfaas:
    functions:
      - name: "fibonacci"
        env: "nodejs"
        threads: 1
        source: "./functions/fibonacci"
        deployTo:
          - name: "tinyFaaS-node-0"

    nodes:
      - name: "tinyFaaS-node-0"
        url: "http://localhost:8080"

plugins:
  - serverless-tinyfaas

provider:
  name: "aws"

service: "my-service"
```

Now, run the following command to deploy your functions to your tinyFaaS nodes.

```shell
serverless deploy
```

Note that a function can be deployed to multiple tinyFaaS nodes by adding more node-names to the `deployTo` list.

## Local development

To work on this plugin locally, (1) download the `src/index.js` file and (2) replace `serverless-tinyfaas` in the `serverless.yml` with the path to the `index.js` file.
