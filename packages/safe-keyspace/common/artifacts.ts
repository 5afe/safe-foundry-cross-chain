import ArtifactSafe from '@safe-global/safe-contracts/build/artifacts/contracts/Safe.sol/Safe.json'
import ArtifactSafeProxy from '@safe-global/safe-contracts/build/artifacts/contracts/proxies/SafeProxy.sol/SafeProxy.json'
import ArtifactSafeProxyFactory from '@safe-global//safe-contracts/build/artifacts/contracts/proxies/SafeProxyFactory.sol/SafeProxyFactory.json'
import ArtifactMultiSend from '@safe-global//safe-contracts/build/artifacts/contracts/libraries/MultiSend.sol/MultiSend.json'
import ArtifactMultiSendCallOnly from '@safe-global//safe-contracts/build/artifacts/contracts/libraries/MultiSendCallOnly.sol/MultiSendCallOnly.json'
import ArtifactFallbackHandler from '@safe-global//safe-contracts/build/artifacts/contracts/handler/CompatibilityFallbackHandler.sol/CompatibilityFallbackHandler.json'
import ArtifactSignMessageLib from '@safe-global//safe-contracts/build/artifacts/contracts/libraries/SignMessageLib.sol/SignMessageLib.json'
import ArtifactCreateCall from '@safe-global//safe-contracts/build/artifacts/contracts/libraries/CreateCall.sol/CreateCall.json'
import ArtifactSimulateTxAccessor from '@safe-global//safe-contracts/build/artifacts/contracts/accessors/SimulateTxAccessor.sol/SimulateTxAccessor.json'

import { ISafe$Type } from "../artifacts/contracts/interfaces/ISafe.sol/ISafe";
import ISafe from "../artifacts/contracts/interfaces/ISafe.sol/ISafe.json";

import { SafeKeySpaceModule$Type } from "../artifacts/contracts/SafeKeySpaceModule.sol/SafeKeySpaceModule";
import SafeKeySpaceModule from "../artifacts/contracts/SafeKeySpaceModule.sol/SafeKeySpaceModule.json";

import { SafeKeySpaceModuleSetup$Type } from '../artifacts/contracts/SafeKeySpaceModuleSetup.sol/SafeKeySpaceModuleSetup'
import SafeKeySpaceModuleSetup from '../artifacts/contracts/SafeKeySpaceModuleSetup.sol/SafeKeySpaceModuleSetup.json'

import { MockedKeystore$Type } from "../artifacts/contracts/test/MockedKeystore.sol/MockedKeystore";
import MockedKeystore from "../artifacts/contracts/test/MockedKeystore.sol/MockedKeystore.json";

import { TestToken$Type } from '../artifacts/contracts/test/TestToken.sol/TestToken'
import TestToken from "../artifacts/contracts/test/TestToken.sol/TestToken.json";

export {
    ArtifactSafe,
    ArtifactSafeProxy,
    ArtifactSafeProxyFactory,
    ArtifactMultiSend,
    ArtifactMultiSendCallOnly,
    ArtifactFallbackHandler,
    ArtifactSignMessageLib,
    ArtifactCreateCall,
    ArtifactSimulateTxAccessor
}

export const ABI = {
    ISafeABI: <ISafe$Type["abi"]>ISafe.abi,
    SafeKeySpaceModuleSetupABI: <SafeKeySpaceModuleSetup$Type["abi"]>SafeKeySpaceModuleSetup.abi,
    SafeKeySpaceModuleABI: <SafeKeySpaceModule$Type["abi"]>SafeKeySpaceModule.abi,
    MockedKeystoreABI: <MockedKeystore$Type["abi"]>MockedKeystore.abi,
    TestTokenABI: <TestToken$Type["abi"]>TestToken.abi
}