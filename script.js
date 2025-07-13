
(function SmartCommuteApp() {
  let currentLocation = null;
  let routes = [];
  let savedRoutes = JSON.parse(localStorage.getItem('savedRoutes')) || [];
  let analytics = JSON.parse(localStorage.getItem('analytics')) || {
    avgTime: 0,
    timeSaved: 0,
    routesOptimized: 0,
    carbonSaved: 0
  };

  let networkInfo = null;
  let intersectionObserver = null;
  let map = null;
  let mapMarkers = [];
  let routePolylines = [];

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('beforeunload', destroy);

  function init() {
    setupEventListeners();
    initializeAPIs();
    loadSavedRoutes();
    updateAnalytics();
    setDefaultDepartureTime();
  }

  function setupEventListeners() {
    document.getElementById('routeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      planRoute();
    });

    document.getElementById('startLocation').addEventListener('input', (e) => {
      if (e.target.value.toLowerCase() === 'current location') {
        useCurrentLocation('start');
      }
    });

    document.getElementById('endLocation').addEventListener('input', (e) => {
      if (e.target.value.toLowerCase() === 'current location') {
        useCurrentLocation('end');
      }
    });
  }

  function initializeAPIs() {
    initGeolocation();
    initNetworkInfo();
    initIntersectionObserver();
    initBackgroundTasks();
  }

  function initGeolocation() {
    if ('geolocation' in navigator) {
      updateStatus('locationStatus', 'Requesting permission...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          updateStatus('locationStatus', 'Located ✓');
          showNotification('Location access granted', 'success');
          
         
          if (map) {
            map.setView([currentLocation.lat, currentLocation.lng], 13);
            addCurrentLocationMarker();
          }
        },
        () => {
          updateStatus('locationStatus', 'Denied');
          showNotification('Location access denied', 'error');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000,
        }
      );

      navigator.geolocation.watchPosition((position) => {
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
    
        if (map) {
          addCurrentLocationMarker();
        }
      });
    } else {
      updateStatus('locationStatus', 'Not supported');
    }
  }

  function initNetworkInfo() {
    if ('connection' in navigator) {
      networkInfo = navigator.connection;
      updateNetworkStatus();
      networkInfo.addEventListener('change', updateNetworkStatus);
    } else {
      updateStatus('networkStatus', 'Not supported');
    }
  }

  function updateNetworkStatus() {
    if (networkInfo) {
      const { effectiveType, downlink } = networkInfo;
      updateStatus('networkStatus', `${effectiveType} (${downlink}Mbps)`);
    }
  }

  function initIntersectionObserver() {
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          lazyLoadMapContent(entry.target);
        }
      });
    }, { root: null, threshold: 0.1 });

    const mapContainer = document.getElementById('mapContainer');
    intersectionObserver.observe(mapContainer);
    updateStatus('observerStatus', 'Watching');
  }

  function lazyLoadMapContent(target) {
    if (target.id === 'mapContainer') {
      setTimeout(() => {
        initializeMap();
        updateStatus('observerStatus', 'Map loaded ✓');
      }, 1000);
    }
  }

  function initializeMap() {
    const mapContainer = document.getElementById('mapContainer');
    const placeholder = mapContainer.querySelector('.map-placeholder');
    
   
    placeholder.style.display = 'none';
    
    
    let mapDiv = mapContainer.querySelector('#map');
    if (!mapDiv) {
      mapDiv = document.createElement('div');
      mapDiv.id = 'map';
      mapDiv.style.width = '100%';
      mapDiv.style.height = '100%';
      mapContainer.appendChild(mapDiv);
    }

   
    map = L.map('map').setView([20.5937, 78.9629], 5); // Default to India center

   
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    
    if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 13);
      addCurrentLocationMarker();
    }

   
    map.on('click', onMapClick);
    
    showNotification('Interactive map loaded successfully!', 'success');
  }

  function addCurrentLocationMarker() {
    if (currentLocation && map) {
   
      mapMarkers.forEach(marker => {
        if (marker.isCurrentLocation) {
          map.removeLayer(marker);
        }
      });
      
      const currentMarker = L.marker([currentLocation.lat, currentLocation.lng])
        .addTo(map)
        .bindPopup('Your current location')
        .openPopup();
      
      currentMarker.isCurrentLocation = true;
      mapMarkers.push(currentMarker);
    }
  }

  function onMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    
    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    
    mapMarkers.push(marker);
  }

  function plotRoute(start, end) {
    if (!map) return;

    
    clearRoutes();

   
    const startCoords = getCoordinatesFromAddress(start);
    const endCoords = getCoordinatesFromAddress(end);
    
    if (startCoords && endCoords) {
      
      const startMarker = L.marker(startCoords)
        .addTo(map)
        .bindPopup(`Start: ${start}`);
      
      const endMarker = L.marker(endCoords)
        .addTo(map)
        .bindPopup(`End: ${end}`);
      
      mapMarkers.push(startMarker, endMarker);

     
      const routeLine = L.polyline([startCoords, endCoords], {
        color: '#667eea',
        weight: 4,
        opacity: 0.8
      }).addTo(map);
      
      routePolylines.push(routeLine);

  
      map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
    }
  }

  function getCoordinatesFromAddress(address) {
   
    const mockCoordinates = {
      // Major Indian Cities
      'mumbai': [19.0760, 72.8777],
      'delhi': [28.7041, 77.1025],
      'bangalore': [12.9716, 77.5946],
      'hyderabad': [17.3850, 78.4867],
      'chennai': [13.0827, 80.2707],
      'kolkata': [22.5726, 88.3639],
      'pune': [18.5204, 73.8567],
      'ahmedabad': [23.0225, 72.5714],
      'jaipur': [26.9124, 75.7873],
      'surat': [21.1702, 72.8311],
      'lucknow': [26.8467, 80.9462],
      'kanpur': [26.4499, 80.3319],
      'nagpur': [21.1458, 79.0882],
      'indore': [22.7196, 75.8577],
      'thane': [19.2183, 72.9781],
      'bhopal': [23.2599, 77.4126],
      'visakhapatnam': [17.6868, 83.2185],
      'patna': [25.5941, 85.1376],
      'vadodara': [22.3072, 73.1812],
      'ghaziabad': [28.6692, 77.4538],
      'ludhiana': [30.9010, 75.8573],
      'agra': [27.1767, 78.0081],
      'nashik': [19.9975, 73.7898],
      'faridabad': [28.4089, 77.3178],
      'meerut': [28.9845, 77.7064],
      'rajkot': [22.3039, 70.8022],
      'kalyan': [19.2433, 73.1355],
      'vasai': [19.4259, 72.8225],
      'vashi': [19.0760, 72.9986],
      'aurangabad': [19.8762, 75.3433],
      'noida': [28.5355, 77.3910],
      'solapur': [17.6599, 75.9064],
      'ranchi': [23.3441, 85.3096],
      'howrah': [22.5958, 88.2636],
      'coimbatore': [11.0168, 76.9558],
      'jabalpur': [23.1815, 79.9864],
      'gwalior': [26.2183, 78.1828],
      'vijayawada': [16.5062, 80.6480],
      'jodhpur': [26.2389, 73.0243],
      'madurai': [9.9252, 78.1198],
      'raipur': [21.2514, 81.6296],
      'kota': [25.2138, 75.8648],
      'guwahati': [26.1445, 91.7362],
      'chandigarh': [30.7333, 76.7794],
      'amritsar': [31.6340, 74.8723],
      'allahabad': [25.4358, 81.8463],
      'varanasi': [25.3176, 82.9739],
      'mysore': [12.2958, 76.6394],
      'bhubaneswar': [20.2961, 85.8245],
      'salem': [11.6643, 78.1460],
      'warangal': [17.9689, 79.5941],
      'guntur': [16.2991, 80.4575],
      'bhiwandi': [19.2969, 73.0629],
      'saharanpur': [29.9675, 77.5451],
      'gorakhpur': [26.7606, 83.3732],
      'bikaner': [28.0229, 73.3119],
      'amravati': [20.9374, 77.7796],
      'noida': [28.5355, 77.3910],
      'jamshedpur': [22.8046, 86.2029],
      'bhilai': [21.2094, 81.4285],
      'cuttack': [20.4625, 85.8830],
      'firozabad': [27.1591, 78.3958],
      'kochi': [9.9312, 76.2673],
      'nellore': [14.4426, 79.9865],
      'bhavnagar': [21.7645, 72.1519],
      'dehradun': [30.3165, 78.0322],
      'durgapur': [23.5204, 87.3119],
      'asansol': [23.6889, 86.9661],
      'rourkela': [22.2494, 84.8828],
      'nanded': [19.1383, 77.3210],
      'kolhapur': [16.7050, 74.2433],
      'ajmer': [26.4499, 74.6399],
      'akola': [20.7096, 77.0021],
      'gulbarga': [17.3297, 76.8343],
      'jamnagar': [22.4707, 70.0577],
      'udaipur': [24.5854, 73.7125],
      'maheshtala': [22.5086, 88.2532],
      'tiruchirappalli': [10.7905, 78.7047],
      'belgaum': [15.8497, 74.4977],
      'kurnool': [15.8281, 78.0373],
      'rajahmundry': [17.0005, 81.8040],
      'mangalore': [12.9716, 74.8631],
      'karnal': [29.6857, 76.9905],
      'tiruppur': [11.1085, 77.3411],
      'bathinda': [30.2110, 74.9455],
      'ratlam': [23.3343, 75.0376],
      'shivamogga': [13.9299, 75.5681],
      'rohtak': [28.8955, 76.6066],
      'korba': [22.3458, 82.6963],
      'bhilwara': [25.3463, 74.6364],
      'uzhavarkarai': [11.9416, 79.8083],
      'bellary': [15.1394, 76.9214],
      'mangalore': [12.9716, 74.8631],
      'tumkur': [13.3409, 77.1025],
      'gaya': [24.7914, 85.0002],
      'parbhani': [19.2686, 76.7708],
      'malegaon': [20.5609, 74.5250],
      'chapra': [25.7801, 84.7491],
      'jalna': [19.8413, 75.8860],
      'bhusawal': [21.0436, 75.7851],
      'ahmednagar': [19.0952, 74.7496],
      'aurangabad': [19.8762, 75.3433],
      'shimla': [31.1048, 77.1734],
      'srinagar': [34.0837, 74.7973],
      'gangtok': [27.3389, 88.6065],
      'itanagar': [27.0844, 93.6053],
      'kohima': [25.6751, 94.1086],
      'imphal': [24.8170, 93.9368],
      'aizawl': [23.7307, 92.7173],
      'agartala': [23.8315, 91.2868],
      'shillong': [25.5788, 91.8933],
      'dispur': [26.1433, 91.7898],
      'panaji': [15.2993, 74.1240],
      'port blair': [11.6234, 92.7265],
      'kavaratti': [10.5593, 72.6358],
      'daman': [20.3974, 72.8328],
      'diu': [20.7144, 70.9874],
      'silvassa': [20.2762, 72.9707],
      'leh': [34.1526, 77.5771],
      'kargil': [34.5571, 76.1260],
      'kargil': [34.5571, 76.1260],
      'leh': [34.1526, 77.5771],
      'silvassa': [20.2762, 72.9707],
      'diu': [20.7144, 70.9874],
      'daman': [20.3974, 72.8328],
      'kavaratti': [10.5593, 72.6358],
      'port blair': [11.6234, 92.7265],
      'panaji': [15.2993, 74.1240],
      'dispur': [26.1433, 91.7898],
      'shillong': [25.5788, 91.8933],
      'agartala': [23.8315, 91.2868],
      'aizawl': [23.7307, 92.7173],
      'imphal': [24.8170, 93.9368],
      'kohima': [25.6751, 94.1086],
      'itanagar': [27.0844, 93.6053],
      'gangtok': [27.3389, 88.6065],
      'srinagar': [34.0837, 74.7973],
      'shimla': [31.1048, 77.1734],
      'aurangabad': [19.8762, 75.3433],
      'ahmednagar': [19.0952, 74.7496],
      'bhusawal': [21.0436, 75.7851],
      'jalna': [19.8413, 75.8860],
      'chapra': [25.7801, 84.7491],
      'malegaon': [20.5609, 74.5250],
      'parbhani': [19.2686, 76.7708],
      'gaya': [24.7914, 85.0002],
      'tumkur': [13.3409, 77.1025],
      'mangalore': [12.9716, 74.8631],
      'bellary': [15.1394, 76.9214],
      'uzhavarkarai': [11.9416, 79.8083],
      'bhilwara': [25.3463, 74.6364],
      'korba': [22.3458, 82.6963],
      'rohtak': [28.8955, 76.6066],
      'shivamogga': [13.9299, 75.5681],
      'ratlam': [23.3343, 75.0376],
      'bathinda': [30.2110, 74.9455],
      'tiruppur': [11.1085, 77.3411],
      'karnal': [29.6857, 76.9905],
      'mangalore': [12.9716, 74.8631],
      'rajahmundry': [17.0005, 81.8040],
      'kurnool': [15.8281, 78.0373],
      'belgaum': [15.8497, 74.4977],
      'tiruchirappalli': [10.7905, 78.7047],
      'maheshtala': [22.5086, 88.2532],
      'udaipur': [24.5854, 73.7125],
      'jamnagar': [22.4707, 70.0577],
      'gulbarga': [17.3297, 76.8343],
      'akola': [20.7096, 77.0021],
      'ajmer': [26.4499, 74.6399],
      'kolhapur': [16.7050, 74.2433],
      'nanded': [19.1383, 77.3210],
      'rourkela': [22.2494, 84.8828],
      'asansol': [23.6889, 86.9661],
      'durgapur': [23.5204, 87.3119],
      'dehradun': [30.3165, 78.0322],
      'bhavnagar': [21.7645, 72.1519],
      'nellore': [14.4426, 79.9865],
      'kochi': [9.9312, 76.2673],
      'firozabad': [27.1591, 78.3958],
      'cuttack': [20.4625, 85.8830],
      'bhilai': [21.2094, 81.4285],
      'jamshedpur': [22.8046, 86.2029],
      'amravati': [20.9374, 77.7796],
      'bikaner': [28.0229, 73.3119],
      'gorakhpur': [26.7606, 83.3732],
      'saharanpur': [29.9675, 77.5451],
      'bhiwandi': [19.2969, 73.0629],
      'guntur': [16.2991, 80.4575],
      'warangal': [17.9689, 79.5941],
      'salem': [11.6643, 78.1460],
      'bhubaneswar': [20.2961, 85.8245],
      'mysore': [12.2958, 76.6394],
      'varanasi': [25.3176, 82.9739],
      'allahabad': [25.4358, 81.8463],
      'amritsar': [31.6340, 74.8723],
      'chandigarh': [30.7333, 76.7794],
      'guwahati': [26.1445, 91.7362],
      'kota': [25.2138, 75.8648],
      'raipur': [21.2514, 81.6296],
      'madurai': [9.9252, 78.1198],
      'jodhpur': [26.2389, 73.0243],
      'vijayawada': [16.5062, 80.6480],
      'gwalior': [26.2183, 78.1828],
      'jabalpur': [23.1815, 79.9864],
      'coimbatore': [11.0168, 76.9558],
      'howrah': [22.5958, 88.2636],
      'ranchi': [23.3441, 85.3096],
      'solapur': [17.6599, 75.9064],
      'noida': [28.5355, 77.3910],
      'aurangabad': [19.8762, 75.3433],
      'vashi': [19.0760, 72.9986],
      'vasai': [19.4259, 72.8225],
      'kalyan': [19.2433, 73.1355],
      'rajkot': [22.3039, 70.8022],
      'meerut': [28.9845, 77.7064],
      'faridabad': [28.4089, 77.3178],
      'nashik': [19.9975, 73.7898],
      'agra': [27.1767, 78.0081],
      'ludhiana': [30.9010, 75.8573],
      'ghaziabad': [28.6692, 77.4538],
      'vadodara': [22.3072, 73.1812],
      'patna': [25.5941, 85.1376],
      'visakhapatnam': [17.6868, 83.2185],
      'bhopal': [23.2599, 77.4126],
      'thane': [19.2183, 72.9781],
      'indore': [22.7196, 75.8577],
      'nagpur': [21.1458, 79.0882],
      'kanpur': [26.4499, 80.3319],
      'lucknow': [26.8467, 80.9462],
      'surat': [21.1702, 72.8311],
      'jaipur': [26.9124, 75.7873],
      'ahmedabad': [23.0225, 72.5714],
      'pune': [18.5204, 73.8567],
      'kolkata': [22.5726, 88.3639],
      'chennai': [13.0827, 80.2707],
      'hyderabad': [17.3850, 78.4867],
      'bangalore': [12.9716, 77.5946],
      'delhi': [28.7041, 77.1025],
      'mumbai': [19.0760, 72.8777],
      
      // Major US Cities (keeping some for international users)
      'new york': [40.7128, -74.0060],
      'nyc': [40.7128, -74.0060],
      'los angeles': [34.0522, -118.2437],
      'la': [34.0522, -118.2437],
      'chicago': [41.8781, -87.6298],
      'houston': [29.7604, -95.3698],
      'phoenix': [33.4484, -112.0740],
      'philadelphia': [39.9526, -75.1652],
      'san antonio': [29.4241, -98.4936],
      'san diego': [32.7157, -117.1611],
      'dallas': [32.7767, -96.7970],
      'san jose': [37.3382, -121.8863],
      'austin': [30.2672, -97.7431],
      'jacksonville': [30.3322, -81.6557],
      'fort worth': [32.7555, -97.3308],
      'columbus': [39.9612, -82.9988],
      'charlotte': [35.2271, -80.8431],
      'san francisco': [37.7749, -122.4194],
      'indianapolis': [39.7684, -86.1581],
      'seattle': [47.6062, -122.3321],
      'denver': [39.7392, -104.9903],
      'washington': [38.9072, -77.0369],
      'boston': [42.3601, -71.0589],
      'el paso': [31.7619, -106.4850],
      'nashville': [36.1627, -86.7816],
      'detroit': [42.3314, -83.0458],
      'oklahoma city': [35.4676, -97.5164],
      'portland': [45.5152, -122.6784],
      'las vegas': [36.1699, -115.1398],
      'memphis': [35.1495, -90.0490],
      'louisville': [38.2527, -85.7585],
      'baltimore': [39.2904, -76.6122],
      'milwaukee': [43.0389, -87.9065],
      'albuquerque': [35.0844, -106.6504],
      'tucson': [32.2226, -110.9747],
      'fresno': [36.7378, -119.7871],
      'sacramento': [38.5816, -121.4944],
      'atlanta': [33.7490, -84.3880],
      'kansas city': [39.0997, -94.5786],
      'long beach': [33.7701, -118.1937],
      'colorado springs': [38.8339, -104.8214],
      'miami': [25.7617, -80.1918],
      'raleigh': [35.7796, -78.6382],
      'omaha': [41.2565, -95.9345],
      'minneapolis': [44.9778, -93.2650],
      'tulsa': [36.1540, -95.9928],
      'cleveland': [41.4993, -81.6944],
      'wichita': [37.6872, -97.3301],
      'arlington': [32.7357, -97.1081],
      'new orleans': [29.9511, -90.0715],
      'bakersfield': [35.3733, -119.0187],
      'tampa': [27.9506, -82.4572],
      'honolulu': [21.3099, -157.8581],
      'anaheim': [33.8366, -117.9143],
      'aurora': [39.7294, -104.8319],
      'santa ana': [33.7455, -117.8677],
      'corpus christi': [27.8006, -97.3964],
      'riverside': [33.9533, -117.3962],
      'lexington': [38.0406, -84.5037],
      'stockton': [37.9577, -121.2908],
      'henderson': [36.0395, -114.9817],
      'saint paul': [44.9537, -93.0900],
      'st. paul': [44.9537, -93.0900],
      'st louis': [38.6270, -90.1994],
      'cincinnati': [39.1031, -84.5120],
      'pittsburgh': [40.4406, -79.9959],
      'anchorage': [61.2181, -149.9003],
      'greensboro': [36.0726, -79.7920],
      'plano': [33.0198, -96.6989],
      'newark': [40.7357, -74.1724],
      'lincoln': [40.8136, -96.7026],
      'orlando': [28.5383, -81.3792],
      'irvine': [33.6846, -117.8265],
      'durham': [35.9940, -78.8986],
      'chula vista': [32.6401, -117.0842],
      'toledo': [41.6528, -83.5379],
      'fort wayne': [41.0793, -85.1394],
      'st. petersburg': [27.7731, -82.6400],
      'laredo': [27.5064, -99.5075],
      'chandler': [33.3062, -111.8413],
      'norfolk': [36.8468, -76.2852],
      'garland': [32.9126, -96.6389],
      'madison': [43.0731, -89.4012],
      'glendale': [33.5387, -112.1860],
      'hialeah': [25.8576, -80.2781],
      'scottsdale': [33.4942, -111.9261],
      'irving': [32.8140, -96.9489],
      'fremont': [37.5485, -121.9886],
      'san bernardino': [34.1083, -117.2898],
      'boise': [43.6150, -116.2023],
      'birmingham': [33.5207, -86.8025],
      'rochester': [43.1566, -77.6088],
      'richmond': [37.5407, -77.4360],
      'spokane': [47.6588, -117.4260],
      'des moines': [41.5868, -93.6250],
      'montgomery': [32.3792, -86.3077],
      'modesto': [37.6391, -120.9969],
      'fayetteville': [35.0527, -78.8784],
      'tacoma': [47.2529, -122.4443],
      'shreveport': [32.5252, -93.7502],
      'fontana': [34.0922, -117.4350],
      'oxnard': [34.1975, -119.1771],
      'moreno valley': [33.9425, -117.2297],
      'frisco': [33.1507, -96.8236],
      'huntington beach': [33.6595, -118.0068],
      'yonkers': [40.9312, -73.8987],
      'glendale': [34.1425, -118.2551],
      'aurora': [39.7294, -104.8319],
      'montgomery': [32.3792, -86.3077],
      'columbus': [39.9612, -82.9988],
      'lubbock': [33.5779, -101.8552],
      'akron': [41.0814, -81.5190],
      'newark': [40.7357, -74.1724],
      'lincoln': [40.8136, -96.7026],
      'durham': [35.9940, -78.8986],
      'chula vista': [32.6401, -117.0842],
      'spokane': [47.6588, -117.4260],
      'chandler': [33.3062, -111.8413],
      'scottsdale': [33.4942, -111.9261],
      'irving': [32.8140, -96.9489],
      'fremont': [37.5485, -121.9886],
      'san bernardino': [34.1083, -117.2898],
      'boise': [43.6150, -116.2023],
      'birmingham': [33.5207, -86.8025],
      'rochester': [43.1566, -77.6088],
      'richmond': [37.5407, -77.4360],
      'des moines': [41.5868, -93.6250],
      'modesto': [37.6391, -120.9969],
      'fayetteville': [35.0527, -78.8784],
      'tacoma': [47.2529, -122.4443],
      'shreveport': [32.5252, -93.7502],
      'fontana': [34.0922, -117.4350],
      'oxnard': [34.1975, -119.1771],
      'moreno valley': [33.9425, -117.2297],
      'frisco': [33.1507, -96.8236],
      'huntington beach': [33.6595, -118.0068],
      'yonkers': [40.9312, -73.8987],
      'lubbock': [33.5779, -101.8552],
      'akron': [41.0814, -81.5190]
    };

    const addressLower = address.toLowerCase().trim();
    
 
    if (mockCoordinates[addressLower]) {
      return mockCoordinates[addressLower];
    }
    
 
    for (const [key, coords] of Object.entries(mockCoordinates)) {
      if (addressLower.includes(key) || key.includes(addressLower)) {
        return coords;
      }
    }
    
    
    return [20.5937, 78.9629];
  }

  function clearRoutes() {
   
    routePolylines.forEach(polyline => {
      map.removeLayer(polyline);
    });
    routePolylines = [];
    
    
    mapMarkers.forEach(marker => {
      if (!marker.isCurrentLocation) {
        map.removeLayer(marker);
      }
    });
    mapMarkers = mapMarkers.filter(marker => marker.isCurrentLocation);
  }

  function initBackgroundTasks() {
    if ('requestIdleCallback' in window) {
      updateStatus('backgroundStatus', 'Available');
    } else {
      updateStatus('backgroundStatus', 'Not supported');
    }
  }

  function calculateEstimatedTime(route) {
    const now = new Date();
    const hour = now.getHours();
    const isRushHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
    
    const baseSpeeds = {
      'Highway': 60,
      'City': 25,
      'Scenic': 40,
      'default': 35
    };
    
    const baseSpeed = baseSpeeds[route.name] || baseSpeeds.default;
    let baseTimeMinutes = (route.distance / baseSpeed) * 60;
    
    const trafficMultipliers = { 'low': 0.8, 'medium': 1.2, 'high': 1.8 };
    const trafficMultiplier = trafficMultipliers[route.trafficLevel] || 1;
    const rushHourMultiplier = isRushHour ? 1.3 : 1;
    
    const startLocation = document.getElementById('startLocation').value.toLowerCase();
    const endLocation = document.getElementById('endLocation').value.toLowerCase();
    const metroCities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune'];
    const cityFactor = metroCities.some(city => startLocation.includes(city) || endLocation.includes(city)) ? 1.2 : 1;
    
    const finalTime = baseTimeMinutes * trafficMultiplier * rushHourMultiplier * cityFactor;
    const variation = 0.9 + (Math.random() * 0.2);
    
    return Math.round(finalTime * variation);
  }

  function planRoute() {
    const start = document.getElementById('startLocation').value;
    const end = document.getElementById('endLocation').value;
    const time = document.getElementById('departureTime').value;
    const type = document.getElementById('routeType').value;

    if (!start || !end || !time) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    setLoadingState(true);
    setTimeout(() => {
      routes = generateMockRoutes(start, end, type);
      displayRoutes(routes);
      
   
      if (map) {
        plotRoute(start, end);
      }
      
      analytics.routesOptimized++;
      updateAnalytics();
      saveAnalytics();
      showNotification('Route planned successfully!', 'success');
      setLoadingState(false);
    }, 2000);
  }

  function generateMockRoutes(start, end, type) {
    const startCoords = getCoordinatesFromAddress(start);
    const endCoords = getCoordinatesFromAddress(end);
    const distance = calculateDistance(startCoords, endCoords);
    
    let mock = [];
    
    if (distance < 50) {
      mock = [
        { id: 1, name: 'City', distance: Math.round(distance * 0.9), trafficLevel: 'high', description: 'Through city center', timestamp: Date.now() },
        { id: 2, name: 'Highway', distance: Math.round(distance * 1.1), trafficLevel: 'medium', description: 'Via ring road', timestamp: Date.now() },
        { id: 3, name: 'Scenic', distance: Math.round(distance * 1.3), trafficLevel: 'low', description: 'Scenic route', timestamp: Date.now() },
      ];
    } else if (distance < 200) {
      mock = [
        { id: 1, name: 'Highway', distance: Math.round(distance * 0.95), trafficLevel: 'medium', description: 'Via national highway', timestamp: Date.now() },
        { id: 2, name: 'City', distance: Math.round(distance * 1.05), trafficLevel: 'high', description: 'Through cities', timestamp: Date.now() },
        { id: 3, name: 'Scenic', distance: Math.round(distance * 1.2), trafficLevel: 'low', description: 'Scenic countryside route', timestamp: Date.now() },
      ];
    } else {
      mock = [
        { id: 1, name: 'Highway', distance: Math.round(distance * 0.98), trafficLevel: 'low', description: 'Via expressway', timestamp: Date.now() },
        { id: 2, name: 'Scenic', distance: Math.round(distance * 1.15), trafficLevel: 'low', description: 'Scenic route', timestamp: Date.now() },
        { id: 3, name: 'City', distance: Math.round(distance * 1.1), trafficLevel: 'medium', description: 'Mixed route', timestamp: Date.now() },
      ];
    }
    
    mock.forEach(route => {
      route.estimatedTime = calculateEstimatedTime(route);
    });
    
    if (type === 'fastest') {
      mock.sort((a, b) => a.estimatedTime - b.estimatedTime);
    } else if (type === 'shortest') {
      mock.sort((a, b) => a.distance - b.distance);
    } else if (type === 'scenic') {
      mock.sort((a, b) => a.name === 'Scenic' ? -1 : 1);
    } else if (type === 'avoid-traffic') {
      mock.sort((a, b) => {
        const trafficLevels = { 'low': 1, 'medium': 2, 'high': 3 };
        return trafficLevels[a.trafficLevel] - trafficLevels[b.trafficLevel];
      });
    }
    
    return mock;
  }

  function calculateDistance(coord1, coord2) {
    const R = 6371;
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function getRouteSpeed(route) {
    const baseSpeeds = {
      'Highway': 60,
      'City': 25,
      'Scenic': 40,
      'default': 35
    };
    return baseSpeeds[route.name] || baseSpeeds.default;
  }

  function isRushHour() {
    const now = new Date();
    const hour = now.getHours();
    return (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
  }

  function displayRoutes(routes) {
    const list = document.getElementById('routesList');
    if (routes.length === 0) {
      list.innerHTML = '<div>No routes found</div>';
      return;
    }
    list.innerHTML = routes.map(route => `
      <div class="route-item" onclick="window.selectRoute(${route.id})">
        <div class="route-header">
          <span class="route-name">${route.name}</span>
          <span class="route-time">${route.estimatedTime} min</span>
        </div>
        <div class="route-details">
          <span>${route.distance} km</span>
          <span class="traffic-${route.trafficLevel}">Traffic: ${route.trafficLevel}</span>
        </div>
        <div>${route.description}</div>
        <div class="time-breakdown" style="font-size: 12px; color: #666; margin-top: 5px;">
          <small>Speed: ${getRouteSpeed(route)} km/h | Rush hour: ${isRushHour() ? 'Yes' : 'No'}</small>
        </div>
        <button class="btn" style="margin-top: 10px; font-size: 12px;" onclick="event.stopPropagation(); window.saveRoute(${route.id})">Save Route</button>
      </div>
    `).join('');
  }

  window.selectRoute = function (routeId) {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;
    document.querySelectorAll('.route-item').forEach(el => el.classList.remove('selected'));
    event.target.closest('.route-item').classList.add('selected');

    analytics.avgTime = (analytics.avgTime + route.estimatedTime) / 2;
    analytics.timeSaved += Math.max(0, 45 - route.estimatedTime);
    analytics.carbonSaved += route.distance * 0.12;
    updateAnalytics();
    saveAnalytics();
    showNotification(`Selected ${route.name}`, 'success');
  };

  window.saveRoute = function (routeId) {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      saveRoute(route);
    }
  };

  function saveRoute(route) {
    const saved = {
      ...route,
      savedAt: Date.now(),
      startLocation: document.getElementById('startLocation').value,
      endLocation: document.getElementById('endLocation').value
    };
    savedRoutes.push(saved);
    localStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));
    loadSavedRoutes();
    showNotification('Route saved!', 'success');
  }
  calculateEstimatedTime
  function loadSavedRoutes() {
    const container = document.getElementById('savedRoutesList');
    if (!savedRoutes.length) {
      container.innerHTML = '<div>No saved routes</div>';
      return;
    }
    container.innerHTML = savedRoutes.map((r, i) => `
      <div class="saved-route">
        ${r.startLocation} → ${r.endLocation} (${r.name}, ${r.estimatedTime} min)
        <button onclick="window.deleteSavedRoute(${i})" class="btn">Delete</button>
      </div>
    `).join('');
  }

  window.deleteSavedRoute = function (index) {
    savedRoutes.splice(index, 1);
    localStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));
    loadSavedRoutes();
    showNotification('Route deleted', 'success');
  };

  function updateAnalytics() {
    document.getElementById('avgTime').textContent = Math.round(analytics.avgTime);
    document.getElementById('timeSaved').textContent = Math.round(analytics.timeSaved);
    document.getElementById('routesOptimized').textContent = analytics.routesOptimized;
    document.getElementById('carbonSaved').textContent = Math.round(analytics.carbonSaved * 100) / 100;
  }

  function saveAnalytics() {
    localStorage.setItem('analytics', JSON.stringify(analytics));
  }

  function useCurrentLocation(field) {
    if (currentLocation) {
      const input = document.getElementById(field === 'start' ? 'startLocation' : 'endLocation');
      input.value = `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
      showNotification('Current location used', 'success');
    } else {
      showNotification('Location not available', 'error');
    }
  }

  function setDefaultDepartureTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    document.getElementById('departureTime').value = now.toISOString().slice(0, 16);
  }

  function setLoadingState(loading) {
    const btn = document.getElementById('planRouteBtn');
    const btnText = document.getElementById('planBtnText');
    const btnLoader = document.getElementById('planBtnLoader');
    btn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    btnLoader.style.display = loading ? 'inline-block' : 'none';
  }

  function updateStatus(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function showNotification(message, type = 'success') {
    const el = document.getElementById('notification');
    el.textContent = message;
    el.className = `notification ${type} show`;
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  function destroy() {
    if (intersectionObserver) intersectionObserver.disconnect();
  }
})();
