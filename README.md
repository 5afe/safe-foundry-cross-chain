# Safe x Scroll: l1sload module demonstration 

This project demonstrates a basic use-case where a safe on a Layer2 (`safeL2`) inherits its configuration/security policy (`owners` and `threshold`) from a Safe on a Layer1 (`safeL1`) via a Safe module `SafeKeystoreModule` enabled on `SafeL2`.
It leverages a precompiled contract called `l1sload` to load a storage slot on the L1 chain



## Getting started

```shell
yarn install
npx hardhat compile
REPORT_GAS=true npx hardhat test
```

## TODO
- [ ] Include `l1sload` when ready
- [ ] Support EIP-712 signature