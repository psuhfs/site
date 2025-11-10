// HTML IDs
const employeeSearchId = "employee-search"
const selectedPointsId = "selected-points"
const WH =
  "https://discord.com/api/webhooks/1346883383883731065/R_vnDiPgss41msfCQBv_WOFqmdIvmDuSztzGh7hxjkQoXngCP_Dof86ZmwWZgxieqEmG"
let selectedShift = null

function handleSearchEmployee(employeeResponseData) {
  console.log("Employee data:", employeeResponseData)
  let employeeSearchElement = document.getElementById(employeeSearchId)

  let employeeList = employeeResponseData["EmployeeList"]

  function toggleEmployeeIdField(show) {
    const employeeIdContainer = document.getElementById("employee-id-container")
    employeeIdContainer.style.display = show ? "block" : "none"
  }

  document.getElementById(employeeSearchId).addEventListener("input", function () {
    const searchValue = this.value.toLowerCase()
    const resultsContainer = document.getElementById("employee-results")
    resultsContainer.innerHTML = ""

    if (searchValue === "") {
      return
    }
    for (const employee of employeeList) {
      let fullName = `${employee.FIRST_NAME} ${employee.LAST_NAME}`

      if (fullName.toLowerCase().includes(searchValue)) {
        const resultItem = document.createElement("div")
        resultItem.classList.add("result-item")
        resultItem.textContent = fullName
        resultItem.dataset.employeeId = employee.EMPLOYEE_NUMBER

        resultItem.addEventListener("click", function () {
          employeeSearchElement.value = fullName
          employeeSearchElement.dataset.employeeId = employee.EMPLOYEE_NUMBER
          employeeSearchElement.dataset.emails = employee.EMAILS
          if (!employee.EMPLOYEE_NUMBER) {
            toggleEmployeeIdField(true)
          } else {
            toggleEmployeeIdField(false)
          }

          resultsContainer.innerHTML = ""
        })

        resultsContainer.appendChild(resultItem)
      }
    }
  })

  const searchInput = document.getElementById(employeeSearchId)
  const resultsContainer = document.getElementById("employee-results")
  let selectedIndex = -1

  function updateSelection(items, selectedIndex) {
    Array.from(items).forEach((item, index) => {
      item.classList.toggle("selected", index === selectedIndex)
    })
  }

  searchInput.addEventListener("keydown", function (event) {
    const items = resultsContainer.getElementsByClassName("result-item")

    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (selectedIndex < items.length - 1) {
        selectedIndex++
        updateSelection(items, selectedIndex)
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (selectedIndex > 0) {
        selectedIndex--
        updateSelection(items, selectedIndex)
      }
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (selectedIndex > -1 && items[selectedIndex]) {
        items[selectedIndex].click() // Simulate click on selected item
      }
    }
  })
}

