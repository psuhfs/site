/**
 * PostHog Analytics Integration Examples
 * 
 * These are ready-to-use examples for tracking specific features
 * in StockOn and WorkOn applications.
 */

// ============================================
// STOCKON TRACKING EXAMPLES
// ============================================

// Track product search
function trackProductSearch(searchQuery, filters, resultsCount) {
  Analytics.trackSearch(searchQuery, resultsCount, {
    filters_applied: filters,
    page: 'stockon',
    has_filters: Object.keys(filters).length > 0
  });
}

// Track location filter changes
function trackLocationFilter(location) {
  Analytics.trackFilter('location', location, {
    page: 'stockon'
  });
}

// Track category filter
function trackCategoryFilter(category) {
  Analytics.trackFilter('category', category, {
    page: 'stockon'
  });
}

// Track product view
function trackProductView(productId, productName, location) {
  posthog.capture('product_viewed', {
    product_id: productId,
    product_name: productName,
    location: location,
    page: 'stockon',
    timestamp: new Date().toISOString()
  });
}

// Track order placement
function trackOrderPlaced(orderId, products, totalItems, locations) {
  posthog.capture('order_placed', {
    order_id: orderId,
    product_count: products.length,
    total_items: totalItems,
    locations: locations,
    timestamp: new Date().toISOString()
  });
  
  // Also track each product in the order
  products.forEach(product => {
    posthog.capture('product_ordered', {
      order_id: orderId,
      product_id: product.id,
      product_name: product.name,
      quantity: product.quantity,
      location: product.location
    });
  });
}

// Track cart actions
function trackAddToCart(productId, productName, quantity, location) {
  posthog.capture('add_to_cart', {
    product_id: productId,
    product_name: productName,
    quantity: quantity,
    location: location,
    timestamp: new Date().toISOString()
  });
}

function trackRemoveFromCart(productId, productName) {
  posthog.capture('remove_from_cart', {
    product_id: productId,
    product_name: productName,
    timestamp: new Date().toISOString()
  });
}

function trackCartViewed(itemCount, totalQuantity) {
  posthog.capture('cart_viewed', {
    item_count: itemCount,
    total_quantity: totalQuantity,
    timestamp: new Date().toISOString()
  });
}

// Track inventory alerts
function trackLowStockAlert(productId, productName, currentStock, location) {
  posthog.capture('low_stock_alert', {
    product_id: productId,
    product_name: productName,
    current_stock: currentStock,
    location: location,
    severity: currentStock === 0 ? 'critical' : 'warning',
    timestamp: new Date().toISOString()
  });
}

// ============================================
// WORKON TRACKING EXAMPLES
// ============================================

// Track employee search
function trackEmployeeSearch(searchQuery, resultsCount) {
  Analytics.trackSearch(searchQuery, resultsCount, {
    page: 'workon',
    search_type: 'employee'
  });
}

// Track points assignment
function trackPointsAssigned(employeeId, employeeName, pointsValue, reason, category) {
  posthog.capture('points_assigned', {
    employee_id: employeeId,
    employee_name: employeeName,
    points_value: pointsValue,
    reason: reason,
    category: category,
    assigned_by: getToken(), // Current user token
    timestamp: new Date().toISOString()
  });
}

// Track points removal
function trackPointsRemoved(employeeId, employeeName, pointsValue, reason) {
  posthog.capture('points_removed', {
    employee_id: employeeId,
    employee_name: employeeName,
    points_value: pointsValue,
    reason: reason,
    removed_by: getToken(),
    timestamp: new Date().toISOString()
  });
}

// Track employee profile view
function trackEmployeeProfileView(employeeId, employeeName, currentPoints) {
  posthog.capture('employee_profile_viewed', {
    employee_id: employeeId,
    employee_name: employeeName,
    current_points: currentPoints,
    timestamp: new Date().toISOString()
  });
}

// Track shift management
function trackShiftAssigned(employeeId, shiftDate, shiftTime) {
  posthog.capture('shift_assigned', {
    employee_id: employeeId,
    shift_date: shiftDate,
    shift_time: shiftTime,
    assigned_by: getToken(),
    timestamp: new Date().toISOString()
  });
}

// Track attendance marking
function trackAttendanceMarked(employeeId, attendanceStatus, date) {
  posthog.capture('attendance_marked', {
    employee_id: employeeId,
    status: attendanceStatus, // present, absent, late
    date: date,
    marked_by: getToken(),
    timestamp: new Date().toISOString()
  });
}

// Track points threshold alerts
function trackPointsThresholdAlert(employeeId, employeeName, currentPoints, threshold) {
  posthog.capture('points_threshold_alert', {
    employee_id: employeeId,
    employee_name: employeeName,
    current_points: currentPoints,
    threshold: threshold,
    severity: currentPoints >= threshold ? 'critical' : 'warning',
    timestamp: new Date().toISOString()
  });
}

// Track filter usage in WorkOn
function trackWorkOnFilter(filterType, filterValue) {
  Analytics.trackFilter(filterType, filterValue, {
    page: 'workon'
  });
}

// ============================================
// GENERAL TRACKING EXAMPLES
// ============================================

// Track page load performance
function trackPageLoadPerformance() {
  window.addEventListener('load', () => {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    posthog.capture('page_load_performance', {
      page: window.location.pathname,
      load_time_ms: pageLoadTime,
      dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      timestamp: new Date().toISOString()
    });
  });
}

// Track API call performance
async function trackApiCall(endpoint, method) {
  const startTime = Date.now();
  let success = false;
  let statusCode = null;
  
  try {
    const response = await fetch(endpoint, { method });
    statusCode = response.status;
    success = response.ok;
    return response;
  } catch (error) {
    Analytics.trackError('api_call_failed', error.message, {
      endpoint: endpoint,
      method: method
    });
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    posthog.capture('api_call', {
      endpoint: endpoint,
      method: method,
      duration_ms: duration,
      success: success,
      status_code: statusCode,
      timestamp: new Date().toISOString()
    });
  }
}

// Track navigation patterns
function setupNavigationTracking() {
  const currentPage = window.location.pathname;
  
  // Track all internal links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.href.startsWith(window.location.origin)) {
      Analytics.trackNavigation(currentPage, new URL(link.href).pathname, {
        link_text: link.textContent.trim(),
        link_class: link.className
      });
    }
  });
}

// Track user engagement metrics
function trackUserEngagement() {
  let clickCount = 0;
  let keyPressCount = 0;
  let scrollDepth = 0;
  
  document.addEventListener('click', () => clickCount++);
  document.addEventListener('keypress', () => keyPressCount++);
  
  window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const currentScrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
    
    if (currentScrollDepth > scrollDepth) {
      scrollDepth = currentScrollDepth;
    }
  });
  
  // Send engagement data when user leaves
  window.addEventListener('beforeunload', () => {
    posthog.capture('user_engagement', {
      page: window.location.pathname,
      clicks: clickCount,
      key_presses: keyPressCount,
      scroll_depth_percent: scrollDepth,
      timestamp: new Date().toISOString()
    });
  });
}

// ============================================
// INITIALIZATION
// ============================================

// Call this on page load to enable automatic tracking
function initializeAdvancedTracking() {
  trackPageLoadPerformance();
  setupNavigationTracking();
  trackUserEngagement();
}

// Add to your DOMContentLoaded event
// document.addEventListener('DOMContentLoaded', initializeAdvancedTracking);
