const semint = require('@redtea/semint');
const link_libs = require('./artifacts');
const version = '0.28.0';

module.exports = async (artifacts) => {
    const W12CrowdsaleFactory = artifacts.W12CrowdsaleFactory;
    const W12FundFactory = artifacts.W12FundFactory;
    const Rates = artifacts.Rates;
    const WTokenStub = artifacts.WTokenStub;
    const WTokenTestHelper = artifacts.WTokenTestHelper;
    const Wallets = artifacts.Wallets;
    const VersionsLedger = artifacts.VersionsLedger;
    const TokenExchanger = artifacts.TokenExchanger;
    const W12ListerStub = artifacts.W12ListerStub;


    const VersionsLedgerContract = await VersionsLedger.new();
    const WalletsContract = await Wallets.new();
    const WTokenStubContract = await WTokenStub.new('TestToken1', 'TT1', 18);
    const WTokenTestHelperContract = await WTokenTestHelper.new();
    const RatesContract = await Rates.new();

    const W12FundFactoryContract = await W12FundFactory.new(semint.encode(version, 4), RatesContract.address);
    const W12CrowdsaleFactoryContract = await W12CrowdsaleFactory.new(semint.encode(version, 4), W12FundFactoryContract.address, RatesContract.address);
    const TokenExchangerContract = await TokenExchanger.new(semint.encode(version, 4));
    const W12ListerStubContract = await W12ListerStub.new(
        semint.encode(version, 4),
        WalletsContract.address,
        W12CrowdsaleFactoryContract.address,
        TokenExchangerContract.address
    );

    await TokenExchangerContract.transferPrimary(W12ListerStubContract.address);
    await VersionsLedgerContract.setVersion(W12ListerStubContract.address, semint.encode(version, 4));

    return {
        VersionsLedgerContract,
        WalletsContract,
        WTokenStubContract,
        WTokenTestHelperContract,
        RatesContract,
        W12FundFactoryContract,
        W12CrowdsaleFactoryContract,
        TokenExchangerContract,
        W12ListerStubContract
    };
}
