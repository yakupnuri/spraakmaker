const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../public/data/lessen-verhalen.json');

function validate() {
  console.log('Starting validation on:', FILE_PATH);
  
  if (!fs.existsSync(FILE_PATH)) {
    console.error('ERROR: file does not exist!');
    process.exit(1);
  }

  const content = fs.readFileSync(FILE_PATH, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.error('ERROR: Invalid JSON format!', e.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('ERROR: Root must be a JSON array.');
    process.exit(1);
  }

  console.log(`Loaded ${data.length} stories. Validating structure...`);

  let errorsCount = 0;

  data.forEach((story, idx) => {
    const logPrefix = `[Story ${story.lesId || idx + 1}]`;
    
    // 1. Required fields
    const reqFields = ['lesId', 'niveau', 'thema', 'themaTitel', 'hoofdstuk', 'hoofdstukNummer', 'verhaalTitel', 'verhaal', 'highlights', 'woordenschat', 'oefeningen'];
    reqFields.forEach(f => {
      if (story[f] === undefined) {
        console.error(`${logPrefix} ERROR: Missing field '${f}'`);
        errorsCount++;
      }
    });

    if (story.oefeningen) {
      const exTypes = ['vulIn', 'zinBouwen', 'vertaalNlTr', 'vertaalTrNl', 'begrip'];
      exTypes.forEach(t => {
        if (!Array.isArray(story.oefeningen[t])) {
          console.error(`${logPrefix} ERROR: Exercises type '${t}' is not an array.`);
          errorsCount++;
        }
      });

      // 2. Validate zinBouwen punctuation match
      if (Array.isArray(story.oefeningen.zinBouwen)) {
        story.oefeningen.zinBouwen.forEach((zb, zbIdx) => {
          if (!zb.woorden || !zb.antwoord) {
            console.error(`${logPrefix} zinBouwen[${zbIdx}] ERROR: Missing 'woorden' or 'antwoord'`);
            errorsCount++;
            return;
          }
          
          // Check punctuation match: antwoord end vs words end
          const antPunct = zb.antwoord.match(/[.,!?;:]+$/);
          const wordsWithPunct = zb.woorden.filter(w => /[.,!?;:]+$/.test(w));

          if (antPunct && wordsWithPunct.length === 0) {
            console.error(`${logPrefix} zinBouwen[${zbIdx}] WARNING: Punctuation '${antPunct[0]}' exists in antwoord but not in words array.`);
            errorsCount++;
          }
          
          // Verify that all words in antwoord are present in the words array
          const cleanWords = zb.woorden.map(w => w.toLowerCase().replace(/[.,!?;:]+$/, ''));
          const cleanAntWords = zb.antwoord.toLowerCase().replace(/[.,!?;:]+$/, '').split(/\s+/);

          cleanAntWords.forEach(w => {
            if (!cleanWords.includes(w)) {
              console.error(`${logPrefix} zinBouwen[${zbIdx}] WARNING: Word '${w}' from antwoord is missing in available words list.`);
              errorsCount++;
            }
          });
        });
      }

      // 3. Validate begrip index
      if (Array.isArray(story.oefeningen.begrip)) {
        story.oefeningen.begrip.forEach((bg, bgIdx) => {
          if (bg.antwoord === undefined || !Array.isArray(bg.opties)) {
            console.error(`${logPrefix} begrip[${bgIdx}] ERROR: Missing options or answer.`);
            errorsCount++;
            return;
          }
          if (bg.antwoord < 0 || bg.antwoord >= bg.opties.length) {
            console.error(`${logPrefix} begrip[${bgIdx}] ERROR: Answer index ${bg.antwoord} is out of bounds for options length ${bg.opties.length}.`);
            errorsCount++;
          }
        });
      }

      // 4. Validate vulIn hint & blank space
      if (Array.isArray(story.oefeningen.vulIn)) {
        story.oefeningen.vulIn.forEach((vi, viIdx) => {
          if (!vi.zin || !vi.antwoord) {
            console.error(`${logPrefix} vulIn[${viIdx}] ERROR: Missing 'zin' or 'antwoord'`);
            errorsCount++;
            return;
          }
          if (!vi.zin.includes('___')) {
            console.error(`${logPrefix} vulIn[${viIdx}] WARNING: Sentence does not contain blank space '___'`);
            errorsCount++;
          }
        });
      }
    }
  });

  if (errorsCount > 0) {
    console.error(`\nValidation FAILED with ${errorsCount} errors/warnings.`);
    process.exit(1);
  } else {
    console.log('\nValidation PASSED successfully! All stories are correct.');
  }
}

validate();
