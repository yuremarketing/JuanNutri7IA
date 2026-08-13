document.addEventListener('DOMContentLoaded', () => {
    // Add hover sound effect logic (optional, keeping it visual for now)
    
    // Add interactive glow effect on cards based on mouse position
    const cards = document.querySelectorAll('.card.glow');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.background = `
                radial-gradient(
                    800px circle at ${x}px ${y}px, 
                    rgba(0, 255, 136, 0.06),
                    transparent 40%
                )
            `;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.background = 'rgba(255,255,255,0.02)';
        });
    });

    // Demo button interaction
    const demoBtn = document.getElementById('btn-demo');
    if (demoBtn) {
        demoBtn.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite"></i> Inicializando...';
            
            setTimeout(() => {
                this.innerHTML = '<i class="ri-check-line"></i> Módulos IA Ativados';
                this.style.background = '#00cc6a';
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.style.background = '';
                }, 3000);
            }, 1500);
        });
    }

    // Dynamic orb movement based on mouse
    document.addEventListener('mousemove', (e) => {
        const orbs = document.querySelectorAll('.orb');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 20;
            const xOffset = (window.innerWidth / 2 - e.pageX) / speed;
            const yOffset = (window.innerHeight / 2 - e.pageY) / speed;
            
            // Apply a subtle translation transform alongside the float animation
            // by updating CSS variables or inline styles carefully
            orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });
});

// Add keyframes dynamically for spin animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);
