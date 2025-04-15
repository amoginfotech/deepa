let properties = [];
let tenants = [];

// Function to load tenants from Firestore
async function loadTenants() {
    try {
        console.log('Attempting to load tenants from Firestore...');
        const snapshot = await db.collection('tenants').get();
        console.log('Firestore query completed:', snapshot.empty ? 'No documents found' : `Found ${snapshot.size} documents`);
        tenants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayTenants();
    } catch (error) {
        console.error('Error loading tenants:', error);
        console.error('Error details:', error.code, error.message);
    }
}

// Function to display tenants
function displayTenants() {
    const tenantsList = document.getElementById('tenantsList');
    tenantsList.innerHTML = '';

    tenants.forEach((tenant) => {
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

// Function to update tenant
window.updateTenant = async function(id, updatedData) {
    try {
        await db.collection('tenants').doc(id).update(updatedData);
        const index = tenants.findIndex(t => t.id === id);
        tenants[index] = { id, ...updatedData };
        displayTenants();
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
});

// Function to delete a tenant
window.deleteTenant = async function(id) {
    try {
        await db.collection('tenants').doc(id).delete();
        tenants = tenants.filter(tenant => tenant.id !== id);
        displayTenants();
    } catch (error) {
        console.error('Error deleting tenant:', error);
    }
}

// Function to load properties from Firestore
async function loadProperties() {
    try {
        console.log('Attempting to load properties from Firestore...');
        const snapshot = await db.collection('properties').get();
        console.log('Firestore query completed:', snapshot.empty ? 'No documents found' : `Found ${snapshot.size} documents`);
        properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayProperties();
    } catch (error) {
        console.error('Error loading properties:', error);
        console.error('Error details:', error.code, error.message);
    }
}

// Function to save property to Firestore
async function saveProperty(property) {
    try {
        const docRef = await db.collection('properties').add(property);
        console.info('saving property:', property);
        properties.push({ id: docRef.id, ...property });
        displayProperties();
    } catch (error) {
        console.error('Error saving property:', error);
    }
}

// Function to save tenant to Firestore
async function saveTenant(tenant) {
    try {
        const docRef = await db.collection('tenants').add(tenant);
        console.info('saving tenant:', tenant);
        tenants.push({ id: docRef.id, ...tenant });
        // Optionally add tenant to a tenants array if needed
    } catch (error) {
        console.error('Error saving tenant:', error);
    }
}

// Function to display properties
function displayProperties() {
    const propertiesList = document.getElementById('propertiesList');
    propertiesList.innerHTML = '<tr><th>Name</th><th>Address</th><th>Type</th><th>Size</th><th>Monthly Rent</th><th>Deposit</th><th>Lease Terms</th><th>Actions</th></tr>';

    properties.forEach((property) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${property.name}</td>
            <td>${property.address}</td>
            <td>${property.type}</td>
            <td>${property.size} sq ft</td>
            <td>$${property.monthlyRent}</td>
            <td>$${property.deposit}</td>
            <td>${property.leaseTerms} months</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="openEditPropertyModal('${property.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProperty('${property.id}')">Delete</button>
            </td>
        `;
        propertiesList.appendChild(row);
    });
}

// Function to open edit property modal
window.openEditPropertyModal = function(id) {
    const property = properties.find(p => p.id === id);
    document.getElementById('editPropertyName').value = property.name;
    document.getElementById('editAddress').value = property.address;
    document.getElementById('editRent').value = property.monthlyRent;
    document.getElementById('editPropertyForm').dataset.propertyId = id;
    new bootstrap.Modal(document.getElementById('editPropertyModal')).show();
}

// Function to update property
window.updateProperty = async function(id, updatedData) {
    try {
        await db.collection('properties').doc(id).update(updatedData);
        const index = properties.findIndex(p => p.id === id);
        properties[index] = { id, ...updatedData };
        displayProperties();
    } catch (error) {
        console.error('Error updating property:', error);
    }
}

// Event listener for edit property form submission
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('editPropertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = this.dataset.propertyId;
        const updatedData = {
            name: document.getElementById('editPropertyName').value,
            address: document.getElementById('editAddress').value,
            monthlyRent: parseFloat(document.getElementById('editRent').value)
        };
        await updateProperty(id, updatedData);
        new bootstrap.Modal(document.getElementById('editPropertyModal')).hide();
    });
});

// Function to delete a property
window.deleteProperty = async function(id) {
    try {
        await db.collection('properties').doc(id).delete();
        properties = properties.filter(property => property.id !== id);
        displayProperties();
    } catch (error) {
        console.error('Error deleting property:', error);
    }
}

// Form submission handler
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing application...');
    
    // Wait for Firebase to initialize
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
    loadProperties(); // Load initial properties
    loadTenants(); // Load initial tenants

    // Add event listener for form submission
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const property = {
            name: document.getElementById('propertyName').value,
            address: document.getElementById('address').value,
            type: document.getElementById('propertyType').value,
            size: parseInt(document.getElementById('size').value),
            monthlyRent: parseFloat(document.getElementById('monthlyRent').value),
            deposit: parseFloat(document.getElementById('deposit').value),
            leaseTerms: parseInt(document.getElementById('leaseTerms').value)
        };
    
        await saveProperty(property);
        this.reset();
    });

    // Add event listener for tenant form submission
    document.getElementById('tenantForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const tenant = {
            propertyName: document.getElementById('propertyName').value,
            tenantName: document.getElementById('tenantName').value,
            adhar: document.getElementById('adhar').value,
            phone: document.getElementById('phone').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            advance: parseFloat(document.getElementById('advance').value),
            rent: parseFloat(document.getElementById('rent').value),
            revisedDate: document.getElementById('revisedDate').value,
            advPayDate: document.getElementById('advPayDate').value,
            advPayMode: document.getElementById('advPayMode').value,
            advPaidTo: document.getElementById('advPaidTo').value
        };
    
        await saveTenant(tenant);
        this.reset();
        window.location.href = 'index.html';
    });

    // Load properties when the page loads
    //document.addEventListener('DOMContentLoaded', loadProperties);
    document.addEventListener('DOMContentLoaded', loadTenants);

});