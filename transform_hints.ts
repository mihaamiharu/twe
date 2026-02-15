
import { readFile, writeFile } from 'fs/promises';

const translations: Record<string, string> = {
    "IDs always start with a hash symbol (#).": "ID selalu dimulai dengan simbol tagar (#).",
    "Classes always start with a dot (.).": "Class selalu dimulai dengan titik (.).",
    "There is no special symbol for tags.": "Tidak ada simbol khusus untuk tag.",
    "Just use the tag name itself (e.g., div, p, span).": "Gunakan nama tag itu sendiri (contoh: div, p, span).",
    "You can chain multiple classes together: .class1.class2": "Kamu bisa menggabungkan beberapa class: .class1.class2",
    "Order does not matter.": "Urutan tidak masalah.",
    "Use a space for descendant (any level deep).": "Gunakan spasi untuk keturunan (kedalaman berapapun).",
    "Use > for direct child (must be immediate).": "Gunakan > untuk anak langsung (harus bersebelahan).",
    "Use + for adjacent sibling (immediately following).": "Gunakan + untuk saudara kandung terdekat (persis setelahnya).",
    "Use ~ for general sibling (anywhere following).": "Gunakan ~ untuk saudara kandung umum (di mana saja setelahnya).",
    "Use [brackets] for attributes.": "Gunakan [kurung siku] untuk atribut.",
    "Exact match: [attr=\"value\"]": "Pencocokan tepat: [attr=\"value\"]",
    "Use ^= for 'starts with'.": "Gunakan ^= untuk 'dimulai dengan'.",
    "Use *= for 'contains'.": "Gunakan *= untuk 'mengandung'.",
    "Use $= for 'ends with'.": "Gunakan $= untuk 'diakhiri dengan'.",
    "Pseudo-classes start with a colon (:).": "Pseudo-class dimulai dengan titik dua (:).",
    "Examples: :first-child, :last-child, :nth-child(n)": "Contoh: :first-child, :last-child, :nth-child(n)",
    "Use :not() to exclude elements.": "Gunakan :not() untuk mengecualikan elemen.",
    "Example: input:not([type=\"hidden\"])": "Contoh: input:not([type=\"hidden\"])",
    "Always start with an absolute path if you know the root: /html/body...": "Selalu mulai dengan path absolut jika kamu tahu root-nya: /html/body...",
    "But prefer relative paths if possible: //tag": "Tapi lebih baik gunakan path relatif jika memungkinkan: //tag",
    "Use // for recursive search (descendant).": "Gunakan // untuk pencarian rekursif (keturunan).",
    "Use / for direct child.": "Gunakan / untuk anak langsung.",
    "Use @ for attributes.": "Gunakan @ untuk atribut.",
    "Structure: //tag[@attribute=\"value\"]": "Struktur: //tag[@attribute=\"value\"]",
    "Use contains() for partial text match.": "Gunakan contains() untuk pencocokan teks parsial.",
    "Structure: //tag[contains(text(), \"Search Query\")]": "Struktur: //tag[contains(text(), \"Search Query\")]",
    "Use text() for exact match.": "Gunakan text() untuk pencocokan tepat.",
    "Structure: //tag[text()=\"Exact Match\"]": "Struktur: //tag[text()=\"Exact Match\"]",
    "Go Up: /..": "Naik: /..",
    "Go Up: /parent::div": "Naik: /parent::div",
    "Go Up: /ancestor::div": "Naik: /ancestor::div",
    "Go Down: //input": "Turun: //input",
    "Use 'and' between attributes.": "Gunakan 'and' di antara atribut.",
    "Structure: //tag[@attr1=\"val1\" and contains(@attr2, \"val2\")]": "Struktur: //tag[@attr1=\"val1\" and contains(@attr2, \"val2\")]",
    "Use square brackets for indexing.": "Gunakan kurung siku untuk indeks.",
    "Function `last()` returns the last index.": "Fungsi `last()` mengembalikan indeks terakhir.",
    "Use parentheses: normalize-space()": "Gunakan tanda kurung: normalize-space()",
    "Equals string: =\"Value\"": "Sama dengan string: =\"Value\"",
    "Find row first: //tr[td[text()=\"Value\"]]": "Temukan baris dulu: //tr[td[text()=\"Value\"]]",
    "Append column index: /td[4]": "Tambahkan indeks kolom: /td[4]",
    "Find start node: //h3[text()=\"Product A\"]": "Temukan node awal: //h3[text()=\"Product A\"]",
    "Jump forward: /following::button[1]": "Lompat ke depan: /following::button[1]",
    "Find row first with multiple conditions.": "Temukan baris dulu dengan beberapa kondisi.",
    "Structure: //tr[condition1 and condition2]": "Struktur: //tr[kondisi1 and kondisi2]",
    "Then drill down: //button": "Lalu telusuri ke bawah: //button",
    "Use the hash symbol for IDs: #idName": "Gunakan simbol tagar untuk ID: #idName",
    "It's the shortest possible selector here.": "Ini adalah selector terpendek di sini.",
    "You need to check text visible to user.": "Kamu perlu memeriksa teks yang terlihat oleh pengguna.",
    "Use `.//text()` to check text in children too.": "Gunakan `.//text()` untuk memeriksa teks di anak elemen juga.",
    "Example: //div[contains(., \"Out of Stock\")]": "Contoh: //div[contains(., \"Out of Stock\")]",
    "Use the ID selector.": "Gunakan selector ID.",
    "It starts with a hash #.": "Dimulai dengan tagar #.",
    "Start with the data attribute selector: [data-product-id=\"...\"]": "Mulai dengan selector atribut data: [data-product-id=\"...\"]",
    "Combine with a class for the button: .remove": "Gabungkan dengan class untuk tombol: .remove"
};

async function main() {
    const filePath = 'content/challenges/basic.json';
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    let updatedCount = 0;

    for (const challenge of data.challenges) {
        if (Array.isArray(challenge.hints) && challenge.hints.length > 0 && typeof challenge.hints[0] === 'string') {
            const enHints = challenge.hints as string[];
            const idHints = enHints.map(h => translations[h] || h);

            challenge.hints = {
                en: enHints,
                id: idHints
            };
            updatedCount++;
        }
    }

    await writeFile(filePath, JSON.stringify(data, null, 4));
    console.log(`Updated ${updatedCount} challenges.`);
}

main();
