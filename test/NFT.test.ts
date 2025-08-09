import { ethers } from "hardhat";
import { ContractFactory, parseEther, parseUnits } from "ethers";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("NFT", function(){
    async function deploy() {
        const [owner, user] = await ethers.getSigners();
        const NFT = await ethers.getContractFactory("NFT");

        const contract = await NFT.deploy();
        contract.waitForDeployment();

        const cost = await contract.BASIC_COST();

        return {contract, owner, user, cost}
    }

    describe("mint", function (){
        it("should be minted", async function (){
            const {owner, contract, user, cost} = await deploy(); 
            
            await contract.connect(owner).mint( { value: cost } );
            await contract.connect(user).mint( { value: cost } );
            expect(await contract.ownerOf(0)).to.be.equal(owner.address);
            expect(await contract.ownerOf(1)).to.be.equal(user.address);
        });

        it("should be reverted", async function (){
            const {owner, contract, cost } = await deploy(); 
            const lowerAmount = cost / 10n;
            expect(
                contract.connect(owner).mint( { 
                    value: lowerAmount 
                })
            ).to.be.revertedWithCustomError(contract, "NotEnoughMoney");
        });
        
    })

    describe("changeBasicCost", function (){
        it("basic cost should be changed", async function (){
            const {owner, contract} = await deploy(); 
            const newCost = parseEther("1");
            
            await contract.connect(owner).changeBasicCost(newCost);
            const cost = await contract.BASIC_COST();
            expect(cost).to.be.equal(newCost);
        });   
    })

    async function userMint() {
        const {owner, contract, user, cost} = await deploy();

        await contract.connect(user).mint({ value: cost });
        return {owner, contract, user, cost}
    }

    describe("withdraw", function (){
        
        it("should be enough money on contract", async function (){
            const {contract, cost} = await userMint();
            const contractBalanceBefore = await ethers.provider.getBalance(contract.getAddress());

            expect(contractBalanceBefore).to.be.equal(cost);
        }); 

        it("should withdraw all ether to owner's wallet", async function (){
            const {owner, contract, user, cost} = await userMint(); 

            expect(
                contract.connect(owner).withdraw()
            ).changeEtherBalances(
                [contract, owner],
                [-cost, cost]
            );
        });
        
        it("should be reverted if called not by owner", async function (){
            const {contract, user} = await userMint(); 

            expect(
                contract.connect(user).withdraw()
            ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
        });   
    })

    describe("_baseURI", function (){
        it("should return base URI", async function (){
            const {owner, contract} = await userMint(); 
            
            const tokenURI = await contract.tokenURI(0);
            const baseURI = await contract.BASE_URI();

            expect(tokenURI).to.be.equal(baseURI);
        });  
    })
})