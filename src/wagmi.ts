import { createConfig, http } from "wagmi";
import { avalancheFuji, hardhat } from "viem/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [avalancheFuji, hardhat],
  connectors: [injected()],
  transports: {
    [avalancheFuji.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});
