# 🇮🇳 Smart Commute Planner

A modern, interactive web application for optimizing daily commutes across India using real-time traffic intelligence and advanced web APIs.

## 🚀 Live Demo

Open `index.html` in your browser or run a local server to view the application.

## 📋 Project Overview

This project demonstrates the implementation of **4 Web APIs** as required for the assignment:
- **Geolocation API** - Real-time location detection and tracking
- **Intersection Observer API** - Lazy loading for performance optimization
- **Network Information API** - Network monitoring and quality adjustment
- **Background Tasks API** - Idle time processing for better performance

## ✨ Features

### 🗺️ Interactive Map
- **Real-time mapping** using Leaflet.js and OpenStreetMap
- **Route visualization** with start/end markers
- **Click-to-add markers** for custom locations
- **Automatic centering** on India by default

### 🚗 Route Planning
- **Smart route generation** with multiple options (Highway, City, Scenic)
- **Realistic time calculations** based on Indian traffic patterns
- **Distance calculation** using Haversine formula
- **Traffic-aware routing** with real-time adjustments

### 📊 Analytics Dashboard
- **Average commute time** tracking
- **Time saved** calculations
- **Routes optimized** counter
- **Carbon footprint** savings

### 🎯 Smart Features
- **Current location detection** and auto-fill
- **Rush hour detection** (7-10 AM, 5-8 PM)
- **Metro city recognition** (Mumbai, Delhi, Bangalore, etc.)
- **Route saving** and management
- **Real-time status monitoring**

## 🛠️ Technologies Used

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Interactive functionality
- **Leaflet.js** - Interactive mapping library

### Web APIs
- **Geolocation API** - Location services
- **Intersection Observer API** - Performance optimization
- **Network Information API** - Network monitoring
- **Background Tasks API** - Idle processing

### External Services
- **OpenStreetMap** - Free map tiles
- **CDN Libraries** - Leaflet CSS/JS

## 📁 Project Structure

```
tap/
├── index.html          # Main HTML file
├── style.css           # CSS styles
├── script.js           # JavaScript functionality
└── README.md           # Project documentation
```

## 🚀 Installation & Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for map tiles and CDN resources)

### Quick Start
1. **Clone or download** the project files
2. **Open `index.html`** in your browser
3. **Allow location access** when prompted
4. **Start planning routes!**

### Local Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 📖 Usage Guide

### 1. Plan a Route
1. Enter **starting location** (e.g., "Mumbai")
2. Enter **destination** (e.g., "Delhi")
3. Select **departure time**
4. Choose **route preference**:
   - Fastest Route
   - Shortest Route
   - Scenic Route
   - Avoid Traffic
5. Click **"Plan Route"**

### 2. View on Map
- Routes are automatically plotted on the interactive map
- Click anywhere on the map to add custom markers
- Use current location by typing "current location"

### 3. Save Routes
- Click **"Save Route"** on any route option
- View saved routes in the sidebar
- Delete routes as needed

### 4. Monitor Analytics
- Track your commute statistics
- View time savings and carbon footprint
- Monitor route optimization progress

## 🗺️ Supported Cities

### Major Indian Cities
- **Metro Cities**: Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune
- **State Capitals**: Jaipur, Lucknow, Patna, Bhopal, Chandigarh, Guwahati
- **Major Cities**: Surat, Kanpur, Nagpur, Indore, Thane, Vadodara
- **Tourist Destinations**: Agra, Varanasi, Shimla, Srinagar

### International Cities
- Major US cities (New York, Los Angeles, Chicago, etc.)
- Global support for international users

## ⚡ Performance Features

### Lazy Loading
- Map loads only when scrolled into view
- Intersection Observer API for optimal performance

### Network Optimization
- Real-time network quality monitoring
- Adaptive loading based on connection speed

### Background Processing
- Idle time utilization for route calculations
- Non-blocking UI operations

## 🎯 Assignment Requirements

### ✅ Web APIs Implementation

1. **Geolocation API**
   - `navigator.geolocation.getCurrentPosition()`
   - `navigator.geolocation.watchPosition()`
   - Real-time location tracking
   - Current location auto-fill

2. **Intersection Observer API**
   - `new IntersectionObserver()`
   - Lazy loading for map content
   - Performance optimization
   - Status monitoring

3. **Network Information API**
   - `navigator.connection`
   - Network quality monitoring
   - Real-time status updates
   - Connection type detection

4. **Background Tasks API**
   - `requestIdleCallback()`
   - Idle time processing
   - Performance optimization
   - Non-blocking operations

### ✅ Real-Life Problem Solved
**Daily Commute Planning** - A common problem faced by millions of Indians daily, solved with:
- Route optimization
- Traffic intelligence
- Time savings
- Carbon footprint reduction

## 🔧 Customization

### Adding New Cities
Edit the `getCoordinatesFromAddress()` function in `script.js`:
```javascript
const mockCoordinates = {
  'your-city': [latitude, longitude],
  // Add more cities here
};
```

### Modifying Route Types
Update the `baseSpeeds` object in `calculateEstimatedTime()`:
```javascript
const baseSpeeds = {
  'YourRouteType': speed_in_kmh,
  // Add custom route types
};
```

### Styling Changes
Modify `style.css` for:
- Color schemes
- Layout adjustments
- Responsive design
- Animations

## 🐛 Troubleshooting

### Common Issues

1. **Map not loading**
   - Check internet connection
   - Allow location permissions
   - Refresh the page

2. **Location not working**
   - Enable location services in browser
   - Check HTTPS requirement (for some browsers)
   - Clear browser cache

3. **Routes not generating**
   - Ensure both start and end locations are entered
   - Check for valid city names
   - Verify departure time is set

## 📱 Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ⚠️ Internet Explorer (Limited support)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is created for educational purposes as part of a web development assignment.

## 👨‍💻 Author

**Sameer Suryawanshi**
- Created: 2025
- Project: Smart Commute Planner
- Technologies: HTML5, CSS3, JavaScript, Web APIs

## 🙏 Acknowledgments

- **OpenStreetMap** for free map tiles
- **Leaflet.js** for interactive mapping
- **MDN Web Docs** for API documentation
- **Indian Cities Database** for geographic coordinates

---

**Made with ❤️ for India's commuters** 