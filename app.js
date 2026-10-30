// ============================================================
// 1. INITIAL DATA SETUP
// ============================================================
function setupData() {
  if (!localStorage.getItem('cars')) {
    const defaultCars = [
      { id: 'EV01', name: 'Nissan Leaf', range: 270, rate: 55, img: '../images/nissan_leaf.jpeg' },
      { id: 'EV02', name: 'Tesla Model 3', range: 500, rate: 90, img: '../images/tesla_m3.jpeg' },
      { id: 'EV03', name: 'BYD Atto 3', range: 420, rate: 70, img: '../images/byd_atto3.jpeg' },
      { id: 'EV04', name: 'MG ZS EV', range: 320, rate: 60, img: '../images/mg_zs_ev.jpeg' },
      { id: 'EV05', name: 'Hyundai Ioniq 5', range: 480, rate: 85, img: '../images/hyundai_ioniq.jpeg' },
      { id: 'EV06', name: 'Kia EV6', range: 510, rate: 95, img: '../images/Kia_EV6.jpeg' }
    ];
    localStorage.setItem('cars', JSON.stringify(defaultCars));
  }

  // Setup default employee and empty bookings
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([
      { email: 'emp1@azoom.com', pass: 'azoom123', role: 'employee', name: 'Staff One' }
    ]));
  }
  if (!localStorage.getItem('bookings')) {
    localStorage.setItem('bookings', JSON.stringify([]));
  }
}
setupData();

// ============================================================
// 2. LOGIN & AUTHENTICATION
// ============================================================
function loginUser(email, pass) {
  const users = JSON.parse(localStorage.getItem('users'));
  for (let i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].pass === pass) {
      sessionStorage.setItem('loggedInUser', JSON.stringify(users[i]));
      return users[i];
    }
  }
  return null;
}

function getCurrentUser() {
  const user = sessionStorage.getItem('loggedInUser');
  if (user) return JSON.parse(user);
  return null;
}

function logout() {
  sessionStorage.removeItem('loggedInUser');
  updateNavBar();
  showPage('home');
}

function updateNavBar() {
  const user = getCurrentUser();
  const loginLink = document.getElementById('navLogin');
  const logoutLink = document.getElementById('navLogout');
  const userBadge = document.getElementById('navUser');
  const empLink = document.getElementById('navEmployee');

  if (user) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline';
    userBadge.style.display = 'inline';
    userBadge.innerText = user.name;
    if (user.role === 'employee') empLink.style.display = 'inline';
    else empLink.style.display = 'none';
  } else {
    loginLink.style.display = 'inline';
    logoutLink.style.display = 'none';
    userBadge.style.display = 'none';
    empLink.style.display = 'none';
  }
}

// ============================================================
// 3. NAVIGATION
// ============================================================
function showPage(pageName) {
  // Hide all pages
  const pages = document.querySelectorAll('.page');
  for (let i = 0; i < pages.length; i++) {
    pages[i].classList.remove('active');
  }

  // Show the requested page
  const target = document.getElementById('page-' + pageName);
  if (target) target.classList.add('active');

  // Highlight nav link
  const links = document.querySelectorAll('#mainNav a');
  for (let i = 0; i < links.length; i++) {
    links[i].classList.remove('active');
    if (links[i].getAttribute('data-nav') === pageName) {
      links[i].classList.add('active');
    }
  }

  // Run page-specific setup
  if (pageName === 'cars') showCars();
  if (pageName === 'booking') setupBookingForm();
  if (pageName === 'employee') loadEmployeeDashboard();
  if (pageName === 'finalbill') showFinalBill();
}

// ============================================================
// 4. CARS PAGE
// ============================================================
function showCars() {
  const cars = JSON.parse(localStorage.getItem('cars'));
  const maxRate = document.getElementById('maxRate').value;
  document.getElementById('rateLabel').innerText = '$' + maxRate;

  const grid = document.getElementById('carGrid');
  grid.innerHTML = '';

  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    if (car.rate <= maxRate) {
      grid.innerHTML += `
        <div class="car-card">
          <img src="${car.img}" alt="${car.name}">
          <h3>${car.name}</h3>
          <p>⚡ Range: ${car.range} km</p>
          <p class="price">$${car.rate} / day</p>
          <button class="btn" onclick="bookCar('${car.id}')">Reserve</button>
        </div>
      `;
    }
  }
}

