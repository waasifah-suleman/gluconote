const API = 'http://127.0.0.1:8000'

// TOGGLE FORMS
function toggleForm(formId) {
    const form = document.getElementById(formId)
    form.style.display = form.style.display === 'none' ? 'block' : 'none'
}

// TAB SWITCHING
function switchTab(tabName, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'))
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.getElementById(`tab-${tabName}`).classList.add('active')
    btn.classList.add('active')
}

// CHART
let glucoseChart = null
let allReadings = []

function initChart(readings) {
    const ctx = document.getElementById('glucoseChart').getContext('2d')

    if (glucoseChart) {
        glucoseChart.destroy()
    }

    if (readings.length === 0) {
        document.getElementById('glucoseChart').style.display = 'none'
        document.getElementById('chartEmpty').style.display = 'flex'
        return
    }

    document.getElementById('glucoseChart').style.display = 'block'
    document.getElementById('chartEmpty').style.display = 'none'

    const sorted = readings.sort((a, b) => new Date(a.reading_time) - new Date(b.reading_time))

    const labels = sorted.map(r => {
        return new Date(r.reading_time).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
    })

    const values = sorted.map(r => r.value)

    glucoseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Blood Sugar',
                data: values,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 4,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { color: '#f0f0f0' },
                    ticks: { color: '#aaa', font: { size: 12 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#f0f0f0' },
                    ticks: { color: '#aaa', font: { size: 12 } }
                }
            }
        }
    })
}

function filterChart(days, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    initChart(allReadings.filter(r => new Date(r.reading_time) >= cutoff))
}

