/* RENTANG — JALAN SEPTEMBER — game engine
 * Talks to the Apps Script backend (Code.gs deployed as a Web App) purely
 * over fetch() for JSON, so this page can be hosted anywhere (Cloudflare
 * Pages / Netlify / GitHub Pages) instead of inside Apps Script's own
 * HtmlService — that's what keeps Google's "created by an Apps Script user"
 * warning screen out of the picture: players never navigate to
 * script.google.com directly, only this static page, which quietly fetches
 * JSON from it in the background.
 */

// PASTE your deployed Apps Script Web App URL here (Deploy > Manage
// deployments > copy the URL ending in /exec). Do this AFTER deploying.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwfwsBdkhNil-RpUix6bnFhAmIxbW7FbRN00bHABXuFCSQDWmED6ZqHDzEnNKdU76MN/exec';

let IMG = {}, AUDIO_SRC = '', CONFIG = {};

/* ===================== GAME DATA ===================== */
const TOTAL_FRAGMENTS = 28;
const CHAPTERS = [
  {id:'ch1', tag:'Bab 1', title:'Perapian'},
  {id:'ch2', tag:'Bab 2', title:'Rimba Kabut'},
  {id:'ch3', tag:'Bab 3', title:'Jalur Dataran Tinggi'},
  {id:'ch4', tag:'Bab 4', title:'Jalan September'},
  {id:'final', tag:'Bab Akhir', title:'Gerbang Usia Baru'},
];

const MEMORY_OBJECTS = [
  {id:'shirt', name:'Kaos penyanyi asal Pennsylvania', desc:'Kaos konser yang muncul begitu saja, dadakan, penuh niat.', hint:'Ini kado pertama yang pernah diberikan — jauh sebelum semua ini jadi kebiasaan.', year:'2020'},
  {id:'lamp', name:'Lampu Canggih Ajaib', desc:'Bisa ganti warna sesuai suasana hati. Sering dipakai buat bercanda receh.', hint:'Datang bareng si kaos, di tahun yang persis sama.', year:'2020'},
  {id:'banana', name:'Pisang Bakar Ceres yang Gagal', desc:'Dimasak sambil senyum-senyum, ternyata rasanya tidak seampuh lampu ajaib.', hint:'Ini terjadi setahun setelah kaos & lampu, tepat sebelum buru-buru ke Baturaden.', year:'2021'},
];

const ZODIAC_WHEEL = [
  {y:1996, animal:'Tikus Api'}, {y:1997, animal:'Kerbau Api'}, {y:1998, animal:'Macan Tanah'},
  {y:1999, animal:'Kelinci Tanah'}, {y:2000, animal:'Naga Logam'}, {y:2001, animal:'Ular Logam'},
];

const CIPHER_KEY = [
  ['A','P'],['B','U'],['C','N'],['D','C'],['E','A'],['F','K'],['G','R'],['H','S'],['I','E'],['J','B'],
  ['K','L'],['L','A'],['M','N'],['N','G'],['O','U'],['P','M'],['Q','T'],['R','C'],['S','A'],['T','H'],
  ['U','R'],['V','I'],['W','J'],['X','Z'],['Y','S'],['Z','O']
];
// cipher word "GBZBYRC" decodes to "SEPTEMBER" using the key above
const CIPHER_ENCODED = 'HIAQIPJIG';

const SEQ_MARKERS = [
  {id:'y1', order:1, year:'September Pertama', text:'Kaos penyanyi asal Pennsylvania & lampu canggih ajaib muncul dadakan. Percobaan pertama, dan katanya berhasil.'},
  {id:'y2', order:2, year:'September Kedua', text:'Pisang bakar ceres yang gagal, lalu buru-buru berangkat ke Baturaden menjenguk si kecil.'},
  {id:'y3', order:3, year:'September Ketiga', text:'Dua hati merayakan di dua kota berbeda — lalu menyusul ketemu di Bandung, lengkap dengan cerita ban bocor.'},
  {id:'y4', order:4, year:'September Keempat', text:'Rencana besar penuh badai, tapi berakhir dengan sebuah janji: dijaga seumur hidup.'},
  {id:'y5', order:5, year:'September Kelima', text:'Bunga matahari di rumah kakek.'},
];

const PUZZLES_HINTS = {
  ch1: ["Coba sentuh semua yang berkilau di ruangan ini dulu, satu-satu.", "Salah satu buku di rak itu — coba baca ulang judul dan keterangannya baik-baik.", "Angka itu adalah dua digit yang nanti akan sering kamu temui sepanjang perjalanan ini: 0, lalu 9."],
  ch2: ["Baca lagi keterangan tiap benda — ada yang datang 'bersamaan', ada yang datang 'setahun setelahnya'.", "Kaos dan lampu itu kembar, muncul di tahun yang sama. Pisang bakar itu adik mereka, satu tahun lebih muda.", "Pasangkan: Kaos → tahun pertama, Lampu → tahun pertama juga, Pisang bakar → tahun kedua."],
  ch3_zodiac: ["Lihat lagi roda perbintangan itu — cari nama julukan yang muncul di jurnal lama.", "'Macan Tanah' bukan cuma julukan sayang — itu juga nama tahun di roda zodiak.", "Macan Tanah ada di tahun 1998. Itu angka pentingnya."],
  ch3_cipher: ["Setiap huruf di gulungan rune punya pasangan hurufnya sendiri di kunci rune.", "Cari huruf pada gulungan satu per satu di kolom kiri kunci, lalu tulis pasangannya di kolom kanan.", "Kata itu akan menjadi 'SEPTEMBER' kalau diterjemahkan dengan benar."],
  ch3_gate: ["Gerbang ini minta satu angka yang menggabungkan bulan suci itu dengan usia yang sedang dikejar malam ini.", "Bulan itu bulan ke-9. Usia yang dikejar adalah 28.", "Masukkan 928 — sembilan (September) lalu dua puluh delapan (usia baru)."],
  ch4: ["Ingat lagi urutannya: kado dadakan dulu, baru pisang bakar & Baturaden, baru Bandung & ban bocor, baru janji pernikahan, dan yang paling baru: bunga matahari di rumah kakek.", "Petunjuk paling jelas ada di kata 'buru-buru ke Baturaden' — itu terjadi SETELAH pisang bakar, bukan sebelum kaos. Dan bunga matahari itu kejadian paling akhir dari semuanya.", "Urutan yang benar: Kaos&Lampu → Pisang Bakar&Baturaden → Bandung&Ban Bocor → Janji Pernikahan → Bunga Matahari di Rumah Kakek."],
  final: ["Gerbang usia baru ini cuma minta satu hal: nyalakan semua serpihan cahaya yang sudah kamu kumpulkan.", "Kamu sudah membawa cukup cahaya. Coba tarik tuas gerbangnya.", "Serius, Ra — tinggal disentuh saja gerbangnya. Tidak ada jebakan lagi."]
};

