module.exports = async (artifacts) => {
    const W12Crowdsale = artifacts.require('W12Crowdsale');
    const W12CrowdsaleStub = artifacts.require('W12CrowdsaleStub');
    const Percent = artifacts.require('Percent');
    const W12CrowdsaleFactory = artifacts.require('W12CrowdsaleFactory');
    const W12FundFactory = artifacts.require('W12FundFactory');
    const W12Fund = artifacts.require('W12Fund');
    const WTokenStub = artifacts.require('WTokenStub');
    const WTokenTestHelper = artifacts.require('WTokenTestHelper');
    const VersionsLedger = artifacts.require("VersionsLedger");
    const TokenExchanger = artifacts.require('TokenExchanger');
    const W12ListerStub = artifacts.require('W12ListerStub');
    const WToken = artifacts.require('WToken');

    const PercentLib = await Percent.new();

    W12CrowdsaleStub.link(PercentLib.constructor.contractName, PercentLib.address);
    W12Crowdsale.link(PercentLib.constructor.contractName, PercentLib.address);
    W12CrowdsaleFactory.link(PercentLib.constructor.contractName, PercentLib.address);

    return {
        W12CrowdsaleStub,
        W12Crowdsale,
        W12CrowdsaleFactory,
        W12FundFactory,
        W12Fund,
        WTokenStub,
        WTokenTestHelper,
        VersionsLedger,
        TokenExchanger,
        W12ListerStub,
        WToken
    }
}
