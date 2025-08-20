// DOM Elements
const form = document.getElementById('ppt-form');
const inputText = document.getElementById('input-text');
const guidanceInput = document.getElementById('guidance');
const apiKeyInput = document.getElementById('api-key');
const pptxFileInput = document.getElementById('pptx-file');
const generateBtn = document.getElementById('generate-btn');
const downloadSection = document.getElementById('download-section');
const downloadBtn = document.getElementById('download-btn');
const statusMessage = document.getElementById('status');
const togglePasswordBtn = document.getElementById('toggle-password');
const fileUploadArea = document.getElementById('file-upload-area');
const fileSelected = document.getElementById('file-selected');
const removeFileBtn = document.getElementById('remove-file');
const charCount = document.getElementById('char-count');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateCharacterCount();
});

function initializeEventListeners() {
    // Form submission
    form.addEventListener('submit', handleFormSubmission);
    
    // Character counter
    inputText.addEventListener('input', updateCharacterCount);
    
    // Password toggle
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    
    // File upload handling
    pptxFileInput.addEventListener('change', handleFileSelection);
    removeFileBtn.addEventListener('click', removeSelectedFile);
    
    // Drag and drop for file upload
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleFileDrop);
    
    // Provider selection handling
    const providerInputs = document.querySelectorAll('input[name="provider"]');
    providerInputs.forEach(input => {
        input.addEventListener('change', handleProviderChange);
    });
}

function updateCharacterCount() {
    const count = inputText.value.length;
    charCount.textContent = count.toLocaleString();
    
    // Add visual feedback for character count
    if (count > 10000) {
        charCount.style.color = 'var(--warning-color)';
    } else if (count > 5000) {
        charCount.style.color = 'var(--primary-color)';
    } else {
        charCount.style.color = 'var(--text-light)';
    }
}

function togglePasswordVisibility() {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    
    const icon = togglePasswordBtn.querySelector('i');
    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
}

function handleFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        showSelectedFile(file);
    }
}

function showSelectedFile(file) {
    const fileName = fileSelected.querySelector('.file-name');
    fileName.textContent = file.name;
    
    fileUploadArea.querySelector('.file-upload-content').style.display = 'none';
    fileSelected.style.display = 'flex';
    fileUploadArea.style.border = '2px solid var(--success-color)';
    fileUploadArea.style.background = 'rgba(16, 185, 129, 0.05)';
}

function removeSelectedFile() {
    pptxFileInput.value = '';
    fileSelected.style.display = 'none';
    fileUploadArea.querySelector('.file-upload-content').style.display = 'block';
    fileUploadArea.style.border = '2px dashed var(--border-color)';
    fileUploadArea.style.background = 'var(--bg-secondary)';
}

function handleDragOver(event) {
    event.preventDefault();
    fileUploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    fileUploadArea.classList.remove('dragover');
}

function handleFileDrop(event) {
    event.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.pptx') || file.name.endsWith('.potx')) {
            pptxFileInput.files = files;
            showSelectedFile(file);
        } else {
            showStatusMessage('Please upload a valid PowerPoint file (.pptx or .potx)', 'error');
        }
    }
}

function handleProviderChange(event) {
    const provider = event.target.value;
    updateApiKeyPlaceholder(provider);
}

function updateApiKeyPlaceholder(provider) {
    const placeholders = {
        'openai': 'Enter your OpenAI API key (sk-...)',
        'anthropic': 'Enter your Anthropic API key (sk-ant-...)',
        'gemini': 'Enter your Gemini API key'
    };
    
    apiKeyInput.placeholder = placeholders[provider] || 'Enter your API key';
}

