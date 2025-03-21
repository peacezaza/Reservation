import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import domtoimage from 'dom-to-image';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

function App() {
    const [date, setDate] = useState(new Date());
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDashboardModal, setShowDashboardModal] = useState(false);
    const [showDashboardCalendar, setShowDashboardCalendar] = useState(false);
    const [selectedDashboardMonth, setSelectedDashboardMonth] = useState(new Date());
    const [reservationDetails, setReservationDetails] = useState({
        clientName: '', date: '', startTime: '', endTime: '', platform: '', status: 'pending', price: '',
    });
    const [reservations, setReservations] = useState([]);
    const [displayMode, setDisplayMode] = useState('day');
    const [mobileDay, setMobileDay] = useState(new Date());
    const [captureWeekView, setCaptureWeekView] = useState(false);
    const [editReservationId, setEditReservationId] = useState(null);
    const [selectedReservations, setSelectedReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false); // Reintroduced
    const [password, setPassword] = useState(''); // Reintroduced

    const CORRECT_PASSWORD = "admin123";

    const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchReservations();
                if (!selectedDateRange) {
                    const startOfWeek = getStartOfWeek(date);
                    const endOfWeek = getEndOfWeek(date);
                    setSelectedDateRange([startOfWeek, endOfWeek]);
                }
            } catch (err) {
                setError('Failed to load reservations. Please try again.');
                console.error('Initial load error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        setDisplayMode(window.innerWidth < 768 ? 'day' : 'week');
        const handleResize = () => setDisplayMode(window.innerWidth < 768 ? 'day' : 'week');
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (captureWeekView) {
            const elementToCapture = document.getElementById("reservationTable");
            if (elementToCapture) {
                elementToCapture.scrollIntoView({ behavior: "smooth" });
                domtoimage.toPng(elementToCapture, { quality: 0.95, bgcolor: '#ffffff' })
                    .then((dataUrl) => {
                        const link = document.createElement("a");
                        link.href = dataUrl;
                        link.download = `schedule-week-${selectedDateRange ? selectedDateRange[0].toLocaleDateString().replace(/\//g, '-') : 'current'}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    })
                    .catch((error) => console.error("Error generating PNG:", error))
                    .finally(() => setCaptureWeekView(false));
            }
        }
    }, [captureWeekView, displayMode, selectedDateRange]);

    useEffect(() => {
        if (showDashboardModal && isAuthenticated) fetchReservations();
    }, [showDashboardModal, isAuthenticated]);

    const fetchReservations = async () => {
        try {
            const response = await fetch('http://40.81.22.116:3000/reservations');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setReservations(data);
        } catch (error) {
            console.error('Error fetching reservations:', error);
            setReservations([]);
            throw error;
        }
    };

    const saveReservations = async (updatedReservations) => {
        try {
            const response = await fetch('http://40.81.22.116:3000/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedReservations),
            });
            if (!response.ok) throw new Error('Failed to save');
        } catch (error) {
            console.error('Error saving reservations:', error);
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (password === CORRECT_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            alert('Incorrect password. Please try again.');
        }
        setShowPasswordModal(false);
        setPassword('');
    };

    const handleLogin = () => {
        setShowPasswordModal(true); // Open password modal on login click
    };

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

    const navigateDay = (direction) => {
        const newDay = new Date(mobileDay);
        newDay.setDate(mobileDay.getDate() + direction);
        setMobileDay(newDay);
    };

    const getFilteredReservations = () => {
        if (displayMode === 'day') {
            const dayStart = new Date(mobileDay);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(mobileDay);
            dayEnd.setHours(23, 59, 59, 999);
            return reservations.filter((res) => new Date(res.date) >= dayStart && new Date(res.date) <= dayEnd);
        } else {
            if (!selectedDateRange || selectedDateRange.length !== 2) return reservations;
            const [startDate, endDate] = selectedDateRange;
            return reservations.filter((res) => new Date(res.date) >= startDate && new Date(res.date) <= endDate);
        }
    };

    const toggleCalendar = () => setShowCalendar(!showCalendar);

    const handleModalToggle = () => {
        if (!isAuthenticated) {
            alert('Please log in to add or edit reservations.');
            return;
        }
        if (showModal) {
            setReservationDetails({ clientName: '', date: '', startTime: '', endTime: '', platform: '', status: 'pending', price: '' });
            setEditReservationId(null);
        }
        setShowModal(!showModal);
    };

    const toggleDashboardModal = () => {
        if (!isAuthenticated) {
            alert('Please log in to access the dashboard.');
            return;
        }
        setShowDashboardModal(true);
    };

    const toggleDashboardCalendar = () => {
        if (!isAuthenticated) {
            alert('Please log in to select a month.');
            return;
        }
        setShowDashboardCalendar(!showDashboardCalendar);
    };

    const handleDashboardMonthChange = (newDate) => {
        setSelectedDashboardMonth(newDate);
        setShowDashboardCalendar(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setReservationDetails((prev) => ({ ...prev, [name]: name === 'price' ? (isAuthenticated ? parseFloat(value) || '' : '') : value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Please log in to submit reservations.');
            return;
        }
        if (reservationDetails.endTime <= reservationDetails.startTime) {
            alert('End time must be after start time!');
            return;
        }
        const isOverlapping = reservations.some((res) => {
            const isSameDate = res.date === reservationDetails.date;
            const isTimeOverlap = reservationDetails.startTime < res.endTime && reservationDetails.endTime > res.startTime;
            return isSameDate && isTimeOverlap && res.id !== editReservationId;
        });
        if (isOverlapping) {
            alert('Time overlaps with an existing reservation!');
            return;
        }

        let updatedReservations;
        if (editReservationId) {
            updatedReservations = reservations.map((res) =>
                res.id === editReservationId ? { ...reservationDetails, id: editReservationId } : res
            );
        } else {
            updatedReservations = [...reservations, { ...reservationDetails, id: Date.now() }];
        }

        setReservations(updatedReservations);
        await saveReservations(updatedReservations);
        setReservationDetails({ clientName: '', date: '', startTime: '', endTime: '', platform: '', status: 'pending', price: '' });
        setEditReservationId(null);
        setShowModal(false);
    };

    const handleEditReservation = (reservation) => {
        if (!isAuthenticated) {
            alert('Please log in to edit reservations.');
            return;
        }
        setReservationDetails({ ...reservation });
        setEditReservationId(reservation.id);
        setShowModal(true);
    };

    const deleteReservation = async (id) => {
        if (!isAuthenticated) {
            alert('Please log in to delete reservations.');
            return;
        }
        const updatedReservations = reservations.filter((res) => res.id !== id);
        setReservations(updatedReservations);
        await saveReservations(updatedReservations);
    };

    const bulkDelete = async () => {
        if (!isAuthenticated) {
            alert('Please log in to delete reservations.');
            return;
        }
        if (selectedReservations.length === 0) return;
        const updatedReservations = reservations.filter((res) => !selectedReservations.includes(res.id));
        setReservations(updatedReservations);
        await saveReservations(updatedReservations);
        setSelectedReservations([]);
    };

    const toggleListModal = () => {
        if (!isAuthenticated) {
            alert('Please log in to view all reservations.');
            return;
        }
        setShowListModal(!showListModal);
    };

    const getDashboardStats = () => {
        const monthStart = new Date(selectedDashboardMonth.getFullYear(), selectedDashboardMonth.getMonth(), 1);
        const monthEnd = new Date(selectedDashboardMonth.getFullYear(), selectedDashboardMonth.getMonth() + 1, 0);
        const monthlyReservations = reservations.filter((res) => new Date(res.date) >= monthStart && new Date(res.date) <= monthEnd);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayReservations = reservations.filter((res) => new Date(res.date).toDateString() === today.toDateString());

        const busyDays = {};
        monthlyReservations.forEach((res) => {
            const day = new Date(res.date).toLocaleDateString('en-US', { weekday: 'short' });
            busyDays[day] = (busyDays[day] || 0) + 1;
        });
        const sortedBusyDays = Object.entries(busyDays).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const busyDaysChartData = {
            labels: sortedBusyDays.map(([day]) => day),
            datasets: [{ label: 'Reservations', data: sortedBusyDays.map(([, count]) => count), backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }],
        };

        const peakHours = {};
        monthlyReservations.forEach((res) => {
            const hour = res.startTime.split(':')[0];
            peakHours[hour] = (peakHours[hour] || 0) + 1;
        });
        const topPeakHour = Object.entries(peakHours).sort((a, b) => b[1] - a[1])[0];

        const totalRevenue = reservations.reduce((sum, res) => sum + (res.price || 0), 0);
        const revenueThisMonth = monthlyReservations.reduce((sum, res) => sum + (res.price || 0), 0);
        const todayRevenue = todayReservations.reduce((sum, res) => sum + (res.price || 0), 0);
        const revenueByPlatform = {};
        monthlyReservations.forEach((res) => {
            revenueByPlatform[res.platform] = (revenueByPlatform[res.platform] || 0) + (res.price || 0);
        });
        const platformChartData = {
            labels: Object.keys(revenueByPlatform),
            datasets: [{ data: Object.values(revenueByPlatform), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }],
        };

        const monthlyData = {};
        reservations.forEach((res) => {
            const resDate = new Date(res.date);
            const monthKey = `${resDate.getFullYear()}-${String(resDate.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { customers: 0, revenue: 0 };
            monthlyData[monthKey].customers += 1;
            monthlyData[monthKey].revenue += res.price || 0;
        });
        const sortedMonths = Object.keys(monthlyData).sort();
        const trendsChartData = {
            labels: sortedMonths,
            datasets: [
                { label: 'Customers', data: sortedMonths.map((m) => monthlyData[m].customers), borderColor: '#36A2EB', fill: false },
                { label: 'Revenue ($)', data: sortedMonths.map((m) => monthlyData[m].revenue), borderColor: '#FF6384', fill: false },
            ],
        };

        const customerGrowthRates = [];
        const revenueGrowthRates = [];
        for (let i = 1; i < sortedMonths.length; i++) {
            const prevCustomers = monthlyData[sortedMonths[i - 1]].customers;
            const currCustomers = monthlyData[sortedMonths[i]].customers;
            const prevRevenue = monthlyData[sortedMonths[i - 1]].revenue;
            const currRevenue = monthlyData[sortedMonths[i]].revenue;
            if (prevCustomers > 0) customerGrowthRates.push((currCustomers - prevCustomers) / prevCustomers);
            if (prevRevenue > 0) revenueGrowthRates.push((currRevenue - prevRevenue) / prevRevenue);
        }
        const avgCustomerGrowth = customerGrowthRates.length > 0 ? customerGrowthRates.reduce((a, b) => a + b, 0) / customerGrowthRates.length : 0;
        const avgRevenueGrowth = revenueGrowthRates.length > 0 ? revenueGrowthRates.reduce((a, b) => a + b, 0) / revenueGrowthRates.length : 0;
        const lastMonth = sortedMonths[sortedMonths.length - 1];
        const predictedCustomers = Math.round(monthlyData[lastMonth].customers * (1 + avgCustomerGrowth));
        const predictedRevenue = (monthlyData[lastMonth].revenue * (1 + avgRevenueGrowth)).toFixed(2);

        return {
            totalCustomers: reservations.length,
            totalRevenue: totalRevenue.toFixed(2),
            customersThisMonth: monthlyReservations.length,
            revenueThisMonth: revenueThisMonth.toFixed(2),
            todayCustomers: todayReservations.length,
            todayRevenue: todayRevenue.toFixed(2),
            busyDaysChartData,
            peakHour: topPeakHour ? `${topPeakHour[0]}:00 (${topPeakHour[1]} bookings)` : 'N/A',
            platformChartData,
            trendsChartData,
            predictedCustomers,
            predictedRevenue,
        };
    };

    const generateReport = () => {
        if (!isAuthenticated) {
            alert('Please log in to generate a report.');
            return;
        }
        const stats = getDashboardStats();
        const report = `
            Reservation Report (${selectedDashboardMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}):
            Total Customers: ${stats.totalCustomers}
            Total Revenue: $${stats.totalRevenue}
            Customers This Month: ${stats.customersThisMonth}
            Revenue This Month: $${stats.revenueThisMonth}
            Today's Customers: ${stats.todayCustomers}
            Today's Revenue: $${stats.todayRevenue}
            Peak Hour: ${stats.peakHour}
            Predicted Customers: ${stats.predictedCustomers}
            Predicted Revenue: $${stats.predictedRevenue}
        `;
        const blob = new Blob([report], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `report-${selectedDashboardMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}.txt`;
        link.click();
    };

    const times = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00', '01:00', '02:00'];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const displaySelectedPeriod = () => {
        if (displayMode === 'day') return mobileDay.toLocaleDateString();
        else if (selectedDateRange && selectedDateRange.length === 2) {
            const startDate = selectedDateRange[0].toLocaleDateString();
            const endDate = selectedDateRange[1].toLocaleDateString();
            return `${startDate} - ${endDate}`;
        }
        return 'No period selected';
    };

    const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    const saveTableAsPNG = async () => {
        let originalDisplayMode = displayMode;
        let elementToCapture = document.getElementById("reservationTable");

        const originalStyles = {
            width: elementToCapture ? elementToCapture.style.width : null,
            fontSize: elementToCapture ? elementToCapture.style.fontSize : null,
            bodyOverflow: document.body.style.overflow,
            tds: [],
            ths: [],
            divs: []
        };

        if (displayMode === 'day') {
            setDisplayMode('week');
            await new Promise(resolve => setTimeout(resolve, 200));
            elementToCapture = document.getElementById("reservationTable");
        }

        if (elementToCapture) {
            elementToCapture.style.width = '2000px';
            elementToCapture.style.fontSize = '20px';
            document.body.style.overflow = 'hidden';

            const tds = elementToCapture.querySelectorAll('td');
            const ths = elementToCapture.querySelectorAll('th');
            const divs = elementToCapture.querySelectorAll('td div');

            tds.forEach(td => {
                originalStyles.tds.push({
                    padding: td.style.padding,
                    height: td.style.height
                });
                td.style.padding = '12px';
                td.style.height = '120px';
            });

            ths.forEach(th => {
                originalStyles.ths.push({
                    padding: th.style.padding,
                    fontSize: th.style.fontSize
                });
                th.style.padding = '12px';
                th.style.fontSize = '24px';
            });

            divs.forEach(div => {
                originalStyles.divs.push({
                    fontSize: div.style.fontSize,
                    classes: div.className
                });
                div.className = div.className.replace(/truncate/g, '');
                div.style.fontSize = '15px';
            });

            const scaleFactor = 2;
            const width = elementToCapture.offsetWidth * scaleFactor;
            const height = elementToCapture.offsetHeight * scaleFactor;

            elementToCapture.scrollIntoView({ behavior: "smooth" });
            domtoimage.toPng(elementToCapture, {
                quality: 0.95,
                bgcolor: '#ffffff',
                width: width,
                height: height,
                style: {
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'top left',
                    width: `${elementToCapture.offsetWidth}px`,
                    height: `${elementToCapture.offsetHeight}px`
                }
            })
                .then((dataUrl) => {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `schedule-week-${selectedDateRange ? selectedDateRange[0].toLocaleDateString().replace(/\//g, '-') : 'current'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })
                .catch((error) => {
                    console.error("Error generating PNG:", error);
                    alert("Failed to save week view as PNG. Please try again.");
                })
                .finally(() => {
                    if (elementToCapture) {
                        elementToCapture.style.width = originalStyles.width || '';
                        elementToCapture.style.fontSize = originalStyles.fontSize || '';
                        tds.forEach((td, index) => {
                            td.style.padding = originalStyles.tds[index]?.padding || '';
                            td.style.height = originalStyles.tds[index]?.height || '';
                        });
                        ths.forEach((th, index) => {
                            th.style.padding = originalStyles.ths[index]?.padding || '';
                            th.style.fontSize = originalStyles.ths[index]?.fontSize || '';
                        });
                        divs.forEach((div, index) => {
                            div.className = originalStyles.divs[index]?.classes || div.className;
                            div.style.fontSize = originalStyles.divs[index]?.fontSize || '';
                        });
                    }
                    document.body.style.overflow = originalStyles.bodyOverflow || '';
                    if (originalDisplayMode === 'day') {
                        setDisplayMode('day');
                    }
                });
        } else {
            alert("Week view table not found. Please ensure content is loaded.");
        }
    };

    const renderMobileDayView = () => {
        const dayName = getDayName(mobileDay);
        const dayColorClass = dayName === 'MON' ? 'bg-yellow-300' : dayName === 'TUE' ? 'bg-pink-300' : dayName === 'WED' ? 'bg-green-300' : dayName === 'THU' ? 'bg-orange-300' : dayName === 'FRI' ? 'bg-blue-300' : dayName === 'SAT' ? 'bg-purple-300' : dayName === 'SUN' ? 'bg-red-300' : 'bg-gray-100';
        const dayReservations = getFilteredReservations();

        return (
            <div className="flex flex-col h-full w-full">
                <div className={`flex justify-between items-center p-2 ${dayColorClass}`}>
                    <button onClick={() => navigateDay(-1)} className="bg-white rounded-full p-1 shadow">←</button>
                    <div className="font-bold">{dayName} ({mobileDay.toLocaleDateString()})</div>
                    <button onClick={() => navigateDay(1)} className="bg-white rounded-full p-1 shadow">→</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {dayReservations.length > 0 ? (
                        <div className="p-2 space-y-2">
                            {dayReservations.sort((a, b) => a.startTime < b.startTime ? -1 : 1).map((reservation) => (
                                <div key={reservation.id} className={`p-3 rounded-lg shadow ${dayColorClass} relative animate-fade-in`}>
                                    <div className="font-bold text-lg">{reservation.clientName}</div>
                                    <div className="text-sm">{reservation.startTime} - {reservation.endTime}</div>
                                    <div className="text-sm">Platform: {reservation.platform}</div>
                                    <div className="text-sm">Status: {reservation.status}</div>
                                    {isAuthenticated && <div className="text-sm">Price: ${reservation.price || 'N/A'}</div>}
                                    {isAuthenticated && (
                                        <>
                                            <button onClick={() => deleteReservation(reservation.id)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button>
                                            <button onClick={() => handleEditReservation(reservation)} className="absolute top-2 right-10 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">✎</button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">No reservations for this day</div>
                    )}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        return (
            <table id="reservationTable" className="w-full h-full table-auto relative">
                <thead>
                <tr className="bg-gray-200 text-center">
                    <th className="px-4 py-2 border-b border-gray-300">Day</th>
                    {times.map((time, index) => <th key={index} className="px-4 py-2 border-b border-gray-300">{time}</th>)}
                </tr>
                </thead>
                <tbody>
                {days.map((day, index) => (
                    <tr key={index} className="text-center" style={{ height: '60px' }}>
                        <td className={`px-4 py-2 border-b border-gray-300 ${day === 'MON' ? 'bg-yellow-300' : day === 'TUE' ? 'bg-pink-300' : day === 'WED' ? 'bg-green-300' : day === 'THU' ? 'bg-orange-300' : day === 'FRI' ? 'bg-blue-300' : day === 'SAT' ? 'bg-purple-300' : day === 'SUN' ? 'bg-red-300' : 'bg-gray-100'}`}>
                            {day}
                        </td>
                        {times.map((time, timeIndex) => (
                            <td key={timeIndex} className="px-4 py-2 border-b border-gray-300 relative" style={{ height: '60px' }}>
                                {getFilteredReservations().map((reservation) => {
                                    const reservationDate = new Date(reservation.date);
                                    const reservationDay = reservationDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                                    if (reservationDay === day && time >= reservation.startTime && time <= reservation.endTime) {
                                        const showDetails = time === reservation.startTime;
                                        const isFirst = time === reservation.startTime;
                                        const bgColorClass = day === 'MON' ? 'bg-yellow-300' : day === 'TUE' ? 'bg-pink-300' : day === 'WED' ? 'bg-green-300' : day === 'THU' ? 'bg-orange-300' : day === 'FRI' ? 'bg-blue-300' : day === 'SAT' ? 'bg-purple-300' : day === 'SUN' ? 'bg-red-300' : 'bg-gray-100';
                                        return (
                                            <div key={reservation.id} className={`absolute inset-0 ${bgColorClass} flex flex-col justify-center items-center p-1 overflow-hidden animate-fade-in`} style={{ boxShadow: isFirst ? '0 -2px 3px rgba(0,0,0,0.1)' : 'none', zIndex: 10 }}>
                                                {showDetails && (
                                                    <>
                                                        <div className="text-black font-bold text-sm truncate w-full text-center">{reservation.clientName}</div>
                                                        <div className="text-black text-xs truncate w-full text-center">{new Date(reservation.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                        <div className="text-black text-xs truncate w-full text-center">{reservation.startTime} - {reservation.endTime}</div>
                                                        <div className="text-black text-xs px-1 rounded-sm truncate w-full text-center">{reservation.platform}</div>
                                                        <div className="text-black text-xs truncate w-full text-center">{reservation.status}</div>
                                                        {isAuthenticated && <div className="text-black text-xs truncate w-full text-center">${reservation.price || 'N/A'}</div>}
                                                    </>
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

    const desktopMenuOptions = [
        { label: 'Select Date', action: toggleCalendar, color: 'bg-blue-500', restricted: false },
        { label: 'Save PNG', action: saveTableAsPNG, color: 'bg-green-500', restricted: false },
        { label: 'Add Reservation', action: handleModalToggle, color: 'bg-yellow-500', restricted: true },
        { label: 'View All', action: toggleListModal, color: 'bg-purple-500', restricted: true },
        { label: 'Dashboard', action: toggleDashboardModal, color: 'bg-indigo-500', restricted: true },
        { label: 'Login', action: handleLogin, color: 'bg-gray-500', restricted: false },
    ];

    const mobileMenuOptions = [
        { label: 'Select Date', action: toggleCalendar, color: 'bg-blue-500', restricted: false },
        { label: 'Save PNG', action: saveTableAsPNG, color: 'bg-green-500', restricted: false },
        { label: 'Add Reservation', action: handleModalToggle, color: 'bg-yellow-500', restricted: true },
        { label: 'View All', action: toggleListModal, color: 'bg-purple-500', restricted: true },
        { label: 'Dashboard', action: toggleDashboardModal, color: 'bg-indigo-500', restricted: true },
        { label: 'Login', action: handleLogin, color: 'bg-gray-500', restricted: false },
    ];

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center text-gray-500">Loading...</div>;
    }

    if (error) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center text-red-500">
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Retry</button>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col">
            <div className="bg-green-500 text-white font-bold text-xl text-center p-2">
                <div className="mb-1">RESERVATION TABLE</div>
                <div className="text-sm flex justify-center items-center">
                    <span>{displaySelectedPeriod()}</span>
                    <button onClick={() => setDisplayMode(displayMode === 'day' ? 'week' : 'day')} className="ml-2 bg-white text-green-700 px-2 py-1 rounded text-xs hidden md:inline-block">
                        {displayMode === 'day' ? 'Week View' : 'Day View'}
                    </button>
                </div>
                <div className="hidden md:flex mt-2 items-center space-x-4 justify-between px-4">
                    <div className="flex flex-row items-center space-x-4 flex-wrap">
                        {desktopMenuOptions.map((option, index) => (
                            <button
                                key={index}
                                onClick={option.action}
                                className={`${option.color} text-white px-4 py-2 rounded ${!isAuthenticated && option.restricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!isAuthenticated && option.restricted}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={toggleMobileMenu} className="md:hidden mt-2 bg-white text-green-700 px-4 py-1 rounded-full shadow-md mx-auto block">Menu</button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {showCalendar && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in">
                        <div className="w-full max-w-md bg-white p-4 rounded shadow-lg relative">
                            <Calendar onChange={handleDateChange} value={date} selectRange={false} />
                            <button onClick={toggleCalendar} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">Close</button>
                        </div>
                    </div>
                )}
                {displayMode === 'day' ? renderMobileDayView() : renderWeekView()}
            </div>

            {showMobileMenu && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg z-40 p-4 border-t border-gray-200 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                        {mobileMenuOptions.map((option, index) => (
                            <button
                                key={index}
                                onClick={option.action}
                                className={`${option.color} text-white py-3 px-4 rounded-lg text-sm font-medium ${!isAuthenticated && option.restricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!isAuthenticated && option.restricted}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={toggleMobileMenu} className="mt-3 w-full bg-gray-500 text-white py-2 rounded-lg">Close Menu</button>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in">
                    <div className="w-full max-w-md bg-white p-6 rounded shadow-lg">
                        <h2 className="text-xl mb-4">{editReservationId ? 'Edit Reservation' : 'Add Reservation'}</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="mb-4">
                                <label className="block">Client Name</label>
                                <input type="text" name="clientName" value={reservationDetails.clientName} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div className="mb-4">
                                <label className="block">Date</label>
                                <input type="date" name="date" value={reservationDetails.date} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div className="mb-4">
                                <label className="block">Start Time</label>
                                <select name="startTime" value={reservationDetails.startTime} onChange={handleInputChange} className="w-full p-2 border rounded" required>
                                    <option value="">Select</option>
                                    {times.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block">End Time</label>
                                <select name="endTime" value={reservationDetails.endTime} onChange={handleInputChange} className="w-full p-2 border rounded" required>
                                    <option value="">Select</option>
                                    {times.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block">Platform</label>
                                <select name="platform" value={reservationDetails.platform} onChange={handleInputChange} className="w-full p-2 border rounded" required>
                                    <option value="">Select</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="line">Line</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block">Status</label>
                                <select name="status" value={reservationDetails.status} onChange={handleInputChange} className="w-full p-2 border rounded" required>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="canceled">Canceled</option>
                                </select>
                            </div>
                            {isAuthenticated && (
                                <div className="mb-4">
                                    <label className="block">Price ($)</label>
                                    <input type="number" name="price" value={reservationDetails.price} onChange={handleInputChange} className="w-full p-2 border rounded" step="0.01" min="0" />
                                </div>
                            )}
                            <div className="flex justify-between">
                                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition" disabled={!isAuthenticated}>Add</button>
                                <button type="button" onClick={handleModalToggle} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">Close</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showListModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex justify-center items-center p-4 animate-fade-in">
                    <div className="w-full max-w-4xl bg-white p-6 rounded shadow-lg max-h-screen overflow-auto relative z-70">
                        <h2 className="text-xl mb-4">All Reservations</h2>
                        {reservations.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-2 border text-left"><input type="checkbox" onChange={(e) => setSelectedReservations(e.target.checked ? reservations.map(r => r.id) : [])} disabled={!isAuthenticated} /></th>
                                        <th className="p-2 border text-left">Client Name</th>
                                        <th className="p-2 border text-left">Date</th>
                                        <th className="p-2 border text-left">Time</th>
                                        <th className="p-2 border text-left">Platform</th>
                                        <th className="p-2 border text-left">Status</th>
                                        {isAuthenticated && <th className="p-2 border text-left">Price</th>}
                                        {isAuthenticated && <th className="p-2 border text-left">Actions</th>}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reservations.sort((a, b) => new Date(a.date) - new Date(b.date)).map((reservation) => (
                                        <tr key={reservation.id} className="hover:bg-gray-50">
                                            <td className="p-2 border"><input type="checkbox" checked={selectedReservations.includes(reservation.id)} onChange={() => setSelectedReservations((prev) => prev.includes(reservation.id) ? prev.filter((r) => r !== reservation.id) : [...prev, reservation.id])} disabled={!isAuthenticated} /></td>
                                            <td className="p-2 border">{reservation.clientName}</td>
                                            <td className="p-2 border">{new Date(reservation.date).toLocaleDateString()}</td>
                                            <td className="p-2 border">{reservation.startTime} - {reservation.endTime}</td>
                                            <td className="p-2 border">{reservation.platform}</td>
                                            <td className="p-2 border">{reservation.status}</td>
                                            {isAuthenticated && <td className="p-2 border">${reservation.price || 'N/A'}</td>}
                                            {isAuthenticated && (
                                                <td className="p-2 border">
                                                    <button onClick={() => deleteReservation(reservation.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600 transition z-80" disabled={!isAuthenticated}>Delete</button>
                                                    <button onClick={() => handleEditReservation(reservation)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm ml-2 hover:bg-blue-600 transition z-80" disabled={!isAuthenticated}>Edit</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>No reservations found.</p>
                        )}
                        <div className="mt-4 flex justify-between">
                            {isAuthenticated && reservations.length > 0 && (
                                <button onClick={bulkDelete} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition z-80" disabled={!isAuthenticated}>Delete Selected</button>
                            )}
                            <button onClick={toggleListModal} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition ml-auto z-80">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showDashboardModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in">
                    <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-xl">
                            <h2 className="text-2xl font-bold">Insights Dashboard</h2>
                            <p className="text-sm mt-1">{selectedDashboardMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="p-6 space-y-8">
                            {reservations.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Busy Days</h3>
                                            <Bar data={getDashboardStats().busyDaysChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Reservations' } } }, animation: { duration: 1000 } }} height={200} />
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 flex items-center justify-center">
                                            <div className="text-center">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Peak Hour</h3>
                                                <p className="text-3xl font-bold text-indigo-600">{getDashboardStats().peakHour}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Total Customers</h2>
                                            <p className="text-2xl font-bold text-blue-600">{getDashboardStats().totalCustomers}</p>
                                        </div>
                                        {isAuthenticated && (
                                            <>
                                                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Revenue</h3>
                                                    <p className="text-2xl font-bold text-green-600">${getDashboardStats().totalRevenue}</p>
                                                </div>
                                                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Revenue This Month</h3>
                                                    <p className="text-2xl font-bold text-green-600">${getDashboardStats().revenueThisMonth}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {isAuthenticated && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Today's Customers</h3>
                                                <p className="text-2xl font-bold text-blue-600">{getDashboardStats().todayCustomers}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Today's Revenue</h3>
                                                <p className="text-2xl font-bold text-green-600">${getDashboardStats().todayRevenue}</p>
                                            </div>
                                        </div>
                                    )}
                                    {isAuthenticated && (
                                        <>
                                            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Platform</h3>
                                                <Pie data={getDashboardStats().platformChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, animation: { duration: 1000 } }} height={200} />
                                            </div>
                                            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
                                                <Line data={getDashboardStats().trendsChartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Customers & Revenue Trends', font: { size: 16 } } }, scales: { y: { beginAtZero: true } }, animation: { duration: 1000 } }} height={200} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Predicted Customers</h3>
                                                    <p className="text-2xl font-bold text-purple-600">{getDashboardStats().predictedCustomers}</p>
                                                </div>
                                                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Predicted Revenue</h3>
                                                    <p className="text-2xl font-bold text-purple-600">${getDashboardStats().predictedRevenue}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <p className="text-center text-gray-500">No data available.</p>
                            )}
                        </div>
                        <div className="p-6 flex justify-between items-center bg-gray-50 rounded-b-xl">
                            <button onClick={toggleDashboardCalendar} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition" disabled={!isAuthenticated}>Select Month</button>
                            {isAuthenticated && <button onClick={generateReport} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">Generate Report</button>}
                            <button onClick={() => setShowDashboardModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">Close</button>
                        </div>
                        {showDashboardCalendar && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex justify-center items-center animate-fade-in">
                                <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-lg relative">
                                    <Calendar onChange={handleDashboardMonthChange} value={selectedDashboardMonth} view="month" maxDetail="year" minDetail="year" />
                                    <button onClick={toggleDashboardCalendar} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in">
                    <div className="w-full max-w-md bg-white p-6 rounded shadow-lg">
                        <h2 className="text-xl mb-4">Enter Password</h2>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="mb-4">
                                <label className="block">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="flex justify-between">
                                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">Submit</button>
                                <button type="button" onClick={() => { setShowPasswordModal(false); setPassword(''); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;