Step 1:
    npm install

Step 2:
    npm run build

mini-program (uniapp-test)
    Step 3:
        node tests/mock-server.js

    Step 4:
        edit tests/utils.js    
        change the testConfig.api_prefix to your local ip address.

    Step 5: (optional)
        edit node_modules/uvu/dist/index.mjs
        some mini programs do not have globalThis, so add the following two lines to the beginning of the line:
            const globalThis = this || {};
            const UVU_QUEUE = globalThis.UVU_QUEUE || [];

    Step 6:
        cd tests/uniapp-test
        Follow the link below to launch the mini program to the target platform first.
        https://en.uniapp.dcloud.io/quickstart-cli.html#run-and-release-uni-app

    Step 7:
        does not verify valid domain names, web-view (business domain names), TLS versions and HTTPS certificates.
