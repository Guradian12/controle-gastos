/**
 * Módulo responsável pelos gráficos do sistema.
 *
 * Dependência:
 * Chart.js
 *
 * Este módulo apenas renderiza informações.
 * Ele não altera receitas, gastos, Poker ou Bets.
 */

const Charts = {
  instances: {},

  /**
   * Verifica se o Chart.js foi carregado.
   */
  isAvailable() {
    return typeof Chart !== "undefined";
  },

  /**
   * Destrói um gráfico existente.
   *
   * Isso evita que dois gráficos sejam desenhados
   * no mesmo canvas.
   */
  destroy(chartId) {
    const chart = this.instances[chartId];

    if (chart) {
      chart.destroy();
      delete this.instances[chartId];
    }
  },

  /**
   * Destrói todos os gráficos.
   */
  destroyAll() {
    Object.keys(this.instances).forEach(
      chartId => {
        this.destroy(chartId);
      }
    );
  },

  /**
   * Busca um canvas pelo ID.
   */
  getCanvas(canvasId) {
    const canvas =
      document.getElementById(canvasId);

    if (!canvas) {
      console.warn(
        `Canvas não encontrado: ${canvasId}`
      );

      return null;
    }

    return canvas;
  },

  /**
   * Formata valores monetários.
   */
  formatCurrency(value) {
    return Utils.formatCurrency(
      Number(value) || 0
    );
  },

  /**
   * Formata uma data YYYY-MM-DD.
   */
  formatDate(date) {
    if (!date) {
      return "";
    }

    const [year, month, day] =
      String(date).split("-");

    if (!year || !month || !day) {
      return String(date);
    }

    return `${day}/${month}`;
  },

  /**
   * Formata um período YYYY-MM.
   */
  formatMonth(period) {
    if (!period) {
      return "";
    }

    const [year, month] =
      String(period).split("-");

    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez"
    ];

    const monthIndex =
      Number(month) - 1;

    return `${monthNames[monthIndex] || month}/${year}`;
  },

  /**
   * Retorna as opções padrão.
   */
  getDefaultOptions({
    currency = true,
    percentage = false,
    showLegend = true,
    beginAtZero = true
  } = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: "index"
      },

      plugins: {
        legend: {
          display: showLegend,
          position: "bottom",

          labels: {
            usePointStyle: true,
            padding: 18
          }
        },

        tooltip: {
          callbacks: {
            label: context => {
              const label =
                context.dataset.label
                  ? `${context.dataset.label}: `
                  : "";

              const value =
                Number(context.parsed.y ??
                context.parsed) || 0;

              if (percentage) {
                return `${label}${value.toFixed(2)}%`;
              }

              if (currency) {
                return `${label}${this.formatCurrency(value)}`;
              }

              return `${label}${value}`;
            }
          }
        }
      },

      scales: {
        x: {
          grid: {
            display: false
          }
        },

        y: {
          beginAtZero,

          ticks: {
            callback: value => {
              if (percentage) {
                return `${Number(value).toFixed(0)}%`;
              }

              if (currency) {
                return this.formatCurrency(value);
              }

              return value;
            }
          }
        }
      }
    };
  },

  /**
   * Cria um gráfico genérico.
   */
  createChart(
    canvasId,
    configuration
  ) {
    if (!this.isAvailable()) {
      console.error(
        "Chart.js não foi carregado."
      );

      return null;
    }

    const canvas =
      this.getCanvas(canvasId);

    if (!canvas) {
      return null;
    }

    this.destroy(canvasId);

    const context =
      canvas.getContext("2d");

    const chart =
      new Chart(
        context,
        configuration
      );

    this.instances[canvasId] =
      chart;

    return chart;
  },

  /**
   * Gráfico de receitas e gastos.
   */
  renderIncomeExpenses(
    canvasId,
    summary
  ) {
    const income =
      Number(summary?.receitas) || 0;

    const expenses =
      Number(summary?.gastos) || 0;

    return this.createChart(
      canvasId,
      {
        type: "bar",

        data: {
          labels: [
            "Receitas",
            "Gastos"
          ],

          datasets: [
            {
              label: "Valor",
              data: [
                income,
                expenses
              ],

              borderWidth: 1,
              borderRadius: 8
            }
          ]
        },

        options:
          this.getDefaultOptions({
            showLegend: false
          })
      }
    );
  },

  /**
   * Gráfico comparativo do saldo mensal.
   */
  renderMonthlyResults(
    canvasId,
    summary
  ) {
    const personalBalance =
      Number(
        summary?.saldoPessoal
      ) || 0;

    const pokerResult =
      Number(summary?.poker) || 0;

    const betsResult =
      Number(summary?.bets) || 0;

    return this.createChart(
      canvasId,
      {
        type: "bar",

        data: {
          labels: [
            "Saldo pessoal",
            "Poker",
            "Bets"
          ],

          datasets: [
            {
              label:
                "Resultado do mês",

              data: [
                personalBalance,
                pokerResult,
                betsResult
              ],

              borderWidth: 1,
              borderRadius: 8
            }
          ]
        },

        options:
          this.getDefaultOptions({
            showLegend: false,
            beginAtZero: false
          })
      }
    );
  },

  /**
   * Gráfico de gastos por categoria.
   *
   * O módulo aceita:
   *
   * [
   *   {
   *     categoriaNome: "Alimentação",
   *     total: 500
   *   }
   * ]
   */
  renderExpensesByCategory(
    canvasId,
    categories
  ) {
    const categoryList =
      Array.isArray(categories)
        ? categories
        : [];

    const labels =
      categoryList.map(item =>
        item.categoriaNome ??
        item.nome ??
        item.categoria ??
        "Sem categoria"
      );

    const values =
      categoryList.map(item =>
        Number(
          item.total ??
          item.valor ??
          item.gastos ??
          item.amount ??
          0
        )
      );

    return this.createChart(
      canvasId,
      {
        type: "doughnut",

        data: {
          labels,

          datasets: [
            {
              label: "Gastos",
              data: values,
              borderWidth: 2
            }
          ]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: true,
              position: "bottom",

              labels: {
                usePointStyle: true,
                padding: 18
              }
            },

            tooltip: {
              callbacks: {
                label: context => {
                  const value =
                    Number(context.parsed) || 0;

                  return `${context.label}: ${this.formatCurrency(
                    value
                  )}`;
                }
              }
            }
          }
        }
      }
    );
  },

  /**
   * Gráfico diário do Poker.
   */
  renderPokerDaily(
    canvasId,
    dailyResults
  ) {
    const results =
      Array.isArray(dailyResults)
        ? dailyResults
        : [];

    return this.createChart(
      canvasId,
      {
        type: "bar",

        data: {
          labels:
            results.map(item =>
              this.formatDate(
                item.data
              )
            ),

          datasets: [
            {
              label:
                "Resultado diário",

              data:
                results.map(item =>
                  Number(
                    item.resultado
                  ) || 0
                ),

              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },

        options:
          this.getDefaultOptions({
            showLegend: false,
            beginAtZero: false
          })
      }
    );
  },

  /**
   * Gráfico da evolução acumulada do Poker.
   */
  renderPokerAccumulated(
    canvasId,
    evolution
  ) {
    const evolutionList =
      Array.isArray(evolution)
        ? evolution
        : [];

    return this.createChart(
      canvasId,
      {
        type: "line",

        data: {
          labels:
            evolutionList.map(item =>
              this.formatDate(
                item.data
              )
            ),

          datasets: [
            {
              label:
                "Resultado acumulado",

              data:
                evolutionList.map(item =>
                  Number(
                    item.resultadoAcumulado
                  ) || 0
                ),

              tension: 0.3,
              fill: false,
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5
            }
          ]
        },

        options:
          this.getDefaultOptions({
            beginAtZero: false
          })
      }
    );
  },

  /**
   * Gráfico da evolução mensal do Poker.
   */
  renderPokerMonthly(
    canvasId,
    monthlyEvolution
  ) {
    const evolution =
      Array.isArray(monthlyEvolution)
        ? monthlyEvolution
        : [];

    return this.createChart(
      canvasId,
      {
        type: "bar",

        data: {
          labels:
            evolution.map(item =>
              this.formatMonth(
                item.periodo
              )
            ),

          datasets: [
            {
              label:
                "Resultado mensal",

              data:
                evolution.map(item =>
                  Number(
                    item.resultado
                  ) || 0
                ),

              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },

        options:
          this.getDefaultOptions({
            beginAtZero: false
          })
      }
    );
  },

  /**
   * Gráfico diário das Bets.
   *
   * Compara:
   * - Pessoal
   * - Palpiteiros
   */
  renderBetsDaily(
    canvasId,
    personalResults,
    tipsterResults
  ) {
    const personal =
      Array.isArray(personalResults)
        ? personalResults
        : [];

    const tipsters =
      Array.isArray(tipsterResults)
        ? tipsterResults
        : [];

    const dates =
      Array.from(
        new Set([
          ...personal.map(
            item => item.data
          ),

          ...tipsters.map(
            item => item.data
          )
        ])
      ).sort();

    const personalMap =
      Object.fromEntries(
        personal.map(item => [
          item.data,
          Number(item.resultado) || 0
        ])
      );

    const tipsterMap =
      Object.fromEntries(
        tipsters.map(item => [
          item.data,
          Number(item.resultado) || 0
        ])
      );

    return this.createChart(
      canvasId,
      {
        type: "bar",

        data: {
          labels:
            dates.map(date =>
              this.formatDate(date)
            ),

          datasets: [
            {
              label: "Pessoal",

              data:
                dates.map(date =>
                  personalMap[date] || 0
                ),

              borderWidth: 1,
              borderRadius: 6
            },

            {
              label: "Palpiteiros",

              data:
                dates.map(date =>
                  tipsterMap[date] || 0
                ),

              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },

        options:
          this.getDefaultOptions({
            beginAtZero: false
          })
      }
    );
  },

  /**
   * Gráfico da evolução acumulada das Bets.
   */
  renderBetsAccumulated(
    canvasId,
    totalEvolution,
    personalEvolution,
    tipsterEvolution
  ) {
    const total =
      Array.isArray(totalEvolution)
        ? totalEvolution
        : [];

    const personal =
      Array.isArray(personalEvolution)
        ? personalEvolution
        : [];

    const tipsters =
      Array.isArray(tipsterEvolution)
        ? tipsterEvolution
        : [];

    const dates =
      Array.from(
        new Set([
          ...total.map(
            item => item.data
          ),

          ...personal.map(
            item => item.data
          ),

          ...tipsters.map(
            item => item.data
          )
        ])
      ).sort();

    const createMap = list =>
      Object.fromEntries(
        list.map(item => [
          item.data,

          Number(
            item.resultadoAcumulado
          ) || 0
        ])
      );

    const totalMap =
      createMap(total);

    const personalMap =
      createMap(personal);

    const tipsterMap =
      createMap(tipsters);

    return this.createChart(
      canvasId,
      {
        type: "line",

        data: {
          labels:
            dates.map(date =>
              this.formatDate(date)
            ),

          datasets: [
            {
              label: "Total",

              data:
                dates.map(date =>
                  totalMap[date] || 0
                ),

              tension: 0.3,
              fill: false,
              borderWidth: 2
            },

            {
              label: "Pessoal",

              data:
                dates.map(date =>
                  personalMap[date] || 0
                ),

              tension: 0.3,
              fill: false,
              borderWidth: 2
            },

            {
              label: "Palpiteiros",

              data:
                dates.map(date =>
                  tipsterMap[date] || 0
                ),

              tension: 0.3,
              fill: false,
              borderWidth: 2
            }
          ]
        },

        options:
          this.getDefaultOptions({
            beginAtZero: false
          })
      }
    );
  },

  /**
   * Gráfico mensal das Bets.
   */
  renderBetsMonthly(
    canvasId,
    personalEvolution,
    tipsterEvolution
  ) {
    const personal =
      Array.isArray(personalEvolution)
        ? personalEvolution
        : [];

    const tipsters =
      Array.isArray(tipsterEvolution)
        ? tipsterEvolution
        : [];

    const periods =
      Array.from(
        new Set([
          ...personal.map(
            item => item.periodo
          ),

          ...tipsters.map(
            item => item.periodo
          )
        ])
      ).sort();

    const personalMap =
      Object.fromEntries(
        personal.map(item => [
          item.periodo,
          Number(item.resultado) || 0
        ])
      );

    const tipsterMap =
      Object.fromEntries(
        tipsters.map(item => [
          item.periodo,
          Number(item.resultado) || 0
        ])
      );

    return this.createChart(
      canvasId,
      {
        type: "bar",

        data: {
          labels:
            periods.map(period =>
              this.formatMonth(period)
            ),

          datasets: [
            {
              label: "Pessoal",

              data:
                periods.map(period =>
                  personalMap[period] || 0
                ),

              borderWidth: 1,
              borderRadius: 6
            },

            {
              label: "Palpiteiros",

              data:
                periods.map(period =>
                  tipsterMap[period] || 0
                ),

              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },

        options:
          this.getDefaultOptions({
            beginAtZero: false
          })
      }
    );
  },

  /**
   * Gráfico de ROI de Poker e Bets.
   */
  renderROIComparison(
    canvasId,
    dashboardData
  ) {
    const pokerROI =
      Number(
        dashboardData?.poker
          ?.mensal?.roi
      ) || 0;

    const betsPersonalROI =
      Number(
        dashboardData?.bets
          ?.mensal
          ?.pessoal
          ?.roi
      ) || 0;

    const betsTipstersROI =
      Number(
        dashboardData?.bets
          ?.mensal
          ?.palpiteiros
          ?.roi
      ) || 0;

    return this.createChart(
      canvasId,
      {
        type: "bar",

        data: {
          labels: [
            "Poker",
            "Bets Pessoal",
            "Palpiteiros"
          ],

          datasets: [
            {
              label: "ROI",

              data: [
                pokerROI,
                betsPersonalROI,
                betsTipstersROI
              ],

              borderWidth: 1,
              borderRadius: 8
            }
          ]
        },

        options:
          this.getDefaultOptions({
            currency: false,
            percentage: true,
            showLegend: false,
            beginAtZero: false
          })
      }
    );
  },

  /**
   * Renderiza os principais gráficos do Dashboard.
   *
   * Os canvas inexistentes são ignorados.
   */
  renderDashboard(
    dashboardData = null
  ) {
    const data =
      dashboardData ||
      Dashboard.getCurrentMonthData();

    const summary =
      data.resumo || {};

    const chartData =
      data.graficos || {};

    this.renderIncomeExpenses(
      "income-expenses-chart",
      summary
    );

    this.renderMonthlyResults(
      "monthly-results-chart",
      summary
    );

    this.renderExpensesByCategory(
      "expenses-category-chart",
      chartData.gastosPorCategoria
    );

    this.renderPokerDaily(
      "poker-daily-chart",
      chartData.pokerDiario
    );

    this.renderPokerAccumulated(
      "poker-accumulated-chart",
      chartData.pokerAcumulado
    );

    this.renderPokerMonthly(
      "poker-monthly-chart",
      chartData.pokerMensal
    );

    this.renderBetsDaily(
      "bets-daily-chart",
      chartData.betsDiario?.pessoal,
      chartData.betsDiario?.palpiteiros
    );

    this.renderBetsAccumulated(
      "bets-accumulated-chart",
      chartData.betsDiario?.total,
      chartData.betsDiario?.pessoal,
      chartData.betsDiario?.palpiteiros
    );

    this.renderBetsMonthly(
      "bets-monthly-chart",
      chartData.betsMensal?.pessoal,
      chartData.betsMensal?.palpiteiros
    );

    this.renderROIComparison(
      "roi-comparison-chart",
      data
    );

    return this.instances;
  },

  /**
   * Atualiza os gráficos.
   */
  refresh(dashboardData = null) {
    this.destroyAll();

    return this.renderDashboard(
      dashboardData
    );
  },

  /**
   * Inicializa o módulo.
   */
  initialize() {
    if (!this.isAvailable()) {
      console.warn(
        "Charts não inicializado porque o Chart.js não está disponível."
      );

      return {
        success: false,
        error:
          "Chart.js não foi carregado."
      };
    }

    return {
      success: true,
      message:
        "Módulo de gráficos inicializado."
    };
  }
};

window.Charts = Charts;