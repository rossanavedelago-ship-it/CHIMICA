/* ============================================================================
   CHEMVERSE ENGINE — shared atom-rendering core
   ============================================================================
   Used by every Chemverse sub-project (Atomo, Gli stati, Legami, and future
   ones). This file has no page-specific UI wiring in it — each project's own
   HTML supplies the canvas, sidebar, buttons, etc. and calls into this.

   Expects THREE.js (r128) to already be loaded before this script.

   REQUIRED GLOBALS — declare these in the host page BEFORE calling anything
   below (a minimal example is at the bottom of this comment):
     let visualStyle = 'flat';        // 'realistic' | 'flat'
     let bondMode = false;            // true while the Legame feature is active
     let viewerA, viewerB = null, activeViewer;  // set viewerA = createViewer(...)
     let electronsFrozen = false;     // true to pause all orbital motion
     let autoRotate = false;          // true to slowly spin the whole atom each frame

   OPTIONAL GLOBALS (only needed if you use the matching feature):
     let freeChoiceMode = false;      // true → p sub-orbitals get distinct
                                       // colors (SUB_COLORS) instead of one
                                       // shared color per orbital (ORB_COLORS)

   Minimal setup in a host page (SCRIPT-TAG here stands in for the literal
   script tag, spelled out to avoid accidentally closing this comment's own
   surrounding script block when this file is inlined into an HTML page):
     SCRIPT-TAG src="chemverse-engine.js" END-SCRIPT-TAG
     SCRIPT-TAG
       let visualStyle='flat', bondMode=false, electronsFrozen=false, autoRotate=false;
       let viewerA=createViewer(document.getElementById('canvas'), document.getElementById('pane'));
       let viewerB=null, activeViewer=viewerA;
       viewerA.selectElement(1); // Hydrogen
       (function loop(){ requestAnimationFrame(loop); viewerA.render(); })();
     END-SCRIPT-TAG
   ============================================================================ */

// ── ELEMENT DATA ──────────────────────────────────────────────────────────────


const ELEMENTS = [
  {n:1,sym:'H',name:'Idrogeno',cat:'nonmetal',group:1,period:1},
  {n:2,sym:'He',name:'Elio',cat:'noble',group:18,period:1},
  {n:3,sym:'Li',name:'Litio',cat:'alkali',group:1,period:2},
  {n:4,sym:'Be',name:'Berillio',cat:'alkaline',group:2,period:2},
  {n:5,sym:'B',name:'Boro',cat:'metalloid',group:13,period:2},
  {n:6,sym:'C',name:'Carbonio',cat:'nonmetal',group:14,period:2},
  {n:7,sym:'N',name:'Azoto',cat:'nonmetal',group:15,period:2},
  {n:8,sym:'O',name:'Ossigeno',cat:'nonmetal',group:16,period:2},
  {n:9,sym:'F',name:'Fluoro',cat:'halogen',group:17,period:2},
  {n:10,sym:'Ne',name:'Neon',cat:'noble',group:18,period:2},
  {n:11,sym:'Na',name:'Sodio',cat:'alkali',group:1,period:3},
  {n:12,sym:'Mg',name:'Magnesio',cat:'alkaline',group:2,period:3},
  {n:13,sym:'Al',name:'Alluminio',cat:'post',group:13,period:3},
  {n:14,sym:'Si',name:'Silicio',cat:'metalloid',group:14,period:3},
  {n:15,sym:'P',name:'Fosforo',cat:'nonmetal',group:15,period:3},
  {n:16,sym:'S',name:'Zolfo',cat:'nonmetal',group:16,period:3},
  {n:17,sym:'Cl',name:'Cloro',cat:'halogen',group:17,period:3},
  {n:18,sym:'Ar',name:'Argon',cat:'noble',group:18,period:3},
  {n:19,sym:'K',name:'Potassio',cat:'alkali',group:1,period:4},
  {n:20,sym:'Ca',name:'Calcio',cat:'alkaline',group:2,period:4},
  {n:21,sym:'Sc',name:'Scandio',cat:'transition',group:3,period:4},
  {n:22,sym:'Ti',name:'Titanio',cat:'transition',group:4,period:4},
  {n:23,sym:'V',name:'Vanadio',cat:'transition',group:5,period:4},
  {n:24,sym:'Cr',name:'Cromo',cat:'transition',group:6,period:4},
  {n:25,sym:'Mn',name:'Manganese',cat:'transition',group:7,period:4},
  {n:26,sym:'Fe',name:'Ferro',cat:'transition',group:8,period:4},
  {n:27,sym:'Co',name:'Cobalto',cat:'transition',group:9,period:4},
  {n:28,sym:'Ni',name:'Nichel',cat:'transition',group:10,period:4},
  {n:29,sym:'Cu',name:'Rame',cat:'transition',group:11,period:4},
  {n:30,sym:'Zn',name:'Zinco',cat:'transition',group:12,period:4},
  {n:31,sym:'Ga',name:'Gallio',cat:'post',group:13,period:4},
  {n:32,sym:'Ge',name:'Germanio',cat:'metalloid',group:14,period:4},
  {n:33,sym:'As',name:'Arsenico',cat:'metalloid',group:15,period:4},
  {n:34,sym:'Se',name:'Selenio',cat:'nonmetal',group:16,period:4},
  {n:35,sym:'Br',name:'Bromo',cat:'halogen',group:17,period:4},
  {n:36,sym:'Kr',name:'Kripton',cat:'noble',group:18,period:4},
  {n:37,sym:'Rb',name:'Rubidio',cat:'alkali',group:1,period:5},
  {n:38,sym:'Sr',name:'Stronzio',cat:'alkaline',group:2,period:5},
  {n:39,sym:'Y',name:'Ittrio',cat:'transition',group:3,period:5},
  {n:40,sym:'Zr',name:'Zirconio',cat:'transition',group:4,period:5},
  {n:41,sym:'Nb',name:'Niobio',cat:'transition',group:5,period:5},
  {n:42,sym:'Mo',name:'Molibdeno',cat:'transition',group:6,period:5},
  {n:43,sym:'Tc',name:'Tecnezio',cat:'transition',group:7,period:5},
  {n:44,sym:'Ru',name:'Rutenio',cat:'transition',group:8,period:5},
  {n:45,sym:'Rh',name:'Rodio',cat:'transition',group:9,period:5},
  {n:46,sym:'Pd',name:'Palladio',cat:'transition',group:10,period:5},
  {n:47,sym:'Ag',name:'Argento',cat:'transition',group:11,period:5},
  {n:48,sym:'Cd',name:'Cadmio',cat:'transition',group:12,period:5},
  {n:49,sym:'In',name:'Indio',cat:'post',group:13,period:5},
  {n:50,sym:'Sn',name:'Stagno',cat:'post',group:14,period:5},
  {n:51,sym:'Sb',name:'Antimonio',cat:'metalloid',group:15,period:5},
  {n:52,sym:'Te',name:'Tellurio',cat:'metalloid',group:16,period:5},
  {n:53,sym:'I',name:'Iodio',cat:'halogen',group:17,period:5},
  {n:54,sym:'Xe',name:'Xenon',cat:'noble',group:18,period:5},
  {n:55,sym:'Cs',name:'Cesio',cat:'alkali',group:1,period:6},
  {n:56,sym:'Ba',name:'Bario',cat:'alkaline',group:2,period:6},
  {n:57,sym:'La',name:'Lantanio',cat:'lanthanide',group:3,period:6},
  {n:58,sym:'Ce',name:'Cerio',cat:'lanthanide',group:null,period:6},
  {n:59,sym:'Pr',name:'Praseodimio',cat:'lanthanide',group:null,period:6},
  {n:60,sym:'Nd',name:'Neodimio',cat:'lanthanide',group:null,period:6},
  {n:61,sym:'Pm',name:'Promezio',cat:'lanthanide',group:null,period:6},
  {n:62,sym:'Sm',name:'Samario',cat:'lanthanide',group:null,period:6},
  {n:63,sym:'Eu',name:'Europio',cat:'lanthanide',group:null,period:6},
  {n:64,sym:'Gd',name:'Gadolinio',cat:'lanthanide',group:null,period:6},
  {n:65,sym:'Tb',name:'Terbio',cat:'lanthanide',group:null,period:6},
  {n:66,sym:'Dy',name:'Disprosio',cat:'lanthanide',group:null,period:6},
  {n:67,sym:'Ho',name:'Olmio',cat:'lanthanide',group:null,period:6},
  {n:68,sym:'Er',name:'Erbio',cat:'lanthanide',group:null,period:6},
  {n:69,sym:'Tm',name:'Tulio',cat:'lanthanide',group:null,period:6},
  {n:70,sym:'Yb',name:'Itterbio',cat:'lanthanide',group:null,period:6},
  {n:71,sym:'Lu',name:'Lutezio',cat:'lanthanide',group:null,period:6},
  {n:72,sym:'Hf',name:'Afnio',cat:'transition',group:4,period:6},
  {n:73,sym:'Ta',name:'Tantalio',cat:'transition',group:5,period:6},
  {n:74,sym:'W',name:'Tungsteno',cat:'transition',group:6,period:6},
  {n:75,sym:'Re',name:'Renio',cat:'transition',group:7,period:6},
  {n:76,sym:'Os',name:'Osmio',cat:'transition',group:8,period:6},
  {n:77,sym:'Ir',name:'Iridio',cat:'transition',group:9,period:6},
  {n:78,sym:'Pt',name:'Platino',cat:'transition',group:10,period:6},
  {n:79,sym:'Au',name:'Oro',cat:'transition',group:11,period:6},
  {n:80,sym:'Hg',name:'Mercurio',cat:'transition',group:12,period:6},
  {n:81,sym:'Tl',name:'Tallio',cat:'post',group:13,period:6},
  {n:82,sym:'Pb',name:'Piombo',cat:'post',group:14,period:6},
  {n:83,sym:'Bi',name:'Bismuto',cat:'post',group:15,period:6},
  {n:84,sym:'Po',name:'Polonio',cat:'post',group:16,period:6},
  {n:85,sym:'At',name:'Astato',cat:'halogen',group:17,period:6},
  {n:86,sym:'Rn',name:'Radon',cat:'noble',group:18,period:6},
  {n:87,sym:'Fr',name:'Francio',cat:'alkali',group:1,period:7},
  {n:88,sym:'Ra',name:'Radio',cat:'alkaline',group:2,period:7},
  {n:89,sym:'Ac',name:'Attinio',cat:'actinide',group:3,period:7},
  {n:90,sym:'Th',name:'Torio',cat:'actinide',group:null,period:7},
  {n:91,sym:'Pa',name:'Protoattinio',cat:'actinide',group:null,period:7},
  {n:92,sym:'U',name:'Uranio',cat:'actinide',group:null,period:7},
  {n:93,sym:'Np',name:'Nettunio',cat:'actinide',group:null,period:7},
  {n:94,sym:'Pu',name:'Plutonio',cat:'actinide',group:null,period:7},
  {n:95,sym:'Am',name:'Americio',cat:'actinide',group:null,period:7},
  {n:96,sym:'Cm',name:'Curio',cat:'actinide',group:null,period:7},
  {n:97,sym:'Bk',name:'Berkelio',cat:'actinide',group:null,period:7},
  {n:98,sym:'Cf',name:'Californio',cat:'actinide',group:null,period:7},
  {n:99,sym:'Es',name:'Einsteinio',cat:'actinide',group:null,period:7},
  {n:100,sym:'Fm',name:'Fermio',cat:'actinide',group:null,period:7},
  {n:101,sym:'Md',name:'Mendelevio',cat:'actinide',group:null,period:7},
  {n:102,sym:'No',name:'Nobelio',cat:'actinide',group:null,period:7},
  {n:103,sym:'Lr',name:'Laurenzio',cat:'actinide',group:null,period:7},
  {n:104,sym:'Rf',name:'Rutherfordio',cat:'transition',group:4,period:7},
  {n:105,sym:'Db',name:'Dubnio',cat:'transition',group:5,period:7},
  {n:106,sym:'Sg',name:'Seaborgio',cat:'transition',group:6,period:7},
  {n:107,sym:'Bh',name:'Bohrio',cat:'transition',group:7,period:7},
  {n:108,sym:'Hs',name:'Hassio',cat:'transition',group:8,period:7},
  {n:109,sym:'Mt',name:'Meitnerio',cat:'unknown',group:9,period:7},
  {n:110,sym:'Ds',name:'Darmstadtio',cat:'unknown',group:10,period:7},
  {n:111,sym:'Rg',name:'Roentgenio',cat:'unknown',group:11,period:7},
  {n:112,sym:'Cn',name:'Copernicio',cat:'transition',group:12,period:7},
  {n:113,sym:'Nh',name:'Nihonio',cat:'unknown',group:13,period:7},
  {n:114,sym:'Fl',name:'Flerovio',cat:'unknown',group:14,period:7},
  {n:115,sym:'Mc',name:'Moscovio',cat:'unknown',group:15,period:7},
  {n:116,sym:'Lv',name:'Livermorio',cat:'unknown',group:16,period:7},
  {n:117,sym:'Ts',name:'Tennesso',cat:'unknown',group:17,period:7},
  {n:118,sym:'Og',name:'Oganessone',cat:'unknown',group:18,period:7},
];


