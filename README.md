# Uniswap V4 squid

This [squid](https://docs.subsquid.io/sdk/overview/) indexer tracks events emitted by Uniswap V4 smart contracts. It provides a comprehensive view of the Uniswap V4 ecosystem, including pools, positions, tokens, and various metrics. The squid is configured to support multiple chains, currently including Ethereum, Unichain and Base.

## Quickstart

**Dependencies: Node.js, Git, Docker.**

Here are the commands to run the squid:


```bash
# Prerequisite - Install Squid CLI:
npm i -g @subsquid/cli

# 1. Clone the repository
git clone https://github.com/SQD-Boost/uniswapV4-squid
cd uniswapv4-squid

# 2. Install dependencies
npm ci

# 3. Generate entities class and types
sqd codegen
sqd typegen

# 4. Start a Postgres database container
sqd up

# 5. Generate database migrations
sqd migration:generate

# 6. Run the squid
# For a specific chain:
sqd process:{CHAIN_TAG}  # e.g., sqd process:eth or sqd process:base

# For all configured chains:
sqd run .

# 7. (in a separate terminal) Start the GraphQL server (only needed for single-chain mode)
sqd serve
```

GraphiQL playground will be available at [localhost:{GQL_PORT}/graphql](http://localhost:{GQL_PORT}/graphql) once the database and the GraphQL server are started.

## Adding a New Network

To add support for a new network to the squid, follow these steps:

1. **Configure Network Constants**

   - Create a new file `./config/{CHAIN_TAG}/network.constant.ts`:

     ```bash
     mkdir -p ./config/{CHAIN_TAG}
     touch ./config/{CHAIN_TAG}/network.constant.ts
     ```

   - Add the new network configuration with required parameters in the created file

2. **Generate Indexer Files**

   ```bash
   npm network:add {CHAIN_TAG}
   ```

3. **Update Networks List**

   - Open `./scripts/genfiles`
   - Add the new chain tag to the networks array

4. **Generate Files**

   ```bash
   npm run gen
   ```

5. **Prefetch Token States**

   ```bash
   sqd get-tokens:{CHAIN_TAG}
   ```

6. **Run the Squid**
   - For the new chain only:
     ```bash
     sqd process:{CHAIN_TAG}
     ```
   - For all chains including the new one:
     ```bash
     sqd run .
     ```

## About this squid

### Permission Control System

The squid implements a permission control system through the `permissionReccordTx` configuration, which allows fine-grained control over which types of transactions are recorded in the database. This system offers several benefits:

1. **Performance Optimization**

   - Reduces database load by selectively recording only necessary transactions
   - Improves indexing speed by skipping non-essential data

2. **Customizable Data Collection**

   - Control recording of specific transaction types:
     - `modifyLiquidity`: Liquidity modification events
     - `swap`: Token swap events
     - `donate`: Donation events
     - `poolhourdata`: Hourly pool statistics
     - `pooldaydata`: Daily pool statistics
     - `tokenhourdata`: Hourly token statistics
     - `tokendaydata`: Daily token statistics

### Block Intervals

The squid also implements configurable block intervals for certain operations:

```typescript
export const block_intervals = {
  poolsTvlUSD: 10, // Update TVL every 10 blocks
  coreTotalUSD: 15, // Update core totals every 15 blocks
};
```

This configuration helps optimize performance by controlling how frequently certain calculations are performed, reducing the computational load.

### Token State Caching

The squid implements an efficient token state caching mechanism through the `tokensRetriever` tool. This system provides several key benefits:

1. **Persistent Token Data**

   - Token information (address, name, symbol, decimals) is stored in a JSON file
   - Data is persisted between indexing runs
   - Eliminates the need to re-fetch token data on each reindexing

2. **RPC Call Optimization**

   - Reduces the number of RPC calls to the blockchain
   - Only fetches token data for new tokens
   - Caches token metadata to avoid repeated lookups

3. **Performance Benefits**
   - Significantly faster reindexing times
   - Reduced network load
   - Lower RPC endpoint usage

The token state is stored in `./assets/{CHAIN_TAG}/tokens.json` and is automatically managed by the squid. This caching mechanism is particularly important for networks with a large number of tokens, as it prevents unnecessary RPC calls during reindexing operations.
