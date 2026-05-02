const path = require("path");
const fs = require("fs/promises");
const translate = require("@iamtraction/google-translate");

const defaultLang = "en";
const targetLang = process.argv[2] || "en";
let filePath = process.argv[3];

if (!filePath) {
  console.error("Please provide a file path.");
  process.exit(1);
}

// Resolve and normalize the path to prevent traversal
const safePath = (untrustedPath) => {
  const normalizedPath = path.normalize(untrustedPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const resolvedPath = path.resolve(process.cwd(), normalizedPath);
  if (!resolvedPath.startsWith(process.cwd())) {
    throw new Error("Invalid file path.");
  }
  return resolvedPath;
};

const validatedFilePath = safePath(filePath);
const targetLangIso = targetLang == "pt" ? "pt-pt" : targetLang;
const validatedTargetFilePath = validatedFilePath.replace(".md", "." + targetLangIso + ".md");

async function convert(text, from, to) {
  const options = { from, to };
  const translated_text = await translate(text, options);
  return translated_text.text;
}

console.log(filePath);
console.log(targetFilePath);

async function processFrontMatter(block) {
  const array = block.split("\n");
  let translatedBlock = "";
  for (const line of array) {
    let newElement = line;
    if (line.indexOf(":") > -1) {
      const elements = line.split(":");
      if (
        elements[0] == "title" ||
        elements[0] == "description" ||
        elements[0] == "summary" ||
        elements[0] == "description" ||
        elements[0] == "categories" ||
        elements[0] == "tags"
      ) {
        const translatedElement = elements[1]
          ? await convert(elements[1], defaultLang, targetLang)
          : elements[1];
        newElement = elements[0] + ": " + translatedElement;
      }
    }
    translatedBlock += newElement + "\n";
  }
  return translatedBlock;
}

async function main() {
  const fileContent = await fs.readFile(validatedFilePath, "utf8");

  const array = fileContent.split("---\n");
  const frontMatter = array[1];
  const content = array[2];

  const translatedFrontMatter = await processFrontMatter(frontMatter);
  const translatedContent = await convert(content, defaultLang, targetLang);

  const newFileContent =
    "---\n" + translatedFrontMatter + "---\n" + translatedContent;
  await fs.writeFile(validatedTargetFilePath, newFileContent, "utf8");
}

main();

