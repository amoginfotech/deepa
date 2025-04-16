let properties = [];

// Form submission handler
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('addPropertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const property = {
            property_name: document.getElementById('propertyName').value,
            type: document.getElementById('type').value,
            specification: document.getElementById('specification').value,
            size: document.getElementById('size').value,
            address: document.getElementById('address').value,
            desc: document.getElementById('desc').value,
            bescom_no: document.getElementById('bescom_no').value,
            property_no: document.getElementById('property_no').value,
            bwwssb_no: document.getElementById('bwwssb_no').value,
            aquired_mode: document.getElementById('aquired_mode').value,
            aq_date: document.getElementById('aq_date').value,
            last_upd_dt: new Date().toISOString().split('T')[0]
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
    propertiesList.innerHTML = '<tr><th>Property Name</th><th>Type</th><th>Specification</th><th>Size</th><th>Address</th><th>Description</th><th>Bescom#</th><th>Property#</th><th>BWWSSB#</th><th>Acquired Mode</th><th>Acquisition Date</th><th>Last Updated Date</th><th>Actions</th></tr>';

    properties.forEach((property) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${property.property_name || ''}</td>
            <td>${property.type || ''}</td>
            <td>${property.specification || ''}</td>
            <td>${property.size || ''}</td>
            <td>${property.address || ''}</td>
            <td>${property.desc || ''}</td>
            <td>${property.bescom_no || ''}</td>
            <td>${property.property_no || ''}</td>
            <td>${property.bwwssb_no || ''}</td>
            <td>${property.aquired_mode || ''}</td>
            <td>${property.aq_date || ''}</td>
            <td>${property.last_upd_dt || ''}</td>
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
    document.getElementById('editPropertyName').value = property.property_name || '';
    document.getElementById('editType').value = property.type || '';
    document.getElementById('editSpecification').value = property.specification || '';
    document.getElementById('editSize').value = property.size || '';
    document.getElementById('editAddress').value = property.address || '';
    document.getElementById('editDesc').value = property.desc || '';
    document.getElementById('editBescomNo').value = property.bescom_no || '';
    document.getElementById('editPropertyNo').value = property.property_no || '';
    document.getElementById('editBwwssbNo').value = property.bwwssb_no || '';
    document.getElementById('editAquiredMode').value = property.aquired_mode || '';
    document.getElementById('editAqDate').value = property.aq_date || '';
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
        const name = p.property_name ? p.property_name.toLowerCase() : '';
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
            property_name: document.getElementById('editPropertyName').value,
            type: document.getElementById('editType').value,
            specification: document.getElementById('editSpecification').value,
            size: document.getElementById('editSize').value,
            address: document.getElementById('editAddress').value,
            desc: document.getElementById('editDesc').value,
            bescom_no: document.getElementById('editBescomNo').value,
            property_no: document.getElementById('editPropertyNo').value,
            bwwssb_no: document.getElementById('editBwwssbNo').value,
            aquired_mode: document.getElementById('editAquiredMode').value,
            aq_date: document.getElementById('editAqDate').value,
            last_upd_dt: new Date().toISOString().split('T')[0]
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