/* ===================== STATE ===================== */
const SAVE_KEY = 'rentang_september_save_v1';
function defaultState(){
  return {
    version:1,
    currentScene:'intro',
    unlockedChapters:['ch1'],
    completedPuzzles:{},
    fragments:0,
    inventory:[],
    unlockedMemories:[],
    hintsUsed:{},
    soundEnabled:true,
    gameCompleted:false,
    completionCount:0,
    ch1SpotsFound:[],
  };
}
let state = loadState();
function loadState(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  }catch(e){ return defaultState(); }
}
function saveState(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }catch(e){ /* storage unavailable — game still playable, just won't persist */ }
}

/* ===================== UTIL ===================== */
function $(sel){return document.querySelector(sel);}
function el(tag, cls, html){const e=document.createElement(tag); if(cls)e.className=cls; if(html!==undefined)e.innerHTML=html; return e;}
function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'), 2200);
}
function addFragments(n){
  state.fragments = Math.min(TOTAL_FRAGMENTS, state.fragments + n);
  saveState(); updateHud();
}
function addInventory(itemId, label, emoji){
  if(!state.inventory.find(i=>i.id===itemId)){
    state.inventory.push({id:itemId, label, emoji});
    saveState(); renderInventory();
    toast('🎒 Didapat: '+label);
  }
}
function unlockMemory(photoKey, caption, tagLabel){
  if(!state.unlockedMemories.find(m=>m.photoKey===photoKey)){
    state.unlockedMemories.push({photoKey, caption, tagLabel});
    saveState(); renderInventory();
  }
}
function updateHud(){
  $('#fragCount').textContent = state.fragments;
  const pct = Math.round((state.fragments/TOTAL_FRAGMENTS)*100);
  $('#progressBar').style.width = pct+'%';
}

/* ===================== AUDIO ===================== */
const bgm = $('#bgm');
function initAudio(){
  if(!AUDIO_SRC){ $('#soundBtn').textContent='🔇'; $('#soundBtn').disabled=true; return; }
  bgm.src = AUDIO_SRC;
  bgm.volume = 0.35;
  // Surface a load failure instead of just staying silent — with audio now
  // embedded server-side as a data URI, a failure here almost always means
  // AUDIO_SRC came back empty (Code.gs skipped it: missing/oversized file).
  bgm.addEventListener('error', ()=>{
    console.error('BGM failed to load.');
    toast('🔇 Musik gagal dimuat — cek AUDIO_FILE_ID di Code.gs');
    $('#soundBtn').textContent='🔇'; $('#soundBtn').disabled=true;
  }, {once:true});
  if(state.soundEnabled){ bgm.play().catch(()=>{ /* autoplay blocked, fine — user can tap the sound button */ }); }
  $('#soundBtn').textContent = state.soundEnabled ? '🔊' : '🔇';
}
$('#soundBtn').addEventListener('click', ()=>{
  state.soundEnabled = !state.soundEnabled;
  $('#soundBtn').textContent = state.soundEnabled ? '🔊' : '🔇';
  if(state.soundEnabled){ bgm.play().catch(()=>{}); } else { bgm.pause(); }
  saveState();
});

/* ===================== HINT SYSTEM ===================== */
function showHint(puzzleKey){
  const list = PUZZLES_HINTS[puzzleKey] || ["Coba amati lagi sekelilingmu, Ra."];
  const used = state.hintsUsed[puzzleKey] || 0;
  const idx = Math.min(used, list.length-1);
  $('#hintText').textContent = list[idx];
  $('#hintBubble').classList.add('open');
  state.hintsUsed[puzzleKey] = used+1;
  saveState();
}
$('#closeHint').addEventListener('click', ()=> $('#hintBubble').classList.remove('open'));

/* ===================== INVENTORY DRAWER ===================== */
function renderInventory(){
  const grid = $('#invGrid'); grid.innerHTML='';
  if(state.inventory.length===0 && state.unlockedMemories.length===0){
    grid.appendChild(el('div','inv-empty','Belum ada apa-apa di sini. Terus jalan, Ra.'));
    return;
  }
  state.inventory.forEach(it=>{
    const d = el('div','inv-item', `<div>${it.emoji}</div><span class="lbl">${it.label}</span>`);
    grid.appendChild(d);
  });
  state.unlockedMemories.forEach(m=>{
    const d = el('div','inv-item', `<div>📷</div><span class="lbl">${m.tagLabel}</span>`);
    grid.appendChild(d);
  });
}
$('#invBtn').addEventListener('click', ()=>{ $('#invDrawer').classList.add('open'); $('#invBackdrop').classList.add('open'); });
$('#closeInv').addEventListener('click', closeInv);
$('#invBackdrop').addEventListener('click', closeInv);
function closeInv(){ $('#invDrawer').classList.remove('open'); $('#invBackdrop').classList.remove('open'); }