function getConfig(Z){
  const order=['1s','2s','2p','3s','3p','4s','3d','4p','5s','4d','5p','6s','4f','5d','6p','7s','5f','6d','7p'];
  const max={s:2,p:6,d:10,f:14};
  let rem=Z, cfg={};
  for(let orb of order){
    if(rem<=0) break;
    const type=orb[1];
    const fill=Math.min(rem,max[type]);
    cfg[orb]=fill;
    rem-=fill;
  }
  return cfg;
}

function configStr(cfg){
  const sup=['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','¹⁰','¹¹','¹²','¹³','¹⁴'];
  return Object.entries(cfg).map(([o,n])=>o+sup[n]).join(' ');
}

function computeShellCounts(cfg){
  const shells={};
  for(let orb of Object.keys(cfg)){
    if(cfg[orb]<=0) continue;
    const n=parseInt(orb[0]);
    shells[n]=(shells[n]||0)+cfg[orb];
  }
  return shells;
}

function keyShellNumber(key){
  return key.startsWith('bohr:') ? parseInt(key.slice(5)) : parseInt(key[0]);
}


// ── SIMPLIFIED OCTET-RULE BONDING (for the "Legame" feature) ────────────────

function bondingProfile(cfg){
  const shells=computeShellCounts(cfg);
  const ns=Object.keys(shells).map(Number);
  const maxN=Math.max(...ns);
  const v=shells[maxN];
  const capacity=maxN===1?2:8;
  if(v>=capacity) return {type:'inert', shellN:maxN};
  if(maxN===1) return {type:'gain', amount:capacity-v, shellN:maxN}; // H: can only gain, no lower shell to expose
  const toGain=capacity-v, toLose=v;
  if(toLose<=toGain) return {type:'lose', amount:toLose, shellN:maxN};
  return {type:'gain', amount:toGain, shellN:maxN};
}

function canFormBond(cfgA, cfgB){
  const a=bondingProfile(cfgA), b=bondingProfile(cfgB);
  if(a.type==='inert'||b.type==='inert') return null;
  if(a.type==='gain'&&b.type==='gain'&&a.amount===b.amount&&a.amount>0){
    return {kind:'covalent', shellA:a.shellN, shellB:b.shellN};
  }
  if(a.type==='lose'&&b.type==='gain'&&a.amount===b.amount&&a.amount>0){
    return {kind:'ionic', shellA:a.shellN, shellB:b.shellN};
  }
  if(b.type==='lose'&&a.type==='gain'&&b.amount===a.amount&&b.amount>0){
    return {kind:'ionic', shellA:a.shellN, shellB:b.shellN};
  }
  return null;
}

function updateCompatibleHighlight(refCfg){
  document.querySelectorAll('.el.bond-compatible').forEach(e=>e.classList.remove('bond-compatible'));
  if(!bondMode || !refCfg) return;
  for(let el of ELEMENTS){
    if(canFormBond(refCfg, getConfig(el.n))){
      const div=document.querySelector(`.el[data-n="${el.n}"]`);
      if(div) div.classList.add('bond-compatible');
    }
  }
}


// ── PERIODIC TABLE ─────────────────────────────────────────────────────────

const catClass={alkali:'cat-alkali',alkaline:'cat-alkaline',transition:'cat-transition',
  post:'cat-post',metalloid:'cat-metalloid',nonmetal:'cat-nonmetal',
  halogen:'cat-halogen',noble:'cat-noble',lanthanide:'cat-lanthanide',
  actinide:'cat-actinide',unknown:'cat-unknown'};

function buildPeriodicTable(gridEl, gridLanaEl, onSelect){
  const cells=Array(7).fill(null).map(()=>Array(18).fill(null));
  const lana=[], acta=[];
  for(let el of ELEMENTS){
    if(el.cat==='lanthanide'&&el.n!==57){lana.push(el);continue;}
    if(el.cat==='actinide'&&el.n!==89){acta.push(el);continue;}
    if(el.group&&el.period){
      cells[el.period-1][el.group-1]=el;
    }
  }
  for(let r=0;r<7;r++){
    for(let c=0;c<18;c++){
      const el=cells[r][c];
      const div=document.createElement('div');
      if(el){
        div.className='el '+catClass[el.cat];
        div.innerHTML=`<span class="sym">${el.sym}</span><span class="num">${el.n}</span>`;
        div.title=el.name;
        div.dataset.n=el.n;
        div.onclick=()=>onSelect(el.n);
      } else {
        if(r===5&&c===2){
          div.className='el cat-lanthanide';
          div.style.opacity='0.4';
          div.innerHTML='<span class="sym" style="font-size:6px">La-Lu</span><span class="num">57-71</span>';
        } else if(r===6&&c===2){
          div.className='el cat-actinide';
          div.style.opacity='0.4';
          div.innerHTML='<span class="sym" style="font-size:6px">Ac-Lr</span><span class="num">89-103</span>';
        } else {
          div.className='spacer el';
          div.style.visibility='hidden';
        }
      }
      gridEl.appendChild(div);
    }
  }
  const lans=ELEMENTS.filter(e=>e.cat==='lanthanide');
  const acts=ELEMENTS.filter(e=>e.cat==='actinide');
  for(let el of [...lans, ...acts]){
    const div=document.createElement('div');
    div.className='el '+catClass[el.cat];
    div.innerHTML=`<span class="sym">${el.sym}</span><span class="num">${el.n}</span>`;
    div.title=el.name; div.dataset.n=el.n;
    div.onclick=()=>onSelect(el.n);
    gridLanaEl.appendChild(div);
  }
}

function buildElementRow(gridEl, elementsList, onSelect){
  for(let el of elementsList){
    const div=document.createElement('div');
    div.className='el '+catClass[el.cat];
    div.innerHTML=`<span class="sym">${el.sym}</span><span class="num">${el.n}</span>`;
    div.title=el.name;
    div.dataset.n=el.n;
    div.onclick=()=>onSelect(el.n);
    gridEl.appendChild(div);
  }
}


// ── COLOR SYSTEM ──────────────────────────────────────────────────────────

const ORB_COLORS={
  '1s':0x00ffff,'2s':0xff4488,'2p':0xffaa00,
  '3s':0x00ff88,'3p':0xff6600,'3d':0x4488ff,
  '4s':0x88ff00,'4p':0xff0088,'4d':0x00aaff,'4f':0xffdd00,
  '5s':0xff8844,'5p':0x44ffdd,'5d':0xaa44ff,'5f':0xff4444,
  '6s':0x44ff44,'6p':0xffaa44,'6d':0x44aaff,
  '7s':0xff44aa,'7p':0xaaffaa
};

const SUB_COLORS={ x:0xff4444, y:0x4488ff, z:0x44cc44 };

const D_SUB_DEFS=[
  {key:'xy', v1:[1,0,0], v2:[0,1,0]},
  {key:'yz', v1:[0,1,0], v2:[0,0,1]},
  {key:'xz', v1:[1,0,0], v2:[0,0,1]},
  {key:'x2y2', v1:[1,0,0], v2:[0,1,0], alongAxis:true},
  {key:'z2', special:'z2'},
];

const D_SUB_LABELS={xy:'xy', yz:'yz', xz:'xz', x2y2:'x²-y²', z2:'z²'};

const D_SUB_COLORS={xy:0xff4444, yz:0x4488ff, xz:0x44cc44, x2y2:0xffaa00, z2:0xaa44ff};

const P_SUBS=['x','y','z'];


// ── LINES / CLOUD RENDERING PRIMITIVES ────────────────────────────────────

