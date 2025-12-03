/**
 * UI Module - Resolution picker and controls
 */

import { RESOLUTION_PRESETS, Resolution } from './config';
import './ui.css';

export interface UICallbacks {
    onGenerate: (width: number, height: number) => void;
    onExport: () => void;
}

/**
 * Creates and manages the UI overlay
 */
export class UI {
    private modal: HTMLElement | null = null;
    private controlsBar: HTMLElement | null = null;
    private selectedResolution: Resolution;
    private defaultPresetIndex: number;
    private customWidth: number = 1920;
    private customHeight: number = 1080;
    private isCustom: boolean = false;
    private callbacks: UICallbacks;
    private hasGeneratedOnce: boolean = false;

    constructor(callbacks: UICallbacks) {
        this.callbacks = callbacks;
        this.defaultPresetIndex = this.getDefaultPresetIndex();
        this.selectedResolution = RESOLUTION_PRESETS[this.defaultPresetIndex];
    }

    /**
     * Detect if device is mobile and return appropriate default preset index
     */
    private getDefaultPresetIndex(): number {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || (window.innerWidth <= 768);
        
        if (isMobile) {
            // Find "Phone Portrait" preset
            const phoneIndex = RESOLUTION_PRESETS.findIndex(p => p.name === 'Phone Portrait');
            return phoneIndex >= 0 ? phoneIndex : 0;
        }
        
        // Desktop: 4K Ultra HD (index 0)
        return 0;
    }

    /**
     * Initialize the UI - creates modal and attaches to DOM
     */
    init(): void {
        this.createModal();
    }

    /**
     * Show the resolution picker modal
     */
    showModal(): void {
        if (this.modal) {
            this.modal.classList.add('visible');
        }
    }

    /**
     * Hide the modal
     */
    hideModal(): void {
        if (this.modal) {
            this.modal.classList.remove('visible');
        }
    }

    /**
     * Show the controls bar (after generation)
     */
    showControls(): void {
        if (!this.controlsBar) {
            this.createControlsBar();
        }
        this.controlsBar?.classList.add('visible');
    }

    /**
     * Update controls bar with current resolution info
     */
    updateResolutionDisplay(width: number, height: number): void {
        const resLabel = this.controlsBar?.querySelector('.resolution-label');
        if (resLabel) {
            resLabel.textContent = `${width} × ${height}`;
        }
    }

