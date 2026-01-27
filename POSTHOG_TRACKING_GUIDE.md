# PostHog Analytics Tracking Guide

## Overview
PostHog has been successfully integrated across the entire PSU HFS application. This guide explains what's being tracked and how to add additional tracking.

## What's Already Being Tracked

### Automatic Tracking (Built-in)
- **Page Views**: Every page visit is automatically captured
- **Page Leave**: When users leave a page
- **Autocapture**: Clicks, form submissions, and other interactions
- **Session Recording**: Full user session replays (optional to review)

### Custom Events Implemented

#### 1. **User Authentication**
- `user_logged_in` - When user successfully logs in
- `user_logged_out` - When user logs out
- User identification with username and properties

#### 2. **Form Interactions**
- `form_submitted` - Tracks form name, success/failure, and metadata
  - Login form submissions
  - Signup form submissions
  - Success/failure status
  - Error messages when forms fail

#### 3. **Button Clicks**
- `button_clicked` - Generic button tracking
- `dashboard_card_clicked` - Dashboard card selections (StockOn, WorkOn)
- `password_visibility_toggle` - Password show/hide toggles
- `create_another_account` - Creating multiple accounts

#### 4. **Modal Interactions**
- `modal_interaction` - Tracks open/close actions
  - Signup modal
  - Success modal

#### 5. **Theme Changes**
- `theme_changed` - When users switch between light/dark mode

#### 6. **Time Tracking**
- `time_on_page` - Total time spent on each page (tracked on page leave)
- `time_milestone` - Milestone tracking every 60 seconds for long sessions

#### 7. **Error Tracking**
- `error_occurred` - All application errors with context
  - Validation errors
  - API errors
  - Login/signup errors

## How to Add Custom Tracking

### Available Helper Functions

The `Analytics` object (from `posthog-config.js`) provides these methods:

```javascript
// Track page views
Analytics.pageView('PageName', { custom_property: 'value' });

// Track button clicks
Analytics.trackClick('button_name', { additional: 'data' });

// Track navigation
Analytics.trackNavigation('/from-page', '/to-page');

// Track form submissions
Analytics.trackFormSubmit('form_name', true, { username: 'user' });

// Identify users (call after login)
Analytics.identifyUser('userId', { email: 'user@example.com' });

// Track logout
Analytics.trackLogout();

// Track errors
Analytics.trackError('error_type', 'error message', { context: 'data' });

// Track modals
Analytics.trackModal('open', 'modal_name');
Analytics.trackModal('close', 'modal_name');

// Track search
Analytics.trackSearch('search term', resultsCount);

// Track filters
Analytics.trackFilter('filter_type', 'filter_value');

// Track theme changes
Analytics.trackThemeChange('dark');

// Track feature usage
Analytics.trackFeatureUsage('feature_name', { usage: 'context' });

// Track dashboard cards
Analytics.trackCardClick('CardName');

// Set user properties
Analytics.setUserProperties({ role: 'admin' });
```

### Example: Adding Search Tracking

```javascript
// In your search function
function performSearch(query) {
  const results = searchDatabase(query);
  
  // Track the search
  Analytics.trackSearch(query, results.length, {
    page: 'inventory',
    search_type: 'product_name'
  });
  
  return results;
}
```

### Example: Tracking Product Orders

```javascript
// Track when user places an order
function placeOrder(orderId, items) {
  posthog.capture('order_placed', {
    order_id: orderId,
    item_count: items.length,
    total_value: calculateTotal(items),
    timestamp: new Date().toISOString()
  });
}
```

### Example: Tracking Filter Usage

```javascript
// When user applies a location filter
document.getElementById('locationFilter').addEventListener('change', (e) => {
  Analytics.trackFilter('location', e.target.value);
});
```

## Best Practices

### 1. **Be Specific with Event Names**
- ✅ Good: `inventory_search_performed`
- ❌ Bad: `search`

### 2. **Include Context**
Always add relevant properties to events:
```javascript
Analytics.trackClick('add_to_cart', {
  product_id: '123',
  product_name: 'Widget',
  price: 29.99,
  category: 'tools'
});
```

### 3. **Track User Journeys**
Track navigation to understand user flows:
```javascript
// When navigating from dashboard to StockOn
Analytics.trackNavigation('/dashboard', '/stockon', {
  trigger: 'card_click',
  session_time: getSessionTime()
});
```

### 4. **Track Errors with Context**
```javascript
try {
  await apiCall();
} catch (error) {
  Analytics.trackError('api_call_failed', error.message, {
    endpoint: '/api/products',
    status_code: error.status,
    user_action: 'loading_inventory'
  });
}
```

### 5. **Set User Properties After Login**
```javascript
// After successful login
Analytics.identifyUser(userId, {
  username: username,
  email: email,
  role: userRole,
  department: userDept,
  first_login: new Date().toISOString()
});
```

## Viewing Analytics in PostHog

1. **Log into PostHog**: https://us.i.posthog.com
2. **Events Tab**: See all captured events
3. **Session Recordings**: Watch user sessions
4. **Insights**: Create custom dashboards and funnels
5. **Funnels**: Track conversion paths (e.g., Login → Dashboard → StockOn → Order)

## Common Use Cases

### Track Inventory Actions
```javascript
// When user views a product
posthog.capture('product_viewed', {
  product_id: productId,
  product_name: productName,
  location: location
});

// When user adds to cart
posthog.capture('item_added_to_cart', {
  product_id: productId,
  quantity: quantity,
  location: location
});
```

### Track Employee Management
```javascript
// When points are assigned
posthog.capture('points_assigned', {
  employee_id: employeeId,
  points_value: pointsValue,
  reason: reason,
  assigned_by: currentUserId
});
```

### Track Performance Metrics
```javascript
// API response times
posthog.capture('api_performance', {
  endpoint: '/api/products',
  response_time_ms: responseTime,
  success: true
});
```

## Privacy Considerations

PostHog is configured with:
- `person_profiles: 'identified_only'` - Only tracks identified users
- No automatic PII collection
- Session recordings can be disabled per user preference

## Troubleshooting

### Events Not Appearing
1. Check browser console for PostHog errors
2. Verify `posthog-config.js` is loaded before other scripts
3. Check if ad blockers are interfering

### Duplicate Events
Make sure you're not calling tracking functions multiple times in event handlers that fire repeatedly.

### Testing Events
```javascript
// In browser console
posthog.capture('test_event', { test: true });
// Check PostHog dashboard for the event
```

## Next Steps

1. **Create Dashboards**: Set up custom dashboards in PostHog for key metrics
2. **Set Up Funnels**: Track user conversion paths
3. **Configure Alerts**: Get notified of unusual patterns or errors
4. **A/B Testing**: Use PostHog feature flags for experiments
5. **Cohort Analysis**: Group users by behavior patterns

## Support

For PostHog documentation: https://posthog.com/docs
For custom tracking needs, update `posthog-config.js` with new helper functions.
