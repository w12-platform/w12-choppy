const semint = require('@redtea/semint');
const link_libs = require('./artifacts');
const version = '0.23.2';

module.exports = async (artifacts, service) => {
    const W12CrowdsaleFactory = artifacts.W12CrowdsaleFactory;
    const W12FundFactory = artifacts.W12FundFactory;
    const WTokenStub = artifacts.WTokenStub;
    const WTokenTestHelper = artifacts.WTokenTestHelper;
    const VersionsLedger = artifacts.VersionsLedger;
    const TokenExchanger = artifacts.TokenExchanger;
    const W12ListerStub = artifacts.W12ListerStub;
    const W12Crowdsale = artifacts.W12Crowdsale;

    const VersionsLedgerContract = await VersionsLedger.new();
    const WTokenStubContract = await WTokenStub.new('TestToken1', 'TT1', 18);
    const WTokenTestHelperContract = await WTokenTestHelper.new();

    const W12FundFactoryContract = await W12FundFactory.new(semint.encode(version, 4));
    const W12CrowdsaleFactoryContract = await W12CrowdsaleFactory.new(semint.encode(version, 4), W12FundFactoryContract.address);
    const TokenExchangerContract = await TokenExchanger.new(semint.encode(version, 4));
    const W12ListerStubContract = await W12ListerStub.new(
        semint.encode(version, 4),
        W12CrowdsaleFactoryContract.address,
        TokenExchangerContract.address
    );

    await TokenExchangerContract.transferOwnership(W12ListerStubContract.address);
    await VersionsLedgerContract.setVersion(W12ListerStubContract.address, semint.encode(version, 4));

    return {
        VersionsLedgerContract,
        WTokenStubContract,
        WTokenTestHelperContract,
        W12FundFactoryContract,
        W12CrowdsaleFactoryContract,
        TokenExchangerContract,
        W12ListerStubContract,
        W12Crowdsale
    };
}
