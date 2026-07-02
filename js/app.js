/**
 * app.js - Aplicação Principal
 * Responsável por:
 * - Inicializar a aplicação
 * - Coordenar o carregamento do CSV
 * - Configurar categorias
 * - Renderizar produtos iniciais
 */

class MarketplaceApp {
    constructor() {
        this.csvPath = '';
        this.isInitialized = false;
    }

    /**
     * Inicializa a aplicação
     */
    async init() {
        try {
            console.log('Iniciando ShopMarket...');
            
            // Mostrar indicador de carregamento
            renderer.showLoading();

            // Carregar CSV
            console.log(`Carregando CSV remoto: ${this.csvPath}`);
            const products = await csvManager.loadCSV(this.csvPath);
            
            console.log(`Total de produtos carregados: ${products.length}`);

            if (products.length === 0) {
                console.warn('Nenhum produto foi carregado do CSV');
                renderer.showNoResults();
                return;
            }

            // Configurar gerenciador de busca
            searchManager.setProducts(products);

            // Criar categorias
            const categories = csvManager.getCategories();
            console.log(`Categorias encontradas: ${categories.length}`);
            searchManager.createCategories(categories);

            // Renderizar produtos iniciais
            renderer.renderProducts(products);

            // Reseta scroll infinito
            infiniteScroll.reset();

            this.isInitialized = true;
            console.log('ShopMarket inicializado com sucesso!');

        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.showErrorMessage(error.message);
        }
    }

    /**
     * Exibe mensagem de erro
     * @param {string} message - Mensagem de erro
     */
    showErrorMessage(message) {
        const noResults = document.getElementById('noResults');
        if (noResults) {
            noResults.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <p style="font-size: 1.5rem; margin-bottom: 20px;">⚠️ Erro ao carregar dados</p>
                    <p style="color: var(--text-light); margin-bottom: 20px;">${message}</p>
                    <p style="font-size: 0.9rem; color: var(--text-light);">
                        Verifique se o link do CSV no Google Drive está público e se o arquivo está acessível.
                    </p>
                </div>
            `;
            noResults.style.display = 'block';
        }
        renderer.hideLoading();
    }

    /**
     * Retorna se a aplicação foi inicializada
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized;
    }
}

// Criar instância global
const app = new MarketplaceApp();

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    // DOM já foi carregado
    app.init();
}
