
import fs from 'fs';
import path from 'path';

const files = ['basic.json', 'beginner.json', 'intermediate.json', 'expert.json'];
const challengesDir = path.join(process.cwd(), 'content/challenges');

files.forEach(file => {
    const filePath = path.join(challengesDir, file);
    if (!fs.existsSync(filePath)) return;

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        JSON.parse(content);
        console.log(`✅ ${file} is valid JSON`);
    } catch (e: any) {
        console.error(`❌ ${file} has syntax error: ${e.message}`);
        if (e.message.includes('at position')) {
            const pos = parseInt(e.message.match(/position (\d+)/)[1]);
            const content = fs.readFileSync(filePath, 'utf-8');
            const before = content.substring(Math.max(0, pos - 50), pos);
            const after = content.substring(pos, Math.min(content.length, pos + 50));
            console.error(`Context:\n${before} --->> ${after}`);
        }
    }
});
