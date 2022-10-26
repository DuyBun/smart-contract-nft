import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { artifacts, ethers } from "hardhat";
import { ERC721ReceiverMock__factory } from "../typechain-types";
import { SushiToken, ERC721ReceiverMock } from "../typechain-types/contracts";

describe("==============SushiToken===============", function () {
  let contract: SushiToken;
  let receiverMock: ERC721ReceiverMock;
  const firstTokenId = 0;
  const secondTokenId = 1;
  const nonExistentTokenId = 158887;
  const fourthTokenId = 4;
  const baseURI = 'https://api.example.com/v1/';
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const RECEIVER_MAGIC_VALUE = '0x150b7a02';
  let owner: SignerWithAddress;
  let newOwner: SignerWithAddress;
  let approved: SignerWithAddress;
  let anotherApproved: SignerWithAddress;
  let operator: SignerWithAddress;
  let other: SignerWithAddress;
  let toWhom: SignerWithAddress;

  let Error: any;

  beforeEach(async () => {
    const SushiToken = await ethers.getContractFactory("SushiToken");
    contract = await SushiToken.deploy();

    const accounts = await ethers.getSigners();
    owner = accounts[0];
    newOwner = accounts[1];
    approved = accounts[2];
    anotherApproved = accounts[3];
    operator = accounts[4];
    other = accounts[5];
    toWhom = accounts[5];

    await contract.safeMint(owner.address);
    await contract.safeMint(owner.address);

    Error = [ 'None', 'RevertWithMessage', 'RevertWithoutMessage', 'Panic' ]
            .reduce((acc, entry, idx) => Object.assign({ [entry]: idx }, acc), {});
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });
  });
  context('with minted tokens', function () {
    describe('balanceOf', function () {
      context('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          expect(await contract.balanceOf(owner.address)).to.equal(2);
        });
      });
  
      context('when the given address does not own any tokens', function () {
        it('returns 1 for address 1', async function () {
          expect(await contract.balanceOf(toWhom.address)).to.equal(0);
        });
      });
  
      context('when querying the zero address', function () {
        it('throws', async function () {
          await expect(
            contract.balanceOf(ZERO_ADDRESS)
          ).to.be.revertedWith('ERC721: address zero is not a valid owner');
        });
      });
    });

    describe('ownerOf', function () {
      context('when the given token ID was tracked by this token', function () {
        const firstTokenId = 0;
        it('returns the owner of the given token ID 0', async function () {
          expect(await contract.ownerOf(firstTokenId)).to.be.equal(owner.address);
        });
      });

      context('when the given token ID was not tracked by this token', function () {
        const tokenId = nonExistentTokenId;

        it('reverts', async function () {
          await expect(
            contract.ownerOf(tokenId)
          ).to.be.revertedWith('ERC721: invalid token ID');
        });
      });
    });


    describe('transfers', function () {
      const tokenId = 0;
      const data = '0x42';

      let receipt: any = null;
      let ERC721ReceiverMock: ERC721ReceiverMock__factory;

      beforeEach(async function () {
        await contract.approve(approved.address, tokenId);
        await contract.setApprovalForAll(operator.address, true);

        ERC721ReceiverMock = await ethers.getContractFactory("ERC721ReceiverMock");
      });

      // function transferWasSuccessful(owner: string, tokenId: number, approved: string) {
      //   it('transfers the ownership of the given token ID to the given address', async function () {
      //     expect(await contract.ownerOf(tokenId)).to.be.equal(toWhom);
      //   });

      //   it('emits a Transfer event', async function () {
      //     await expect(
      //       receipt
      //     ).to.emit(contract, 'Transfer')
      //     .withArgs(owner, other, tokenId);
          
      //     //expectEvent(receipt, 'Transfer', { from: owner, to: other, tokenId: tokenId });
      //   });

      //   it('clears the approval for the token ID', async function () {
      //     expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
      //   });

      //   it('adjusts owners balances', async function () {
      //     expect(await contract.balanceOf(owner)).to.be.equal(1);
      //   });

      //   it('adjusts owners tokens by index', async function () {
      //     if (!contract.tokenOfOwnerByIndex) return;

      //     expect(await contract.tokenOfOwnerByIndex(other.address, 0)).to.be.equal(tokenId);

      //     expect(await contract.tokenOfOwnerByIndex(owner.address, 0)).to.be.not.equal(tokenId);
      //   });
      // };


      function shouldTransferTokensByUsers() {
        context('when called by the owner', function () {
          beforeEach(async function () {
            receipt = await contract.transferFrom(owner.address, other.address, tokenId);
          });

          it('transfers the ownership of the given token ID to the given address', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(toWhom.address);
          });
  
          it('emits a Transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, other.address, tokenId);
          });
  
          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });
  
          it('adjusts owners balances', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(1);
          });
  
          it('adjusts owners tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
  
            expect(await contract.tokenOfOwnerByIndex(other.address, 0)).to.be.equal(tokenId);
  
            expect(await contract.tokenOfOwnerByIndex(owner.address, 0)).to.be.not.equal(tokenId);
          });
        });

        context('when called by the approved individual', function () {
          beforeEach(async function () {
            receipt = await contract.connect(approved).transferFrom(owner.address, other.address, tokenId);
          });
          it('transfers the ownership of the given token ID to the given address', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(toWhom.address);
          });
  
          it('emits a Transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, other.address, tokenId);
          });
  
          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });
  
          it('adjusts owners balances', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(1);
          });
  
          it('adjusts owners tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
  
            expect(await contract.tokenOfOwnerByIndex(other.address, 0)).to.be.equal(tokenId);
  
            expect(await contract.tokenOfOwnerByIndex(owner.address, 0)).to.be.not.equal(tokenId);
          });
        });

        context('when called by the operator', function () {
          beforeEach(async function () {
            receipt = await contract.connect(operator).transferFrom(owner.address, other.address, tokenId);
          });
          it('transfers the ownership of the given token ID to the given address', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(toWhom.address);
          });
  
          it('emits a Transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, other.address, tokenId);
          });
  
          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });
  
          it('adjusts owners balances', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(1);
          });
  
          it('adjusts owners tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
  
            expect(await contract.tokenOfOwnerByIndex(other.address, 0)).to.be.equal(tokenId);
  
            expect(await contract.tokenOfOwnerByIndex(owner.address, 0)).to.be.not.equal(tokenId);
          });

        });

        context('when called by the owner without an approved user', function () {
          beforeEach(async function () {
            await contract.approve(ZERO_ADDRESS, tokenId);
            receipt = await contract.connect(operator).transferFrom(owner.address, other.address, tokenId);
          });
          it('transfers the ownership of the given token ID to the given address', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(toWhom.address);
          });
  
          it('emits a Transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, other.address, tokenId);
          });
  
          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });
  
          it('adjusts owners balances', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(1);
          });
  
          it('adjusts owners tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
  
            expect(await contract.tokenOfOwnerByIndex(other.address, 0)).to.be.equal(tokenId);
  
            expect(await contract.tokenOfOwnerByIndex(owner.address, 0)).to.be.not.equal(tokenId);
          });

        });

        context('when sent to the owner', function () {
          beforeEach(async function () {
            receipt = await contract.connect(owner).transferFrom(owner.address, owner.address, tokenId);
          });

          it('keeps ownership of the token', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(owner.address);
          });

          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });

          it('emits only a transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, owner.address, tokenId);
          });

          it('keeps the owner balance', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(2);
          });

          it('keeps same tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
            const tokensListed = await Promise.all(
              [0, 1].map(i => contract.tokenOfOwnerByIndex(owner.address, i)),
            );
            expect(tokensListed.map(t => t.toNumber())).to.have.members(
              [firstTokenId, secondTokenId],
            );
          });
        });

        context('when the address of the previous owner is incorrect', function () {
          it('reverts', async function () {
            await expect(
              contract.connect(owner).transferFrom(other.address, other.address, tokenId)
            ).to.be.revertedWith('ERC721: transfer from incorrect owner');
          });
        });

        context('when the sender is not authorized for the token id', function () {
          it('reverts', async function () {
            await expect(
              contract.connect(other).transferFrom(owner.address, other.address, tokenId)
            ).to.be.reverted;
          });
        });

        context('when the given token ID does not exist', function () {
          it('reverts', async function () {
            await expect(
              contract.transferFrom(owner.address, other.address, nonExistentTokenId)
            ).to.be.revertedWith('ERC721: invalid token ID');
          });
        });

        context('when the address to transfer the token to is the zero address', function () {
          it('reverts', async function () {
            await expect(
              contract.transferFrom(owner.address, ZERO_ADDRESS, tokenId)
            ).to.be.revertedWith('ERC721: transfer to the zero address');
          });
        });
      };

      describe('via transferFrom', function () {
        shouldTransferTokensByUsers();
      });



      function shouldSafeTransferTokensByUsers(data: any) {
        context('when called by the owner', function () {
          beforeEach(async function () {
            if(data !== null) {
              receipt = await contract['safeTransferFrom(address,address,uint256,bytes)'](owner.address, toWhom.address, tokenId, data)
            } else {
              receipt = await contract['safeTransferFrom(address,address,uint256)'](owner.address, toWhom.address, tokenId);
            }
          });

          it('transfers the ownership of the given token ID to the given address', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(toWhom.address);
          });
  
          it('emits a Transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, other.address, tokenId);
          });
  
          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });
  
          it('adjusts owners balances', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(1);
          });
  
          it('adjusts owners tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
  
            expect(await contract.tokenOfOwnerByIndex(other.address, 0)).to.be.equal(tokenId);
  
            expect(await contract.tokenOfOwnerByIndex(owner.address, 0)).to.be.not.equal(tokenId);
          });
        });

        context('when called by the approved individual', function () {
          beforeEach(async function () {
            if(data !== null) {
              receipt = await contract.connect(approved)['safeTransferFrom(address,address,uint256,bytes)'](owner.address, toWhom.address, tokenId, data)
            } else {
              receipt = await contract.connect(approved)['safeTransferFrom(address,address,uint256)'](owner.address, toWhom.address, tokenId);
            }
          });
          it('transfers the ownership of the given token ID to the given address', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(toWhom.address);
          });
  
          it('emits a Transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, other.address, tokenId);
          });
  
          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });
  
          it('adjusts owners balances', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(1);
          });
  
          it('adjusts owners tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
  
            expect(await contract.tokenOfOwnerByIndex(other.address, 0)).to.be.equal(tokenId);
  
            expect(await contract.tokenOfOwnerByIndex(owner.address, 0)).to.be.not.equal(tokenId);
          });
        });

        context('when called by the operator', function () {
          beforeEach(async function () {
            if(data !== null) {
              receipt = await contract.connect(operator)['safeTransferFrom(address,address,uint256,bytes)'](owner.address, toWhom.address, tokenId, data)
            } else {
              receipt = await contract.connect(operator)['safeTransferFrom(address,address,uint256)'](owner.address, toWhom.address, tokenId);
            }
          });
          it('transfers the ownership of the given token ID to the given address', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(toWhom.address);
          });
  
          it('emits a Transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, other.address, tokenId);
          });
  
          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });
  
          it('adjusts owners balances', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(1);
          });
  
          it('adjusts owners tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
  
            expect(await contract.tokenOfOwnerByIndex(other.address, 0)).to.be.equal(tokenId);
  
            expect(await contract.tokenOfOwnerByIndex(owner.address, 0)).to.be.not.equal(tokenId);
          });

        });

        context('when called by the owner without an approved user', function () {
          beforeEach(async function () {
            await contract.approve(ZERO_ADDRESS, tokenId);
            if(data !== null) {
              receipt = await contract.connect(operator)['safeTransferFrom(address,address,uint256,bytes)'](owner.address, toWhom.address, tokenId, data)
            } else {
              receipt = await contract.connect(operator)['safeTransferFrom(address,address,uint256)'](owner.address, toWhom.address, tokenId);
            }
          });
          it('transfers the ownership of the given token ID to the given address', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(toWhom.address);
          });
  
          it('emits a Transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, other.address, tokenId);
          });
  
          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });
  
          it('adjusts owners balances', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(1);
          });
  
          it('adjusts owners tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
  
            expect(await contract.tokenOfOwnerByIndex(other.address, 0)).to.be.equal(tokenId);
  
            expect(await contract.tokenOfOwnerByIndex(owner.address, 0)).to.be.not.equal(tokenId);
          });

        });

        context('when sent to the owner', function () {
          beforeEach(async function () {
            if(data !== null) {
              receipt = await contract.connect(owner)['safeTransferFrom(address,address,uint256,bytes)'](owner.address, owner.address, tokenId, data)
            } else {
              receipt = await contract.connect(owner)['safeTransferFrom(address,address,uint256)'](owner.address, owner.address, tokenId);
            }
          });

          it('keeps ownership of the token', async function () {
            expect(await contract.ownerOf(tokenId)).to.be.equal(owner.address);
          });

          it('clears the approval for the token ID', async function () {
            expect(await contract.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
          });

          it('emits only a transfer event', async function () {
            await expect(
              receipt
            ).to.emit(contract, 'Transfer')
            .withArgs(owner.address, owner.address, tokenId);
          });

          it('keeps the owner balance', async function () {
            expect(await contract.balanceOf(owner.address)).to.be.equal(2);
          });

          it('keeps same tokens by index', async function () {
            if (!contract.tokenOfOwnerByIndex) return;
            const tokensListed = await Promise.all(
              [0, 1].map(i => contract.tokenOfOwnerByIndex(owner.address, i)),
            );
            expect(tokensListed.map(t => t.toNumber())).to.have.members(
              [firstTokenId, secondTokenId],
            );
          });
        });

        context('when the address of the previous owner is incorrect', function () {
          it('reverts', async function () {
            let abc: any;
            if(data !== null) {
              abc = contract.connect(owner)['safeTransferFrom(address,address,uint256,bytes)'](other.address, other.address, tokenId, data)
            } else {
              abc = contract.connect(owner)['safeTransferFrom(address,address,uint256)'](other.address, other.address, tokenId);
            }
            await expect(
              abc
            ).to.be.revertedWith('ERC721: transfer from incorrect owner');
          });
        });

        context('when the sender is not authorized for the token id', function () {
          it('reverts', async function () {
            let abc: any;
            if(data !== null) {
              abc = contract.connect(other)['safeTransferFrom(address,address,uint256,bytes)'](owner.address, other.address, tokenId, data)
            } else {
              abc = contract.connect(other)['safeTransferFrom(address,address,uint256)'](owner.address, other.address, tokenId);
            }
            await expect(
              abc
            ).to.be.reverted;
          });
        });

        context('when the given token ID does not exist', function () {
          it('reverts', async function () {
            let abc: any;
            if(data !== null) {
              abc = contract.connect(owner)['safeTransferFrom(address,address,uint256,bytes)'](owner.address, other.address, nonExistentTokenId, data)
            } else {
              abc = contract.connect(owner)['safeTransferFrom(address,address,uint256)'](owner.address, other.address, nonExistentTokenId);
            }
            await expect(
              abc
            ).to.be.revertedWith('ERC721: invalid token ID');
          });
        });

        context('when the address to transfer the token to is the zero address', function () {
          it('reverts', async function () {
            let abc: any;
            if(data !== null) {
              abc = contract['safeTransferFrom(address,address,uint256,bytes)'](owner.address, ZERO_ADDRESS, tokenId, data)
            } else {
              abc = contract['safeTransferFrom(address,address,uint256)'](owner.address, ZERO_ADDRESS, tokenId);
            }
            await expect(
              abc
            ).to.be.revertedWith('ERC721: transfer to the zero address');
          });
        });
      };


      describe('via safeTransferFrom', function () {
        const shouldTransferSafely = function (data: any) {
          describe('to a user account', function () {
            shouldSafeTransferTokensByUsers(data);
          });

          describe('to a valid receiver contract', function () {
            beforeEach(async function () {
              this.receiver = await ERC721ReceiverMock.deploy(RECEIVER_MAGIC_VALUE, Error.None);
              toWhom = this.receiver;
            });

            shouldSafeTransferTokensByUsers(data);

            // it('calls onERC721Received', async function () {
            //   const receipt = await transferFun.call(this, owner, this.receiver.address, tokenId, { from: owner });

            //   await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
            //     operator: owner,
            //     from: owner,
            //     tokenId: tokenId,
            //     data: data,
            //   });
            // });

            // it('calls onERC721Received from approved', async function () {
            //   const receipt = await transferFun.call(this, owner, this.receiver.address, tokenId, { from: approved });

            //   await expectEvent.inTransaction(receipt.tx, ERC721ReceiverMock, 'Received', {
            //     operator: approved,
            //     from: owner,
            //     tokenId: tokenId,
            //     data: data,
            //   });
            // });

            describe('with an invalid token id', function () {
              it('reverts', async function () {
                let abc: any;
                if(data !== null) {
                  abc = contract.connect(owner)['safeTransferFrom(address,address,uint256,bytes)'](owner.address, this.receiver.address, nonExistentTokenId, data)
                } else {
                  abc = contract.connect(owner)['safeTransferFrom(address,address,uint256)'](owner.address, this.receiver.address, nonExistentTokenId);
                }
                await expect(
                  abc
                ).to.be.revertedWith('ERC721: invalid token ID');
              });
            });
          });
        };

        describe('with data', function () {
          shouldTransferSafely(data);
        });

        describe('without data', function () {
          shouldTransferSafely(null);
        });

        describe('to a receiver contract returning unexpected value', function () {
          it('reverts', async function () {
            const invalidReceiver = await ERC721ReceiverMock.deploy('0x42', Error.None);
            await expect(
              contract['safeTransferFrom(address,address,uint256)'](owner.address, invalidReceiver.address, tokenId)
            ).to.be.revertedWith('ERC721: transfer to non ERC721Receiver implementer');
          });
        });

        describe('to a receiver contract that reverts with message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.deploy(RECEIVER_MAGIC_VALUE, Error.RevertWithMessage);
            await expect(
              contract['safeTransferFrom(address,address,uint256)'](owner.address, revertingReceiver.address, tokenId)
            ).to.be.revertedWith('ERC721ReceiverMock: reverting');
          });
        });

        describe('to a receiver contract that reverts without message', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.deploy(RECEIVER_MAGIC_VALUE, Error.RevertWithoutMessage);
            await expect(
              contract['safeTransferFrom(address,address,uint256)'](owner.address, revertingReceiver.address, tokenId)
            ).to.be.revertedWith('ERC721: transfer to non ERC721Receiver implementer');
          });
        });

        describe('to a receiver contract that panics', function () {
          it('reverts', async function () {
            const revertingReceiver = await ERC721ReceiverMock.deploy(RECEIVER_MAGIC_VALUE, Error.Panic);
            await expect(
              contract['safeTransferFrom(address,address,uint256)'](owner.address, revertingReceiver.address, tokenId)
            ).to.be.reverted;
          });
        });

        describe('to a contract that does not implement the required function', function () {
          it('reverts', async function () {
            const nonReceiver = this.token;
            await expect(
              contract['safeTransferFrom(address,address,uint256)'](owner.address, nonReceiver.address, tokenId)
            ).to.be.revertedWith('ERC721: transfer to non ERC721Receiver implementer');
          });
        });
      });
    });





  

  });
});
