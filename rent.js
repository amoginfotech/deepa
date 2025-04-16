let rents = [];

// Form submission handler
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing application...');
    
    let retries = 0;
    const maxRetries = 5;
    
    while (!window.db && retries < maxRetries) {
        console.log('Waiting for Firestore to initialize...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
    }
    
    // Verify Firestore connection
    if (!window.db) {
        console.error('Firestore database instance not initialized after multiple attempts!');
        alert('Failed to connect to the database. Please refresh the page and try again.');
        return;
    }
    
    console.log('Firestore database instance found, proceeding with data load...');
    await loadRents(); // Load initial rents

});

// Function to load rents from Firestore
async function loadRents() {
    try {
        console.log('Attempting to load rents from Firestore...');
        const snapshot = await db.collection('rent').get();
        console.log('Firestore query completed:', snapshot.empty ? 'No documents found' : `Found ${snapshot.size} documents`);
        rents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayRents();
    } catch (error) {
        console.error('Error loading rents:', error);
        console.error('Error details:', error.code, error.message);
    }
}

// Function to save rent to Firestore
async function saveRent(rent) {
    try {
        const docRef = await db.collection('rent').add(rent);
        console.info('saving rent:', rent);
        rents.push({ id: docRef.id, ...rent });
        displayRents();
    } catch (error) {
        console.error('Error saving rent:', error);
    }
}

// Function to display rents
// Function to display rents
function displayRents(rentsToDisplay = rents) {
    const rentsList = document.getElementById('rentsList');
    rentsList.innerHTML = '<tr><th>Property Name</th><th>Tenant Name</th><th>Rent for the Month</th><th>Utility Bills</th><th>Rent Amount</th><th>Actions</th></tr>';

    rentsToDisplay.forEach((rent) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rent.propertyName}</td>
            <td>${rent.tenantName}</td>
            <td>${rent.rentMonth}</td>
            <td>${rent.utilityBills}</td>
            <td>${rent.rentAmount}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="openEditRentModal('${rent.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteRent('${rent.id}')">Delete</button>
            </td>
        `;
        rentsList.appendChild(row);
    });
}

// Function to open edit rent modal
window.openEditRentModal = function(id) {
    const rent = rents.find(r => r.id === id);
    document.getElementById('editPropertyName').value = rent.propertyName;
    document.getElementById('editTenantName').value = rent.tenantName;
    document.getElementById('editRentMonth').value = rent.rentMonth;
    document.getElementById('editUtilityBills').value = rent.utilityBills;
    document.getElementById('editRentAmount').value = rent.rentAmount;
    document.getElementById('editRentForm').dataset.rentId = id;
    new bootstrap.Modal(document.getElementById('editRentModal')).show();
}

// Function to update rent
window.updateRent = async function(id, updatedData) {
    try {
        await db.collection('rent').doc(id).update(updatedData);
        const index = rents.findIndex(r => r.id === id);
        rents[index] = { id, ...updatedData };
        displayRents();
    } catch (error) {
        console.error('Error updating rent:', error);
    }
}

// Function to delete a rent
window.deleteRent = async function(id) {
    if (!confirm('Are you sure you want to delete this rent record?')) {
        return;
    }
    try {
        await db.collection('rent').doc(id).delete();
        rents = rents.filter(rent => rent.id !== id);
        displayRents();
    } catch (error) {
        console.error('Error deleting rent:', error);
    }
}

// Add search input event listener
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }

    document.getElementById('addRentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const newRent = {
            propertyName: document.getElementById('propertyName').value,
            tenantName: document.getElementById('tenantName').value,
            rentMonth: document.getElementById('rentMonth').value,
            utilityBills: parseFloat(document.getElementById('utilityBills').value),
            rentAmount: parseFloat(document.getElementById('rentAmount').value)
        };
        await saveRent(newRent);
        this.reset();
        new bootstrap.Modal(document.getElementById('addRentModal')).hide();
    });
});

// Function to handle search
window.handleSearch = function(searchTerm) {
    if (!searchTerm) {
        displayRents();
        return;
    }
    const searchLower = searchTerm.toLowerCase();
    const filtered = rents.filter(r => {
        const propertyName = r.propertyName ? r.propertyName.toLowerCase() : '';
        const tenantName = r.tenantName ? r.tenantName.toLowerCase() : '';
        return propertyName.includes(searchLower) || tenantName.includes(searchLower);
    });
    displayRents(filtered);
}