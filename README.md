# [WIP]SmartCash-Auto-Vote

As [StmartCash](https://smartcash.cc/) recently [announced](https://smartcash.cc/announcing-improved-smartrewards-and-smartcash-supernodes/) there are plans to bind [SmartRewards](https://smartrewards.cc/) to SmartVoting and I don't have the time to Vote myself. I figured I could build a small script doing this for me.

I'm not exactly sure if this violates the terms of SmartCash, use at your own RISK!

Contributions are always welcome.

SMART Donations go to this address: Sef9PutNmEtCxwNeCGMgALDdDfiRnnYwMQ

ETH Donations to this: 0x99e818F8b821C9D60D8b32eC413E4EAD94b0Ae63

## Setup Steps

**IMPORTANT:** To use this script you need a SmartCash RPC-Interface where all addresses you want to vote with are imported. That way this script doesn't get in contact with your private keys.

1. Install [Nodejs](https://nodejs.org/)
2. Clone or Download this Repository
3. Run `npm install` inside the cloned directory
4. Create your own config-file (simply copy "example_config.js" to "config.js")
5. Update the config file
   - probaly change the `CLI_PATH` variable
   - add you `VOTE_ADDRESSES`
   - define if you want to see the chrome browser, or if it should be headless (`SHOW_CHROME`)