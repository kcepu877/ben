export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;

    if (path === "/check") {
      return await handleCheck(params);
    }

    return new Response(generateHTML(), {
      headers: { "Content-Type": "text/html" },
    });
  }
};


async function handleCheck(paramss) {
  const ipPort = paramss.get("ip");

  if (!ipPort) {
    return new Response("Parameter 'ip' diperlukan dalam format ip:port", { status: 400 });
  }

  const [ip, port] = ipPort.split(":");
  if (!ip || !port) {
    return new Response("Format IP:PORT tidak valid", { status: 400 });
  }

  const apiUrl = `https://proxy.ndeso.xyz/check?ip=${ip}:${port}`;

  try {
    const apiResponse = await fetch(apiUrl);
    const result = await apiResponse.json();

    const responseData = {
      proxy: result.proxy || "Unknown",
      ip: result.ip || "Unknown",
      proxyip: result.proxyip || false,
      countryCode: result.countryCode || "Unknown",
      country: result.country || "Unknown",
      flag: result.flag || "🏳️",
      city: result.city || "Unknown",
      timezone: result.timezone && result.timezone.trim() ? result.timezone : "Not Provided",
      latitude: result.latitude && result.latitude.trim() ? result.latitude : "Not Provided",
      longitude: result.longitude || "Unknown",
      delay: result.delay,
      asn: result.asn || "Unknown",
      colo: result.colo || "Unknown",
      isp: result.isp || "Unknown",
      port: port || "-",
      message: result.message || ""
    };

    return new Response(JSON.stringify(responseData, null, 2), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error fetching proxy data:", error);

    const errorData = {
      proxy: "Unknown",
      ip: ip || "Unknown",
      proxyip: "false",
      countryCode: "Unknown",
      country: "Unknown",
      flag: "🏳️",
      city: "Unknown",
      timezone: "Not Provided",
      latitude: "Not Provided",
      longitude: "Unknown",
      delay: "0ms",
      asn: "Unknown",
      colo: "Unknown",
      isp: "Unknown",
      port: port || "-",
      message: "❌ DEAD"
    };

    return new Response(JSON.stringify(errorData, null, 2), { headers: { "Content-Type": "application/json" } });
  }
}


function generateHTML() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proxy Checker</title>
    <meta property="og:image" content="https://bmkg.xyz/img/botvpn.jpg"> <!-- Ganti dengan URL gambar yang sesuai -->
    <meta property="og:url" content="https://bmkg.xyz/img/botvpn.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <meta property="og:type" content="website">
    <meta name="twitter:image" content="https://bmkg.xyz/img/botvpn.jpg"> <!-- Ganti dengan URL gambar yang sesuai -->
    <link href="https://bmkg.xyz/img/botvpn.jpg" rel="icon" type="image/png">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />

    <style>
          :root {
        --primary: #00ff88;
        --secondary: #00ffff;
        --accent: #ff00ff;
        --dark: #080c14;
        --darker: #040608;
        --light: #e0ffff;
        --card-bg: rgba(8, 12, 20, 0.95);
        --glow: 0 0 20px rgba(0, 255, 136, 0.3);
      }
  

      body {
  background: url('https://raw.githubusercontent.com/bitzblack/ip/refs/heads/main/shubham-dhage-5LQ_h5cXB6U-unsplash.jpg') no-repeat center center fixed;
        background-size: cover;
        justify-content: center;
        align-items: center;
  background-size: 300% 300%; /* Untuk animasi gradient */
  color: #fff; /* Teks putih agar kontras */
  margin: 0;
  font-family: Arial, sans-serif; /* Font sederhana dan bersih */
  animation: rainbowBackground 10s infinite; /* Animasi bergerak */
}

/* Animasi untuk background */
@keyframes rainbowBackground {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes moveColors {
  100% {
    background-position: -200%; /* Mulai dari luar kiri */
  }
  0% {
    background-position: 200%; /* Bergerak ke kanan */
  }
}

.warna-text {
  font-size: 20px;
  font-weight: bold;
  display: inline-block;
  background: linear-gradient(90deg, red, orange, yellow, green, blue, purple);
  background-size: 200%;
  color: transparent;
  -webkit-background-clip: text;
  animation: moveColors 5s linear infinite;
}


     h1 {
      font-family: 'Rajdhani', sans-serif;
      padding-top: 10px; /* To avoid content being hidden under the header */
      margin-top: 10px;
      color: black;
            text-align: center;
            font-size: 9vw;
            font-weight: bold;
            text-shadow: 
                0 0 5px rgba(0, 123, 255, 0.8),
                0 0 10px rgba(0, 123, 255, 0.8),
                0 0 20px rgba(0, 123, 255, 0.8),
                0 0 30px rgba(0, 123, 255, 0.8),
                0 0 40px rgba(0, 123, 255, 0.8);
    
         background: linear-gradient(45deg, var(--primary), var(--secondary), var(--dark));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 30px #000;
        position: relative;
        animation: titlePulse 3s ease-in-out infinite;
    }

      @keyframes titlePulse {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.02); filter: brightness(1.2); }
      }
    
    h2 {
      color: black;
            text-align: center;
            font-size: 4vw;
            font-weight: bold;
            text-shadow: 
                0 0 5px rgba(0, 123, 255, 0.8),
                0 0 10px rgba(0, 123, 255, 0.8),
                0 0 20px rgba(0, 123, 255, 0.8),
                0 0 30px rgba(0, 123, 255, 0.8),
                0 0 40px rgba(0, 123, 255, 0.8);
    }
    header, footer {
      box-sizing: border-box; /* Pastikan padding dihitung dalam lebar elemen */
      background-color: ;
      color: white;
      text-align: center;
      border: 0px solid rgba(143, 0, 0, 0.89); /* Border dengan warna abu-abu */
      border-radius: 10px;
      padding: 0 20px;
      position: fixed;
      width: 100%;
      left: 0;
      right: 2px;
      pointer-events: none;
      z-index: 10;
    }

    header {
      top: 0;
    }

    footer {
      bottom: 0;
    }
    
     

      
      .button-style {
    padding: 0.6rem 1rem; /* Ukuran padding */
    font-family: 'Rajdhani', sans-serif; /* Font */
    font-weight: 600; /* Ketebalan font */
    font-size: 0.6rem; /* Ukuran font */
    color: var(--dark); /* Warna teks */
    background: var(--primary); /* Warna background */
    border: none; /* Hilangkan border */
    border-radius: 5px; /* Kurangi radius untuk sudut lebih tajam */
    cursor: pointer; /* Ubah kursor saat hover */
    transition: all 0.3s ease; /* Efek transisi */
    text-transform: uppercase; /* Teks kapitalisasi */
    letter-spacing: 1px; /* Jarak antar huruf */
    position: relative; /* Relatif untuk animasi */
    overflow: hidden; /* Sembunyikan elemen overflow */
    display: flex; /* Flexbox */
    align-items: center; /* Ratakan secara vertikal */
    justify-content: center; /* Ratakan secara horizontal */
    gap: 0.5rem; /* Jarak antar elemen */
}

      .button-style::before {
        content: ''; /* Pseudo-element */
        position: absolute; /* Posisi absolut */
        top: 0;
        left: -100%; /* Mulai dari luar */
        width: 100%; /* Lebar penuh */
        height: 100%; /* Tinggi penuh */
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        ); /* Efek gradient */
        transition: 0.5s; /* Durasi transisi */
      }

      .button-style:hover::before {
        left: 100%; /* Gerakkan gradient ke kanan */
       }

      .button-style:hover {
        transform: translateY(-2px); /* Efek hover */
        box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3); /* Bayangan */
      }

      .button-style:active {
        transform: translateY(1px); /* Efek klik */
        box-shadow: 0 3px 10px rgba(0, 255, 136, 0.2); /* Reduksi bayangan */
      }


  
      .container {
  background-color: rgba(0, 0, 0, 0.82);
  flex: 1;
  padding-top: 20px; /* To avoid content being hidden under the header */
  padding-bottom: 20px;
  margin-top: 95px;
  margin-bottom: 50px; /* To avoid content being hidden under the footer */
  padding-left: 10px;
  padding-right: 10px;
  display: flex;
  flex-direction: column;
  max-width: 960px;
  border: 1px solid #fff;
  border-radius: 10px;
  align-items: center;
  position: relative;
  z-index: 1;

  /* Tambahkan efek glow */
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.6), /* Glow putih */
              0 0 30px rgba(0, 150, 255, 0.5);   /* Glow biru */
  
  /* Default untuk HP */
  margin-left: auto;
  margin-right: auto;
}

