let rents = [];
let properties = [];
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
    
    if (!window.db) {
        console.error('Firestore database instance not initialized after multiple attempts!');
        alert('Failed to connect to the database. Please refresh the page and try again.');
        return;
    }
    
    console.log('Firestore database instance found, proceeding with data load...');
    await Promise.all([
        loadRents(),
        loadProperties(),
        loadTenants()
    ]);

    // Initialize form event listeners
    initializeFormListeners();
});

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

// Function to load tenants from Firestore
async function loadTenants() {
    try {
        const snapshot = await db.collection('tenants').get();
        tenants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        populateTenantDropdowns();
    } catch (error) {
        console.error('Error loading tenants:', error);
    }
}

// Function to populate property dropdowns
function populatePropertyDropdowns() {
    const propertySelects = ['propertyName', 'editPropertyName'];
    propertySelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const sortedProperties = properties.sort((a, b) => {
                if (a.property_name < b.property_name) return -1;
                if (a.property_name > b.property_name) return 1;
                return 0;
            });
            select.innerHTML = '<option value="">Select Property</option>';
            sortedProperties.forEach(property => {
                select.innerHTML += `<option value="${property.property_name}">${property.property_name}</option>`;
            });
            
            // Add event listener for property selection
            select.addEventListener('change', async (e) => {
                const selectedProperty = e.target.value;
                if (selectedProperty) {
                    // Find tenants associated with the selected property
                    const propertyTenants = tenants.filter(tenant => tenant.propertyName === selectedProperty);
                    const tenantInput = document.getElementById('tenantName');
                    if (tenantInput) {
                        tenantInput.value = propertyTenants.length > 0 ? propertyTenants[0].tenantName : '';
                    }
                }
            });
        }
    });
}

// Function to populate tenant dropdowns
function populateTenantDropdowns() {
    const tenantSelects = ['tenantName', 'editTenantName'];
    tenantSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const sortedTenants = tenants.sort((a, b) => {
                if (a.tenantName < b.tenantName) return -1;
                if (a.tenantName > b.tenantName) return 1;
                return 0;
            });
            select.innerHTML = '<option value="">Select Tenant</option>';
            sortedTenants.forEach(tenant => {
                select.innerHTML += `<option value="${tenant.tenantName}">${tenant.tenantName}</option>`;
            });
        }
    });
}

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
        rent.lastupdt_dt = new Date().toISOString().split('T')[0];
        rent.balance = (rent.credit || 0) - (rent.debit || 0);
        const docRef = await db.collection('rent').add(rent);
        console.info('saving rent:', rent);
        rents.push({ id: docRef.id, ...rent });
        displayRents();
    } catch (error) {
        console.error('Error saving rent:', error);
    }
}

// Function to display rents
let sortDirection = { property_name: 1, tenantName: 1 };

function sortRents(rents, field) {
    return rents.sort((a, b) => {
        if (a[field] < b[field]) return -1 * sortDirection[field];
        if (a[field] > b[field]) return 1 * sortDirection[field];
        return 0;
    });
}

window.toggleSort = function(field) {
    sortDirection[field] = sortDirection[field] === 1 ? -1 : 1;
    const sorted = sortRents(rents, field);
    displayRents(sorted);
}

