const fs = require("fs");
const path = require("path");

const fsPromises = fs.promises;

const getDirectoryInfo = async (dirPath) => {
  const normalizedDirPath = path.resolve(dirPath);
  const items = await fsPromises.readdir(normalizedDirPath, {
    withFileTypes: true,
  });
  const directoryInfo = {
    path: normalizedDirPath,
    fileCount: 0,
    folders: [],
  };
  const itemPromises = items.map(async (item) => {
    const fullPath = path.join(normalizedDirPath, item.name);
    const stats = await fsPromises.stat(fullPath);

    if (stats.isDirectory()) {
      directoryInfo.folders.push(fullPath);
    } else if (stats.isFile() && item.name != "info.json") {
      directoryInfo.fileCount += 1;
    }
  });
  await Promise.all(itemPromises);
  return directoryInfo;
};

const createJsonFile = (filePath, data) => {
  const normalizedFilePath = path.resolve(filePath);
  const jsonString = JSON.stringify(data);
  const dir = path.dirname(normalizedFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFile(normalizedFilePath, jsonString, (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("File has been created and saved.");
    }
  });
};

const writeAllDirectoriesInfoRecursive = async (rootDirPath) => {
  let directoryInfo;
  try {
    directoryInfo = await getDirectoryInfo(rootDirPath);
  } catch (err) {
    console.error("Error reading directory:", err);
    return;
  }
  const mappedDirectoryInfo = {
    path: directoryInfo.path,
    fileCount: directoryInfo.fileCount,
    folderCount: directoryInfo.folders.length,
  };
  const directoryInfoFileName = path.join(rootDirPath, "info.json");
  createJsonFile(directoryInfoFileName, mappedDirectoryInfo);
  if (directoryInfo.folders.length === 0) {
    return;
  }
  const folderPromises = directoryInfo.folders.map(
    async (folder) => await writeAllDirectoriesInfoRecursive(folder)
  );
  await Promise.all(folderPromises);
};

// Pass into this function path to the directory
writeAllDirectoriesInfoRecursive("DirectoryPath");

// On the mac there is redundant count for DS_store folder
