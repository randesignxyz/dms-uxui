<script setup>
import { computed, ref, watch } from 'vue'
import { catalog, orderableCatalog } from './catalog'

const companies = [
  { name: 'Aeon', locations: ['Aeon Phnom Penh DC', 'Aeon Mall Sen Sok'] },
  { name: 'Lucky Supermarket', locations: ['Lucky Phnom Penh DC', 'Lucky Toul Kork'] },
  { name: 'Macro', locations: ['Macro Phnom Penh DC', 'Macro Siem Reap'] }
]

const seedOrders = [
  { id: 'SO-1048', po: 'AE-PO-2609-208', company: 'Aeon', location: 'Aeon Phnom Penh DC', delivery: '2026-10-06', status: 'Preparing', placed: '2026-09-29', lines: [{ sku: 'OMK1007-24', qty: 18 }, { sku: 'OMK1001-72', qty: 8 }] },
  { id: 'SO-1047', po: 'LS-PO-2609-092', company: 'Lucky Supermarket', location: 'Lucky Phnom Penh DC', delivery: '2026-10-04', status: 'Submitted', placed: '2026-09-30', lines: [{ sku: 'OMK1003-24', qty: 20 }, { sku: 'OMK1004-24', qty: 12 }] },
  { id: 'SO-1046', po: 'MC-PO-2609-014', company: 'Macro', location: 'Macro Phnom Penh DC', delivery: '2026-10-03', status: 'Dispatched', placed: '2026-09-27', lines: [{ sku: 'OMK1008-24', qty: 10 }, { sku: 'OMK1011-72', qty: 6 }] },
  { id: 'SO-1045', po: 'AE-PO-2609-180', company: 'Aeon', location: 'Aeon Mall Sen Sok', delivery: '2026-09-30', status: 'Delivered', placed: '2026-09-24', lines: [{ sku: 'OMK1007-24', qty: 8 }] }
]

const stages = ['Submitted', 'Confirmed', 'Preparing', 'Dispatched', 'Delivered']
const money = n => n === null || n === undefined ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const quantityLabel = (product, qty) => `${qty} ${product?.unit === 'case' ? (qty === 1 ? 'case' : 'cases') : (qty === 1 ? 'piece' : 'pieces')}`
const signedQuantityLabel = (product, qty) => `${qty > 0 ? '+' : '−'}${quantityLabel(product, Math.abs(qty))}`
const shortDate = s => new Date(`${s}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

const orders = ref(load('mt-preview-orders-v2', seedOrders))
const initialStock = Object.fromEntries(orderableCatalog.map(p => [p.sku, p.stock]))
const previousStock = load('mt-preview-stock-v2', initialStock)
const stock = ref(load('mt-preview-stock-v3', { ...previousStock, 'OMK1003-24': 0 }))
const movements = ref(load('mt-preview-movements-v2', []))

watch(orders, value => localStorage.setItem('mt-preview-orders-v2', JSON.stringify(value)), { deep: true })
watch(stock, value => localStorage.setItem('mt-preview-stock-v3', JSON.stringify(value)), { deep: true })
watch(movements, value => localStorage.setItem('mt-preview-movements-v2', JSON.stringify(value)), { deep: true })

const role = ref('')
const company = ref('Aeon')
const page = ref('home')
const selected = ref(null)
const notice = ref('')
const search = ref('')
const statusFilter = ref('All statuses')
const productSearch = ref('')
const categoryFilter = ref('All products')
const stockSearch = ref('')
const productCategories = ['All products', ...new Set(catalog.map(p => p.category))]

const lang = ref(load('mt-preview-lang', 'en'))
watch(lang, val => localStorage.setItem('mt-preview-lang', JSON.stringify(val)))

const itemName = itemOrSku => {
  if (!itemOrSku) return ''
  const item = typeof itemOrSku === 'string' ? catalog.find(p => p.sku === itemOrSku) : itemOrSku
  if (!item) return typeof itemOrSku === 'string' ? itemOrSku : ''
  if (lang.value === 'kh' && item.nameKh) {
    return item.nameKh
  }
  return item.name || item.sku || ''
}

const visibleCatalog = computed(() =>
  catalog.filter(p =>
    (categoryFilter.value === 'All products' || p.category === categoryFilter.value) &&
    `${p.name} ${p.nameKh || ''} ${p.sku || ''}`.toLowerCase().includes(productSearch.value.toLowerCase())
  )
)

const today = new Date()
const suggestedDate = new Date(today.getTime() + 3 * 86400000).toISOString().slice(0, 10)
const draft = ref({ po: '', location: companies[0].locations[0], delivery: suggestedDate, quantities: {} })
const receipt = ref({ sku: orderableCatalog[0].sku, qty: 12, reference: '' })

const profileMenuOpen = ref(false)
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    profileMenuOpen.value = false
  })
}

const userProfile = computed(() => {
  if (role.value === 'team') {
    return {
      name: 'Vichea Seng',
      roleTitle: 'Operations Manager',
      initials: 'VS',
      companyName: 'OFL Company'
    }
  }
  return {
    name: 'Sok Dara',
    roleTitle: 'Purchasing manager',
    initials: 'SD',
    companyName: 'OFL Company'
  }
})

const customer = computed(() => companies.find(c => c.name === company.value) || companies[0])
const visibleOrders = computed(() => orders.value.filter(o => role.value === 'team' || o.company === company.value))
const filteredOrders = computed(() =>
  visibleOrders.value.filter(o =>
    (statusFilter.value === 'All statuses' || o.status === statusFilter.value) &&
    `${o.id} ${o.po} ${o.company} ${o.location}`.toLowerCase().includes(search.value.toLowerCase())
  )
)
const sortedOrders = computed(() => [...filteredOrders.value].reverse())
const chosen = computed(() => orders.value.find(o => o.id === selected.value))
const draftLines = computed(() =>
  orderableCatalog.filter(p => Number(draft.value.quantities[p.sku]) > 0).map(p => ({ ...p, qty: Number(draft.value.quantities[p.sku]) }))
)
const draftTotal = computed(() => draftLines.value.reduce((sum, line) => sum + line.qty * line.price, 0))
const orderTotal = o => o.lines.reduce((sum, line) => sum + (catalog.find(p => p.sku === line.sku)?.price || 0) * line.qty, 0)
const available = o => o.lines.every(line => Number(stock.value[line.sku] || 0) >= line.qty)

const pendingCount = computed(() => visibleOrders.value.filter(o => o.status === 'Submitted').length)
const preparingCount = computed(() => visibleOrders.value.filter(o => o.status === 'Preparing').length)
const inProgressCount = computed(() => visibleOrders.value.filter(o => ['Confirmed', 'Preparing', 'Dispatched'].includes(o.status)).length)
const shippedCount = computed(() => visibleOrders.value.filter(o => o.status === 'Delivered').length)
const nextDelivery = computed(() =>
  [...visibleOrders.value]
    .filter(o => o.status !== 'Delivered' && o.delivery >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.delivery.localeCompare(b.delivery))[0]
)
const nextDeliveryCases = computed(() => {
  if (!nextDelivery.value) return 0
  return nextDelivery.value.lines.reduce((sum, line) => sum + line.qty, 0)
})
const orderCases = o => o.lines.reduce((sum, line) => sum + line.qty, 0)
const orderLinesCount = o => o.lines.length
const formatDeliveryDateWindow = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${day} ${month}, 09:00–12:00`
}
const orderDeliveryRelative = (dateStr, status) => {
  if (status === 'Delivered') return 'Completed'
  if (!dateStr) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T00:00:00`)
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays > 1) return `In ${diffDays} days`
  if (diffDays === -1) return 'Yesterday'
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`
  return ''
}

