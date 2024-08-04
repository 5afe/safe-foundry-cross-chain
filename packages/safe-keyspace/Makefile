.PHONY: all

install:
	yarn install

set_var:
	@(echo  "===> Configure Hardhat variable $(var) (desc: $(desc)) ===")
	npx hardhat vars set $(var)

config:
	$(MAKE) var=INFURA_API_KEY desc="Your Infura API Key" set_var
	$(MAKE) var=SEPOLIA_DEPLOYER_KEY desc="Your Sepolia private key to deploy contract" set_var
	$(MAKE) var=BASE_SEPOLIA_DEPLOYER_KEY desc="Your Base Sepolia private key to deploy contract" set_var
	$(MAKE) var=OP_SEPOLIA_DEPLOYER_KEY desc="Your Base Sepolia private key to deploy contract" set_var
	$(MAKE) var=SEPOLIA_DEPLSEPOLIA_ETHERSCAN_API_KEYYER_KEY desc="Your Sepolia Etherscan API Key" set_var
	$(MAKE) var=BASE_SEPOLIA_ETHERSCAN_API_KEY desc="Your Base Sepolia Etherscan API Key" set_var
	$(MAKE) var=OP_SEPOLIA_ETHERSCAN_API_KEY desc="Your Base Sepolia Etherscan API Key" set_var
	$(MAKE) var=COINMARKETCAP_APIKEY desc="Your CoinMarketCap API Key (to retrieve ETH-USD rate)"  set_var

compile: install
	npx hardhat compile 

test: compile
	npx hardhat test

clean:
	npx hardhat clean

node:
	npx hardhat node

ui/install:
	npm install --prefix ./frontend

ui/dev: ui/install
	npm run dev --prefix ./frontend