/* Offset ke kiri untuk layar besar (desktop) */
@media (min-width: 768px) {
  .container, .content {
    margin-left: auto; /* Sesuaikan offset ke kiri */
    margin-right: auto;
  }
}
     

     
        .copy-btn {
          padding: 0.5rem 0.8rem;
          font-size: 0.7rem;
        }
      }

     

     
      .swal-popup-extra-small-text {
    font-size: 12px; /* Ukuran font untuk seluruh pop-up */
}

.swal-title-extra-small-text {
    font-size: 12px; /* Ukuran font untuk judul */
    font-weight: bold;
}

.swal-content-extra-small-text {
    font-size: 12px; /* Ukuran font untuk teks konten */
}



    .rainbow-text {
      font-size: 15px;
      font-weight: bold;
      animation: rainbow 2s infinite;
    }

   
.loading-text {
    font-size: 18px;
    color: #FF5722; /* Warna untuk teks 'Loading...' */
    margin-left: 10px;
    font-weight: bold; /* Menambahkan ketebalan pada teks */
}

input[type="text"] { padding: 10px; width: 150px; margin-bottom: 15px; }
        button { padding: 8px 8px; background-color: green; color: white; border: none; cursor: pointer; 
        border: 0px solid green; /* Warna border */
    border-radius: 5px; /* Sudut tidak terlalu bulat */
    width: 80px; height: 37px;
    margin: 2px;
    }
        button:hover { background-color: #45a049; }
        #loadinga { display: none; font-size: 18px; font-weight: bold; }
    
  table { margin: auto; border-collapse: collapse; width: 95%; max-width: 700px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: rgba(19, 17, 162, 0.78); color: white; }
        td { padding: 8px 12px; }
        input[type="text"] { padding: 10px;
      width: 80%;
      max-width: 150%;
      margin-bottom: 5px;
      margin-top: 10px;
      margin: 2px;
      padding-top: 10px;
     */ font-size: 3vw; /* Ukuran font diperbesar */
    color: var(--light); /* Warna teks */
    background: rgba(0, 255, 136, 0.05); /* Latar belakang */
    border: 2px solid rgba(0, 255, 136, 0.3); /* Warna border */
    border-radius: 5px; /* Sudut tidak terlalu bulat */
    transition: all 0.3s ease; /* Efek transisi */
 }
        button { padding: 8px 8px; background-color: #green; color: white; border: none; cursor: pointer; 
        border: 0px solid green; /* Warna border */
    border-radius: 5px; /* Sudut tidak terlalu bulat */
    width: 80px; height: 37px;
    margin: 2px;
    }
        button:hover { background-color: #45a049; }
        #loading { display: none; font-size: 18px; font-weight: bold; }
    
    @keyframes moveColors {
  100% {
    background-position: -200%; /* Mulai dari luar kiri */
  }
  0% {
    background-position: 200%; /* Bergerak ke kanan */
  }
}

  #loading {
  display: none; font-size: 20px; font-weight: bold;
  
  background: linear-gradient(90deg, red, orange, yellow, green, blue, purple);
  background-size: 200%;
  color: transparent;
  -webkit-background-clip: text;
  animation: moveColors 5s linear infinite;
}
  @keyframes blink {
    0% { opacity: 1; }
    100% { opacity: 0.3; }
  }
        #map {
  height: 350px;
  width: 100%;
  margin-top: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}
    </style>