    private createModal(): void {
        const overlay = document.createElement('div');
        overlay.className = 'cue-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'cue-modal';

        modal.innerHTML = `
            <h1 class="cue-title">Cue</h1>
            <p class="cue-subtitle">Generative stained glass</p>
            
            <p class="cue-section-label">Choose resolution</p>
            <div class="cue-presets">
                ${RESOLUTION_PRESETS.map((preset, i) => `
                    <button class="cue-preset ${i === this.defaultPresetIndex ? 'selected' : ''}" data-index="${i}">
                        <p class="cue-preset-name">${preset.name}</p>
                        <p class="cue-preset-dims">${preset.width} × ${preset.height}</p>
                    </button>
                `).join('')}
            </div>

            <div class="cue-custom-toggle">
                <div class="cue-checkbox">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <span class="cue-custom-label">Custom dimensions</span>
            </div>

            <div class="cue-custom-inputs">
                <input type="number" class="cue-input" id="custom-width" placeholder="Width" value="1920" min="100" max="8192">
                <span class="cue-times">×</span>
                <input type="number" class="cue-input" id="custom-height" placeholder="Height" value="1080" min="100" max="8192">
            </div>

            <button class="cue-generate-btn">Send Cue</button>
            
            <p class="cue-hint">Click the canvas to regenerate with new colors</p>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this.modal = overlay;

        this.attachModalEvents(modal);
        
        // Close modal when clicking outside (on overlay background)
        // Only allow closing if user has generated at least once
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && this.hasGeneratedOnce) {
                this.hideModal();
            }
        });
    }

    private attachModalEvents(modal: HTMLElement): void {
        // Preset selection
        const presets = modal.querySelectorAll('.cue-preset');
        presets.forEach((preset) => {
            preset.addEventListener('click', () => {
                presets.forEach(p => p.classList.remove('selected'));
                preset.classList.add('selected');
                const index = parseInt(preset.getAttribute('data-index') || '0');
                this.selectedResolution = RESOLUTION_PRESETS[index];
                this.isCustom = false;
                
                // Uncheck custom toggle
                const checkbox = modal.querySelector('.cue-checkbox');
                const inputs = modal.querySelector('.cue-custom-inputs');
                checkbox?.classList.remove('checked');
                inputs?.classList.remove('active');
            });
        });

        // Custom toggle
        const customToggle = modal.querySelector('.cue-custom-toggle');
        const checkbox = modal.querySelector('.cue-checkbox');
        const customInputs = modal.querySelector('.cue-custom-inputs');

        customToggle?.addEventListener('click', () => {
            this.isCustom = !this.isCustom;
            checkbox?.classList.toggle('checked', this.isCustom);
            customInputs?.classList.toggle('active', this.isCustom);
            
            if (this.isCustom) {
                // Deselect presets
                const presets = modal.querySelectorAll('.cue-preset');
                presets.forEach(p => p.classList.remove('selected'));
            }
        });

        // Custom input changes
        const widthInput = modal.querySelector('#custom-width') as HTMLInputElement;
        const heightInput = modal.querySelector('#custom-height') as HTMLInputElement;

        widthInput?.addEventListener('change', () => {
            this.customWidth = Math.max(100, Math.min(8192, parseInt(widthInput.value) || 1920));
            widthInput.value = String(this.customWidth);
        });

        heightInput?.addEventListener('change', () => {
            this.customHeight = Math.max(100, Math.min(8192, parseInt(heightInput.value) || 1080));
            heightInput.value = String(this.customHeight);
        });

        // Generate button
        const generateBtn = modal.querySelector('.cue-generate-btn');
        generateBtn?.addEventListener('click', () => {
            const width = this.isCustom ? this.customWidth : this.selectedResolution.width;
            const height = this.isCustom ? this.customHeight : this.selectedResolution.height;
            
            this.hideModal();
            this.showControls();
            this.updateResolutionDisplay(width, height);
            this.callbacks.onGenerate(width, height);
            this.hasGeneratedOnce = true;
        });
    }

    private createControlsBar(): void {
        const controls = document.createElement('div');
        controls.className = 'cue-controls';

        controls.innerHTML = `
            <span class="resolution-label">0 × 0</span>
            <div class="cue-controls-divider"></div>
            <button class="cue-icon-btn" id="btn-settings" title="Change resolution">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
            </button>
            <button class="cue-icon-btn" id="btn-download" title="Download image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
            </button>
        `;

        document.body.appendChild(controls);
        this.controlsBar = controls;

        // Settings button - reopen modal
        const settingsBtn = controls.querySelector('#btn-settings');
        settingsBtn?.addEventListener('click', () => {
            this.showModal();
        });

        // Download button
        const downloadBtn = controls.querySelector('#btn-download');
        downloadBtn?.addEventListener('click', () => {
            this.callbacks.onExport();
        });
    }

    /**
     * Show a progress indicator during export
     */
    showProgress(text: string): HTMLElement {
        let progress = document.querySelector('.cue-progress') as HTMLElement;
        if (!progress) {
            progress = document.createElement('div');
            progress.className = 'cue-progress';
            progress.innerHTML = `<p class="cue-progress-text">${text}</p>`;
            document.body.appendChild(progress);
        } else {
            const textEl = progress.querySelector('.cue-progress-text');
            if (textEl) textEl.textContent = text;
        }
        progress.classList.add('visible');
        return progress;
    }

    /**
     * Update progress text
     */
    updateProgress(text: string): void {
        const progress = document.querySelector('.cue-progress');
        const textEl = progress?.querySelector('.cue-progress-text');
        if (textEl) textEl.textContent = text;
    }

    /**
     * Hide progress indicator
     */
    hideProgress(): void {
        const progress = document.querySelector('.cue-progress');
        progress?.classList.remove('visible');
    }
}

