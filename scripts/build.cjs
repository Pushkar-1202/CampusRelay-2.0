const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),src=path.join(root,'src'),out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
const read=name=>fs.readFileSync(path.join(src,name),'utf8');
const js=['engine.js','seed.js','landing.js','app.js','workspace.js','reliability.js'];
const css=['styles.css','enhancements.css','landing.css','workspace-motion.css','cinematic.css','workspace-premium.css','accessibility.css'];
const core=esbuild.transformSync(js.map(read).join('\n;\n'),{loader:'js',minify:true,target:'es2020'}).code;
const motion=esbuild.transformSync(read('cinematic.js'),{loader:'js',minify:true,target:'es2020'}).code;
const styles=esbuild.transformSync(css.map(read).join('\n'),{loader:'css',minify:true,target:'es2020'}).code;
const crypto=require('node:crypto'),hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,10);
// Fixed filenames with content query strings keep exports simple and avoid stale caches.
fs.writeFileSync(path.join(out,'app.min.js'),core);fs.writeFileSync(path.join(out,'motion.min.js'),motion);fs.writeFileSync(path.join(out,'app.min.css'),styles);
let html=read('index.html').replace(/<link rel="stylesheet"[^>]+>/g,'').replace(/<script src="[^"]+"><\/script>/g,'');
html=html.replace('</head>',`<link rel="stylesheet" href="app.min.css?v=${hash(styles)}"></head>`).replace('</body>',`<script defer src="app.min.js?v=${hash(core)}"></script><script defer src="loader.js"></script></body>`);
fs.writeFileSync(path.join(out,'index.html'),html);fs.writeFileSync(path.join(out,'loader.js'),read('loader.js').replace('MOTION_HASH',hash(motion)));
const report={core:Buffer.byteLength(core),motion:Buffer.byteLength(motion),css:Buffer.byteLength(styles),gzipTotal:zlib.gzipSync(core).length+zlib.gzipSync(motion).length+zlib.gzipSync(styles).length};
console.log('Build bytes:',JSON.stringify(report));
