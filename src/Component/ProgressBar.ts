export default class ProgressBar extends HTMLElement {
    constructor() {
        super();
        
        const shadow = this.attachShadow({ mode: 'open' });

        const container = document.createElement('div');
        container.className = 'progress-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar animated';

        const percentageText = document.createElement('span');
        percentageText.className = 'percentage-text';
        percentageText.textContent = `${this.getAttribute('value') || 0}%`;

        container.appendChild(progressBar);
        container.appendChild(percentageText);
        shadow.appendChild(container);

        const style = document.createElement('style');
        style.textContent = `
            .progress-container {
                width: 100%;
                background-color: #333;
                border-radius: 8px;
                overflow: hidden;
                height: 20px;
                margin: 10px 0;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .progress-bar {
                height: 100%;
                width: ${this.getAttribute('value') || 0}%;
                background-color: #4caf50;
                transition: width 0.3s ease, background-color 0.3s ease;
                border-radius: 8px;
                position: absolute;
                top: 0;
                left: 0;
            }
            .progress-bar::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                background: linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
                opacity: 0.5;
                transition: opacity 0.3s ease;
                animation: progress-bar-stripes 1s linear infinite;
            }
            @keyframes progress-bar-stripes {
                from {
                    background-position: 1rem 0;
                }
                to {
                    background-position: 0 0;
                }
            }
            .percentage-text {
                position: absolute;
                color: white;
                font-weight: bold;
                z-index: 1;
            }
        `;
        shadow.appendChild(style);
    }

    static get observedAttributes() {
        return ['value'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === 'value') {
            this.updateProgressBar(Number(newValue));
        }
    }
    
    updateProgressBar(percentage: number) {
        const progressBar = this.shadowRoot?.querySelector('.progress-bar') as HTMLElement || null;
        const percentageText = this.shadowRoot?.querySelector('.percentage-text') as HTMLElement || null;
        if (percentage >= 0 && percentage <= 100 && progressBar && percentageText) {
            progressBar.style.width = percentage + '%';
            progressBar.style.backgroundColor = this.getColorForPercentage(percentage);
            percentageText.textContent = percentage + '%';
        }
    }

    getColorForPercentage(percentage: number): string {
        if (percentage < 30) {
            return '#ff4d4d'; 
        } else if (percentage < 70) {
            return '#ffcc00'; 
        } else {
            return '#4caf50'; 
        }
    }
}