function makeWireSphereGrid(radius, color, opacity=0.32, latLines=9, lonLines=14, segPerLine=40){
  const group=new THREE.Group();
  const mat=new THREE.LineBasicMaterial({color, transparent:true, opacity, linewidth:2});
  for(let i=1;i<latLines;i++){
    const phi=Math.PI*i/latLines;
    const rr=radius*Math.sin(phi);
    const y=radius*Math.cos(phi);
    const pts=[];
    for(let j=0;j<=segPerLine;j++){
      const theta=(j/segPerLine)*Math.PI*2;
      pts.push(new THREE.Vector3(rr*Math.cos(theta), y, rr*Math.sin(theta)));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  for(let i=0;i<lonLines;i++){
    const theta=(i/lonLines)*Math.PI*2;
    const pts=[];
    for(let j=0;j<=segPerLine;j++){
      const phi=(j/segPerLine)*Math.PI*2;
      pts.push(new THREE.Vector3(radius*Math.sin(phi)*Math.cos(theta), radius*Math.cos(phi), radius*Math.sin(phi)*Math.sin(theta)));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  return group;
}

function rawLobeProfile(t){
  return Math.sqrt(Math.max(0,t*(1-t)))*(1+0.6*t);
}

const LOBE_PROFILE_MAX=(()=>{
  let max=0;
  for(let i=0;i<=200;i++){ const v=rawLobeProfile(i/200); if(v>max) max=v; }
  return max;
})();

function teardropProfile(t){
  return rawLobeProfile(t)/LOBE_PROFILE_MAX;
}

function makeTeardropWire(axis, sign, r, color, opacity=0.32, levels=14, meridians=10, segPerRing=28){
  const group=new THREE.Group();
  const mat=new THREE.LineBasicMaterial({color, transparent:true, opacity, linewidth:2});
  const gap=r*0.14, length=r-gap, maxR=r*0.42;
  const dir=axis.clone().normalize().multiplyScalar(sign);
  const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir);

  for(let i=0;i<=levels;i++){
    const t=i/levels;
    const radius=maxR*teardropProfile(t);
    if(radius<0.003) continue;
    const y=gap+t*length;
    const pts=[];
    for(let j=0;j<=segPerRing;j++){
      const theta=(j/segPerRing)*Math.PI*2;
      pts.push(new THREE.Vector3(radius*Math.cos(theta), y, radius*Math.sin(theta)));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  for(let j=0;j<meridians;j++){
    const theta=(j/meridians)*Math.PI*2;
    const pts=[];
    for(let i=0;i<=levels;i++){
      const t=i/levels;
      const radius=maxR*teardropProfile(t);
      const y=gap+t*length;
      pts.push(new THREE.Vector3(radius*Math.cos(theta), y, radius*Math.sin(theta)));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  group.quaternion.copy(quat);
  return group;
}

function makeElectron(color){
  const size=visualStyle==='flat'?0.1:0.06;
  const geo=new THREE.SphereGeometry(size,10,10);
  const mat=new THREE.MeshBasicMaterial({color});
  return new THREE.Mesh(geo,mat);
}

function lineOpacity(base){
  return visualStyle==='flat' ? Math.min(1, base+0.45) : base;
}

function makeCloudShell(radius, color, count=800, spread=0.55){
  const positions=[];
  const rMin=radius*(1-spread/2), rMax=radius*(1+spread/2);
  for(let i=0;i<count;i++){
    const u=Math.pow(Math.random(),1.8);
    const r=rMin+(rMax-rMin)*u;
    const theta=Math.random()*Math.PI*2;
    const phi=Math.acos(2*Math.random()-1);
    positions.push(r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi));
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const mat=new THREE.PointsMaterial({color,size:currentCloudSize(),transparent:true,opacity:currentCloudOpacity()});
  return new THREE.Points(geo,mat);
}

function makeTeardropCloud(axis, sign, r, color, count){
  const positions=[];
  const gap=r*0.14, length=r-gap, maxR=r*0.42;
  const dir=axis.clone().normalize().multiplyScalar(sign);
  const quat=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
  for(let i=0;i<count;i++){
    const t=Math.random();
    const radius=maxR*teardropProfile(t)*Math.sqrt(Math.random());
    const theta=Math.random()*Math.PI*2;
    const y=gap+t*length;
    const v=new THREE.Vector3(radius*Math.cos(theta), y, radius*Math.sin(theta));
    v.applyQuaternion(quat);
    positions.push(v.x,v.y,v.z);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const mat=new THREE.PointsMaterial({color,size:currentCloudSize(),transparent:true,opacity:currentCloudOpacity()});
  return new THREE.Points(geo,mat);
}

function makeTorusCloud(radius, color, count){
  const positions=[];
  for(let i=0;i<count;i++){
    const theta=Math.random()*Math.PI*2;
    const rr=radius+(Math.random()-0.5)*radius*0.35;
    const zz=(Math.random()-0.5)*radius*0.35;
    positions.push(rr*Math.cos(theta), rr*Math.sin(theta), zz);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const mat=new THREE.PointsMaterial({color,size:currentCloudSize(),transparent:true,opacity:currentCloudOpacity()});
  return new THREE.Points(geo,mat);
}

function getDLobeDirs(def){
  if(def.special==='z2') return {special:'z2'};
  const v1=new THREE.Vector3(...def.v1), v2=new THREE.Vector3(...def.v2);
  if(def.alongAxis) return {dirs:[v1.clone(), v1.clone().negate(), v2.clone(), v2.clone().negate()]};
  return {dirs:[
    v1.clone().add(v2).normalize(),
    v1.clone().sub(v2).normalize(),
    v1.clone().negate().add(v2).normalize(),
    v1.clone().negate().sub(v2).normalize(),
  ]};
}

function buildDShapeWire(def, r, color){
  const group=new THREE.Group();
  const info=getDLobeDirs(def);
  if(info.special==='z2'){
    for(let s of [-1,1]) group.add(makeTeardropWire(new THREE.Vector3(0,0,1), s, r, color, lineOpacity(0.32)));
    const torusGeo=new THREE.TorusGeometry(r*0.5, r*0.09, 8, 32);
    const torusMat=new THREE.MeshBasicMaterial({color, wireframe:true, transparent:true, opacity:lineOpacity(0.3)});
    const torus=new THREE.Mesh(torusGeo, torusMat);
    group.add(torus);
  } else {
    for(let d of info.dirs) group.add(makeTeardropWire(d, 1, r, color, lineOpacity(0.32)));
  }
  return group;
}

function buildDShapeCloud(def, r, color, ptCount){
  const group=new THREE.Group();
  const info=getDLobeDirs(def);
  if(info.special==='z2'){
    for(let s of [-1,1]) group.add(makeTeardropCloud(new THREE.Vector3(0,0,1), s, r, color, Math.floor(ptCount/3)));
    group.add(makeTorusCloud(r*0.5, color, Math.floor(ptCount/3)));
  } else {
    for(let d of info.dirs) group.add(makeTeardropCloud(d, 1, r, color, Math.floor(ptCount/4)));
  }
  return group;
}

const AUFBAU_ORDER=['1s','2s','2p','3s','3p','4s','3d','4p','5s','4d','5p','6s','4f','5d','6p','7s','5f','6d','7p'];

const RADII={};
AUFBAU_ORDER.forEach((orb,i)=>{ RADII[orb]=1.0+i*0.5; });

function getRadius(orb){return (RADII[orb]||parseFloat(orb[0])*1.2)*0.85;}

function sphericalCloudCount(base, r){
  if(visualStyle!=='flat') return Math.floor(base);
  const refR=getRadius('1s');
  const scale=Math.pow(r/refR, 2); // area-based: keeps dot-to-dot spacing constant as the shell grows
  return Math.min(45000, Math.floor(base*scale));
}

function removePart(layer, key){
  const rec=layer.rendered[key];
  if(!rec) return;
  for(let m of rec.meshes){
    layer.group.remove(m);
    const idx=layer.orbitalObjects.indexOf(m);
    if(idx>=0) layer.orbitalObjects.splice(idx,1);
  }
  for(let ed of rec.electrons){
    layer.group.remove(ed.mesh);
    const idx=layer.electronObjects.indexOf(ed);
    if(idx>=0) layer.electronObjects.splice(idx,1);
  }
  delete layer.rendered[key];
}


// ── BOHR-MODEL GEOMETRY ───────────────────────────────────────────────────

const BOHR_RADII={1:1.3,2:2.3,3:3.3,4:4.3,5:5.3,6:6.3,7:7.3};

const BOHR_SLOT_INDEX={};
AUFBAU_ORDER.forEach((orb,i)=>{ BOHR_SLOT_INDEX[orb]=i; });

const BOHR_SLOT_BASE=1.0;

const BOHR_SLOT_SPACING=0.95;

const BOHR_SUB_SPACING={p:0.2, d:0.2}; // how tightly a p/d orbital's own sub-levels cluster within its slot

function bohrKeyRadius(key){
  const [orb,sub]=key.split('|');
  const type=orb[1];
  const center=BOHR_SLOT_BASE + (BOHR_SLOT_INDEX[orb]??0)*BOHR_SLOT_SPACING;
  if(!sub) return center;
  const subsList = type==='p' ? P_SUBS : D_SUB_DEFS.map(d=>d.key);
  const idx=subsList.indexOf(sub);
  return center + (idx-(subsList.length-1)/2)*BOHR_SUB_SPACING[type];
}

function lemniscatePoint(t, a, gap){
  const angle=t*Math.PI*2;
  const denom=1+Math.sin(angle)*Math.sin(angle);
  let x=a*Math.cos(angle)/denom;
  let y=a*Math.sin(angle)*Math.cos(angle)/denom;
  const d=Math.hypot(x,y);
  if(d>1e-6){
    const scale=(d+gap)/d;
    x*=scale; y*=scale;
  }
  return {x,y};
}

function addBohrOrbitalRing(layer, key, cfg){
  const [orb,sub]=key.split('|');
  const color=ORB_COLORS[orb]||0xffffff;
  const r=bohrKeyRadius(key);
  const type=orb[1];
  const rec={meshes:[], electrons:[]};
  layer.rendered[key]=rec;

  const tube=visualStyle==='flat'?0.03:0.015;
  const count = sub ? 2 : cfg[orb];

  if(type==='p'){
    // p orbitals get a figure-8 (lemniscate) instead of a plain circle — more
    // evocative of the real two-lobe shape. The three sub-levels are spread
    // at different angles so they read as distinct "propeller" shapes rather
    // than nested identical eights, and a small gap at the crossing keeps
    // the nucleus fully visible instead of being covered by the curve.
    const idx=P_SUBS.indexOf(sub);
    const pColor=(typeof freeChoiceMode!=='undefined' && freeChoiceMode && sub && SUB_COLORS[sub]!==undefined) ? SUB_COLORS[sub] : color;
    const rot=idx*(Math.PI/3);
    const a=r; // full radius — the lobe tip must reach further out than the preceding s orbital
    const gap=Math.max(0.1, r*0.07);
    const cosr=Math.cos(rot), sinr=Math.sin(rot);
    const segs=120;
    const pts=[];
    for(let i=0;i<=segs;i++){
      const p=lemniscatePoint(i/segs, a, gap);
      pts.push(new THREE.Vector3(p.x*cosr-p.y*sinr, p.x*sinr+p.y*cosr, 0));
    }
    const curve=new THREE.CatmullRomCurve3(pts, true);
    const tubeGeo=new THREE.TubeGeometry(curve, 160, tube, 8, true);
    const ringMat=new THREE.MeshBasicMaterial({color:pColor, transparent:true, opacity:lineOpacity(0.5)});
    const ring=new THREE.Mesh(tubeGeo, ringMat);
    layer.group.add(ring);
    rec.meshes.push(ring);

    for(let i=0;i<count;i++){
      const e=makeElectron(pColor);
      layer.group.add(e);
      const ed={mesh:e, orb:key, a, gap, rot, t:i/count, speed:0.14+0.05*Math.random(), type:'bohr8'};
      layer.electronObjects.push(ed);
      rec.electrons.push(ed);
    }
    return;
  }

  const ringGeo=new THREE.TorusGeometry(r, tube, 8, 64);
  const ringMat=new THREE.MeshBasicMaterial({color, transparent:true, opacity:lineOpacity(0.5)});
  const ring=new THREE.Mesh(ringGeo, ringMat);
  layer.group.add(ring);
  rec.meshes.push(ring);

  // s/f (no sub-level) show their true electron count.
  for(let i=0;i<count;i++){
    const e=makeElectron(color);
    layer.group.add(e);
    const ed={mesh:e, orb:key, r, theta:(i/count)*Math.PI*2, speed:0.35+0.15*Math.random(), type:'bohr'};
    layer.electronObjects.push(ed);
    rec.electrons.push(ed);
  }
}


// ── "LEGAME" BOND SCENE ──────────────────────────────────────────────────────
let bondElectrons=[];
let bondLayerGroup=null;
let bondAnim=null;

function buildStaticNucleus(Z, parentGroup){
  const N=getNeutronCount(Z);
  const total=Z+N;
  const nucRadius=0.16+Math.cbrt(total)*0.05;

  const haloGeo=new THREE.SphereGeometry(nucRadius+0.1,16,16);
  const haloMat=new THREE.MeshBasicMaterial({color:0x4488ff,transparent:true,opacity:visualStyle==='flat'?0.05:0.1});
  parentGroup.add(new THREE.Mesh(haloGeo,haloMat));

  const nucleonGeo=new THREE.SphereGeometry(visualStyle==='flat'?0.075:0.05,9,9);
  const pMat=new THREE.MeshBasicMaterial({color:visualStyle==='flat'?0xff2e88:0xff4444});
  const nMat=new THREE.MeshBasicMaterial({color:visualStyle==='flat'?0x2ec4ff:0x4488ff});
  for(let i=0;i<total;i++){
    const mesh=new THREE.Mesh(nucleonGeo, i<Z?pMat:nMat);
    const rr=nucRadius*0.85*Math.cbrt(Math.random());
    const theta=Math.random()*Math.PI*2, phi=Math.acos(2*Math.random()-1);
    mesh.position.set(rr*Math.sin(phi)*Math.cos(theta), rr*Math.sin(phi)*Math.sin(theta), rr*Math.cos(phi));
    parentGroup.add(mesh);
  }
}

function addStaticBohrRing(parentGroup, key, cfg){
  const [orb,sub]=key.split('|');
  const color=ORB_COLORS[orb]||0xffffff;
  const r=bohrKeyRadius(key);
  const tube=visualStyle==='flat'?0.03:0.015;
  const ringGeo=new THREE.TorusGeometry(r, tube, 8, 64);
  const baseOpacity=lineOpacity(0.5);
  const ringMat=new THREE.MeshBasicMaterial({color, transparent:true, opacity:baseOpacity});
  const ringMesh=new THREE.Mesh(ringGeo, ringMat);
  parentGroup.add(ringMesh);
  const electronMats=[];
  const electronMeshes=[];
  const electronDescs=[];
  const count = sub ? 2 : cfg[orb];
  for(let i=0;i<count;i++){
    const e=makeElectron(color);
    e.material.transparent=true;
    electronMats.push(e.material);
    electronMeshes.push(e);
    parentGroup.add(e);
    const desc={mesh:e, kind:'circle', r, theta:(i/count)*Math.PI*2, speed:0.35+0.15*Math.random()};
    bondElectrons.push(desc);
    electronDescs.push(desc);
  }
  return {
    setOpacity(factor){
      ringMat.opacity=baseOpacity*factor;
      for(let m of electronMats) m.opacity=factor;
    },
    // Fully removes this ring and its electrons from the scene AND from the
    // animation loop — used once a fade-out reaches zero, so nothing keeps
    // moving around invisibly (which, at very low opacity, can still read
    // as a faint, oddly-colored speck against certain backgrounds).
    remove(){
      parentGroup.remove(ringMesh);
      for(let e of electronMeshes) parentGroup.remove(e);
      for(let d of electronDescs){
        const idx=bondElectrons.indexOf(d);
        if(idx>=0) bondElectrons.splice(idx,1);
      }
    }
  };
}

function allBohrKeysForCfg(cfg){
  const keys=[];
  for(let orb of Object.keys(cfg)){
    if(cfg[orb]<=0) continue;
    const t=orb[1];
    if(t==='p'){
      const nShow=Math.min(P_SUBS.length, cfg[orb]); // Hund's rule: orbitals fill singly before pairing
      for(let i=0;i<nShow;i++) keys.push(orb+'|'+P_SUBS[i]);
    } else if(t==='d'){
      const nShow=Math.min(D_SUB_DEFS.length, cfg[orb]); // Hund's rule: orbitals fill singly before pairing
      for(let i=0;i<nShow;i++) keys.push(orb+'|'+D_SUB_DEFS[i].key);
    } else {
      keys.push(orb);
    }
  }
  return keys;
}

function fusedEllipsePoint(t, cx, a, b){
  const ang=t*Math.PI*2;
  return {x:cx+a*Math.cos(ang), y:b*Math.sin(ang)};
}

function maxRadiusOfKeys(keys){
  if(keys.length===0) return 0.5; // nothing left individually visible (e.g. H, He) — just clear the nucleus
  return Math.max(...keys.map(k=>bohrKeyRadius(k)));
}

function addFusedRing(parentGroup, cx, a, b, totalCount){
  const color=0xffd700; // a neutral gold, distinct from either atom's own shell colors
  const segs=100;
  const pts=[];
  for(let i=0;i<=segs;i++){
    const p=fusedEllipsePoint(i/segs, cx, a, b);
    pts.push(new THREE.Vector3(p.x, p.y, 0));
  }
  const curve=new THREE.CatmullRomCurve3(pts, true);
  const tubeGeo=new THREE.TubeGeometry(curve, 160, visualStyle==='flat'?0.05:0.03, 8, true);
  const baseOpacity=lineOpacity(0.6);
  const tubeMat=new THREE.MeshBasicMaterial({color, transparent:true, opacity:0});
  parentGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
  const electronMats=[];
  for(let i=0;i<totalCount;i++){
    const e=makeElectron(color);
    e.material.transparent=true;
    e.material.opacity=0;
    electronMats.push(e.material);
    parentGroup.add(e);
    bondElectrons.push({mesh:e, kind:'fused-ellipse', cx, a, b, t:i/totalCount, speed:0.12+0.05*Math.random()});
  }
  return {
    setOpacity(factor){
      tubeMat.opacity=baseOpacity*factor;
      for(let m of electronMats) m.opacity=factor;
    }
  };
}

function buildBondLayer(){
  const elA=viewerA.currentElement, elB=viewerB && viewerB.currentElement;
  if(!elA||!elB) return;
  const cfgA=viewerA.currentCfg, cfgB=viewerB.currentCfg;

  viewerA.camera.position.z=12; // reset zoom — the scene below is scaled to fit THIS framing, so any leftover zoom from another view could clip it

  if(bondLayerGroup){ viewerA.atomGroup.remove(bondLayerGroup); }
  bondElectrons=[];
  bondAnim=null;
  const group=new THREE.Group();
  viewerA.atomGroup.add(group);
  bondLayerGroup=group;

  const shellsA=computeShellCounts(cfgA), shellsB=computeShellCounts(cfgB);
  const keysA=allBohrKeysForCfg(cfgA), keysB=allBohrKeysForCfg(cfgB);
  const maxNA=Math.max(...Object.keys(shellsA).map(Number));
  const maxNB=Math.max(...Object.keys(shellsB).map(Number));
  const rA=maxRadiusOfKeys(keysA);
  const rB=maxRadiusOfKeys(keysB);

  const bond=canFormBond(cfgA, cfgB);
  const startOffset=(rA+rB)*1.35;   // starting distance: clearly apart
  const endOffset=rA+rB;            // always exactly tangent — atoms sit adjacent, never overlapping, bonded or not

  const groupA=new THREE.Group(); groupA.position.x=-startOffset; group.add(groupA);
  const groupB=new THREE.Group(); groupB.position.x=startOffset; group.add(groupB);

  buildStaticNucleus(elA.n, groupA);
  buildStaticNucleus(elB.n, groupB);

  const innerKeysA=keysA.filter(k=>keyShellNumber(k)!==maxNA);
  const outerKeysA=keysA.filter(k=>keyShellNumber(k)===maxNA);
  const innerKeysB=keysB.filter(k=>keyShellNumber(k)!==maxNB);
  const outerKeysB=keysB.filter(k=>keyShellNumber(k)===maxNB);

  for(let k of innerKeysA) addStaticBohrRing(groupA, k, cfgA);
  for(let k of innerKeysB) addStaticBohrRing(groupB, k, cfgB);
  const outerRecsA=outerKeysA.map(k=>addStaticBohrRing(groupA, k, cfgA));
  const outerRecsB=outerKeysB.map(k=>addStaticBohrRing(groupB, k, cfgB));

  let fusedRec=null, totalWidth, finalOffset=endOffset;
  if(bond){
    const totalE=shellsA[maxNA]+shellsB[maxNB];
    const rawInnerA=maxRadiusOfKeys(innerKeysA); // atom A's actual remaining size, no margin
    const rawInnerB=maxRadiusOfKeys(innerKeysB);
    const capA=rawInnerA*1.25; // hugs atom A's own remaining shells
    const capB=rawInnerB*1.25; // hugs atom B's own remaining shells — independently sized
    finalOffset=(rawInnerA+rawInnerB)*1.15; // once the outer shells fade, atoms pull in close — tangent on what's actually left visible, plus a safety margin so they never overlap
    // Ellipse spans from just past atom A's left edge to just past atom B's
    // right edge — its center shifts toward whichever atom is bigger rather
    // than sitting fixed at the nuclei's midpoint. Height normally just
    // clears whichever atom is taller, but is grown (not width shrunk, which
    // would risk overlap) to keep the shape reasonably round rather than a
    // thin stretched oval, capping how elongated it's allowed to look.
    const ellipseCx=(capB-capA)/2;
    const ellipseA=finalOffset+(capA+capB)/2;
    let ellipseB=Math.max(capA,capB)*1.05;
    const MAX_ELLIPSE_RATIO=1.5;
    if(ellipseA/ellipseB>MAX_ELLIPSE_RATIO) ellipseB=ellipseA/MAX_ELLIPSE_RATIO;
    fusedRec=addFusedRing(group, ellipseCx, ellipseA, ellipseB, totalE);
    totalWidth=2*ellipseA;
  } else {
    totalWidth=2*endOffset+rA+rB;
  }

  // Fit the whole pair within a comfortable width, scaling everything down
  // uniformly (not just the fused ring) if it would otherwise be too big.
  const MAX_WIDTH=13;
  const scale=totalWidth>MAX_WIDTH ? MAX_WIDTH/totalWidth : 1;
  group.scale.setScalar(scale);

  bondAnim={
    groupA, groupB, startOffset, endOffset, finalOffset,
    startTime:performance.now(), approachDuration:1600,
    bond, outerRecsA, outerRecsB, fusedRec,
    fadeStarted:false, fadeStartTime:0, fadeDuration:1200
  };
}

function updateBondAnimation(){
  if(!bondAnim) return;
  const anim=bondAnim; // keep a local reference — bondAnim may be nulled out below, but we still need to apply this frame's position
  const now=performance.now();
  const t=Math.min(1, (now-anim.startTime)/anim.approachDuration);
  const te=1-Math.pow(1-t,3); // ease-out cubic
  let offset=anim.startOffset+(anim.endOffset-anim.startOffset)*te;

  if(t>=1){
    if(anim.bond){
      if(!anim.fadeStarted){ anim.fadeStarted=true; anim.fadeStartTime=now; }
      const ft=Math.min(1, (now-anim.fadeStartTime)/anim.fadeDuration);
      offset=anim.endOffset+(anim.finalOffset-anim.endOffset)*ft; // atoms pull in close as the outer shells dissolve
      for(let rec of anim.outerRecsA) rec.setOpacity(1-ft);
      for(let rec of anim.outerRecsB) rec.setOpacity(1-ft);
      anim.fusedRec.setOpacity(ft);
      if(ft>=1){
        for(let rec of anim.outerRecsA) rec.remove();
        for(let rec of anim.outerRecsB) rec.remove();
        bondAnim=null; // animation fully settled
      }
    } else {
      bondAnim=null; // no bond — approach finished, nothing further to animate
    }
  }

  anim.groupA.position.x=-offset;
  anim.groupB.position.x=offset;
}


// ── PART DISPATCH ─────────────────────────────────────────────────────────

function addPart(layer, key, mode, cfg){
  if(mode==='bohr'){
    addBohrOrbitalRing(layer, key, cfg);
    return;
  }
  const [orb, sub]=key.split('|');
  const count=cfg[orb];
  const type=orb[1];
  const color=ORB_COLORS[orb]||0xffffff;
  const r=getRadius(orb);
  const rec={meshes:[], electrons:[]};
  layer.rendered[key]=rec;

  if(type==='s'){
    if(mode==='lines'){
      const sphere=makeWireSphereGrid(r, color, lineOpacity(0.32));
      layer.group.add(sphere); layer.orbitalObjects.push(sphere); rec.meshes.push(sphere);
      for(let i=0;i<count;i++){
        const e=makeElectron(color);
        layer.group.add(e);
        const ed={mesh:e, orb, r, theta:Math.random()*Math.PI*2, phi:Math.random()*Math.PI, speed:0.4+Math.random()*0.3, type:'s'};
        layer.electronObjects.push(ed); rec.electrons.push(ed);
      }
    } else {
      const cloud=makeCloudShell(r, color, sphericalCloudCount((count*480+900)*cloudDensity, r), 0.55);
      layer.group.add(cloud); layer.orbitalObjects.push(cloud); rec.meshes.push(cloud);
    }
  } else if(type==='f'){
    if(mode==='lines'){
      const sphere=makeWireSphereGrid(r, color, lineOpacity(0.26));
      const ringGeo=new THREE.TorusGeometry(r, 0.025, 6, 48);
      const ringMat=new THREE.MeshBasicMaterial({color, transparent:true, opacity:lineOpacity(0.4)});
      const ring=new THREE.Mesh(ringGeo, ringMat);
      layer.group.add(sphere); layer.group.add(ring);
      layer.orbitalObjects.push(sphere, ring); rec.meshes.push(sphere, ring);
      for(let i=0;i<count;i++){
        const e=makeElectron(color);
        layer.group.add(e);
        const ed={mesh:e, orb, r, theta:Math.random()*Math.PI*2, phi:Math.random()*Math.PI, speed:0.3+Math.random()*0.2, type:'s'};
        layer.electronObjects.push(ed); rec.electrons.push(ed);
      }
    } else {
      const cloud=makeCloudShell(r, color, sphericalCloudCount((count*200+400)*cloudDensity, r), 0.55);
      layer.group.add(cloud); layer.orbitalObjects.push(cloud); rec.meshes.push(cloud);
    }
  } else if(type==='p'){
    const axisMap={x:new THREE.Vector3(1,0,0), y:new THREE.Vector3(0,1,0), z:new THREE.Vector3(0,0,1)};
    const axis=axisMap[sub];
    const c=SUB_COLORS[sub];
    if(mode==='lines'){
      for(let s of [-1,1]){
        const lobe=makeTeardropWire(axis, s, r, c, lineOpacity(0.32));
        layer.group.add(lobe); layer.orbitalObjects.push(lobe); rec.meshes.push(lobe);
      }
      for(let k=0;k<2;k++){
        const e=makeElectron(c);
        layer.group.add(e);
        const sign=k===0?1:-1;
        const ed={mesh:e, orb, r:r*0.6, theta:Math.random()*Math.PI*2, phi:Math.PI/2, speed:0.5+Math.random()*0.3, type:'p', axis, sign};
        layer.electronObjects.push(ed); rec.electrons.push(ed);
      }
    } else {
      for(let s of [-1,1]){
        const cloud=makeTeardropCloud(axis, s, r, c, Math.floor(750*cloudDensity));
        layer.group.add(cloud); layer.orbitalObjects.push(cloud); rec.meshes.push(cloud);
      }
    }
  } else if(type==='d'){
    const def=D_SUB_DEFS.find(d=>d.key===sub);
    const c=D_SUB_COLORS[sub];
    if(mode==='lines'){
      const shape=buildDShapeWire(def, r, c);
      layer.group.add(shape); layer.orbitalObjects.push(shape); rec.meshes.push(shape);
      for(let k=0;k<2;k++){
        const e=makeElectron(c);
        layer.group.add(e);
        const ed={mesh:e, orb, r:r*0.7, theta:Math.random()*Math.PI*2, phi:Math.random()*Math.PI, speed:0.35+Math.random()*0.25, type:'s'};
        layer.electronObjects.push(ed); rec.electrons.push(ed);
      }
    } else {
      const cloud=buildDShapeCloud(def, r, c, Math.floor(1500*cloudDensity));
      layer.group.add(cloud); layer.orbitalObjects.push(cloud); rec.meshes.push(cloud);
    }
  }
}


// ── VIEWER FACTORY ───────────────────────────────────────────────────────────

function createViewer(canvasEl, paneEl){
  const renderer=new THREE.WebGLRenderer({canvas:canvasEl,antialias:true,alpha:true});
  renderer.setPixelRatio(window.devicePixelRatio);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(50,2,0.1,1000);
  camera.position.set(0,0,12);
  const atomGroup=new THREE.Group();
  scene.add(atomGroup);

  const viewer={
    canvas:canvasEl, pane:paneEl, renderer, scene, camera, atomGroup,
    layers:[], currentLayer:null, currentElement:null, currentCfg:{},
    rotX:0.3, rotY:0, isDragging:false, prevMouse:{x:0,y:0}
  };

  function resize(){
    const w=paneEl.clientWidth, h=paneEl.clientHeight;
    if(w<2||h<2) return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  }
  viewer.resize=resize;
  resize();
  // Debounced via rAF: calling resize() straight from the observer callback
  // is what triggers the browser's "ResizeObserver loop completed with
  // undelivered notifications" warning (and can cause a delivery to be
  // dropped). Deferring one frame avoids that entirely.
  let resizePending=false;
  new ResizeObserver(()=>{
    if(resizePending) return;
    resizePending=true;
    requestAnimationFrame(()=>{ resizePending=false; resize(); });
  }).observe(paneEl);
  // Fallback: if the pane was still hidden or unlaid-out at creation time,
  // the calls above measured 0 and skipped. A couple of short-delay retries
  // catch that without relying solely on a visibility change to be detected.
  setTimeout(resize, 50);
  setTimeout(resize, 300);

  canvasEl.addEventListener('mousedown', e=>{viewer.isDragging=true; viewer.prevMouse={x:e.clientX,y:e.clientY};});
  window.addEventListener('mouseup', ()=>{viewer.isDragging=false;});
  canvasEl.addEventListener('mousemove', e=>{
    if(!viewer.isDragging) return;
    const dx=e.clientX-viewer.prevMouse.x, dy=e.clientY-viewer.prevMouse.y;
    viewer.rotY+=dx*0.005; viewer.rotX+=dy*0.005;
    viewer.prevMouse={x:e.clientX,y:e.clientY};
  });
  canvasEl.addEventListener('wheel', e=>{
    e.preventDefault();
    viewer.camera.position.z=Math.max(3,Math.min(30,viewer.camera.position.z+e.deltaY*0.01));
  }, {passive:false});

  // Removes every atom layer from this viewer (used when switching to a new atom).
  viewer.clearAllLayers=function(){
    for(let layer of viewer.layers){
      layer.dead=true;
      viewer.atomGroup.remove(layer.group);
    }
    viewer.layers=[];
    viewer.currentLayer=null;
  };

  viewer.newLayer=function(){
    viewer.clearAllLayers();
    const group=new THREE.Group();
    viewer.atomGroup.add(group);
    const layer={group, nucleus:null, orbitalObjects:[], electronObjects:[], flights:[], rendered:{}, buildGen:0, dead:false};
    viewer.layers.push(layer);
    viewer.currentLayer=layer;
    return layer;
  };

  // Builds the nucleus by having each proton (red) / neutron (blue) fly in
  // one at a time from a random point outside, converging to its resting spot.
  viewer.buildNucleus=function(Z, layer){
    const N=getNeutronCount(Z);
    const total=Z+N;
    const nucRadius=0.16+Math.cbrt(total)*0.05;

    const nucGroup=new THREE.Group();
    layer.group.add(nucGroup);
    layer.nucleus=nucGroup;

    const haloGeo=new THREE.SphereGeometry(nucRadius+0.1,16,16);
    const haloMat=new THREE.MeshBasicMaterial({color:0x4488ff,transparent:true,opacity:visualStyle==='flat'?0.05:0.1});
    nucGroup.add(new THREE.Mesh(haloGeo,haloMat));

    const queue=[];
    for(let i=0;i<Z;i++) queue.push('p');
    for(let i=0;i<N;i++) queue.push('n');
    for(let i=queue.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [queue[i],queue[j]]=[queue[j],queue[i]];
    }

    const nucleonGeo=new THREE.SphereGeometry(visualStyle==='flat'?0.075:0.05,9,9);
    const pMat=new THREE.MeshBasicMaterial({color:visualStyle==='flat'?0xff2e88:0xff4444});
    const nMat=new THREE.MeshBasicMaterial({color:visualStyle==='flat'?0x2ec4ff:0x4488ff});

    layer.flights=[];
    layer.nucleusTotal=total;
    layer.nucleusLanded=0;
    layer.nucleusReady=false;
    const totalFormMs=2600;
    const spawnInterval=Math.max(10,Math.min(70,totalFormMs/Math.max(1,total)));
    const flightDuration=420;
    let idx=0;
    (function spawnNext(){
      if(layer.dead) return;
      if(idx>=queue.length) return;
      const type=queue[idx++];
      const mesh=new THREE.Mesh(nucleonGeo, type==='p'?pMat:nMat);
      mesh.userData.nucleonType=type;

      const rr=nucRadius*0.85*Math.cbrt(Math.random());
      const theta=Math.random()*Math.PI*2, phi=Math.acos(2*Math.random()-1);
      const endPos=new THREE.Vector3(rr*Math.sin(phi)*Math.cos(theta), rr*Math.sin(phi)*Math.sin(theta), rr*Math.cos(phi));

      // The "empty space" nucleons fly in from scales WITH the nucleus itself
      // (proportional to nucRadius), so a tiny nucleus (e.g. hydrogen) forms
      // in a compact, proportionally small volume instead of a fixed-size void.
      const dist=nucRadius*(3+Math.random()*3);
      const theta2=Math.random()*Math.PI*2, phi2=Math.acos(2*Math.random()-1);
      const startPos=new THREE.Vector3(dist*Math.sin(phi2)*Math.cos(theta2), dist*Math.sin(phi2)*Math.sin(theta2), dist*Math.cos(phi2));

      mesh.position.copy(startPos);
      nucGroup.add(mesh);
      layer.flights.push({mesh, start:startPos, end:endPos, startTime:performance.now(), duration:flightDuration});
      setTimeout(spawnNext, spawnInterval);
    })();
  };


  // Core engine: syncs this layer's 3D parts to an EXPLICIT desired-keys set.
  // Only added/removed parts are touched — everything already on screen stays
  // completely undisturbed. Used both by rebuildCurrentLayer (DOM-checkbox
  // driven) and by anything that needs to restore a known set of parts without
  // touching the sidebar (style changes, compare-mode tab restores).
  // staggerCloud=true reveals cloud parts one at a time too (used on atom switch).
  viewer.applyPartsSet=function(want, staggerCloud){
    const layer=viewer.currentLayer;
    if(!layer || !layer.nucleusReady) return;

    layer.buildGen++; // always invalidate any in-flight staggered queue from a previous call
    const myGen=layer.buildGen;

    const have=new Set(Object.keys(layer.rendered));
    for(let key of have){
      if(!want.has(key)) removePart(layer, key);
    }
    const toAdd=[...want].filter(k=>!have.has(k));
    if(toAdd.length===0) return;

    if(viewMode==='lines'){
      const queue=toAdd;
      (function next(){
        if(layer.dead||myGen!==layer.buildGen) return;
        if(queue.length===0) return;
        const key=queue.shift();
        addPart(layer, key, 'lines', viewer.currentCfg);
        setTimeout(next, 220);
      })();
    } else if(staggerCloud){
      const queue=toAdd;
      (function next(){
        if(layer.dead||myGen!==layer.buildGen) return;
        if(queue.length===0) return;
        const key=queue.shift();
        addPart(layer, key, viewMode, viewer.currentCfg);
        setTimeout(next, 200);
      })();
    } else {
      for(let key of toAdd) addPart(layer, key, viewMode, viewer.currentCfg);
    }
  };

  viewer.rebuildCurrentLayer=function(staggerCloud){
    if(!viewer.currentLayer || !viewer.currentElement) return;
    viewer.applyPartsSet(desiredParts(getVisibility()), staggerCloud);
  };

  viewer.selectElement=function(n){
    const el=ELEMENTS.find(e=>e.n===n);
    if(!el) return;
    viewer.currentElement=el;
    viewer.currentCfg=getConfig(n);

    const layer=viewer.newLayer();
    layer.restoreKeys=null; // null → brand-new atom, default all-checked once ready
    if(bondMode && (viewer===viewerA||viewer===viewerB)) layer.group.visible=false;
    viewer.buildNucleus(n, layer);

    if(activeViewer===viewer){
      refreshSidebarInfo(viewer);
      updateOrbitalList(viewer.currentCfg, null); // null → brand-new atom, default all-checked
      document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      const firstFilterBtn=document.querySelector('.filter-btn');
      if(firstFilterBtn) firstFilterBtn.classList.add('active');
    }

    // Orbitals only start fading in once the nucleus has fully formed
    // (see the flight-landing check in viewer.render below).

    if(bondMode && (viewer===viewerA||viewer===viewerB)){
      buildBondLayer();
      updateCompatibleHighlight(viewer.currentCfg);
    }
  };

  // Rebuilds this viewer's atom from scratch (new nucleus-formation animation)
  // using the CURRENT visual style, restoring exactly the orbitals that were
  // visible before — kept for cases that do want a full replay.
  viewer.rebuildWithCurrentStyle=function(){
    if(!viewer.currentElement) return;
    const keep=renderedKeysOf(viewer);
    const n=viewer.currentElement.n;
    const layer=viewer.newLayer();
    layer.restoreKeys=keep;
    if(bondMode && (viewer===viewerA||viewer===viewerB)) layer.group.visible=false;
    viewer.buildNucleus(n, layer);
  };

  // Switches Realistico ⇄ Flat instantly, in place — same nucleus, same
  // orbitals, same electrons, just resized/recolored to match the new
  // style. No fly-in, no re-formation animation.
  viewer.restyleInPlace=function(){
    const layer=viewer.currentLayer;
    if(!layer || !viewer.currentElement) return;

    if(layer.nucleus){
      const nucleonGeo=new THREE.SphereGeometry(visualStyle==='flat'?0.075:0.05,9,9);
      const pMat=new THREE.MeshBasicMaterial({color:visualStyle==='flat'?0xff2e88:0xff4444});
      const nMat=new THREE.MeshBasicMaterial({color:visualStyle==='flat'?0x2ec4ff:0x4488ff});
      for(const child of layer.nucleus.children){
        if(child.userData && child.userData.nucleonType){
          child.geometry.dispose();
          child.geometry=nucleonGeo;
          child.material=child.userData.nucleonType==='p'?pMat:nMat;
        } else {
          // the halo sphere
          child.material.opacity=visualStyle==='flat'?0.05:0.1;
        }
      }
    }

    const tube=visualStyle==='flat'?0.03:0.015;
    for(const key of Object.keys(layer.rendered)){
      const rec=layer.rendered[key];
      const [orb,sub]=key.split('|');
      const color=(typeof freeChoiceMode!=='undefined' && freeChoiceMode && sub && SUB_COLORS[sub]!==undefined) ? SUB_COLORS[sub] : (ORB_COLORS[orb]||0xffffff);
      const ring=rec.meshes[0];
      // Only Bohr-mode rings are torus/tube shapes that need regeometrizing
      // for the new tube thickness — Lines/Cloud shapes (wire spheres,
      // teardrops, point clouds) don't change shape between styles, only
      // their opacity, which is updated below regardless of mode.
      if(ring && viewMode==='bohr'){
        let newGeo;
        if(orb[1]==='p' && sub){
          const idx=P_SUBS.indexOf(sub);
          const r=bohrKeyRadius(key);
          const rot=idx*(Math.PI/3);
          const a=r, gap=Math.max(0.1, r*0.07);
          const cosr=Math.cos(rot), sinr=Math.sin(rot);
          const segs=120, pts=[];
          for(let i=0;i<=segs;i++){
            const p=lemniscatePoint(i/segs, a, gap);
            pts.push(new THREE.Vector3(p.x*cosr-p.y*sinr, p.x*sinr+p.y*cosr, 0));
          }
          const curve=new THREE.CatmullRomCurve3(pts, true);
          newGeo=new THREE.TubeGeometry(curve, 160, tube, 8, true);
        } else {
          const r=bohrKeyRadius(key);
          newGeo=new THREE.TorusGeometry(r, tube, 8, 64);
        }
        ring.geometry.dispose();
        ring.geometry=newGeo;
        ring.material.opacity=lineOpacity(0.5);
      }
      const eSize=visualStyle==='flat'?0.1:0.06;
      for(const ed of rec.electrons){
        ed.mesh.geometry.dispose();
        ed.mesh.geometry=new THREE.SphereGeometry(eSize,10,10);
        ed.mesh.material.color.set(color);
      }
    }
  };


  viewer.render=function(){
    if(!viewer.isDragging && autoRotate) viewer.rotY+=0.002;
    viewer.atomGroup.rotation.x=viewer.rotX;
    viewer.atomGroup.rotation.y=viewer.rotY;

    const now=performance.now();
    for(let layer of viewer.layers){
      if(layer.flights && layer.flights.length){
        for(let i=layer.flights.length-1;i>=0;i--){
          const f=layer.flights[i];
          const t=(now-f.startTime)/f.duration;
          if(t>=1){
            f.mesh.position.copy(f.end);
            layer.flights.splice(i,1);
            layer.nucleusLanded++;
            if(!layer.nucleusReady && layer.nucleusLanded>=layer.nucleusTotal){
              layer.nucleusReady=true;
              if(layer.restoreKeys){
                viewer.applyPartsSet(layer.restoreKeys, true);
              } else {
                viewer.rebuildCurrentLayer(true);
              }
            }
            continue;
          }
          const te=1-Math.pow(1-t,3);
          f.mesh.position.lerpVectors(f.start,f.end,te);
        }
      }
      for(let ed of layer.electronObjects){
        if(ed.type==='s'){
          ed.theta+=ed.speed*0.02; ed.phi+=ed.speed*0.013;
          const r=ed.r;
          ed.mesh.position.set(r*Math.sin(ed.phi)*Math.cos(ed.theta), r*Math.sin(ed.phi)*Math.sin(ed.theta), r*Math.cos(ed.phi));
        } else if(ed.type==='p'){
          ed.theta+=ed.speed*0.025;
          const pos=ed.axis.clone().multiplyScalar(ed.sign*ed.r*Math.abs(Math.cos(ed.theta)));
          const perp=new THREE.Vector3(ed.axis.y, ed.axis.z, ed.axis.x);
          pos.addScaledVector(perp, ed.r*0.4*Math.sin(ed.theta));
          ed.mesh.position.copy(pos);
        } else if(ed.type==='bohr'){
          if(!electronsFrozen) ed.theta+=ed.speed*0.02;
          ed.mesh.position.set(ed.r*Math.cos(ed.theta), ed.r*Math.sin(ed.theta), 0);
        } else if(ed.type==='bohr8'){
          if(!electronsFrozen) ed.t+=ed.speed*0.01;
          const p=lemniscatePoint(((ed.t%1)+1)%1, ed.a, ed.gap);
          const cosr=Math.cos(ed.rot), sinr=Math.sin(ed.rot);
          ed.mesh.position.set(p.x*cosr-p.y*sinr, p.x*sinr+p.y*cosr, 0);
        }
        if(ed.pulsing){
          const amp=ed.pulseAmp!==undefined?ed.pulseAmp:0.35;
          const base=ed.pulseBase!==undefined?ed.pulseBase:1;
          const s=base+amp*Math.sin(performance.now()*0.011);
          ed.mesh.scale.setScalar(s);
        }
      }
    }
    viewer.renderer.render(viewer.scene, viewer.camera);
  };

  return viewer;
}

function getNeutronCount(Z){
  if(Z===1) return 0; // protium, the common case, has no neutron
  const ratio=1.0+0.6*(Z/118);
  return Math.round(Z*ratio);
}


// ── COLOR / CONTRAST UTILITIES ────────────────────────────────────────────

function hexToRgb(hex){
  const v=parseInt(hex.slice(1),16);
  return [(v>>16)&255,(v>>8)&255,v&255];
}

function rgbToHex(r,g,b){
  return '#'+[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');
}

function shadeColor(hex, amt){
  const [r,g,b]=hexToRgb(hex);
  return rgbToHex(r+amt,g+amt,b+amt);
}

function relLuminance(hex){
  const [r,g,b]=hexToRgb(hex).map(v=>v/255);
  const lin=c=> c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4);
  return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
}

function hexToHsl(hex){
  const r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){
    const d=max-min;
    s=l>0.5 ? d/(2-max-min) : d/(max+min);
    if(max===r) h=(g-b)/d+(g<b?6:0);
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h*=60;
  }
  return [h,s,l];
}

function hslToHex(h,s,l){
  h=((h%360)+360)%360/360;
  let r,g,b;
  if(s===0){ r=g=b=l; }
  else{
    const hue2rgb=(p,q,t)=>{
      if(t<0)t+=1; if(t>1)t-=1;
      if(t<1/6) return p+(q-p)*6*t;
      if(t<1/2) return q;
      if(t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q=l<0.5?l*(1+s):l+s-l*s;
    const p=2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  const toHex=x=>Math.round(Math.max(0,Math.min(1,x))*255).toString(16).padStart(2,'0');
  return '#'+toHex(r)+toHex(g)+toHex(b);
}

function nearestPaletteColor(targetHue, exclude){
  let best=null, bestDiff=Infinity;
  for(const hex of BG_PALETTE){
    if(hex==='#ffffff'||hex==='#000000') continue;
    if(exclude && exclude.includes(hex)) continue;
    const [h]=hexToHsl(hex);
    let diff=Math.abs(h-targetHue); diff=Math.min(diff,360-diff);
    if(diff<bestDiff){ bestDiff=diff; best=hex; }
  }
  return best;
}

function muteColor(hex){
  const [h,s,l]=hexToHsl(hex);
  return hslToHex(h, s*0.7, Math.min(0.75, l*0.75+0.22));
}

// Picks a gray that reads clearly against whatever background is currently
// active. Rather than two fixed options, this computes a gray lightness
// meaningfully offset from the background's own — dark backgrounds get a
// near-white gray, light backgrounds get a near-black one, and anything in
// between gets whatever offset (in the right direction) keeps a solid gap.
// Reads --flat-bg from the document, so it works on any page using the
// shared applyBgColor() theme system.
function contrastingGrayColor(){
  const bgHex=(getComputedStyle(document.documentElement).getPropertyValue('--flat-bg')||'#0e6b78').trim();
  const [,,l]=hexToHsl(bgHex);
  const targetL = l>0.5 ? Math.max(0.05, l-0.6) : Math.min(0.95, l+0.6);
  const grayHex=hslToHex(0, 0, targetL);
  return parseInt(grayHex.slice(1), 16);
}

// Draws one "not yet occupied" orbital as a gray dashed outline — a p
// sub-level (figure-8, matching addBohrOrbitalRing's own shape) or a plain
// s-type ring. Used to preview where an electron could go next.
function buildEmptyPOrbital(layer, orb, subIdx, color){
  const sub=P_SUBS[subIdx];
  const key=orb+'|'+sub;
  const r=bohrKeyRadius(key);
  const rot=subIdx*(Math.PI/3);
  const a=r, gap=Math.max(0.1, r*0.07);
  const cosr=Math.cos(rot), sinr=Math.sin(rot);
  const segs=120, pts=[];
  for(let j=0;j<=segs;j++){
    const p=lemniscatePoint(j/segs, a, gap);
    pts.push(new THREE.Vector3(p.x*cosr-p.y*sinr, p.x*sinr+p.y*cosr, 0));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  const mat=new THREE.LineDashedMaterial({color, dashSize:0.16, gapSize:0.11, transparent:true, opacity:0});
  const line=new THREE.Line(geo, mat);
  line.computeLineDistances();
  layer.group.add(line);
  return {mesh:line, mat, group:layer.group, key, type:'p', subIdx, a, gap, rot};
}

function buildEmptySOrbital(layer, orb, color){
  const r=bohrKeyRadius(orb);
  const segs=80, pts=[];
  for(let j=0;j<=segs;j++){
    const t=j/segs*Math.PI*2;
    pts.push(new THREE.Vector3(r*Math.cos(t), r*Math.sin(t), 0));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  const mat=new THREE.LineDashedMaterial({color, dashSize:0.16, gapSize:0.11, transparent:true, opacity:0});
  const line=new THREE.Line(geo, mat);
  line.computeLineDistances();
  layer.group.add(line);
  return {mesh:line, mat, group:layer.group, key:orb, type:'s', r};
}

const BG_PALETTE=['#0e6b78','#c69595','#c6b595','#97b9ad','#95a0c6','#baa0ba','#92bbad','#96bbc1','#a297c4','#c398ae','#c5ab96','#ffffff','#000000'];

// Applies a flat-style theme color: sets the CSS custom properties every
// themed page reads from (--flat-bg/-panel/-border/-text/-text-dim), updates
// which swatch (if any, matching the .bg-swatch convention) shows as
// selected, and remembers the choice in localStorage under the given key so
// a page reload (e.g. a "start over" button) can restore it instead of
// always resetting to the default.
function applyBgColor(hex, storageKey){
  const light=relLuminance(hex)>0.55;
  const panel=shadeColor(hex, light?18:26);
  const border=shadeColor(hex, light?-30:38);
  const root=document.documentElement.style;
  root.setProperty('--flat-bg', hex);
  root.setProperty('--flat-panel', light ? shadeColor(hex,-10) : panel);
  root.setProperty('--flat-border', border);
  root.setProperty('--flat-text', light ? '#1a2b2e' : '#ffffff');
  root.setProperty('--flat-text-dim', light ? '#3d5052' : '#dffcff');
  root.setProperty('--flat-thumb', light ? '#000000' : '#ffffff');
  root.setProperty('--flat-thumb-border', light ? '#ffffff' : '#000000');
  document.querySelectorAll('.bg-swatch').forEach(sw=>{
    sw.classList.toggle('bg-swatch-selected', sw.dataset.hex.toLowerCase()===hex.toLowerCase());
  });
  if(storageKey){
    try{ localStorage.setItem(storageKey, hex); }catch(e){}
  }
}

// Builds the row of clickable background swatches into containerEl (from
// BG_PALETTE), wires each to applyBgColor, and restores the last-chosen
// color from localStorage if present — otherwise falls back to defaultHex.
function buildBgSwatches(containerEl, storageKey, defaultHex){
  for(let hex of BG_PALETTE){
    const sw=document.createElement('div');
    sw.className='bg-swatch';
    sw.style.background=hex;
    sw.dataset.hex=hex;
    sw.title=hex;
    sw.onclick=()=>applyBgColor(hex, storageKey);
    containerEl.appendChild(sw);
  }
  let savedHex=null;
  try{ savedHex=localStorage.getItem(storageKey); }catch(e){}
  applyBgColor(savedHex && BG_PALETTE.includes(savedHex) ? savedHex : (defaultHex||BG_PALETTE[0]), storageKey);
}


// ── ANIMATION HELPERS ─────────────────────────────────────────────────────

function fadeMaterialsOpacity(mats, from, to, duration, onDone){
  const start=performance.now();
  (function step(){
    const now=performance.now();
    const t=Math.min(1,(now-start)/duration);
    const val=from+(to-from)*t;
    for(const m of mats) m.opacity=val;
    if(t<1) requestAnimationFrame(step);
    else if(onDone) onDone();
  })();
}

function blinkMaterialsTwice(mats, finalOpacity, onDone){
  const steps=[
    {to:1, dur:180},
    {to:0.15, dur:150},
    {to:1, dur:180},
    {to:0.15, dur:150},
    {to:finalOpacity, dur:400}
  ];
  let i=0;
  (function next(){
    if(i>=steps.length){ if(onDone) onDone(); return; }
    const step=steps[i++];
    const from=mats.length?mats[0].opacity:0;
    fadeMaterialsOpacity(mats, from, step.to, step.dur, next);
  })();
}

// Moves a mesh in a straight line from one point to another with ease-in-out
// timing — a simpler alternative to the orbital-following electron motion
// used elsewhere, for stylized diagrams where a literal straight path (not
// a physically-accurate curve) tells the story better. Returns a cancel
// function; calling it stops the motion where it currently stands.
function animateLinearMove(mesh, fromPos, toPos, duration, onDone){
  const start=performance.now();
  let cancelled=false;
  (function step(){
    if(cancelled) return;
    const now=performance.now();
    const t=Math.min(1,(now-start)/duration);
    const ease=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    mesh.position.copy(fromPos.clone().lerp(toPos, ease));
    if(t<1) requestAnimationFrame(step);
    else if(onDone) onDone();
  })();
  return ()=>{ cancelled=true; };
}


// ── LIGHT RAY (dashed, moving, genuinely thick) ──────────────────────────────
// WebGL ignores line-width entirely on native THREE.Line, so real 3D tube
// segments are the only reliable way to get genuine thickness. Rebuilding
// the small dash segments every frame with a shifting phase gives the
// "marching" moving-dash look on top of that real thickness.
// Relies on a global `viewerA` (see file header).

const RAY_RADIUS=0.06, RAY_DASH_LEN=0.18, RAY_GAP_LEN=0.13, RAY_PHASE_SPEED=0.05;
const OUT_RAY_LEN=4.5, OUT_RAY_GROW_MS=1300, OUT_RAY_DETACH_SPEED=1.5, OUT_RAY_LIFETIME_MS=3200;
let incomingRayRec=null, incomingRayState=null;
let outgoingRays=[]; // list of {rec, state} — supports multiple concurrent outward rays

function makeRayGroup(radius){
  const layer=viewerA.currentLayer;
  const group=new THREE.Group();
  layer.group.add(group);
  return {group, opacity:0, phase:0, radius:radius||RAY_RADIUS};
}

function setRayGeometry(rec, startPos, endPos){
  for(const child of rec.group.children.slice()){
    child.geometry.dispose();
    rec.group.remove(child);
  }
  const totalLen=startPos.distanceTo(endPos);
  if(totalLen<0.02) return;
  const dir=endPos.clone().sub(startPos).normalize();
  const period=RAY_DASH_LEN+RAY_GAP_LEN;
  const offset=((rec.phase%period)+period)%period;
  let pos=-offset, on=true;
  while(pos<totalLen){
    const segLen=on?RAY_DASH_LEN:RAY_GAP_LEN;
    const segEnd=pos+segLen;
    if(on){
      const clampedStart=Math.max(0,pos), clampedEnd=Math.min(totalLen,segEnd);
      if(clampedEnd>clampedStart+0.005){
        const p0=startPos.clone().addScaledVector(dir, clampedStart);
        const p1=startPos.clone().addScaledVector(dir, clampedEnd);
        const geo=new THREE.TubeGeometry(new THREE.LineCurve3(p0,p1), 2, rec.radius, 8, false);
        const mat=new THREE.MeshBasicMaterial({color:0xffd700, transparent:true, opacity:rec.opacity});
        rec.group.add(new THREE.Mesh(geo,mat));
      }
    }
    pos=segEnd; on=!on;
  }
}

function removeRayRec(rec){
  if(!rec) return;
  const layer=viewerA.currentLayer;
  for(const child of rec.group.children.slice()) child.geometry.dispose();
  if(layer) layer.group.remove(rec.group);
}

function fadeRayOpacity(rec, from, to, duration, onDone){
  const start=performance.now();
  rec.opacity=from;
  (function step(){
    const now=performance.now();
    const t=Math.min(1,(now-start)/duration);
    rec.opacity=from+(to-from)*t;
    for(const child of rec.group.children) child.material.opacity=rec.opacity;
    if(t<1) requestAnimationFrame(step);
    else if(onDone) onDone();
  })();
}

function hideLightRayInstant(){
  removeRayRec(incomingRayRec); incomingRayRec=null; incomingRayState=null;
  for(const entry of outgoingRays) removeRayRec(entry.rec);
  outgoingRays=[];
}

function showLightRayTo(targetPos, onArrive, radius, startPos){
  if(!startPos){
    const dir=new THREE.Vector3(Math.cos(Math.PI/4), Math.sin(Math.PI/4), 0);
    startPos=targetPos.clone().add(dir.clone().multiplyScalar(4.2));
  }
  incomingRayRec=makeRayGroup(radius);
  incomingRayState={startPos, targetPos, growStart:performance.now(), onArrive, arrived:false};
  fadeRayOpacity(incomingRayRec, 0, 0.95, 300);
}

function showOutwardRayFrom(originPos, radius, direction){
  const dir=direction ? direction.clone().normalize() : originPos.clone().normalize();
  const rec=makeRayGroup(radius);
  const state={anchor:originPos.clone(), dir, growStart:performance.now(), stage:'growing', lastTime:performance.now()};
  const entry={rec, state};
  outgoingRays.push(entry);
  fadeRayOpacity(rec, 0, 0.95, 300);

  // Manages its own full visible lifetime — grows, flies free, then fades
  // and removes itself — independent of whatever the electron does next, so
  // it never gets cut short right as the electron happens to land somewhere.
  // Tracked as its own list entry, so firing another ray in the meantime
  // never causes this one to be skipped/orphaned.
  setTimeout(()=>{
    if(!outgoingRays.includes(entry)) return; // already cleaned up (e.g. hideLightRayInstant)
    fadeRayOpacity(rec, rec.opacity, 0, 500, ()=>{
      const idx=outgoingRays.indexOf(entry);
      if(idx>=0){
        removeRayRec(rec);
        outgoingRays.splice(idx,1);
      }
    });
  }, OUT_RAY_LIFETIME_MS);
}

function updateLightRayTracking(){
  const now=performance.now();

  if(incomingRayRec && incomingRayState){
    incomingRayRec.phase=(incomingRayRec.phase||0)+RAY_PHASE_SPEED;
    const s=incomingRayState;
    if(!s.arrived){
      const t=Math.min(1,(now-s.growStart)/1300);
      const tip=s.startPos.clone().lerp(s.targetPos, t);
      setRayGeometry(incomingRayRec, s.startPos, tip);
      if(t>=1){
        s.arrived=true;
        if(s.onArrive) s.onArrive();
      }
    } else {
      setRayGeometry(incomingRayRec, s.startPos, s.targetPos);
    }
  }

  for(const entry of outgoingRays){
    const rec=entry.rec, s=entry.state;
    rec.phase=(rec.phase||0)+RAY_PHASE_SPEED;
    if(s.stage==='growing'){
      const t=Math.min(1, (now-s.growStart)/OUT_RAY_GROW_MS);
      const tip=s.anchor.clone().add(s.dir.clone().multiplyScalar(OUT_RAY_LEN*t));
      setRayGeometry(rec, s.anchor, tip);
      if(t>=1){ s.stage='detached'; s.lastTime=now; }
    } else {
      const dt=Math.min(0.05, (now-s.lastTime)/1000);
      s.lastTime=now;
      s.anchor.addScaledVector(s.dir, OUT_RAY_DETACH_SPEED*dt);
      const tip=s.anchor.clone().add(s.dir.clone().multiplyScalar(OUT_RAY_LEN));
      setRayGeometry(rec, s.anchor, tip);
    }
  }
}

function injectFloatingLabelCSS(){
  // Loaded here (not just linked in <head>) so any project using this gets
  // the font automatically, without needing its own <link> tag.
  const fontLink=document.createElement('link');
  fontLink.rel='stylesheet';
  fontLink.href='https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap';
  document.head.appendChild(fontLink);

  const css = `
.floating-label{position:absolute;opacity:0;transition:opacity 0.6s ease,left 0.6s ease,top 0.6s ease;pointer-events:none;z-index:6;font-family:'Patrick Hand',cursive;font-weight:400;letter-spacing:0.02em;transform:translate(-50%,0);animation:floatBob 2.6s ease-in-out infinite}
@keyframes floatBob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-8px)}}
`;
  const styleEl=document.createElement('style');
  styleEl.textContent=css;
  document.head.appendChild(styleEl);
}

// left/top are optional (e.g. "62%") — when given, the label also moves
// there. If the label is already visible, the old text fades out first and
// the new one only fades in once it's gone, so consecutive phrases never
// overlap.
function showFloatingLabel(id, text, color, left, top){
  const el=document.getElementById(id);
  if(!el) return;
  const bgHex=(getComputedStyle(document.documentElement).getPropertyValue('--flat-bg')||'#0e6b78').trim();
  const [,,l]=hexToHsl(bgHex);
  const autoColor = l>0.55 ? '#000000' : '#ffffff'; // dark background -> white text, light background -> black text
  const apply=()=>{
    if(text!==undefined) el.innerHTML=text;
    el.style.color=autoColor;
    if(left!==undefined) el.style.left=left;
    if(top!==undefined) el.style.top=top;
    el.style.opacity='1';
  };
  if(el.style.opacity==='1'){
    el.style.opacity='0';
    setTimeout(apply, 550);
  } else {
    apply();
  }
}

function hideFloatingLabel(id){
  const el=document.getElementById(id);
  if(el) el.style.opacity='0';
}

// ── 2D SVG ILLUSTRATIONS ──────────────────────────────────────────────────────

// Builds the "head in profile, with eye and half-visible brain" illustration
// used by the Colori project (and reusable anywhere else that needs it) —
// every shape and position in here was verified point-by-point to nest
// correctly (nothing crosses an edge it shouldn't). Returns a ready-to-insert
// SVG markup string; width/height set the rendered size, the internal
// proportions (viewBox 0 0 400 440) stay fixed.
function buildEyeHeadSVG(width, height){
  width = width || 320;
  height = height || Math.round(width*440/400);
  return `<svg viewBox="0 0 400 440" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="125.4" y="240" width="49.199999999999996" height="56.57999999999999" fill="#f4c9a5"/>
    <path d="M163.8,240.0 L174.6,240.0 L174.6,296.6 L163.8,296.6 Z" fill="#dba879" opacity="0.6"/>
    <path d="M73.4,98.8 L73.4,168.8 L60.7,168.8 Q54.7,168.8 56.2,163.0 Z" fill="#f4c9a5"/>
    <ellipse cx="150" cy="140" rx="82" ry="115" fill="#f4c9a5"/>
    <path d="M171.2,28.9 L176.4,31.1 L181.4,33.8 L186.3,36.9 L191.0,40.4 L195.6,44.4 L199.9,48.8 L204.1,53.5 L208.0,58.7 L211.7,64.2 L215.1,70.0 L218.2,76.1 L221.0,82.5 L223.5,89.1 L225.8,96.0 L227.6,103.0 L229.2,110.2 L230.4,117.6 L231.3,125.0 L231.8,132.5 L232.0,140.0 L231.8,147.5 L231.3,155.0 L230.4,162.4 L229.2,169.8 L227.6,177.0 L225.8,184.0 L223.5,190.9 L221.0,197.5 L218.2,203.9 L215.1,210.0 L211.7,215.8 L208.0,221.3 L204.1,226.5 L199.9,231.2 L195.6,235.6 L191.0,239.6 L186.3,243.1 L181.4,246.2 L176.4,248.9 L171.2,251.1 L171.2,251.1 L176.1,248.0 L180.7,244.5 L185.0,240.6 L189.1,236.4 L193.0,231.8 L196.6,226.9 L199.9,221.7 L203.0,216.3 L205.8,210.7 L208.3,204.8 L210.6,198.8 L212.6,192.6 L214.4,186.3 L215.9,179.9 L217.2,173.4 L218.2,166.8 L219.0,160.2 L219.5,153.5 L219.9,146.7 L220.0,140.0 L219.9,133.3 L219.5,126.5 L219.0,119.8 L218.2,113.2 L217.2,106.6 L215.9,100.1 L214.4,93.7 L212.6,87.4 L210.6,81.2 L208.3,75.2 L205.8,69.3 L203.0,63.7 L199.9,58.3 L196.6,53.1 L193.0,48.2 L189.1,43.6 L185.0,39.4 L180.7,35.5 L176.1,32.0 L171.2,28.9 Z" fill="#dba879" opacity="0.6"/>
    <path d="M155.7,115.4 L156.9,113.2 L158.3,111.3 L159.8,109.6 L161.4,108.2 L163.2,107.2 L165.0,106.4 L166.9,106.1 L168.8,106.0 L170.7,106.4 L172.5,107.0 L174.3,108.0 L175.9,109.3 L177.5,111.0 L178.9,112.9 L180.1,115.0 L181.1,117.3 L181.9,119.8 L182.5,122.5 L182.9,125.2 L183.0,128.0 L182.9,130.8 L182.5,133.5 L181.9,136.2 L181.1,138.7 L180.1,141.0 L178.9,143.1 L177.5,145.0 L175.9,146.7 L174.3,148.0 L172.5,149.0 L170.7,149.6 L168.8,150.0 L166.9,149.9 L165.0,149.6 L163.2,148.8 L161.4,147.8 L159.8,146.4 L158.3,144.7 L156.9,142.8 L155.7,140.6 L157.8,139.2 L158.7,141.1 L159.9,142.8 L161.1,144.3 L162.5,145.5 L164.0,146.5 L165.5,147.1 L167.1,147.4 L168.7,147.5 L170.2,147.2 L171.8,146.6 L173.2,145.7 L174.6,144.5 L175.9,143.1 L177.1,141.4 L178.1,139.5 L178.9,137.5 L179.6,135.2 L180.1,132.9 L180.4,130.5 L180.5,128.0 L180.4,125.5 L180.1,123.1 L179.6,120.8 L178.9,118.5 L178.1,116.5 L177.1,114.6 L175.9,112.9 L174.6,111.5 L173.2,110.3 L171.8,109.4 L170.2,108.8 L168.7,108.5 L167.1,108.6 L165.5,108.9 L164.0,109.5 L162.5,110.5 L161.1,111.7 L159.9,113.2 L158.7,114.9 L157.8,116.8 Z" fill="#c9946b"/>
    <path d="M161.2,121.1 L161.9,119.9 L162.6,118.8 L163.5,117.9 L164.4,117.1 L165.3,116.5 L166.4,116.1 L167.4,115.9 L168.4,115.9 L169.5,116.1 L170.5,116.5 L171.5,117.0 L172.4,117.7 L173.2,118.6 L174.0,119.7 L174.7,120.8 L175.2,122.1 L175.7,123.5 L176.0,125.0 L176.2,126.5 L176.2,128.0 L176.2,129.5 L176.0,131.0 L175.7,132.5 L175.2,133.9 L174.7,135.2 L174.0,136.3 L173.2,137.4 L172.4,138.3 L171.5,139.0 L170.5,139.5 L169.5,139.9 L168.4,140.1 L167.4,140.1 L166.4,139.9 L165.3,139.5 L164.4,138.9 L163.5,138.1 L162.6,137.2 L161.9,136.1 L161.2,134.9 L162.4,134.2 L162.9,135.2 L163.5,136.2 L164.2,137.0 L165.0,137.6 L165.8,138.2 L166.6,138.5 L167.5,138.7 L168.4,138.7 L169.2,138.6 L170.1,138.2 L170.9,137.7 L171.6,137.1 L172.3,136.3 L173.0,135.4 L173.5,134.3 L174.0,133.2 L174.4,132.0 L174.7,130.7 L174.8,129.4 L174.9,128.0 L174.8,126.6 L174.7,125.3 L174.4,124.0 L174.0,122.8 L173.5,121.7 L173.0,120.6 L172.3,119.7 L171.6,118.9 L170.9,118.3 L170.1,117.8 L169.2,117.4 L168.4,117.3 L167.5,117.3 L166.6,117.5 L165.8,117.8 L165.0,118.4 L164.2,119.0 L163.5,119.8 L162.9,120.8 L162.4,121.8 Z" fill="#c9946b"/>
    <path d="M181.6,111.1 L182.1,111.8 L182.6,112.4 L183.1,113.1 L183.5,113.9 L183.9,114.6 L184.3,115.4 L184.7,116.2 L185.0,117.0 L185.3,117.8 L185.6,118.7 L185.9,119.6 L186.1,120.5 L186.3,121.4 L186.5,122.3 L186.6,123.2 L186.8,124.2 L186.9,125.1 L186.9,126.1 L187.0,127.0 L187.0,128.0 L187.0,129.0 L186.9,129.9 L186.9,130.9 L186.8,131.8 L186.6,132.8 L186.5,133.7 L186.3,134.6 L186.1,135.5 L185.9,136.4 L185.6,137.3 L185.3,138.2 L185.0,139.0 L184.7,139.8 L184.3,140.6 L183.9,141.4 L183.5,142.1 L183.1,142.9 L182.6,143.6 L182.1,144.2 L181.6,144.9 L181.6,144.9 L181.9,143.9 L182.1,143.0 L182.2,142.1 L182.3,141.1 L182.4,140.2 L182.4,139.3 L182.4,138.4 L182.4,137.5 L182.4,136.7 L182.4,135.8 L182.3,135.0 L182.3,134.1 L182.2,133.3 L182.2,132.5 L182.1,131.8 L182.1,131.0 L182.1,130.2 L182.0,129.5 L182.0,128.7 L182.0,128.0 L182.0,127.3 L182.0,126.5 L182.1,125.8 L182.1,125.0 L182.1,124.2 L182.2,123.5 L182.2,122.7 L182.3,121.9 L182.3,121.0 L182.4,120.2 L182.4,119.3 L182.4,118.5 L182.4,117.6 L182.4,116.7 L182.4,115.8 L182.3,114.9 L182.2,113.9 L182.1,113.0 L181.9,112.1 L181.6,111.1 Z" fill="#dba879" opacity="0.6"/>
    <path d="M108.0,79.5 Q100.0,79.5 100.2,71.5 L100.3,74.8 L100.6,72.5 L101.1,70.1 L101.7,67.9 L102.4,65.6 L103.3,63.4 L104.3,61.2 L105.4,59.1 L106.7,57.0 L108.1,55.0 L109.5,53.0 L111.1,51.2 L112.8,49.4 L114.6,47.7 L116.5,46.1 L118.5,44.5 L120.6,43.1 L122.8,41.8 L125.0,40.5 L127.3,39.4 L129.7,38.4 L132.1,37.5 L134.5,36.7 L137.1,36.0 L139.6,35.5 L142.2,35.1 L144.8,34.7 L147.4,34.6 L150.0,34.5 L152.6,34.6 L155.2,34.7 L157.8,35.1 L160.4,35.5 L162.9,36.0 L165.5,36.7 L167.9,37.5 L170.3,38.4 L172.7,39.4 L175.0,40.5 L177.2,41.8 L179.4,43.1 L181.5,44.5 L183.5,46.1 L185.4,47.7 L187.2,49.4 L188.9,51.2 L190.5,53.0 L191.9,55.0 L193.3,57.0 L194.6,59.1 L195.7,61.2 L196.7,63.4 L197.6,65.6 L198.3,67.9 L198.9,70.1 L199.4,72.5 L199.7,74.8 L199.8,71.5 Q200.0,79.5 192.0,79.5 L108.0,79.5 Z" fill="#d9d9d9"/>
    <circle cx="115" cy="163.81004525901287" r="20" fill="#f2a9a9"/>
    <path d="M75.0,115 Q105,93.55 135.0,115 Q105,136.45 75.0,115 Z" fill="#ffffff"/>
    <circle cx="105" cy="115" r="10.5" fill="#5bc8e0"/>
    <circle cx="105" cy="115" r="4.7250000000000005" fill="#000000"/>
    <circle cx="107.7" cy="117.7" r="2.25" fill="#ffffff"/>
    <path d="M75.0,115 Q105,93.55 135.0,115" fill="none" stroke="#7a4a2a" stroke-width="2.5"/>
    <path d="M79.8,111.8 L80.7,107.7" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M84.4,109.3 L85.3,105.2" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M89.0,107.3 L89.8,103.2" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M93.5,105.8 L94.4,101.7" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M98.1,104.8 L99.0,100.7" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M102.7,104.3 L103.6,100.2" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M107.3,104.3 L106.4,100.2" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M111.9,104.8 L111.0,100.7" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M116.5,105.8 L115.6,101.7" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M121.0,107.3 L120.2,103.2" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M125.6,109.3 L124.7,105.2" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M130.2,111.8 L129.3,107.7" stroke="#000000" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M75.0,115.0 L77.0,112.2 L79.0,109.6 L81.0,107.2 L83.0,105.0 L85.0,102.9 L87.0,101.1 L89.0,99.5 L91.0,98.0 L93.0,96.8 L95.0,95.7 L97.0,94.8 L99.0,94.1 L101.0,93.7 L103.0,93.4 L105.0,93.3 L107.0,93.4 L109.0,93.7 L111.0,94.1 L113.0,94.8 L115.0,95.7 L117.0,96.8 L119.0,98.0 L121.0,99.5 L123.0,101.1 L125.0,102.9 L127.0,105.0 L129.0,107.2 L131.0,109.6 L133.0,112.2 L135.0,115.0 L135.0,115.0 L133.0,113.6 L131.0,112.3 L129.0,111.1 L127.0,110.0 L125.0,109.0 L123.0,108.1 L121.0,107.3 L119.0,106.6 L117.0,106.0 L115.0,105.5 L113.0,105.0 L111.0,104.7 L109.0,104.5 L107.0,104.3 L105.0,104.3 L103.0,104.3 L101.0,104.5 L99.0,104.7 L97.0,105.0 L95.0,105.5 L93.0,106.0 L91.0,106.6 L89.0,107.3 L87.0,108.1 L85.0,109.0 L83.0,110.0 L81.0,111.1 L79.0,112.3 L77.0,113.6 L75.0,115.0 Z" fill="#dba879" opacity="0.6"/>
    <path d="M73.4,168.8 L72.8,168.4 L72.2,167.9 L71.6,167.6 L70.9,167.2 L70.3,166.9 L69.7,166.6 L69.1,166.3 L68.4,166.1 L67.8,165.9 L67.2,165.7 L66.6,165.6 L65.9,165.5 L65.3,165.4 L64.7,165.3 L64.1,165.3 L63.4,165.3 L62.8,165.4 L62.2,165.5 L61.6,165.6 L60.9,165.7 L60.3,165.9 L59.7,166.1 L59.1,166.3 L58.4,166.6 L57.8,166.9 L57.2,167.2 L56.6,167.6 L55.9,167.9 L55.3,168.4 L54.7,168.8 L54.7,168.8 L73.4,168.8 Z" fill="#dba879" opacity="0.6"/>
  </svg>`;
}

// ── NARRATIVE SHELL (shared page template for box-sequence projects) ────────

// ── NARRATIVE PROJECT SHELL ──────────────────────────────────────────────────
// Shared building blocks for "narrative box-sequence" pages (Stati, Colori,
// and future projects of the same kind): a topbar, a canvas area, a
// background-swatch picker, and a column of sequential text boxes. Each
// project still assembles its OWN box sequence (how many boxes, how they're
// grouped/wrapped) since that varies structurally between projects — but the
// repetitive, error-prone parts (CSS, individual box markup, the topbar,
// showSequenceBox) live here once.

function injectNarrativeShellCSS(numBoxes){
  let boxTransforms = '';
  for(let i=1;i<=numBoxes;i++){
    const dir = i===1 ? -160 : 160; // the first box slides down from above; the rest slide up from below
    boxTransforms += `#seq-box${i}{transform:translateY(${dir}px)}#seq-box${i}.show{opacity:1;transform:translateY(0)}\n`;
  }
  const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#000;color:#fff;font-family:'Manrope',sans-serif;font-weight:400;overflow:hidden;height:100vh;display:flex;flex-direction:column}
#topbar{display:flex;align-items:center;justify-content:space-between;padding:26px 24px;background:#0a0a0a;border-bottom:1px solid #222;flex-shrink:0}
#back-btn{background:#1a1a2e;border:1px solid #444;color:#0ff;padding:5px 12px;font-size:14px;cursor:pointer;border-radius:3px;font-family:'Manrope',sans-serif;letter-spacing:0.04em}
#back-btn:hover{background:#222}
#pt-title{color:#ddd;font-size:24px;letter-spacing:0.02em;font-weight:700;font-family:'Unbounded',sans-serif}
#synth-label{font-size:10px;color:#555;letter-spacing:0.1em}
#main{display:flex;flex:1;min-height:0;overflow:hidden;position:relative}
#canvas-area{flex:1;min-width:0;min-height:0;position:relative;background:#000;overflow:hidden}
#viewers-wrapper{display:flex;width:100%;height:100%;min-width:0;min-height:0}
.viewer-pane{position:relative;flex:1;min-width:0;min-height:0;height:100%;overflow:hidden}
.viewer-pane canvas{display:block;width:100%;height:100%}
canvas{display:block}
#bg-swatches{position:fixed;bottom:10px;right:10px;background:#111;border:1px solid #333;border-radius:6px;padding:9px;width:160px;display:none;z-index:10;flex-wrap:wrap;gap:7px}
#bg-swatches.show{display:flex}
#bg-swatches-label{width:100%;font-size:9px;color:#888;letter-spacing:0.08em;margin-bottom:2px;font-family:'Manrope',sans-serif}
.bg-swatch{width:20px;height:20px;border-radius:50%;cursor:pointer;border:2px solid rgba(255,255,255,0.25);transition:transform 0.1s,border-color 0.1s;flex-shrink:0}
.bg-swatch:hover{transform:scale(1.15)}
.bg-swatch.bg-swatch-selected{border-color:#0ff;box-shadow:0 0 5px #0ff}
#loading-msg{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);border:1px solid #333;border-radius:20px;padding:8px 20px;font-size:11px;color:#888;pointer-events:none;opacity:0;transition:opacity 0.3s}
#loading-msg.show{opacity:1}
:root{
  --flat-bg:#0e6b78;
  --flat-panel:#0a505a;
  --flat-border:#12808f;
  --flat-text:#ffffff;
  --flat-text-dim:#dffcff;
}
body.theme-flat{background:var(--flat-bg);color:var(--flat-text)}
body.theme-flat #topbar{background:var(--flat-panel);border-bottom:1px solid var(--flat-border)}
body.theme-flat #canvas-area{background:var(--flat-bg)}
body.theme-flat #pt-title,body.theme-flat #synth-label{color:var(--flat-text-dim)}
body.theme-flat #bg-swatches{background:var(--flat-panel);border-color:var(--flat-border)}
.seq-hidden{display:none !important}
#seq-column{width:clamp(340px,18vw,400px);flex-shrink:0;padding:clamp(20px,1.6vw,26px) clamp(16px,1.3vw,22px);overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
#seq-column::-webkit-scrollbar{display:none}
#seq-boxes{display:flex;flex-direction:column;gap:10px}
.seq-box{position:relative;max-width:clamp(280px,14vw,320px);padding:clamp(13px,1.1vw,20px) clamp(16px,1.3vw,22px);border-radius:12px;font-family:'Manrope',sans-serif;font-weight:700;font-size:clamp(17px,1.35vw,23px);line-height:1.32;color:#0a0a0a;opacity:0;transition:opacity 1.3s ease,transform 1.3s ease}
.seq-box-buttons{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:10px}
${boxTransforms}
.seq-ok-btn{background:#fff;color:#0a0a0a;border:none;border-radius:7px;padding:clamp(5px,0.4vw,7px) clamp(14px,1vw,17px);font-family:'Manrope',sans-serif;font-weight:700;font-size:clamp(12px,0.75vw,13px);cursor:pointer}
.seq-ok-btn:hover{background:#f0f0f0}
.seq-back-btn{background:rgba(255,255,255,0.35);color:#0a0a0a;border:none;border-radius:7px;width:clamp(28px,1.8vw,32px);height:clamp(24px,1.6vw,27px);font-size:clamp(13px,0.8vw,14px);cursor:pointer;display:flex;align-items:center;justify-content:center;margin-right:auto}
.seq-back-btn:hover{background:rgba(255,255,255,0.55)}
`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

function buildTopbarHTML(title){
  return `<div id="topbar">
  <button id="back-btn" onclick="handleBackButton()">← Torna</button>
  <span id="pt-title">${title}</span>
  <span id="synth-label">• atomo</span>
</div>`;
}

function buildBgSwatchesContainerHTML(){
  return `<div id="bg-swatches" class="show">
  <div id="bg-swatches-label">SFONDO</div>
</div>`;
}

// One sequence box. opts: {okHandler, backHandler} -- either can be omitted.
function buildSeqBoxHTML(boxId, opts){
  opts = opts || {};
  let html = `<div class="seq-box" id="${boxId}">
        <div class="seq-box-text" id="${boxId}-text"></div>`;
  if(opts.backHandler || opts.okHandler){
    html += `\n        <div class="seq-box-buttons">`;
    if(opts.backHandler){
      html += `\n          <button class="seq-back-btn" id="${boxId}-back" onclick="${opts.backHandler}()" title="Indietro">↩</button>`;
    }
    if(opts.okHandler){
      html += `\n          <button class="seq-ok-btn" id="${boxId}-ok" onclick="${opts.okHandler}()">OK</button>`;
    }
    html += `\n        </div>`;
  }
  html += `\n      </div>`;
  return html;
}

function showSequenceBox(id, html, color){
  const box=document.getElementById(id);
  document.getElementById(id+'-text').innerHTML=html;
  box.style.background=color;
  requestAnimationFrame(()=>box.classList.add('show'));
}
