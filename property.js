let properties = [];

// Form submission handler
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('addPropertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const property = {
            name: document.getElementById('propertyName').value,
            address: document.getElementById('address').value,
            monthlyRent: parseFloat(document.getElementById('monthlyRent').value)
        };
        await saveProperty(property);
        new bootstrap.Modal(document.getElementById('addPropertyModal')).hide();
    });
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
    await loadProperties(); // Load initial properties
});

// Function to load properties from Firestore
async function loadProperties() {
    try {
        console.log('Attempting to load properties from Firestore...');
        const snapshot = await db.collection('properties').get();
        console.log('Firestore query completed:', snapshot.empty ? 'No documents found' : `Found ${snapshot.size} documents`);
        properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayProperties(properties);
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
        displayProperties(properties);
    } catch (error) {
        console.error('Error saving property:', error);
    }
}

// Function to display properties
function displayProperties(properties) {
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
        displayProperties(properties);
        return;
    }
    const searchLower = searchTerm.toLowerCase();
    const filtered = properties.filter(p => {
        const name = p.name ? p.name.toLowerCase() : '';
        const address = p.address ? p.address.toLowerCase() : '';
        return name.includes(searchLower) || address.includes(searchLower);
    });
    displayProperties(filtered);
}

window.updateProperty = async function(id, updatedData) {
    try {
        await db.collection('properties').doc(id).update(updatedData);
        const index = properties.findIndex(p => p.id === id);
        properties[index] = { id, ...updatedData };
        displayProperties(properties);
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
/*
window.deleteProperty = async function(id) {
    try {
        await db.collection('properties').doc(id).delete();
        properties = properties.filter(property => property.id !== id);
        displayProperties(properties);
    } catch (error) {
        console.error('Error deleting property:', error);
    }
}
*/