</head>
<body>
<header>
<h1>Proxy Checker</h1>
</header>
<div class="container">
  <div style="display: flex; justify-content: space-between;">
    <input type="text" id="ipInput" placeholder="Input IP:Port(192.168.1.1:443)">
    <button onclick="checkProxy()">Check</button>

</div>



    <p id="loading">Loading...</p>
    <br>
    <table id="resultTable">
    
        <thead style="background-color:  color: white; border: none; padding: 10px 20px; ">
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>ISP</td><td>-</td></tr>
        <tr><td>IP</td><td>-</td></tr>
        <tr><td>Port</td><td>-</td></tr>
        <tr><td>ASN</td><td>-</td></tr>
        <tr><td>Country</td><td>-</td></tr>
        <tr><td>City</td><td>-</td></tr>
        <tr><td>Timezone</td><td>-</td></tr>
        <tr><td>Latitude</td><td>-</td></tr>
        <tr><td>Longitude</td><td>-</td></tr>
          <tr><td>Delay</td><td style="color: red; font-weight: bold;">-</td></tr>
          <tr><td>Message</td><td style="font-weight: bold;">-</td></tr>
        </tbody>
    </table><center><br/>
    <div style="display: flex; align-items: center; gap: 5px;">
  </div></center><br/><br/>          
  <div id="map"></div>
    </div>
    <footer>
   <h2> <p>&copy; 2025 Proxy Checker. All rights reserved.</p></h2>
