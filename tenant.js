let tenants = [];

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
    await loadTenants(); // Load initial tenants
});

// Function to load tenants from Firestore
async function loadTenants() {
    try {
        console.log('Attempting to load tenants from Firestore...');
        const snapshot = await db.collection('tenants').get();
        console.log('Firestore query completed:', snapshot.empty ? 'No documents found' : `Found ${snapshot.size} documents`);
        tenants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayTenants(tenants);
    } catch (error) {
        console.error('Error loading tenants:', error);
        console.error('Error details:', error.code, error.message);
    }
}

// Function to save tenant to Firestore
async function saveTenant(tenant) {
    try {
        const docRef = await db.collection('tenants').add(tenant);
        console.info('saving tenant:', tenant);
        tenants.push({ id: docRef.id, ...tenant });
    } catch (error) {
        console.error('Error saving tenant:', error);
    }
}

// Function to display properties
function displayTenants(tenantsToDisplay) {
    const tenantsList = document.getElementById('tenantsList');
    if (!tenantsList) {
        console.error('Tenants list element not found');
        return;
    }
    tenantsList.innerHTML = '';

    if (!tenantsToDisplay || !Array.isArray(tenantsToDisplay)) {
        console.error('Invalid tenants data:', tenantsToDisplay);
        return;
    }

    tenantsToDisplay.forEach((tenant) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tenant.tenantName}</td>
            <td>${tenant.propertyName}</td>
            <td>${tenant.phone}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="openEditTenantModal('${tenant.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTenant('${tenant.id}')">Delete</button>
            </td>
        `;
        tenantsList.appendChild(row);
    });
}


// Function to open edit tenant modal
window.openEditTenantModal = function(id) {
    const tenant = tenants.find(t => t.id === id);
    document.getElementById('editTenantName').value = tenant.tenantName;
    document.getElementById('editPropertyName').value = tenant.propertyName;
    document.getElementById('editPhone').value = tenant.phone;
    document.getElementById('editTenantForm').dataset.tenantId = id;
    new bootstrap.Modal(document.getElementById('editTenantModal')).show();
}

// Add search input event listener
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }
});

window.handleSearch = function(searchTerm) {
    //console.log('you are searching for:', searchTerm);
    if (!searchTerm) {
        displayTenants(tenants);
        return;
    }
    const searchLower = searchTerm.toLowerCase();
    const filtered = tenants.filter(p => {
        const tname = p.tenantName ? p.tenantName.toLowerCase() : '';
        const pname = p.propertyName ? p.propertyName.toLowerCase() : '';
        return tname.includes(searchLower) || pname.includes(searchLower);
    });
    displayTenants(filtered);
}
// Function to update tenant
window.updateTenant = async function(id, updatedData) {
    try {
        await db.collection('tenants').doc(id).update(updatedData);
        const index = tenants.findIndex(t => t.id === id);
        tenants[index] = { id, ...updatedData };
        displayTenants(tenants);
    } catch (error) {
        console.error('Error updating tenant:', error);
    }
}

// Event listener for edit tenant form submission
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('editTenantForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = this.dataset.tenantId;
        const updatedData = {
            tenantName: document.getElementById('editTenantName').value,
            propertyName: document.getElementById('editPropertyName').value,
            phone: document.getElementById('editPhone').value
        };
        await updateTenant(id, updatedData);
        new bootstrap.Modal(document.getElementById('editTenantModal')).hide();
    });

    document.getElementById('addTenantForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const newTenant = {
            tenantName: document.getElementById('tenantName').value,
            propertyName: document.getElementById('propertyName').value,
            phone: document.getElementById('phone').value
        };
        await saveTenant(newTenant);
        displayTenants(tenants);
        this.reset();
        new bootstrap.Modal(document.getElementById('addTenantModal')).hide();
    });
});

// Function to delete a tenant
window.deleteTenant = async function(id) {
    if (!confirm('Are you sure you want to delete this tenant?')) {
        return;
    }
    try {
        await db.collection('tenants').doc(id).delete();
        tenants = tenants.filter(tenant => tenant.id !== id);
        displayTenants(tenants);
    } catch (error) {
        console.error('Error deleting tenant:', error);
    }
}