function bookCar(carId) {
  sessionStorage.setItem('preselectedCar', carId);
  showPage('booking');
}

// ============================================================
// 5. BOOKING PAGE & COST CALCULATION
// ============================================================
function setupBookingForm() {
  const cars = JSON.parse(localStorage.getItem('cars'));
  const dropdown = document.getElementById('car');
  dropdown.innerHTML = '';

  for (let i = 0; i < cars.length; i++) {
    dropdown.innerHTML += `<option value="${cars[i].id}">${cars[i].name} ($${cars[i].rate}/day)</option>`;
  }

  const pre = sessionStorage.getItem('preselectedCar');
  if (pre) dropdown.value = pre;
  sessionStorage.removeItem('preselectedCar');

  calculateCost();
}

function calculateCost() {
  const carId = document.getElementById('car').value;
  const pickup = document.getElementById('pickup').value;
  const dropoff = document.getElementById('ret').value;
  const plan = document.getElementById('plan').value;
  const cars = JSON.parse(localStorage.getItem('cars'));
  
  let selectedCar = null;
  for (let i = 0; i < cars.length; i++) {
    if (cars[i].id === carId) selectedCar = cars[i];
  }

  if (!pickup || !dropoff || new Date(dropoff) <= new Date(pickup)) {
    document.getElementById('dateError').classList.add('show');
    document.getElementById('cost').innerText = '$0.00';
    return;
  }
  document.getElementById('dateError').classList.remove('show');

  const days = Math.ceil((new Date(dropoff) - new Date(pickup)) / 86400000);
  let total = 0;

  if (plan === 'daily') {
    total = days * selectedCar.rate;
  } else if (plan === 'weekly') {
    total = Math.floor(days / 7) * selectedCar.rate * 6.5 + (days % 7) * selectedCar.rate;
  } else {
    total = Math.floor(days / 30) * selectedCar.rate * 22 + (days % 30) * selectedCar.rate;
  }

  document.getElementById('cost').innerText = '$' + total.toFixed(2);
  document.getElementById('cost').setAttribute('data-total', total);
  document.getElementById('cost').setAttribute('data-days', days);
}

function submitBooking(event) {
  event.preventDefault();
  const user = getCurrentUser();
  
  if (!user || user.role !== 'customer') {
    alert('Please log in as a customer.');
    showPage('login');
    return;
  }

  // Validate Card
  const cardNum = document.getElementById('cardNum').value;
  const expiry = document.getElementById('expiry').value;
  const cvc = document.getElementById('cvc').value;
  const cardError = document.getElementById('cardErr');

  if (cardNum.length < 13 || expiry.length < 5 || cvc.length < 3) {
    cardError.classList.add('show');
    return;
  }
  cardError.classList.remove('show');

  // Create Booking
  const cars = JSON.parse(localStorage.getItem('cars'));
  let carName = '';
  for (let i = 0; i < cars.length; i++) {
    if (cars[i].id === document.getElementById('car').value) carName = cars[i].name;
  }

  const booking = {
    ref: 'AZ' + Date.now(),
    customer: user.email,
    carName: carName,
    pickup: document.getElementById('pickup').value,
    ret: document.getElementById('ret').value,
    rentalCost: Number(document.getElementById('cost').getAttribute('data-total')),
    damages: 0,
    status: 'reserved'
  };

  const allBookings = JSON.parse(localStorage.getItem('bookings'));
  allBookings.push(booking);
  localStorage.setItem('bookings', JSON.stringify(allBookings));

  sessionStorage.setItem('lastBooking', JSON.stringify(booking));
  document.getElementById('bookingForm').reset();
  showPage('confirmation');
  fillConfirmationTable();
}