</footer>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

    <script>
    let map;

    window.onload = function () {
        loadStoredData();
        initializeMap();
    };

    function loadStoredData() {
        const storedData = localStorage.getItem("proxyData");
        if (storedData) {
            updateTable(JSON.parse(storedData));
        }
    }

    function initializeMap() {
        const storedMap = localStorage.getItem("mapData");

        if (storedMap) {
            const mapData = JSON.parse(storedMap);
            initMap(mapData.latitude, mapData.longitude, mapData.zoom);
            loadStoredMarker();
        } else {
            initMap(-6.200000, 106.816666, 5);
        }
    }

    function loadStoredMarker() {
        const storedMarker = localStorage.getItem("markerData");
        if (storedMarker) {
            const markerData = JSON.parse(storedMarker);
            addMarkerToMap(markerData.latitude, markerData.longitude, markerData.data);
        }
    }

    async function checkProxy() {
        const ipPort = document.getElementById("ipInput").value.trim();

        if (!ipPort) {
            Swal.fire({
                icon: 'warning',
                title: 'Peringatan!',
                text: 'Masukkan IP:Port terlebih dahulu!',
                confirmButtonText: 'OK',
                confirmButtonColor: '#4CAF50'
            });
            return;
        }

        document.getElementById("loading").style.display = "block";

        try {
            const response = await fetch("/check?ip=" + encodeURIComponent(ipPort));
            const data = await response.json();

            localStorage.setItem("proxyData", JSON.stringify(data));
            updateTable(data);
            if (data.latitude && data.longitude) updateMap(data.latitude, data.longitude, data);
        } catch (error) {
            console.error("Error fetching proxy data:", error);
        } finally {
            document.getElementById("loading").style.display = "none";
        }
    }

    function updateTable(data) {
        const tbody = document.getElementById("resultTable").querySelector("tbody");

        tbody.querySelectorAll("tr").forEach(function (row) {
            const key = row.querySelector("td").textContent.toLowerCase();
            row.querySelectorAll("td")[1].textContent = data[key] || "-";
        });
    }

    function initMap(lat, lon, zoom) {
    map = L.map('map').setView([lat, lon], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">KANG CEPU</a> IP CF Checker'
    }).addTo(map);
}

function updateMap(lat, lon, data) {
    if (!map) {
        initMap(lat, lon, 7);
    } else {
        map.setView([lat, lon], 7);
        
        // Hapus semua marker sebelum menambahkan yang baru
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });
    }

    addMarkerToMap(lat, lon, data);
    saveMapData(lat, lon, 7, data.proxy, data.isp, data.asn);
}

function saveMapData(lat, lon, zoom, proxy = null, isp = null, asn = null) {
    localStorage.setItem("mapData", JSON.stringify({ 
        latitude: lat, 
        longitude: lon, 
        zoom: zoom 
    }));

    const markerData = { latitude: lat, longitude: lon };
    if (proxy || isp || asn) {
        markerData.data = { proxy, isp, asn };
    }

    localStorage.setItem("markerData", JSON.stringify(markerData));
}

function addMarkerToMap(lat, lon, data) {
    var icon1 = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252025.png',
        iconSize: [35, 35],
        iconAnchor: [15, 35],
        popupAnchor: [0, -30]
    });

    var icon2 = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252031.png',
        iconSize: [35, 35],
        iconAnchor: [20, 40],
        popupAnchor: [0, -35]
    });

    var marker = L.marker([lat, lon], { icon: icon1 }).addTo(map)
        .bindPopup("<b>📍 Lokasi</b><br>" +
            "<b>Proxy:</b> " + (data.proxy || '-') + "<br>" +
            "<b>ISP:</b> " + (data.isp || '-') + "<br>" +
            "<b>ASN:</b> " + (data.asn || '-') + "<br>" +
            "<b>Latitude:</b> " + lat + "<br>" +
            "<b>Longitude:</b> " + lon)
        .openPopup();

    let isIcon1 = true;
    let intervalId = setInterval(() => {
        if (!map.hasLayer(marker)) {
            clearInterval(intervalId);
            return;
        }
        marker.setIcon(isIcon1 ? icon2 : icon1);
        isIcon1 = !isIcon1;
    }, 500);
}

    </script>
</body>
</html>`;
}
