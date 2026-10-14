const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
for(const dir of ['src','scripts'])for(const file of fs.readdirSync(dir))if(/\.(?:c?js)$/.test(file))execFileSync(process.execPath,['--check',path.join(dir,file)],{stdio:'inherit'});
JSON.parse(fs.readFileSync('vercel.json','utf8'));console.log('Syntax and deployment configuration passed.');
