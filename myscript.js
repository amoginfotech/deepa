let properties = [];

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

// Function to display properties
function displayProperties() {
    const propertiesList = document.getElementById('propertiesList');
    propertiesList.innerHTML = '';

    properties.forEach((property) => {
        const propertyCard = document.createElement('div');
        propertyCard.className = 'property-card';
        propertyCard.innerHTML = `
            <h3>${property.name}</h3>
            <p><strong>Address:</strong> ${property.address}</p>
            <p><strong>Type:</strong> ${property.type}</p>
            <p><strong>Size:</strong> ${property.size} sq ft</p>
            <p><strong>Monthly Rent:</strong> $${property.monthlyRent}</p>
            <p><strong>Security Deposit:</strong> $${property.deposit}</p>
            <p><strong>Lease Terms:</strong> ${property.leaseTerms} months</p>
            <button onclick="deleteProperty('${property.id}')" class="delete-btn">Delete</button>
        `;
        propertiesList.appendChild(propertyCard);
    });
}

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

    // Load properties when the page loads
    document.addEventListener('DOMContentLoaded', loadProperties);
});