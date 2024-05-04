# Safe x Scroll: l1sload module demonstration 

This project demonstrates a basic use-case where a safe on a Layer2 (`safeL2`) inherits its configuration/security policy (`owners` and `threshold`) from a Safe on a Layer1 (`safeL1`) via a Safe module `SafeKeystoreModule` enabled on `SafeL2`.
It leverages a precompiled contract called `l1sload` to load a storage slot on the L1 chain (see [L1SLOAD spec](https://scrollzkp.notion.site/L1SLOAD-spec-a12ae185503946da9e660869345ef7dc))

![](docs/flow.png)


## Getting started

```shell
yarn install
npx hardhat compile
npx hardhat test
npx hardhat coverage
```

## TODO
- [X] Add test with ERC20
- [ ] Include `l1sload` when ready
- [ ] Support EIP-712 signature