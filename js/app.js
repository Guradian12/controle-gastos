/**
 * Arquivo principal da aplicação.
 *
 * Responsável por:
 * - inicializar o banco de dados;
 * - inicializar os módulos;
 * - montar a interface;
 * - tratar erros de inicialização.
 */

const App = {
  initialized: false,

  initializeModules() {
    Storage.initialize();

    if (typeof Categories !== "undefined") {
      Categories.initialize?.();
    }

    if (typeof Expenses !== "undefined") {
      Expenses.initialize?.();
    }

    if (typeof Poker !== "undefined") {
      Poker.initialize?.();
    }

    if (typeof Bets !== "undefined") {
      Bets.initialize?.();
    }

    if (typeof Dashboard !== "undefined") {
      Dashboard.initialize?.();
    }

    if (typeof Charts !== "undefined") {
      Charts.initialize?.();
    }
  },

  renderError(error) {
    console.error(
      "Erro ao iniciar a aplicação:",
      error
    );

    const root =
  document.querySelector(".main-content") ||
  document.body;

    root.innerHTML = `
      <main class="startup-error">
        <div class="startup-error-card">
          <div class="startup-error-icon">
            !
          </div>

          <h1>
            Não foi possível iniciar
          </h1>

          <p>
            Ocorreu um erro ao carregar a aplicação.
          </p>

          <button
            type="button"
            id="reload-app-button"
            class="button button-primary"
          >
            Tentar novamente
          </button>

          <details class="startup-error-details">
            <summary>
              Detalhes técnicos
            </summary>

            <pre>${UI?.escapeHTML?.(
              error?.message ||
              String(error)
            ) || String(error)}</pre>
          </details>
        </div>
      </main>
    `;

    document
      .getElementById("reload-app-button")
      ?.addEventListener(
        "click",
        () => {
          window.location.reload();
        }
      );
  },

  initialize() {
    if (this.initialized) {
      return {
        success: true,
        alreadyInitialized: true
      };
    }

    try {
      this.initializeModules();

      if (typeof UI === "undefined") {
        throw new Error(
          "O módulo UI não foi carregado."
        );
      }

      UI.initialize();

      this.initialized = true;

      console.info(
        "Aplicação iniciada com sucesso."
      );

      return {
        success: true
      };
    } catch (error) {
      this.renderError(error);

      return {
        success: false,
        error
      };
    }
  }
};

window.App = App;

document.addEventListener(
  "DOMContentLoaded",
  () => {
    App.initialize();
  }
);