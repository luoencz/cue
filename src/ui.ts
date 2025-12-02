/**
 * UI Module - Resolution picker and controls
 */

import { RESOLUTION_PRESETS, Resolution } from './config';

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
        this.injectStyles();
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

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');

            :root {
                --cue-bg: #0a0908;
                --cue-surface: #151311;
                --cue-surface-hover: #1f1c19;
                --cue-border: #2a2622;
                --cue-text: #e8e4df;
                --cue-text-dim: #8a857e;
                --cue-accent: #c9a66b;
                --cue-accent-glow: rgba(201, 166, 107, 0.15);
                --cue-error: #d4776b;
            }

            .cue-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(10, 9, 8, 0.92);
                backdrop-filter: blur(20px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .cue-modal-overlay.visible {
                opacity: 1;
                pointer-events: auto;
            }

            .cue-modal {
                background: var(--cue-surface);
                border: 1px solid var(--cue-border);
                border-radius: 16px;
                padding: 48px;
                max-width: 560px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                transform: translateY(20px) scale(0.96);
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .cue-modal-overlay.visible .cue-modal {
                transform: translateY(0) scale(1);
            }

            .cue-title {
                font-family: 'Instrument Serif', Georgia, serif;
                font-size: 42px;
                font-weight: 400;
                color: var(--cue-text);
                margin: 0 0 8px 0;
                letter-spacing: -0.02em;
            }

            .cue-subtitle {
                font-family: 'DM Mono', monospace;
                font-size: 13px;
                color: var(--cue-text-dim);
                margin: 0 0 40px 0;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }

            .cue-section-label {
                font-family: 'DM Mono', monospace;
                font-size: 11px;
                color: var(--cue-text-dim);
                text-transform: uppercase;
                letter-spacing: 0.15em;
                margin: 0 0 16px 0;
            }

            .cue-presets {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin-bottom: 32px;
            }

            .cue-preset {
                background: transparent;
                border: 1px solid var(--cue-border);
                border-radius: 10px;
                padding: 16px;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s ease;
            }

            .cue-preset:hover {
                background: var(--cue-surface-hover);
                border-color: var(--cue-text-dim);
            }

            .cue-preset.selected {
                background: var(--cue-accent-glow);
                border-color: var(--cue-accent);
            }

            .cue-preset-name {
                font-family: 'DM Mono', monospace;
                font-size: 14px;
                font-weight: 500;
                color: var(--cue-text);
                margin: 0 0 4px 0;
            }

            .cue-preset-dims {
                font-family: 'DM Mono', monospace;
                font-size: 12px;
                color: var(--cue-text-dim);
                margin: 0;
            }

            .cue-custom-toggle {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
                cursor: pointer;
            }

            .cue-checkbox {
                width: 20px;
                height: 20px;
                border: 1px solid var(--cue-border);
                border-radius: 4px;
                background: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .cue-checkbox.checked {
                background: var(--cue-accent);
                border-color: var(--cue-accent);
            }

            .cue-checkbox svg {
                width: 12px;
                height: 12px;
                stroke: var(--cue-bg);
                stroke-width: 3;
                opacity: 0;
                transition: opacity 0.15s ease;
            }

            .cue-checkbox.checked svg {
                opacity: 1;
            }

            .cue-custom-label {
                font-family: 'DM Mono', monospace;
                font-size: 13px;
                color: var(--cue-text);
            }

            .cue-custom-inputs {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: 12px;
                align-items: center;
                margin-bottom: 32px;
                opacity: 0.4;
                pointer-events: none;
                transition: opacity 0.2s ease;
            }

            .cue-custom-inputs.active {
                opacity: 1;
                pointer-events: auto;
            }

            .cue-input {
                font-family: 'DM Mono', monospace;
                font-size: 16px;
                background: var(--cue-bg);
                border: 1px solid var(--cue-border);
                border-radius: 8px;
                padding: 14px 16px;
                color: var(--cue-text);
                width: 100%;
                text-align: center;
                transition: border-color 0.2s ease;
            }

            .cue-input:focus {
                outline: none;
                border-color: var(--cue-accent);
            }

            .cue-input::placeholder {
                color: var(--cue-text-dim);
            }

            .cue-times {
                font-family: 'DM Mono', monospace;
                font-size: 18px;
                color: var(--cue-text-dim);
            }

            .cue-generate-btn {
                width: 100%;
                font-family: 'Instrument Serif', Georgia, serif;
                font-size: 20px;
                font-style: italic;
                background: var(--cue-accent);
                color: var(--cue-bg);
                border: none;
                border-radius: 10px;
                padding: 18px 32px;
                cursor: pointer;
                transition: all 0.2s ease;
                letter-spacing: 0.02em;
            }

            .cue-generate-btn:hover {
                background: #d9b87b;
                transform: translateY(-1px);
            }

            .cue-generate-btn:active {
                transform: translateY(0);
            }

            /* Controls Bar */
            .cue-controls {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: var(--cue-surface);
                border: 1px solid var(--cue-border);
                border-radius: 12px;
                padding: 12px 20px;
                display: flex;
                align-items: center;
                gap: 20px;
                z-index: 100;
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .cue-controls.visible {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }

            .resolution-label {
                font-family: 'DM Mono', monospace;
                font-size: 13px;
                color: var(--cue-text-dim);
            }

            .cue-controls-divider {
                width: 1px;
                height: 24px;
                background: var(--cue-border);
            }

            .cue-icon-btn {
                background: transparent;
                border: none;
                padding: 8px;
                cursor: pointer;
                color: var(--cue-text-dim);
                border-radius: 6px;
                transition: all 0.15s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .cue-icon-btn:hover {
                background: var(--cue-surface-hover);
                color: var(--cue-text);
            }

            .cue-icon-btn svg {
                width: 20px;
                height: 20px;
            }

            .cue-hint {
                font-family: 'DM Mono', monospace;
                font-size: 11px;
                color: var(--cue-text-dim);
                text-align: center;
                margin-top: 24px;
            }

            /* Progress indicator */
            .cue-progress {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--cue-surface);
                border: 1px solid var(--cue-border);
                border-radius: 12px;
                padding: 24px 40px;
                z-index: 2000;
                display: none;
            }

            .cue-progress.visible {
                display: block;
            }

            .cue-progress-text {
                font-family: 'DM Mono', monospace;
                font-size: 14px;
                color: var(--cue-text);
            }
        `;
        document.head.appendChild(style);
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

