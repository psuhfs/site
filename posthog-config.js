// PostHog Analytics Configuration and Helper Functions
// Centralized analytics tracking for the PSU HFS application

// Initialize PostHog with error handling
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

try {
    posthog.init('phc_kGr6PiJK9VC8gxE40n2G4t1paoZcNvYibpaASJMldvQ', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        session_recording: {
            recordCrossOriginIframes: true,
        },
        loaded: function(posthog) {
            console.log('✅ PostHog loaded successfully');
        },
        // Add error handling for script load failures
        on_xhr_error: function(error) {
            console.warn('PostHog XHR error (non-critical):', error);
        }
    });
} catch (error) {
    console.warn('PostHog initialization error (analytics will continue with fallback):', error);
}

// Analytics Helper Functions
const Analytics = {
    // Helper to safely call PostHog methods
    _safeCall: function(fn) {
        try {
            if (window.posthog && typeof window.posthog.capture === 'function') {
                return fn();
            } else {
                console.debug('PostHog not available, skipping analytics call');
                return null;
            }
        } catch (error) {
            console.debug('Analytics error (non-critical):', error);
            return null;
        }
    },

    // Track page view with additional context
    pageView: function(pageName, properties = {}) {
        return this._safeCall(() => {
            const defaultProps = {
                page_name: pageName,
                page_url: window.location.href,
                page_path: window.location.pathname,
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            };
            posthog.capture('$pageview', { ...defaultProps, ...properties });
        });
    },

    // Track button clicks
    trackClick: function(elementName, properties = {}) {
        return this._safeCall(() => {
            posthog.capture('button_clicked', {
                element_name: elementName,
                page: window.location.pathname,
                timestamp: new Date().toISOString(),
                ...properties
            });
        });
    },

    // Track navigation events
    trackNavigation: function(from, to, properties = {}) {
        return this._safeCall(() => {
            posthog.capture('navigation', {
                from_page: from,
                to_page: to,
                timestamp: new Date().toISOString(),
                ...properties
            });
        });
    },

    // Track form submissions
    trackFormSubmit: function(formName, success = true, properties = {}) {
        return this._safeCall(() => {
            posthog.capture('form_submitted', {
                form_name: formName,
                success: success,
                page: window.location.pathname,
                timestamp: new Date().toISOString(),
                ...properties
            });
        });
    },

    // Track user login
    identifyUser: function(userId, userProperties = {}) {
        return this._safeCall(() => {
            posthog.identify(userId, {
                ...userProperties,
                first_seen: new Date().toISOString()
            });
            posthog.capture('user_logged_in', {
                user_id: userId,
                timestamp: new Date().toISOString()
            });
        });
    },

    // Track user logout
    trackLogout: function() {
        return this._safeCall(() => {
            posthog.capture('user_logged_out', {
                timestamp: new Date().toISOString()
            });
            posthog.reset();
        });
    },

    // Track errors
    trackError: function(errorType, errorMessage, properties = {}) {
        return this._safeCall(() => {
            posthog.capture('error_occurred', {
                error_type: errorType,
                error_message: errorMessage,
                page: window.location.pathname,
                timestamp: new Date().toISOString(),
                ...properties
            });
        });
    },

    // Track modal interactions
    trackModal: function(action, modalName, properties = {}) {
        return this._safeCall(() => {
            posthog.capture('modal_interaction', {
                action: action, // 'open', 'close', 'submit'
                modal_name: modalName,
                page: window.location.pathname,
                timestamp: new Date().toISOString(),
                ...properties
            });
        });
    },

    // Track search actions
    trackSearch: function(searchTerm, resultsCount, properties = {}) {
        return this._safeCall(() => {
            posthog.capture('search_performed', {
                search_term: searchTerm,
                results_count: resultsCount,
                page: window.location.pathname,
                timestamp: new Date().toISOString(),
                ...properties
            });
        });
    },

    // Track filter usage
    trackFilter: function(filterType, filterValue, properties = {}) {
        return this._safeCall(() => {
            posthog.capture('filter_applied', {
                filter_type: filterType,
                filter_value: filterValue,
                page: window.location.pathname,
                timestamp: new Date().toISOString(),
                ...properties
            });
        });
    },

    // Track time on page (call this on page load)
    trackTimeOnPage: function() {
        const startTime = Date.now();
        
        // Track time when user leaves
        window.addEventListener('beforeunload', () => {
            this._safeCall(() => {
                const timeSpent = Math.round((Date.now() - startTime) / 1000); // in seconds
                posthog.capture('time_on_page', {
                    page: window.location.pathname,
                    time_spent_seconds: timeSpent,
                    timestamp: new Date().toISOString()
                });
            });
        });

        // Also track at intervals for long sessions
        let interval = setInterval(() => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            if (timeSpent % 60 === 0) { // Every minute
                this._safeCall(() => {
                    posthog.capture('time_milestone', {
                        page: window.location.pathname,
                        time_spent_seconds: timeSpent,
                        timestamp: new Date().toISOString()
                    });
                });
            }
        }, 60000); // Check every minute

        // Clean up interval on page unload
        window.addEventListener('beforeunload', function() {
            clearInterval(interval);
        });
    },

    // Track theme changes
    trackThemeChange: function(newTheme) {
        return this._safeCall(() => {
            posthog.capture('theme_changed', {
                theme: newTheme,
                page: window.location.pathname,
                timestamp: new Date().toISOString()
            });
        });
    },

    // Track feature usage
    trackFeatureUsage: function(featureName, properties = {}) {
        return this._safeCall(() => {
            posthog.capture('feature_used', {
                feature_name: featureName,
                page: window.location.pathname,
                timestamp: new Date().toISOString(),
                ...properties
            });
        });
    },

    // Set user properties (for after authentication)
    setUserProperties: function(properties) {
        return this._safeCall(() => {
            posthog.people.set(properties);
        });
    },

    // Track card clicks on dashboard
    trackCardClick: function(cardName) {
        return this._safeCall(() => {
            posthog.capture('dashboard_card_clicked', {
                card_name: cardName,
                timestamp: new Date().toISOString()
            });
        });
    }
};

// Auto-track time on page for all pages
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        Analytics.trackTimeOnPage();
    });
} else {
    Analytics.trackTimeOnPage();
}

// Make Analytics globally available
window.Analytics = Analytics;
