/**
 * Interface visual da aplicação.
 *
 * Responsabilidades:
 * - montar a estrutura principal;
 * - controlar a navegação;
 * - renderizar o Dashboard;
 * - formatar cards, alertas e atividades;
 * - solicitar a atualização dos gráficos.
 */

const UI = {
  currentPage: "dashboard",
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),

  pages: {
    dashboard: {
      title: "Dashboard",
      description: "Visão geral da sua vida financeira."
    },

    receitas: {
      title: "Receitas",
      description: "Gerencie todas as suas entradas."
    },

    gastos: {
      title: "Gastos",
      description: "Acompanhe e controle suas despesas."
    },

    categorias: {
      title: "Categorias",
      description: "Organize receitas e gastos por categoria."
    },

    limites: {
      title: "Limites",
      description: "Defina limites diários, mensais e por categoria."
    },

    poker: {
      title: "Poker",
      description: "Controle buy-ins, retornos, resultados e ROI."
    },

    bets: {
      title: "Bets",
      description: "Acompanhe resultados pessoais e de palpiteiros."
    },

    relatorios: {
      title: "Relatórios",
      description: "Analise sua evolução financeira."
    },

    metas: {
      title: "Metas",
      description: "Crie e acompanhe objetivos financeiros."
    },

    configuracoes: {
      title: "Configurações",
      description: "Configure dados, preferências e backups."
    }
  },

  monthNames: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
  ],

  getRoot() {
    let root = document.getElementById("app");

    if (!root) {
      root = document.createElement("div");
      root.id = "app";
      document.body.appendChild(root);
    }

    return root;
  },

  formatCurrency(value) {
    return Utils.formatCurrency(
      Number(value) || 0
    );
  },

  formatPercentage(value) {
    return `${(Number(value) || 0).toFixed(2)}%`;
  },

  formatDate(date) {
    if (!date) {
      return "Sem data";
    }

    const [year, month, day] =
      String(date).split("-");

    if (!year || !month || !day) {
      return String(date);
    }

    return `${day}/${month}/${year}`;
  },

  getValueClass(value) {
    const number = Number(value) || 0;

    if (number > 0) {
      return "value-positive";
    }

    if (number < 0) {
      return "value-negative";
    }

    return "value-neutral";
  },

  escapeHTML(value) {
    const element =
      document.createElement("div");

    element.textContent =
      String(value ?? "");

    return element.innerHTML;
  },

  getMenuItems() {
    return [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "▦"
      },
      {
        id: "receitas",
        label: "Receitas",
        icon: "+"
      },
      {
        id: "gastos",
        label: "Gastos",
        icon: "−"
      },
      {
        id: "categorias",
        label: "Categorias",
        icon: "◫"
      },
      {
        id: "limites",
        label: "Limites",
        icon: "◷"
      },
      {
        id: "poker",
        label: "Poker",
        icon: "♠"
      },
      {
        id: "bets",
        label: "Bets",
        icon: "◎"
      },
      {
        id: "relatorios",
        label: "Relatórios",
        icon: "▥"
      },
      {
        id: "metas",
        label: "Metas",
        icon: "◇"
      },
      {
        id: "configuracoes",
        label: "Configurações",
        icon: "⚙"
      }
    ];
  },

  renderAppShell() {
    const root = this.getRoot();

    root.innerHTML = `
      <div class="app-layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <div class="brand-icon">CF</div>

            <div class="brand-text">
              <strong>Controle</strong>
              <span>Financeiro</span>
            </div>
          </div>

          <nav class="sidebar-nav">
            ${this.getMenuItems()
              .map(item => `
                <button
                  class="nav-item ${
                    item.id === this.currentPage
                      ? "active"
                      : ""
                  }"
                  type="button"
                  data-page="${item.id}"
                >
                  <span class="nav-icon">
                    ${item.icon}
                  </span>

                  <span class="nav-label">
                    ${item.label}
                  </span>
                </button>
              `)
              .join("")}
          </nav>

          <div class="sidebar-footer">
            <span>Dados salvos neste dispositivo</span>
          </div>
        </aside>

        <div class="app-main">
          <header class="topbar">
            <div class="topbar-left">
              <button
                type="button"
                class="mobile-menu-button"
                id="mobile-menu-button"
                aria-label="Abrir menu"
              >
                ☰
              </button>

              <div>
                <h1 id="page-title">
                  Dashboard
                </h1>

                <p id="page-description">
                  Visão geral da sua vida financeira.
                </p>
              </div>
            </div>

            <div class="topbar-actions">
              <select
                id="dashboard-month"
                class="period-select"
                aria-label="Selecionar mês"
              >
                ${this.monthNames
                  .map((monthName, index) => `
                    <option
                      value="${index}"
                      ${
                        index === this.currentMonth
                          ? "selected"
                          : ""
                      }
                    >
                      ${monthName}
                    </option>
                  `)
                  .join("")}
              </select>

              <select
                id="dashboard-year"
                class="period-select"
                aria-label="Selecionar ano"
              >
                ${this.renderYearOptions()}
              </select>
            </div>
          </header>

          <main
            class="page-content"
            id="page-content"
          ></main>
        </div>

        <div
          class="sidebar-overlay"
          id="sidebar-overlay"
        ></div>

        <div
          class="toast-container"
          id="toast-container"
        ></div>
      </div>
    `;

    this.bindShellEvents();
  },

  renderYearOptions() {
    const currentYear =
      new Date().getFullYear();

    const years = [];

    for (
      let year = currentYear - 5;
      year <= currentYear + 2;
      year += 1
    ) {
      years.push(year);
    }

    return years
      .map(year => `
        <option
          value="${year}"
          ${
            year === this.currentYear
              ? "selected"
              : ""
          }
        >
          ${year}
        </option>
      `)
      .join("");
  },

  bindShellEvents() {
    document
      .querySelectorAll("[data-page]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            this.navigate(
              button.dataset.page
            );
          }
        );
      });

    const monthSelect =
      document.getElementById(
        "dashboard-month"
      );

    const yearSelect =
      document.getElementById(
        "dashboard-year"
      );

    monthSelect?.addEventListener(
      "change",
      event => {
        this.currentMonth =
          Number(event.target.value);

        this.refreshCurrentPage();
      }
    );

    yearSelect?.addEventListener(
      "change",
      event => {
        this.currentYear =
          Number(event.target.value);

        this.refreshCurrentPage();
      }
    );

    const menuButton =
      document.getElementById(
        "mobile-menu-button"
      );

    const overlay =
      document.getElementById(
        "sidebar-overlay"
      );

    menuButton?.addEventListener(
      "click",
      () => {
        this.toggleSidebar();
      }
    );

    overlay?.addEventListener(
      "click",
      () => {
        this.closeSidebar();
      }
    );
  },

  toggleSidebar() {
    document
      .getElementById("sidebar")
      ?.classList.toggle("open");

    document
      .getElementById("sidebar-overlay")
      ?.classList.toggle("visible");
  },

  closeSidebar() {
    document
      .getElementById("sidebar")
      ?.classList.remove("open");

    document
      .getElementById("sidebar-overlay")
      ?.classList.remove("visible");
  },

  navigate(page) {
    if (!this.pages[page]) {
      page = "dashboard";
    }

    this.currentPage = page;

    document
      .querySelectorAll("[data-page]")
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.page === page
        );
      });

    const pageData =
      this.pages[page];

    const title =
      document.getElementById(
        "page-title"
      );

    const description =
      document.getElementById(
        "page-description"
      );

    if (title) {
      title.textContent =
        pageData.title;
    }

    if (description) {
      description.textContent =
        pageData.description;
    }

    const periodControls =
      document.querySelector(
        ".topbar-actions"
      );

    if (periodControls) {
      periodControls.hidden =
        page === "configuracoes";
    }

    this.closeSidebar();
    this.renderCurrentPage();
  },

  renderCurrentPage() {
    switch (this.currentPage) {
      case "dashboard":
        this.renderDashboard();
        break;

      case "receitas":
        this.renderPlaceholderPage(
          "Receitas",
          "O formulário e a tabela de receitas serão adicionados na próxima etapa."
        );
        break;

      case "gastos":
        this.renderPlaceholderPage(
          "Gastos",
          "O formulário e a tabela de gastos serão adicionados na próxima etapa."
        );
        break;

      case "categorias":
        this.renderPlaceholderPage(
          "Categorias",
          "O gerenciamento de categorias será conectado nesta área."
        );
        break;

      case "limites":
        this.renderPlaceholderPage(
          "Limites",
          "Os limites diários, mensais e por categoria serão exibidos aqui."
        );
        break;

      case "poker":
        this.renderPokerPage();
        break;

      case "bets":
        this.renderBetsPage();
        break;

      case "relatorios":
        this.renderPlaceholderPage(
          "Relatórios",
          "Os relatórios detalhados serão montados com os dados dos módulos."
        );
        break;

      case "metas":
        this.renderPlaceholderPage(
          "Metas",
          "O gerenciamento de metas financeiras será implementado aqui."
        );
        break;

      case "configuracoes":
        this.renderSettingsPage();
        break;

      default:
        this.renderDashboard();
    }
  },

  refreshCurrentPage() {
    this.renderCurrentPage();
  },

  getPageContent() {
    return document.getElementById(
      "page-content"
    );
  },

  renderDashboard() {
    const content =
      this.getPageContent();

    if (!content) {
      return;
    }

    const data =
      Dashboard.getData(
        this.currentMonth,
        this.currentYear
      );

    const summary =
      data.resumo || {};

    content.innerHTML = `
      <section class="dashboard-section">
        <div class="section-heading">
          <div>
            <h2>Resumo do mês</h2>
            <p>${this.escapeHTML(
              data.periodo?.descricao
            )}</p>
          </div>

          <button
            class="button button-secondary"
            type="button"
            id="refresh-dashboard"
          >
            Atualizar
          </button>
        </div>

        <div class="summary-grid">
          ${this.renderSummaryCard({
            title: "Receitas",
            value: summary.receitas,
            icon: "+",
            type: "positive"
          })}

          ${this.renderSummaryCard({
            title: "Gastos",
            value: summary.gastos,
            icon: "−",
            type: "negative",
            invertValueClass: true
          })}

          ${this.renderSummaryCard({
            title: "Saldo pessoal",
            value: summary.saldoPessoal,
            icon: "◈"
          })}

          ${this.renderSummaryCard({
            title: "Poker",
            value: summary.poker,
            icon: "♠"
          })}

          ${this.renderSummaryCard({
            title: "Bets",
            value: summary.bets,
            icon: "◎"
          })}

          ${this.renderSummaryCard({
            title: "Saldo combinado",
            value: summary.saldoCombinado,
            icon: "▦",
            featured: true
          })}
        </div>
      </section>

      ${this.renderAlerts(data.alertas)}

      <section class="dashboard-grid">
        <article class="panel chart-panel">
          <div class="panel-header">
            <div>
              <h3>Receitas e gastos</h3>
              <p>Comparação do período selecionado</p>
            </div>
          </div>

          <div class="chart-container">
            <canvas id="income-expenses-chart"></canvas>
          </div>
        </article>

        <article class="panel chart-panel">
          <div class="panel-header">
            <div>
              <h3>Resultados do mês</h3>
              <p>Saldo pessoal, Poker e Bets</p>
            </div>
          </div>

          <div class="chart-container">
            <canvas id="monthly-results-chart"></canvas>
          </div>
        </article>

        <article class="panel chart-panel">
          <div class="panel-header">
            <div>
              <h3>Gastos por categoria</h3>
              <p>Distribuição das despesas</p>
            </div>
          </div>

          <div class="chart-container">
            <canvas id="expenses-category-chart"></canvas>
          </div>
        </article>

        <article class="panel chart-panel">
          <div class="panel-header">
            <div>
              <h3>Comparação de ROI</h3>
              <p>Poker, Bets Pessoal e Palpiteiros</p>
            </div>
          </div>

          <div class="chart-container">
            <canvas id="roi-comparison-chart"></canvas>
          </div>
        </article>
      </section>

      <section class="panel recent-panel">
        <div class="panel-header">
          <div>
            <h3>Atividades recentes</h3>
            <p>Últimos registros adicionados</p>
          </div>
        </div>

        ${this.renderRecentActivities(
          data.atividadesRecentes
        )}
      </section>
    `;

    document
      .getElementById("refresh-dashboard")
      ?.addEventListener(
        "click",
        () => {
          this.renderDashboard();

          this.showToast(
            "Dashboard atualizado.",
            "success"
          );
        }
      );

    requestAnimationFrame(() => {
      Charts.refresh(data);
    });
  },

  renderSummaryCard({
    title,
    value,
    icon,
    type = null,
    featured = false,
    invertValueClass = false
  }) {
    let valueClass =
      this.getValueClass(value);

    if (invertValueClass) {
      valueClass =
        Number(value) > 0
          ? "value-negative"
          : "value-neutral";
    }

    return `
      <article class="
        summary-card
        ${featured ? "featured" : ""}
        ${type ? `summary-${type}` : ""}
      ">
        <div class="summary-card-top">
          <span class="summary-icon">
            ${icon}
          </span>

          <span class="summary-title">
            ${this.escapeHTML(title)}
          </span>
        </div>

        <strong class="summary-value ${valueClass}">
          ${this.formatCurrency(value)}
        </strong>
      </article>
    `;
  },

  renderAlerts(alerts) {
    const alertList =
      Array.isArray(alerts)
        ? alerts
        : [];

    if (!alertList.length) {
      return "";
    }

    return `
      <section class="alerts-container">
        ${alertList
          .map(alert => `
            <article class="
              alert
              alert-${alert.type || "info"}
            ">
              <div>
                <strong>
                  ${this.escapeHTML(
                    alert.title
                  )}
                </strong>

                <p>
                  ${this.escapeHTML(
                    alert.message
                  )}
                </p>
              </div>
            </article>
          `)
          .join("")}
      </section>
    `;
  },

  renderRecentActivities(activities) {
    const activityList =
      Array.isArray(activities)
        ? activities
        : [];

    if (!activityList.length) {
      return this.renderEmptyState(
        "Nenhuma atividade encontrada",
        "Cadastre receitas, gastos, sessões de Poker ou resultados de Bets."
      );
    }

    return `
      <div class="activity-list">
        ${activityList
          .map(activity => `
            <article class="activity-item">
              <div class="
                activity-icon
                activity-${activity.type}
              ">
                ${this.getActivityIcon(
                  activity.type
                )}
              </div>

              <div class="activity-info">
                <strong>
                  ${this.escapeHTML(
                    activity.title
                  )}
                </strong>

                <span>
                  ${this.formatDate(
                    activity.date
                  )}
                </span>
              </div>

              <strong class="
                activity-value
                ${this.getValueClass(
                  activity.result
                )}
              ">
                ${this.formatCurrency(
                  activity.result
                )}
              </strong>
            </article>
          `)
          .join("")}
      </div>
    `;
  },

  getActivityIcon(type) {
    const icons = {
      receita: "+",
      gasto: "−",
      poker: "♠",
      "bets-pessoal": "◎",
      "bets-palpiteiros": "◉"
    };

    return icons[type] || "•";
  },

  renderPokerPage() {
    const content =
      this.getPageContent();

    if (!content) {
      return;
    }

    const data =
      Poker.getDashboardData(
        this.currentMonth,
        this.currentYear
      );

    const monthly =
      data.relatorioMensal || {};

    const general =
      data.relatorioGeral || {};

    content.innerHTML = `
      <section class="section-heading">
        <div>
          <h2>Resumo do Poker</h2>
          <p>
            Controle de sessões, buy-ins,
            retornos e resultados.
          </p>
        </div>
      </section>

      <div class="summary-grid">
        ${this.renderSummaryCard({
          title: "Resultado mensal",
          value: monthly.resultado,
          icon: "♠"
        })}

        ${this.renderSummaryCard({
          title: "Resultado geral",
          value: general.resultado,
          icon: "▦"
        })}

        ${this.renderSummaryCard({
          title: "Total de buy-ins",
          value: monthly.totalBuyIns,
          icon: "−",
          invertValueClass: true
        })}

        ${this.renderSummaryCard({
          title: "Total retornado",
          value: monthly.totalRetornado,
          icon: "+"
        })}

        ${this.renderSummaryCard({
          title: "Banca atual",
          value: data.bancaAtual,
          icon: "◈"
        })}

        <article class="summary-card">
          <div class="summary-card-top">
            <span class="summary-icon">%</span>
            <span class="summary-title">ROI mensal</span>
          </div>

          <strong class="
            summary-value
            ${this.getValueClass(
              monthly.roi
            )}
          ">
            ${this.formatPercentage(
              monthly.roi
            )}
          </strong>
        </article>
      </div>

      <section class="dashboard-grid">
        ${this.renderChartPanel(
          "Resultado diário",
          "Resultado de cada dia do período",
          "poker-daily-chart"
        )}

        ${this.renderChartPanel(
          "Evolução acumulada",
          "Lucro ou prejuízo acumulado",
          "poker-accumulated-chart"
        )}

        ${this.renderChartPanel(
          "Resultado mensal",
          "Comparação da evolução por mês",
          "poker-monthly-chart"
        )}
      </section>
    `;

    requestAnimationFrame(() => {
      Charts.renderPokerDaily(
        "poker-daily-chart",
        data.resultadosDiarios
      );

      Charts.renderPokerAccumulated(
        "poker-accumulated-chart",
        Poker.getAccumulatedEvolution(
          this.currentMonth,
          this.currentYear
        )
      );

      Charts.renderPokerMonthly(
        "poker-monthly-chart",
        data.evolucaoMensal
      );
    });
  },

  renderBetsPage() {
    const content =
      this.getPageContent();

    if (!content) {
      return;
    }

    const data =
      Bets.getDashboardData(
        this.currentMonth,
        this.currentYear
      );

    const monthly =
      data.mensal || {};

    content.innerHTML = `
      <section class="section-heading">
        <div>
          <h2>Resumo das Bets</h2>
          <p>
            Resultados separados entre
            Pessoal e Palpiteiros.
          </p>
        </div>
      </section>

      <div class="summary-grid">
        ${this.renderSummaryCard({
          title: "Resultado total",
          value: monthly.total?.resultado,
          icon: "◎"
        })}

        ${this.renderSummaryCard({
          title: "Bets Pessoal",
          value: monthly.pessoal?.resultado,
          icon: "◉"
        })}

        ${this.renderSummaryCard({
          title: "Palpiteiros",
          value: monthly.palpiteiros?.resultado,
          icon: "◌"
        })}

        ${this.renderSummaryCard({
          title: "Banca atual",
          value: data.bancaAtual,
          icon: "◈"
        })}

        <article class="summary-card">
          <div class="summary-card-top">
            <span class="summary-icon">%</span>
            <span class="summary-title">ROI Pessoal</span>
          </div>

          <strong class="
            summary-value
            ${this.getValueClass(
              monthly.pessoal?.roi
            )}
          ">
            ${this.formatPercentage(
              monthly.pessoal?.roi
            )}
          </strong>
        </article>

        <article class="summary-card">
          <div class="summary-card-top">
            <span class="summary-icon">%</span>
            <span class="summary-title">ROI Palpiteiros</span>
          </div>

          <strong class="
            summary-value
            ${this.getValueClass(
              monthly.palpiteiros?.roi
            )}
          ">
            ${this.formatPercentage(
              monthly.palpiteiros?.roi
            )}
          </strong>
        </article>
      </div>

      <section class="dashboard-grid">
        ${this.renderChartPanel(
          "Resultados diários",
          "Pessoal e Palpiteiros",
          "bets-daily-chart"
        )}

        ${this.renderChartPanel(
          "Evolução acumulada",
          "Comparação dos resultados acumulados",
          "bets-accumulated-chart"
        )}

        ${this.renderChartPanel(
          "Resultados mensais",
          "Comparação mensal por categoria",
          "bets-monthly-chart"
        )}
      </section>
    `;

    requestAnimationFrame(() => {
      Charts.renderBetsDaily(
        "bets-daily-chart",
        data.evolucaoDiaria?.pessoal,
        data.evolucaoDiaria?.palpiteiros
      );

      Charts.renderBetsAccumulated(
        "bets-accumulated-chart",
        data.evolucaoDiaria?.total,
        data.evolucaoDiaria?.pessoal,
        data.evolucaoDiaria?.palpiteiros
      );

      Charts.renderBetsMonthly(
        "bets-monthly-chart",
        data.evolucaoMensal?.pessoal,
        data.evolucaoMensal?.palpiteiros
      );
    });
  },

  renderChartPanel(
    title,
    description,
    canvasId
  ) {
    return `
      <article class="panel chart-panel">
        <div class="panel-header">
          <div>
            <h3>
              ${this.escapeHTML(title)}
            </h3>

            <p>
              ${this.escapeHTML(description)}
            </p>
          </div>
        </div>

        <div class="chart-container">
          <canvas id="${canvasId}"></canvas>
        </div>
      </article>
    `;
  },

  renderPlaceholderPage(
    title,
    description
  ) {
    const content =
      this.getPageContent();

    if (!content) {
      return;
    }

    content.innerHTML = `
      <section class="panel placeholder-panel">
        <div class="placeholder-icon">
          ◫
        </div>

        <h2>
          ${this.escapeHTML(title)}
        </h2>

        <p>
          ${this.escapeHTML(description)}
        </p>
      </section>
    `;
  },

  renderSettingsPage() {
    const content =
      this.getPageContent();

    if (!content) {
      return;
    }

    content.innerHTML = `
      <section class="settings-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <h3>Exportar dados</h3>
              <p>
                Gere uma cópia de segurança dos seus dados.
              </p>
            </div>
          </div>

          <button
            type="button"
            class="button button-primary"
            id="export-data-button"
          >
            Exportar backup
          </button>
        </article>

        <article class="panel danger-panel">
          <div class="panel-header">
            <div>
              <h3>Redefinir aplicação</h3>
              <p>
                Exclui todos os dados salvos neste dispositivo.
              </p>
            </div>
          </div>

          <button
            type="button"
            class="button button-danger"
            id="reset-data-button"
          >
            Apagar todos os dados
          </button>
        </article>
      </section>
    `;

    document
      .getElementById(
        "export-data-button"
      )
      ?.addEventListener(
        "click",
        () => {
          this.exportData();
        }
      );

    document
      .getElementById(
        "reset-data-button"
      )
      ?.addEventListener(
        "click",
        () => {
          this.resetData();
        }
      );
  },

  exportData() {
    try {
      const exportedData =
        Storage.exportDatabase();

      const content =
        typeof exportedData === "string"
          ? exportedData
          : JSON.stringify(
              exportedData,
              null,
              2
            );

      const blob = new Blob(
        [content],
        {
          type: "application/json"
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        `controle-financeiro-${Utils.getToday()}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      this.showToast(
        "Backup exportado com sucesso.",
        "success"
      );
    } catch (error) {
      console.error(error);

      this.showToast(
        "Não foi possível exportar os dados.",
        "error"
      );
    }
  },

  resetData() {
    const confirmed =
      window.confirm(
        "Tem certeza que deseja apagar todos os dados? Esta ação não poderá ser desfeita."
      );

    if (!confirmed) {
      return;
    }

    try {
      Storage.resetDatabase();
      Storage.initialize();

      this.currentMonth =
        new Date().getMonth();

      this.currentYear =
        new Date().getFullYear();

      this.navigate("dashboard");

      this.showToast(
        "Todos os dados foram apagados.",
        "success"
      );
    } catch (error) {
      console.error(error);

      this.showToast(
        "Não foi possível apagar os dados.",
        "error"
      );
    }
  },

  renderEmptyState(
    title,
    description
  ) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          ◇
        </div>

        <strong>
          ${this.escapeHTML(title)}
        </strong>

        <p>
          ${this.escapeHTML(description)}
        </p>
      </div>
    `;
  },

  showToast(
    message,
    type = "info"
  ) {
    const container =
      document.getElementById(
        "toast-container"
      );

    if (!container) {
      return;
    }

    const toast =
      document.createElement("div");

    toast.className =
      `toast toast-${type}`;

    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("visible");
    });

    setTimeout(() => {
      toast.classList.remove("visible");

      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  },

  initialize() {
    this.renderAppShell();
    this.renderCurrentPage();

    return {
      success: true,
      currentPage: this.currentPage
    };
  }
};

window.UI = UI;