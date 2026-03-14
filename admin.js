// admin.js - Admin Panel Logic

// --- Session Guard ---
if (!localStorage.getItem('adminToken')) {
    window.location.replace('index.html');
}
function handleLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
}

function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    const content = document.getElementById('tab-' + tabId);
    if (content) content.classList.add('active');
    if (btn) btn.classList.add('active');
}

async function resetDatabase() {
    itemToDeleteId = 'all';
    itemToDeleteType = 'reset';
    document.getElementById('delete-modal-title').innerText = "Reset Database";
    document.getElementById('delete-modal-text').innerText = "WARNING: This will delete ALL custom data and restore the original seeded defaults. Are you absolutely sure?";
    deleteModal.classList.add('active');
}

// --- Modals ---
const destModal = document.getElementById('dest-modal');
const propModal = document.getElementById('prop-modal');
const deleteModal = document.getElementById('delete-modal');

let itemToDeleteId = null;
let itemToDeleteType = null;

function closeModals() {
    destModal.classList.remove('active');
    propModal.classList.remove('active');
    deleteModal.classList.remove('active');
    itemToDeleteId = null;
    itemToDeleteType = null;
}

// Global Delete Confirm Handler
document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
    if (itemToDeleteType === 'dest' && itemToDeleteId) {
        await deleteDestination(itemToDeleteId);
    } else if (itemToDeleteType === 'prop' && itemToDeleteId) {
        await deleteProperty(itemToDeleteId);
    } else if (itemToDeleteType === 'reset') {
        // For reset, we'll just re-init everything on the server
        await initDatabase(); 
    }
    await renderTables();
    closeModals();
});

// --- Image Handling Utility ---
function handleImageRead(fileInput, hiddenInputId) {
    const file = fileInput.files[0];
    const previewDivId = hiddenInputId.replace('-b64', '-preview');
    const previewDiv = document.getElementById(previewDivId);

    if (file) {
        // Enforce basic max file size (e.g. 5MB) so localStorage doesn't blow up too quickly
        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large! Please upload an image under 5MB.");
            fileInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onloadend = function() {
            document.getElementById(hiddenInputId).value = reader.result;
            if (previewDiv) {
                previewDiv.innerHTML = `<img src="${reader.result}" style="max-width: 100px; max-height: 100px; border-radius: 4px; border: 1px solid #ccc;">`;
            }
        };
        reader.readAsDataURL(file);
    } else {
        document.getElementById(hiddenInputId).value = "";
        if (previewDiv) previewDiv.innerHTML = "";
    }
}

