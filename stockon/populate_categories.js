document.addEventListener("DOMContentLoaded", async function() {
    const locationDropdown = document.getElementById("location-dropdown")
    const areaDropdown = document.getElementById("area-dropdown")
    const itemsContainer = document.getElementById("items-container")

    let categoriesData = null
    let data = null;

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

        data = await resp.json()
    }catch (_) {
        alert("There was some issue while fetching data, this might be outdated version of inventory.")
        let resp = await fetch("/static/categories_schema.json")
        data = await resp.json();
    }
    categoriesData = data

    // Global array to track item quantities
    window.stockonItemQuantities = []

    // Create submit button
    const submitButton = document.createElement("button")
    submitButton.id = "stockon-submit-btn"
    submitButton.textContent = "Submit"
    submitButton.classList.add("submit-btn")
    submitButton.style.position = "fixed"
    submitButton.style.bottom = "20px"
    submitButton.style.right = "20px"
    submitButton.style.zIndex = "1000"
    submitButton.style.backgroundColor = "#28a745"
    submitButton.style.color = "white"
    submitButton.style.border = "none"
    submitButton.style.padding = "10px 20px"
    submitButton.style.borderRadius = "5px"
    submitButton.style.cursor = "pointer"
    submitButton.style.display = "none" // Initially hidden

    submitButton.addEventListener("click", async () => {
        // Check JSON size
        const jsonData = window.stockonItemQuantities;
        const jsonString = JSON.stringify(jsonData);
        const jsonSizeInBytes = new Blob([jsonString]).size;
        const MAX_JSON_SIZE = 8 * 1024 * 1024; // 8 MB

        try {
            let resp = await apiCallPost(`${BASE_URL}/stockon/addItems`, JSON.stringify(window.stockonItemQuantities));
            if (resp.ok) {
                alert("Successfully uploaded data, refreshing page.");
                location.reload(); // Refresh the page
            } else {
                alert("Something went wrong.");
                if (jsonSizeInBytes > MAX_JSON_SIZE) {
                    // Download JSON file if too large
                    downloadJsonFile(jsonData);
                    alert("Data too large. JSON file downloaded. Please send to support.");
                } else {
                    // Try to send via Discord webhook
                    const webhookSuccess = await sendDiscordWebhook(jsonData);

                    if (webhookSuccess) {
                        alert("Failed to upload. Error details sent to support via Discord.");
                    } else {
                        alert("Upload failed and could not send error report. Please contact support.");
                        downloadJsonFile(jsonData);
                    }
                }
            }
        }catch (e) {
            console.error('Submission error:', e);

            // Handle network or other errors
            if (jsonSizeInBytes > MAX_JSON_SIZE) {
                downloadJsonFile(jsonData);
                alert("Error occurred. JSON file downloaded. Please send to support.");
            } else {
                try {
                    const webhookSuccess = await sendDiscordWebhook(jsonData);

                    if (webhookSuccess) {
                        alert("Error occurred. Details sent to support via Discord.");
                    } else {
                        alert("Error occurred. Could not send error report. Please contact support.");
                        downloadJsonFile(jsonData);
                    }
                } catch (webhookError) {
                    downloadJsonFile(jsonData);
                    console.error('Webhook error:', webhookError);
                    alert("Multiple errors occurred. Please contact support immediately.");
                }
            }
        }
    })

    document.body.appendChild(submitButton)

    // Populate Location Dropdown
    Object.keys(data).forEach(locationName => {
        const option = document.createElement("option")
        option.value = locationName
        option.textContent = locationName
        locationDropdown.appendChild(option)
    })

    // Location Dropdown Change Event
    locationDropdown.addEventListener("change", function() {
        // Clear previous area and category dropdowns
        areaDropdown.innerHTML = "<option value=''>Select Area</option>"
        itemsContainer.innerHTML = ""

        const selectedLocation = this.value
        if (!selectedLocation) return

        // Populate Area Dropdown
        data[selectedLocation].areas.forEach(area => {
            const option = document.createElement("option")
            option.value = area.name
            option.textContent = area.name
            areaDropdown.appendChild(option)
        })
    })

    // Function to update item quantities array
    function updateItemQuantity(item, location, area, category, quantity) {
        const existingItemIndex = window.stockonItemQuantities.findIndex(
            q => q.item_id === item.item_id &&
                q.location === location &&
                q.area === area
        )

        const itemQuantityEntry = {
            location: location,
            area: area,
            category: category,
            item_id: item.item_id,
            name: item.name,
            unit_sz: item.unit_sz,
            quantity: quantity
        }

        if (existingItemIndex !== -1) {
            if (quantity === 0) {
                window.stockonItemQuantities.splice(existingItemIndex, 1)
            } else {
                window.stockonItemQuantities[existingItemIndex] = itemQuantityEntry
            }
        } else {
            window.stockonItemQuantities.push(itemQuantityEntry)
        }

        // Show submit button if there are quantities
        const submitBtn = document.getElementById("stockon-submit-btn")
        submitBtn.style.display = window.stockonItemQuantities.length > 0 ? "block" : "none"
    }

    // Area Dropdown Change Event
    areaDropdown.addEventListener("change", function() {
        // Clear previous categories and items
        const categoriesContainer = document.getElementById("categories-container")
        categoriesContainer.innerHTML = ""
        itemsContainer.innerHTML = ""

        const selectedLocation = locationDropdown.value
        const selectedArea = this.value
        if (!selectedLocation || !selectedArea) return

        // Find the selected area in the location
        const area = categoriesData[selectedLocation].areas.find(a => a.name === selectedArea)

        // Create category cards
        Object.keys(area.info).forEach(categoryName => {
            const categoryCard = document.createElement("div")
            categoryCard.classList.add("category-card")
            categoryCard.textContent = categoryName

            categoryCard.addEventListener("click", function() {
                // Remove 'selected' class from all cards
                document.querySelectorAll(".category-card").forEach(card => {
                    card.classList.remove("selected")
                })

                // Add 'selected' class to clicked card
                this.classList.add("selected")

                // Clear previous items
                itemsContainer.innerHTML = ""

                // Get items for the selected category
                const categoryItems = area.info[categoryName]

                // Handle multiple items or a single item
                const itemsToDisplay = Array.isArray(categoryItems) ? categoryItems : [categoryItems]

                // Create item display for each item
                itemsToDisplay.forEach(item => {
                    const itemDiv = document.createElement("div")
                    itemDiv.classList.add("item")

                    // Find existing quantity or set to 0
                    const existingItemIndex = window.stockonItemQuantities.findIndex(
                        q => q.item_id === item.item_id &&
                            q.location === selectedLocation &&
                            q.area === selectedArea
                    )

                    const initialQuantity = existingItemIndex !== -1 ?
                        window.stockonItemQuantities[existingItemIndex].quantity : 0

                    itemDiv.innerHTML = `
                        <h3>${item.name}</h3>
                        <p>Item ID: ${item.item_id}</p>
                        <p>Unit Size: ${item.unit_sz}</p>
                        <div class="quantity-controls">
                            <button class="decrement-btn" data-item-id="${item.item_id}">-</button>
                            <span class="quantity">${initialQuantity}</span>
                            <button class="increment-btn" data-item-id="${item.item_id}">+</button>
                        </div>
                    `

                    itemsContainer.appendChild(itemDiv)

                    // Add event listeners for increment/decrement
                    const incrementBtn = itemDiv.querySelector(".increment-btn")
                    const decrementBtn = itemDiv.querySelector(".decrement-btn")
                    const quantitySpan = itemDiv.querySelector(".quantity")

                    incrementBtn.addEventListener("click", () => {
                        const currentQuantity = parseInt(quantitySpan.textContent)
                        const newQuantity = currentQuantity + 1
                        quantitySpan.textContent = newQuantity

                        updateItemQuantity(item, selectedLocation, selectedArea, categoryName, newQuantity)
                    })

                    decrementBtn.addEventListener("click", () => {
                        const currentQuantity = parseInt(quantitySpan.textContent)
                        const newQuantity = Math.max(0, currentQuantity - 1)
                        quantitySpan.textContent = newQuantity

                        updateItemQuantity(item, selectedLocation, selectedArea, categoryName, newQuantity)
                    })
                })
            })

            categoriesContainer.appendChild(categoryCard)
        })
    })
})

// Function to send Discord webhook
async function sendDiscordWebhook(jsonData) {
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1340223000196284446/A9QDxTf512ISJc-Jr7uKMnGBd45spEB9flFV_sGq6M49aXrRJVDcivuVfKlgmotDL4-M"
    try {
        // Convert jsonData to a Blob
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });

        // Create a FormData to send file
        const formData = new FormData();
        formData.append('payload_json', JSON.stringify({
            content: "Failed Stockon Item Upload",
            username: "Stockon Error Reporter"
        }));
        formData.append('file', blob, 'failed_stockon_upload.json');

        // Send webhook
        const webhookResp = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            body: formData
        });

        return webhookResp.ok;
    } catch (error) {
        console.error('Discord webhook error:', error);
        return false;
    }
}

// Function to download JSON file
function downloadJsonFile(jsonData) {
    // Convert JSON to a string with formatting
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    let date = new Date().getMilliseconds();
    link.download = `stockon_upload_failed_${date}.json`;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
