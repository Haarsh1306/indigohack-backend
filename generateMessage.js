const generateUpdateMessage = (flight) => {
    return `
      Dear User,
  
      We wanted to inform you of an update regarding your flight with flight number ${flight.flight_id}:
  
      - Status: ${flight.status || 'Not updated'}
      - Departure Gate: ${flight.departure_gate || 'Not updated'}
      - Arrival Gate: ${flight.arrival_gate || 'Not updated'}
      - Actual Departure Time: ${flight.actual_departure ? new Date(flight.actual_departure).toLocaleString() : 'Not updated'}
      - Actual Arrival Time: ${flight.actual_arrival ? new Date(flight.actual_arrival).toLocaleString() : 'Not updated'}
  
      Thank you for choosing our airline.
  
      Best regards,
      IndigoHack 2024
    `;
  }

module.exports = generateUpdateMessage;
  