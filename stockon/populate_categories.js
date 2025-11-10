class StockonButtonManager {
  constructor() {
    this.selectedDate = null
    this.itemQuantities = []
    this.submitButton = null
    this.dateButton = null
    this.dateInput = null

    this.createButtons()
    this.setupEventListeners()
  }

  createButtons() {
    // Create submit button
    this.submitButton = document.createElement("button")
    this.submitButton.id = "stockon-submit-btn"
    this.submitButton.textContent = "Submit"
    this.submitButton.classList.add("submit-btn")
    this.submitButton.style.position = "fixed"
    this.submitButton.style.bottom = "20px"
    this.submitButton.style.right = "20px"
    this.submitButton.style.zIndex = "1000"
    this.submitButton.style.backgroundColor = "#28a745"
    this.submitButton.style.color = "white"
    this.submitButton.style.border = "none"
    this.submitButton.style.padding = "10px 20px"
    this.submitButton.style.borderRadius = "5px"
    this.submitButton.style.cursor = "pointer"
    this.submitButton.style.display = "none"

    // Create date button
    this.dateButton = document.createElement("button")
    this.dateButton.id = "stockon-date-btn"
    this.dateButton.textContent = "Select Delivery Date"
    this.dateButton.classList.add("date-btn")
    this.dateButton.style.position = "fixed"
    this.dateButton.style.bottom = "20px"
    this.dateButton.style.right = "140px"
    this.dateButton.style.zIndex = "1000"
    this.dateButton.style.backgroundColor = "#007bff"
    this.dateButton.style.color = "white"
    this.dateButton.style.border = "none"
    this.dateButton.style.padding = "10px 20px"
    this.dateButton.style.borderRadius = "5px"
    this.dateButton.style.cursor = "pointer"
    this.dateButton.style.display = "none"

    // Create date input
    this.dateInput = document.createElement("input")
    this.dateInput.type = "date"
    this.dateInput.id = "stockon-date-input"
    this.dateInput.style.position = "fixed"
    this.dateInput.style.bottom = "60px"
    this.dateInput.style.right = "140px"
    this.dateInput.style.zIndex = "1001"
    this.dateInput.style.padding = "10px"
    this.dateInput.style.borderRadius = "5px"
    this.dateInput.style.border = "2px solid #007bff"
    this.dateInput.style.display = "none"

    // Append to body
    document.body.appendChild(this.submitButton)
    document.body.appendChild(this.dateButton)
    document.body.appendChild(this.dateInput)
  }

  setupEventListeners() {
    // Date button click handler
    this.dateButton.addEventListener("click", () => {
      this.dateInput.style.display = this.dateInput.style.display === "none" ? "block" : "none"
      if (this.dateInput.style.display === "block") {
        this.dateInput.focus()
      }
    })

    // Date input change handler
    this.dateInput.addEventListener("change", (e) => {
      if (e.target.valueAsDate) {
        this.selectedDate = e.target.value
        this.dateButton.textContent = `Date: ${this.selectedDate}`
        this.dateButton.style.backgroundColor = "#28a745"
        this.updateButtonStates()
      }
    })

    // Date input blur handler
    this.dateInput.addEventListener("blur", () => {
      this.dateInput.style.display = "none"
    })

    // Submit button click handler
    this.submitButton.addEventListener("click", async () => {
      await this.handleSubmit()
    })
  }

  updateButtonStates() {
    const hasItems = this.itemQuantities.length > 0
    const hasDate = this.selectedDate !== null

    if (hasItems && hasDate) {
      this.submitButton.style.display = "block"
      this.submitButton.style.backgroundColor = "#28a745"
      this.submitButton.disabled = false
    } else if (hasItems && !hasDate) {
      this.submitButton.style.display = "block"
      this.submitButton.style.backgroundColor = "#6c757d"
      this.submitButton.disabled = true
    } else {
      this.submitButton.style.display = "none"
    }

    this.dateButton.style.display = hasItems ? "block" : "none"
  }

  async handleSubmit() {
    if (!this.selectedDate) {
      alert("Please select a date before submitting.")
      return
    }

    const submissionData = {
      date: this.selectedDate,
      items: this.itemQuantities,
    }

    const jsonString = JSON.stringify(submissionData)
    const jsonSizeInBytes = new Blob([jsonString]).size
    const MAX_JSON_SIZE = 8 * 1024 * 1024

    try {
      let resp = await apiCallPost(`${BASE_URL}/stockon/addItems`, jsonString)
      if (resp.ok) {
        alert("Successfully uploaded data, refreshing page.")
        location.reload()
      } else {
        alert("Something went wrong.")
        if (jsonSizeInBytes > MAX_JSON_SIZE) {
          downloadJsonFile(submissionData)
          alert("Data too large. JSON file downloaded. Please send to support.")
        } else {
          const webhookSuccess = await sendDiscordWebhook(submissionData)
          if (webhookSuccess) {
            alert("Failed to upload. Error details sent to support via Discord.")
          } else {
            alert("Upload failed and could not send error report. Please contact support.")
            downloadJsonFile(submissionData)
          }
        }
      }
    } catch (e) {
      console.error("Submission error:", e)
      if (jsonSizeInBytes > MAX_JSON_SIZE) {
        downloadJsonFile(submissionData)
        alert("Error occurred. JSON file downloaded. Please send to support.")
      } else {
        try {
          const webhookSuccess = await sendDiscordWebhook(submissionData)
          if (webhookSuccess) {
            alert("Error occurred. Details sent to support via Discord.")
          } else {
            alert("Error occurred. Could not send error report. Please contact support.")
            downloadJsonFile(submissionData)
          }
        } catch (webhookError) {
          downloadJsonFile(submissionData)
          console.error("Webhook error:", webhookError)
          alert("Multiple errors occurred. Please contact support immediately.")
        }
      }
    }
  }

  // Getters
  get getSelectedDate() {
    return this.selectedDate
  }

  get getItemQuantities() {
    return this.itemQuantities
  }

  get getSubmitButton() {
    return this.submitButton
  }

  get getDateButton() {
    return this.dateButton
  }

  // Setter for item quantities
  setItemQuantities(quantities) {
    this.itemQuantities = quantities
    this.updateButtonStates()
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const locationDropdown = document.getElementById("location-dropdown")
  const areaDropdown = document.getElementById("area-dropdown")
  const itemsContainer = document.getElementById("items-container")
  const searchInput = document.getElementById("search-input")
  const searchContainer = document.querySelector(".search-container")
  const categoriesContainer = document.getElementById("categories-container")

  let categorySelected = false
  let categoriesData = null
  let allItems = []

  // Fetch data
  try {
    const resp = await apiCallGet(`${BASE_URL}/stockon/getItems`)
    if (!resp.ok) {
      if (resp.status === 401) {
        alert("Unauthorized, redirecting to login page.")
      } else {
        alert("Something went wrong, redirecting to login page.")
      }
      navigate("/login")
    }
    categoriesData = await resp.json()
  } catch (_) {
    alert("There was some issue while fetching data, this might be outdated version of inventory.")
    let resp = await fetch("/static/categories_schema.json")
    categoriesData = await resp.json()
  }

  // Initialize button manager
  const buttonManager = new StockonButtonManager()

  // Initialize allItems array for searching
  Object.keys(categoriesData).forEach((location) => {
    categoriesData[location].areas.forEach((area) => {
      Object.keys(area.info).forEach((category) => {
        const categoryItems = area.info[category]
        const itemsToAdd = Array.isArray(categoryItems) ? categoryItems : [categoryItems]
        itemsToAdd.forEach((item) => {
          if (item.item_id && item.name) {
            allItems.push({
              ...item,
              location: location,
              area: area.name,
              category: category,
            })
          }
        })
      })
    })
  })

  // Function to check and update search visibility
  function updateSearchVisibility() {
    const locationSelected = locationDropdown.value !== ""
    const areaSelected = areaDropdown.value !== ""

    if (locationSelected && areaSelected && categorySelected) {
      searchContainer.style.display = "flex"
    } else {
      searchContainer.style.display = "none"
    }
  }

  // Populate Location Dropdown - USE categoriesData, not data
  Object.keys(categoriesData).forEach((locationName) => {
    const option = document.createElement("option")
    option.value = locationName
    option.textContent = locationName
    locationDropdown.appendChild(option)
  })

  // Location Dropdown Change Event
  locationDropdown.addEventListener("change", function () {
    areaDropdown.innerHTML = "<option value=''>Select Area</option>"
    itemsContainer.innerHTML = ""
    categoriesContainer.innerHTML = ""

    categorySelected = false
    updateSearchVisibility()

    const selectedLocation = this.value
    if (!selectedLocation) return

    // Populate Area Dropdown - USE categoriesData, not data
    categoriesData[selectedLocation].areas.forEach((area) => {
      const option = document.createElement("option")
      option.value = area.name
      option.textContent = area.name
      areaDropdown.appendChild(option)
    })
  })

  // Update the updateItemQuantity function to use buttonManager
  function updateItemQuantity(item, location, area, category, quantity) {
    const existingItemIndex = buttonManager.itemQuantities.findIndex(
      (q) => q.item_id === item.item_id && q.location === location && q.area === area,
    )

    const itemQuantityEntry = {
      location: location,
      area: area,
      category: category,
      item_id: item.item_id,
      name: item.name,
      unit_sz: item.unit_sz,
      quantity: quantity,
    }

    if (existingItemIndex !== -1) {
      if (quantity === 0) {
        buttonManager.itemQuantities.splice(existingItemIndex, 1)
      } else {
        buttonManager.itemQuantities[existingItemIndex] = itemQuantityEntry
      }
    } else {
      buttonManager.itemQuantities.push(itemQuantityEntry)
    }

    buttonManager.updateButtonStates()
  }

  // Update displayItems function to use buttonManager
  function displayItems(items, location, area) {
    itemsContainer.innerHTML = ""

    items.forEach((item) => {
      const itemDiv = document.createElement("div")
      itemDiv.classList.add("item")

      const existingItemIndex = buttonManager.itemQuantities.findIndex(
        (q) => q.item_id === item.item_id && q.location === location && q.area === area,
      )

      const initialQuantity = existingItemIndex !== -1 ? buttonManager.itemQuantities[existingItemIndex].quantity : 0

      itemDiv.innerHTML = `
        <h3>${item.name}</h3>
        <p>Item ID: ${item.item_id}</p>
        <p>Unit Size: ${item.unit_sz}</p>
        ${item.category ? `<p>Category: ${item.category}</p>` : ""}
        <div class="quantity-controls">
            <button class="decrement-btn" data-item-id="${item.item_id}">-</button>
            <span class="quantity">${initialQuantity}</span>
            <button class="increment-btn" data-item-id="${item.item_id}">+</button>
        </div>
      `

      itemsContainer.appendChild(itemDiv)

      const incrementBtn = itemDiv.querySelector(".increment-btn")
      const decrementBtn = itemDiv.querySelector(".decrement-btn")
      const quantitySpan = itemDiv.querySelector(".quantity")

      incrementBtn.addEventListener("click", () => {
        const currentQuantity = parseInt(quantitySpan.textContent)
        const newQuantity = currentQuantity + 1
        quantitySpan.textContent = newQuantity
        updateItemQuantity(item, location, area, item.category || "", newQuantity)
      })

      decrementBtn.addEventListener("click", () => {
        const currentQuantity = parseInt(quantitySpan.textContent)
        if (currentQuantity > 0) {
          const newQuantity = Math.max(0, currentQuantity - 1)
          quantitySpan.textContent = newQuantity
          updateItemQuantity(item, location, area, item.category || "", newQuantity)
        }
      })
    })
  }

  // Area Dropdown Change Event
  areaDropdown.addEventListener("change", function () {
    // Clear previous categories and items
    categoriesContainer.innerHTML = ""
    itemsContainer.innerHTML = ""

    // Reset category selected state
    categorySelected = false
    updateSearchVisibility()

    const selectedLocation = locationDropdown.value
    const selectedArea = this.value
    if (!selectedLocation || !selectedArea) return

    // Find the selected area in the location
    const area = categoriesData[selectedLocation].areas.find((a) => a.name === selectedArea)

    // Create category cards
    Object.keys(area.info).forEach((categoryName) => {
      const categoryCard = document.createElement("div")
      categoryCard.classList.add("category-card")
      categoryCard.textContent = categoryName

      categoryCard.addEventListener("click", function () {
        // Remove 'selected' class from all cards
        document.querySelectorAll(".category-card").forEach((card) => {
          card.classList.remove("selected")
        })

        // Add 'selected' class to clicked card
        this.classList.add("selected")

        // Set category selected to true
        categorySelected = true
        updateSearchVisibility()

        // Get items for the selected category
        const categoryItems = area.info[categoryName]

        // Handle multiple items or a single item
        const itemsToDisplay = Array.isArray(categoryItems) ? categoryItems : [categoryItems]

        // Add category to each item for display
        const itemsWithCategory = itemsToDisplay.map((item) => ({
          ...item,
          category: categoryName,
        }))

        // Display the items
        displayItems(itemsWithCategory, selectedLocation, selectedArea)
      })

      categoriesContainer.appendChild(categoryCard)
    })
  })

  searchInput.addEventListener("input", function () {
    const query = this.value.trim()

    // If empty, Clear results and restore categories view
    if (!query) {
      itemsContainer.innerHTML = ""
      const selectedLocation = locationDropdown.value
      const selectedArea = areaDropdown.value

      if (selectedLocation && selectedArea) {
        // If a category was already selected, restore items
        const selectedCard = document.querySelector(".category-card.selected")
        if (selectedCard) {
          selectedCard.click()
        } else {
          // Do area change to repopulate categories
          areaDropdown.dispatchEvent(new Event("change"))
        }
      }
      return
    }

    performSearch()
  })

  function performSearch() {
    const query = searchInput.value.trim()

    // Create Fuse.js instance for fuzzy searching
    const fuse = new Fuse(allItems, {
      keys: ["name", "item_id"],
      threshold: 0.3,
      includeScore: true,
    })

    const results = fuse.search(query)

    if (results.length === 0) {
      itemsContainer.innerHTML = "<p class='no-results'>No items found matching your search.</p>"
    } else {
      // Get selected location and area from dropdowns
      const selectedLocation = locationDropdown.value
      const selectedArea = areaDropdown.value

      if (!selectedLocation || !selectedArea) {
        itemsContainer.innerHTML = "<p class='no-results'>Please select both location and area before searching.</p>"
        return
      }

      // Filter results to only include items from the selected location and area
      const filteredResults = results
        .filter((result) => result.item.location === selectedLocation && result.item.area === selectedArea)
        .map((result) => result.item)

      if (filteredResults.length === 0) {
        itemsContainer.innerHTML =
          "<p class='no-results'>No matching items found in the selected location and area.</p>"
      } else {
        displayItems(filteredResults, selectedLocation, selectedArea)
      }
    }
  }
})

