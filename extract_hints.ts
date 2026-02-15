
import { readFile } from 'fs/promises';

async function main() {
    const content = await readFile('content/challenges/basic.json', 'utf-8');
    const data = JSON.parse(content);

    const allHints = new Set<string>();

    for (const challenge of data.challenges) {
        if (Array.isArray(challenge.hints)) {
            for (const hint of challenge.hints) {
                if (typeof hint === 'string') {
                    allHints.add(hint);
                }
            }
        }
    }

    console.log(JSON.stringify(Array.from(allHints), null, 2));
}

main();
