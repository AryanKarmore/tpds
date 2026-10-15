const KEY = 'students_v2';
const SUBJECTS = [
  { name: 'Data Structures',     code: 'CS201', teacher: 'Dr. A. Kumar', credits: 4 },
  { name: 'Operating Systems',   code: 'CS202', teacher: 'Dr. S. Verma', credits: 4 },
  { name: 'Database Management', code: 'CS203', teacher: 'Dr. P. Singh', credits: 4 },
  { name: 'Computer Networks',   code: 'CS204', teacher: 'Dr. R. Mehta', credits: 3 },
  { name: 'Web Technologies',    code: 'CS205', teacher: 'Dr. K. Joshi', credits: 3 }
];
const TOTAL_CREDITS = SUBJECTS.reduce((a, s) => a + s.credits, 0);

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const cgpaGrade = c => c >= 9 ? 'A+' : c >= 8 ? 'A' : c >= 7 ? 'B' : c >= 6 ? 'C' : c >= 5 ? 'D' : 'F';
const markGrade = t => t >= 80 ? 'A' : t >= 65 ? 'B' : t >= 50 ? 'C' : t >= 40 ? 'D' : 'F';
const gradeCls = g => ({ 'A+': 'success', A: 'success', B: 'primary', C: 'warning', D: 'warning', F: 'danger' }[g]);

let students = [];
try { students = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
let featured = students.length ? students[0].roll : null;
const modal = new bootstrap.Modal($('detailModal'));
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(students)); } catch (e) {} };
const current = () => students.find(s => s.roll === featured);

/* ---------- Build marks inputs in the form ---------- */
$('marksBox').innerHTML = SUBJECTS.map((s, i) => `
  <div class="row g-2 align-items-center mb-2 marks-row">
    <div class="col-md-4 small fw-semibold">${s.name}</div>
    <div class="col-6 col-md-4"><input id="mi${i}" type="number" min="0" max="30" required class="form-control form-control-sm" placeholder="Internal /30">
      <div class="invalid-feedback">0–30</div></div>
    <div class="col-6 col-md-4"><input id="me${i}" type="number" min="0" max="70" required class="form-control form-control-sm" placeholder="External /70">
      <div class="invalid-feedback">0–70</div></div>
  </div>`).join('');

/* ---------- Rendering ---------- */
function renderHero() {
  const s = current();
  $('heroBtn').disabled = !s;
  if (!s) {
    $('heroAvatar').textContent = '?'; $('heroName').textContent = 'No student selected';
    $('heroMeta').textContent = 'Register a student to see their profile here.';
    $('heroBar').style.width = '0%'; $('heroPct').textContent = '0%';
    $('stAtt').textContent = $('stCgpa').textContent = $('stCredits').textContent = '–';
    return;
  }
  const overall = Math.round(s.marks.reduce((a, m) => a + m.i + m.e, 0) / SUBJECTS.length);
  $('heroAvatar').textContent = s.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  $('heroName').textContent = s.name;
  $('heroMeta').innerHTML = `Roll No: ${esc(s.roll)}<br>${esc(s.branch)}<br>Batch: ${s.batch} - ${s.batch + 4}`;
  $('heroBar').style.width = overall + '%'; $('heroPct').textContent = overall + '%';
  $('stAtt').textContent = s.att + '%';
  $('stCgpa').textContent = s.cgpa.toFixed(2);
  $('stCredits').textContent = TOTAL_CREDITS;
}

function renderSubjects() {
  const s = current(), q = $('subSearch').value.trim().toLowerCase(), f = $('subFilter').value;
  if (!s) { $('subBody').innerHTML = ''; $('subEmpty').classList.remove('d-none'); return; }
  const rows = SUBJECTS.map((sub, i) => ({ sub, i, m: s.marks[i], total: s.marks[i].i + s.marks[i].e }))
    .filter(r => (!q || r.sub.name.toLowerCase().includes(q)) && (!f || markGrade(r.total) === f));
  $('subBody').innerHTML = rows.map((r, n) => {
    const g = markGrade(r.total);
    return `<tr><td>${n + 1}</td><td class="text-start">${r.sub.name}</td><td>${r.sub.teacher}</td>
      <td>${r.m.i}</td><td>${r.m.e}</td><td>${r.total}</td>
      <td><span class="badge bg-${gradeCls(g)}">${g}</span></td>
      <td><button class="btn btn-primary btn-sm" data-sub="${r.i}">View</button></td></tr>`;
  }).join('');
  $('subEmpty').textContent = 'No subjects match.';
  $('subEmpty').classList.toggle('d-none', rows.length > 0);
}