// HELPERS
function getValueClass(value) {
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

// READINGS
async function loadReadings() {
    try {
        const res = await fetch(`${API}/readings`)
        const readings = await res.json()
        allReadings = readings
        renderReadingsTable(readings)
        initChart(readings)
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
            <td class="${getValueClass(r.value)}">${r.value}</td>
            <td>${formatContext(r.context)}</td>
            <td>
                <button class="btn-delete" onclick="deleteReading(${r.id})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `).join('')
}

async function submitReading(event) {
    event.preventDefault()
    const date = document.getElementById('readingDate').value
    const time = document.getElementById('readingTime').value
    const body = {
        value: parseFloat(document.getElementById('readingValue').value),
        reading_time: `${date}T${time}:00`,
        context: document.getElementById('readingContext').value,
        notes: null
    }
    try {
        await fetch(`${API}/readings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        event.target.reset()
        loadReadings()
    } catch (err) {
        console.error('Failed to submit reading:', err)
    }
}

async function deleteReading(id) {
    if (!confirm('Delete this reading?')) return
    try {
        await fetch(`${API}/readings/${id}`, { method: 'DELETE' })
        loadReadings()
    } catch (err) {
        console.error('Failed to delete reading:', err)
    }
}

// MEDICATIONS
async function loadMedications() {
    try {
        const res = await fetch(`${API}/medications`)
        const medications = await res.json()
        renderMedications(medications)
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
                <strong>${m.name}</strong>
                <p>${m.dosage}</p>
                <p>Started: ${formatDateOnly(m.start_date)}</p>
                ${m.prescribing_doctor ? `<p>Prescribed by: ${m.prescribing_doctor}</p>` : ''}
            </div>
            <button class="btn-delete" onclick="deleteMedication(${m.id})">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        </div>
    `).join('')
}

async function submitMedication(event) {
    event.preventDefault()
    const startDate = document.getElementById('medStartDate').value
    const endDate = document.getElementById('medEndDate').value
    const body = {
        name: document.getElementById('medName').value,
        dosage: document.getElementById('medDosage').value,
        frequency: 'daily',
        start_date: `${startDate}T00:00:00`,
        end_date: endDate ? `${endDate}T00:00:00` : null,
        prescribing_doctor: document.getElementById('medDoctor').value || null
    }
    try {
        await fetch(`${API}/medications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        event.target.reset()
        toggleForm('medForm')
        loadMedications()
    } catch (err) {
        console.error('Failed to submit medication:', err)
    }
}

async function deleteMedication(id) {
    if (!confirm('Delete this medication?')) return
    try {
        await fetch(`${API}/medications/${id}`, { method: 'DELETE' })
        loadMedications()
    } catch (err) {
        console.error('Failed to delete medication:', err)
    }
}

// VISITS
async function loadVisits() {
    try {
        const res = await fetch(`${API}/visits`)
        const visits = await res.json()
        renderVisits(visits)
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
                <strong>${v.doctor_name}</strong>
                ${v.notes ? `<p>${v.notes}</p>` : ''}
            </div>
            <button class="btn-delete" onclick="deleteVisit(${v.id})">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        </div>
    `).join('')
}

async function submitVisit(event) {
    event.preventDefault()
    const visitDate = document.getElementById('visitDate').value
    const body = {
        visit_date: `${visitDate}T00:00:00`,
        doctor_name: document.getElementById('visitDoctor').value,
        notes: document.getElementById('visitNotes').value || null,
        follow_up_date: null
    }
    try {
        await fetch(`${API}/visits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        event.target.reset()
        toggleForm('visitForm')
        loadVisits()
    } catch (err) {
        console.error('Failed to submit visit:', err)
    }
}

async function deleteVisit(id) {
    if (!confirm('Delete this visit?')) return
    try {
        await fetch(`${API}/visits/${id}`, { method: 'DELETE' })
        loadVisits()
    } catch (err) {
        console.error('Failed to delete visit:', err)
    }
}

// NOTES
async function loadNotes() {
    try {
        const res = await fetch(`${API}/notes`)
        const notes = await res.json()
        renderNotes(notes)
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
                <p class="note-text">${n.content}</p>
            </div>
            <button class="btn-delete" onclick="deleteNote(${n.id})">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        </div>
    `).join('')
}

async function submitNote(event) {
    event.preventDefault()
    const body = {
        content: document.getElementById('noteContent').value,
        tags: null
    }
    try {
        await fetch(`${API}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        event.target.reset()
        toggleForm('noteForm')
        loadNotes()
    } catch (err) {
        console.error('Failed to submit note:', err)
    }
}

async function deleteNote(id) {
    if (!confirm('Delete this note?')) return
    try {
        await fetch(`${API}/notes/${id}`, { method: 'DELETE' })
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

        document.getElementById('summaryContent').innerHTML = `
            <div class="summary-section">
                <h3>Patient</h3>
                <div class="summary-item">
                    <strong>${data.patient.name}</strong>
                    <p>Age: ${data.patient.age || 'Unknown'} | Diagnosis: ${data.patient.diagnosis || 'Unknown'}</p>
                </div>
            </div>
            <div class="summary-section">
                <h3>Glucose Summary - Last 30 Days</h3>
                <div class="glucose-stats">
                    <div class="glucose-stat-box"><span>${data.glucose_summary.average || '—'}</span><p>Average</p></div>
                    <div class="glucose-stat-box"><span>${data.glucose_summary.highest || '—'}</span><p>Highest</p></div>
                    <div class="glucose-stat-box"><span>${data.glucose_summary.lowest || '—'}</span><p>Lowest</p></div>
                    <div class="glucose-stat-box"><span>${data.glucose_summary.total_readings}</span><p>Readings</p></div>
                </div>
            </div>
            <div class="summary-section">
                <h3>Current Medications</h3>
                ${
                    data.active_medications.length > 0
                        ? data.active_medications.map(m => `
                            <div class="summary-item">
                                <strong>${m.name} - ${m.dosage} ${m.frequency}</strong>
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
                                <strong>${formatDateOnly(v.date)} - ${v.doctor}</strong>
                                ${v.notes ? `<p>${v.notes}</p>` : ''}
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
                                <p style="color:#1a1a1a;">${n.content}</p>
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
    const query = document.getElementById('searchInput').value.trim()
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
                <p>${formatDate(r.reading_time)} - <strong>${r.value}</strong> - ${formatContext(r.context)}</p>
            `).join('')
            html += '</div>'
        }

        if (data.results.medications.length > 0) {
            html += `<div class="search-section"><h3>Medications</h3>`
            html += data.results.medications.map(m => `
                <p>${m.name} - ${m.dosage} - started ${formatDateOnly(m.start_date)}</p>
            `).join('')
            html += '</div>'
        }

        if (data.results.visits.length > 0) {
            html += `<div class="search-section"><h3>Visits</h3>`
            html += data.results.visits.map(v => `
                <p>${formatDateOnly(v.visit_date)} - ${v.doctor_name}</p>
            `).join('')
            html += '</div>'
        }

        if (data.results.notes.length > 0) {
            html += `<div class="search-section"><h3>Notes</h3>`
            html += data.results.notes.map(n => `<p>${n.content}</p>`).join('')
            html += '</div>'
        }

        if (!html) {
            html = `<p style="color:#aaa">No results found for "${query}"</p>`
        }

        resultsContent.innerHTML = html
        resultsCard.style.display = 'block'
        resultsCard.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
        console.error('Search failed:', err)
    }
}

document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleSearch()
})

// PROFILE
async function loadProfile() {
    try {
        const res = await fetch(`${API}/profile`)
        if (res.ok) {
            const profile = await res.json()
            document.getElementById('avatarInitials').innerHTML =
                `${profile.first_name[0]}${profile.last_name[0]}`
        }
    } catch (err) {
        // no profile yet, icon stays
    }
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    loadProfile()
    loadReadings()
    loadMedications()
    loadVisits()
    loadNotes()
})
