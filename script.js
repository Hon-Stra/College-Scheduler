// script.js
// This file contains the main application logic for the College Schedule App.
// It handles UI interactions, schedule rendering, and mode switching.

// Import the allSchedules data from data.js.
// This allows for modular organization of schedule data.
import { allSchedules } from './data.js';

// Define the base path for GitHub Pages if applicable
// IMPORTANT: Replace 'College-Schedule' with your actual repository name if it's different.
const BASE_PATH = '/College-Schedule'; // Your GitHub repository name

// Get references to key DOM elements
const mainScheduleTitleLine1 = document.getElementById('main-schedule-title-line1');
const mainScheduleTitleLine2 = document.getElementById('main-schedule-title-line2');
const scheduleShortIdButton = document.getElementById('schedule-short-id-button');
const scheduleDisplay = document.getElementById('schedule-display');
const daySelector = document.getElementById('day-selector');
const toggleModeBtn = document.getElementById('toggle-mode-btn');
const openScheduleModalBtn = document.getElementById('open-schedule-modal-btn');
const scheduleModalOverlay = document.getElementById('scheduleModalOverlay');
const closeScheduleModalBtn = document.getElementById('close-schedule-modal');
const scheduleSearchInput = document.getElementById('schedule-search-input');
const scheduleList = document.getElementById('schedule-list');

// --- State Variables ---
let currentSchedule = null;
let currentDay = '';
let isSimplifiedMode = false;

// --- Local Storage Keys ---
const SCHEDULE_ID_STORAGE_KEY = 'currentScheduleId';

/**
 * Helper function to convert a time string (e.g., "09:00 AM") to minutes from midnight.
 * This is useful for sorting courses chronologically.
 * @param {string} timeStr - The time string in "HH:MM AM/PM" format.
 * @returns {number} The total minutes from midnight.
 */
function timeToMinutes(timeStr) {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12; // Convert PM hours (except 12 PM) to 24-hour format
    if (period === 'AM' && hours === 12) hours = 0; // Convert 12 AM (midnight) to 0 hours
    return hours * 60 + minutes;
}

/**
 * Saves the selected schedule ID to local storage.
 * @param {string} scheduleId The ID of the schedule to save.
 */
function saveScheduleToLocalStorage(scheduleId) {
    try {
        localStorage.setItem(SCHEDULE_ID_STORAGE_KEY, scheduleId);
    } catch (e) {
        console.error('Error saving to localStorage', e);
    }
}

/**
 * Retrieves the last selected schedule ID from local storage.
 * @returns {string|null} The saved schedule ID or null if not found.
 */
function loadScheduleFromLocalStorage() {
    try {
        return localStorage.getItem(SCHEDULE_ID_STORAGE_KEY);
    } catch (e) {
        console.error('Error loading from localStorage', e);
        return null;
    }
}

/**
 * Renders the full detailed schedule in a table format.
 * @param {object} schedule - The schedule object to render.
 */
function renderFullSchedule(schedule) {
    // Hide the day selector in full mode
    daySelector.classList.add('hidden');
    daySelector.innerHTML = '';

    const days = schedule.days;
    let tableHtml = `
        <table class="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead class="bg-umak-blue-dark text-white">
                <tr>
                    <th class="py-3 px-6 text-left">Time</th>
                    <th class="py-3 px-6 text-left">Subject</th>
                    <th class="py-3 px-6 text-left">Room</th>
                </tr>
            </thead>
            <tbody>
    `;

    days.forEach(day => {
        const coursesForDay = schedule.courses.filter(course => course.day.toLowerCase() === day.toLowerCase());

        if (coursesForDay.length > 0) {
            tableHtml += `<tr class="bg-gray-100"><td colspan="3" class="px-6 py-4 font-bold text-umak-blue-dark">${day}</td></tr>`;

            // Sort courses by time
            coursesForDay.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

            coursesForDay.forEach(course => {
                tableHtml += `
                    <tr class="border-b last:border-none hover:bg-gray-50 transition-colors duration-200">
                        <td class="px-6 py-4 whitespace-nowrap">${course.time} - ${course.endTime}</td>
                        <td class="px-6 py-4">${course.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${course.room || 'TBA'}</td>
                    </tr>
                `;
            });
        }
    });

    tableHtml += `
            </tbody>
        </table>
    `;
    scheduleDisplay.innerHTML = tableHtml;
}

/**
 * Renders the simplified schedule for a specific day.
 * @param {object} schedule - The schedule object.
 * @param {string} day - The day of the week to display.
 */
function renderSimplifiedSchedule(schedule, day) {
    // Show the day selector in simplified mode
    daySelector.classList.remove('hidden');

    const coursesForDay = schedule.courses.filter(course => course.day.toLowerCase() === day.toLowerCase());
    
    // Sort courses by time
    coursesForDay.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    let cardHtml = '';
    if (coursesForDay.length === 0) {
        cardHtml = '<p class="text-center text-gray-500 mt-8">No classes scheduled for this day.</p>';
    } else {
        cardHtml = coursesForDay.map(course => `
            <div class="bg-white rounded-xl shadow-lg p-6 mb-4 border-l-4 border-umak-yellow">
                <div class="text-lg font-semibold text-umak-blue-dark">${course.name}</div>
                <div class="text-gray-600 mt-1">${course.time} - ${course.endTime}</div>
                <div class="text-gray-500 text-sm">Room: ${course.room || 'TBA'}</div>
            </div>
        `).join('');
    }
    scheduleDisplay.innerHTML = cardHtml;
}