function displayRents(rentsToDisplay = rents) {
    const rentsList = document.getElementById('rentsList');
    rentsList.innerHTML = '';

    rentsToDisplay.forEach((rent) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rent.propertyName || ''}</td>
            <td>${rent.tenantName || ''}</td>
            <td>${rent.ledger_desc || ''}</td>
            <td>${rent.debit?.toFixed(2) || '0.00'}</td>
            <td>${rent.credit?.toFixed(2) || '0.00'}</td>
            <td>${rent.pymt_date || ''}</td>
            <td>${( rent.credit - rent.debit).toFixed(2)}</td>
            <td>${rent.lastupdt_dt || ''}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="openEditRentModal('${rent.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteRent('${rent.id}')">Delete</button>
            </td>
        `;
        rentsList.appendChild(row);
    });
}

// Function to initialize form listeners
function initializeFormListeners() {
    const addRentForm = document.getElementById('addRentForm');
    if (addRentForm) {
        // Add event listeners for debit and credit fields
        const debitField = addRentForm.querySelector('#debit');
        const creditField = addRentForm.querySelector('#credit');
        const balanceField = addRentForm.querySelector('#balance');



        addRentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const debit = parseFloat(this.debit.value) || 0;
            const credit = parseFloat(this.credit.value) || 0;
            const newRent = {
                propertyName: this.propertyName.value,
                tenantName: this.tenantName.value,
                ledger_desc: this.ledgerDesc.value,
                debit: debit,
                credit: credit,
                pymt_date: this.pymtDate.value
            };
            await saveRent(newRent);
            this.reset();
            new bootstrap.Modal(document.getElementById('addRentModal')).hide();
        });
    }

    const editRentForm = document.getElementById('editRentForm');
    if (editRentForm) {
        // Add event listeners for edit form debit and credit fields
        const editDebitField = document.getElementById('editDebit');
        const editCreditField = document.getElementById('editCredit');
        const editBalanceField = document.getElementById('editBalance');



        editRentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const id = this.dataset.rentId;
            const debit = parseFloat(document.getElementById('editDebit').value) || 0;
            const credit = parseFloat(document.getElementById('editCredit').value) || 0;
            const updatedData = {
                propertyName: document.getElementById('editPropertyName').value,
                tenantName: document.getElementById('editTenantName').value,
                ledger_desc: document.getElementById('editLedgerDesc').value,
                debit: debit,
                credit: credit,
                pymt_date: document.getElementById('editPymtDate').value,
                lastupdt_dt: new Date().toISOString().split('T')[0]
            };
            await updateRent(id, updatedData);
        });
    }
}

// Function to open edit rent modal
window.openEditRentModal = function(id) {
    const rent = rents.find(r => r.id === id);
    document.getElementById('editPropertyName').value = rent.propertyName || '';
    document.getElementById('editTenantName').value = rent.tenantName || '';
    document.getElementById('editLedgerDesc').value = rent.ledger_desc || '';
    document.getElementById('editDebit').value = rent.debit || 0;
    document.getElementById('editCredit').value = rent.credit || 0;
    document.getElementById('editPymtDate').value = rent.pymt_date || '';
    document.getElementById('editRentForm').dataset.rentId = id;
    new bootstrap.Modal(document.getElementById('editRentModal')).show();

    // Add event listener for property dropdown change
    const propertySelect = document.getElementById('editPropertyName');
    if (propertySelect) {
        propertySelect.addEventListener('change', (e) => {
            const selectedProperty = e.target.value;
            if (selectedProperty) {
                // Find tenants associated with the selected property
                const propertyTenants = tenants.filter(tenant => tenant.propertyName === selectedProperty);
                const tenantInput = document.getElementById('editTenantName');
                if (tenantInput) {
                    tenantInput.value = propertyTenants.length > 0 ? propertyTenants[0].tenantName : '';
                }
            }
        });
    }

    if (rent) {
        document.getElementById('editPropertyName').value = rent.propertyName || '';
        document.getElementById('editTenantName').value = rent.tenantName || '';
        document.getElementById('editLedgerDesc').value = rent.ledger_desc || '';
        document.getElementById('editDebit').value = rent.debit || 0;
        document.getElementById('editCredit').value = rent.credit || 0;
        document.getElementById('editPymtDate').value = rent.pymt_date || '';
        document.getElementById('editRentForm').dataset.rentId = id;
        new bootstrap.Modal(document.getElementById('editRentModal')).show();
    } else {
        console.error('Rent data not found for id:', id);
    }
}

// Function to update rent
window.updateRent = async function(id, updatedData) {
    try {
        updatedData.balance = (updatedData.credit || 0) - (updatedData.debit || 0);
        await db.collection('rent').doc(id).update(updatedData);
        const index = rents.findIndex(r => r.id === id);
        rents[index] = { id, ...updatedData };
        displayRents();
        new bootstrap.Modal(document.getElementById('editRentModal')).hide();
    } catch (error) {
        console.error('Error updating rent:', error);
    }
}

// Function to delete a rent
/*window.deleteRent = async function(id) {
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
}*/

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
        const ledgerDesc = r.ledger_desc ? r.ledger_desc.toLowerCase() : '';
        return propertyName.includes(searchLower) || 
               tenantName.includes(searchLower) || 
               ledgerDesc.includes(searchLower);
    });
    displayRents(filtered);
}