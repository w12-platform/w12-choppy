// hacky runner for truffle exec environment
class Runner {
    constructor(moduleContext) {
        this.ctx = moduleContext;
    }

    generateHandler(fn) {
        const handler = function (done) {
            this.web3 = this.ctx.web3;
            this.crypto = require('crypto');
            this.bytes = require('utf8-bytes');
            this.BigNumber = this.web3.BigNumber;
            this.BigNumber.Zero = new this.BigNumber(0);
            this.BigNumber.UINT_MAX = (new this.BigNumber(2)).pow(256).minus(1);
            this.BigNumber.TEN = new this.BigNumber(10);

            global.web3 = this.web3;
            global.BigNumber = this.BigNumber;
            global.bytes = this.bytes;
            global.crypto = this.crypto;

            this.utils = require('./utils');

            global.utils = this.utils;

            fn.call(this, this)
                .then(done, e => { console.error(e); done(); });
        };

        return handler.bind(this);
    }
}

module.exports = Runner;
