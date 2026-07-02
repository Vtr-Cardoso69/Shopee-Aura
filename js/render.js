/**
 * render.js - Renderização de Produtos
 * Responsável por:
 * - Renderizar produtos em cards
 * - Implementar lazy loading de imagens
 * - Atualizar contador de produtos
 * - Gerenciar o estado de renderização
 */

class ProductRenderer {
    constructor() {
        this.container = document.getElementById('productsContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.noResults = document.getElementById('noResults');
        this.productCount = document.getElementById('productCount');
        this.productsPerPage = 30;
        this.currentPage = 0;
        this.visibleProducts = [];
        this.imageObserver = null;
        this.initImageObserver();
    }

    /**
     * Inicializa o IntersectionObserver para lazy loading de imagens
     */
    initImageObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        img.src = src;
                        img.onload = () => {
                            img.classList.add('loaded');
                        };
                        img.onerror = () => {
                            // Se a imagem não carregar, manter o placeholder
                            console.warn(`Erro ao carregar imagem: ${src}`);
                        };
                        this.imageObserver.unobserve(img);
                    }
                }
            });
        }, options);
    }

    /**
     * Renderiza um lote de produtos
     * @param {Array} products - Array de produtos
     * @param {boolean} append - Se deve adicionar ao final (true) ou substituir (false)
     */
    renderProducts(products, append = false) {
        if (!append) {
            this.container.innerHTML = '';
            this.currentPage = 0;
        }

        if (products.length === 0) {
            this.showNoResults();
            return;
        }

        this.hideNoResults();
        this.visibleProducts = products;

        // Renderizar primeiro lote
        this.loadNextBatch();
    }

    /**
     * Carrega o próximo lote de produtos (infinite scroll)
     */
    loadNextBatch() {
        const start = this.currentPage * this.productsPerPage;
        const end = start + this.productsPerPage;
        const batch = this.visibleProducts.slice(start, end);

        if (batch.length === 0) {
            this.hideLoading();
            return;
        }

        batch.forEach(product => {
            const card = this.createProductCard(product);
            this.container.appendChild(card);
        });

        this.currentPage++;
        this.updateProductCount();

        // Se ainda há mais produtos, mostrar indicador de carregamento
        if (end < this.visibleProducts.length) {
            this.showLoading();
        } else {
            this.hideLoading();
        }
    }

    /**
     * Cria o elemento HTML de um card de produto
     * @param {Object} product - Objeto produto
     * @returns {HTMLElement}
     */
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;

        const hasDiscount = product.salePrice > 0 && product.salePrice < product.price;
        const discountPercent = hasDiscount ? Math.round(((product.price - product.salePrice) / product.price) * 100) : product.discount;
        const finalPrice = hasDiscount ? product.salePrice : product.price;

        const ratingStars = this.generateStars(product.rating);

        card.innerHTML = `
            <div class="product-image-wrapper">
                ${discountPercent > 0 ? `<div class="discount-badge">-${discountPercent}%</div>` : ''}
                ${product.cbOption.toLowerCase().includes('cross') ? '<div class="promotion-badge">Cross Border</div>' : ''}
                
                <img 
                    class="product-image" 
                    data-src="${this.escapeHtml(product.image)}"
                    alt="${this.escapeHtml(product.title)}"
                    loading="lazy"
                >
                <div class="product-image-placeholder"></div>
            </div>

            <div class="product-content">
                <div class="product-category">${this.escapeHtml(product.category || 'Diversos')}</div>
                
                <h3 class="product-title" title="${this.escapeHtml(product.title)}">
                    ${this.escapeHtml(product.title)}
                </h3>

                <div class="product-rating">
                    <span class="stars">${ratingStars}</span>
                    <span class="rating-value">${product.rating.toFixed(1)}</span>
                </div>

                <div class="product-sold">
                    ${this.formatNumber(product.sold)} vendidos
                </div>

                <div class="product-shop">
                    🏪 ${this.escapeHtml(product.shop)}
                </div>

                <div class="product-prices">
                    ${product.price > finalPrice ? `<span class="product-price-original">R$ ${product.price.toFixed(2)}</span>` : ''}
                    <div class="product-price-current">R$ ${finalPrice.toFixed(2)}</div>
                </div>

                <a 
                    href="${this.escapeHtml(product.productLink)}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="buy-button"
                >
                    Comprar na Shopee
                </a>
            </div>
        `;

        // Observar imagem para lazy loading
        const img = card.querySelector('.product-image');
        if (img) {
            this.imageObserver.observe(img);
        }

        return card;
    }

    /**
     * Gera string de estrelas baseada na nota
     * @param {number} rating - Nota de 0 a 5
     * @returns {string}
     */
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 > 0.5;
        let stars = '★'.repeat(fullStars);
        if (hasHalfStar) stars += '½';
        stars += '☆'.repeat(5 - Math.ceil(rating));
        return stars;
    }

    /**
     * Escapa caracteres HTML para segurança
     * @param {string} text - Texto a escapar
     * @returns {string}
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Formata número para exibição (ex: 1500 -> 1.5k)
     * @param {number} num - Número a formatar
     * @returns {string}
     */
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    /**
     * Atualiza o contador de produtos
     */
    updateProductCount() {
        const rawTotal = (typeof csvManager.getRawRowCount === 'function') ? csvManager.getRawRowCount() : 0;

        // Se houver busca ou categoria selecionada, mostrar o total filtrado (visibleProducts).
        const isFiltering = (typeof searchManager.getSearchTerm === 'function' && searchManager.getSearchTerm()) ||
            (typeof searchManager.getSelectedCategory === 'function' && searchManager.getSelectedCategory() !== 'all');

        const total = isFiltering ? this.visibleProducts.length : (csvManager.preserveInvalid && rawTotal > 0 ? rawTotal : this.visibleProducts.length);
        const displayed = Math.min(this.currentPage * this.productsPerPage, this.visibleProducts.length);
        this.productCount.textContent = `Mostrando ${displayed} de ${total} produtos`;
    }

    /**
     * Mostra o indicador de carregamento
     */
    showLoading() {
        this.loadingIndicator.classList.add('active');
    }

    /**
     * Oculta o indicador de carregamento
     */
    hideLoading() {
        this.loadingIndicator.classList.remove('active');
    }

    /**
     * Mostra mensagem de sem resultados
     */
    showNoResults() {
        this.noResults.style.display = 'block';
        this.productCount.textContent = 'Nenhum produto encontrado';
    }

    /**
     * Oculta mensagem de sem resultados
     */
    hideNoResults() {
        this.noResults.style.display = 'none';
    }

    /**
     * Limpa todos os produtos renderizados
     */
    clear() {
        this.container.innerHTML = '';
        this.currentPage = 0;
        this.visibleProducts = [];
        this.hideLoading();
        this.hideNoResults();
    }

    /**
     * Retorna o número de produtos visíveis
     * @returns {number}
     */
    getVisibleCount() {
        return this.visibleProducts.length;
    }

    /**
     * Verifica se há mais produtos para carregar
     * @returns {boolean}
     */
    hasMoreProducts() {
        return (this.currentPage * this.productsPerPage) < this.visibleProducts.length;
    }
}

// Criar instância global
const renderer = new ProductRenderer();
