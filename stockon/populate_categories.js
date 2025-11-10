// Modern Stockon - Search-First Implementation

class StockonManager {
  constructor() {
    this.categoriesData = null
    this.allItems = []
    this.selectedItems = new Map() // item_id -> {item, quantity, location, area, category}
    this.selectedDate = null
    this.currentView = 'grid' // 'grid' or 'list'
    this.currentFilters = {
      location: '',
      area: '',
      category: ''
    }
    this.fuse = null
    
    this.initializeElements()
    this.setupEventListeners()
    this.loadData()
  }
  
  initializeElements() {
    // Search elements
    this.searchInput = document.getElementById('search-input')
    this.clearSearchBtn = document.getElementById('clear-search')
    
    // Filter elements
    this.locationFilter = document.getElementById('location-filter')
    this.areaFilter = document.getElementById('area-filter')
    this.categoryFilter = document.getElementById('category-filter')
    this.resetFiltersBtn = document.getElementById('reset-filters')
    
    // Display elements
    this.quickCategories = document.getElementById('quick-categories')
    this.categoriesGrid = document.getElementById('categories-grid')
    this.itemsSection = document.getElementById('items-section')
    this.itemsContainer = document.getElementById('items-container')
    this.emptyState = document.getElementById('empty-state')
    this.searchStats = document.getElementById('search-stats')
    this.resultsCount = document.getElementById('results-count')
    this.selectedItemsCount = document.getElementById('selected-items-count')
    
    // View toggle
    this.gridViewBtn = document.getElementById('grid-view')
    this.listViewBtn = document.getElementById('list-view')
    
    // FABs and Modal
    this.dateFab = document.getElementById('date-fab')
    this.submitFab = document.getElementById('submit-fab')
    this.itemsBadge = document.getElementById('items-badge')
    this.dateModal = document.getElementById('date-modal')
    this.deliveryDate = document.getElementById('delivery-date')
    this.confirmDateBtn = document.getElementById('confirm-date')
    this.cancelDateBtn = document.getElementById('cancel-date')
    this.modalClose = document.querySelector('.modal-close')
    this.modalOverlay = document.querySelector('.modal-overlay')
    
    // Confirmation modal
    this.confirmModal = document.getElementById('confirm-modal')
    this.confirmDateDisplay = document.getElementById('confirm-date-display')
    this.orderItemsList = document.getElementById('order-items-list')
    this.confirmTotalItems = document.getElementById('confirm-total-items')
    this.cancelConfirmBtn = document.getElementById('cancel-confirm')
    this.submitConfirmBtn = document.getElementById('submit-confirm')
    this.modalCloseConfirm = document.querySelector('.modal-close-confirm')
  }
  
