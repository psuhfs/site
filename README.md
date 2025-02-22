# Enterprise Resource Management System

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Modules](#core-modules)
4. [Technical Stack](#technical-stack)
5. [Authentication System](#authentication-system)
6. [API Integration](#api-integration)
7. [Module Documentation](#module-documentation)
8. [Development Setup](#development-setup)

## Overview

This is a comprehensive Enterprise Resource Management System implemented as a web application. The system provides functionalities for stock management, points tracking, user authentication, and dashboard management. It's built using a modern web stack with a focus on security and scalability.

## System Architecture

The application follows a modular architecture with the following key components:

```
site/
├── dashboard/          # Central dashboard module
├── login/             # Authentication module
├── signup/            # User registration module
├── static/            # Static assets and schemas
├── stockon/           # Stock management system
├── workon/            # Points tracking system
└── utils.js           # Shared utilities
```

## Core Modules

### 1. Dashboard (`/dashboard`)
- Modern UI implementation with glass morphism effects
- Centralized navigation hub
- Responsive design with mobile optimization
- Integration points for Stock Management and Points System

### 2. Stock Management (`/stockon`)
- Comprehensive inventory tracking system
- Category-based organization
- Integration with backend API
- Real-time stock updates
- Structured data schema for categories

### 3. Points System (`/workon`)
- Points tracking and management
- User progress monitoring
- Custom JavaScript implementation
- Modular architecture with separate JS and styles

### 4. Authentication System (`/login`, `/signup`)
- Secure token-based authentication
- Cross-origin request handling
- Session management
- Secure cookie implementation

## Technical Stack

### Frontend
- Pure JavaScript (No framework dependencies)
- Modern CSS3 with Flexbox/Grid
- HTML5 Semantic Elements
- Responsive Design Principles

### API Integration
- RESTful API consumption
- Token-based authentication
- Cross-origin resource sharing (CORS) support
- Base URL: https://api.ssdd.dev

### Data Management
- JSON-based data schemas
- Structured category management
- Hierarchical data organization

## Authentication System

The authentication system implements several security features:

```javascript
// Token Management
function setToken(token) {
    document.cookie = `token=${token}; Path=/; SameSite=None; Secure`
}

function getToken() {
    return document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]
}
```

### Security Features
- Secure cookie attributes
- CORS compliance
- SameSite cookie policy
- HTTPS enforcement

## API Integration

### Utility Functions

```javascript
async function apiCallPost(url, body) {
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`,
        },
        credentials: "include",
        body,
    })
}

async function apiCallGet(url) {
    return fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`,
        },
        credentials: "include",
    })
}
```

## Module Documentation

### Stock Management Schema
The system uses a hierarchical category schema for organization:

```json
{
    "location": {
        "areas": [
            {
                "name": "Section",
                "info": {
                    "Category": {
                        "item_id": "string",
                        "name": "string",
                        "unit_sz": "string"
                    }
                }
            }
        ]
    }
}
```

### Navigation System
Advanced navigation handling with query parameter preservation:

```javascript
function navigateWithQueries(path, newParams = {}) {
    const currentParams = new URLSearchParams(window.location.search)
    Object.entries(newParams).forEach(([key, value]) => {
        currentParams.set(key, value)
    })
    const queryString = currentParams.toString()
    window.location.href = path + (queryString ? `?${queryString}` : "")
}
```

## Development Setup

### Prerequisites
1. Modern web browser with JavaScript enabled
2. Access to the backend API (https://api.ssdd.dev)
3. Development server for local testing

### Local Development
1. Clone the repository
2. Set up a local web server
3. Configure CORS settings if needed
4. Update API base URL if required

### Code Quality
- Linting support via `lint.sh`
- Consistent code formatting
- Modern JavaScript practices
- Cross-browser compatibility

## Security Considerations

1. **Authentication**
   - Secure token storage
   - HTTPS enforcement
   - Protected API endpoints

2. **Data Security**
   - Input validation
   - XSS prevention
   - CSRF protection

3. **API Security**
   - Token-based authentication
   - Secure headers
   - Rate limiting support

## Best Practices

1. **Code Organization**
   - Modular structure
   - Separation of concerns
   - Utility function reuse
   - Consistent naming conventions

2. **Performance**
   - Minimal dependencies
   - Optimized asset loading
   - Efficient DOM manipulation
   - Caching strategies

3. **Maintainability**
   - Clear documentation
   - Consistent code style
   - Modular architecture
   - Reusable components

## Future Enhancements

1. **Technical Improvements**
   - Progressive Web App support
   - Enhanced offline capabilities
   - Performance optimization
   - Advanced caching strategies

2. **Feature Additions**
   - Advanced analytics
   - Real-time updates
   - Enhanced reporting
   - Mobile optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Follow coding standards
5. Include appropriate documentation

## License

Proprietary software. All rights reserved.