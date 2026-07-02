/**
 * csv.js - Carregamento e Processamento de CSV
 * Responsável por:
 * - Carregar o arquivo CSV
 * - Parsejar com PapaParse
 * - Detectar automaticamente os cabeçalhos
 * - Converter linhas em objetos JavaScript
 */

class CSVManager {
    constructor() {
        this.products = [];
        this.headers = [];
        this.isLoading = false;
    }

    /**
     * Carrega o arquivo CSV e o processa
     * @param {string} filePath - Caminho do arquivo CSV
     * @returns {Promise<Array>} Array de produtos
     */
    async loadCSV(filePath) {
        this.isLoading = true;

        const csvUrl = this.normalizeCsvUrl(filePath);

        try {
            if (!csvUrl) {
                throw new Error('Caminho do CSV não foi definido.');
            }

            const products = [];
            return new Promise((resolve, reject) => {
                Papa.parse(csvUrl, {
                    download: true,
                    header: true, // Usar primeira linha como cabeçalhos
                    skipEmptyLines: true,
                    worker: true,
                    chunk: (results) => {
                        if (results && results.data && results.data.length > 0) {
                            const chunkProducts = this.processProducts(results.data, results.meta.fields);
                            products.push(...chunkProducts);
                            if (this.headers.length === 0 && results.meta.fields) {
                                this.headers = results.meta.fields;
                            }
                        }
                    },
                    complete: () => {
                        this.products = products;
                        this.isLoading = false;
                        resolve(this.products);
                    },
                    error: (error) => {
                        console.error('Erro ao parsear CSV:', error);
                        this.isLoading = false;
                        reject(error);
                    }
                });
            });
        } catch (error) {
            this.isLoading = false;
            console.error('Erro ao carregar arquivo CSV:', error);
            throw error;
        }
    }

    normalizeCsvUrl(filePath) {
        if (!filePath) {
            return '';
        }

        const trimmedPath = String(filePath).trim();

        if (!trimmedPath.includes('drive.google.com')) {
            return trimmedPath;
        }

        const fileIdMatch = trimmedPath.match(/(?:\/d\/|[?&]id=)([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
        }

        return trimmedPath;
    }

    /**
     * Processa e valida os produtos
     * @param {Array} rawData - Dados brutos do CSV
     * @param {Array} headers - Cabeçalhos do CSV
     * @returns {Array} Produtos processados
     */
    processProducts(rawData, headers) {
        return rawData
            .filter(row => this.isValidProduct(row, headers))
            .map((row, index) => this.createProductObject(row, index))
            .filter(product => product !== null);
    }

    /**
     * Valida se uma linha é um produto válido
     * @param {Object} row - Linha do CSV
     * @param {Array} headers - Cabeçalhos
     * @returns {boolean}
     */
    isValidProduct(row, headers) {
        // Verificar se a linha tem dados
        if (!row || Object.keys(row).length === 0) {
            return false;
        }

        // Verificar se tem pelo menos um valor não vazio
        return Object.values(row).some(value => value && String(value).trim() !== '');
    }

    /**
     * Cria um objeto produto com campos padronizados
     * Detecta automaticamente os campos disponíveis
     * @param {Object} row - Linha do CSV
     * @param {number} index - Índice do produto
     * @returns {Object|null} Objeto produto ou null
     */
    createProductObject(row, index) {
        try {
            const product = {
                id: row.itemid || `produto-${index}`,
                title: this.sanitizeString(row.title || ''),
                description: this.sanitizeString(row.description || ''),
                price: this.parsePrice(row.price),
                salePrice: this.parsePrice(row.sale_price),
                discount: this.parseNumber(row.discount_percentage),
                image: this.sanitizeString(row.image_link || row.image_link_3 || ''),
                category: this.sanitizeString(row.global_category1 || row.global_category2 || ''),
                categoryCode: row.global_catid1 || row.global_catid2 || '',
                rating: this.parseNumber(row.item_rating),
                shopRating: this.parseNumber(row.shop_rating),
                likes: this.parseNumber(row.like),
                sold: this.parseNumber(row.sale_price) > 0 ? Math.floor(Math.random() * 1000) : 0,
                shop: this.sanitizeString(row.shop_name || 'Shopee'),
                productLink: this.sanitizeString(row.product_link || row.product_short_link || ''),
                condition: this.sanitizeString(row.condition || 'Novo'),
                model: this.sanitizeString(row.model_names || ''),
                cbOption: this.sanitizeString(row.cb_option || 'Cross border')
            };

            // Validação básica
            if (!product.title || !product.price) {
                return null;
            }

            return product;
        } catch (error) {
            console.warn(`Erro ao processar produto no índice ${index}:`, error);
            return null;
        }
    }

    /**
     * Sanitiza strings removendo espaços extras
     * @param {string} str - String a sanitizar
     * @returns {string}
     */
    sanitizeString(str) {
        if (!str) return '';
        return String(str)
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, 500);
    }

    /**
     * Converte string para número (preço)
     * @param {string|number} value - Valor a converter
     * @returns {number}
     */
    parsePrice(value) {
        if (!value) return 0;
        const num = parseFloat(String(value).replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : Math.max(0, num);
    }

    /**
     * Converte string para número (geral)
     * @param {string|number} value - Valor a converter
     * @returns {number}
     */
    parseNumber(value) {
        if (!value) return 0;
        const num = parseFloat(String(value).replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : num;
    }

    /**
     * Retorna todos os produtos
     * @returns {Array}
     */
    getProducts() {
        return this.products;
    }

    /**
     * Retorna o número total de produtos
     * @returns {number}
     */
    getTotalProducts() {
        return this.products.length;
    }

    /**
     * Retorna categorias únicas
     * @returns {Array}
     */
    getCategories() {
        const categories = new Set(
            this.products
                .map(p => p.category)
                .filter(c => c && c.trim() !== '')
        );
        
        return Array.from(categories).sort();
    }

    /**
     * Filtra produtos por categoria
     * @param {string} category - Categoria
     * @returns {Array}
     */
    getProductsByCategory(category) {
        if (!category || category === 'all') {
            return this.products;
        }
        return this.products.filter(p => p.category === category);
    }
}

// Criar instância global
const csvManager = new CSVManager();
