import type { ethers } from "ethers";
import type { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import "hardhat/types/runtime";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    ethers: typeof ethers & HardhatEthersHelpers;
  }
}
