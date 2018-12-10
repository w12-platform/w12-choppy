module.exports = async (artifacts) => {
    // libs
    const Crowdsale = artifacts.require('Crowdsale');
    const FundAccount = artifacts.require('FundAccount');
    const PaymentMethods = artifacts.require('PaymentMethods');
    const Percent = artifacts.require('Percent');
    const PurchaseProcessing = artifacts.require('PurchaseProcessing');
    const Utils = artifacts.require('Utils');
    const Fund = artifacts.require('Fund');
    // contracts
    const W12Crowdsale = artifacts.require('W12Crowdsale');
    const W12CrowdsaleFactory = artifacts.require('W12CrowdsaleFactory');
    const W12FundFactory = artifacts.require('W12FundFactory');
    const W12Fund = artifacts.require('W12Fund');
    const W12Lister = artifacts.require('W12Lister');
    const Rates = artifacts.require('Rates');
    const WTokenTestHelper = artifacts.require('WTokenTestHelper');
    const Wallets = artifacts.require("Wallets");
    const VersionsLedger = artifacts.require("VersionsLedger");
    const TokenExchanger = artifacts.require('TokenExchanger');
    const WToken = artifacts.require('WToken');
    // stubs/mocks
    const UtilsMock = artifacts.require('UtilsMock');
    const W12CrowdsaleStub = artifacts.require('W12CrowdsaleStub');
    const W12FundStub = artifacts.require('W12FundStub');
    const W12ListerStub = artifacts.require('W12ListerStub');
    const WTokenStub = artifacts.require('WTokenStub');
    const PurchaseProcessingMock = artifacts.require('PurchaseProcessingMock');
    const PercentMock = artifacts.require('PercentMock');

    const UtilsLib = await Utils.new();

    Percent.link(UtilsLib.constructor.contractName, UtilsLib.address);
    Fund.link(UtilsLib.constructor.contractName, UtilsLib.address);
    PurchaseProcessing.link(UtilsLib.constructor.contractName, UtilsLib.address);

    const PercentLib = await Percent.new();
    const FundAccountLib = await FundAccount.new();
    const PaymentMethodsLib = await PaymentMethods.new();

    Crowdsale.link(PercentLib.constructor.contractName, PercentLib.address);
    PurchaseProcessing.link(PercentLib.constructor.contractName, PercentLib.address);
    Fund.link(PercentLib.constructor.contractName, PercentLib.address);

    Fund.link(FundAccountLib.constructor.contractName, FundAccountLib.address);

    const CrowdsaleLib = await Crowdsale.new();
    const FundLib = await Fund.new();
    const PurchaseProcessingLib = await PurchaseProcessing.new();

    // crowdsale, crowdsale stub, crowdsale factory
    W12CrowdsaleStub.link(PercentLib.constructor.contractName, PercentLib.address);
    W12CrowdsaleStub.link(PaymentMethodsLib.constructor.contractName, PaymentMethodsLib.address);
    W12CrowdsaleStub.link(PurchaseProcessingLib.constructor.contractName, PurchaseProcessingLib.address);
    W12CrowdsaleStub.link(CrowdsaleLib.constructor.contractName, CrowdsaleLib.address);
    W12Crowdsale.link(PercentLib.constructor.contractName, PercentLib.address);
    W12Crowdsale.link(PaymentMethodsLib.constructor.contractName, PaymentMethodsLib.address);
    W12Crowdsale.link(PurchaseProcessingLib.constructor.contractName, PurchaseProcessingLib.address);
    W12Crowdsale.link(CrowdsaleLib.constructor.contractName, CrowdsaleLib.address);
    W12CrowdsaleFactory.link(PercentLib.constructor.contractName, PercentLib.address);
    W12CrowdsaleFactory.link(PaymentMethodsLib.constructor.contractName, PaymentMethodsLib.address);
    W12CrowdsaleFactory.link(PurchaseProcessingLib.constructor.contractName, PurchaseProcessingLib.address);
    W12CrowdsaleFactory.link(CrowdsaleLib.constructor.contractName, CrowdsaleLib.address);

    // fund, fund factory
    W12Fund.link(UtilsLib.constructor.contractName, UtilsLib.address);
    W12Fund.link(PercentLib.constructor.contractName, PercentLib.address);
    W12Fund.link(FundAccountLib.constructor.contractName, FundAccountLib.address);
    W12Fund.link(FundLib.constructor.contractName, FundLib.address);
    W12FundStub.link(PercentLib.constructor.contractName, PercentLib.address);
    W12FundStub.link(FundAccountLib.constructor.contractName, FundAccountLib.address);
    W12FundStub.link(UtilsLib.constructor.contractName, UtilsLib.address);
    W12FundStub.link(FundLib.constructor.contractName, FundLib.address);
    W12FundFactory.link(UtilsLib.constructor.contractName, UtilsLib.address);
    W12FundFactory.link(PercentLib.constructor.contractName, PercentLib.address);
    W12FundFactory.link(FundAccountLib.constructor.contractName, FundAccountLib.address);
    W12FundFactory.link(FundLib.constructor.contractName, FundLib.address);

    // lister, lister stub
    W12Lister.link(PercentLib.constructor.contractName, PercentLib.address);
    W12ListerStub.link(PercentLib.constructor.contractName, PercentLib.address);

    return {
        W12CrowdsaleStub,
        W12Crowdsale,
        W12CrowdsaleFactory,
        W12FundFactory,
        W12Fund,
        Rates,
        WTokenStub,
        WTokenTestHelper,
        Wallets,
        VersionsLedger,
        TokenExchanger,
        W12ListerStub,
        WToken
    }
}
