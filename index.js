import express from 'express';
import { DateTime } from 'luxon';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = 3000;
const timeZone = "UTC";

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const loadBuses = async () => {
  const data = await readFile(path.join(__dirname, "buses.json"), "utf-8");
  return JSON.parse(data);
};

const getNextDeparture = (firstDepartureTime, frequencyMinutes) => {
  const now = DateTime.now().setZone(timeZone);
  const [hours, minutes] = firstDepartureTime.split(":").map(Number);
  let departure = DateTime.now().set({ hour: hours, minute: minutes }).setZone(timeZone);

  if (now > departure) {
    const minutesSinceFirstDeparture = now.diff(departure, 'minutes').minutes;
    const intervalsPassed = Math.ceil(minutesSinceFirstDeparture / frequencyMinutes);
    departure = departure.plus({ minutes: intervalsPassed * frequencyMinutes });
  }

  const endOfDay = DateTime.now().set({ hour: 23, minute: 59, second: 59 }).setZone(timeZone);

  if (departure > endOfDay) {
    departure = departure.startOf('day').plus({ days: 1 }).set({ hour: hours, minute: minutes });
  }
  return departure;
};

const sortBuses = (buses) => 
  [...buses].sort(
    (a, b) => new Date(`${a.nextDeparture.date}T${a.nextDeparture.time}`) -
      new Date(`${b.nextDeparture.date}T${b.nextDeparture.time}`)
  );

const sendUpdateData = async () => {
  try {
    const buses = await loadBuses();
    const updatedBuses = buses.map((bus) => {
      const nextDeparture = getNextDeparture(bus.firstDepartureTime, bus.frequencyMinutes);
      return {
        ...bus,
        nextDeparture: {
          date: nextDeparture.toFormat('yyyy-MM-dd'),
          time: nextDeparture.toFormat('HH:mm:ss'),
        },
      };
    });
    return updatedBuses;
  } catch (error) {
    console.error("Error updating data:", error);
    throw new Error("Unable to update bus data");
  }
};

app.get('/next-departure', async (req, res) => {
  try {
    const updatedBuses = await sendUpdateData();
    const sortedBuses = sortBuses(updatedBuses);
    res.json(sortedBuses);
  } catch (error) {
    console.error("Error in /next-departure route:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log('Server running on the http://localhost:' + port);
});