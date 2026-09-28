// Empty string = same server that serves this page.
// Works locally (http://127.0.0.1:8000) and once deployed, with no changes.
const API = ''

// SECURITY HELPER
// Anything a user typed is escaped before it goes into innerHTML,
// so text like <script> is shown as text instead of running as code.
function escapeHtml(value) {
    if (value === null || value === undefined) return ''
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// PROFILE MODAL
let profileExists = false
let currentProfile = null

async function openProfile() {
    try {
        const res = await fetch(`${API}/profile`)
        if (res.ok) {
            currentProfile = await res.json()
            profileExists = true
            renderProfileView()
        } else {
            // no profile yet, go straight to the form
            currentProfile = null
            profileExists = false
            renderProfileForm()
        }
    } catch (err) {
        console.error('Failed to load profile:', err)
        renderProfileForm()
    }
    document.getElementById('profileOverlay').style.display = 'flex'
}

function closeProfile() {
    document.getElementById('profileOverlay').style.display = 'none'
}

function formatGender(gender) {
    if (!gender) return 'Prefer not to say'
    return gender.charAt(0).toUpperCase() + gender.slice(1)
}

function renderProfileView() {
    const p = currentProfile
    const initials = `${(p.first_name || '?')[0]}${(p.last_name || '')[0] || ''}`.toUpperCase()

    document.getElementById('profileContent').innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${escapeHtml(initials)}</div>
            <div>
                <p class="profile-name">${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</p>
                <p class="profile-sub">${escapeHtml(p.diabetes_type)}</p>
            </div>
        </div>
        <div class="profile-grid">
            <div class="profile-field">
                <span>Age</span>
                <p>${escapeHtml(p.age)}</p>
            </div>
            <div class="profile-field">
                <span>Gender</span>
                <p>${escapeHtml(formatGender(p.gender))}</p>
            </div>
            <div class="profile-field">
                <span>Diabetes Type</span>
                <p>${escapeHtml(p.diabetes_type)}</p>
            </div>
            <div class="profile-field">
                <span>Member Since</span>
                <p>${p.created_at ? formatDateOnly(p.created_at) : '-'}</p>
            </div>
        </div>
        <div class="form-actions" style="margin-top: 20px;">
            <button class="btn-primary" onclick="renderProfileForm()">
                <i class="fa-regular fa-pen-to-square"></i> Edit Profile
            </button>
        </div>
    `
}

function renderProfileForm() {
    const content = document.getElementById('profileContent')
    const p = currentProfile || {}
    // p stays an empty object if no profile exists yet, so all fields start blank

    content.innerHTML = `
        <form onsubmit="submitProfile(event)">
            <div class="form-row">
                <div class="form-group">
                    <label>First Name</label>
                    <input type="text" id="profileFirstName" value="${escapeHtml(p.first_name)}" required>
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" id="profileLastName" value="${escapeHtml(p.last_name)}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Age</label>
                    <input type="number" id="profileAge" min="0" max="120" value="${escapeHtml(p.age)}" required>
                </div>
                <div class="form-group">
                    <label>Gender (Optional)</label>
                    <select id="profileGender">
                        <option value="" ${!p.gender ? 'selected' : ''}>Prefer not to say</option>
                        <option value="female" ${p.gender === 'female' ? 'selected' : ''}>Female</option>
                        <option value="male" ${p.gender === 'male' ? 'selected' : ''}>Male</option>
                        <option value="other" ${p.gender === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Diabetes Type</label>
                <select id="profileDiabetesType" required>
                    <option value="Type 1" ${p.diabetes_type === 'Type 1' ? 'selected' : ''}>Type 1</option>
                    <option value="Type 2" ${p.diabetes_type === 'Type 2' ? 'selected' : ''}>Type 2</option>
                    <option value="Gestational" ${p.diabetes_type === 'Gestational' ? 'selected' : ''}>Gestational</option>
                    <option value="Prediabetes" ${p.diabetes_type === 'Prediabetes' ? 'selected' : ''}>Prediabetes</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Save</button>
                ${profileExists ? `<button type="button" class="btn-cancel" onclick="renderProfileView()">Cancel</button>` : ''}
            </div>
        </form>
    `
}

async function submitProfile(event) {
    event.preventDefault()

    const body = {
        first_name: document.getElementById('profileFirstName').value.trim(),
        last_name: document.getElementById('profileLastName').value.trim(),
        age: parseInt(document.getElementById('profileAge').value),
        gender: document.getElementById('profileGender').value || null,
        diabetes_type: document.getElementById('profileDiabetesType').value
    }

    // POST if creating for the first time, PUT if one already exists
    const method = profileExists ? 'PUT' : 'POST'

    try {
        const res = await fetch(`${API}/profile`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        if (!res.ok) throw new Error(`Profile save failed (${res.status})`)
        currentProfile = await res.json()
        profileExists = true
        renderProfileView()
        loadProfile()
        // refreshes the initials shown in the header avatar too
    } catch (err) {
        console.error('Failed to save profile:', err)
    }
}

// close modal if clicking outside it
document.getElementById('profileOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeProfile()
})

// ADD / EDIT FORMS (medications, visits, notes)
// Each form is used for both adding and editing.
// editing[key] holds the id being edited, or null when adding.
const editing = { reading: null, med: null, visit: null, note: null }

const FORM_CONFIG = {
    med: { wrapper: 'medForm', form: 'medFormEl', button: 'medSubmitBtn' },
    visit: { wrapper: 'visitForm', form: 'visitFormEl', button: 'visitSubmitBtn' },
    note: { wrapper: 'noteForm', form: 'noteFormEl', button: 'noteSubmitBtn' }
}

function openForm(key, item = null) {
    const config = FORM_CONFIG[key]
    editing[key] = item ? item.id : null
    document.getElementById(config.form).reset()
    document.getElementById(config.button).textContent = item ? 'Save Changes' : 'Add'
    document.getElementById(config.wrapper).style.display = 'block'
}

function closeForm(key) {
    const config = FORM_CONFIG[key]
    editing[key] = null
    document.getElementById(config.form).reset()
    document.getElementById(config.button).textContent = 'Add'
    document.getElementById(config.wrapper).style.display = 'none'
}

// Builds the edit + delete buttons shown on every row and card
function actionButtons(type, id) {
    return `
        <div class="row-actions">
            <button class="btn-edit" title="Edit" onclick="edit${type}(${id})">
                <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button class="btn-delete" title="Delete" onclick="delete${type}(${id})">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        </div>
    `
}

// TAB SWITCHING
function switchTab(tabName, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'))
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.getElementById(`tab-${tabName}`).classList.add('active')
    btn.classList.add('active')
    document.getElementById('searchResults').style.display = 'none'
}

// CHART
let glucoseChart = null
let allReadings = []
let chartDays = 7      // 7, 30, 90 or 'all'
let chartOffset = 0    // 0 = the most recent window, 1 = one window back, and so on

// Point colours match the table: green normal, orange high, red very high or low
function pointColor(value) {
    if (value < 70 || value > 180) return '#e74c3c'
    if (value > 140) return '#e67e22'
    return '#2ecc71'
}

function initChart(readings) {
    const ctx = document.getElementById('glucoseChart').getContext('2d')

    if (glucoseChart) {
        glucoseChart.destroy()
    }

    if (readings.length === 0) {
        document.getElementById('chartEmptyText').textContent = allReadings.length > 0
            ? 'No readings in this period - use the arrows to look further back'
            : 'No data yet - add your first reading'
        document.getElementById('chartInner').style.display = 'none'
        document.getElementById('chartHint').style.display = 'none'
        document.getElementById('chartYAxis').style.display = 'none'
        document.getElementById('chartEmpty').style.display = 'flex'
        return
    }

    document.getElementById('chartInner').style.display = 'block'
    document.getElementById('chartEmpty').style.display = 'none'

    // On small screens, lots of points get squashed together. Instead, the chart is made
    // wider than the screen (a set width per point) and the card scrolls sideways.
    const scroller = document.getElementById('chartScroll')
    const inner = document.getElementById('chartInner')
    const PX_PER_POINT = 14
    const neededWidth = readings.length * PX_PER_POINT
    const scrollable = window.innerWidth <= 768 && neededWidth > scroller.clientWidth

    inner.style.width = scrollable ? `${neededWidth}px` : '100%'
    document.getElementById('chartHint').style.display = scrollable ? 'block' : 'none'

    const sorted = [...readings].sort((a, b) => new Date(a.reading_time) - new Date(b.reading_time))

    const labels = sorted.map(r => {
        const time = new Date(r.reading_time)
        const date = time.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
        // the 7 day view often has several readings a day, so show the time underneath the date
        if (chartDays === 7) {
            return [date, time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })]
        }
        return date
    })

    const values = sorted.map(r => r.value)

    document.getElementById('chartYAxis').style.display = scrollable ? 'block' : 'none'

    glucoseChart = new Chart(ctx, {
        type: 'line',
        plugins: scrollable ? [stickyYAxis] : [],
        data: {
            labels: labels,
            datasets: [{
                label: 'Blood Sugar',
                data: values,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                fill: true,
                borderWidth: 2,
                pointBackgroundColor: values.map(pointColor),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1.5,
                pointRadius: sorted.length > 150 ? 2 : sorted.length > 60 ? 3 : 5,
                pointHoverRadius: 7,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        // show the full date and time plus context when hovering a point
                        title: items => formatDate(sorted[items[0].dataIndex].reading_time),
                        label: item => `${item.raw} mg/dL - ${formatContext(sorted[item.dataIndex].context)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: '#f0f0f0' },
                    ticks: { color: '#aaa', font: { size: 12 }, maxTicksLimit: scrollable ? Math.round(neededWidth / 80) : 10, maxRotation: 0 }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#f0f0f0' },
                    ticks: { color: '#aaa', font: { size: 12 } }
                }
            }
        }
    })

    // open on the newest readings, so swiping right to left goes back in time
    scroller.scrollLeft = scrollable ? scroller.scrollWidth : 0
}

