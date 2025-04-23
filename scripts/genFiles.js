const fs = require("fs");
const yaml = require("js-yaml");

const networks = ["eth", "base","uni"];

// GENERATE THE SQUID FILE FOR MULTICHAIN during the command sqd run .

function generateSquidYaml(networks) {
  const config = {
    manifestVersion: "subsquid.io/v0.1",
    name: "farm-squid",
    version: 1,
    description: "Marcopoloo",
    build: {},
    deploy: {
      addons: {
        postgres: {},
      },
      processor: networks.map((network) => ({
        name: `${network}-processor`,
        cmd: ["sqd", `process:prod:${network}`],
      })),
      api: {
        cmd: ["sqd", "serve:prod"],
      },
    },
  };

  return yaml.dump(config);
}

const yamlContent = generateSquidYaml(networks);

fs.writeFileSync("squid.yaml", yamlContent, "utf8");
console.log("squid.yaml has been generated successfully.");

// GENERATE THE COMMANDS FILE NEDEED for THE SQUID FILE command sqd run .

function generateSquidJson(networks) {
  const baseCommands = {
    $schema: "https://cdn.subsquid.io/schemas/commands.json",
    commands: {
      clean: {
        description: "delete all build artifacts",
        cmd: ["npx", "--yes", "rimraf", "lib"],
      },
      build: {
        description: "Build the squid project",
        deps: ["clean"],
        cmd: ["tsc"],
      },
      up: {
        description: "Start a PG database",
        cmd: ["docker", "compose", "up", "-d"],
      },
      down: {
        description: "Drop a PG database",
        cmd: ["docker", "compose", "down"],
      },
      "migration:apply": {
        description: "Apply the DB migrations",
        cmd: ["squid-typeorm-migration", "apply"],
      },
      "migration:generate": {
        description: "Generate a DB migration matching the TypeORM entities",
        deps: ["build", "migration:clean"],
        cmd: ["squid-typeorm-migration", "generate"],
      },
      "migration:clean": {
        description: "Clean the migrations folder",
        cmd: ["npx", "--yes", "rimraf", "./db/migrations"],
      },
      migration: {
        deps: ["build"],
        cmd: ["squid-typeorm-migration", "generate"],
        hidden: true,
      },
      codegen: {
        description: "Generate TypeORM entities from the schema file",
        cmd: ["squid-typeorm-codegen"],
      },
      typegen: {
        description:
          "Generate data access classes for an ABI file(s) in the ./abi folder",
        cmd: [
          "squid-evm-typegen",
          "./src/abi",
          { glob: "./abi/*.json" },
          "--multicall",
        ],
      },
      serve: {
        description: "Start the GraphQL API server",
        cmd: ["squid-graphql-server"],
      },
      "serve:prod": {
        description: "Start the GraphQL API server with caching and limits",
        cmd: [
          "squid-graphql-server",
          "--dumb-cache",
          "in-memory",
          "--dumb-cache-ttl",
          "1000",
          "--dumb-cache-size",
          "100",
          "--dumb-cache-max-age",
          "1000",
        ],
      },
      "check-updates": {
        cmd: [
          "npx",
          "--yes",
          "npm-check-updates",
          "--filter=/subsquid/",
          "--upgrade",
        ],
        hidden: true,
      },
      bump: {
        description: "Bump @subsquid packages to the latest versions",
        deps: ["check-updates"],
        cmd: ["npm", "i", "-f"],
      },
      open: {
        description: "Open a local browser window",
        cmd: ["npx", "--yes", "opener"],
      },
    },
  };

  networks.forEach((network) => {
    baseCommands.commands[`get-tokens:${network}`] = {
      description: `Updates assets/pools.json with the most recent list of pools for ${network}`,
      deps: ["build"],
      cmd: [
        "node",
        "--require=dotenv/config",
        `lib/networks/${network}/tools/tokensRetriever.js`,
      ],
    };
    baseCommands.commands[`process:${network}`] = {
      description: `Load .env and start the squid processor for ${network}`,
      deps: ["build", "migration:apply"],
      cmd: [
        "node",
        "--require=dotenv/config",
        `lib/networks/${network}/main.js`,
      ],
    };
    baseCommands.commands[`process:prod:${network}`] = {
      description: `Start the squid processor for ${network}`,
      deps: ["migration:apply"],
      cmd: ["node", `lib/networks/${network}/main.js`],
      hidden: true,
    };
  });

  return JSON.stringify(baseCommands, null, 2);
}

const jsonContent = generateSquidJson(networks);

fs.writeFileSync("commands.json", jsonContent, "utf8");
console.log("commands.json has been generated successfully.");