/* ===================== SCENE ENGINE ===================== */
const scenesEl = $('#scenes');
let sceneBuilders = {}; // key -> function returning HTMLElement
function registerScene(key, builder){ sceneBuilders[key]=builder; }
function goScene(key, chapterTagText, questText){
  const overlay = $('#fadeOverlay');
  overlay.classList.add('show');
  setTimeout(()=>{
    scenesEl.querySelectorAll('.scene').forEach(s=>s.remove());
    const built = sceneBuilders[key]();
    built.classList.add('scene');
    scenesEl.appendChild(built);
    requestAnimationFrame(()=> requestAnimationFrame(()=> built.classList.add('active')));
    if(chapterTagText) $('#chapterTag').textContent = chapterTagText;
    if(questText) $('#questLine').textContent = questText;
    state.currentScene = key; saveState();
    overlay.classList.remove('show');
    scenesEl.scrollTop = 0;
  }, 260);
}

/* ---------- PROLOGUE ---------- */
registerScene('prologue', ()=>{
  const s = el('div','scene-inner');
  s.innerHTML = `
    <span class="tag-label">Prolog</span>
    <h1 class="title">Rentang, di Malam Hearth-Flame</h1>
    <div class="panel glow">
      <p class="lore">Di dunia <b>Rentang</b>, setiap orang membawa nyala kecil di dadanya — <b>Hearth-Flame</b>, api hangat yang menyala lebih terang setiap kali bulan kesembilan tiba. Malam ini, nyala milik seorang pengembara bernama <b>Ra</b> akan menyala untuk yang ke-28 kalinya.</p>
      <p class="lore">Dari kegelapan muncul seekor roh cahaya kecil, terbang gelisah mengelilingimu. Namanya <b>Kunang</b> — penjaga jalan yang katanya "sudah nunggu dari tadi, lama amat sih bangunnya."</p>
      <p class="lore">"Selamat datang di usia baru," katanya sambil berputar-putar. "Ada satu jalan yang harus kamu tempuh malam ini: <b>Jalan September</b>. Di ujungnya ada Gerbang Usia Baru — dan dua puluh delapan serpihan cahaya yang menunggu untuk kamu kumpulkan sebelum gerbang itu mau terbuka."</p>
      <p class="lore">Kunang mengedipkan cahayanya sekali. "Enggak usah takut nyasar. Aku diperintah untuk temani kamu oleh seekor Babi Kayu tampan. Ayo jalan!."</p>
    </div>
    <button class="btn primary block" id="toCh1">Ikuti Kunang →</button>
  `;
  s.querySelector('#toCh1').addEventListener('click', ()=> goScene('ch1_intro','Bab 1 · Perapian','Temukan apa yang berkilau di sini'));
  return s;
});

/* ---------- CHAPTER 1: DISCOVERY (Hearth) ---------- */
const CH1_SPOTS = [
  {id:'window', emoji:'🪟', label:'Jendela kayu', note:'Cahaya bulan masuk lewat sini. Ada empat jendela kalau dihitung — kamu baru sadar sekarang.'},
  {id:'lamp', emoji:'🏮', label:'Lampu gantung', note:'Nyalanya berubah warna sendiri. Rasanya familiar... seperti pernah ada yang punya lampu begini juga.'},
  {id:'shelf', emoji:'📚', label:'Rak buku tua', note:'Salah satu buku berjudul "Catatan Perjalanan — Lima Musim". Empat halaman terisi, satu halaman kosong, menunggu diisi. Ada 3 batang lilin menyala di sebelahnya.'},
  {id:'hearth', emoji:'🔥', label:'Perapian', note:'Api di sini tidak panas, hanya hangat. Persis seperti sentuhan Babi Kayu, suatu malam.'},
];
registerScene('ch1_intro', ()=>{
  const s = el('div','scene-inner');
  s.innerHTML = `
    <span class="tag-label">Bab 1 · Perapian</span>
    <h2 class="title">Ruang yang Terasa Seperti Rumah</h2>
    <div class="panel">
      <p class="lore">Kunang membawamu ke sebuah pondok kecil. Di tengah ruangan ada peti kayu tua, terkunci rapat dengan gerendel berukir. "Sebelum bisa lanjut," kata Kunang, "kamu harus belajar caranya melihat. Sentuh semua yang menurutmu berkilau di ruangan ini."</p>
    </div>
    <div class="spot-grid" id="spotGrid"></div>
    <div class="panel hidden" id="ch1PuzzlePanel">
      <h2 class="title" style="font-size:1.05rem;">Peti Berkunci</h2>
      <p class="lore">Ukiran di peti bertuliskan: <i>"Angka yang kaubawa adalah jumlah cahaya yang sudah kau temukan di ruangan ini."</i></p>
      <div class="code-input-row" id="ch1CodeRow"></div>
      <div class="btn-row">
        <button class="btn ghost sm" id="ch1Hint">💡 Minta petunjuk Kunang</button>
        <button class="btn primary sm" id="ch1Submit">Buka Peti</button>
      </div>
    </div>
  `;
  const grid = s.querySelector('#spotGrid');
  CH1_SPOTS.forEach(sp=>{
    const found = state.ch1SpotsFound.includes(sp.id);
    const d = el('div','spot'+(found?' done':''), `<div class="emoji">${sp.emoji}</div><div>${sp.label}</div>`);
    d.addEventListener('click', ()=>{
      if(!state.ch1SpotsFound.includes(sp.id)){
        state.ch1SpotsFound.push(sp.id); saveState();
        d.classList.add('done');
      }
      toast(sp.note);
      maybeRevealCh1Puzzle();
    });
    grid.appendChild(d);
  });
  const codeRow = s.querySelector('#ch1CodeRow');
  for(let i=0;i<2;i++){
    const inp = el('input','code-box'); inp.maxLength=1; inp.inputMode='numeric'; inp.pattern='[0-9]*';
    codeRow.appendChild(inp);
  }
  function maybeRevealCh1Puzzle(){
    if(state.ch1SpotsFound.length >= CH1_SPOTS.length){
      s.querySelector('#ch1PuzzlePanel').classList.remove('hidden');
    }
  }
  maybeRevealCh1Puzzle();
  s.querySelector('#ch1Hint').addEventListener('click', ()=> showHint('ch1'));
  s.querySelector('#ch1Submit').addEventListener('click', ()=>{
    const vals = Array.from(codeRow.querySelectorAll('.code-box')).map(i=>i.value.trim()).join('');
    if(vals === '09'){
      state.completedPuzzles.ch1 = true; addFragments(5);
      addInventory('key1','Kunci Perapian','🗝️');
      toast('✦ Peti terbuka! +5 cahaya');
      setTimeout(()=> goScene('ch1_reward','Bab 1 · Perapian','Lihat apa yang ada di dalam peti'), 900);
    } else {
      toast('Belum tepat. Coba hitung ulang, Ra.');
    }
  });
  return s;
});
registerScene('ch1_reward', ()=>{
  const s = el('div','scene-inner');
  unlockMemory('p1','Bayangan dirimu sendiri, tersenyum di depan rumah — jauh sebelum petualangan ini dimulai.','Visi: Rumah');
  s.innerHTML = `
    <span class="tag-label">Bab 1 · Selesai</span>
    <h2 class="title">Di Dalam Peti</h2>
    <div class="memory-card">
      <img src="${IMG.p1}" alt="Vision 1">
      <div class="cap"><div class="k">Visi: Rumah</div><p>Sebuah bayangan dirimu sendiri, tersenyum di depan rumah, jauh sebelum semua petualangan ini dimulai. Kunang bilang, "Peti ini enggak nyimpen harta. Dia nyimpen cara kamu buat mulai."</p></div>
    </div>
    <div class="panel"><p class="lore">Kunang terbang lebih tenang sekarang. "Bagus. Kamu sudah tahu caranya melihat. Jalan berikutnya enggak akan seterang ini — kabut mulai turun di depan sana."</p></div>
    <button class="btn primary block" id="toCh2">Lanjut ke Rimba Kabut →</button>
  `;
  s.querySelector('#toCh2').addEventListener('click', ()=>{
    if(!state.unlockedChapters.includes('ch2')) state.unlockedChapters.push('ch2');
    saveState();
    goScene('ch2_intro','Bab 2 · Rimba Kabut','Cocokkan tiap benda dengan tahunnya');
  });
  return s;
});