function renderFilter() {
  const cur = $('filter').value, branches = [...new Set(students.map(s => s.branch))];
  $('filter').innerHTML = '<option value="">All branches</option>' + branches.map(b => `<option>${esc(b)}</option>`).join('');
  $('filter').value = branches.includes(cur) ? cur : '';
}

function renderTable() {
  const q = $('search').value.trim().toLowerCase(), f = $('filter').value;
  const list = students.filter(s => (!f || s.branch === f) &&
    (!q || [s.name, s.roll, s.email].some(v => v.toLowerCase().includes(q))));
  $('tbody').innerHTML = list.map((s, i) => {
    const g = cgpaGrade(s.cgpa);
    return `<tr><td>${i + 1}</td><td class="text-start">${esc(s.name)}</td><td>${esc(s.roll)}</td>
      <td>${esc(s.branch)}</td><td>${s.cgpa.toFixed(2)}</td>
      <td><span class="badge bg-${gradeCls(g)}">${g}</span></td>
      <td><button class="btn btn-primary btn-sm" data-view="${esc(s.roll)}">View</button>
          <button class="btn btn-outline-danger btn-sm" data-del="${esc(s.roll)}">Delete</button></td></tr>`;
  }).join('');
  $('empty').classList.toggle('d-none', list.length > 0);
  $('stTotal').textContent = students.length;
}

function renderAll() { renderHero(); renderSubjects(); renderFilter(); renderTable(); }

/* ---------- Modals ---------- */
function openModal(title, rows) {
  $('modalTitle').textContent = title;
  $('detailBody').innerHTML = rows.map(([k, v]) => `<tr><th style="width:40%">${k}</th><td>${esc(v)}</td></tr>`).join('');
  modal.show();
}
function showStudent() {
  const s = current(); if (!s) return;
  openModal('Student Details', [['Name', s.name], ['Roll No.', s.roll], ['Email', s.email], ['Branch', s.branch],
    ['Batch', `${s.batch} - ${s.batch + 4}`], ['CGPA', s.cgpa.toFixed(2)], ['Attendance', s.att + '%'], ['Registered', s.date]]);
}
function showSubject(i) {
  const s = current(), sub = SUBJECTS[i], m = s.marks[i], t = m.i + m.e;
  openModal('Subject Details', [['Subject', sub.name], ['Subject Code', sub.code], ['Teacher', sub.teacher],
    ['Internal Marks', `${m.i} / 30`], ['External Marks', `${m.e} / 70`], ['Total Marks', `${t} / 100`],
    ['Grade', markGrade(t)], ['Credits', sub.credits]]);
}

/* ---------- Events ---------- */
$('regForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target, roll = $('roll').value.trim().toUpperCase();
  const dup = students.some(s => s.roll === roll);
  $('roll').setCustomValidity(dup ? 'dup' : '');
  $('rollErr').textContent = dup ? 'This roll number is already registered.' : 'Roll number is required.';
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;
  const s = {
    name: $('name').value.trim(), roll, email: $('email').value.trim(), branch: $('branch').value,
    batch: +$('batch').value, cgpa: +$('cgpa').value, att: +$('att').value,
    marks: SUBJECTS.map((_, i) => ({ i: +$('mi' + i).value, e: +$('me' + i).value })),
    date: new Date().toLocaleDateString()
  };
  students.unshift(s); featured = s.roll; save();
  form.reset(); $('batch').value = 2024; form.classList.remove('was-validated');
  renderAll();
});
$('resetBtn').addEventListener('click', () => $('regForm').classList.remove('was-validated'));
$('roll').addEventListener('input', () => $('roll').setCustomValidity(''));
$('search').addEventListener('input', renderTable);
$('filter').addEventListener('change', renderTable);
$('subSearch').addEventListener('input', renderSubjects);
$('subFilter').addEventListener('change', renderSubjects);
$('heroBtn').addEventListener('click', showStudent);
$('subBody').addEventListener('click', e => { if (e.target.dataset.sub !== undefined) showSubject(+e.target.dataset.sub); });
$('tbody').addEventListener('click', e => {
  const v = e.target.dataset.view, d = e.target.dataset.del;
  if (v) { featured = v; renderHero(); renderSubjects(); showStudent(); }
  if (d && confirm('Delete this student?')) {
    students = students.filter(s => s.roll !== d);
    if (featured === d) featured = students[0] ? students[0].roll : null;
    save(); renderAll();
  }
});

renderAll();
