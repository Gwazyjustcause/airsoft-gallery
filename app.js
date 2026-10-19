'use strict';
const $=id=>document.getElementById(id);
let albums=[],active=null,photoIndex=0,zipBusy=false;
const nowYear=new Date().getFullYear();
$('hero-year').textContent=nowYear;$('footer-year').textContent=nowYear;
const fmt=date=>date?new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')):'';
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function render(){
 const q=$('search').value.toLocaleLowerCase('pt-PT').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const visible=albums.filter(a=>(!$('year').value||String(a.year)===$('year').value)&&(`${a.title} ${a.location} ${a.date||''}`).toLocaleLowerCase('pt-PT').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(q)).sort((a,b)=>$('sort').value==='name'?a.title.localeCompare(b.title,'pt'):($('sort').value==='old'?1:-1)*(a.date||String(a.year)).localeCompare(b.date||String(b.year)));
 $('albums').replaceChildren();$('total').textContent=`${visible.length} ${visible.length===1?'jogo':'jogos'} · ${visible.reduce((n,a)=>n+a.photos.length,0)} fotografias`;
 $('empty').hidden=visible.length>0;
 $('empty').querySelector('h3').textContent=albums.length?'Nenhum jogo encontrado.':'O próximo momento está a caminho.';
 $('empty').querySelector('p').textContent=albums.length?'Experimenta outro nome, campo ou ano.':'As fotografias dos jogos vão aparecer aqui. Volta em breve para encontrares as tuas.';
 for(const a of visible){const card=el('button','card');card.type='button';card.setAttribute('aria-label',`Abrir ${a.title}, ${a.photos.length} fotografias`);const cover=el('div','card-cover'),img=el('img');img.src=a.cover||a.photos[0].src;img.alt=a.title;img.loading='lazy';img.decoding='async';cover.append(img,el('span','card-count',`${a.photos.length} FOTOS`));const info=el('div','card-info');info.append(el('span','card-date',a.date?fmt(a.date):String(a.year)),el('h3','',a.title));const location=el('div','card-location',a.location||'Airsoft');location.append(el('span','','↗'));info.append(location);card.append(cover,info);card.onclick=()=>{locationHash(a.id)};$('albums').append(card);}
}
function locationHash(id){location.hash='jogo='+encodeURIComponent(id);}
function openAlbum(a){if(active===a&&$('album-dialog').open)return;active=a;$('album-title').textContent=a.title;$('album-date').textContent=a.date?fmt(a.date):a.year;$('album-location').textContent=`${a.location||'Airsoft'} · ${a.photos.length} fotografias`;
 const end=new Date(Date.UTC(a.year+1,2,0));$('album-expiry').textContent=`Disponível até ${new Intl.DateTimeFormat('pt-PT',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(end)}. Guarda as tuas fotografias antes dessa data.`;$('download-status').textContent='';$('photos').replaceChildren();for(const [i,p] of a.photos.entries()){const button=el('button','photo');button.type='button';button.setAttribute('aria-label',`Ver fotografia ${i+1}: ${p.name}`);const img=el('img');img.src=p.src;img.alt=p.name;img.loading='lazy';img.decoding='async';button.append(img);button.onclick=()=>showPhoto(i);$('photos').append(button);}if(!$('album-dialog').open)$('album-dialog').showModal();$('album-dialog').scrollTop=0;}
function syncHash(){const prefix='#jogo=';if(location.hash.startsWith(prefix)){let id;try{id=decodeURIComponent(location.hash.slice(prefix.length))}catch{return}const a=albums.find(a=>a.id===id);if(a)openAlbum(a);}else if($('album-dialog').open){$('lightbox').close();$('album-dialog').close();active=null;}}
function closeAlbum(){if(zipBusy)return;$('lightbox').close();$('album-dialog').close();active=null;history.replaceState(null,'',location.pathname+location.search+'#jogos');}
$('back').onclick=closeAlbum;$('close-album').onclick=closeAlbum;$('album-dialog').addEventListener('cancel',e=>{e.preventDefault();closeAlbum()});
function showPhoto(i){photoIndex=i;const p=active.photos[i];$('full-photo').src=p.src;$('full-photo').alt=`${active.title} — ${p.name}`;$('download-photo').href=p.src;$('download-photo').download=p.name;$('photo-number').textContent=`${i+1} / ${active.photos.length}`;$('photo-name').textContent=p.name;$('previous').disabled=i===0;$('next').disabled=i===active.photos.length-1;if(!$('lightbox').open)$('lightbox').showModal();}
$('close-photo').onclick=()=>$('lightbox').close();$('previous').onclick=()=>{if(photoIndex>0)showPhoto(photoIndex-1)};$('next').onclick=()=>{if(photoIndex<active.photos.length-1)showPhoto(photoIndex+1)};
document.addEventListener('keydown',e=>{if(!$('lightbox').open)return;if(e.key==='ArrowLeft'){$('previous').click();e.preventDefault()}if(e.key==='ArrowRight'){$('next').click();e.preventDefault()}});
// ZIP STORE: no duplicated ZIP on the server and no recompression of photographs.
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function header(size){const bytes=new Uint8Array(size);return[bytes,new DataView(bytes.buffer)]}
async function downloadAlbum(){if(!active||zipBusy)return;zipBusy=true;const album=active;const button=$('download-album');button.disabled=true;const parts=[],central=[];let offset=0;try{
 for(let i=0;i<album.photos.length;i++){const p=album.photos[i];$('download-status').textContent=`A preparar o álbum: ${i+1} de ${album.photos.length}…`;const response=await fetch(p.src);if(!response.ok)throw new Error('Não foi possível obter uma fotografia.');const data=new Uint8Array(await response.arrayBuffer());const name=new TextEncoder().encode(p.name);const crc=crc32(data);const [local,v]=header(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);parts.push(local,name,data);
 const [record,d]=header(46);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);central.push(record,name);offset+=30+name.length+data.length;
 }
 const centralSize=central.reduce((n,a)=>n+a.length,0);const [end,v]=header(22);v.setUint32(0,0x06054b50,true);v.setUint16(8,album.photos.length,true);v.setUint16(10,album.photos.length,true);v.setUint32(12,centralSize,true);v.setUint32(16,offset,true);const blob=new Blob([...parts,...central,end],{type:'application/zip'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=`${album.title.replace(/[^\p{L}\p{N} _-]/gu,'')}-${album.date||album.year}.zip`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);$('download-status').textContent='Álbum preparado. O download foi iniciado.';
 }catch(error){$('download-status').textContent='Não foi possível preparar o álbum. Tenta novamente ou descarrega as fotografias individualmente.';}finally{zipBusy=false;button.disabled=false;}}
$('download-album').onclick=downloadAlbum;
for(const id of ['search','year','sort'])$(id).addEventListener(id==='search'?'input':'change',render);
window.addEventListener('hashchange',syncHash);
fetch('albums.json').then(r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>{albums=data;for(const y of [...new Set(albums.map(a=>a.year))].sort((a,b)=>b-a)){const option=el('option','',y);option.value=y;$('year').append(option);}render();syncHash()}).catch(()=>{$('total').textContent='';$('error').hidden=false;});