async function handleFormSubmission(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideStatusMessage();
    downloadSection.style.display = 'none';
    
    // Prepare form data
    const formData = new FormData();
    formData.append('input_text', inputText.value.trim());
    formData.append('guidance', guidanceInput.value.trim());
    formData.append('api_key', apiKeyInput.value.trim());
    
    // Get selected provider
    const selectedProvider = document.querySelector('input[name="provider"]:checked');
    if (selectedProvider) {
        formData.append('provider', selectedProvider.value);
    }
    
    // Add file if selected
    const pptxFile = pptxFileInput.files[0];
    if (pptxFile) {
        formData.append('pptx_file', pptxFile);
    }
    
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to generate presentation');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Setup download functionality
        downloadBtn.onclick = function() {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'generated_presentation.pptx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Track download
            trackEvent('presentation_downloaded');
        };
        
        // Show success state
        downloadSection.style.display = 'block';
        showStatusMessage('Presentation generated successfully!', 'success');
        
        // Track successful generation
        trackEvent('presentation_generated', {
            provider: selectedProvider?.value,
            hasTemplate: !!pptxFile,
            contentLength: inputText.value.length
        });
        
    } catch (error) {
        console.error('Generation error:', error);
        showStatusMessage(error.message || 'Failed to generate presentation. Please try again.', 'error');
        
        // Track error
        trackEvent('generation_error', {
            error: error.message
        });
    } finally {
        setLoadingState(false);
    }
}

function validateForm() {
    const errors = [];
    
    // Check required fields
    if (!inputText.value.trim()) {
        errors.push('Please enter your content');
        inputText.focus();
    }
    
    if (!apiKeyInput.value.trim()) {
        errors.push('Please enter your API key');
        if (errors.length === 1) apiKeyInput.focus();
    }
    
    // Check content length
    if (inputText.value.trim().length < 50) {
        errors.push('Please provide more content (at least 50 characters)');
        if (errors.length === 1) inputText.focus();
    }
    
    // Check API key format based on provider
    const selectedProvider = document.querySelector('input[name="provider"]:checked');
    if (selectedProvider && apiKeyInput.value.trim()) {
        const apiKey = apiKeyInput.value.trim();
        const provider = selectedProvider.value;
        
        if (provider === 'openai' && !apiKey.startsWith('sk-')) {
            errors.push('OpenAI API keys should start with "sk-"');
        } else if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
            errors.push('Anthropic API keys should start with "sk-ant-"');
        }
    }
    
    if (errors.length > 0) {
        showStatusMessage(errors[0], 'error');
        return false;
    }
    
    return true;
}

function setLoadingState(isLoading) {
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoader = generateBtn.querySelector('.btn-loader');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
        generateBtn.disabled = true;
        form.classList.add('loading');
    } else {
        btnText.style.display = 'flex';
        btnLoader.style.display = 'none';
        generateBtn.disabled = false;
        form.classList.remove('loading');
    }
}

function showStatusMessage(message, type = 'error') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideStatusMessage();
        }, 5000);
    }
    
    // Scroll to status message
    statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideStatusMessage() {
    statusMessage.style.display = 'none';
    statusMessage.className = 'status-message';
}

// Analytics/tracking function (placeholder)
function trackEvent(eventName, properties = {}) {
    // This is a placeholder for analytics tracking
    // You can integrate with Google Analytics, Mixpanel, etc.
    console.log('Event tracked:', eventName, properties);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to submit form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!generateBtn.disabled) {
            form.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear status message
    if (event.key === 'Escape') {
        hideStatusMessage();
    }
});

// Auto-save form data to localStorage (optional)
function saveFormData() {
    const formData = {
        inputText: inputText.value,
        guidance: guidanceInput.value,
        provider: document.querySelector('input[name="provider"]:checked')?.value
    };
    
    localStorage.setItem('ppt-generator-form', JSON.stringify(formData));
}

function loadFormData() {
    try {
        const savedData = localStorage.getItem('ppt-generator-form');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            if (data.inputText) inputText.value = data.inputText;
            if (data.guidance) guidanceInput.value = data.guidance;
            if (data.provider) {
                const providerInput = document.querySelector(`input[name="provider"][value="${data.provider}"]`);
                if (providerInput) providerInput.checked = true;
            }
            
            updateCharacterCount();
        }
    } catch (error) {
        console.warn('Failed to load saved form data:', error);
    }
}

// Auto-save on input changes (debounced)
let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveFormData, 1000);
}

// Add auto-save listeners
inputText.addEventListener('input', debouncedSave);
guidanceInput.addEventListener('input', debouncedSave);

// Load saved data on page load
document.addEventListener('DOMContentLoaded', loadFormData);

// Clear saved data on successful generation
function clearSavedData() {
    localStorage.removeItem('ppt-generator-form');
}

// Add this to the success handler in handleFormSubmission
// clearSavedData(); // Uncomment if you want to clear saved data after successful generation