async function searchEmployee(isServerHealthy) {
  if (isServerHealthy) {
    try {
      const responseEmployees = await apiCallGet(`${BASE_URL}/workon/employees`)
      if (!responseEmployees.ok) {
        kickOut(responseEmployees.status)
      }
      const employeeResponseData = await responseEmployees.text()
      console.log("Employee data:", employeeResponseData)
      handleSearchEmployee(JSON.parse(employeeResponseData))
    } catch (e) {
      alert("Failed to fetch employee data: " + e)
    }
  }

  document.getElementById("shift-date").addEventListener("change", async function () {
    const selectedDate = this.value
    console.log("Date changed to:", selectedDate)

    let employeeSearch = document.getElementById(employeeSearchId).dataset
    let employeeId = employeeSearch.employeeId
    if (!employeeId) {
      let employeeIdInput = document.getElementById("employee-id-container")
      if (isServerHealthy) {
        if (!employeeIdInput.value) {
          alert("Please enter an employee ID")
          return
        }
      }
      employeeId = employeeIdInput.value
    }

    if (isServerHealthy) {
      try {
        /*      const response = await fetch(`${BASE_URL}/workon/employee/${employeeId}/shifts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          credentials: "include",
          body: JSON.stringify({date: selectedDate}),
        })*/
        const response = await apiCallPost(
          `${BASE_URL}/workon/employee/${employeeId}/shifts`,
          JSON.stringify({date: selectedDate}),
        )
        if (!response.ok) {
          kickOut(response.status)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const shiftData = await response.json()
        console.log("Shift data received:", shiftData)
        displayShifts(shiftData, employeeId, selectedDate)
      } catch (error) {
        console.error("Error fetching shifts:", error)
        alert("Failed to fetch shift data")
      }
    }
  })
}

function displayShifts(filteredShifts, employeeId, date) {
  const shiftContainer = document.getElementById("shift-options")
  shiftContainer.innerHTML = ""
  // const filteredShifts = shifts.filter((shift) => shift.EMPLOYEE_NUMBER === employeeId && shift.START_DATE === date)

  if (filteredShifts.length > 0) {
    filteredShifts.forEach((shift) => {
      const shiftItem = document.createElement("div") // Container for each radio and label
      shiftItem.classList.add("shift-item")

      const radio = document.createElement("input")
      radio.type = "button"
      radio.id = shift["SHIFT_ID"]
      radio.name = "shift"
      let textValue = `${shift["START_TIME"]} - ${shift["END_TIME"]} (${shift["POSITION_NAME"]})`
      radio.value = textValue
      radio.onclick = function () {
        selectedShift = this.value
      }

      shiftItem.appendChild(radio)
      shiftContainer.appendChild(shiftItem)
      document.getElementById(shift["SHIFT_ID"]).addEventListener("click", function () {
        let employeeSearchElement = document.getElementById(employeeSearchId)
        employeeSearchElement.dataset.shiftTime = textValue
        radio.style.backgroundColor = "#007BFF"
        radio.style.color = "#fff"
      })
    })
  } else {
    shiftContainer.textContent = "No shifts found. Enter shift details below:"
  }
}

function selectReason(button) {
  const reasonButtons = document.querySelectorAll(".reason-button")

  reasonButtons.forEach((btn) => btn.classList.remove("selected"))

  button.classList.add("selected")

  document.getElementById("reason").value = button.innerText.trim().split('\n')[0] // Get just the reason text

  const points = button.getAttribute("points")
  if (points !== null) {
    // Update the editable points input
    document.getElementById("points-input").value = points
  }
}

// Function to adjust points using +/- buttons
function adjustPoints(delta) {
  const pointsInput = document.getElementById("points-input")
  let currentValue = parseInt(pointsInput.value) || 0
  let newValue = currentValue + delta
  
  // Enforce min/max constraints
  if (newValue < 0) newValue = 0
  if (newValue > 10) newValue = 10
  
  pointsInput.value = newValue
}

// Modal functions
function openConfirmationModal() {
  const modal = document.getElementById("confirmation-modal")
  modal.classList.add("active")
  modal.setAttribute("aria-hidden", "false")
  document.body.style.overflow = "hidden" // Prevent background scroll
}

function closeConfirmationModal() {
  const modal = document.getElementById("confirmation-modal")
  modal.classList.remove("active")
  modal.setAttribute("aria-hidden", "true")
  document.body.style.overflow = "" // Restore scroll
}

// Global variable to store form data for submission
let pendingFormData = null

async function handleSubmit() {
  const isServerHealthy = await isHealthy()
  let points = parseInt(document.getElementById("points-input").value) || 0
  const employee = document.getElementById(employeeSearchId)

  // Validation
  if (!employee.value) {
    alert("Please select an employee")
    return
  }

  let employeeId = employee.dataset.employeeId
  if (!employeeId) {
    let employeeIdInput = document.getElementById("employee-id")
    if (isServerHealthy && !employeeIdInput.value) {
      alert("Please enter an employee ID")
      return
    }
    employeeId = employeeIdInput.value
  }

  const shiftDate = document.getElementById("shift-date").value
  if (!shiftDate) {
    alert("Please select a shift date")
    return
  }

  selectedShift = document.getElementById("manual-shift").value
    ? document.getElementById("manual-shift").value
    : selectedShift
  if (!selectedShift) {
    alert("Please select a shift or enter manual shift details")
    return
  }

  const reason = document.getElementById("reason").value
  if (!reason) {
    alert("Please select a reason for points")
    return
  }

  // Prepare form data
  let formData = {
    employeeName: employee.value,
    employeeId: employeeId,
    shiftDate: shiftDate,
    selectedShift,
    reason: reason,
    comments: document.getElementById("comments").value,
    email: employee.dataset.emails,
    points: points,
  }

  if (!isServerHealthy) {
    const accessCodeElem = document.getElementById("access-code")
    if (!accessCodeElem.value) {
      alert("Please enter an access code")
      return
    }
    formData.accessCode = accessCodeElem.value
  }

  // Store form data and show confirmation modal
  pendingFormData = formData
  showConfirmationModal(formData)
}

function showConfirmationModal(formData) {
  // Populate modal with form data
  document.getElementById("confirm-employee").textContent = formData.employeeName
  document.getElementById("confirm-date").textContent = new Date(formData.shiftDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  document.getElementById("confirm-shift").textContent = formData.selectedShift
  document.getElementById("confirm-reason").textContent = formData.reason
  document.getElementById("confirm-points").textContent = `${formData.points} ${formData.points === 1 ? 'point' : 'points'}`
  
  const commentsRow = document.getElementById("confirm-comments-row")
  if (formData.comments && formData.comments.trim()) {
    document.getElementById("confirm-comments").textContent = formData.comments
    commentsRow.style.display = "flex"
  } else {
    commentsRow.style.display = "none"
  }

  openConfirmationModal()
}

async function confirmSubmit() {
  if (!pendingFormData) {
    alert("No form data to submit")
    return
  }

  closeConfirmationModal()
  
  const isServerHealthy = await isHealthy()
  const submitButton = document.getElementById("form-submit")
  submitButton.classList.add("loading")
  submitButton.disabled = true

  try {
    if (isServerHealthy) {
      const response = await apiCallPost(`${BASE_URL}/workon/incr`, JSON.stringify(pendingFormData))
      if (!response.ok) {
        kickOut(response.status)
      }
      if (response.ok) {
        alert("✅ Submission successful!")
        // Reset form
        document.getElementById("points-form").reset()
        document.getElementById("points-input").value = "0"
        selectedShift = null
        pendingFormData = null
        
        // Clear selected reason
        document.querySelectorAll(".reason-button").forEach(btn => btn.classList.remove("selected"))
      } else {
        console.error("Submission failed:", response.statusText)
      }
    } else {
      const payload = {
        content: "```json\n" + `${JSON.stringify(pendingFormData, null, 2)}` + "```",
        username: "Bun from Stacks",
        avatar_url: "https://www.bun.co.th/uploads/logo/bun.png",
      }

      const response = await fetch(WH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        alert("✅ Submission successful!")
        // Reset form
        document.getElementById("points-form").reset()
        document.getElementById("points-input").value = "0"
        selectedShift = null
        pendingFormData = null
        
        // Clear selected reason
        document.querySelectorAll(".reason-button").forEach(btn => btn.classList.remove("selected"))
      } else {
        console.error("Submission failed:", response.statusText)
      }
    }
  } catch (error) {
    console.error("Error submitting form:", error)
    alert("❌ Error submitting form. Please try again.")
  } finally {
    submitButton.classList.remove("loading")
    submitButton.disabled = false
  }
}

// TODO: drop this
document.addEventListener("DOMContentLoaded", async function () {
  document.getElementById("points-form").reset()
  document.getElementById("form-content").style.display = "block"
  const isServerHealthy = await isHealthy()
  if (!isServerHealthy) {
    const accessCodeDiv = document.getElementById("access-code-id-container")
    accessCodeDiv.hidden = false
  }
  await searchEmployee(isServerHealthy)
  
  // Keyboard accessibility: Close modal on ESC key
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" || event.key === "Esc") {
      const modal = document.getElementById("confirmation-modal")
      if (modal.classList.contains("active")) {
        closeConfirmationModal()
      }
    }
  })
})
