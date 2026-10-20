import fs from 'fs';
import path from 'path';

const baseDir = 'C:/Users/user/.gemini/antigravity/scratch/yongzhen-reading';
const embedHtml = fs.readFileSync(path.join(baseDir, 'google_sites_embed.html'), 'utf8');
const dataJs = fs.readFileSync(path.join(baseDir, 'assets/js/data.js'), 'utf8');

const target = '<script src="assets/js/data.js"></script>';
if (!embedHtml.includes(target)) {
  console.error('Target script tag not found in google_sites_embed.html!');
  process.exit(1);
}

const allInOne = embedHtml.replace(target, `<script>\n${dataJs}\n</script>`);
fs.writeFileSync(path.join(baseDir, 'google_sites_all_in_one.html'), allInOne, 'utf8');
console.log('Successfully generated google_sites_all_in_one.html, bytes:', allInOne.length);