// When the chart scrolls sideways, the y-axis numbers would scroll away with it.
// This copies the y-axis area of the chart onto a small canvas pinned to the left edge.
const stickyYAxis = {
    id: 'stickyYAxis',
    afterRender(chart) {
        const overlay = document.getElementById('chartYAxis')
        const ratio = chart.currentDevicePixelRatio
        // only the y-axis numbers: stop just before the plotted line and above the date labels
        const width = Math.floor(chart.scales.y.right) - 2
        const height = Math.ceil(chart.chartArea.bottom) + 1

        overlay.width = width * ratio
        overlay.height = height * ratio
        overlay.style.width = `${width}px`
        overlay.style.height = `${height}px`

        const ctx = overlay.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, overlay.width, overlay.height)
        ctx.drawImage(chart.canvas, 0, 0, width * ratio, height * ratio, 0, 0, width * ratio, height * ratio)
    }
}

// Start and end dates of the window currently being shown
function chartWindow() {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    end.setDate(end.getDate() - chartOffset * chartDays)

    const start = new Date(end)
    start.setDate(start.getDate() - chartDays + 1)
    start.setHours(0, 0, 0, 0)

    return { start, end }
}

// Only keeps readings inside the current window
function readingsInRange() {
    if (chartDays === 'all') return allReadings

    const { start, end } = chartWindow()
    return allReadings.filter(r => {
        const time = new Date(r.reading_time)
        // the newest window also includes anything logged later today
        return time >= start && (chartOffset === 0 || time <= end)
    })
}

