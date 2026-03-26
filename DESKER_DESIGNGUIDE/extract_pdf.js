const fs = require('fs');
const { PDFParse, VerbosityLevel } = require('pdf-parse');

async function extractPDF(filePath, label) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const parser = new PDFParse({ data: dataBuffer, verbosity: VerbosityLevel.ERRORS });
    await parser.load();
    const result = await parser.getText();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`FILE: ${label}`);
    console.log(`${'='.repeat(60)}`);
    if (typeof result === 'string') {
      console.log(result);
    } else if (Array.isArray(result)) {
      result.forEach((page, i) => {
        console.log(`\n--- Page ${i+1} ---`);
        console.log(typeof page === 'string' ? page : JSON.stringify(page, null, 2));
      });
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (e) {
    console.error(`Error parsing ${label}:`, e.message);
  }
}

(async () => {
  await extractPDF('COLOR - DESKER - FURSYSGROUP DESIGN SYSTEM_1.pdf', 'COLOR GUIDE');
  await extractPDF('LOGO - DESKER - FURSYSGROUP DESIGN SYSTEM_1.pdf', 'LOGO GUIDE');
})();