// === DESTINATION LOGIC ===
async function renderDestinations() {
    const tbody = document.getElementById('dest-table-body');
    const destinations = await getDestinations();
    tbody.innerHTML = '';

    destinations.forEach(dest => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${dest.imagePath}" alt="${dest.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
            <td><strong>${dest.name}</strong></td>
            <td>${dest.description}</td>
            <td>
                <button class="btn btn-edit" onclick="editDest('${dest.id}')">Edit</button>
                <button class="btn btn-delete" onclick="removeDest('${dest.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Also update the select dropdown in the Property Modal
    const destSelect = document.getElementById('prop-dest-id');
    if (destSelect) {
        destSelect.innerHTML = destinations.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    }
}

async function openDestModal(id = null) {
    const form = document.getElementById('dest-form');
    form.reset();
    document.getElementById('dest-id').value = '';
    document.getElementById('dest-modal-title').innerText = 'Add Destination';

    if (id) {
        const dest = await getDestinationById(id);
        if(dest) {
            document.getElementById('dest-id').value = dest.id;
            document.getElementById('dest-name').value = dest.name;
            document.getElementById('dest-image-b64').value = dest.imagePath;
            
            const previewDiv = document.getElementById('dest-image-preview');
            if (previewDiv && dest.imagePath) {
                 previewDiv.innerHTML = `<img src="${dest.imagePath}" style="max-width: 100px; max-height: 100px; border-radius: 4px; border: 1px solid #ccc;">`;
            }
            // Clear the file input since we populated from DB
            document.getElementById('dest-image-file').value = "";
            document.getElementById('dest-image-file').removeAttribute('required'); // Unrequire if editing existing

            document.getElementById('dest-desc').value = dest.description;
            document.getElementById('dest-modal-title').innerText = 'Edit Destination';
        }
    } else {
        // Adding new
        document.getElementById('dest-image-file').setAttribute('required', 'true');
        const previewDiv = document.getElementById('dest-image-preview');
        if(previewDiv) previewDiv.innerHTML = "";
        document.getElementById('dest-image-b64').value = "";
    }
    destModal.classList.add('active');
}

async function editDest(id) { await openDestModal(id); }
function removeDest(id) {
    itemToDeleteId = id;
    itemToDeleteType = 'dest';
    document.getElementById('delete-modal-title').innerText = "Delete Destination";
    document.getElementById('delete-modal-text').innerText = "Are you sure you want to delete this destination? This will ALSO DELETE all properties associated with it!";
    deleteModal.classList.add('active');
}

document.getElementById('dest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('dest-id').value || generateId('dest');
    const dest = {
        id: id,
        name: document.getElementById('dest-name').value,
        imagePath: document.getElementById('dest-image-b64').value,
        description: document.getElementById('dest-desc').value
    };
    await saveDestination(dest);
    closeModals();
    await renderTables();
});

// === PROPERTY LOGIC ===
async function renderProperties() {
    const tbody = document.getElementById('prop-table-body');
    const properties = await getProperties();
    tbody.innerHTML = '';

    for (const prop of properties) {
        const dest = await getDestinationById(prop.destinationId);
        const destName = dest ? dest.name : 'Unknown';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${destName}</td>
            <td><strong>${prop.title}</strong></td>
            <td>${prop.propertyType}</td>
            <td>$${prop.basePrice.toLocaleString()}</td>
            <td>
                <button class="btn btn-edit" onclick="editProp('${prop.id}')">Edit</button>
                <button class="btn btn-delete" onclick="removeProp('${prop.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

// Helper to manage dynamic array inputs (e.g., images, features)
function addArrayField(containerId, namePrefix, inputType) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'array-input-group';
    div.innerHTML = `
        <input type="${inputType}" class="form-control dyn-input" required placeholder="Enter value...">
        <button type="button" class="btn btn-delete" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
}

// Specialized array image uploader
function addArrayImageField(containerId) {
    const container = document.getElementById(containerId);
    const uniqueId = `img-b64-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const div = document.createElement('div');
    div.className = 'array-input-group';
    div.innerHTML = `
        <input type="file" class="form-control" accept="image/*" onchange="handleImageRead(this, '${uniqueId}')" required>
        <input type="hidden" id="${uniqueId}" class="dyn-input-b64">
        <button type="button" class="btn btn-delete" onclick="this.parentElement.remove()">X</button>
        <div id="${uniqueId.replace('-b64', '-preview')}" style="margin-top: 8px;"></div>
    `;
    container.appendChild(div);
}

function getArrayValues(containerId) {
    const inputs = document.getElementById(containerId).querySelectorAll('.dyn-input');
    return Array.from(inputs).map(inp => inp.value).filter(val => val.trim() !== '');
}

function getArrayBase64Values(containerId) {
     const inputs = document.getElementById(containerId).querySelectorAll('.dyn-input-b64');
     return Array.from(inputs).map(inp => inp.value).filter(val => val.trim() !== '');
}

function populateArrayFields(containerId, inputType, values) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if(values && values.length) {
        values.forEach(val => {
            const div = document.createElement('div');
            div.className = 'array-input-group';
            div.innerHTML = `
                <input type="${inputType}" class="form-control dyn-input" required value="${val}">
                <button type="button" class="btn btn-delete" onclick="this.parentElement.remove()">X</button>
            `;
            container.appendChild(div);
        });
    }
}

// Specialized populate for pre-existing images in edit mode
function populateImageArrayFields(containerId, values) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (values && values.length) {
        values.forEach(val => {
            const uniqueId = `img-b64-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            const div = document.createElement('div');
            div.className = 'array-input-group';
            // It's pre-populated, so we omit 'required' on the file input itself if they don't want to change it
            div.innerHTML = `
                <div style="display:flex; flex-direction: column; width: 100%;">
                    <div style="display: flex; gap: 8px;">
                        <input type="file" class="form-control" accept="image/*" onchange="handleImageRead(this, '${uniqueId}')">
                        <button type="button" class="btn btn-delete" onclick="this.closest('.array-input-group').remove()">X</button>
                    </div>
                    <input type="hidden" id="${uniqueId}" class="dyn-input-b64" value="${val}">
                    <div id="${uniqueId.replace('-b64', '-preview')}" style="margin-top: 8px;">
                        <img src="${val}" style="max-width: 100px; max-height: 100px; border-radius: 4px; border: 1px solid #ccc;">
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }
}

async function openPropModal(id = null) {
    const form = document.getElementById('prop-form');
    form.reset();
    document.getElementById('prop-id').value = '';
    document.getElementById('prop-modal-title').innerText = 'Add Property';
    
    // Clear array containers
    ['prop-amenities-container', 'pkg-aff-features', 'pkg-val-features', 'pkg-lux-features'].forEach(cid => {
        document.getElementById(cid).innerHTML = '';
        addArrayField(cid, '', 'text'); // Add one blank
    });
    
    // Fix default image array
    document.getElementById('prop-images-container').innerHTML = '';
    addArrayImageField('prop-images-container');

    if (id) {
        const prop = await getPropertyById(id);
        if(prop) {
            document.getElementById('prop-id').value = prop.id;
            document.getElementById('prop-dest-id').value = prop.destinationId;
            document.getElementById('prop-title').value = prop.title;
            document.getElementById('prop-type').value = prop.propertyType || "Villa";
            document.getElementById('prop-price').value = prop.basePrice;
            document.getElementById('prop-rating').value = prop.rating;
            document.getElementById('prop-about').value = prop.aboutText;
            
            // Arrays
            populateImageArrayFields('prop-images-container', prop.images);
            populateArrayFields('prop-amenities-container', 'text', prop.amenities);

            // Packages
            if(prop.packages) {
                document.getElementById('pkg-aff-mult').value = prop.packages.affordable.multiplier;
                document.getElementById('pkg-aff-desc').value = prop.packages.affordable.desc;
                populateArrayFields('pkg-aff-features', 'text', prop.packages.affordable.features);

                document.getElementById('pkg-val-mult').value = prop.packages.value.multiplier;
                document.getElementById('pkg-val-desc').value = prop.packages.value.desc;
                populateArrayFields('pkg-val-features', 'text', prop.packages.value.features);

                document.getElementById('pkg-lux-mult').value = prop.packages.luxury.multiplier;
                document.getElementById('pkg-lux-desc').value = prop.packages.luxury.desc;
                populateArrayFields('pkg-lux-features', 'text', prop.packages.luxury.features);
            }

            document.getElementById('prop-modal-title').innerText = 'Edit Property';
        }
    }
    propModal.classList.add('active');
}

async function editProp(id) { await openPropModal(id); }
function removeProp(id) {
    itemToDeleteId = id;
    itemToDeleteType = 'prop';
    document.getElementById('delete-modal-title').innerText = "Delete Property";
    document.getElementById('delete-modal-text').innerText = "Are you sure you want to delete this property?";
    deleteModal.classList.add('active');
}

document.getElementById('prop-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prop-id').value || generateId('prop');
    
    const prop = {
        id: id,
        destinationId: document.getElementById('prop-dest-id').value,
        title: document.getElementById('prop-title').value,
        propertyType: document.getElementById('prop-type').value,
        basePrice: parseFloat(document.getElementById('prop-price').value),
        rating: parseFloat(document.getElementById('prop-rating').value),
        aboutText: document.getElementById('prop-about').value,
        images: getArrayBase64Values('prop-images-container'),
        amenities: getArrayValues('prop-amenities-container'),
        packages: {
            affordable: {
                name: "Affordable",
                multiplier: parseFloat(document.getElementById('pkg-aff-mult').value),
                desc: document.getElementById('pkg-aff-desc').value,
                features: getArrayValues('pkg-aff-features')
            },
            value: {
                name: "Value for Money",
                multiplier: parseFloat(document.getElementById('pkg-val-mult').value),
                desc: document.getElementById('pkg-val-desc').value,
                features: getArrayValues('pkg-val-features')
            },
            luxury: {
                name: "Luxury",
                multiplier: parseFloat(document.getElementById('pkg-lux-mult').value),
                desc: document.getElementById('pkg-lux-desc').value,
                features: getArrayValues('pkg-lux-features')
            }
        }
    };
    
    await saveProperty(prop);
    closeModals();
    await renderTables();
});

// Initialization
async function renderTables() {
    try {
        await renderDestinations();
        await renderProperties();
    } catch (e) {
        console.error("Error rendering tables:", e);
    }
}

// Initial Page Load
(async function() {
    try {
        await initDatabase();
        await renderTables();
    } catch (e) {
        console.error("Error during admin page load:", e);
    }
})();