/* ---------- CHAPTER 2: MEMORY (Misty Woods) ---------- */
registerScene('ch2_intro', ()=>{
  const s = el('div','scene-inner');
  s.innerHTML = `
    <span class="tag-label">Bab 2 · Rimba Kabut</span>
    <h2 class="title">Batu-Batu Kenangan</h2>
    <div class="scene-bg" style="background-image:url('${IMG.p3}')"></div>
    <div class="panel">
      <p class="lore">Kabut tebal menyelimuti hutan ini. Tiga benda melayang pelan di udara, masing-masing memancarkan cahaya redup. Di depanmu berdiri dua batu bertulis tahun. "Setiap benda ingat tahunnya sendiri," kata Kunang. "Coba tanya mereka."</p>
    </div>
    <div class="match-row" id="matchRow"></div>
    <div class="btn-row">
      <button class="btn ghost sm" id="ch2Hint">💡 Minta petunjuk Kunang</button>
      <button class="btn primary sm" id="ch2Submit">Periksa Jawaban</button>
    </div>
  `;
  const row = s.querySelector('#matchRow');
  MEMORY_OBJECTS.forEach(obj=>{
    const item = el('div','match-item');
    item.innerHTML = `<div><div class="obj-name">${obj.name}</div><div class="obj-desc">${obj.desc}</div></div>
      <select class="year-select" data-id="${obj.id}">
        <option value="">Tahun?</option>
        <option value="2020">September Pertama</option>
        <option value="2021">September Kedua</option>
        <option value="2022">September Ketiga</option>
        <option value="2023">September Keempat</option>
        <option value="2024">September Kelima</option>
      </select>`;
    row.appendChild(item);
  });
  s.querySelector('#ch2Hint').addEventListener('click', ()=> showHint('ch2'));
  s.querySelector('#ch2Submit').addEventListener('click', ()=>{
    let allCorrect = true;
    row.querySelectorAll('.match-item').forEach(item=>{
      const sel = item.querySelector('select');
      const obj = MEMORY_OBJECTS.find(o=>o.id===sel.dataset.id);
      if(sel.value === obj.year){ item.classList.add('correct'); item.classList.remove('wrong'); }
      else { item.classList.add('wrong'); item.classList.remove('correct'); allCorrect=false; }
    });
    if(allCorrect){
      state.completedPuzzles.ch2 = true; addFragments(6);
      addInventory('lamp1','Lampu Canggih Mini','🏮');
      toast('✦ Kenangan tersusun rapi! +6 cahaya');
      setTimeout(()=> goScene('ch2_reward','Bab 2 · Rimba Kabut','Lihat kenangan yang baru terbuka'), 900);
    } else {
      toast('Ada yang belum pas. Coba lagi, Ra.');
    }
  });
  return s;
});
registerScene('ch2_reward', ()=>{
  const s = el('div','scene-inner');
  unlockMemory('pb','Pelukan di lorong rumah, dua orang tertawa bersama.','Kenangan: Rumah Pertama');
  s.innerHTML = `
    <span class="tag-label">Bab 2 · Selesai</span>
    <h2 class="title">Kenangan: Rumah Pertama</h2>
    <div class="memory-card">
      <img src="${IMG.pb}" alt="Memory hallway hug">
      <div class="cap"><div class="k">Kenangan Bersama</div><p>Sebuah tawa di lorong tempat belajar, dua orang tertawa lepas. Bukan momen besar — tapi justru yang seperti ini yang paling sering diingat.</p></div>
    </div>
    <div class="panel"><p class="lore">Kabut mulai menipis. Kunang menunjuk ke arah pegunungan jauh di depan. "Jalan selanjutnya menanjak. Tapi tenang — kamu bukan orang baru soal itu."</p></div>
    <button class="btn primary block" id="toCh3">Lanjut ke Dataran Tinggi →</button>
  `;
  s.querySelector('#toCh3').addEventListener('click', ()=>{
    if(!state.unlockedChapters.includes('ch3')) state.unlockedChapters.push('ch3');
    saveState();
    goScene('ch3_zodiac','Bab 3 · Dataran Tinggi','Cari tahun di Roda Perbintangan');
  });
  return s;
});

