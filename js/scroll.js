/**
 * scroll.js - Sistema de Infinite Scroll
 * Responsável por:
 * - Detectar quando o usuário está perto do final da lista
 * - Carregar automaticamente mais produtos
 * - Usar IntersectionObserver para máxima performance
 */

class InfiniteScroll {
    constructor() {
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.scrollObserver = null;
        this.isLoading = false;
        this.initScrollObserver();
    }

    /**
     * Inicializa o IntersectionObserver para scroll infinito
     */
    initScrollObserver() {
        const options = {
            root: null,
            rootMargin: '500px', // Começar a carregar 500px antes do final
            threshold: 0
        };

        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Se o elemento carregador está visível e há mais produtos
                if (entry.isIntersecting && !this.isLoading && renderer.hasMoreProducts()) {
                    this.loadMore();
                }
            });
        }, options);

        // Observar o indicador de carregamento como ponto de disparo
        this.observeLoadingIndicator();
    }

    /**
     * Observa o indicador de carregamento
     */
    observeLoadingIndicator() {
        if (this.loadingIndicator) {
            this.scrollObserver.observe(this.loadingIndicator);
        }
    }

    /**
     * Carrega mais produtos
     */
    loadMore() {
        if (this.isLoading || !renderer.hasMoreProducts()) {
            return;
        }

        this.isLoading = true;
        renderer.showLoading();

        // Simular pequeno delay para melhor UX
        setTimeout(() => {
            renderer.loadNextBatch();
            this.isLoading = false;

            // Se ainda há produtos, continuar observando
            if (renderer.hasMoreProducts()) {
                this.scrollObserver.observe(this.loadingIndicator);
            }
        }, 100);
    }

    /**
     * Reseta o observador quando a lista é renovada
     */
    reset() {
        this.isLoading = false;
        if (this.loadingIndicator) {
            this.scrollObserver.observe(this.loadingIndicator);
        }
    }

    /**
     * Desativa o observador
     */
    disconnect() {
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
        }
    }
}

// Criar instância global
const infiniteScroll = new InfiniteScroll();