/**
 * Renders the day selector buttons for simplified mode.
 * @param {object} schedule - The current schedule object.
 */
function renderDaySelector(schedule) {
    daySelector.innerHTML = ''; // Clear previous buttons
    schedule.days.forEach(day => {
        const button = document.createElement('button');
        button.textContent = day;
        button.className = `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                          ${day === currentDay ? 'bg-umak-blue-dark text-white shadow-lg' : 'bg-gray-200 text-umak-text-dark hover:bg-gray-300'}`;
        button.addEventListener('click', () => {
            currentDay = day;
            renderDaySelector(schedule); // Re-render to update active button
            renderSimplifiedSchedule(schedule, currentDay);
        });
        daySelector.appendChild(button);
    });
}

/**
 * Renders the schedule based on the current mode and selected day.
 */
function renderCurrentModeSchedule() {
    if (!currentSchedule) return;

    if (isSimplifiedMode) {
        renderDaySelector(currentSchedule);
        renderSimplifiedSchedule(currentSchedule, currentDay);
        toggleModeBtn.textContent = 'FULL MODE';
    } else {
        renderFullSchedule(currentSchedule);
        toggleModeBtn.textContent = 'SIMPLE MODE';
    }
}

/**
 * Sets the current schedule and updates the UI.
 * @param {object} schedule - The schedule to set as current.
 */
function selectSchedule(schedule) {
    currentSchedule = schedule;
    mainScheduleTitleLine1.textContent = schedule.displayTitleLine1;
    mainScheduleTitleLine2.textContent = schedule.displayTitleLine2;
    scheduleShortIdButton.textContent = schedule.shortId;
    
    // Save the new schedule ID to local storage
    saveScheduleToLocalStorage(schedule.id);

    // Get the current day from the user's system to show the relevant schedule first
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    currentDay = schedule.days.includes(today) ? today : schedule.days[0];

    // Re-render the schedule with the new data
    renderCurrentModeSchedule();
}

/**
 * Populates the schedule selection modal with a list of schedules.
 */
function populateScheduleModal(schedules, filterText = '') {
    scheduleList.innerHTML = ''; // Clear the list
    const filteredSchedules = schedules.filter(schedule => 
        schedule.name.toLowerCase().includes(filterText.toLowerCase()) || 
        schedule.shortId.toLowerCase().includes(filterText.toLowerCase())
    );

    filteredSchedules.forEach(schedule => {
        const listItem = document.createElement('li');
        listItem.textContent = schedule.name;
        listItem.className = 'schedule-list-item';
        listItem.addEventListener('click', () => {
            selectSchedule(schedule);
            scheduleModalOverlay.classList.remove('active');
        });
        scheduleList.appendChild(listItem);
    });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Schedule Loading ---
    const savedScheduleId = loadScheduleFromLocalStorage();
    const initialSchedule = savedScheduleId 
        ? allSchedules.find(s => s.id === savedScheduleId) 
        : allSchedules[0];

    if (initialSchedule) {
        selectSchedule(initialSchedule);
    } else if (allSchedules.length > 0) {
        // Fallback to the first schedule if saved ID is invalid
        selectSchedule(allSchedules[0]);
    } else {
        // Display a message if no schedules are available and disable controls
        scheduleDisplay.innerHTML = '<p class="text-center text-gray-500">No schedules available.</p>';
        mainScheduleTitleLine1.textContent = 'No Schedule Available';
        mainScheduleTitleLine2.textContent = '';
        scheduleShortIdButton.textContent = '';
        daySelector.innerHTML = '';
        daySelector.classList.add('hidden');
        toggleModeBtn.disabled = true;
        scheduleShortIdButton.disabled = true;
    }

    // --- Button Event Listeners ---
    toggleModeBtn.addEventListener('click', () => {
        isSimplifiedMode = !isSimplifiedMode;
        renderCurrentModeSchedule();
    });

    scheduleShortIdButton.addEventListener('click', () => {
        populateScheduleModal(allSchedules);
        scheduleModalOverlay.classList.add('active');
    });

    openScheduleModalBtn.addEventListener('click', () => {
        populateScheduleModal(allSchedules);
        scheduleModalOverlay.classList.add('active');
    });

    closeScheduleModalBtn.addEventListener('click', () => {
        scheduleModalOverlay.classList.remove('active');
    });

    scheduleSearchInput.addEventListener('input', (e) => {
        populateScheduleModal(allSchedules, e.target.value);
    });

    // --- Service Worker Registration for PWA ---
    // This enables offline capabilities and installability.
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Register the service worker with the correct scope for GitHub Pages
            // IMPORTANT: Replace 'College-Schedule' with your actual repository name.
            navigator.serviceWorker.register(`${BASE_PATH}/service-worker.js`, { scope: `${BASE_PATH}/` })
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.error('ServiceWorker registration failed: ', err);
                });
        });
    }
});