/* ---------- CHAPTER 3: THE QUEST (Highland Trail) ---------- */
registerScene('ch3_zodiac', ()=>{
  const s = el('div','scene-inner');
  s.innerHTML = `
    <span class="tag-label">Bab 3 · Dataran Tinggi</span>
    <h2 class="title">Roda Perbintangan</h2>
    <div class="scene-bg" style="background-image:url('${IMG.p5}')"></div>
    <div class="panel">
      <p class="lore">Di puncak pertama berdiri sebuah roda batu berukir nama-nama tahun dan hewan penjaganya. Kunang berbisik, "Ada satu julukan lama yang sering dipakai untukmu, Ra. Coba cari di roda ini — julukan itu juga nama sebuah tahun."</p>
    </div>
    <div class="zodiac-wheel" id="zodiacWheel"></div>
    <div class="panel">
      <p class="lore" style="margin-bottom:0;">Tahun berapa "Macan Tanah" berdiri di roda ini? Ingat angka itu — kamu akan membutuhkannya.</p>
    </div>
    <div class="btn-row">
      <button class="btn ghost sm" id="ch3zHint">💡 Minta petunjuk Kunang</button>
      <button class="btn primary sm" id="ch3zNext">Aku sudah ingat angkanya →</button>
    </div>
  `;
  const wheel = s.querySelector('#zodiacWheel');
  ZODIAC_WHEEL.forEach(z=>{
    const c = el('div','zodiac-cell'+(z.mark?' highlight':''), `<b>${z.animal}</b>${z.y}`);
    wheel.appendChild(c);
  });
  s.querySelector('#ch3zHint').addEventListener('click', ()=> showHint('ch3_zodiac'));
  s.querySelector('#ch3zNext').addEventListener('click', ()=> goScene('ch3_cipher','Bab 3 · Dataran Tinggi','Terjemahkan gulungan rune'));
  return s;
});
registerScene('ch3_cipher', ()=>{
  const s = el('div','scene-inner');
  s.innerHTML = `
    <span class="tag-label">Bab 3 · Dataran Tinggi</span>
    <h2 class="title">Gulungan Rune</h2>
    <div class="panel">
      <p class="lore">Terselip di celah batu, sebuah gulungan kecil bertuliskan huruf-huruf asing. Di sebelahnya terukir kunci terjemahan rune.</p>
      <div class="cipher-word">${CIPHER_ENCODED}</div>
      <div class="rune-key">${CIPHER_KEY.map(([a,b])=>`<div class="pair"><span class="glyph">${a}</span>${b}</div>`).join('')}</div>
      <p class="lore">Terjemahkan kata di gulungan itu menggunakan kunci di atas. Kata itu adalah nama bulan yang sangat kamu kenal.</p>
    </div>
    <div class="btn-row">
      <button class="btn ghost sm" id="ch3cHint">💡 Minta petunjuk Kunang</button>
      <button class="btn primary sm" id="ch3cNext">Sudah kutemukan kata itu →</button>
    </div>
  `;
  s.querySelector('#ch3cHint').addEventListener('click', ()=> showHint('ch3_cipher'));
  s.querySelector('#ch3cNext').addEventListener('click', ()=> goScene('ch3_gate','Bab 3 · Dataran Tinggi','Buka Gerbang Puncak'));
  return s;
});
registerScene('ch3_gate', ()=>{
  const s = el('div','scene-inner');
  s.innerHTML = `
    <span class="tag-label">Bab 3 · Gerbang Puncak</span>
    <h2 class="title">Gerbang Puncak</h2>
    <div class="scene-bg" style="background-image:url('${IMG.p4}')"></div>
    <div class="panel glow">
      <p class="lore">Sebuah gerbang batu berdiri di puncak, terukir kalimat: <i>"Gabungkan bulan yang kausebut tadi dengan usia yang sedang kaukejar malam ini. Tulis sebagai satu angka."</i></p>
      <p class="lore">Kamu sudah tahu bulan itu (dari gulungan rune) dan usia itu (dari alasan kamu ada di sini malam ini).</p>
      <div class="code-input-row" id="ch3CodeRow"></div>
      <div class="btn-row">
        <button class="btn ghost sm" id="ch3gHint">💡 Minta petunjuk Kunang</button>
        <button class="btn primary sm" id="ch3gSubmit">Buka Gerbang</button>
      </div>
    </div>
  `;
  const row = s.querySelector('#ch3CodeRow');
  for(let i=0;i<3;i++){ const inp = el('input','code-box'); inp.maxLength=1; inp.inputMode='numeric'; row.appendChild(inp); }
  s.querySelector('#ch3gHint').addEventListener('click', ()=> showHint('ch3_gate'));
  s.querySelector('#ch3gSubmit').addEventListener('click', ()=>{
    const vals = Array.from(row.querySelectorAll('.code-box')).map(i=>i.value.trim()).join('');
    if(vals === '928'){
      state.completedPuzzles.ch3 = true; addFragments(8);
      addInventory('compass','Kompas Puncak','🧭');
      toast('✦ Gerbang terbuka! +8 cahaya');
      setTimeout(()=> goScene('ch3_reward','Bab 3 · Selesai','Lihat kenangan yang baru terbuka'), 900);
    } else {
      toast('Belum tepat. September itu bulan ke berapa? Usia barunya berapa?');
    }
  });
  return s;
});
registerScene('ch3_reward', ()=>{
  const s = el('div','scene-inner');
  unlockMemory('p4','Berdiri di puncak, sendirian, dengan langit yang akhirnya cerah.','Visi: Puncak');
  unlockMemory('p5','Menatap lautan awan, tangan terkatup, penuh syukur.','Visi: Lautan Awan');
  unlockMemory('pa','Berdiri berdua di bukit hijau, dua jempol terangkat.','Kenangan: Tim yang Tumbuh');
  s.innerHTML = `
    <span class="tag-label">Bab 3 · Selesai</span>
    <h2 class="title">Tiga Kenangan di Puncak</h2>
    <div class="memory-card"><img src="${IMG.p4}"><div class="cap"><div class="k">Visi: Puncak</div><p>Tersenyum di puncak, dengan langit yang akhirnya cerah setelah jalan panjang.</p></div></div>
    <div class="memory-card"><img src="${IMG.p5}"><div class="cap"><div class="k">Visi: Lautan Awan</div><p>Sumeringah dan bahagia di atas lautan awan yang setelah ini pasti akan selalu kamu rindukan</p></div></div>
    <div class="memory-card"><img src="${IMG.pa}"><div class="cap"><div class="k">Kenangan: Tim yang Tumbuh</div><p>Dua Jempol untuk keringat perjalanan kita yang sangat ramai rasa. Dua orang yang tadinya sangat berbeda, belajar caranya berjalan searah. Akan aku temani sampai September yang sangat jauh.</p></div></div>
    <div class="panel"><p class="lore">Kunang duduk di bahumu sebentar. "Kadang dua orang harus banyak berbeda dulu, sebelum akhirnya nemu cara buat saling melengkapi. Kamu tahu itu lebih dari siapapun, Ra."</p></div>
    <button class="btn primary block" id="toCh4">Lanjut ke Jalan September →</button>
  `;
  s.querySelector('#toCh4').addEventListener('click', ()=>{
    if(!state.unlockedChapters.includes('ch4')) state.unlockedChapters.push('ch4');
    saveState();
    goScene('ch4_intro','Bab 4 · Jalan September','Susun urutan penanda jalan');
  });
  return s;
});

