let tenants = [];
let properties = [];

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
    
    if (!window.db) {
        console.error('Firestore database instance not initialized after multiple attempts!');
        alert('Failed to connect to the database. Please refresh the page and try again.');
        return;
    }
    
    console.log('Firestore database instance found, proceeding with data load...');
    await Promise.all([
        loadProperties(),
        loadTenants()
    ]);
});

// Function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Function to format date
function formatDate(date) {
    return date ? new Date(date).toLocaleDateString('en-IN') : '';
}

// Function to load properties from Firestore
async function loadProperties() {
    try {
        const snapshot = await db.collection('properties').get();
        properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        populatePropertyDropdowns();
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

// Function to populate property dropdowns
function populatePropertyDropdowns() {
    const addDropdown = document.getElementById('propertyName');
    const editDropdown = document.getElementById('editPropertyName');
    
    const sortedProperties = properties.sort((a, b) => {
        if (a.property_name < b.property_name) return -1;
        if (a.property_name > b.property_name) return 1;
        return 0;
    });
    
    const options = sortedProperties.map(property => 
        `<option value="${property.property_name}">${property.property_name}</option>`
    ).join('');
    
    addDropdown.innerHTML = '<option value="">Select Property</option>' + options;
    editDropdown.innerHTML = '<option value="">Select Property</option>' + options;
}

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
        displayTenants(tenants);
    } catch (error) {
        console.error('Error saving tenant:', error);
    }
}

// Function to display tenants
function displayTenants(tenantsToDisplay) {
    const tenantsList = document.getElementById('tenantsList');
    if (!tenantsList) {
        console.error('Tenants list element not found');
        return;
    }
    tenantsList.innerHTML = '<tr><th onclick="toggleSort(\'tenantName\')">Tenant Name ▲▼</th><th onclick="toggleSort(\'propertyName\')">Property Name ▲▼</th><th>Adhar</th><th>Phone</th><th>Start Date</th><th>End Date</th><th>Advance</th><th>Rent</th><th>Revise Date</th><th>Adv Pay Date</th><th>Adv Pay Mode</th><th>Last Update Date</th><th>Status</th><th>Actions</th></tr>';

    if (!tenantsToDisplay || !Array.isArray(tenantsToDisplay)) {
        console.error('Invalid tenants data:', tenantsToDisplay);
        return;
    }

    tenantsToDisplay.forEach((tenant) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tenant.tenantName || ''}</td>
            <td>${tenant.propertyName || ''}</td>
            <td>${tenant.adhar || ''}</td>
            <td>${tenant.phone || ''}</td>
            <td>${formatDate(tenant.startDate)}</td>
            <td>${formatDate(tenant.endDate)}</td>
            <td>${formatCurrency(tenant.advance || 0)}</td>
            <td>${formatCurrency(tenant.rent || 0)}</td>
            <td>${formatDate(tenant.reviseDate)}</td>
            <td>${formatDate(tenant.advPayDate)}</td>
            <td>${tenant.advPayMode || ''}</td>
            <td>${formatDate(tenant.lastUpdateDt)}</td>
            <td><span class="badge bg-${tenant.status === 'active' ? 'success' : tenant.status === 'inactive' ? 'danger' : 'warning'}">${tenant.status || ''}</span></td>
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
    document.getElementById('editTenantName').value = tenant.tenantName || '';
    document.getElementById('editPropertyName').value = tenant.propertyName || '';
    document.getElementById('editAdhar').value = tenant.adhar || '';
    document.getElementById('editPhone').value = tenant.phone || '';
    document.getElementById('editStartDate').value = tenant.startDate || '';
    document.getElementById('editEndDate').value = tenant.endDate || '';
    document.getElementById('editAdvance').value = tenant.advance || '';
    document.getElementById('editRent').value = tenant.rent || '';
    document.getElementById('editReviseDate').value = tenant.reviseDate || '';
    document.getElementById('editAdvPayDate').value = tenant.advPayDate || '';
    document.getElementById('editAdvPayMode').value = tenant.advPayMode || 'cash';
    document.getElementById('editStatus').value = tenant.status || 'active';
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

let sortDirection = { tenantName: 1, propertyName: 1 };

function sortTenants(tenants, field) {
    return tenants.sort((a, b) => {
        if (a[field] < b[field]) return -1 * sortDirection[field];
        if (a[field] > b[field]) return 1 * sortDirection[field];
        return 0;
    });
}

window.toggleSort = function(field) {
    sortDirection[field] = sortDirection[field] === 1 ? -1 : 1;
    const sorted = sortTenants(tenants, field);
    displayTenants(sorted);
    const header = document.querySelector(`th[data-field="${field}"]`);
    if (header) {
        header.innerHTML = `${field} <i class="bi bi-arrow-${sortDirection[field] === 1 ? 'up' : 'down'}"></i>`;
    }
}

window.handleSearch = function(searchTerm) {
    if (!searchTerm) {
        displayTenants(tenants);
        return;
    }
    const searchLower = searchTerm.toLowerCase();
    const filtered = tenants.filter(p => {
        const tname = p.tenantName ? p.tenantName.toLowerCase() : '';
        const pname = p.propertyName ? p.propertyName.toLowerCase() : '';
        const adhar = p.adhar ? p.adhar.toLowerCase() : '';
        return tname.includes(searchLower) || pname.includes(searchLower) || adhar.includes(searchLower);
    });
    displayTenants(filtered);
}

// Function to update tenant
window.updateTenant = async function(id, updatedData) {
    try {
        updatedData.lastUpdateDt = new Date().toISOString().split('T')[0];
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
            adhar: document.getElementById('editAdhar').value,
            phone: document.getElementById('editPhone').value,
            startDate: document.getElementById('editStartDate').value,
            endDate: document.getElementById('editEndDate').value || null,
            advance: parseFloat(document.getElementById('editAdvance').value) || 0,
            rent: parseFloat(document.getElementById('editRent').value) || 0,
            reviseDate: document.getElementById('editReviseDate').value,
            advPayDate: document.getElementById('editAdvPayDate').value,
            advPayMode: document.getElementById('editAdvPayMode').value,
            status: document.getElementById('editStatus').value
        };
        await updateTenant(id, updatedData);
        new bootstrap.Modal(document.getElementById('editTenantModal')).hide();
    });

    document.getElementById('addTenantForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const newTenant = {
            tenantName: document.getElementById('tenantName').value,
            propertyName: document.getElementById('propertyName').value,
            adhar: document.getElementById('adhar').value,
            phone: document.getElementById('phone').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value || null,
            advance: parseFloat(document.getElementById('advance').value) || 0,
            rent: parseFloat(document.getElementById('rent').value) || 0,
            reviseDate: document.getElementById('reviseDate').value,
            advPayDate: document.getElementById('advPayDate').value,
            advPayMode: document.getElementById('advPayMode').value,
            status: document.getElementById('status').value,
            lastUpdateDt: new Date().toISOString().split('T')[0]
        };
        await saveTenant(newTenant);
        this.reset();
        new bootstrap.Modal(document.getElementById('addTenantModal')).hide();
    });
});

// Function to delete a tenant
/*window.deleteTenant = async function(id) {
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
}*/