import ArtifactSafe from '@safe-global/safe-contracts/build/artifacts/contracts/Safe.sol/Safe.json'
import ArtifactSafeProxy from '@safe-global/safe-contracts/build/artifacts/contracts/proxies/SafeProxy.sol/SafeProxy.json'
import ArtifactSafeProxyFactory from '@safe-global//safe-contracts/build/artifacts/contracts/proxies/SafeProxyFactory.sol/SafeProxyFactory.json'
import ArtifactMultiSend from '@safe-global//safe-contracts/build/artifacts/contracts/libraries/MultiSend.sol/MultiSend.json'
import ArtifactMultiSendCallOnly from '@safe-global//safe-contracts/build/artifacts/contracts/libraries/MultiSendCallOnly.sol/MultiSendCallOnly.json'
import ArtifactFallbackHandler from '@safe-global//safe-contracts/build/artifacts/contracts/handler/CompatibilityFallbackHandler.sol/CompatibilityFallbackHandler.json'
import ArtifactSignMessageLib from '@safe-global//safe-contracts/build/artifacts/contracts/libraries/SignMessageLib.sol/SignMessageLib.json'
import ArtifactCreateCall from '@safe-global//safe-contracts/build/artifacts/contracts/libraries/CreateCall.sol/CreateCall.json'
import ArtifactSimulateTxAccessor from '@safe-global//safe-contracts/build/artifacts/contracts/accessors/SimulateTxAccessor.sol/SimulateTxAccessor.json'
import ArtifactSafeRemoteKeystoreModule from '../artifacts/contracts/SafeRemoteKeystoreModule.sol/SafeRemoteKeystoreModule.json'

export {
    ArtifactSafe,
    ArtifactSafeProxy,
    ArtifactSafeProxyFactory,
    ArtifactMultiSend,
    ArtifactMultiSendCallOnly,
    ArtifactFallbackHandler,
    ArtifactSignMessageLib,
    ArtifactCreateCall,
    ArtifactSimulateTxAccessor,
    ArtifactSafeRemoteKeystoreModule
}