function stageDisplayTitle(step) {
  if (step === 'Dispatched') return 'In transit'
  if (step === 'Delivered') return 'Received'
  return step
}

function stageDisplaySub(order, step, index) {
  if (!order) return ''
  const currentIdx = stages.indexOf(order.status)
  if (index > currentIdx) {
    if (step === 'Delivered') return 'Awaiting delivery'
    return 'Pending'
  }
  if (step === 'Submitted') {
    return shortDate(order.placed).replace(', 2026', '') + ' · 10:24'
  }
  if (step === 'Confirmed') {
    return shortDate(order.placed).replace(', 2026', '') + ' · 14:10'
  }
  if (step === 'Preparing') {
    return shortDate(order.placed).replace(', 2026', '') + ' · 16:45'
  }
  if (step === 'Dispatched') {
    return shortDate(order.delivery).replace(', 2026', '') + ' · 07:30'
  }
  if (step === 'Delivered') {
    return shortDate(order.delivery).replace(', 2026', '') + ' · 15:20'
  }
  return ''
}

function progressPercentage(status) {
  const idx = stages.indexOf(status)
  if (idx <= 0) return 0
  return Math.round((idx / (stages.length - 1)) * 100)
}

const statusCounts = computed(() => {
  const counts = { 'All statuses': visibleOrders.value.length }
  stages.forEach(s => {
    counts[s] = visibleOrders.value.filter(o => o.status === s).length
  })
  return counts
})

const totalOrdersValue = computed(() =>
  visibleOrders.value.reduce((sum, o) => sum + orderTotal(o), 0)
)

const lowStockProducts = computed(() => orderableCatalog.filter(p => Number(stock.value[p.sku] || 0) < 20))

const filteredStockCatalog = computed(() =>
  orderableCatalog.filter(p =>
    `${p.name} ${p.nameKh || ''} ${p.sku} ${p.category}`.toLowerCase().includes(stockSearch.value.toLowerCase())
  )
)

let noticeTimer
function flash(message) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => notice.value = '', 3800)
}

function signIn(asRole, asCompany = 'Aeon') {
  role.value = asRole
  company.value = asCompany
  page.value = 'home'
  selected.value = null
  const selectedCo = companies.find(c => c.name === asCompany)
  draft.value.location = selectedCo ? selectedCo.locations[0] : ''
}

function signOut() {
  role.value = ''
  selected.value = null
  page.value = 'home'
}