  setupEventListeners() {
    // Search
    this.searchInput.addEventListener('input', () => this.handleSearch())
    this.clearSearchBtn.addEventListener('click', () => this.clearSearch())
    
    // Filters
    this.locationFilter.addEventListener('change', () => this.handleLocationChange())
    this.areaFilter.addEventListener('change', () => this.handleAreaChange())
    this.categoryFilter.addEventListener('change', () => this.handleCategoryChange())
    this.resetFiltersBtn.addEventListener('click', () => this.resetFilters())
    
    // View toggle
    this.gridViewBtn.addEventListener('click', () => this.setView('grid'))
    this.listViewBtn.addEventListener('click', () => this.setView('list'))
    
    // FABs and Modal
    this.dateFab.addEventListener('click', () => this.openDateModal())
    this.submitFab.addEventListener('click', () => this.showConfirmModal())
    this.confirmDateBtn.addEventListener('click', () => this.confirmDate())
    this.cancelDateBtn.addEventListener('click', () => this.closeDateModal())
    this.modalClose.addEventListener('click', () => this.closeDateModal())
    this.modalOverlay.addEventListener('click', () => this.closeDateModal())
    
    // Confirmation modal
    this.cancelConfirmBtn.addEventListener('click', () => this.closeConfirmModal())
    this.submitConfirmBtn.addEventListener('click', () => this.handleSubmit())
    this.modalCloseConfirm.addEventListener('click', () => this.closeConfirmModal())
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.dateModal.style.display !== 'none') {
          this.closeDateModal()
        }
        if (this.confirmModal.style.display !== 'none') {
          this.closeConfirmModal()
        }
      }
    })
  }
  
  async loadData() {
    try {
      const resp = await apiCallGet(`${BASE_URL}/stockon/getItems`)
      if (!resp.ok) {
        if (resp.status === 401) {
          alert('Unauthorized, redirecting to login page.')
        } else {
          alert('Something went wrong, redirecting to login page.')
        }
        navigate('/login')
        return
      }
      this.categoriesData = await resp.json()
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('There was some issue while fetching data, this might be outdated version of inventory.')
      try {
        const resp = await fetch('/static/categories_schema.json')
        this.categoriesData = await resp.json()
      } catch (fallbackError) {
        console.error('Error loading fallback data:', fallbackError)
        alert('Unable to load inventory data.')
        return
      }
    }
    
    this.processData()
    this.initializeUI()
  }
  
  processData() {
    // Build flat list of all items for searching
    this.allItems = []
    const categories = new Set()
    
    Object.keys(this.categoriesData).forEach((location) => {
      this.categoriesData[location].areas.forEach((area) => {
        Object.keys(area.info).forEach((category) => {
          categories.add(category)
          const categoryItems = area.info[category]
          const itemsToAdd = Array.isArray(categoryItems) ? categoryItems : [categoryItems]
          
          itemsToAdd.forEach((item) => {
            if (item.item_id && item.name) {
              this.allItems.push({
                ...item,
                location: location,
                area: area.name,
                category: category
              })
            }
          })
        })
      })
    })
    
    // Initialize Fuse.js for fuzzy search
    this.fuse = new Fuse(this.allItems, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'item_id', weight: 0.3 }
      ],
      threshold: 0.4,
      includeScore: true
    })
    
    // Populate filters
    this.populateLocationFilter()
  }
  
  initializeUI() {
    this.renderQuickCategories()
    // Show all items by default
    this.handleSearch()
  }
  
  populateLocationFilter() {
    Object.keys(this.categoriesData).forEach((locationName) => {
      const option = document.createElement('option')
      option.value = locationName
      option.textContent = locationName
      this.locationFilter.appendChild(option)
    })
  }
  
  handleLocationChange() {
    this.currentFilters.location = this.locationFilter.value
    this.currentFilters.area = ''
    this.currentFilters.category = ''
    
    // Clear and populate area filter
    this.areaFilter.innerHTML = '<option value="">All Areas</option>'
    this.categoryFilter.innerHTML = '<option value="">All Categories</option>'
    
    if (this.currentFilters.location) {
      this.areaFilter.disabled = false
      const areas = this.categoriesData[this.currentFilters.location].areas
      areas.forEach((area) => {
        const option = document.createElement('option')
        option.value = area.name
        option.textContent = area.name
        this.areaFilter.appendChild(option)
      })
    } else {
      this.areaFilter.disabled = true
      this.categoryFilter.disabled = true
    }
    
    this.updateResetButton()
    this.handleSearch()
  }
  
  handleAreaChange() {
    this.currentFilters.area = this.areaFilter.value
    this.currentFilters.category = ''
    
    // Clear and populate category filter
    this.categoryFilter.innerHTML = '<option value="">All Categories</option>'
    
    if (this.currentFilters.location && this.currentFilters.area) {
      this.categoryFilter.disabled = false
      const area = this.categoriesData[this.currentFilters.location].areas.find(
        (a) => a.name === this.currentFilters.area
      )
      
      if (area) {
        Object.keys(area.info).forEach((categoryName) => {
          const option = document.createElement('option')
          option.value = categoryName
          option.textContent = categoryName
          this.categoryFilter.appendChild(option)
        })
      }
    } else {
      this.categoryFilter.disabled = true
    }
    
    this.updateResetButton()
    this.handleSearch()
  }
  
  handleCategoryChange() {
    this.currentFilters.category = this.categoryFilter.value
    this.updateResetButton()
    this.handleSearch()
  }
  
  resetFilters() {
    this.currentFilters = { location: '', area: '', category: '' }
    this.locationFilter.value = ''
    this.areaFilter.value = ''
    this.areaFilter.disabled = true
    this.categoryFilter.value = ''
    this.categoryFilter.disabled = true
    this.updateResetButton()
    this.handleSearch()
  }
  
  updateResetButton() {
    const hasFilters = this.currentFilters.location || this.currentFilters.area || this.currentFilters.category
    this.resetFiltersBtn.style.display = hasFilters ? 'flex' : 'none'
  }
  
  handleSearch() {
    const query = this.searchInput.value.trim()
    
    // Show/hide clear button
    this.clearSearchBtn.style.display = query ? 'flex' : 'none'
    
    let results = []
    
    if (query) {
      // Search with Fuse.js
      const searchResults = this.fuse.search(query)
      results = searchResults.map((result) => result.item)
    } else {
      // No search query, show all items
      results = [...this.allItems]
    }
    
    // Apply filters
    results = this.applyFilters(results)
    
    // Update UI - Always show items section
    if (results.length > 0) {
      this.quickCategories.style.display = 'none'
      this.itemsSection.style.display = 'block'
      this.emptyState.style.display = 'none'
      this.searchStats.style.display = 'flex'
      this.renderItems(results)
    } else if (query || this.hasActiveFilters()) {
      // Only show empty state if actively searching/filtering
      this.quickCategories.style.display = 'none'
      this.itemsSection.style.display = 'none'
      this.emptyState.style.display = 'block'
      this.searchStats.style.display = 'flex'
    } else {
      // No search/filters and no results - shouldn't happen, but fallback to categories
      this.quickCategories.style.display = 'block'
      this.itemsSection.style.display = 'none'
      this.emptyState.style.display = 'none'
      this.searchStats.style.display = 'none'
    }
    
    this.updateSearchStats(results.length)
  }
  
  applyFilters(items) {
    let filtered = items
    
    if (this.currentFilters.location) {
      filtered = filtered.filter((item) => item.location === this.currentFilters.location)
    }
    
    if (this.currentFilters.area) {
      filtered = filtered.filter((item) => item.area === this.currentFilters.area)
    }
    
    if (this.currentFilters.category) {
      filtered = filtered.filter((item) => item.category === this.currentFilters.category)
    }
    
    return filtered
  }
  
  hasActiveFilters() {
    return this.currentFilters.location || this.currentFilters.area || this.currentFilters.category
  }
  
  clearSearch() {
    this.searchInput.value = ''
    this.clearSearchBtn.style.display = 'none'
    this.handleSearch()
  }
  
  updateSearchStats(resultCount) {
    this.resultsCount.textContent = `${resultCount} result${resultCount !== 1 ? 's' : ''}`
    this.selectedItemsCount.textContent = `${this.selectedItems.size} item${this.selectedItems.size !== 1 ? 's' : ''} selected`
  }
  
  renderQuickCategories() {
    this.categoriesGrid.innerHTML = ''
    
    // Get unique categories
    const categoriesMap = new Map()
    
    this.allItems.forEach((item) => {
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, {
          name: item.category,
          count: 0,
          location: item.location,
          area: item.area
        })
      }
      categoriesMap.get(item.category).count++
    })
    
    // Render category cards
    categoriesMap.forEach((category) => {
      const card = document.createElement('div')
      card.className = 'category-card'
      card.innerHTML = `
        <h3>${category.name}</h3>
        <p>${category.count} item${category.count !== 1 ? 's' : ''}</p>
      `
      
      card.addEventListener('click', () => {
        // Set filters based on category
        this.searchInput.value = category.name
        this.handleSearch()
      })
      
      this.categoriesGrid.appendChild(card)
    })
  }
  
  renderItems(items) {
    this.itemsContainer.innerHTML = ''
    
    items.forEach((item) => {
      const card = document.createElement('div')
      const itemKey = `${item.item_id}-${item.location}-${item.area}`
      const isSelected = this.selectedItems.has(itemKey)
      const quantity = isSelected ? this.selectedItems.get(itemKey).quantity : 0
      
      card.className = `item-card ${isSelected ? 'selected' : ''}`
      card.innerHTML = `
        <div class="item-header">
          <h3 class="item-title">${item.name}</h3>
          ${isSelected ? `<span class="item-badge success">${quantity}x</span>` : ''}
        </div>
        <div class="item-meta">
          <span>ID: ${item.item_id}</span>
          <span>Unit: ${item.unit_sz}</span>
        </div>
        <div class="item-meta">
          <span>📍 ${item.location} - ${item.area}</span>
        </div>
        <div class="item-category">
          ${item.category}
        </div>
        <div class="quantity-controls">
          <button class="quantity-btn" data-action="decrement" ${quantity === 0 ? 'disabled' : ''}>
            −
          </button>
          <span class="quantity-display">${quantity}</span>
          <button class="quantity-btn" data-action="increment">
            +
          </button>
        </div>
      `
      
      // Add event listeners for quantity buttons
      const decrementBtn = card.querySelector('[data-action="decrement"]')
      const incrementBtn = card.querySelector('[data-action="increment"]')
      const quantityDisplay = card.querySelector('.quantity-display')
      
      decrementBtn.addEventListener('click', () => {
        const currentQuantity = this.selectedItems.get(itemKey)?.quantity || 0
        const newQuantity = Math.max(0, currentQuantity - 1)
        this.updateItemQuantity(item, itemKey, newQuantity)
        quantityDisplay.textContent = newQuantity
        decrementBtn.disabled = newQuantity === 0
        
        if (newQuantity === 0) {
          card.classList.remove('selected')
          const badge = card.querySelector('.item-badge.success')
          if (badge) badge.remove()
        } else {
          const badge = card.querySelector('.item-badge.success')
          if (badge) badge.textContent = `${newQuantity}x`
        }
        
        this.updateUIState()
      })
      
      incrementBtn.addEventListener('click', () => {
        const currentQuantity = this.selectedItems.get(itemKey)?.quantity || 0
        const newQuantity = currentQuantity + 1
        this.updateItemQuantity(item, itemKey, newQuantity)
        quantityDisplay.textContent = newQuantity
        decrementBtn.disabled = false
        card.classList.add('selected')
        
        let badge = card.querySelector('.item-badge.success')
        if (!badge) {
          badge = document.createElement('span')
          badge.className = 'item-badge success'
          card.querySelector('.item-header').appendChild(badge)
        }
        badge.textContent = `${newQuantity}x`
        
        this.updateUIState()
      })
      
      this.itemsContainer.appendChild(card)
    })
  }
  
  updateItemQuantity(item, itemKey, quantity) {
    if (quantity === 0) {
      this.selectedItems.delete(itemKey)
    } else {
      this.selectedItems.set(itemKey, {
        location: item.location,
        area: item.area,
        category: item.category,
        item_id: item.item_id,
        name: item.name,
        unit_sz: item.unit_sz,
        quantity: quantity
      })
    }
    
    this.updateUIState()
  }
  
  updateUIState() {
    const hasItems = this.selectedItems.size > 0
    const hasDate = this.selectedDate !== null
    
    // Update FABs
    if (hasItems) {
      this.dateFab.style.display = 'flex'
      this.submitFab.style.display = 'flex'
      this.itemsBadge.textContent = this.selectedItems.size
      this.itemsBadge.style.display = 'flex'
      
      if (hasDate) {
        this.submitFab.disabled = false
        this.dateFab.querySelector('.fab-label').textContent = new Date(this.selectedDate).toLocaleDateString()
      } else {
        this.submitFab.disabled = true
        this.dateFab.querySelector('.fab-label').textContent = 'Select Date'
      }
    } else {
      this.dateFab.style.display = 'none'
      this.submitFab.style.display = 'none'
      this.itemsBadge.style.display = 'none'
    }
    
    // Update search stats
    if (this.searchStats.style.display !== 'none') {
      this.selectedItemsCount.textContent = `${this.selectedItems.size} item${this.selectedItems.size !== 1 ? 's' : ''} selected`
    }
  }
  
  setView(view) {
    this.currentView = view
    
    if (view === 'grid') {
      this.gridViewBtn.classList.add('active')
      this.listViewBtn.classList.remove('active')
      this.itemsContainer.classList.remove('list-view')
    } else {
      this.listViewBtn.classList.add('active')
      this.gridViewBtn.classList.remove('active')
      this.itemsContainer.classList.add('list-view')
    }
  }
  
  openDateModal() {
    this.dateModal.style.display = 'flex'
    // Set min date to today
    const today = new Date().toISOString().split('T')[0]
    this.deliveryDate.min = today
    if (this.selectedDate) {
      this.deliveryDate.value = this.selectedDate
    }
    document.body.style.overflow = 'hidden'
  }
  
  closeDateModal() {
    this.dateModal.style.display = 'none'
    document.body.style.overflow = ''
  }
  
  confirmDate() {
    if (this.deliveryDate.value) {
      this.selectedDate = this.deliveryDate.value
      this.closeDateModal()
      this.updateUIState()
    } else {
      alert('Please select a date.')
    }
  }
  
  showConfirmModal() {
    if (!this.selectedDate) {
      alert('⚠️ Please select a delivery date first.')
      this.openDateModal()
      return
    }
    
    if (this.selectedItems.size === 0) {
      alert('⚠️ Please select at least one item.')
      return
    }
    
    // Format date
    const dateObj = new Date(this.selectedDate + 'T00:00:00')
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    this.confirmDateDisplay.textContent = formattedDate
    
    // Build order items list
    this.orderItemsList.innerHTML = ''
    let totalQuantity = 0
    
    this.selectedItems.forEach((data) => {
      totalQuantity += data.quantity
      
      const itemDiv = document.createElement('div')
      itemDiv.className = 'order-item'
      itemDiv.innerHTML = `
        <div class="order-item-qty">${data.quantity}x</div>
        <div class="order-item-details">
          <div class="order-item-name">${data.name}</div>
          <div class="order-item-meta">ID: ${data.item_id} • Unit: ${data.unit_sz}</div>
        </div>
        <div class="order-item-location">
          <span>📍 ${data.location}</span>
          <span>${data.area}</span>
          <span class="order-item-category">${data.category}</span>
        </div>
      `
      
      this.orderItemsList.appendChild(itemDiv)
    })
    
    this.confirmTotalItems.textContent = `${this.selectedItems.size} unique item${this.selectedItems.size !== 1 ? 's' : ''} (${totalQuantity} total units)`
    
    this.confirmModal.style.display = 'flex'
    document.body.style.overflow = 'hidden'
  }
  
  closeConfirmModal() {
    this.confirmModal.style.display = 'none'
    document.body.style.overflow = ''
  }
  
  async handleSubmit() {
    // Close confirmation modal
    this.closeConfirmModal()
    
    if (!this.selectedDate) {
      alert('⚠️ Please select a delivery date.')
      this.openDateModal()
      return
    }
    
    if (this.selectedItems.size === 0) {
      alert('Please select at least one item.')
      return
    }
    
    const submissionData = {
      date: this.selectedDate,
      items: Array.from(this.selectedItems.values())
    }
    
    const jsonString = JSON.stringify(submissionData)
    const jsonSizeInBytes = new Blob([jsonString]).size
    const MAX_JSON_SIZE = 8 * 1024 * 1024
    
    try {
      this.submitFab.classList.add('loading')
      this.submitFab.disabled = true
      
      const resp = await apiCallPost(`${BASE_URL}/stockon/addItems`, jsonString)
      
      if (resp.ok) {
        alert('✅ Successfully uploaded data! Refreshing page...')
        location.reload()
      } else {
        throw new Error(`HTTP error! status: ${resp.status}`)
      }
    } catch (error) {
      console.error('Submission error:', error)
      this.submitFab.classList.remove('loading')
      this.submitFab.disabled = false
      
      if (jsonSizeInBytes > MAX_JSON_SIZE) {
        this.downloadJsonFile(submissionData)
        alert('❌ Data too large. JSON file downloaded. Please send to support.')
      } else {
        try {
          const webhookSuccess = await this.sendDiscordWebhook(submissionData)
          if (webhookSuccess) {
            alert('❌ Failed to upload. Error details sent to support via Discord.')
          } else {
            alert('❌ Upload failed and could not send error report. Please contact support.')
            this.downloadJsonFile(submissionData)
          }
        } catch (webhookError) {
          console.error('Webhook error:', webhookError)
          this.downloadJsonFile(submissionData)
          alert('❌ Multiple errors occurred. Please contact support immediately.')
        }
      }
    }
  }
  
  async sendDiscordWebhook(jsonData) {
    const DISCORD_WEBHOOK_URL =
      'https://discord.com/api/webhooks/1340223000196284446/A9QDxTf512ISJc-Jr7uKMnGBd45spEB9flFV_sGq6M49aXrRJVDcivuVfKlgmotDL4-M'
    
    try {
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const formData = new FormData()
      formData.append(
        'payload_json',
        JSON.stringify({
          content: 'Failed Stockon Item Upload',
          username: 'Stockon Error Reporter'
        })
      )
      formData.append('file', blob, 'failed_stockon_upload.json')
      
      const webhookResp = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        body: formData
      })
      
      return webhookResp.ok
    } catch (error) {
      console.error('Discord webhook error:', error)
      return false
    }
  }
  
  downloadJsonFile(jsonData) {
    const jsonString = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const date = Date.now()
    link.download = `stockon_upload_failed_${date}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new StockonManager()
})