/* ---------- CHAPTER 4: THE SEPTEMBER PATH ---------- */
registerScene('ch4_intro', ()=>{
  const s = el('div','scene-inner');
  s.innerHTML = `
    <span class="tag-label">Bab 4 · Jalan September</span>
    <h2 class="title">Empat Penanda Jalan</h2>
    <div class="scene-bg" style="background-image:url('${IMG.pd}')"></div>
    <div class="panel">
      <p class="lore">Jalan ini punya lima penanda batu, tapi urutannya kacau — mungkin kena longsor. Susun ulang dari yang paling awal ke yang paling akhir. Seret penanda untuk mengubah urutan (atau tekan tombol panah kalau lebih gampang).</p>
    </div>
    <div class="seq-list" id="seqList"></div>
    <div class="btn-row">
      <button class="btn ghost sm" id="ch4Hint">💡 Minta petunjuk Kunang</button>
      <button class="btn primary sm" id="ch4Submit">Kunci Urutan Ini</button>
    </div>
  `;
  let order = [...SEQ_MARKERS].sort(()=>Math.random()-0.5).map(m=>m.id);
  const list = s.querySelector('#seqList');
  function render(){
    list.innerHTML='';
    order.forEach((id,idx)=>{
      const m = SEQ_MARKERS.find(x=>x.id===id);
      const item = el('div','seq-item'); item.draggable = true; item.dataset.id = id;
      item.innerHTML = `<span class="handle">☰</span><span class="num">${idx+1}</span>
        <div class="txt"><span>${m.text}</span></div>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <button class="btn ghost sm" style="padding:4px 8px; min-height:28px;" data-dir="up">▲</button>
          <button class="btn ghost sm" style="padding:4px 8px; min-height:28px;" data-dir="down">▼</button>
        </div>`;
      item.querySelector('[data-dir="up"]').addEventListener('click', ()=>{ move(idx,-1); });
      item.querySelector('[data-dir="down"]').addEventListener('click', ()=>{ move(idx,1); });
      item.addEventListener('dragstart', ()=> item.classList.add('dragging'));
      item.addEventListener('dragend', ()=> item.classList.remove('dragging'));
      list.appendChild(item);
    });
  }
  function move(idx,dir){
    const j = idx+dir; if(j<0||j>=order.length) return;
    [order[idx],order[j]] = [order[j],order[idx]];
    render();
  }
  list.addEventListener('dragover', e=>{
    e.preventDefault();
    const dragging = list.querySelector('.dragging'); if(!dragging) return;
    const after = [...list.querySelectorAll('.seq-item:not(.dragging)')].find(sib=>{
      const r = sib.getBoundingClientRect();
      return e.clientY < r.top + r.height/2;
    });
    if(after) list.insertBefore(dragging, after); else list.appendChild(dragging);
  });
  list.addEventListener('drop', ()=>{
    order = [...list.querySelectorAll('.seq-item')].map(i=>i.dataset.id);
    render();
  });
  render();
  s.querySelector('#ch4Hint').addEventListener('click', ()=> showHint('ch4'));
  s.querySelector('#ch4Submit').addEventListener('click', ()=>{
    const correct = SEQ_MARKERS.every((m,idx)=> order[idx]===m.id);
    if(correct){
      state.completedPuzzles.ch4 = true; addFragments(9);
      addInventory('map1','Peta Jalan September','🗺️');
      toast('✦ Urutan benar! +9 cahaya');
      setTimeout(()=> goScene('ch4_reward','Bab 4 · Selesai','Lihat kenangan yang baru terbuka'), 900);
    } else {
      toast('Urutannya masih kacau. Coba ingat lagi ceritanya, Ra.');
    }
  });
  return s;
});
registerScene('ch4_reward', ()=>{
  const s = el('div','scene-inner');
  unlockMemory('pd','Cermin jalan memantulkan dua orang di atas motor, menyusuri jalan desa.','Kenangan: Jalan yang Sama');
  unlockMemory('pc','Dua orang berhelm, tersenyum lebar, siap melanjutkan perjalanan.','Kenangan: Selalu Bersiap Jalan Lagi');
  s.innerHTML = `
    <span class="tag-label">Bab 4 · Selesai</span>
    <h2 class="title">Kenangan di Jalan</h2>
    <div class="memory-card"><img src="${IMG.pd}"><div class="cap"><div class="k">Kenangan: Jalan yang Sama</div><p>Cermin jalan memantulkan dua orang menyusuri jalan desa dalam perasaan "pulang".</p></div></div>
    <div class="memory-card"><img src="${IMG.pc}"><div class="cap"><div class="k">Kenangan: Selalu Bersiap Jalan Lagi</div><p>Dua orang manis, tersenyum lebar, siap melanjutkan perjalanan — apapun rintangannya.</p></div></div>
    <div class="panel"><p class="lore">Kunang berhenti di depanmu, cahayanya lebih terang dari sebelumnya. "Kamu sudah membawa hampir semua cahaya yang dibutuhkan, Ra. Tinggal satu gerbang lagi."</p></div>
    <button class="btn primary block" id="toFinal">Menuju Gerbang Usia Baru →</button>
  `;
  s.querySelector('#toFinal').addEventListener('click', ()=>{
    if(!state.unlockedChapters.includes('final')) state.unlockedChapters.push('final');
    saveState();
    goScene('final_quest','Bab Akhir · Gerbang Usia Baru','Nyalakan Gerbang Usia Baru');
  });
  return s;
});

