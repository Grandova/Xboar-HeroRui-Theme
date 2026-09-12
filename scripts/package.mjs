import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {deflateRawSync} from 'node:zlib';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=project;
const config=JSON.parse(await readFile(path.join(project,'config.json'),'utf8')),output=path.join(root,'theme',config.name),dist=path.join(root,'dist');
if(config.name!=='HeroRui')throw Error('Unexpected theme target');
await mkdir(output,{recursive:true});await mkdir(dist,{recursive:true});
const html=await readFile(path.join(project,'build/index.html'),'utf8');
const assets=[...html.matchAll(/(?:src|href)="\.\/([^" ]+)"/g)].map(m=>m[1]);
const scripts=assets.filter(f=>f.endsWith('.js')).map(f=>`<script type="module" crossorigin src="/theme/{{$theme}}/${f}"></script>`).join('\n');
const styles=assets.filter(f=>f.endsWith('.css')).map(f=>`<link rel="stylesheet" crossorigin href="/theme/{{$theme}}/${f}">`).join('\n');
if(!scripts||!styles)throw Error('Missing Vite entry assets');
const blade=`<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#ce303b"><title>{{$title}}</title>
${styles}
</head><body>
@php
 $heroruiSettings = ['title' => $title, 'description' => $description, 'logo' => $logo, 'version' => $version, 'assets_path' => '/theme/' . $theme . '/assets'];
@endphp
<script>window.routerBase = "/"; window.settings = @json($heroruiSettings);</script>
<div id="root"></div>
${scripts}
{!! $theme_config['custom_html'] ?? '' !!}
</body></html>\n`;
await cp(path.join(project,'build/assets'),path.join(output,'assets'),{recursive:true});
await writeFile(path.join(output,'dashboard.blade.php'),blade);
for(const name of ['config.json','README.md'])await cp(path.join(project,name),path.join(output,name));
await cp(path.join(root,'LICENSE'),path.join(output,'LICENSE'));
// Only current build assets enter the archive; obsolete hashed files are excluded.
async function list(dir,prefix=''){const result=[];for(const f of await readdir(dir,{withFileTypes:true})){if(f.isDirectory())result.push(...await list(path.join(dir,f.name),prefix+f.name+'/'));else result.push(prefix+f.name)}return result.sort()}
const files=['config.json','dashboard.blade.php','README.md','LICENSE',...(await list(path.join(project,'build/assets'),'assets/'))];
const crcTable=Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=(i&1)?0xedb88320^(i>>>1):i>>>1;return i>>>0});
const crc32=data=>{let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0};
const sha=data=>createHash('sha256').update(data).digest('hex');
let offset=0;const records=[],central=[],manifest={theme:config.name,version:config.version,frameworks:['React','Ant Design','HeroUI'],files:{}};
for(const file of files){const data=await readFile(path.join(output,file)),packed=deflateRawSync(data),name=Buffer.from(file),crc=crc32(data);manifest.files[file]={bytes:data.length,sha256:sha(data)};
const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(33,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
const index=Buffer.alloc(46);index.writeUInt32LE(0x02014b50);index.writeUInt16LE(20,4);index.writeUInt16LE(20,6);index.writeUInt16LE(0x800,8);index.writeUInt16LE(8,10);index.writeUInt16LE(33,14);index.writeUInt32LE(crc,16);index.writeUInt32LE(packed.length,20);index.writeUInt32LE(data.length,24);index.writeUInt16LE(name.length,28);index.writeUInt32LE(offset,42);records.push(local,name,packed);central.push(index,name);offset+=30+name.length+packed.length;}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...records,directory,end]);if(zip.length>10*1024*1024)throw Error('Theme exceeds upload limit');const base='HeroRui';
await writeFile(path.join(dist,base+'.zip'),zip);await writeFile(path.join(dist,base+'.sha256'),sha(zip)+'  '+base+'.zip\n');await writeFile(path.join(dist,base+'.manifest.json'),JSON.stringify(manifest,null,2));
console.log('Packaged '+path.join(dist,base+'.zip')+' ('+zip.length+' bytes, '+files.length+' files)');
