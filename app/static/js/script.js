document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const CRASH_THRESHOLD = 20; // m/s²
    const DATA_POINTS = 20; // Number of points to display on the graph
    const COUNTDOWN_SECONDS = 5; // Countdown seconds for emergency call
    
    // DOM elements
    const xValue = document.getElementById('x-value');
    const yValue = document.getElementById('y-value');
    const zValue = document.getElementById('z-value');
    const totalValue = document.getElementById('total-value');
    const statusIndicator = document.getElementById('status-indicator');
    const detectionButton = document.getElementById('detection-button');
    const crashAlert = document.getElementById('crash-alert');
    const countdownElement = document.getElementById('countdown');
    const cancelAlertButton = document.getElementById('cancel-alert');
    const callNowButton = document.getElementById('call-now');
    const apiSupportMessage = document.getElementById('api-support-message');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Variables
    let isDetecting = false;
    let countdownInterval = null;
    let currentCountdown = COUNTDOWN_SECONDS;
    let accelerationData = Array(DATA_POINTS).fill(0);
    let timeLabels = Array(DATA_POINTS).fill('');
    
    // Check if DeviceMotion API is supported
    if (!window.DeviceMotionEvent) {
        detectionButton.disabled = true;
        detectionButton.classList.remove('bg-green-500', 'hover:bg-green-600');
        detectionButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        apiSupportMessage.classList.remove('hidden');
    }
    
    // Initialize Chart.js
    const ctx = document.getElementById('acceleration-chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Total Acceleration (m/s²)',
                data: accelerationData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false,
                pointBackgroundColor: 'rgb(75, 192, 192)',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#374151'
                    }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: 20,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#374151'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            animation: {
                duration: 0 // Disable animations for better performance
            }
        }
    });
    
    // Handle device motion events
    function handleMotionEvent(event) {
        if (!isDetecting) return;
        
        // Get acceleration data (including gravity)
        const x = event.accelerationIncludingGravity.x || 0;
        const y = event.accelerationIncludingGravity.y || 0;
        const z = event.accelerationIncludingGravity.z || 0;
        
        // Calculate total acceleration magnitude
        const total = Math.sqrt(x*x + y*y + z*z);
        
        // Update display values
        xValue.textContent = x.toFixed(2);
        yValue.textContent = y.toFixed(2);
        zValue.textContent = z.toFixed(2);
        totalValue.textContent = total.toFixed(2);
        
        // Update status indicator color based on acceleration
        updateStatusIndicator(total);
        
        // Update chart data
        updateChart(total);
        
        // Check for crash
        if (total > CRASH_THRESHOLD) {
            detectCrash(x, y, z, total);
        }
    }
    
    // Update status indicator based on acceleration
    function updateStatusIndicator(total) {
        statusIndicator.classList.remove('bg-gray-300', 'status-green', 'status-amber', 'status-red');
        
        if (!isDetecting) {
            statusIndicator.classList.add('bg-gray-300');
            statusIndicator.textContent = 'Inactive';
        } else if (total < 5) {
            statusIndicator.classList.add('status-green');
            statusIndicator.textContent = 'Normal';
        } else if (total < 15) {
            statusIndicator.classList.add('status-amber');
            statusIndicator.textContent = 'Active';
        } else {
            statusIndicator.classList.add('status-red');
            statusIndicator.textContent = 'Intense';
        }
    }
    
    // Update chart with new acceleration data
    function updateChart(total) {
        // Shift data points to make room for new data
        accelerationData.shift();
        accelerationData.push(total);
        
        // Update time labels
        const now = new Date();
        const timeStr = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
        timeLabels.shift();
        timeLabels.push(timeStr);
        
        // Update chart
        chart.update();
    }
    
    // Handle crash detection
    function detectCrash(x, y, z, total) {
        // Show crash alert
        crashAlert.classList.remove('hidden');
        
        // Log crash to server
        logCrashToServer(x, y, z, total);
        
        // Start countdown
        startCountdown();
        
        // Pause detection during alert
        pauseDetection();
    }
    
    // Log crash to server
    function logCrashToServer(x, y, z, total) {
        fetch('/log_crash', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                x: x,
                y: y,
                z: z,
                total: total
            })
        })
        .then(response => response.json())
        .then(data => console.log('Crash logged:', data))
        .catch(error => console.error('Error logging crash:', error));
    }
    
    // Start countdown for emergency call
    function startCountdown() {
        // Reset countdown
        currentCountdown = COUNTDOWN_SECONDS;
        countdownElement.textContent = currentCountdown;
        
        // Clear any existing interval
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        // Start new countdown
        countdownInterval = setInterval(() => {
            currentCountdown--;
            countdownElement.textContent = currentCountdown;
            
            if (currentCountdown <= 0) {
                clearInterval(countdownInterval);
                // Simulate emergency call (in a real app, this would connect to emergency services)
                alert('Emergency services would be called now in a real implementation.');
                resetSystem();
            }
        }, 1000);
    }
    
    // Toggle detection on/off
    function toggleDetection() {
        if (isDetecting) {
            pauseDetection();
        } else {
            startDetection();
        }
    }
    
    // Start motion detection
    function startDetection() {
        isDetecting = true;
        
        // Update button
        detectionButton.textContent = 'Stop Detection';
        detectionButton.classList.remove('bg-green-500', 'hover:bg-green-600');
        detectionButton.classList.add('bg-red-500', 'hover:bg-red-600');
        
        // Update status indicator
        statusIndicator.classList.remove('bg-gray-300');
        statusIndicator.classList.add('status-green');
        statusIndicator.textContent = 'Normal';
        
        // Add device motion event listener
        window.addEventListener('devicemotion', handleMotionEvent);
    }
    
    // Pause motion detection
    function pauseDetection() {
        isDetecting = false;
        
        // Update button
        detectionButton.textContent = 'Start Detection';
        detectionButton.classList.remove('bg-red-500', 'hover:bg-red-600');
        detectionButton.classList.add('bg-green-500', 'hover:bg-green-600');
        
        // Update status indicator
        statusIndicator.classList.remove('status-green', 'status-amber', 'status-red');
        statusIndicator.classList.add('bg-gray-300');
        statusIndicator.textContent = 'Inactive';
        
        // Remove device motion event listener
        window.removeEventListener('devicemotion', handleMotionEvent);
    }
    
    // Reset the system after crash alert
    function resetSystem() {
        // Hide crash alert
        crashAlert.classList.add('hidden');
        
        // Clear countdown
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        // Resume detection
        startDetection();
    }
    
    // Handle theme switching
    function initializeTheme() {
        // Check for saved theme preference or use system preference
        if (localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
    // Initialize theme on page load
    initializeTheme();
    
    // Toggle theme function
    function toggleTheme() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            updateChartTheme(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            updateChartTheme(true);
        }
    }
    
    // Update chart theme based on dark mode
    function updateChartTheme(isDarkMode) {
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#e5e7eb' : '#374151';
        
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.y.ticks.color = textColor;
        chart.data.datasets[0].borderColor = isDarkMode ? 'rgb(129, 230, 217)' : 'rgb(75, 192, 192)';
        chart.update();
    }
    
    // Initialize chart theme
    updateChartTheme(document.documentElement.classList.contains('dark'));
    
    // Event listeners
    detectionButton.addEventListener('click', toggleDetection);
    cancelAlertButton.addEventListener('click', resetSystem);
    callNowButton.addEventListener('click', function() {
        alert('Emergency services would be called now in a real implementation.');
        resetSystem();
    });
    themeToggle.addEventListener('click', toggleTheme);
    
    // Fix for iOS 13+ requiring permission for DeviceMotion
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        detectionButton.addEventListener('click', function() {
            DeviceMotionEvent.requestPermission()
                .then(response => {
                    if (response == 'granted') {
                        toggleDetection();
                    } else {
                        alert('Permission to access motion sensors was denied.');
                    }
                })
                .catch(console.error);
        }, { once: true });
    }
});