function formatShortDate(date, withYear) {
    const options = { day: 'numeric', month: 'short' }
    if (withYear) options.year = 'numeric'
    return date.toLocaleDateString('en-GB', options)
}

// Updates the "15 Sept - 21 Sept" label and enables or disables the arrows
function updateChartNav() {
    const nav = document.getElementById('chartNav')

    if (chartDays === 'all') {
        nav.style.visibility = 'hidden'
        return
    }
    nav.style.visibility = 'visible'

    const { start, end } = chartWindow()
    const showYear = start.getFullYear() !== new Date().getFullYear()
    document.getElementById('chartRangeLabel').textContent =
        `${formatShortDate(start, showYear)} - ${formatShortDate(end, true)}`

    // can only go back if there are older readings, and forward if we are not already at today
    const hasOlder = allReadings.some(r => new Date(r.reading_time) < start)
    document.getElementById('chartPrev').disabled = !hasOlder
    document.getElementById('chartNext').disabled = chartOffset === 0
}

function renderChart() {
    initChart(readingsInRange())
    updateChartNav()
}

function shiftChart(steps) {
    chartOffset = Math.max(0, chartOffset + steps)
    renderChart()
}

function filterChart(days, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    chartDays = days
    chartOffset = 0
    renderChart()
}

// HELPERS
function getValueClass(value) {
    if (value < 70) return 'value-very-high'
    // below 70 mg/dL is low, which is as serious as very high
    if (value <= 140) return 'value-normal'
    if (value <= 180) return 'value-high'
    return 'value-very-high'
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function formatDateOnly(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

function formatContext(context) {
    const map = {
        'before_meal': 'Before Meal',
        'after_meal': 'After Meal',
        'fasting': 'Fasting',
        'bedtime': 'Bedtime'
    }
    return map[context] || context
}

// "2026-09-28T08:30:00" -> "2026-09-28" (for date inputs)
function toDateInput(dateString) {
    return dateString ? dateString.slice(0, 10) : ''
}

// "2026-09-28T08:30:00" -> "08:30" (for time inputs)
function toTimeInput(dateString) {
    return dateString ? dateString.slice(11, 16) : ''
}

// READINGS
async function loadReadings() {
    try {
        const res = await fetch(`${API}/readings`)
        allReadings = await res.json()
        renderReadingsTable(allReadings)
        renderChart()
    } catch (err) {
        console.error('Failed to load readings:', err)
    }
}

function renderReadingsTable(readings) {
    const tbody = document.getElementById('readingsTableBody')
    if (readings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:24px;">No readings yet</td></tr>`
        return
    }
    const sorted = [...readings].sort((a, b) => new Date(b.reading_time) - new Date(a.reading_time))
    tbody.innerHTML = sorted.map(r => `
        <tr>
            <td>${formatDate(r.reading_time)}</td>
            <td class="${getValueClass(r.value)}">${escapeHtml(r.value)}</td>
            <td>${escapeHtml(formatContext(r.context))}</td>
            <td>${actionButtons('Reading', r.id)}</td>
        </tr>
    `).join('')
}

function editReading(id) {
    const reading = allReadings.find(r => r.id === id)
    if (!reading) return

    editing.reading = id
    document.getElementById('readingValue').value = reading.value
    document.getElementById('readingDate').value = toDateInput(reading.reading_time)
    document.getElementById('readingTime').value = toTimeInput(reading.reading_time)
    document.getElementById('readingContext').value = reading.context

    document.getElementById('readingFormTitle').textContent = 'Edit Reading'
    document.getElementById('readingSubmitBtn').innerHTML = 'Save Changes'
    document.getElementById('readingCancelBtn').style.display = 'inline-block'
    document.getElementById('readingForm').scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function cancelReadingEdit() {
    editing.reading = null
    document.getElementById('readingForm').reset()
    document.getElementById('readingFormTitle').textContent = 'Add New Reading'
    document.getElementById('readingSubmitBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Add Reading'
    document.getElementById('readingCancelBtn').style.display = 'none'
}

async function submitReading(event) {
    event.preventDefault()
    const date = document.getElementById('readingDate').value
    const time = document.getElementById('readingTime').value

    // keep any existing notes when editing, since the form has no notes field
    const existing = allReadings.find(r => r.id === editing.reading)

    const body = {
        value: parseFloat(document.getElementById('readingValue').value),
        reading_time: `${date}T${time}:00`,
        context: document.getElementById('readingContext').value,
        notes: existing ? existing.notes : null
    }

    const url = editing.reading ? `${API}/readings/${editing.reading}` : `${API}/readings`
    const method = editing.reading ? 'PUT' : 'POST'

    try {
        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        cancelReadingEdit()
        loadReadings()
    } catch (err) {
        console.error('Failed to save reading:', err)
    }
}

async function deleteReading(id) {
    if (!confirm('Delete this reading?')) return
    try {
        await fetch(`${API}/readings/${id}`, { method: 'DELETE' })
        if (editing.reading === id) cancelReadingEdit()
        loadReadings()
    } catch (err) {
        console.error('Failed to delete reading:', err)
    }
}

// MEDICATIONS
let allMedications = []

async function loadMedications() {
    try {
        const res = await fetch(`${API}/medications`)
        allMedications = await res.json()
        renderMedications(allMedications)
    } catch (err) {
        console.error('Failed to load medications:', err)
    }
}

function renderMedications(medications) {
    const container = document.getElementById('medicationsList')
    if (medications.length === 0) {
        container.innerHTML = `<p style="color:#aaa;text-align:center;padding:24px;">No medications yet</p>`
        return
    }
    container.innerHTML = medications.map(m => `
        <div class="med-card">
            <div class="med-card-info">
                <strong>${escapeHtml(m.name)}</strong>
                <p>${escapeHtml(m.dosage)}</p>
                <p>Started: ${formatDateOnly(m.start_date)}${m.end_date ? ` | Ended: ${formatDateOnly(m.end_date)}` : ''}</p>
                ${m.prescribing_doctor ? `<p>Prescribed by: ${escapeHtml(m.prescribing_doctor)}</p>` : ''}
            </div>
            ${actionButtons('Medication', m.id)}
        </div>
    `).join('')
}

function editMedication(id) {
    const m = allMedications.find(item => item.id === id)
    if (!m) return
    openForm('med', m)
    document.getElementById('medName').value = m.name
    document.getElementById('medDosage').value = m.dosage
    document.getElementById('medStartDate').value = toDateInput(m.start_date)
    document.getElementById('medEndDate').value = toDateInput(m.end_date)
    document.getElementById('medDoctor').value = m.prescribing_doctor || ''
    document.getElementById('medForm').scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function submitMedication(event) {
    event.preventDefault()
    const startDate = document.getElementById('medStartDate').value
    const endDate = document.getElementById('medEndDate').value
    const existing = allMedications.find(m => m.id === editing.med)

    const body = {
        name: document.getElementById('medName').value.trim(),
        dosage: document.getElementById('medDosage').value.trim(),
        frequency: existing ? existing.frequency : 'daily',
        start_date: `${startDate}T00:00:00`,
        end_date: endDate ? `${endDate}T00:00:00` : null,
        prescribing_doctor: document.getElementById('medDoctor').value.trim() || null
    }

    const url = editing.med ? `${API}/medications/${editing.med}` : `${API}/medications`
    const method = editing.med ? 'PUT' : 'POST'

    try {
        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        closeForm('med')
        loadMedications()
    } catch (err) {
        console.error('Failed to save medication:', err)
    }
}

async function deleteMedication(id) {
    if (!confirm('Delete this medication?')) return
    try {
        await fetch(`${API}/medications/${id}`, { method: 'DELETE' })
        if (editing.med === id) closeForm('med')
        loadMedications()
    } catch (err) {
        console.error('Failed to delete medication:', err)
    }
}

// VISITS
let allVisits = []

async function loadVisits() {
    try {
        const res = await fetch(`${API}/visits`)
        allVisits = await res.json()
        renderVisits(allVisits)
    } catch (err) {
        console.error('Failed to load visits:', err)
    }
}

function renderVisits(visits) {
    const container = document.getElementById('visitsList')
    if (visits.length === 0) {
        container.innerHTML = `<p style="color:#aaa;text-align:center;padding:24px;">No visits yet</p>`
        return
    }
    const sorted = [...visits].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
    container.innerHTML = sorted.map(v => `
        <div class="visit-card">
            <div class="visit-card-info">
                <div class="visit-date">
                    <i class="fa-regular fa-calendar"></i>
                    ${formatDateOnly(v.visit_date)}
                </div>
                <strong>${escapeHtml(v.doctor_name)}</strong>
                ${v.notes ? `<p>${escapeHtml(v.notes)}</p>` : ''}
            </div>
            ${actionButtons('Visit', v.id)}
        </div>
    `).join('')
}

function editVisit(id) {
    const v = allVisits.find(item => item.id === id)
    if (!v) return
    openForm('visit', v)
    document.getElementById('visitDate').value = toDateInput(v.visit_date)
    document.getElementById('visitDoctor').value = v.doctor_name
    document.getElementById('visitNotes').value = v.notes || ''
    document.getElementById('visitForm').scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function submitVisit(event) {
    event.preventDefault()
    const visitDate = document.getElementById('visitDate').value
    const existing = allVisits.find(v => v.id === editing.visit)

    const body = {
        visit_date: `${visitDate}T00:00:00`,
        doctor_name: document.getElementById('visitDoctor').value.trim(),
        notes: document.getElementById('visitNotes').value.trim() || null,
        follow_up_date: existing ? existing.follow_up_date : null
    }

    const url = editing.visit ? `${API}/visits/${editing.visit}` : `${API}/visits`
    const method = editing.visit ? 'PUT' : 'POST'

    try {
        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        closeForm('visit')
        loadVisits()
    } catch (err) {
        console.error('Failed to save visit:', err)
    }
}

async function deleteVisit(id) {
    if (!confirm('Delete this visit?')) return
    try {
        await fetch(`${API}/visits/${id}`, { method: 'DELETE' })
        if (editing.visit === id) closeForm('visit')
        loadVisits()
    } catch (err) {
        console.error('Failed to delete visit:', err)
    }
}

// NOTES
let allNotes = []

async function loadNotes() {
    try {
        const res = await fetch(`${API}/notes`)
        allNotes = await res.json()
        renderNotes(allNotes)
    } catch (err) {
        console.error('Failed to load notes:', err)
    }
}

function renderNotes(notes) {
    const container = document.getElementById('notesContainer')
    if (notes.length === 0) {
        container.innerHTML = `<p style="color:#aaa;text-align:center;padding:24px;">No notes yet</p>`
        return
    }
    const sorted = [...notes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    container.innerHTML = sorted.map(n => `
        <div class="note-card">
            <div class="note-card-info">
                <div class="note-timestamp">
                    <i class="fa-regular fa-file-lines"></i>
                    ${formatDate(n.created_at)}
                </div>
                <p class="note-text">${escapeHtml(n.content)}</p>
            </div>
            ${actionButtons('Note', n.id)}
        </div>
    `).join('')
}

function editNote(id) {
    const n = allNotes.find(item => item.id === id)
    if (!n) return
    openForm('note', n)
    document.getElementById('noteContent').value = n.content
    document.getElementById('noteForm').scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function submitNote(event) {
    event.preventDefault()
    const existing = allNotes.find(n => n.id === editing.note)

    const body = {
        content: document.getElementById('noteContent').value.trim(),
        tags: existing ? existing.tags : null
    }

    const url = editing.note ? `${API}/notes/${editing.note}` : `${API}/notes`
    const method = editing.note ? 'PUT' : 'POST'

    try {
        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        closeForm('note')
        loadNotes()
    } catch (err) {
        console.error('Failed to save note:', err)
    }
}

async function deleteNote(id) {
    if (!confirm('Delete this note?')) return
    try {
        await fetch(`${API}/notes/${id}`, { method: 'DELETE' })
        if (editing.note === id) closeForm('note')
        loadNotes()
    } catch (err) {
        console.error('Failed to delete note:', err)
    }
}

// SUMMARY MODAL
async function openSummary() {
    try {
        const res = await fetch(`${API}/summary`)
        const data = await res.json()
        const stats = data.glucose_summary

        document.getElementById('summaryContent').innerHTML = `
            <div class="summary-section">
                <h3>Patient</h3>
                <div class="summary-item">
                    <strong>${escapeHtml(data.patient.name)}</strong>
                    <p>Age: ${escapeHtml(data.patient.age || 'Unknown')} | Diabetes Type: ${escapeHtml(data.patient.diabetes_type || 'Unknown')}</p>
                </div>
            </div>
            <div class="summary-section">
                <h3>Glucose Summary - Last 30 Days (mg/dL)</h3>
                <div class="glucose-stats">
                    <div class="glucose-stat-box"><span>${stats.average ?? '-'}</span><p>Average</p></div>
                    <div class="glucose-stat-box"><span>${stats.highest ?? '-'}</span><p>Highest</p></div>
                    <div class="glucose-stat-box"><span>${stats.lowest ?? '-'}</span><p>Lowest</p></div>
                    <div class="glucose-stat-box"><span>${stats.total_readings}</span><p>Readings</p></div>
                </div>
            </div>
            <div class="summary-section">
                <h3>Current Medications</h3>
                ${
                    data.active_medications.length > 0
                        ? data.active_medications.map(m => `
                            <div class="summary-item">
                                <strong>${escapeHtml(m.name)}</strong>
                                <p>${escapeHtml(m.dosage)}</p>
                            </div>
                        `).join('')
                        : '<p style="color:#aaa">None recorded</p>'
                }
            </div>
            <div class="summary-section">
                <h3>Recent Visits</h3>
                ${
                    data.recent_visits.length > 0
                        ? data.recent_visits.map(v => `
                            <div class="summary-item">
                                <strong>${formatDateOnly(v.date)} - ${escapeHtml(v.doctor)}</strong>
                                ${v.notes ? `<p>${escapeHtml(v.notes)}</p>` : ''}
                            </div>
                        `).join('')
                        : '<p style="color:#aaa">None recorded</p>'
                }
            </div>
            <div class="summary-section">
                <h3>Recent Notes & Observations</h3>
                ${
                    data.recent_notes.length > 0
                        ? data.recent_notes.map(n => `
                            <div class="summary-item">
                                <p style="color:#888;font-size:12px;margin-bottom:4px;">${formatDateOnly(n.date)}</p>
                                <p style="color:#1a1a1a;">${escapeHtml(n.content)}</p>
                            </div>
                        `).join('')
                        : '<p style="color:#aaa">None recorded</p>'
                }
            </div>
        `

        document.getElementById('summaryOverlay').style.display = 'flex'
    } catch (err) {
        console.error('Failed to load summary:', err)
    }
}

function closeSummary() {
    document.getElementById('summaryOverlay').style.display = 'none'
}

document.getElementById('summaryOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeSummary()
})

// SEARCH
async function handleSearch() {
    const input = document.getElementById('searchInput')
    const query = input.value.trim()
    if (!query) return
    try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        const resultsCard = document.getElementById('searchResults')
        const resultsContent = document.getElementById('searchResultsContent')
        let html = ''

        if (data.results.readings.length > 0) {
            html += `<div class="search-section"><h3>Readings</h3>`
            html += data.results.readings.map(r => `
                <p>${formatDate(r.reading_time)} - <strong>${escapeHtml(r.value)}</strong> - ${escapeHtml(formatContext(r.context))}</p>
            `).join('')
            html += '</div>'
        }

        if (data.results.medications.length > 0) {
            html += `<div class="search-section"><h3>Medications</h3>`
            html += data.results.medications.map(m => `
                <p>${escapeHtml(m.name)} - ${escapeHtml(m.dosage)} - started ${formatDateOnly(m.start_date)}</p>
            `).join('')
            html += '</div>'
        }

        if (data.results.visits.length > 0) {
            html += `<div class="search-section"><h3>Visits</h3>`
            html += data.results.visits.map(v => `
                <p>${formatDateOnly(v.visit_date)} - ${escapeHtml(v.doctor_name)}</p>
            `).join('')
            html += '</div>'
        }

        if (data.results.notes.length > 0) {
            html += `<div class="search-section"><h3>Notes</h3>`
            html += data.results.notes.map(n => `<p>${escapeHtml(n.content)}</p>`).join('')
            html += '</div>'
        }

        if (!html) {
            html = `<p style="color:#aaa">No results found for "${escapeHtml(query)}"</p>`
        }

        document.getElementById('searchResultsTitle').textContent = `Results for "${query}"`
        resultsContent.innerHTML = html
        resultsCard.style.display = 'block'

        // clear the search bar so the next search starts fresh
        input.value = ''
        input.blur()
        resultsCard.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
        console.error('Search failed:', err)
    }
}

function closeSearch() {
    document.getElementById('searchResults').style.display = 'none'
}

document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleSearch()
})

// PROFILE (header avatar)
async function loadProfile() {
    try {
        const res = await fetch(`${API}/profile`)
        if (res.ok) {
            const profile = await res.json()
            const initials = `${(profile.first_name || '?')[0]}${(profile.last_name || '')[0] || ''}`.toUpperCase()
            document.getElementById('avatarInitials').textContent = initials
        }
    } catch (err) {
        // no profile yet, icon stays
    }
}

// redraw the chart when the screen size changes (e.g. turning a phone sideways)
let resizeTimer = null
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(renderChart, 250)
})

// INIT
document.addEventListener('DOMContentLoaded', () => {
    loadProfile()
    loadReadings()
    loadMedications()
    loadVisits()
    loadNotes()
})
