let originalImage = null;
let customSizes = [];
let currentMode = 'pwa';

const imageInput = document.getElementById('imageInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const imageDimensions = document.getElementById('imageDimensions');
const generateBtn = document.getElementById('generateBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const outputSection = document.getElementById('outputSection');
const outputGrid = document.getElementById('outputGrid');
const resetBtn = document.getElementById('resetBtn');
const uploadLabel = document.querySelector('.upload-label');
const addCustomBtn = document.getElementById('addCustomBtn');
const customWidth = document.getElementById('customWidth');
const customHeight = document.getElementById('customHeight');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        currentMode = tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        generateBtn.textContent = tab === 'pwa' ? 'Generate All' : 'Generate Favicons';
    });
});

// Handle file input
imageInput.addEventListener('change', handleImageUpload);

// Drag and drop
uploadLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadLabel.querySelector('.upload-box').classList.add('drag-over');
});

uploadLabel.addEventListener('dragleave', () => {
    uploadLabel.querySelector('.upload-box').classList.remove('drag-over');
});

uploadLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadLabel.querySelector('.upload-box').classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files[0]) {
        imageInput.files = files;
        handleImageUpload();
    }
});

function handleImageUpload() {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            showPreview(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showPreview(img) {
    previewImage.src = img.src;
    imageDimensions.textContent = `${img.width} × ${img.height} pixels`;
    previewSection.classList.remove('hidden');
    outputSection.classList.add('hidden');
    downloadAllBtn.classList.add('hidden');
}

// Add custom size
addCustomBtn.addEventListener('click', () => {
    const width = parseInt(customWidth.value);
    const height = parseInt(customHeight.value);
    
    if (!width || !height || width < 1 || height < 1) {
        alert('Please enter valid dimensions');
        return;
    }

    const sizeStr = `${width}x${height}`;
    if (!customSizes.includes(sizeStr)) {
        customSizes.push(sizeStr);
        
        const category = document.querySelector('.category:last-child');
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" class="sizeCheckbox" value="${sizeStr}" checked>
            ${width} × ${height} px
        `;
        category.insertBefore(label, category.querySelector('.custom-size'));
    }
});

// Generate images
generateBtn.addEventListener('click', generateImages);

function generateImages() {
    if (!originalImage) return;

    if (currentMode === 'pwa') {
        generatePWAImages();
    } else {
        generateFaviconImages();
    }
}

function generatePWAImages() {
    const selectedSizes = Array.from(document.querySelectorAll('.sizeCheckbox:checked')).map(el => el.value);
    
    if (selectedSizes.length === 0) {
        alert('Please select at least one size');
        return;
    }

    outputGrid.innerHTML = '';
    const resizedImages = [];

    selectedSizes.forEach(size => {
        const [width, height] = size.includes('x') 
            ? size.split('x').map(Number) 
            : [parseInt(size), parseInt(size)];

        const canvas = createResizedCanvas(width, height);

        const imageData = {
            canvas: canvas,
            size: size,
            width: width,
            height: height
        };
        resizedImages.push(imageData);
    });

    displayResizedImages(resizedImages, 'pwa');
    outputSection.classList.remove('hidden');
    downloadAllBtn.classList.remove('hidden');
}

function generateFaviconImages() {
    const selectedSizes = Array.from(document.querySelectorAll('.faviconCheckbox:checked')).map(el => parseInt(el.value));
    
    if (selectedSizes.length === 0) {
        alert('Please select at least one size');
        return;
    }

    outputGrid.innerHTML = '';
    const faviconImages = [];

    selectedSizes.forEach(size => {
        const canvas = createResizedCanvas(size, size);
        faviconImages.push({
            canvas: canvas,
            size: size,
            width: size,
            height: size
        });
    });

    // Generate .ico file if checked
    if (document.getElementById('generateIco').checked) {
        generateIcoFile(faviconImages);
    }

    // Generate manifest.json if checked
    if (document.getElementById('generateManifest').checked) {
        generateManifestFile(faviconImages);
    }

    displayResizedImages(faviconImages, 'favicon');
    outputSection.classList.remove('hidden');
    downloadAllBtn.classList.remove('hidden');
}

function createResizedCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate dimensions to maintain aspect ratio
    const imgAspect = originalImage.width / originalImage.height;
    const canvasAspect = width / height;
    let drawWidth, drawHeight, x, y;

    if (imgAspect > canvasAspect) {
        drawWidth = width;
        drawHeight = width / imgAspect;
        x = 0;
        y = (height - drawHeight) / 2;
    } else {
        drawHeight = height;
        drawWidth = height * imgAspect;
        x = (width - drawWidth) / 2;
        y = 0;
    }

    ctx.drawImage(originalImage, x, y, drawWidth, drawHeight);
    return canvas;
}

function displayResizedImages(images, mode) {
    outputGrid.innerHTML = '';
    
    images.forEach(imageData => {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        let buttonText = 'Download PNG';
        let downloadAction = () => downloadImage(imageData.canvas, `${imageData.width}x${imageData.height}.png`);
        
        if (mode === 'favicon') {
            buttonText = 'Download PNG';
        }
        
        card.innerHTML = `
            <div class="image-card-preview">
                <img src="${imageData.canvas.toDataURL('image/png')}" alt="${imageData.size}">
            </div>
            <div class="image-card-info">
                <div class="image-card-size">${imageData.width} × ${imageData.height}</div>
                <button class="image-card-download" data-size="${imageData.size}">${buttonText}</button>
            </div>
        `;
        
        card.querySelector('.image-card-download').addEventListener('click', downloadAction);
        outputGrid.appendChild(card);
    });
}

function downloadImage(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function generateIcoFile(faviconImages) {
    // Sort by size for .ico file (largest first for best quality)
    const sortedImages = [...faviconImages].sort((a, b) => b.width - a.width);
    
    const manifesto = {
        name: 'favicon.ico',
        sizes: sortedImages.map(img => `${img.width}x${img.width}`).join(', '),
        images: sortedImages
    };
    
    // Create a simple ico file card
    const card = document.createElement('div');
    card.className = 'image-card';
    card.innerHTML = `
        <div class="image-card-preview" style="background: linear-gradient(45deg, #667eea, #764ba2);">
            <div style="color: white; text-align: center; padding: 20px; font-size: 2rem;">🎯</div>
        </div>
        <div class="image-card-info">
            <div class="image-card-size">favicon.ico</div>
            <button class="image-card-download">Download ICO</button>
        </div>
    `;
    
    card.querySelector('.image-card-download').addEventListener('click', () => {
        downloadIcoFile(sortedImages);
    });
    
    outputGrid.appendChild(card);
}

function downloadIcoFile(images) {
    // Convert images to ico format using canvas2ico approach
    // For simplicity, we'll create a zip or just download the largest as ico
    const largestImage = images[0];
    const link = document.createElement('a');
    link.download = 'favicon.ico';
    link.href = largestImage.canvas.toDataURL('image/x-icon');
    link.click();
}

function generateManifestFile(faviconImages) {
    const manifest = {
        name: "My App",
        short_name: "App",
        icons: faviconImages.map(img => ({
            src: `favicon-${img.width}x${img.height}.png`,
            sizes: `${img.width}x${img.height}`,
            type: "image/png",
            purpose: "any"
        })),
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/"
    };

    // Create a manifest card
    const card = document.createElement('div');
    card.className = 'image-card';
    card.innerHTML = `
        <div class="image-card-preview" style="background: linear-gradient(45deg, #764ba2, #667eea);">
            <div style="color: white; text-align: center; padding: 20px; font-size: 2rem;">📋</div>
        </div>
        <div class="image-card-info">
            <div class="image-card-size">manifest.json</div>
            <button class="image-card-download">Download JSON</button>
        </div>
    `;
    
    card.querySelector('.image-card-download').addEventListener('click', () => {
        downloadManifestFile(manifest);
    });
    
    outputGrid.appendChild(card);
}

function downloadManifestFile(manifest) {
    const dataStr = JSON.stringify(manifest, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'manifest.json';
    link.click();
    URL.revokeObjectURL(url);
}

// Download all
downloadAllBtn.addEventListener('click', async () => {
    const selectedSizes = Array.from(document.querySelectorAll('.sizeCheckbox:checked')).map(el => el.value);
    const links = document.querySelectorAll('.image-card-download');
    
    let delay = 0;
    links.forEach(link => {
        setTimeout(() => {
            link.click();
        }, delay);
        delay += 200;
    });
});

// Reset
resetBtn.addEventListener('click', () => {
    imageInput.value = '';
    originalImage = null;
    customSizes = [];
    previewSection.classList.add('hidden');
    outputSection.classList.add('hidden');
    downloadAllBtn.classList.add('hidden');
});