// Function to send Discord webhook
async function sendDiscordWebhook(jsonData) {
  const DISCORD_WEBHOOK_URL =
    "https://discord.com/api/webhooks/1340223000196284446/A9QDxTf512ISJc-Jr7uKMnGBd45spEB9flFV_sGq6M49aXrRJVDcivuVfKlgmotDL4-M"
  try {
    // Convert jsonData to a Blob
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {type: "application/json"})

    // Create a FormData to send file
    const formData = new FormData()
    formData.append(
      "payload_json",
      JSON.stringify({
        content: "Failed Stockon Item Upload",
        username: "Stockon Error Reporter",
      }),
    )
    formData.append("file", blob, "failed_stockon_upload.json")

    // Send webhook
    const webhookResp = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      body: formData,
    })

    return webhookResp.ok
  } catch (error) {
    console.error("Discord webhook error:", error)
    return false
  }
}

// Function to download JSON file
function downloadJsonFile(jsonData) {
  // Convert JSON to a string with formatting
  const jsonString = JSON.stringify(jsonData, null, 2)

  // Create a Blob from the JSON string
  const blob = new Blob([jsonString], {type: "application/json"})

  // Create a link element
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  let date = Date.now()
  link.download = `stockon_upload_failed_${date}.json`

  // Append to body, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
