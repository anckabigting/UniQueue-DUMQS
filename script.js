document.addEventListener('DOMContentLoaded', () => {
    
    // ================= STATE MANAGEMENT =================
    const systemState = {
        currentServing: 1024,
        nextSequence: 1025,
        dailyQuota: 50,
        registeredTickets: [],
        inventory: {
            "School Uniform": { "M": 42 },
            "PE Uniform": { "M": 15 }
        },
        isCutOff: false,
        selectedRole: 'student', 
        currentUser: null
    };

    // Mock Database Accounts (Req R1)
    const mockUsersDB = {
        student: { email: "student@cvsu.edu.ph", password: "password123" },
        staff: { email: "admin@cvsu.edu.ph", password: "admin123" }
    };

    // ================= DYNAMIC DOM BINDINGS =================
    // Global Wrappers
    const loginView = document.getElementById('login-view');
    const mainSystemLayout = document.getElementById('main-system-layout');
    
    // Authorization Elements
    const toggleStudent = document.getElementById('toggle-student');
    const toggleStaff = document.getElementById('toggle-staff');
    const authForm = document.getElementById('auth-form');
    const emailLabel = document.getElementById('email-label');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const btnLogout = document.getElementById('btn-logout');

    // Portal View Nodes
    const studentView = document.getElementById('student-view');
    const staffView = document.getElementById('staff-view');
    const systemStatusText = document.getElementById('status-text');

    // UI Feedback Banner
    const alertBanner = document.getElementById('system-alert');
    const alertText = document.getElementById('alert-text');
    const alertCloseBtn = document.getElementById('alert-close-btn');

    // Student Controls
    const uniformTypeSelect = document.getElementById('uniform-type');
    const uniformSizeSelect = document.getElementById('uniform-size');
    const liveStockLevel = document.getElementById('live-stock-level');
    const btnRequestTicket = document.getElementById('btn-request-ticket');
    const myTicketCard = document.getElementById('my-ticket-card');
    const myTicketNum = document.getElementById('my-ticket-num');
    const myTicketDetails = document.getElementById('my-ticket-details');
    const myTicketStatus = document.getElementById('my-ticket-status');

    // Live Queue Monitor
    const nowServingNum = document.getElementById('now-serving-num');
    const counterNum = document.getElementById('counter-num');
    const upcomingQueueEl = document.getElementById('upcoming-queue');

    // Staff Dashboard operations
    const btnStaffNext = document.getElementById('btn-staff-next');
    const btnStaffComplete = document.getElementById('btn-staff-complete');
    const inputDailyQuota = document.getElementById('input-daily-quota');
    const btnUpdateQuota = document.getElementById('btn-update-quota');
    const quotaProgressText = document.getElementById('quota-progress-text');
    const quotaBar = document.getElementById('quota-bar');
    const activityLog = document.getElementById('activity-log');

    // ================= UTILITIES & LOGIC =================

    function showAlert(message, isSuccess = false) {
        alertBanner.classList.remove('hidden', 'success');
        if (isSuccess) alertBanner.classList.add('success');
        alertText.textContent = message;
        
        // Auto dismiss banner after 4 seconds
        setTimeout(() => {
            alertBanner.classList.add('hidden');
        }, 4000);
    }

    alertCloseBtn.addEventListener('click', () => {
        alertBanner.classList.add('hidden');
    });

    function logActivity(message) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `[${time}] ${message}`;
        activityLog.appendChild(entry);
        activityLog.scrollTop = activityLog.scrollHeight;
    }

    function updateStockIndicator() {
        const type = uniformTypeSelect.value;
        const size = uniformSizeSelect.value;
        const qty = systemState.inventory[type]?.[size] ?? 0;

        if (qty === 0) {
            liveStockLevel.textContent = "Out of Stock (0)";
            liveStockLevel.style.backgroundColor = "var(--alert-red)";
            liveStockLevel.style.color = "var(--white)";
        } else {
            liveStockLevel.textContent = `In Stock (${qty})`;
            liveStockLevel.style.backgroundColor = "var(--cvsu-yellow)";
            liveStockLevel.style.color = "var(--text-dark)";
        }
    }

    function checkCapacityAndCutOff() {
        const totalRegistered = systemState.registeredTickets.length;
        quotaProgressText.textContent = `${totalRegistered}/${systemState.dailyQuota}`;
        const percentage = Math.min((totalRegistered / systemState.dailyQuota) * 100, 100);
        quotaBar.style.width = `${percentage}%`;

        if (totalRegistered >= systemState.dailyQuota) {
            systemState.isCutOff = true;
            systemStatusText.textContent = "Registration Closed";
            systemStatusText.parentElement.style.backgroundColor = "#FDE8E5";
            systemStatusText.parentElement.style.color = "var(--alert-red)";
        } else {
            systemState.isCutOff = false;
            systemStatusText.textContent = "System Live";
            systemStatusText.parentElement.style.backgroundColor = "#E6F3EC";
            systemStatusText.parentElement.style.color = "var(--cvsu-green)";
        }
    }

    function updateQueueUI() {
        nowServingNum.textContent = `U-${systemState.currentServing}`;
        const upcoming = systemState.registeredTickets.filter(t => t.status === "Waiting");
        upcomingQueueEl.innerHTML = '';

        if (upcoming.length === 0) {
            upcomingQueueEl.innerHTML = '<li class="queue-item"><span>No tickets in queue</span></li>';
        } else {
            upcoming.slice(0, 3).forEach(ticket => {
                const li = document.createElement('li');
                li.className = 'queue-item';
                li.innerHTML = `<span>U-${ticket.number}</span><span class="status-wait">${ticket.status}</span>`;
                upcomingQueueEl.appendChild(li);
            });
        }
    }

    // ================= AUTHENTICATION HANDLERS =================

    toggleStudent.addEventListener('click', () => {
        systemState.selectedRole = 'student';
        toggleStudent.classList.add('active');
        toggleStaff.classList.remove('active');
        emailLabel.textContent = "Student Email / ID";
        authEmail.placeholder = "e.g., student@cvsu.edu.ph";
        authForm.reset();
    });

    toggleStaff.addEventListener('click', () => {
        systemState.selectedRole = 'staff';
        toggleStaff.classList.add('active');
        toggleStudent.classList.remove('active');
        emailLabel.textContent = "Staff Email / Account ID";
        authEmail.placeholder = "e.g., admin@cvsu.edu.ph";
        authForm.reset();
    });

    // Form Submission & Dashboard Router
   authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputEmail = authEmail.value.trim();
    const inputPassword = authPassword.value;
    const selectedRole = systemState.selectedRole; // 'student' or 'staff'

    try {
        // Send login payload to your backend
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: inputEmail,
                password: inputPassword,
                role: selectedRole
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            systemState.currentUser = data.user.email;
            
            // Hide login, show system layout
            loginView.classList.add('hidden');
            mainSystemLayout.classList.remove('hidden');
            alertBanner.classList.add('hidden');

            if (data.user.role === 'student') {
                studentView.classList.remove('hidden');
                staffView.classList.add('hidden');
                showAlert("Welcome to the Student Uniform Queue Portal!", true);
            } else {
                staffView.classList.remove('hidden');
                studentView.classList.add('hidden');
                showAlert("Staff session successfully authorized.", true);
                logActivity(`Admin authorized session opened: ${data.user.email}`);
            }
        } else {
            showAlert(data.message || "Authentication Failed", false);
        }
    } catch (err) {
        console.error(err);
        showAlert("Unable to connect to the backend server.", false);
    }
});

    // Logout session destruction
    btnLogout.addEventListener('click', () => {
        if (systemState.selectedRole === 'staff') {
            logActivity(`Admin session closed: ${systemState.currentUser}`);
        }
        
        systemState.currentUser = null;
        
        // Hide layouts, reveal clean Login Screen
        mainSystemLayout.classList.add('hidden');
        studentView.classList.add('hidden');
        staffView.classList.add('hidden');
        loginView.classList.remove('hidden');
        
        authForm.reset();
        showAlert("Logged out successfully.", true);
    });

    // ================= OPERATIONAL HANDLERS =================

    uniformTypeSelect.addEventListener('change', updateStockIndicator);
    uniformSizeSelect.addEventListener('change', updateStockIndicator);

    btnRequestTicket.addEventListener('click', () => {
        if (systemState.isCutOff) {
            showAlert("Registration is closed. Today's limit has been reached.", false);
            return;
        }

        const type = uniformTypeSelect.value;
        const size = uniformSizeSelect.value;
        const availableStock = systemState.inventory[type]?.[size] ?? 0;

        if (availableStock <= 0) {
            showAlert(`Selected item configuration is currently out of stock.`, false);
            return;
        }

        const ticketNumValue = systemState.nextSequence++;
        systemState.registeredTickets.push({
            number: ticketNumValue,
            type: type,
            size: size,
            status: "Waiting"
        });
        
        myTicketCard.classList.remove('hidden');
        myTicketNum.textContent = `U-${ticketNumValue}`;
        myTicketDetails.textContent = `${type} (${size})`;
        myTicketStatus.textContent = "Waiting";

        showAlert(`Successfully generated ticket U-${ticketNumValue}!`, true);
        checkCapacityAndCutOff();
        updateQueueUI();
    });

    btnStaffNext.addEventListener('click', () => {
        const waitingTickets = systemState.registeredTickets.filter(t => t.status === "Waiting");
        if (waitingTickets.length === 0) {
            showAlert("No waiting students in queue.", false);
            return;
        }

        const nextTicket = waitingTickets[0];
        nextTicket.status = "Serving";
        systemState.currentServing = nextTicket.number;

        const randomCounter = Math.floor(Math.random() * 3) + 1;
        counterNum.textContent = `Counter ${randomCounter}`;

        if (myTicketNum.textContent === `U-${nextTicket.number}`) {
            myTicketStatus.textContent = "Serving";
            myTicketStatus.style.backgroundColor = "var(--cvsu-yellow)";
            myTicketStatus.style.color = "var(--text-dark)";
            showAlert("Your ticket is now being served! Please proceed to the counter.", true);
        }

        logActivity(`Counter ${randomCounter} called Ticket U-${nextTicket.number}.`);
        updateQueueUI();
    });

    btnStaffComplete.addEventListener('click', () => {
        const servingTickets = systemState.registeredTickets.filter(t => t.status === "Serving");
        if (servingTickets.length === 0) {
            showAlert("No active transaction is currently being served.", false);
            return;
        }

        const currentTx = servingTickets[0];
        const type = currentTx.type;
        const size = currentTx.size;

        if (systemState.inventory[type]?.[size] > 0) {
            systemState.inventory[type][size]--;
            currentTx.status = "Completed";

            const targetCell = document.querySelector(`.stock-qty[data-id="${type === 'School Uniform' ? 'UNIFORM-01' : 'UNIFORM-02'}"]`);
            if (targetCell) targetCell.textContent = systemState.inventory[type][size];

            if (myTicketNum.textContent === `U-${currentTx.number}`) {
                myTicketStatus.textContent = "Completed";
                myTicketStatus.style.backgroundColor = "#E6F3EC";
                myTicketStatus.style.color = "var(--cvsu-green)";
            }

            showAlert(`Transaction for U-${currentTx.number} finalized. Stock updated.`, true);
            logActivity(`Released Uniform items and finalized transaction for Ticket U-${currentTx.number}.`);
            
            updateStockIndicator();
            updateQueueUI();
        }
    });

    btnUpdateQuota.addEventListener('click', () => {
        const enteredVal = parseInt(inputDailyQuota.value, 10);
        if (isNaN(enteredVal) || enteredVal <= 0) {
            showAlert("Validation Error: Please enter a valid limit.", false);
            return;
        }
        systemState.dailyQuota = enteredVal;
        showAlert(`Daily queue quota changed to ${enteredVal}!`, true);
        logActivity(`Daily capacity limits modified to [${enteredVal}].`);
        checkCapacityAndCutOff();
    });

    document.querySelectorAll('.btn-add-stock').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const qtyCell = document.querySelector(`.stock-qty[data-id="${id}"]`);
            let currentQty = parseInt(qtyCell.textContent, 10);
            
            currentQty += 10;
            qtyCell.textContent = currentQty;

            if (id === 'UNIFORM-01') systemState.inventory["School Uniform"]["M"] = currentQty;
            else systemState.inventory["PE Uniform"]["M"] = currentQty;

            logActivity(`Replenished 10 items to inventory records ID [${id}].`);
            updateStockIndicator();
        });
    });

    // ================= INITIAL RUNTIME SEEDING =================
    systemState.registeredTickets = [
        { number: 1025, type: "School Uniform", size: "M", status: "Waiting" },
        { number: 1026, type: "PE Uniform", size: "M", status: "Waiting" }
    ];

    updateStockIndicator();
    checkCapacityAndCutOff();
    updateQueueUI();
});