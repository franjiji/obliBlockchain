// Adelanta el reloj de la cadena local (para probar el devengado sin esperar).
//   PowerShell:  $env:SEGUNDOS=3600; npx hardhat run scripts/advance-time.js --network localhost
//   bash:        SEGUNDOS=3600 npx hardhat run scripts/advance-time.js --network localhost
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();
const seconds = Number(process.env.SEGUNDOS ?? 3600);

await ethers.provider.send("evm_increaseTime", [seconds]);
await ethers.provider.send("evm_mine", []);

const block = await ethers.provider.getBlock("latest");
console.log(`Adelantado ${seconds} s. Hora de la cadena: ${new Date(block.timestamp * 1000).toLocaleString("es-UY")}`);
