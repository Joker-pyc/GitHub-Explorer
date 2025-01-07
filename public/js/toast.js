//js/toast.js
class Toast {
    constructor() {
        this.toastContainer = this.createToastContainer();
    }
  
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-end';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
        return container;
    }
  
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.margin = '5px';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.color = 'white';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s, transform 0.5s';
        toast.style.cursor = 'pointer';
        toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        toast.style.transform = 'translateX(100%)';
  
        switch (type) {
            case 'success':
                toast.style.backgroundColor = '#4CAF50';
                break;
            case 'error':
                toast.style.backgroundColor = '#f44336';
                break;
            case 'warning':
                toast.style.backgroundColor = '#ff9800';
                break;
            default:
                toast.style.backgroundColor = '#2196F3';
        }
  
        this.toastContainer.appendChild(toast);
  
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
  
        // Auto-hide and remove after `duration`
        const timeoutId = setTimeout(() => {
            this.hide(toast);
        }, duration);
  
        // Allow manual closing
        toast.onclick = () => {
            clearTimeout(timeoutId);
            this.hide(toast);
        };
    }
  
    hide(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }
  }
  
  window.Toast = Toast;