/* ---------- FINAL QUEST ---------- */
registerScene('final_quest', ()=>{
  const s = el('div','scene-inner');
  s.innerHTML = `
    <span class="tag-label">Bab Akhir</span>
    <h2 class="title">Gerbang Usia Baru</h2>
    <div class="panel glow">
      <p class="lore">Di ujung Jalan September berdiri sebuah gerbang besar berbentuk lingkaran, dengan banyak lekukan kecil di sekelilingnya — masing-masing menunggu satu serpihan cahaya.</p>
      <p class="lore">Kunang melayang mundur. "Kamu sudah bawa semua serpihan cahaya. Tinggal satu langkah lagi, Ra: putar gerbang ini ke angka usia barumu."</p>
      <div class="code-input-row" id="finalCodeRow"></div>
      <div class="btn-row">
        <button class="btn ghost sm" id="finalHint">💡 Minta petunjuk Kunang</button>
        <button class="btn primary sm" id="finalSubmit">Nyalakan Gerbang</button>
      </div>
    </div>
  `;
  const row = s.querySelector('#finalCodeRow');
  for(let i=0;i<2;i++){ const inp = el('input','code-box'); inp.maxLength=1; inp.inputMode='numeric'; row.appendChild(inp); }
  s.querySelector('#finalHint').addEventListener('click', ()=> showHint('final'));
  s.querySelector('#finalSubmit').addEventListener('click', ()=>{
    const vals = Array.from(row.querySelectorAll('.code-box')).map(i=>i.value.trim()).join('');
    if(vals === '28'){
      state.fragments = TOTAL_FRAGMENTS; state.gameCompleted = true; state.completionCount = (state.completionCount||0)+1;
      saveState();
      goScene('ending','✨ Selesai','Selamat, Ra.');
    } else {
      toast('Coba pikirkan lagi — ini malam usia keberapa untukmu, Ra?');
    }
  });
  return s;
});

/* ---------- ENDING ---------- */
registerScene('ending', ()=>{
  const s = el('div','scene-inner');
  const allPhotos = ['p1','p2','p3','p4','p5','p6','p7','pa','pb','pc','pd'];
  s.innerHTML = `
    <div class="age-unlock">
      <div class="tag-label">Quest Complete</div>
      <div class="lvl">✨ 28 ✨</div>
      <div class="who">New Age Unlocked — Ra</div>
    </div>
    <div class="panel glow">
      <p class="lore" id="birthdayMsg" style="font-size:1.02rem; color:var(--ink);"></p>
    </div>
    <div class="voucher">
      <div style="font-size:.72rem; letter-spacing:.14em; text-transform:uppercase; color:var(--accent);">🎁 Reward Unlocked</div>
      <div class="vname" id="voucherName"></div>
      <div class="vcode" id="voucherCode"></div>
      <p class="lore" id="voucherDesc" style="margin:0;"></p>
    </div>
    <div class="divider"></div>
    <h2 class="title" style="font-size:1.05rem;">Semua Kenangan yang Terkumpul</h2>
    <div class="montage" id="montageGrid"></div>
    <div class="panel">
      <p class="lore" id="finalMsg" style="text-align:center; font-style:italic; margin:0;"></p>
    </div>
    <div class="btn-row">
      <button class="btn ghost block" id="replayBtn">↺ Main Lagi dari Awal</button>
      <button class="btn ghost block" id="resetBtn" style="color:var(--danger);">Reset Petualangan</button>
    </div>
  `;
  $('#birthdayMsg') && (s.querySelector('#birthdayMsg').textContent = CONFIG.BIRTHDAY_MESSAGE);
  s.querySelector('#voucherName').textContent = CONFIG.VOUCHER_NAME;
  s.querySelector('#voucherCode').textContent = CONFIG.VOUCHER_CODE;
  s.querySelector('#voucherDesc').textContent = CONFIG.VOUCHER_DESCRIPTION;
  s.querySelector('#finalMsg').textContent = CONFIG.FINAL_MESSAGE;
  const grid = s.querySelector('#montageGrid');
  allPhotos.forEach(k=>{ const img = el('img'); img.src = IMG[k]; img.loading='lazy'; grid.appendChild(img); });
  s.querySelector('#replayBtn').addEventListener('click', ()=>{
    const kept = {soundEnabled: state.soundEnabled, completionCount: state.completionCount};
    state = Object.assign(defaultState(), kept);
    saveState(); updateHud(); renderInventory();
    goScene('prologue','Prolog','Bangunkan Kunang, si roh cahaya');
  });
  s.querySelector('#resetBtn').addEventListener('click', ()=> confirmReset());
  updateHud();
  return s;
});

