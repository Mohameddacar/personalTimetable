// DOM Elements
const taskInput = document.getElementById('taskInput');
const taskDay = document.getElementById('taskDay');
const taskTime = document.getElementById('taskTime');
const editTaskDay = document.getElementById('editTaskDay');
const editTaskTime = document.getElementById('editTaskTime');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn');
const dailyViewBtn = document.getElementById('dailyViewBtn');
const weeklyViewBtn = document.getElementById('weeklyViewBtn');
const timeBlocks = document.getElementById('timeBlocks');
const editModal = document.getElementById('editModal');
const editTaskInput = document.getElementById('editTaskInput');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentView = 'daily';
let editingTaskId = null;

// Time blocks configuration
const timeBlockConfig = {
    startHour: 8,
    endHour: 20,
    blockDuration: 60 // minutes
};

// Initialize the application
function init() {
    initializeTimeOptions();
    renderTasks();
    createTimeBlocks();
    setupEventListeners();
    checkDailyRefresh();
}

// Event Listeners
function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks();
        });
    });

    dailyViewBtn.addEventListener('click', () => {
        currentView = 'daily';
        dailyViewBtn.classList.add('active');
        weeklyViewBtn.classList.remove('active');
        createTimeBlocks();
    });

    weeklyViewBtn.addEventListener('click', () => {
        currentView = 'weekly';
        weeklyViewBtn.classList.add('active');
        dailyViewBtn.classList.remove('active');
        createTimeBlocks();
    });

    saveEditBtn.addEventListener('click', saveTaskEdit);
    cancelEditBtn.addEventListener('click', closeEditModal);
}

// Initialize time options
function initializeTimeOptions() {
    const timeSelects = [taskTime, editTaskTime];
    timeSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Time</option>';
        for (let hour = timeBlockConfig.startHour; hour < timeBlockConfig.endHour; hour++) {
            const startTime = formatTime(hour);
            const endTime = formatTime(hour + 1);
            const option = document.createElement('option');
            option.value = hour;
            option.textContent = `${startTime} - ${endTime}`;
            select.appendChild(option);
        }
    });
}

// Task Management
function addTask() {
    const taskText = taskInput.value.trim();
    const selectedDay = taskDay.value;
    const selectedTime = taskTime.value;
    
    if (taskText) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            timeBlock: selectedDay && selectedTime ? {
                day: selectedDay,
                hour: parseInt(selectedTime)
            } : null
        };
        tasks.push(task);
        saveTasks();
        renderTasks();
        createTimeBlocks();
        taskInput.value = '';
        taskDay.value = '';
        taskTime.value = '';
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
}

function toggleTaskCompletion(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        editingTaskId = taskId;
        editTaskInput.value = task.text;
        editTaskDay.value = task.timeBlock ? task.timeBlock.day : '';
        editTaskTime.value = task.timeBlock ? task.timeBlock.hour : '';
        editModal.style.display = 'block';
    }
}

function saveTaskEdit() {
    if (editingTaskId) {
        tasks = tasks.map(task => {
            if (task.id === editingTaskId) {
                return {
                    ...task,
                    text: editTaskInput.value.trim(),
                    timeBlock: editTaskDay.value && editTaskTime.value ? {
                        day: editTaskDay.value,
                        hour: parseInt(editTaskTime.value)
                    } : null
                };
            }
            return task;
        });
        saveTasks();
        renderTasks();
        createTimeBlocks();
        closeEditModal();
    }
}

function closeEditModal() {
    editModal.style.display = 'none';
    editingTaskId = null;
}

// Task Rendering
function renderTasks() {
    taskList.innerHTML = '';
    const filteredTasks = filterTasks();
    
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        const timeInfo = task.timeBlock 
            ? `<span class="task-time">${task.timeBlock.day} ${formatTime(task.timeBlock.hour)} - ${formatTime(task.timeBlock.hour + 1)}</span>`
            : '';
            
        taskItem.innerHTML = `
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                ${timeInfo}
            </div>
            <div class="task-actions">
                <button onclick="toggleTaskCompletion(${task.id})">${task.completed ? 'Undo' : 'Complete'}</button>
                <button onclick="editTask(${task.id})">Edit</button>
                <button onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
        taskList.appendChild(taskItem);
    });
}

function filterTasks() {
    switch (currentFilter) {
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'pending':
            return tasks.filter(task => !task.completed);
        default:
            return tasks;
    }
}

// Time Block Management
function createTimeBlocks() {
    timeBlocks.innerHTML = '';
    
    if (currentView === 'daily') {
        createDailyTimeBlocks();
    } else {
        createWeeklyTimeBlocks();
    }
}

function createDailyTimeBlocks() {
    for (let hour = timeBlockConfig.startHour; hour < timeBlockConfig.endHour; hour++) {
        const timeBlock = document.createElement('div');
        timeBlock.className = 'time-block';
        const startTime = formatTime(hour);
        const endTime = formatTime(hour + 1);
        
        timeBlock.innerHTML = `
            <div class="time-block-header">${startTime} - ${endTime}</div>
            <div class="time-block-content" data-time="${hour}">
                ${getTasksForTimeBlock(hour).map(task => `
                    <div class="task-in-block" data-task-id="${task.id}">
                        ${task.text}
                    </div>
                `).join('')}
            </div>
        `;
        
        timeBlocks.appendChild(timeBlock);
    }
}

function createWeeklyTimeBlocks() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => {
        const dayBlock = document.createElement('div');
        dayBlock.className = 'day-block';
        dayBlock.innerHTML = `<h3>${day}</h3>`;
        
        for (let hour = timeBlockConfig.startHour; hour < timeBlockConfig.endHour; hour++) {
            const timeBlock = document.createElement('div');
            timeBlock.className = 'time-block';
            const startTime = formatTime(hour);
            const endTime = formatTime(hour + 1);
            
            timeBlock.innerHTML = `
                <div class="time-block-header">${startTime} - ${endTime}</div>
                <div class="time-block-content" data-time="${hour}" data-day="${day}">
                    ${getTasksForTimeBlock(hour, day).map(task => `
                        <div class="task-in-block" data-task-id="${task.id}">
                            ${task.text}
                        </div>
                    `).join('')}
                </div>
            `;
            
            dayBlock.appendChild(timeBlock);
        }
        
        timeBlocks.appendChild(dayBlock);
    });
}

function getTasksForTimeBlock(hour, day = null) {
    return tasks.filter(task => {
        if (task.timeBlock) {
            if (day) {
                return task.timeBlock.hour === hour && task.timeBlock.day === day;
            }
            return task.timeBlock.hour === hour;
        }
        return false;
    });
}

function formatTime(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${period}`;
}

// Local Storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Daily Refresh
function checkDailyRefresh() {
    const lastRefresh = localStorage.getItem('lastRefresh');
    const today = new Date().toDateString();
    
    if (lastRefresh !== today) {
        localStorage.setItem('lastRefresh', today);
        // Reset any daily-specific data here
    }
}

// Initialize the application
init(); 