// ============================================================
// 6. CONFIRMATION PAGE
// ============================================================
function fillConfirmationTable() {
  const booking = JSON.parse(sessionStorage.getItem('lastBooking'));
  const table = document.getElementById('confirmBody');
  
  if (!booking) {
    table.innerHTML = '<tr><td>No booking found.</td></tr>';
    return;
  }

  table.innerHTML = `
    <tr><td>Reference:</td><td>${booking.ref}</td></tr>
    <tr><td>Car:</td><td>${booking.carName}</td></tr>
    <tr><td>Pickup Date:</td><td>${booking.pickup}</td></tr>
    <tr><td>Return Date:</td><td>${booking.ret}</td></tr>
    <tr><td>Cost:</td><td><strong>$${booking.rentalCost}</strong></td></tr>
  `;
}

// ============================================================
// 7. EMPLOYEE DASHBOARD
// ============================================================
function loadEmployeeDashboard() {
  const bookings = JSON.parse(localStorage.getItem('bookings'));
  const table = document.getElementById('empBookingRows');
  table.innerHTML = '';

  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i];
    table.innerHTML += `
      <tr>
        <td>${b.ref}</td>
        <td>${b.customer}</td>
        <td>${b.carName}</td>
        <td>${b.status}</td>
        <td>
          <button class="btn small" onclick="inspectCar('${b.ref}')">Inspect</button>
        </td>
      </tr>
    `;
  }
}

function inspectCar(ref) {
  const bookings = JSON.parse(localStorage.getItem('bookings'));
  let target = null;
  for (let i = 0; i < bookings.length; i++) {
    if (bookings[i].ref === ref) target = bookings[i];
  }

  const damageCost = prompt('Enter damage cost (or 0 for none):', '0');
  target.damages = Number(damageCost);
  target.status = 'returned';

  localStorage.setItem('bookings', JSON.stringify(bookings));
  sessionStorage.setItem('lastBooking', JSON.stringify(target));
  alert('Inspection recorded. Total: $' + (target.rentalCost + target.damages));
  showPage('finalbill');
  showFinalBill();
}

// ============================================================
// 8. FINAL BILL PAGE
// ============================================================
function showFinalBill() {
  const booking = JSON.parse(sessionStorage.getItem('lastBooking'));
  const table = document.getElementById('billBody');
  
  if (!booking) return;

  const total = booking.rentalCost + booking.damages;
  table.innerHTML = `
    <tr><td>Car:</td><td>${booking.carName}</td></tr>
    <tr><td>Rental:</td><td>$${booking.rentalCost}</td></tr>
    <tr><td>Damages:</td><td>$${booking.damages}</td></tr>
    <tr><td><strong>Total:</strong></td><td><strong>$${total}</strong></td></tr>
  `;
}

function payFinalBill(event) {
  event.preventDefault();
  const booking = JSON.parse(sessionStorage.getItem('lastBooking'));
  
  booking.status = 'paid';
  
  const allBookings = JSON.parse(localStorage.getItem('bookings'));
  for (let i = 0; i < allBookings.length; i++) {
    if (allBookings[i].ref === booking.ref) {
      allBookings[i] = booking;
    }
  }
  localStorage.setItem('bookings', JSON.stringify(allBookings));
  
  alert('Payment successful!');
  showPage('home');
}

// ============================================================
// 9. LOGIN / REGISTER / BOOT
// ============================================================
function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  const user = loginUser(email, pass);

  if (user) {
    updateNavBar();
    if (user.role === 'employee') showPage('employee');
    else showPage('home');
  } else {
    document.getElementById('loginErr').classList.add('show');
  }
}

function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;

  const users = JSON.parse(localStorage.getItem('users'));
  users.push({ email: email, pass: pass, role: 'customer', name: name });
  localStorage.setItem('users', JSON.stringify(users));

  alert('Registered! Please log in.');
  showPage('login');
}

// Boot the app when the page loads
window.onload = function() {
  updateNavBar();
  showPage('home');
};