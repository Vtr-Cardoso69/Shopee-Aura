/**
 * search.js - Sistema de Pesquisa Instantânea
 * Responsável por:
 * - Filtrar produtos conforme o usuário digita
 * - Atualizar a interface em tempo real
 * - Gerenciar categorias
 * - Combinar filtros de pesquisa e categoria
 */

class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.categoryContainer = document.getElementById('categoryContainer');
        this.allProducts = [];
        this.selectedCategory = 'all';
        this.searchTerm = '';
        this.debounceTimeout = null;
        this.initEventListeners();
    }

    /**
     * Inicializa os event listeners
     */
    initEventListeners() {
        // Event listener para pesquisa com debounce
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });

        // Permitir busca imediata ao pressionar Enter
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(this.debounceTimeout);
                this.handleSearch(this.searchInput.value);
            }
        });
    }

    /**
     * Define a lista de todos os produtos
     * @param {Array} products - Array de produtos
     */
    setProducts(products) {
        this.allProducts = products;
    }

    /**
     * Cria e renderiza os botões de categorias
     * @param {Array} categories - Array de categorias
     */
    createCategories(categories) {
        this.categoryContainer.innerHTML = '';

        // Botão "Todas as Categorias"
        const allButton = document.createElement('button');
        allButton.className = 'category-btn active';
        allButton.dataset.category = 'all';
        allButton.textContent = '✓ Todas as Categorias';
        allButton.addEventListener('click', () => this.selectCategory('all'));
        this.categoryContainer.appendChild(allButton);

        // Botões de categorias
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.dataset.category = category;
            button.textContent = category;
            button.addEventListener('click', () => this.selectCategory(category));
            this.categoryContainer.appendChild(button);
        });
    }

    /**
     * Seleciona uma categoria
     * @param {string} category - Categoria a selecionar
     */
    selectCategory(category) {
        this.selectedCategory = category;

        // Atualizar UI dos botões
        document.querySelectorAll('.category-btn').forEach(btn => {
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Aplicar filtros
        this.applyFilters();
    }

    /**
     * Trata o evento de pesquisa
     * @param {string} term - Termo de pesquisa
     */
    handleSearch(term) {
        this.searchTerm = term.toLowerCase().trim();
        this.applyFilters();
    }

    /**
     * Aplica os filtros de pesquisa e categoria
     */
    applyFilters() {
        let filtered = this.allProducts;

        // Filtrar por categoria
        if (this.selectedCategory !== 'all') {
            filtered = filtered.filter(product => 
                product.category === this.selectedCategory
            );
        }

        // Filtrar por termo de pesquisa
        if (this.searchTerm) {
            filtered = filtered.filter(product => 
                this.matchesSearch(product)
            );
        }

        // Renderizar resultados
        renderer.renderProducts(filtered);
    }

    /**
     * Verifica se um produto corresponde ao termo de pesquisa
     * @param {Object} product - Produto a verificar
     * @returns {boolean}
     */
    matchesSearch(product) {
        const term = this.searchTerm;

        // Procurar em múltiplos campos
        return (
            product.title.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term) ||
            product.shop.toLowerCase().includes(term)
        );
    }

    /**
     * Limpa a pesquisa
     */
    clearSearch() {
        this.searchInput.value = '';
        this.searchTerm = '';
        this.selectedCategory = 'all';
        this.applyFilters();
    }

    /**
     * Retorna o termo de pesquisa atual
     * @returns {string}
     */
    getSearchTerm() {
        return this.searchTerm;
    }

    /**
     * Retorna a categoria selecionada
     * @returns {string}
     */
    getSelectedCategory() {
        return this.selectedCategory;
    }
}

// Criar instância global
const searchManager = new SearchManager();
