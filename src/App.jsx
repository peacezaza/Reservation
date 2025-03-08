import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function App() {
    const [date, setDate] = useState(new Date());
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [reservationDetails, setReservationDetails] = useState({
        clientName: '',
        date: '',
        startTime: '',
        endTime: '',
        platform: '',
    });
    const [reservations, setReservations] = useState(() => {
        const savedData = localStorage.getItem('reservations');
        return savedData ? JSON.parse(savedData) : [];
    });

    // Load reservations from localStorage on component mount
    useEffect(() => {
        const savedReservations = localStorage.getItem('reservations');
        if (savedReservations) {
            setReservations(JSON.parse(savedReservations));
        }

        // Initialize date range if not already set
        if (!selectedDateRange) {
            const startOfWeek = getStartOfWeek(date);
            const endOfWeek = getEndOfWeek(date);
            setSelectedDateRange([startOfWeek, endOfWeek]);
        }
    }, []);

    // Save reservations to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('reservations', JSON.stringify(reservations));
    }, [reservations]);

    const handleDateChange = (newDate) => {
        setDate(newDate);
        const startOfWeek = getStartOfWeek(newDate);
        const endOfWeek = getEndOfWeek(newDate);
        console.log(startOfWeek, endOfWeek);
        setSelectedDateRange([startOfWeek, endOfWeek]);
        setShowCalendar(false);
    };

    const getStartOfWeek = (date) => {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = (day === 0 ? 6 : day - 1);
        startOfWeek.setDate(startOfWeek.getDate() - diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    };

    const getEndOfWeek = (date) => {
        const endOfWeek = new Date(date);
        const day = endOfWeek.getDay();
        const diff = (day === 0 ? 0 : 7 - day);
        endOfWeek.setDate(endOfWeek.getDate() + diff);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
    };

    // Filter reservations based on selected date range
    const getFilteredReservations = () => {
        if (!selectedDateRange || selectedDateRange.length !== 2) {
            return reservations; // Return all if no date range selected
        }

        const [startDate, endDate] = selectedDateRange;

        return reservations.filter(reservation => {
            const reservationDate = new Date(reservation.date);
            return reservationDate >= startDate && reservationDate <= endDate;
        });
    };

    const toggleCalendar = () => {
        setShowCalendar(!showCalendar);
    };

    const handleModalToggle = () => {
        setShowModal(!showModal);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setReservationDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Check for overlapping reservations
        const isOverlapping = reservations.some((existingReservation) => {
            // Check if the date matches and if there is any time overlap
            const isSameDate = existingReservation.date === reservationDetails.date;
            const isTimeOverlap =
                (reservationDetails.startTime < existingReservation.endTime &&
                    reservationDetails.endTime > existingReservation.startTime);

            return isSameDate && isTimeOverlap;
        });

        if (isOverlapping) {
            // You can alert the user or show a message if there's an overlap
            alert('The reservation time overlaps with an existing reservation!');
            return;
        }

        // If no overlap, add the new reservation
        const newReservation = {
            ...reservationDetails,
            id: Date.now(), // Add a unique ID for each reservation
        };

        setReservations((prevReservations) => [...prevReservations, newReservation]);

        // Reset the reservation details
        setReservationDetails({
            clientName: '',
            date: '',
            startTime: '',
            endTime: '',
            platform: '',
        });

        // Close the modal
        handleModalToggle();
    };

    // Function to delete a reservation
    const deleteReservation = (id) => {
        if (window.confirm('Are you sure you want to delete this reservation?')) {
            setReservations(reservations.filter(reservation => reservation.id !== id));
        }
    };

    const times = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00', '01:00', '02:00'];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const displaySelectedPeriod = () => {
        if (selectedDateRange && selectedDateRange.length === 2) {
            const startDate = selectedDateRange[0].toLocaleDateString();
            const endDate = selectedDateRange[1].toLocaleDateString();
            return `${startDate} - ${endDate}`;
        }
        return 'No period selected';
    };

    // Export reservations as JSON file
    const exportReservations = () => {
        const dataStr = JSON.stringify(reservations, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = 'reservations.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Import reservations from JSON file
    const importReservations = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    if (window.confirm('This will replace all existing reservations. Continue?')) {
                        setReservations(importedData);
                    }
                } else {
                    alert('Invalid format. Please upload a valid JSON file.');
                }
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };

        reader.readAsText(file);
    };

    const saveTableAsPNG = () => {
        const table = document.getElementById('reservationTable');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Set canvas size to match table size
        canvas.width = table.offsetWidth;
        canvas.height = table.offsetHeight;

        // Fill the background of the canvas with white color
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // First draw the basic table structure
        let yOffset = 0;

        // Get header row height
        const headerHeight = table.rows[0].offsetHeight;

        // Draw header row
        let xOffset = 0;
        Array.from(table.rows[0].cells).forEach((cell) => {
            const bgColor = window.getComputedStyle(cell).backgroundColor;
            context.fillStyle = bgColor;
            context.fillRect(xOffset, yOffset, cell.offsetWidth, headerHeight);

            context.fillStyle = 'black';
            context.font = '12px Arial';
            // Center header text horizontally and vertically
            const headerText = cell.innerText;
            const headerTextWidth = context.measureText(headerText).width;
            const textHeight = 12; // Approximate height for 12px font
            context.fillText(
                headerText,
                xOffset + (cell.offsetWidth - headerTextWidth) / 2,
                yOffset + (headerHeight / 2) + (textHeight / 2)
            );

            xOffset += cell.offsetWidth;
        });

        // Draw header row border
        context.strokeStyle = '#d1d5db';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, headerHeight);
        context.lineTo(canvas.width, headerHeight);
        context.stroke();

        yOffset += headerHeight;

        // Draw day rows (without reservations first)
        for (let i = 1; i < table.rows.length; i++) {
            const row = table.rows[i];
            const rowHeight = row.offsetHeight;

            // Draw only the day label cell (first cell in row)
            const dayCell = row.cells[0];
            const dayCellWidth = dayCell.offsetWidth;
            const bgColor = window.getComputedStyle(dayCell).backgroundColor;

            context.fillStyle = bgColor;
            context.fillRect(0, yOffset, dayCellWidth, rowHeight);

            context.fillStyle = 'black';
            context.font = '12px Arial';
            // Center day text horizontally and vertically
            const dayText = dayCell.innerText;
            const dayTextWidth = context.measureText(dayText).width;
            const dayTextHeight = 12; // Approximate height for 12px font
            context.fillText(
                dayText,
                (dayCellWidth - dayTextWidth) / 2,
                yOffset + (rowHeight / 2) + (dayTextHeight / 2)
            );

            // Draw other cells as empty (they'll be filled with reservations later)
            xOffset = dayCellWidth;
            for (let j = 1; j < row.cells.length; j++) {
                const cell = row.cells[j];
                context.fillStyle = '#ffffff';
                context.fillRect(xOffset, yOffset, cell.offsetWidth, rowHeight);
                xOffset += cell.offsetWidth;
            }

            // Draw row border
            context.strokeStyle = '#d1d5db';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(0, yOffset + rowHeight);
            context.lineTo(canvas.width, yOffset + rowHeight);
            context.stroke();

            yOffset += rowHeight;
        }

        // Now draw filtered reservations with detailed information
        const filteredReservations = getFilteredReservations();
        filteredReservations.forEach((reservation) => {
            const reservationDate = new Date(reservation.date);
            const reservationDay = reservationDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const formattedDate = reservationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Find the day index
            const dayIndex = days.indexOf(reservationDay);
            if (dayIndex !== -1) {
                // Get the time indices
                const startTimeIndex = times.indexOf(reservation.startTime);
                const endTimeIndex = times.indexOf(reservation.endTime);

                if (startTimeIndex !== -1 && endTimeIndex !== -1) {
                    // Map color names to actual CSS color values
                    const colorMap = {
                        'MON': '#fde047', // yellow-300
                        'TUE': '#f9a8d4', // pink-300
                        'WED': '#86efac', // green-300
                        'THU': '#fdba74', // orange-300
                        'FRI': '#93c5fd', // blue-300
                        'SAT': '#d8b4fe', // purple-300
                        'SUN': '#fca5a5'  // red-300
                    };

                    const reservationColor = colorMap[reservationDay] || '#f3f4f6'; // gray-100

                    // Calculate the position
                    const firstCellWidth = table.rows[0].cells[0].offsetWidth;
                    const timeColWidth = (table.offsetWidth - firstCellWidth) / times.length;

                    // Calculate the row position (header + days before this one)
                    const rowYPosition = headerHeight + (dayIndex * table.rows[1].offsetHeight);

                    // Calculate the column position (day label width + time columns before start time)
                    const colXPosition = firstCellWidth + (startTimeIndex * timeColWidth);

                    // Calculate the width (spans over multiple time slots)
                    const reservationWidth = timeColWidth * (endTimeIndex - startTimeIndex + 1);

                    // Get the height of the reservation cell
                    const reservationHeight = table.rows[1].offsetHeight;

                    // Draw the reservation background
                    context.fillStyle = reservationColor;
                    context.fillRect(colXPosition, rowYPosition, reservationWidth, reservationHeight);

                    // Calculate vertical spacing for 4 lines of text
                    const totalLines = 4;
                    const lineHeight = 14; // space between lines
                    const totalTextHeight = totalLines * lineHeight;
                    const startY = rowYPosition + (reservationHeight - totalTextHeight) / 2 + lineHeight; // start position to center content

                    // Text styling similar to "text-black font-bold text-sm truncate w-full text-center"
                    context.fillStyle = 'black';
                    context.font = 'bold 12px Arial';  // Bold and smaller font

                    // Client name - centered horizontally and positioned for vertical centering
                    const clientName = reservation.clientName;
                    const clientNameWidth = context.measureText(clientName).width;
                    const truncatedName = clientNameWidth > reservationWidth - 10 ? clientName.slice(0, 15) + '...' : clientName;
                    const nameWidth = context.measureText(truncatedName).width;
                    context.fillText(
                        truncatedName,
                        colXPosition + (reservationWidth - nameWidth) / 2,
                        startY
                    );

                    // Additional reservation details - all centered
                    context.font = '10px Arial';

                    // Date text centered
                    const dateText = formattedDate;
                    const dateWidth = context.measureText(dateText).width;
                    context.fillText(
                        dateText,
                        colXPosition + (reservationWidth - dateWidth) / 2,
                        startY + lineHeight
                    );

                    // Time text centered
                    const timeText = `${reservation.startTime} - ${reservation.endTime}`;
                    const timeWidth = context.measureText(timeText).width;
                    context.fillText(
                        timeText,
                        colXPosition + (reservationWidth - timeWidth) / 2,
                        startY + (lineHeight * 2)
                    );

                    // Platform text centered
                    const platformText = reservation.platform;
                    const platformWidth = context.measureText(platformText).width;
                    context.fillText(
                        platformText,
                        colXPosition + (reservationWidth - platformWidth) / 2,
                        startY + (lineHeight * 3)
                    );
                }
            }
        });

        // Create download link
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'reservation_table.png';
        link.click();
    };

    // View reservation list in a modal
    const [showListModal, setShowListModal] = useState(false);

    const toggleListModal = () => {
        setShowListModal(!showListModal);
    };

    return (
        <div className="h-screen w-full grid grid-rows-9">
            <div className="row-span-1 bg-green-500 text-white font-bold text-xl text-center grid grid-rows-2">
                <div className="row-span-1">RESERVATION TABLE</div>
                <div className="row-span-1 flex items-center space-x-4 justify-between px-4">
                    <div className="flex flex-row items-center space-x-4 flex-wrap">
                        <div>{displaySelectedPeriod()}</div>
                        <button
                            onClick={toggleCalendar}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Select Date
                        </button>
                        <button
                            onClick={saveTableAsPNG}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Save PNG
                        </button>
                        <button
                            onClick={handleModalToggle}
                            className="bg-yellow-500 text-white px-4 py-2 rounded"
                        >
                            Add Reservation
                        </button>
                        <button
                            onClick={toggleListModal}
                            className="bg-purple-500 text-white px-4 py-2 rounded"
                        >
                            View All
                        </button>
                        <div className="flex space-x-2">
                            <button
                                onClick={exportReservations}
                                className="bg-indigo-500 text-white px-4 py-2 rounded"
                            >
                                Export
                            </button>
                            <label className="bg-pink-500 text-white px-4 py-2 rounded cursor-pointer">
                                Import
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={importReservations}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row-span-8 h-full overflow-x-auto">
                {showCalendar && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                        <div className="w-full max-w-md bg-white p-4 rounded shadow-lg">
                            <Calendar
                                onChange={handleDateChange}
                                value={date}
                                selectRange={false}
                            />
                            <button
                                onClick={toggleCalendar}
                                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                <table id="reservationTable" className="w-full h-full table-auto relative">
                    <thead>
                    <tr className="bg-gray-200 text-center">
                        <th className="px-4 py-2 border-b border-gray-300">Day</th>
                        {times.map((time, index) => (
                            <th key={index} className="px-4 py-2 border-b border-gray-300">
                                {time}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="relative">
                    {days.map((day, index) => (
                        <tr key={index} className="text-center relative" style={{height: '60px'}}>
                            <td
                                className={`px-4 py-2 border-b border-gray-300 ${
                                    day === 'MON'
                                        ? 'bg-yellow-300'
                                        : day === 'TUE'
                                            ? 'bg-pink-300'
                                            : day === 'WED'
                                                ? 'bg-green-300'
                                                : day === 'THU'
                                                    ? 'bg-orange-300'
                                                    : day === 'FRI'
                                                        ? 'bg-blue-300'
                                                        : day === 'SAT'
                                                            ? 'bg-purple-300'
                                                            : day === 'SUN'
                                                                ? 'bg-red-300'
                                                                : 'bg-gray-100'
                                }`}
                            >
                                {day}
                            </td>
                            {times.map((time, timeIndex) => (
                                <td key={timeIndex} className="px-4 py-2 border-b border-gray-300 relative" style={{height: '60px'}}>
                                    {getFilteredReservations().map((reservation, resIndex) => {
                                        const reservationDate = new Date(reservation.date);
                                        const reservationDay = reservationDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

                                        if (reservationDay === day &&
                                            time >= reservation.startTime &&
                                            time <= reservation.endTime) {

                                            // Only show the details in the first cell of the reservation
                                            const showDetails = time === reservation.startTime;

                                            // Determine if this is the top, middle, or bottom of a reservation
                                            const isFirst = time === reservation.startTime;
                                            const isLast = time === reservation.endTime;

                                            // Get day-based background color
                                            const bgColorClass = day === 'MON' ? 'bg-yellow-300' :
                                                day === 'TUE' ? 'bg-pink-300' :
                                                    day === 'WED' ? 'bg-green-300' :
                                                        day === 'THU' ? 'bg-orange-300' :
                                                            day === 'FRI' ? 'bg-blue-300' :
                                                                day === 'SAT' ? 'bg-purple-300' :
                                                                    day === 'SUN' ? 'bg-red-300' : 'bg-gray-100';

                                            // Border styling to make reservations stand out
                                            const borderClass = `${isFirst ? 'rounded-t-md border-t' : ''} 
                                    ${isLast ? 'rounded-b-md border-b' : ''} 
                                    border-l border-r border-gray-500`;

                                            return (
                                                <div
                                                    key={resIndex}
                                                    className={`absolute inset-0 ${bgColorClass}  flex flex-col justify-center items-center p-1 overflow-hidden`}
                                                    style={{
                                                        boxShadow: isFirst ? '0 -2px 3px rgba(0,0,0,0.1)' : 'none',
                                                        zIndex: 10
                                                    }}
                                                >
                                                    {showDetails ? (
                                                        <>
                                                            <div className="text-black font-bold text-sm truncate w-full text-center">
                                                                {reservation.clientName}
                                                            </div>
                                                            <div className="text-black text-xs truncate w-full text-center">
                                                                {new Date(reservation.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                                                            </div>
                                                            <div className="text-black text-xs truncate w-full text-center">
                                                                {reservation.startTime} - {reservation.endTime}
                                                            </div>
                                                            <div className="text-black text-xs px-1 rounded-sm truncate w-full text-center">
                                                                {reservation.platform}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-black text-xs opacity-75 italic">
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="w-full max-w-md bg-white p-6 rounded shadow-lg">
                        <h2 className="text-xl mb-4">Add Reservation</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="mb-4">
                                <label className="block">Client Name</label>
                                <input
                                    type="text"
                                    name="clientName"
                                    value={reservationDetails.clientName}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={reservationDetails.date}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block">Start Time</label>
                                <select
                                    name="startTime"
                                    value={reservationDetails.startTime}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                >
                                    <option value="">Select Start Time</option>
                                    {times.map((time, index) => (
                                        <option key={index} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block">End Time</label>
                                <select
                                    name="endTime"
                                    value={reservationDetails.endTime}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                >
                                    <option value="">Select End Time</option>
                                    {times.map((time, index) => (
                                        <option key={index} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block">Platform</label>
                                <select
                                    name="platform"
                                    value={reservationDetails.platform}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                >
                                    <option value="">Select Platform</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="line">Line</option>
                                </select>
                            </div>
                            <div className="flex justify-between">
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                >
                                    Add Reservation
                                </button>
                                <button
                                    type="button"
                                    onClick={handleModalToggle}
                                    className="bg-red-500 text-white px-4 py-2 rounded"
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showListModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="w-full max-w-4xl bg-white p-6 rounded shadow-lg max-h-screen overflow-auto">
                        <h2 className="text-xl mb-4">All Reservations</h2>
                        {reservations.length > 0 ? (
                            <table className="w-full border-collapse">
                                <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-2 border text-left">Client Name</th>
                                    <th className="p-2 border text-left">Date</th>
                                    <th className="p-2 border text-left">Time</th>
                                    <th className="p-2 border text-left">Platform</th>
                                    <th className="p-2 border text-left">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reservations.sort((a, b) => new Date(a.date) - new Date(b.date)).map((reservation) => (
                                    <tr key={reservation.id || Math.random()} className="hover:bg-gray-50">
                                        <td className="p-2 border">{reservation.clientName}</td>
                                        <td className="p-2 border">{new Date(reservation.date).toLocaleDateString()}</td>
                                        <td className="p-2 border">{reservation.startTime} - {reservation.endTime}</td>
                                        <td className="p-2 border">{reservation.platform}</td>
                                        <td className="p-2 border">
                                            <button
                                                onClick={() => deleteReservation(reservation.id)}
                                                className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No reservations found.</p>
                        )}
                        <div className="mt-4 flex justify-between">
                            {reservations.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to clear all reservations?')) {
                                            setReservations([]);
                                        }
                                    }}
                                    className="bg-red-600 text-white px-4 py-2 rounded"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                onClick={toggleListModal}
                                className="bg-gray-500 text-white px-4 py-2 rounded ml-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;