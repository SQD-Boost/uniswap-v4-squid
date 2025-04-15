const fs = require("fs");
const path = require("path");

// Get the network name from command line arguments
const networkName = process.argv[2];

if (!networkName) {
  console.error(
    "Please provide a network name. Usage: npm run network:add <network-name>"
  );
  process.exit(1);
}

// Adjust paths to account for script being in the 'scripts' folder
const rootDir = path.join(__dirname, "..");
const sourcePath = path.join(rootDir, "src", "networks", "eth");
const destinationPath = path.join(rootDir, "src", "networks", networkName);

// Paths for constant.ts file
const constantSourcePath = path.join(
  rootDir,
  "config",
  networkName,
  "network.constant.ts"
);
const constantDestPath = path.join(
  destinationPath,
  "utils",
  "constants",
  "network.constant.ts"
);

function copyFolderRecursive(source, destination) {
  // Create destination folder if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Read source directory
  const files = fs.readdirSync(source);

  files.forEach((file) => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);

    if (fs.lstatSync(sourcePath).isDirectory()) {
      // Recursively copy subdirectories
      copyFolderRecursive(sourcePath, destPath);
    } else {
      // Copy file and modify content if needed
      let fileContent = fs.readFileSync(sourcePath, "utf8");

      // If the network is bnb, replace poolV3Uni with poolV3pcs in the file content
      if (networkName === "bnb") {
        fileContent = fileContent.replace(/poolV3Uni/g, "poolV3pcs");
      }

      fs.writeFileSync(destPath, fileContent);
    }
  });
}

function copyConstantFile() {
  // Ensure the destination directory exists
  const constantDestDir = path.dirname(constantDestPath);
  if (!fs.existsSync(constantDestDir)) {
    fs.mkdirSync(constantDestDir, { recursive: true });
  }

  // Copy the constant.ts file
  fs.copyFileSync(constantSourcePath, constantDestPath);
  console.log("Constant file copied successfully!");
}

try {
  // Check if source network folder exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source network folder not found at ${sourcePath}`);
    process.exit(1);
  }

  // Check if constant file exists
  if (!fs.existsSync(constantSourcePath)) {
    console.error(
      `Error: Configuration file not found at ${constantSourcePath}`
    );
    console.error(
      `Please create the configuration file before running this command.`
    );
    process.exit(1);
  }

  // Copy the network template folder
  copyFolderRecursive(sourcePath, destinationPath);
  console.log("Network folder copied successfully!");
  console.log(`Source: ${sourcePath}`);
  console.log(`Destination: ${destinationPath}`);

  // Copy the constant.ts file
  copyConstantFile();

  console.log(`\nNetwork ${networkName} added successfully!`);
} catch (err) {
  console.error("An error occurred while copying:", err);
  process.exit(1);
}
