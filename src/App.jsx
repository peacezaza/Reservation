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
    // State for mobile view options
    const [displayMode, setDisplayMode] = useState('day'); // 'day' or 'week'
    const [mobileDay, setMobileDay] = useState(new Date());

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

        // Set initial display mode based on screen width
        setDisplayMode(window.innerWidth < 768 ? 'day' : 'week');

        // Add window resize listener for responsive changes
        const handleResize = () => {
            setDisplayMode(window.innerWidth < 768 ? 'day' : 'week');
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Save reservations to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('reservations', JSON.stringify(reservations));
    }, [reservations]);

    const handleDateChange = (newDate) => {
        setDate(newDate);
        setMobileDay(newDate);
        const startOfWeek = getStartOfWeek(newDate);
        const endOfWeek = getEndOfWeek(newDate);
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

    // Navigate to previous or next day in mobile view
    const navigateDay = (direction) => {
        const newDay = new Date(mobileDay);
        newDay.setDate(mobileDay.getDate() + direction);
        setMobileDay(newDay);
    };

    // Filter reservations based on selected date range or single day
    const getFilteredReservations = () => {
        if (displayMode === 'day') {
            // For day view, filter by the selected day
            const dayStart = new Date(mobileDay);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(mobileDay);
            dayEnd.setHours(23, 59, 59, 999);

            return reservations.filter(reservation => {
                const reservationDate = new Date(reservation.date);
                return reservationDate >= dayStart && reservationDate <= dayEnd;
            });
        } else {
            // Week view filtering
            if (!selectedDateRange || selectedDateRange.length !== 2) {
                return reservations; // Return all if no date range selected
            }

            const [startDate, endDate] = selectedDateRange;

            return reservations.filter(reservation => {
                const reservationDate = new Date(reservation.date);
                return reservationDate >= startDate && reservationDate <= endDate;
            });
        }
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
        if (displayMode === 'day') {
            return mobileDay.toLocaleDateString();
        } else if (selectedDateRange && selectedDateRange.length === 2) {
            const startDate = selectedDateRange[0].toLocaleDateString();
            const endDate = selectedDateRange[1].toLocaleDateString();
            return `${startDate} - ${endDate}`;
        }
        return 'No period selected';
    };

    // Helper function to get the day name (MON, TUE, etc.) from a date
    const getDayName = (date) => {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        return dayName;
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
        alert('PNG export is not supported on mobile. Please use export to JSON instead.');
    };

    // View reservation list in a modal
    const [showListModal, setShowListModal] = useState(false);

    const toggleListModal = () => {
        setShowListModal(!showListModal);
    };

    // Mobile bottom drawer menu
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const toggleMobileMenu = () => {
        setShowMobileMenu(!showMobileMenu);
    };

    // Render the mobile day view schedule
    const renderMobileDayView = () => {
        const dayName = getDayName(mobileDay);
        const dayColorClass =
            dayName === 'MON' ? 'bg-yellow-300' :
                dayName === 'TUE' ? 'bg-pink-300' :
                    dayName === 'WED' ? 'bg-green-300' :
                        dayName === 'THU' ? 'bg-orange-300' :
                            dayName === 'FRI' ? 'bg-blue-300' :
                                dayName === 'SAT' ? 'bg-purple-300' :
                                    dayName === 'SUN' ? 'bg-red-300' : 'bg-gray-100';

        const dayReservations = getFilteredReservations();

        return (
            <div className="flex flex-col h-full w-full">
                <div className={`flex justify-between items-center p-2 ${dayColorClass}`}>
                    <button
                        onClick={() => navigateDay(-1)}
                        className="bg-white rounded-full p-1 shadow"
                    >
                        ←
                    </button>
                    <div className="font-bold">
                        {dayName} ({mobileDay.toLocaleDateString()})
                    </div>
                    <button
                        onClick={() => navigateDay(1)}
                        className="bg-white rounded-full p-1 shadow"
                    >
                        →
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {dayReservations.length > 0 ? (
                        <div className="p-2 space-y-2">
                            {dayReservations
                                .sort((a, b) => {
                                    // Sort by start time
                                    if (a.startTime < b.startTime) return -1;
                                    if (a.startTime > b.startTime) return 1;
                                    return 0;
                                })
                                .map(reservation => (
                                    <div
                                        key={reservation.id}
                                        className={`p-3 rounded-lg shadow ${dayColorClass} relative`}
                                    >
                                        <div className="font-bold text-lg">{reservation.clientName}</div>
                                        <div className="text-sm">{reservation.startTime} - {reservation.endTime}</div>
                                        <div className="text-sm">Platform: {reservation.platform}</div>
                                        <button
                                            onClick={() => deleteReservation(reservation.id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            }
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">
                            No reservations for this day
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render the week view (table format for larger screens)
    const renderWeekView = () => {
        return (
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
                                                className={`absolute inset-0 ${bgColorClass} flex flex-col justify-center items-center p-1 overflow-hidden`}
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
        );
    };

    // Mobile menu options
    const mobileMenuOptions = [
        { label: 'Add Reservation', action: handleModalToggle, color: 'bg-yellow-500' },
        { label: 'View All', action: toggleListModal, color: 'bg-purple-500' },
        { label: 'Select Date', action: toggleCalendar, color: 'bg-blue-500' },
        { label: 'Export', action: exportReservations, color: 'bg-indigo-500' },
        { label: 'Import', action: () => document.getElementById('import-file').click(), color: 'bg-pink-500' }
    ];

    return (
        <div className="h-screen w-full flex flex-col">
            {/* Header for both desktop and mobile */}
            <div className="bg-green-500 text-white font-bold text-xl text-center p-2">
                <div className="mb-1">RESERVATION TABLE</div>
                <div className="text-sm flex justify-center items-center">
                    <span>{displaySelectedPeriod()}</span>

                    {/* Toggle view mode button (only visible on larger screens) */}
                    <button
                        onClick={() => setDisplayMode(displayMode === 'day' ? 'week' : 'day')}
                        className="ml-2 bg-white text-green-700 px-2 py-1 rounded text-xs hidden md:inline-block"
                    >
                        {displayMode === 'day' ? 'Week View' : 'Day View'}
                    </button>
                </div>

                {/* Desktop buttons */}
                <div className="hidden md:flex mt-2 items-center space-x-4 justify-between px-4">
                    <div className="flex flex-row items-center space-x-4 flex-wrap">
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

                {/* Mobile menu toggle button */}
                <button
                    onClick={toggleMobileMenu}
                    className="md:hidden mt-2 bg-white text-green-700 px-4 py-1 rounded-full shadow-md mx-auto block"
                >
                    Menu
                </button>
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-y-auto">
                {/* Calendar popup */}
                {showCalendar && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                        <div className="w-full max-w-md bg-white p-4 rounded shadow-lg relative">
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

                {/* Render different views based on display mode */}
                {displayMode === 'day' ? renderMobileDayView() : renderWeekView()}
            </div>

            {/* Mobile bottom menu drawer */}
            {showMobileMenu && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg z-40 p-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                        {mobileMenuOptions.map((option, index) => (
                            <button
                                key={index}
                                onClick={option.action}
                                className={`${option.color} text-white py-3 px-4 rounded-lg text-sm font-medium`}
                            >
                                {option.label}
                            </button>
                        ))}
                        {/* Hidden file input for import */}
                        <input
                            id="import-file"
                            type="file"
                            accept=".json"
                            onChange={importReservations}
                            className="hidden"
                        />
                    </div>
                    <button
                        onClick={toggleMobileMenu}
                        className="mt-3 w-full bg-gray-500 text-white py-2 rounded-lg"
                    >
                        Close Menu
                    </button>
                </div>
            )}

            {/* Add Reservation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
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

            {/* Reservations List Modal */}
            {showListModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="w-full max-w-4xl bg-white p-6 rounded shadow-lg max-h-screen overflow-auto">
                        <h2 className="text-xl mb-4">All Reservations</h2>
                        {reservations.length > 0 ? (
                            <div className="overflow-x-auto">
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
                            </div>
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