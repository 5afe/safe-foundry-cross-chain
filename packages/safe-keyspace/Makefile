.PHONY: all

install:
	yarn install

set_var:
	npx hardhat vars set $(var)

config:
	$(MAKE) var=INFURA_API_KEY set_var
	$(MAKE) var=SEPOLIA_DEPLOYER_KEY set_var
	$(MAKE) var=BASE_SEPOLIA_DEPLOYER_KEY set_var
	$(MAKE) var=SEPOLIA_DEPLOYER_KEY set_var
	$(MAKE) var=BASE_SEPOLIA_DEPLOYER_KEY set_var
	$(MAKE) var=COINMARKETCAP_APIKEY set_var

compile: install
	npx hardhat compile --config hardhat.config.lite.ts

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