function go(target) {
  page.value = target
  selected.value = null
  search.value = ''
  statusFilter.value = 'All statuses'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openOrder(id) {
  selected.value = id
}

function changeQty(sku, delta) {
  const current = Number(draft.value.quantities[sku]) || 0
  const updated = Math.max(0, current + delta)
  draft.value.quantities[sku] = updated === 0 ? '' : updated
}

function repeatOrder(order) {
  draft.value = {
    po: `${company.value.slice(0, 2).toUpperCase()}-PO-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
    location: order.location,
    delivery: suggestedDate,
    quantities: Object.fromEntries(order.lines.map(l => [l.sku, l.qty]))
  }
  selected.value = null
  go('new')
  flash(`Order cloned to new draft PO.`)
}

function submitOrder() {
  const po = draft.value.po.trim()
  if (!po || !draft.value.location || !draft.value.delivery || !draftLines.value.length) {
    flash('Please specify PO number, delivery date, and at least one item.')
    return
  }
  if (draftLines.value.some(line => !Number.isInteger(line.qty) || line.qty <= 0)) {
    flash('Please enter whole-number positive quantities.')
    return
  }
  if (orders.value.some(o => o.company === company.value && o.po.toLowerCase() === po.toLowerCase())) {
    flash('This PO number has already been registered.')
    return
  }
  const next = Math.max(1048, ...orders.value.map(o => Number(o.id.split('-')[1]) || 0)) + 1
  const order = {
    id: `SO-${next}`,
    po,
    company: company.value,
    location: draft.value.location,
    delivery: draft.value.delivery,
    status: 'Submitted',
    placed: new Date().toISOString().slice(0, 10),
    lines: draftLines.value.map(({ sku, qty }) => ({ sku, qty }))
  }
  orders.value.push(order)
  draft.value = { po: '', location: customer.value.locations[0], delivery: suggestedDate, quantities: {} }
  go('orders')
  openOrder(order.id)
  flash(`${order.id} (${po}) successfully submitted.`)
}

function advance(order) {
  const next = { Submitted: 'Confirmed', Confirmed: 'Preparing', Preparing: 'Dispatched', Dispatched: 'Delivered' }[order.status]
  if (!next) return
  if (next === 'Dispatched') {
    if (!available(order)) {
      flash('Insufficient inventory balance. Please receive stock first.')
      return
    }
    for (const line of order.lines) {
      stock.value[line.sku] -= line.qty
      movements.value.unshift({
        date: new Date().toISOString().slice(0, 10),
        type: 'Stock out',
        sku: line.sku,
        qty: -line.qty,
        reference: order.id
      })
    }
  }
  order.status = next
  flash(`${order.id} status updated to ${next}.`)
}

function receiveStock() {
  const qty = Math.floor(Number(receipt.value.qty))
  if (!receipt.value.reference.trim() || !Number.isFinite(qty) || qty < 1) {
    flash('Please enter a valid receipt reference and positive quantity.')
    return
  }
  stock.value[receipt.value.sku] = Number(stock.value[receipt.value.sku] || 0) + qty
  movements.value.unshift({
    date: new Date().toISOString().slice(0, 10),
    type: 'Stock in',
    sku: receipt.value.sku,
    qty,
    reference: receipt.value.reference.trim()
  })
  flash(`+${quantityLabel(catalog.find(p => p.sku === receipt.value.sku), qty)} received for ${receipt.value.sku}.`)
  receipt.value = { ...receipt.value, qty: 12, reference: '' }
}

function resetDemo() {
  orders.value = structuredClone(seedOrders)
  stock.value = Object.fromEntries(orderableCatalog.map(p => [p.sku, p.stock]))
  movements.value = []
  selected.value = null
  flash('Demo environment reset to initial state.')
}
</script>

<template>
  <!-- SIGN IN / ACCOUNT SWITCHER -->
  <div v-if="!role" class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="brand-badge">1<span>+</span></div>
        <div>
          <h1 class="brand-title">ONE MORE</h1>
          <p class="brand-sub">Modern Trade & Distribution Portal</p>
        </div>
      </div>

      <div class="auth-intro">
        <h2>Interactive Workspace</h2>
        <p>Select a retail partner account or internal operations to explore the order flow.</p>
      </div>

      <div class="role-section">
        <span class="section-tag">RETAILER BUYER PORTAL</span>
        <div class="retailer-grid">
          <button
            v-for="c in companies"
            :key="c.name"
            class="retailer-btn"
            @click="signIn('buyer', c.name)"
          >
            <div class="retailer-info">
              <span class="retailer-avatar">{{ c.name.slice(0, 2).toUpperCase() }}</span>
              <div class="retailer-text">
                <strong>{{ c.name }}</strong>
                <small>{{ c.locations.length }} Distribution Centers</small>
              </div>
            </div>
            <svg class="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="auth-divider">
        <span>OR</span>
      </div>

      <div class="role-section">
        <span class="section-tag">INTERNAL TEAM</span>
        <button class="ops-btn" @click="signIn('team')">
          <div class="retailer-info">
            <span class="retailer-avatar ops">OM</span>
            <div class="retailer-text">
              <strong>One More Operations & Warehouse</strong>
              <small>Confirm orders, allocate stock, and dispatch</small>
            </div>
          </div>
          <svg class="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>

      <div class="auth-foot">
        <span>Concept Preview · Local state storage active</span>
      </div>
    </div>
  </div>

  <!-- MAIN APPLICATION SHELL -->
  <div v-else class="app-shell">
    <!-- TOP HEADER (MATCHING CONCEPT) -->
    <header class="app-top-header">
      <!-- BRAND LOGO & COMPANY NAME -->
      <div class="header-brand-box">
        <svg class="header-sun-logo" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="16.5" stroke="#C5A500" stroke-width="1.2" stroke-dasharray="2 3" stroke-linecap="round"/>
          <circle cx="20" cy="20" r="12" stroke="#C5A500" stroke-width="1.2" stroke-dasharray="2.5 3"/>
          <circle cx="20" cy="20" r="8" fill="#B49A00"/>
          <circle cx="20" cy="20" r="5" fill="#D4AF37"/>
        </svg>
        <span class="header-company-name">OFL Company</span>
      </div>

      <!-- MAIN HEADER CONTENT -->
      <div class="header-main-box">
        <!-- SEARCH INPUT PILL -->
        <div class="header-search-pill">
          <svg class="header-search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/>
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Search..."
            class="header-search-input"
            @focus="page !== 'orders' && go('orders')"
          />
        </div>

        <!-- RIGHT ACTIONS -->
        <div class="header-right-actions">
          <!-- LANGUAGE TOGGLE -->
          <div class="header-lang-toggle" role="group" aria-label="Language selection">
            <button
              class="lang-pill-btn"
              :class="{ active: lang === 'en' }"
              @click="lang = 'en'"
              title="English"
            >
              EN
            </button>
            <button
              class="lang-pill-btn"
              :class="{ active: lang === 'kh' }"
              @click="lang = 'kh'"
              title="ភាសាខ្មែរ"
            >
              ខ្មែរ
            </button>
          </div>

          <!-- NOTIFICATION BELL -->
          <button class="header-notif-btn" title="Notifications" @click="go('orders')">
            <svg class="header-bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13.73 21a2 2 0 01-3.46 0" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="header-notif-badge">9</span>
          </button>

          <!-- USER PROFILE DROPDOWN -->
          <div class="header-user-wrapper">
            <button class="header-user-btn" @click.stop="profileMenuOpen = !profileMenuOpen">
              <span class="header-user-avatar">{{ userProfile.initials }}</span>
              <div class="header-user-text">
                <strong class="header-user-name">{{ userProfile.name }}</strong>
                <small class="header-user-role">{{ userProfile.roleTitle }}</small>
              </div>
              <svg class="header-caret-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
              </svg>
            </button>

            <!-- DROPDOWN POPOVER -->
            <div v-if="profileMenuOpen" class="header-profile-popover" @click.stop>
              <div class="popover-user-info">
                <strong>{{ userProfile.name }}</strong>
                <p>{{ role === 'buyer' ? `${company} DC Buyer` : 'One More Operations' }}</p>
                <small>{{ userProfile.roleTitle }}</small>
              </div>
              <div class="popover-divider"></div>
              <button class="popover-item" @click="signOut(); profileMenuOpen = false">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l2.473-2.473a.75.75 0 00-1.06-1.06l-3.75 3.75a.75.75 0 000 1.06l3.75 3.75a.75.75 0 101.06-1.06L8.704 10.75H18.25A.75.75 0 0019 10z" clip-rule="evenodd"/></svg>
                <span>Switch Account / Sign Out</span>
              </button>
              <button class="popover-item" @click="resetDemo(); profileMenuOpen = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="app-layout">
      <!-- MINIMAL SIDEBAR -->
      <aside class="sidebar">
        <!-- NAVIGATION -->
        <nav class="nav-menu">
          <span class="nav-label">MAIN NAVIGATION</span>
          <button
            class="nav-item"
            :class="{ active: page === 'home' }"
            @click="go('home')"
          >
            <div class="nav-icon-box">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </div>
            <span class="nav-item-title">Overview</span>
          </button>

          <button
            class="nav-item"
            :class="{ active: page === 'orders' }"
            @click="go('orders')"
          >
            <div class="nav-icon-box">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <span class="nav-item-title">{{ role === 'buyer' ? 'Purchase Orders' : 'Sales Orders' }}</span>
            <span v-if="pendingCount" class="nav-badge">{{ pendingCount }}</span>
          </button>

          <button
            v-if="role === 'buyer'"
            class="nav-item"
            :class="{ active: page === 'new' }"
            @click="go('new')"
          >
            <div class="nav-icon-box">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <span class="nav-item-title">Create Order</span>
          </button>

          <button
            v-if="role === 'team'"
            class="nav-item"
            :class="{ active: page === 'stock' }"
            @click="go('stock')"
          >
            <div class="nav-icon-box">
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <span class="nav-item-title">Stock & Receiving</span>
            <span v-if="lowStockProducts.length" class="nav-badge alert">{{ lowStockProducts.length }}</span>
          </button>
        </nav>

        <!-- SIDEBAR FOOTER -->
        <div class="sidebar-foot">
          <button class="switch-btn" @click="signOut">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l2.473-2.473a.75.75 0 00-1.06-1.06l-3.75 3.75a.75.75 0 000 1.06l3.75 3.75a.75.75 0 101.06-1.06L8.704 10.75H18.25A.75.75 0 0019 10z" clip-rule="evenodd"/></svg>
            <span>Switch account</span>
          </button>
          <button class="reset-link" @click="resetDemo">Reset demo data</button>
        </div>
      </aside>

      <!-- CONTENT SHELL -->
      <div class="content-body">

      <!-- MAIN VIEW ROUTE -->
      <main class="page-container">
        <!-- 0. FULL PAGE ORDER DETAILS VIEW -->
        <template v-if="chosen">
          <div class="order-detail-page">
            <!-- TOP NAV / ACTION BAR -->
            <div class="detail-top-nav">
              <button class="btn-secondary" @click="selected = null">
                <svg viewBox="0 0 20 20" fill="currentColor" class="nav-back-icon"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/></svg>
                <span>Back to {{ page === 'home' ? 'Overview' : 'Orders' }}</span>
              </button>

              <div class="detail-actions-group">
                <div v-if="role === 'team' && chosen.status !== 'Delivered'" class="action-team-wrap">
                  <div v-if="chosen.status === 'Preparing' && !available(chosen)" class="stock-warning-badge">
                    ⚠️ Insufficient stock to dispatch
                  </div>
                  <button class="btn-primary" @click="advance(chosen)">
                    <span>{{ { Submitted: 'Confirm Order', Confirmed: 'Mark Preparing', Preparing: 'Dispatch & Record Stock Out', Dispatched: 'Mark Delivered' }[chosen.status] }}</span>
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg>
                  </button>
                </div>

                <button v-else-if="role === 'buyer'" class="btn-primary" @click="repeatOrder(chosen)">
                  <span>Clone to New Purchase Order</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                </button>
              </div>
            </div>

            <!-- ORDER HERO HEADER CARD (PO Card) -->
            <section class="card detail-header-card">
              <div class="detail-header-main">
                <div class="detail-title-group">
                  <div class="detail-eyebrow">
                    <span class="detail-company-tag">{{ chosen.company }}</span>
                    <span class="meta-dot">·</span>
                    <span class="detail-so-badge">{{ chosen.id }}</span>
                    <span class="meta-dot">·</span>
                    <span class="detail-placed-date">Placed on {{ shortDate(chosen.placed) }}</span>
                  </div>
                  <h1 class="detail-po-title">{{ chosen.po }}</h1>
                </div>

                <div class="detail-status-box">
                  <span class="status-badge" :class="chosen.status.toLowerCase()">
                    <span class="badge-dot"></span>
                    {{ chosen.status }}
                  </span>
                  <div class="detail-header-total">
                    <span class="header-total-label">Total Amount</span>
                    <strong class="header-total-val">{{ money(orderTotal(chosen)) }}</strong>
                  </div>
                </div>
              </div>

              <!-- INLINE ROW: 25% DELIVERY & LOGISTICS | 75% FULFILLMENT PROGRESS -->
              <div class="hero-logistics-progress-row">
                <!-- 25% DELIVERY & LOGISTICS -->
                <div class="hero-logistics-col">
                  <div class="section-micro-header">
                    <svg class="micro-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h-2v3h3.414l-1.414-3zM12 4a1 1 0 00-1 1v2h3.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V15a1 1 0 01-1 1h-1.05a2.5 2.5 0 01-4.9 0H12a1 1 0 01-1-1V4z"/>
                    </svg>
                    <span>DELIVERY & LOGISTICS</span>
                  </div>

                  <div class="hero-logistics-card">
                    <div class="logistics-entry">
                      <div class="logistics-entry-icon">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433 1.244-.77 3.13-2.128 4.63-4.148 2.001-2.696 2.5-5.32 2.5-7.204C18.5 3.358 14.642 0 10 0S1.5 3.358 1.5 7c0 1.884.499 4.508 2.5 7.204 1.5 2.02 3.386 3.378 4.63 4.148.311.193.571.337.757.433.107.056.198.099.281.14l.018.008.006.003zM10 10a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
                      </div>
                      <div class="logistics-entry-content">
                        <span class="logistics-label">Receiving DC</span>
                        <strong class="logistics-val" :title="chosen.location">{{ chosen.location }}</strong>
                      </div>
                    </div>

                    <div class="logistics-entry">
                      <div class="logistics-entry-icon">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
                      </div>
                      <div class="logistics-entry-content">
                        <span class="logistics-label">Requested Delivery</span>
                        <div class="logistics-date-row">
                          <strong class="logistics-val">{{ shortDate(chosen.delivery) }}</strong>
                          <span
                            class="delivery-relative-chip mini"
                            :class="{
                              'is-completed': chosen.status === 'Delivered',
                              'is-today': orderDeliveryRelative(chosen.delivery, chosen.status) === 'Today' || orderDeliveryRelative(chosen.delivery, chosen.status) === 'Tomorrow',
                              'is-overdue': orderDeliveryRelative(chosen.delivery, chosen.status).includes('overdue')
                            }"
                          >
                            {{ orderDeliveryRelative(chosen.delivery, chosen.status) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 75% FULFILLMENT PROGRESS -->
                <div class="hero-progress-col">
                  <div class="section-micro-header">
                    <svg class="micro-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .26.134.501.357.64l4 2.5a.75.75 0 10.786-1.28L10.75 9.61V5z" clip-rule="evenodd"/>
                    </svg>
                    <span>FULFILLMENT PROGRESS</span>
                  </div>

                  <div class="progress-concept-card">
                    <div class="progress-concept-stepper">
                      <div
                        v-for="(step, index) in stages"
                        :key="step"
                        class="concept-step-item"
                        :class="{
                          'is-completed': stages.indexOf(chosen.status) > index,
                          'is-active': chosen.status === step,
                          'is-pending': stages.indexOf(chosen.status) < index
                        }"
                      >
                        <div class="concept-step-node-row">
                          <div
                            v-if="index > 0"
                            class="concept-line-segment left"
                            :class="{ 'is-completed': stages.indexOf(chosen.status) >= index }"
                          ></div>
                          <div v-else class="concept-line-spacer"></div>

                          <div class="concept-step-badge">
                            <svg v-if="stages.indexOf(chosen.status) > index" class="concept-check-icon" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/>
                            </svg>
                            <span v-else class="concept-step-num">{{ index + 1 }}</span>
                          </div>

                          <div
                            v-if="index < stages.length - 1"
                            class="concept-line-segment right"
                            :class="{ 'is-completed': stages.indexOf(chosen.status) > index }"
                          ></div>
                          <div v-else class="concept-line-spacer"></div>
                        </div>

                        <div class="concept-step-info text-center">
                          <strong class="concept-step-title">{{ stageDisplayTitle(step) }}</strong>
                          <span class="concept-step-sub">{{ stageDisplaySub(chosen, step, index) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- MAIN CONTENT GRID -->
            <div class="detail-body-grid" :class="{ 'full-grid': role === 'buyer' }">
              <!-- ORDERED PRODUCTS LIST -->
              <section class="card detail-products-card">


                <div class="table-responsive">
                  <table class="data-table detail-items-table">
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>SKU</th>
                        <th class="text-right">UNIT PRICE</th>
                        <th class="text-center">ORDERED QTY</th>
                        <th class="text-right">LINE TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="line in chosen.lines" :key="line.sku">
                        <td>
                          <div class="detail-product-cell">
                            <img :src="catalog.find(p => p.sku === line.sku)?.image" :alt="line.sku" class="detail-product-thumb" />
                            <div class="detail-product-meta">
                              <strong class="detail-item-name">{{ itemName(catalog.find(p => p.sku === line.sku)) }}</strong>
                              <span class="detail-item-sub">{{ catalog.find(p => p.sku === line.sku)?.pack }} · {{ catalog.find(p => p.sku === line.sku)?.category }}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="sku-tag">{{ line.sku }}</span>
                        </td>
                        <td class="num-cell text-right">
                          <span class="detail-unit-price">{{ money(catalog.find(p => p.sku === line.sku)?.price || 0) }}</span>
                          <small class="unit-per">/ {{ catalog.find(p => p.sku === line.sku)?.unit || 'case' }}</small>
                        </td>
                        <td class="num-cell text-center font-semibold">
                          <span class="qty-pill">{{ quantityLabel(catalog.find(p => p.sku === line.sku), line.qty) }}</span>
                        </td>
                        <td class="num-cell text-right font-semibold">
                          <span class="detail-line-total">{{ money(line.qty * (catalog.find(p => p.sku === line.sku)?.price || 0)) }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="detail-table-footer">
                  <div class="footer-meta-stats">
                    <div class="meta-stat-item">
                      <span class="meta-stat-label">Total Volume:</span>
                      <strong>{{ chosen.lines.reduce((s, l) => s + l.qty, 0) }} Cases</strong>
                    </div>
                    <div class="meta-stat-item">
                      <span class="meta-stat-label">Line Items:</span>
                      <strong>{{ chosen.lines.length }} SKUs</strong>
                    </div>
                  </div>
                  <div class="footer-totals-row">
                    <span class="totals-label">Order Grand Total:</span>
                    <strong class="footer-total-amount">{{ money(orderTotal(chosen)) }}</strong>
                  </div>
                </div>
              </section>

              <!-- INVENTORY FEASIBILITY (FOR TEAM ROLE) -->
              <div class="detail-side-column" v-if="role === 'team'">
                <section class="card detail-info-card">
                  <div class="card-header border-none pb-0">
                    <h2 class="card-title">Inventory Feasibility</h2>
                  </div>
                  <div class="stock-feasibility-box">
                    <div class="feasibility-status" :class="available(chosen) ? 'status-ok' : 'status-warning'">
                      <span class="dot-indicator" :class="available(chosen) ? 'bg-green' : 'bg-red'"></span>
                      <span>{{ available(chosen) ? 'Sufficient stock available for fulfillment' : 'Low stock warning for some items' }}</span>
                    </div>
                    <div class="stock-check-list">
                      <div v-for="line in chosen.lines" :key="line.sku" class="stock-check-item">
                        <div class="sku-name-wrap">
                          <strong>{{ line.sku }}</strong>
                          <small>Required: {{ line.qty }}</small>
                        </div>
                        <span class="stock-avail-pill" :class="Number(stock[line.sku] || 0) >= line.qty ? 'in-stock' : 'out-stock'">
                          Available: {{ stock[line.sku] ?? 0 }}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </template>

        <!-- 1. OVERVIEW VIEW -->
        <template v-else-if="page === 'home'">
          <div class="view-header">
            <div>
              <h1 class="view-title">{{ role === 'buyer' ? `Welcome back, ${company}` : 'Operations Dashboard' }}</h1>
              <p class="view-subtitle">{{ role === 'buyer' ? 'Monitor purchase orders, delivery statuses, and stock allocations.' : 'Review incoming customer POs, coordinate warehouse dispatch, and track inventory.' }}</p>
            </div>
            <button class="btn-primary" @click="go(role === 'buyer' ? 'new' : 'orders')">
              <svg v-if="role === 'buyer'" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
              <span>{{ role === 'buyer' ? 'New purchase order' : 'Manage sales orders' }}</span>
            </button>
          </div>

          <!-- KPI METRICS -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-head">
                <span>{{ role === 'buyer' ? 'Pending Review' : 'Awaiting Confirmation' }}</span>
                <span class="kpi-dot amber"></span>
              </div>
              <div class="kpi-value">{{ pendingCount }}</div>
              <div class="kpi-caption">{{ role === 'buyer' ? 'Orders sent for processing' : 'New buyer orders to confirm' }}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-head">
                <span>In Fulfillment</span>
                <span class="kpi-dot blue"></span>
              </div>
              <div class="kpi-value">{{ inProgressCount }}</div>
              <div class="kpi-caption">Confirmed, preparing, or in transit</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-head">
                <span>Delivered</span>
                <span class="kpi-dot green"></span>
              </div>
              <div class="kpi-value">{{ shippedCount }}</div>
              <div class="kpi-caption">Successfully completed orders</div>
            </div>

            <div class="kpi-card highlight">
              <div class="kpi-head">
                <span>{{ role === 'buyer' ? 'Next Delivery' : 'Low Inventory SKUs' }}</span>
                <span class="kpi-dot" :class="role === 'buyer' ? 'blue' : (lowStockProducts.length ? 'amber' : 'green')"></span>
              </div>
              <div class="kpi-value date-val">
                {{ role === 'buyer' ? (nextDelivery ? shortDate(nextDelivery.delivery).replace(', 2026', '') : 'None') : lowStockProducts.length }}
              </div>
              <div class="kpi-caption">
                {{ role === 'buyer' ? (nextDelivery ? nextDelivery.location : 'All deliveries up to date') : 'Items with under 20 units balance' }}
              </div>
            </div>
          </div>

          <!-- DASHBOARD TWO-COLUMN SECTION -->
          <div class="dashboard-columns">
            <!-- RECENT ORDERS LIST -->
            <section class="card">
              <div class="card-header">
                <div>
                  <h2 class="card-title">{{ role === 'buyer' ? 'Recent Purchase Orders' : 'Actionable Orders' }}</h2>
                  <p class="card-subtitle">Click any order to view details or progress status</p>
                </div>
                <button class="btn-text" @click="go('orders')">View all →</button>
              </div>

              <div class="order-list">
                <div
                  v-for="o in (role === 'team' ? [...visibleOrders].filter(x => x.status !== 'Delivered') : [...visibleOrders]).slice(-4).reverse()"
                  :key="o.id"
                  class="order-item"
                  @click="openOrder(o.id)"
                >
                  <div class="order-item-left">
                    <div>
                      <div class="order-po">{{ o.po }}</div>
                      <div class="order-sub">{{ role === 'team' ? `${o.company} · ` : '' }}{{ o.location }}</div>
                    </div>
                  </div>
                  <div class="order-item-right">
                    <span class="status-badge" :class="o.status.toLowerCase()">{{ o.status }}</span>
                    <span class="order-date">{{ shortDate(o.delivery) }}</span>
                  </div>
                </div>

                <div v-if="!visibleOrders.length" class="empty-state">
                  <p>No active orders recorded yet.</p>
                </div>
              </div>
            </section>

            <!-- CONTEXTUAL SIDE PANEL -->
            <section class="card">
              <template v-if="role === 'buyer'">
                <div v-if="nextDelivery" class="next-delivery-card-inner">
                  <h2 class="next-delivery-title">Next delivery</h2>

                  <div class="next-delivery-header">
                    <button class="next-delivery-po-link" @click="openOrder(nextDelivery.id)">
                      <span>{{ nextDelivery.po }}</span>
                      <svg class="external-arrow" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                    <span class="delivery-status-pill in-transit">{{ nextDelivery.status === 'Dispatched' ? 'In transit' : nextDelivery.status }}</span>
                  </div>

                  <div class="next-delivery-time">
                    {{ formatDeliveryDateWindow(nextDelivery.delivery) }}
                  </div>

                  <div class="next-delivery-route">
                    One More Central DC → {{ nextDelivery.location }}
                  </div>

                  <div class="next-delivery-cargo">
                    <svg class="delivery-truck-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <span>{{ nextDeliveryCases }} cases · {{ nextDelivery.lines.length }} products</span>
                  </div>

                  <button class="track-order-btn" @click="openOrder(nextDelivery.id)">
                    Track order
                  </button>
                </div>
                <div v-else class="empty-state p-6">
                  <p>No scheduled deliveries. Create a PO to get started.</p>
                  <button class="btn-secondary mt-3" @click="go('new')">+ Create PO</button>
                </div>
              </template>

              <template v-else>
                <div class="card-header">
                  <div>
                    <h2 class="card-title">Operations Quick Queue</h2>
                    <p class="card-subtitle">Fulfillment actions requiring attention</p>
                  </div>
                </div>
                <div class="quick-queue">
                  <button class="queue-item" @click="go('orders')">
                    <div class="queue-info">
                      <strong>New POs awaiting confirmation</strong>
                      <small>Review line items and delivery dates</small>
                    </div>
                    <span class="queue-count" :class="{ highlight: pendingCount > 0 }">{{ pendingCount }}</span>
                  </button>

                  <button class="queue-item" @click="go('orders')">
                    <div class="queue-info">
                      <strong>Orders ready to dispatch</strong>
                      <small>Verify stock and record outgoing inventory</small>
                    </div>
                    <span class="queue-count">{{ preparingCount }}</span>
                  </button>

                  <button class="queue-item" @click="go('stock')">
                    <div class="queue-info">
                      <strong>Inventory low stock alerts</strong>
                      <small>Restock items under safe minimum levels</small>
                    </div>
                    <span class="queue-count alert">{{ lowStockProducts.length }}</span>
                  </button>
                </div>
                <div class="p-4 pt-0">
                  <button class="btn-secondary full-w" @click="go('stock')">
                    Open Stock Management →
                  </button>
                </div>
              </template>
            </section>
          </div>
        </template>

        <!-- 2. ORDERS TABLE VIEW -->
        <template v-else-if="page === 'orders'">
          <div class="view-header">
            <div>
              <h1 class="view-title">{{ role === 'buyer' ? 'Purchase Orders' : 'Sales Orders' }}</h1>
              <p class="view-subtitle">{{ role === 'buyer' ? `Real-time status tracking for ${company} orders.` : 'Manage and fulfill retailer purchase orders across all accounts.' }}</p>
            </div>
            <button v-if="role === 'buyer'" class="btn-primary" @click="go('new')">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
              <span>+ New purchase order</span>
            </button>
          </div>

          <!-- KPI METRICS SUMMARY (VIEW-ONLY) -->
          <div class="orders-metrics-grid">
            <div class="order-metric-card">
              <span class="metric-label">Total Orders</span>
              <strong class="metric-value">{{ visibleOrders.length }}</strong>
              <div class="metric-sub">{{ money(totalOrdersValue) }} value</div>
            </div>

            <div class="order-metric-card" :class="{ alert: pendingCount > 0 }">
              <span class="metric-label">Awaiting Confirmation</span>
              <strong class="metric-value">{{ pendingCount }}</strong>
              <div class="metric-sub" :class="{ 'text-amber': pendingCount > 0 }">
                {{ pendingCount > 0 ? 'Requires attention' : 'All confirmed' }}
              </div>
            </div>

            <div class="order-metric-card">
              <span class="metric-label">In Fulfillment</span>
              <strong class="metric-value">{{ inProgressCount }}</strong>
              <div class="metric-sub">Preparing & Dispatched</div>
            </div>

            <div class="order-metric-card">
              <span class="metric-label">Completed</span>
              <strong class="metric-value">{{ shippedCount }}</strong>
              <div class="metric-sub">Delivered & verified</div>
            </div>
          </div>

          <!-- TABLE CARD -->
          <div class="card orders-table-card">
            <div class="table-toolbar-tabs">
              <!-- STATUS TABS -->
              <div class="status-tab-pills" role="tablist">
                <button
                  class="status-tab-btn"
                  :class="{ active: statusFilter === 'All statuses' }"
                  @click="statusFilter = 'All statuses'"
                >
                  <span>All</span>
                  <span class="tab-count-badge">{{ statusCounts['All statuses'] }}</span>
                </button>
                <button
                  v-for="s in stages"
                  :key="s"
                  class="status-tab-btn"
                  :class="{ active: statusFilter === s }"
                  @click="statusFilter = s"
                >
                  <span>{{ s }}</span>
                  <span class="tab-count-badge" :class="{ highlight: s === 'Submitted' && statusCounts[s] > 0 }">
                    {{ statusCounts[s] }}
                  </span>
                </button>
              </div>

              <!-- SEARCH INPUT -->
              <div class="orders-search-wrapper">
                <div class="modern-search-box">
                  <svg viewBox="0 0 20 20" fill="currentColor" class="search-icon">
                    <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/>
                  </svg>
                  <input v-model="search" placeholder="Search PO#, customer, location..." />
                  <button v-if="search" class="clear-search-btn" @click="search = ''" title="Clear search">✕</button>
                </div>
              </div>
            </div>

            <!-- RESPONSIVE TABLE -->
            <div class="table-responsive">
              <table class="data-table modern-orders-table">
                <thead>
                  <tr>
                    <th>PO NUMBER & ID</th>
                    <th v-if="role === 'team'">RETAILER</th>
                    <th>RECEIVING DC</th>
                    <th>REQUESTED DELIVERY</th>
                    <th>ORDER VOLUME</th>
                    <th class="text-right">TOTAL VALUE</th>
                    <th>STATUS</th>
                    <th class="text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="o in sortedOrders" :key="o.id" @click="openOrder(o.id)" class="order-table-row">
                    <td>
                      <div class="po-primary-col">
                        <span class="po-number-text">{{ o.po }}</span>
                        <div class="po-sub-meta">
                          <span class="so-id-tag">{{ o.id }}</span>
                          <span class="meta-dot">·</span>
                          <span class="po-placed-date">{{ shortDate(o.placed) }}</span>
                        </div>
                      </div>
                    </td>

                    <td v-if="role === 'team'">
                      <div class="retailer-table-pill">
                        <span class="retailer-tiny-avatar">{{ o.company.slice(0, 2).toUpperCase() }}</span>
                        <span class="retailer-name">{{ o.company }}</span>
                      </div>
                    </td>

                    <td>
                      <div class="dest-location-cell">
                        <svg class="dest-pin-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433 1.244-.77 3.13-2.128 4.63-4.148 2.001-2.696 2.5-5.32 2.5-7.204C18.5 3.358 14.642 0 10 0S1.5 3.358 1.5 7c0 1.884.499 4.508 2.5 7.204 1.5 2.02 3.386 3.378 4.63 4.148.311.193.571.337.757.433.107.056.198.099.281.14l.018.008.006.003zM10 10a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
                        </svg>
                        <span>{{ o.location }}</span>
                      </div>
                    </td>

                    <td>
                      <div class="delivery-date-cell">
                        <span class="delivery-date-main">{{ shortDate(o.delivery) }}</span>
                        <span
                          class="delivery-relative-chip"
                          :class="{
                            'is-completed': o.status === 'Delivered',
                            'is-today': orderDeliveryRelative(o.delivery, o.status) === 'Today' || orderDeliveryRelative(o.delivery, o.status) === 'Tomorrow',
                            'is-overdue': orderDeliveryRelative(o.delivery, o.status).includes('overdue')
                          }"
                        >
                          {{ orderDeliveryRelative(o.delivery, o.status) }}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div class="order-volume-badge">
                        <strong class="volume-cases">{{ orderCases(o) }} cases</strong>
                        <small class="volume-skus">{{ orderLinesCount(o) }} {{ orderLinesCount(o) === 1 ? 'item' : 'items' }}</small>
                      </div>
                    </td>

                    <td class="text-right">
                      <span class="order-value-main">{{ money(orderTotal(o)) }}</span>
                    </td>

                    <td>
                      <span class="status-badge" :class="o.status.toLowerCase()">
                        <span class="badge-dot"></span>
                        {{ o.status }}
                      </span>
                    </td>

                    <td class="text-right action-col">
                      <button class="table-view-btn" @click.stop="openOrder(o.id)">
                        <span>View</span>
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- EMPTY STATE -->
              <div v-if="!sortedOrders.length" class="orders-empty-container">
                <div class="orders-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="16" rx="2.5"/>
                    <path d="M7 8h10M7 12h10M7 16h6" stroke-linecap="round"/>
                  </svg>
                </div>
                <h3>No purchase orders found</h3>
                <p>No orders match your current filter or search criteria.</p>
                <div class="orders-empty-actions">
                  <button v-if="search || statusFilter !== 'All statuses'" class="btn-secondary" @click="search = ''; statusFilter = 'All statuses'">
                    Reset Filters
                  </button>
                  <button v-if="role === 'buyer'" class="btn-primary" @click="go('new')">
                    + Create Purchase Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 3. CREATE PURCHASE ORDER VIEW -->
        <template v-else-if="page === 'new' && role === 'buyer'">
          <div class="view-header">
            <div>
              <h1 class="view-title">New Purchase Order</h1>
              <p class="view-subtitle">Select quantities by piece or master case. Real-time pricing applies.</p>
            </div>
            <button class="btn-secondary" @click="go('orders')">← Back to orders</button>
          </div>

          <div class="create-po-layout">
            <!-- STEP 1: DELIVERY SPECS (1 COLUMN) -->
            <section class="card delivery-card">
              <div class="card-header border-none pb-0">
                <div class="step-badge-title">
                  <span class="step-num">01</span>
                  <div>
                    <h2 class="card-title">Delivery Details</h2>
                    <p class="card-subtitle">Enter your retailer PO reference and desired receiving DC</p>
                  </div>
                </div>
              </div>

              <div class="form-fields">
                <div class="field-item">
                  <label>Retailer PO Number</label>
                  <input v-model="draft.po" placeholder="e.g. AE-PO-2610-001" maxlength="40" />
                </div>
                <div class="field-item">
                  <label>Requested Delivery Date</label>
                  <input v-model="draft.delivery" type="date" :min="new Date().toISOString().slice(0, 10)" />
                </div>
                <div class="field-item">
                  <label>Delivery Destination DC</label>
                  <select v-model="draft.location">
                    <option v-for="location in customer.locations" :key="location">{{ location }}</option>
                  </select>
                </div>
              </div>
            </section>

            <!-- 2 COLUMNS: PRODUCTS & ORDER SUMMARY -->
            <div class="form-grid">
              <!-- STEP 2: CATALOG PICKER -->
              <section class="card">
                <div class="card-header border-none pb-0">
                  <div class="step-badge-title">
                    <span class="step-num">02</span>
                    <div>
                      <h2 class="card-title">Select Products & Quantities</h2>
                      <p class="card-subtitle">Choose from active orderable catalog items</p>
                    </div>
                  </div>
                </div>

                <div class="catalog-toolbar">
                  <div class="search-input-box flex-1">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>
                    <input v-model="productSearch" type="search" placeholder="Search item, Khmer name, SKU..." />
                  </div>
                  <select v-model="categoryFilter">
                    <option v-for="category in productCategories" :key="category">{{ category }}</option>
                  </select>
                </div>

                <!-- PRODUCT CARDS GRID -->
                <div class="clean-product-grid">
                  <article
                    v-for="p in visibleCatalog"
                    :key="p.sku || p.name"
                    class="product-card"
                    :class="{ 'is-disabled': !p.orderable, 'out-of-stock': p.orderable && Number(stock[p.sku] || 0) <= 0 }"
                  >
                    <div class="product-thumb">
                      <img :src="p.image" :alt="p.name" loading="lazy" />
                      <span v-if="p.unit === 'case'" class="case-pill">CASE · {{ p.packSize }}</span>
                      <span v-if="p.orderable && Number(stock[p.sku] || 0) <= 0" class="stock-pill">Out of stock</span>
                    </div>

                    <div class="product-details">
                      <div class="product-name-row">
                        <strong class="p-name">{{ itemName(p) }}</strong>
                      </div>
                      <div class="p-sku-meta">{{ p.sku || 'Reference only' }} · {{ p.pack }}</div>
                    </div>

                    <div class="product-bottom">
                      <div class="p-pricing">
                        <strong>{{ money(p.price) }}</strong>
                        <small v-if="p.orderable">/ {{ p.unit }}</small>
                      </div>

                      <!-- QUANTITY INPUT -->
                      <div v-if="p.orderable" class="qty-input-box">
                        <input
                          v-model.number="draft.quantities[p.sku]"
                          type="number"
                          min="0"
                          placeholder="0"
                          class="qty-input"
                        />
                      </div>
                      <span v-else class="ref-badge">Catalog reference</span>
                    </div>
                  </article>
                </div>

                <div v-if="!visibleCatalog.length" class="empty-state">
                  <p>No products match your search query.</p>
                </div>
              </section>

              <!-- ORDER SUMMARY SIDEBAR -->
              <aside class="sticky-summary card">
                <h2 class="card-title">Order Summary</h2>
                <p class="card-subtitle">{{ company }} · {{ draft.location }}</p>

                <div v-if="draftLines.length" class="summary-line-list">
                  <div v-for="line in draftLines" :key="line.sku" class="summary-line-item">
                    <div class="line-info">
                      <strong>{{ itemName(line) }}</strong>
                      <small>{{ quantityLabel(line, line.qty) }} × {{ money(line.price) }}</small>
                    </div>
                    <span class="line-subtotal">{{ money(line.qty * line.price) }}</span>
                  </div>
                </div>
                <div v-else class="summary-empty-box">
                  <p>No items added yet. Adjust quantities on the catalog cards to build your order.</p>
                </div>

                <div class="summary-footer">
                  <div class="summary-total-row">
                    <span>Estimated Total</span>
                    <strong class="total-amount">{{ money(draftTotal) }}</strong>
                  </div>
                  <button
                    class="btn-primary full-w submit-po-btn"
                    :disabled="!draftLines.length || !draft.po.trim()"
                    @click="submitOrder"
                  >
                    Submit Purchase Order →
                  </button>
                  <small class="summary-disclaimer">Order availability and final schedule will be confirmed by One More Operations.</small>
                </div>
              </aside>
            </div>
          </div>
        </template>

        <!-- 4. STOCK & RECEIVING VIEW (OPS ONLY) -->
        <template v-else-if="page === 'stock' && role === 'team'">
          <div class="view-header">
            <div>
              <h1 class="view-title">Inventory & Receiving</h1>
              <p class="view-subtitle">Live warehouse stock balances and supplier Goods Receipt Notes (GRN).</p>
            </div>
            <button class="btn-secondary" @click="go('orders')">View sales orders →</button>
          </div>

          <div class="stock-two-col">
            <!-- WAREHOUSE BALANCES -->
            <section class="card">
              <div class="card-header">
                <div>
                  <h2 class="card-title">Warehouse Inventory Balances</h2>
                  <p class="card-subtitle">Main Distribution Center physical inventory</p>
                </div>
                <div class="search-input-box mini">
                  <input v-model="stockSearch" placeholder="Filter SKUs..." />
                </div>
              </div>

              <div class="stock-list-wrap">
                <div v-for="p in filteredStockCatalog" :key="p.sku" class="stock-item-row">
                  <div class="stock-thumb">
                    <img :src="p.image" :alt="p.name" />
                    <span v-if="p.unit === 'case'" class="case-pill">CASE</span>
                  </div>
                  <div class="stock-info">
                    <strong>{{ itemName(p) }}</strong>
                    <small>{{ p.sku }} · {{ p.pack }}</small>
                  </div>
                  <div class="stock-balance-pill" :class="{ 'low-stock': stock[p.sku] < 20 }">
                    {{ quantityLabel(p, stock[p.sku] || 0) }}
                  </div>
                </div>
              </div>
            </section>

            <!-- GOODS RECEIPT FORM -->
            <section class="card p-6">
              <div class="card-header border-none p-0 mb-4">
                <div>
                  <span class="step-tag">STOCK IN</span>
                  <h2 class="card-title mt-1">Record Supplier Receipt</h2>
                  <p class="card-subtitle">Log incoming goods from manufacturer or supplier</p>
                </div>
              </div>

              <div class="receipt-form">
                <div class="field-item mb-3">
                  <label>Select Product</label>
                  <select v-model="receipt.sku">
                    <option v-for="p in orderableCatalog" :key="p.sku" :value="p.sku">{{ itemName(p) }} ({{ p.sku }})</option>
                  </select>
                </div>

                <div class="field-item mb-3">
                  <label>Quantity Received ({{ catalog.find(p => p.sku === receipt.sku)?.unit }})</label>
                  <input v-model.number="receipt.qty" type="number" min="1" step="1" />
                </div>

                <div class="field-item mb-4">
                  <label>GRN / Supplier Reference</label>
                  <input v-model="receipt.reference" placeholder="e.g. GRN-2026-081" />
                </div>

                <button class="btn-primary full-w" @click="receiveStock">
                  Record Stock In →
                </button>
              </div>
            </section>
          </div>

          <!-- RECENT MOVEMENT AUDIT TRAIL -->
          <section class="card mt-5">
            <div class="card-header">
              <div>
                <h2 class="card-title">Stock Movement Log</h2>
                <p class="card-subtitle">Audit trail of receipts and order dispatches</p>
              </div>
            </div>

            <div v-if="movements.length" class="movement-table">
              <div v-for="(movement, index) in movements.slice(0, 10)" :key="index" class="movement-row">
                <div class="movement-type-indicator" :class="movement.qty > 0 ? 'in' : 'out'">
                  {{ movement.qty > 0 ? '↓ IN' : '↑ OUT' }}
                </div>
                <div class="movement-desc">
                  <strong>{{ itemName(movement.sku) }}</strong>
                  <small>{{ movement.reference }} · {{ shortDate(movement.date) }}</small>
                </div>
                <span class="movement-qty" :class="movement.qty > 0 ? 'positive' : 'negative'">
                  {{ signedQuantityLabel(catalog.find(p => p.sku === movement.sku), movement.qty) }}
                </span>
              </div>
            </div>
            <div v-else class="empty-state">
              <p>No inventory movements recorded yet.</p>
            </div>
          </section>
        </template>
      </main>
    </div>

    <!-- TOAST NOTIFICATION -->
    <transition name="toast-fade">
      <div v-if="notice" class="minimal-toast" role="status">
        <span class="toast-dot"></span>
        <span>{{ notice }}</span>
      </div>
    </transition>
    </div>
  </div>
</template>
