import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { createFrequencyProcessor, parseLine } from './src/logic/calculator';

const threshold = 0; // Set your threshold value
const { processSample, frequencyList, pulseWidthList } = createFrequencyProcessor(threshold);

const filePath = process.argv[2];
const frequencyColumn = process.argv[3] ? parseInt(process.argv[3]) : 1
if (!filePath) {
    console.error('Usage: npm run analyze <filename> <frequencyColumn>');
    process.exit(1);
}

const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
});

rl.on('line', (line: string) => {
    const sample = parseLine(line, frequencyColumn)
    processSample(sample);
});

rl.on('close', () => {
    // Prepare output filename
    const outFile = path.format({
        dir: path.dirname(filePath),
        name: path.parse(filePath).name + `-analyzed-${new Date().toISOString()}`,
        ext: '.csv'
    });

    // Write CSV header
    const header = 'time,frequency,pulseWidthPercent\n';
    const rows: string[] = [];

    // Write rows
    for (let i = 0; i < frequencyList.length; i++) {
        const time = frequencyList[i].time;
        const freq = frequencyList[i].value;
        const pulseWidth = pulseWidthList[i]?.value ?? '';
        rows.push(`${time},${freq},${pulseWidth}`);
    }

    fs.writeFileSync(outFile, header + rows.join('\n'));
    console.log(`CSV written to ${outFile}`);
});