/* ---------- RESET CONFIRM ---------- */
function confirmReset(){
  const box = el('div','confirm-box');
  box.innerHTML = `<div class="panel">
      <h2 class="title" style="font-size:1.05rem;">Yakin reset semua progres?</h2>
      <p class="lore">Semua kenangan, cahaya, dan isi ransel akan hilang. Kamu akan mulai dari Prolog lagi.</p>
      <div class="btn-row">
        <button class="btn ghost block" id="cancelReset">Batal</button>
        <button class="btn primary block" id="confirmResetBtn" style="background:linear-gradient(180deg,#e88787,#b95a5a); color:#2a0d0d; border-color:#7a3a3a;">Ya, Reset</button>
      </div>
    </div>`;
  document.body.appendChild(box);
  box.querySelector('#cancelReset').addEventListener('click', ()=> box.remove());
  box.querySelector('#confirmResetBtn').addEventListener('click', ()=>{
    localStorage.removeItem(SAVE_KEY);
    state = defaultState(); saveState();
    box.remove();
    updateHud(); renderInventory();
    goScene('prologue','Prolog','Bangunkan Kunang, si roh cahaya');
  });
}

/* ===================== BOOT ===================== */
function boot(){
  $('#app').classList.remove('hidden');
  updateHud(); renderInventory();
  const resumeMap = {
    'ch1_intro':['Bab 1 · Perapian','Temukan apa yang berkilau di sini'],
    'ch1_reward':['Bab 1 · Perapian','Lihat isi peti'],
    'ch2_intro':['Bab 2 · Rimba Kabut','Cocokkan tiap benda dengan tahunnya'],
    'ch2_reward':['Bab 2 · Rimba Kabut','Lihat kenangan yang baru terbuka'],
    'ch3_zodiac':['Bab 3 · Dataran Tinggi','Cari tahun di Roda Perbintangan'],
    'ch3_cipher':['Bab 3 · Dataran Tinggi','Terjemahkan gulungan rune'],
    'ch3_gate':['Bab 3 · Gerbang Puncak','Buka Gerbang Puncak'],
    'ch3_reward':['Bab 3 · Selesai','Lihat kenangan yang baru terbuka'],
    'ch4_intro':['Bab 4 · Jalan September','Susun urutan penanda jalan'],
    'ch4_reward':['Bab 4 · Selesai','Lihat kenangan yang baru terbuka'],
    'final_quest':['Bab Akhir','Nyalakan Gerbang Usia Baru'],
    'ending':['✨ Selesai','Selamat, Ra.'],
  };
  let start = state.currentScene;
  if(!sceneBuilders[start]) start = 'prologue';
  const meta = resumeMap[start];
  goScene(start, meta?meta[0]:'Prolog', meta?meta[1]:'Bangunkan Kunang, si roh cahaya');
}
$('#beginBtn').addEventListener('click', ()=>{
  $('#introScreen').style.display='none';
  // Best-effort fullscreen — must be requested synchronously from a real
  // user gesture (this click) or browsers reject it. Not every browser
  // supports it for arbitrary pages (notably iOS Safari doesn't, at all),
  // so this fails silently there and the game is exactly as playable
  // without it — never block startup on this.
  try {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) req.call(el).catch(()=>{});
  } catch(e) { /* fullscreen unsupported/denied — fine, continue anyway */ }
  initAudio();
  boot();
});

/* ===================== STARFIELD BACKGROUND ===================== */
(function(){
  const c = $('#stars'); const ctx = c.getContext('2d');
  let stars=[];
  function size(){ c.width=innerWidth; c.height=innerHeight; }
  function makeStars(){
    stars = Array.from({length: Math.min(120, Math.floor(innerWidth*innerHeight/9000))}, ()=>({
      x:Math.random()*c.width, y:Math.random()*c.height, r:Math.random()*1.4+.2,
      s:Math.random()*0.02+0.005, phase:Math.random()*Math.PI*2
    }));
  }
  function draw(t){
    ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle = '#e8c774';
    stars.forEach(st=>{
      const a = 0.35 + 0.5*Math.abs(Math.sin(st.phase + t*st.s));
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', ()=>{ size(); makeStars(); });
  size(); makeStars(); requestAnimationFrame(draw);
})();

/* ===================== LOAD GAME DATA FROM APPS SCRIPT ===================== */
fetch(APPS_SCRIPT_URL)
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(data => {
    IMG = data.images || {};
    AUDIO_SRC = data.audioSrc || '';
    CONFIG = Object.assign(CONFIG, data.config || {});
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('introScreen').classList.remove('hidden');
  })
  .catch(err => {
    console.error('Failed to load game data:', err);
    const t = document.querySelector('#loadingScreen .loading-text');
    if (t) t.textContent = 'Gagal memuat. Coba refresh halaman ini, Ra.';
  });
