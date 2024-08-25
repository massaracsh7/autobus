const fetchBusData = async () => {
  try {
    const response = await fetch("/next-departure");
    if(!response.ok) {
      throw new Error(`HTTP error! status ${response.status}`);  
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching bus data: ${error}`);
  }
}

const formatDate = (date) => date.toISOString().split("T")[0];
const formatTime = (date) => date.toTimeString().split(" ")[0].slice(0, 5);

const renderBusData = (buses) => {
  const tableBody = document.querySelector('#bus tbody');
  tableBody.textContent = "";
  buses.forEach(bus => {
    const row = document.createElement('tr');
    const nextDepartureDateTimeUTC = new Date(`${bus.nextDeparture.date}T${bus.nextDeparture.time}Z`)
    row.innerHTML = `
    <td>${bus.busNumber}</td>
    <td>${bus.startPoint} - ${bus.endPoint}</td>
    <td>${formatDate(nextDepartureDateTimeUTC)}</td>
    <td>${formatTime(nextDepartureDateTimeUTC)}</td>
    <td>${bus.nextDeparture.remaining}</td>`;
    tableBody.append(row);
  })
}

const nowTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}:${seconds}`;
  document.getElementById('time').textContent = currentTime;
}

const initWebSocket = () => {
  const ws = new WebSocket(`ws://${location.host}`);

  ws.addEventListener("open", () => {
    console.log("WebSocket connection");
  })

  ws.addEventListener("message", (event) => {
    const buses = JSON.parse(event.data);
    renderBusData(buses);
  })

  ws.addEventListener("error", () => {
    console.error("WebSocket error");
  })

  ws.addEventListener("close", () => {
    console.error("WebSocket close");
  })
}

const init = async () => {
  const buses = await fetchBusData();
  renderBusData(buses);
  nowTime();
  setInterval(nowTime, 1000);

  initWebSocket();
}  

init();

